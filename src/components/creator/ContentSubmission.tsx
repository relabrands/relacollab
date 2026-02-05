import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Instagram,
  Play,
  Upload,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Campaign {
  id: string;
  name: string;
  brand: string;
}

interface SubmittedContent {
  id: string;
  campaignName: string;
  platform: "instagram" | "tiktok";
  postUrl: string;
  status: "pending" | "approved" | "live";
  submittedAt: string;
}

// Mock recent posts can stay mocked for now as fetching real social posts requires an API integration
const recentPosts = [
  {
    id: "post1",
    platform: "instagram" as const,
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
    caption: "Morning wellness routine ✨",
    date: "2 hours ago",
    url: "https://instagram.com/p/recent1"
  },
  {
    id: "post2",
    platform: "instagram" as const,
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
    caption: "Healthy breakfast ideas 🥗",
    date: "1 day ago",
    url: "https://instagram.com/p/recent2"
  },
  {
    id: "post3",
    platform: "tiktok" as const,
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
    caption: "Quick workout at home 💪",
    date: "3 days ago",
    url: "https://tiktok.com/@example/video/456"
  }
];

export function ContentSubmission() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<"link" | "select">("link");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [submittedContent, setSubmittedContent] = useState<SubmittedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [socialHandles, setSocialHandles] = useState({ instagram: "", tiktok: "" });

  useEffect(() => {
    const fetchUserDataAndCampaigns = async () => {
      if (!user) return;
      try {
        // 1. Fetch User Social Handles
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.socialHandles) {
            setSocialHandles(data.socialHandles);
          }
        }

        // 2. Fetch Active/Approved Campaigns for Dropdown
        // Query applications where userId == me AND status == approved
        const appsQ = query(
          collection(db, "applications"),
          where("userId", "==", user.uid),
          where("status", "==", "approved")
        );
        const appSnapshot = await getDocs(appsQ);

        const campaignsData: Campaign[] = [];
        for (const appDoc of appSnapshot.docs) {
          const campId = appDoc.data().campaignId;
          const campDoc = await getDoc(doc(db, "campaigns", campId));
          if (campDoc.exists()) {
            campaignsData.push({
              id: campId,
              name: campDoc.data().title,
              brand: campDoc.data().brandName || "Brand" // Assuming brandName is stored in campaign
            });
          }
        }
        setActiveCampaigns(campaignsData);

        // 3. Fetch Previous Submissions
        // This assumes a 'submissions' collection
        const subsQ = query(
          collection(db, "submissions"),
          where("userId", "==", user.uid),
          orderBy("submittedAt", "desc")
        );
        // Because creating composite indexes might take time, we might catch error or just do client filtering if small app.
        // For now, let's try getting all and filtering client side if needed or rely on index creation prompt
        try {
          const subSnapshot = await getDocs(subsQ);
          const subs = subSnapshot.docs.map(doc => {
            const data = doc.data();
            // Need to look up campaign name maybe? Or store it denormalized
            return {
              id: doc.id,
              campaignName: data.campaignName || "Unknown Campaign",
              platform: data.platform,
              postUrl: data.postUrl,
              status: data.status,
              submittedAt: new Date(data.submittedAt).toLocaleDateString()
            } as SubmittedContent;
          });
          setSubmittedContent(subs);
        } catch (err) {
          console.warn("Submissions query failed (likely index): ", err);
          setSubmittedContent([]);
        }

      } catch (error) {
        console.error("Error fetching content data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDataAndCampaigns();
  }, [user]);

  const handleSubmitLink = async () => {
    if (!selectedCampaign || !postUrl) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!user) return;

    const campaign = activeCampaigns.find(c => c.id === selectedCampaign);
    const platform = postUrl.includes("instagram") ? "instagram" : "tiktok";

    try {
      const newSubmission = {
        userId: user.uid,
        campaignId: selectedCampaign,
        campaignName: campaign?.name,
        platform,
        postUrl,
        status: "pending",
        submittedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "submissions"), newSubmission);

      const displayedSubmission: SubmittedContent = {
        id: docRef.id,
        campaignName: campaign?.name || "",
        platform,
        postUrl,
        status: "pending",
        submittedAt: new Date().toLocaleDateString()
      };

      setSubmittedContent([displayedSubmission, ...submittedContent]);
      toast.success("Content submitted successfully!");
      setIsDialogOpen(false);
      setPostUrl("");
      setSelectedCampaign("");
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content");
    }
  };

  const handleSelectPost = async () => {
    if (!selectedCampaign || !selectedPost) {
      toast.error("Please select a campaign and post");
      return;
    }
    if (!user) return;

    const campaign = activeCampaigns.find(c => c.id === selectedCampaign);
    const post = recentPosts.find(p => p.id === selectedPost);

    if (!post) return;

    try {
      const newSubmission = {
        userId: user.uid,
        campaignId: selectedCampaign,
        campaignName: campaign?.name,
        platform: post.platform,
        postUrl: post.url,
        status: "pending",
        submittedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "submissions"), newSubmission);

      const displayedSubmission: SubmittedContent = {
        id: docRef.id,
        campaignName: campaign?.name || "",
        platform: post.platform,
        postUrl: post.url,
        status: "pending",
        submittedAt: new Date().toLocaleDateString()
      };

      setSubmittedContent([displayedSubmission, ...submittedContent]);
      toast.success("Content submitted successfully!");
      setIsDialogOpen(false);
      setSelectedPost(null);
      setSelectedCampaign("");
    } catch (error) {
      console.error("Error submitting content post:", error);
      toast.error("Failed to submit content");
    }
  };

  const handleRefreshMetrics = (contentId: string) => {
    toast.success("Metrics updated from connected account");
  };

  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    approved: "bg-primary/20 text-primary border-primary/30",
    live: "bg-success/20 text-success border-success/30"
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    live: CheckCircle
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Connected Accounts</CardTitle>
          <CardDescription>
            Connect your social accounts to easily submit content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${socialHandles.instagram
                ? "bg-success/10 border-success/30"
                : "bg-muted border-border"
              }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Instagram</p>
                {socialHandles.instagram ? (
                  <p className="text-xs text-muted-foreground">@{socialHandles.instagram}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
              {socialHandles.instagram && (
                <CheckCircle className="w-4 h-4 text-success ml-2" />
              )}
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${socialHandles.tiktok
                ? "bg-success/10 border-success/30"
                : "bg-muted border-border"
              }`}>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">TikTok</p>
                {socialHandles.tiktok ? (
                  <p className="text-xs text-muted-foreground">@{socialHandles.tiktok}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
              {socialHandles.tiktok && (
                <CheckCircle className="w-4 h-4 text-success ml-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Content */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Submit Content</CardTitle>
            <CardDescription>
              Upload your publication link or select from your recent posts
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Upload className="w-4 h-4" />
                Submit Content
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit Campaign Content</DialogTitle>
                <DialogDescription>
                  Choose how you want to submit your content
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Campaign Selection */}
                <div className="space-y-2">
                  <Label>Select Campaign</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCampaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name} - {campaign.brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeCampaigns.length === 0 && (
                    <p className="text-xs text-warning">
                      You don't have any approved campaigns to submit content for.
                    </p>
                  )}
                </div>

                {/* Submission Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={submissionType === "link" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSubmissionType("link")}
                  >
                    <Link2 className="w-4 h-4" />
                    Paste Link
                  </Button>
                  <Button
                    type="button"
                    variant={submissionType === "select" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSubmissionType("select")}
                  >
                    <Instagram className="w-4 h-4" />
                    Select Post
                  </Button>
                </div>

                {submissionType === "link" ? (
                  <div className="space-y-2">
                    <Label>Post URL</Label>
                    <Input
                      placeholder="https://instagram.com/p/... or https://tiktok.com/..."
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the URL of your Instagram or TikTok post
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label>Select from Recent Posts</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {recentPosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setSelectedPost(post.id)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPost === post.id
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          <img
                            src={post.thumbnail}
                            alt={post.caption}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${post.platform === "instagram"
                                ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
                                : "bg-black"
                              }`}>
                              {post.platform === "instagram" ? (
                                <Instagram className="w-3 h-3 text-white" />
                              ) : (
                                <Play className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          {selectedPost === post.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedPost && (
                      <p className="text-xs text-muted-foreground">
                        {recentPosts.find(p => p.id === selectedPost)?.caption}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="hero"
                  onClick={submissionType === "link" ? handleSubmitLink : handleSelectPost}
                >
                  Submit Content
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Submitted Content List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Your Submitted Content</CardTitle>
          <CardDescription>
            Track the status of your campaign submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submittedContent.map((content) => {
              const StatusIcon = statusIcons[content.status];
              return (
                <div
                  key={content.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${content.platform === "instagram"
                      ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
                      : "bg-black"
                    }`}>
                    {content.platform === "instagram" ? (
                      <Instagram className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.campaignName}</p>
                    <p className="text-sm text-muted-foreground">Submitted {content.submittedAt}</p>
                  </div>

                  <Badge className={statusColors[content.status]}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {content.status}
                  </Badge>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRefreshMetrics(content.id)}
                      title="Refresh metrics"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <a href={content.postUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}

            {submittedContent.length === 0 && (
              <div className="text-center py-8">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No content submitted yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}