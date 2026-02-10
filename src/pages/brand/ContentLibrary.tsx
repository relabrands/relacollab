import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Video,
  ExternalLink,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Filter,
  Search,
  Calendar,
  Instagram,
  Play,
  Loader2,
  Check,
  X,
  RefreshCw,
  Bookmark,
  BarChart2
} from "lucide-react";
import { toast } from "sonner";
import { updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";

interface ContentItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  campaignName: string;
  type: "image" | "video" | "reel" | "story";
  platform: "instagram" | "tiktok";
  thumbnail: string;
  postUrl: string;
  status: "pending" | "approved" | "live" | "rejected";
  submittedAt: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    saved: number;
    interactions: number;
    updatedAt?: string;
  };
}

interface ContentCardProps {
  content: ContentItem;
  onStatusChange?: (id: string, status: "approved" | "rejected") => void;
  onRefreshMetrics?: (content: ContentItem) => void;
}

function ContentCard({ content, onStatusChange, onRefreshMetrics }: ContentCardProps) {
  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    approved: "bg-primary/20 text-primary border-primary/30",
    live: "bg-success/20 text-success border-success/30"
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const [imgError, setImgError] = useState(false);

  return (
    <Card className="glass-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {!imgError ? (
          <img
            src={content.thumbnail}
            alt={content.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 bg-muted/50">
            {content.type === 'video' || content.type === 'reel' ? (
              <Video className="w-12 h-12 mb-2 opacity-50" />
            ) : (
              <Image className="w-12 h-12 mb-2 opacity-50" />
            )}
            <span className="text-xs text-center">Preview unavailable</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50">
            {content.type === "video" || content.type === "reel" ? (
              <Video className="w-3 h-3 mr-1" />
            ) : (
              <Image className="w-3 h-3 mr-1" />
            )}
            {content.type}
          </Badge>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${content.platform === "instagram"
            ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
            : "bg-black"
            }`}>
            {content.platform === "instagram" ? (
              <Instagram className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Play button for videos */}
        {(content.type === "video" || content.type === "reel") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {content.postUrl && (
            <Button size="sm" variant="glass" className="flex-1" asChild>
              <a href={content.postUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </a>
            </Button>
          )}

          <Button
            size="sm"
            variant="glass"
            onClick={(e) => {
              e.stopPropagation();
              onRefreshMetrics?.(content);
            }}
            title="Refresh Metrics (Get latest cover & stats)"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {content.status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-success/80 hover:bg-success text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(content.id, "approved");
                }}
                title="Approve Content"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-destructive/80 hover:bg-destructive text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(content.id, "rejected");
                }}
                title="Request Changes"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={content.creatorAvatar}
            alt={content.creatorName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{content.creatorName}</p>
            <p className="text-xs text-muted-foreground truncate">{content.campaignName}</p>
          </div>
          <Badge className={statusColors[content.status]}>
            {content.status === "rejected" ? "changes requested" : content.status}
          </Badge>
        </div>

        {/* Metrics */}
        {content.metrics && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
            {/* Row 1 */}
            <div className="text-center group-hover:scale-105 transition-transform" title="Views">
              <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.views)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Reach">
              <BarChart2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.reach)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Saved">
              <Bookmark className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.saved)}</p>
            </div>

            {/* Row 2 */}
            <div className="text-center group-hover:scale-105 transition-transform" title="Likes">
              <Heart className={`w-4 h-4 mx-auto mb-1 ${content.metrics.likes > 0 ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium">{formatNumber(content.metrics.likes)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Comments">
              <MessageCircle className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.comments)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Shares">
              <Share2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.shares)}</p>
            </div>
          </div>
        )}

        {/* Submitted Date */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {content.submittedAt}
          </div>
          {content.metrics?.updatedAt && (
            <span className="text-[10px] opacity-70">
              Updated {new Date(content.metrics.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContentLibrary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;
      try {
        // 1. Get Brand's Campaigns
        const campaignsQuery = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaignIds = campaignsSnapshot.docs.map(d => d.id);
        const campaignMap = new Map(campaignsSnapshot.docs.map(d => [d.id, d.data().name || "Untitled"]));

        if (campaignIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Get Submissions for these campaigns
        const submissionsPromises = campaignIds.map(id =>
          getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
        );
        const snapshots = await Promise.all(submissionsPromises);
        let allSubmissions: any[] = [];
        snapshots.forEach(snap => {
          allSubmissions = [...allSubmissions, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        });

        // 3. Enrich with Creator Data
        const enrichedContent = await Promise.all(
          allSubmissions.map(async (sub) => {
            let creatorData: any = {};
            try {
              // Ensure we have correct creatorId field (userId or creatorId)
              const creatorId = sub.creatorId || sub.userId;
              if (creatorId) {
                const creatorDoc = await getDoc(doc(db, "users", creatorId));
                if (creatorDoc.exists()) {
                  creatorData = creatorDoc.data();
                }
              }
            } catch (e) {
              console.error("Error fetching creator:", e);
            }

            return {
              id: sub.id,
              creatorId: sub.creatorId || sub.userId,
              creatorName: creatorData.displayName || "Unknown Creator",
              creatorAvatar: creatorData.photoURL || creatorData.avatar || "https://via.placeholder.com/150",
              campaignName: campaignMap.get(sub.campaignId) || sub.campaignName || "Unknown Campaign",
              // Determine type from mediaType or fallback
              type: (sub.mediaType === "VIDEO" || sub.mediaType === "REELS") ? "reel" : "image",
              platform: sub.platform || "instagram",
              // Use thumbnailUrl or mediaUrl (for images)
              thumbnail: sub.thumbnailUrl || sub.mediaUrl || "https://via.placeholder.com/400x500",
              postUrl: sub.contentUrl || sub.postUrl, // Handle both potential field names
              status: sub.status || "pending",
              submittedAt: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              metrics: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                reach: 0,
                saved: 0,
                interactions: 0,
                ...(sub.metrics || {})
              }
            } as ContentItem;
          })
        );

        setContentList(enrichedContent);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [user]);

  const filteredContent = contentList.filter(content => {
    const matchesSearch =
      content.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.campaignName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && content.status === activeTab;
  });

  const stats = {
    total: contentList.length,
    live: contentList.filter(c => c.status === "live").length,
    approved: contentList.filter(c => c.status === "approved").length,
    pending: contentList.filter(c => c.status === "pending").length,
    totalViews: contentList.reduce((acc, c) => acc + (c.metrics?.views || 0), 0),
    totalEngagement: contentList.reduce((acc, c) =>
      acc + (c.metrics?.likes || 0) + (c.metrics?.comments || 0) + (c.metrics?.shares || 0), 0
    )
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Handler for status updates
  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "content_submissions", id), {
        status: newStatus,
        reviewedAt: new Date().toISOString()
      });

      setContentList(prev => prev.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      ));

      toast.success(newStatus === "approved" ? "Content approved!" : "Changes requested");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Handler for metrics refresh
  const handleRefreshMetrics = async (content: ContentItem) => {
    if (!content.postUrl) return;

    // Extract post ID
    const match = content.postUrl.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
    const postId = match ? match[2] : null;

    if (!postId || !content.creatorId) { // Need creatorId to fetch metrics (we need their token)
      // Wait we need creatorId in content item, let's check if we have it. Yes we enriched it.
      // But wait, in ContentLibrary we enriched creatorName but maybe didn't save creatorId?
      // Ah, in enrichment map we use sub.userId.
      // Let's check enrichment logic.
      toast.error("Cannot refresh: missing post information");
      return;
    }

    const toastId = toast.loading("Refreshing metrics...");

    try {
      const response = await fetch("https://us-central1-rella-collab.cloudfunctions.net/getPostMetrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: content.creatorId, postId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.metrics) {
          // Update in Firestore
          await updateDoc(doc(db, "submissions", content.id), {
            likes: data.metrics.likes,
            comments: data.metrics.comments,
            views: data.metrics.views || 0,
            reach: data.metrics.reach || 0,
            saved: data.metrics.saved || 0,
            shares: data.metrics.shares || 0,
            interactions: data.metrics.interactions || 0,
            type: data.metrics.type,
            thumbnail: data.metrics.thumbnail,
            metricsLastFetched: new Date().toISOString()
          });

          // Update local state
          setContentList(prev => prev.map(item => {
            if (item.id === content.id) {
              return {
                ...item,
                metrics: {
                  ...item.metrics!,
                  likes: data.metrics.likes,
                  comments: data.metrics.comments,
                  views: data.metrics.views || 0,
                  reach: data.metrics.reach || 0,
                  saved: data.metrics.saved || 0,
                  shares: data.metrics.shares || 0,
                  interactions: data.metrics.interactions || 0,
                  updatedAt: new Date().toISOString()
                }
              };
            }
            return item;
          }));
          toast.success("Metrics updated!", { id: toastId });
        } else {
          toast.error("Failed to get metrics", { id: toastId });
        }
      } else {
        // Try to get error message from response
        let errorMessage = "Server error";
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || "Server error";
        } catch (e) { }
        toast.error(`Error: ${errorMessage}`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error handling refresh", { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title="Content Library"
          subtitle="All creator content from your campaigns"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Content</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Live Posts</p>
              <p className="text-2xl font-bold text-success">{stats.live}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Engagement</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalEngagement)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by creator or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="live">Live ({stats.live})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onStatusChange={handleStatusChange}
              onRefreshMetrics={handleRefreshMetrics}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground">
              {contentList.length === 0 ? "You haven't received any content submissions yet." : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}