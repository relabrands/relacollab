import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, FileImage, Heart, MessageCircle, BarChart2, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CampaignDetailsDialogProps {
    campaign: any;
    isOpen: boolean;
    onClose: () => void;
}

export function CampaignDetailsDialog({ campaign, isOpen, onClose }: CampaignDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        engagementRate: 0
    });

    useEffect(() => {
        if (campaign?.id && isOpen) {
            fetchCampaignData();
        }
    }, [campaign, isOpen]);

    const fetchCampaignData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Approved Applications (Collaborators)
            const appsQuery = query(
                collection(db, "applications"),
                where("campaignId", "==", campaign.id),
                where("status", "==", "approved")
            );
            const appsSnapshot = await getDocs(appsQuery);
            const collaboratorsData = await Promise.all(appsSnapshot.docs.map(async (docSnap) => {
                const appData = docSnap.data();
                // Fetch Creator Details
                let creatorData: any = { name: "Unknown Creator", avatar: "" };
                try {
                    const userDoc = await getDoc(doc(db, "users", appData.creatorId));
                    if (userDoc.exists()) {
                        creatorData = userDoc.data();
                    }
                } catch (e) {
                    console.error("Error fetching creator", e);
                }

                return {
                    id: docSnap.id,
                    ...appData,
                    creatorName: creatorData.displayName || creatorData.name || "Unknown",
                    creatorAvatar: creatorData.photoURL || creatorData.avatar,
                    creatorHandle: creatorData.instagramUsername
                };
            }));
            setCollaborators(collaboratorsData);

            // 2. Fetch Submissions
            const subsQuery = query(
                collection(db, "submissions"),
                where("campaignId", "==", campaign.id)
            );
            const subsSnapshot = await getDocs(subsQuery);
            const submissionsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(submissionsData);

            // 3. Calculate Stats
            let likes = 0;
            let comments = 0;
            submissionsData.forEach((sub: any) => {
                likes += (sub.likes || 0);
                comments += (sub.comments || 0);
            });
            const totalPosts = submissionsData.length;
            const engagement = totalPosts > 0 ? (likes + comments) / totalPosts : 0; // Simplified avg engagement per post

            setStats({
                totalPosts,
                totalLikes: likes,
                totalComments: comments,
                engagementRate: engagement
            });

        } catch (error) {
            console.error("Error fetching campaign details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!campaign) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-0 border-b overflow-hidden rounded-t-lg">
                    {/* Cover Image */}
                    {campaign.coverImage && (
                        <div className="w-full h-32 bg-muted relative">
                            <img
                                src={campaign.coverImage}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                    )}

                    <div className="p-6 pb-4 pt-4 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {campaign.title}
                                    <Badge variant="outline" className="ml-2 capitalize">{campaign.status}</Badge>
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> {campaign.brandName}
                                    <span className="text-border mx-1">|</span>
                                    <Calendar className="w-3 h-3" /> Created: {campaign.createdAt}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary">{campaign.budget}</div>
                                <div className="text-xs text-muted-foreground">Budget/Reward</div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Overview & Metrics</TabsTrigger>
                                <TabsTrigger value="content">Content ({submissions.length})</TabsTrigger>
                                <TabsTrigger value="collaborators">Collaborators ({collaborators.length})</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {loading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="overview" className="mt-0 space-y-6">
                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <FileImage className="w-5 h-5 text-blue-500 mb-2" />
                                                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                                                    <div className="text-xs text-muted-foreground">Total Posts</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <Heart className="w-5 h-5 text-red-500 mb-2" />
                                                    <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">Total Likes</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <MessageCircle className="w-5 h-5 text-green-500 mb-2" />
                                                    <div className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">Total Comments</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <BarChart2 className="w-5 h-5 text-purple-500 mb-2" />
                                                    <div className="text-2xl font-bold">{Math.round(stats.engagementRate)}</div>
                                                    <div className="text-xs text-muted-foreground">Avg. Likes+Comments</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Separator />

                                        {/* Campaign Description (if available on object, else generic) */}
                                        <div>
                                            <h3 className="font-semibold mb-2">About Campaign</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {campaign.description || "No description available for this campaign."}
                                            </p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="content" className="mt-0">
                                        {submissions.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {submissions.map((sub: any) => {
                                                    // Try to find a valid image URL from various potential fields
                                                    const displayImage = sub.mediaUrl || sub.imageUrl || sub.coverUrl || sub.thumbnailUrl;

                                                    return (
                                                        <div key={sub.id} className="group relative aspect-[4/5] rounded-xl overflow-hidden border bg-black/5">
                                                            {displayImage ? (
                                                                <img src={displayImage} alt="Submission" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                                                                    <FileImage className="w-8 h-8 text-muted-foreground/50 mb-2" />
                                                                    <span className="text-xs text-muted-foreground">No Preview</span>
                                                                </div>
                                                            )}

                                                            {/* Overlay Info */}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Heart className="w-3 h-3 fill-white" />
                                                                    <span className="text-xs font-bold">{sub.likes || 0}</span>
                                                                    <MessageCircle className="w-3 h-3 fill-white ml-2" />
                                                                    <span className="text-xs font-bold">{sub.comments || 0}</span>
                                                                </div>
                                                                {sub.postUrl && (
                                                                    <a href={sub.postUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] hover:underline text-white/80">
                                                                        View Post <ExternalLink className="w-2 h-2" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                                                <FileImage className="w-10 h-10 mb-3 opacity-20" />
                                                <p>No content submitted yet.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="collaborators" className="mt-0">
                                        {collaborators.length > 0 ? (
                                            <div className="space-y-4">
                                                {collaborators.map((collab: any) => (
                                                    <div key={collab.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={collab.creatorAvatar} />
                                                                <AvatarFallback>{collab.creatorName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{collab.creatorName}</div>
                                                                {collab.creatorHandle && <div className="text-xs text-muted-foreground">@{collab.creatorHandle}</div>}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-200">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                                                <Users className="w-10 h-10 mb-3 opacity-20" />
                                                <p>No active collaborators yet.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </ScrollArea>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}
