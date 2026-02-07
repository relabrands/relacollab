import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScore } from "@/components/dashboard/MatchScore";
import { Instagram, MapPin, Users, TrendingUp, Sparkles, Loader2, ExternalLink, Check } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface CreatorDetails {
    id: string;
    name: string;
    avatar: string;
    location: string;
    followers: string;
    engagement: string;
    matchScore: number;
    tags: string[];
    matchReason: string;
    bio: string;
    instagramUsername?: string;
    instagramMetrics?: {
        followers: number;
        engagementRate: number;
        avgLikes?: number;
        avgComments?: number;
        avgViews?: number;
    };
}

interface MatchDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    creator: CreatorDetails;
    campaign?: any;
    isApplicant?: boolean;
    onApprove?: () => void;
}

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    thumbnail: string;
    permalink: string;
    timestamp: string;
}

export function MatchDetailsDialog({ isOpen, onClose, creator, campaign, isApplicant, onApprove }: MatchDetailsDialogProps) {
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState("");

    useEffect(() => {
        if (isOpen && creator.id) {
            fetchCreatorPosts();
            generateAnalysis();
        }
    }, [isOpen, creator.id, campaign]);

    const generateAnalysis = () => {
        const vibes = campaign?.vibes?.join(", ") || "brand";
        const categories = creator.tags.join(", ");
        const er = creator.instagramMetrics?.engagementRate || 0;

        // 1. Fit Analysis
        let intro = `Based on a deep analysis of ${creator.name}'s profile, they are an excellent match for "${campaign?.name || "your campaign"}".`;

        if (campaign?.location && creator.location?.toLowerCase().includes(campaign.location.toLowerCase())) {
            intro += ` Their physical presence in ${creator.location} provides the geographic relevance needed for this activation.`;
        }

        // 2. Metrics Context
        let metricsAnalysis = "";
        const followers = creator.instagramMetrics?.followers || 0;

        if (er > 4) {
            metricsAnalysis = `With an engagement rate of ${er}%, their audience is highly responsive—significantly above the platform average.`;
        } else if (er > 2) {
            metricsAnalysis = `They maintain a healthy engagement rate of ${er}%, indicating a loyal community.`;
        } else {
            metricsAnalysis = `They have a scale of ${(followers / 1000).toFixed(1)}K followers, offering broad reach potential.`;
        }

        // 3. Vibe/Content Match
        let vibeCheck = "";
        if (campaign?.vibes && campaign.vibes.length > 0) {
            vibeCheck = `Their content style in ${categories} aligns seamlessly with your requested "${vibes}" aesthetic, ensuring the partnership feels authentic to their audience.`;
        } else {
            vibeCheck = `Their focus on ${categories} creates a natural context for your brand's messaging.`;
        }

        setAiAnalysis(`${intro} ${metricsAnalysis} ${vibeCheck}`);
    };

    const fetchCreatorPosts = async () => {
        setLoadingPosts(true);
        setError(null);
        try {
            const response = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia", {
                userId: creator.id
            });

            if (response.data.success) {
                setPosts(response.data.data.slice(0, 6));
            } else {
                console.error("Failed to load posts:", response.data.error);
                setError(response.data.error || "Failed to load posts");
            }
        } catch (error) {
            console.error("Error fetching creator posts:", error);
            setError("Could not load posts. Instagram token might be expired.");
        } finally {
            setLoadingPosts(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-16 h-16 rounded-2xl object-cover"
                        />
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {creator.name}
                                {creator.instagramUsername && (
                                    <a
                                        href={`https://instagram.com/${creator.instagramUsername}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                {creator.bio || "No bio available"}
                            </DialogDescription>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {creator.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Instagram className="w-4 h-4" />
                                    @{creator.instagramUsername || "unknown"}
                                </span>
                            </div>
                        </div>
                        <MatchScore score={creator.matchScore} size="lg" showLabel={false} />
                    </div>
                </DialogHeader>

                <div className="space-y-6 md:space-y-8 py-4">
                    {/* AI Insights & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Match Breakdown
                            </h3>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Location Fit</span>
                                        <span className="font-medium">{(creator as any).matchBreakdown?.location || 0}/30</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${((creator as any).matchBreakdown?.location || 0) / 30 * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Vibe & Niche</span>
                                        <span className="font-medium">{(creator as any).matchBreakdown?.vibe || 0}/40</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${((creator as any).matchBreakdown?.vibe || 0) / 40 * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Engagement</span>
                                        <span className="font-medium">{(creator as any).matchBreakdown?.engagement || 0}/20</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${((creator as any).matchBreakdown?.engagement || 0) / 20 * 100}%` }}></div>
                                    </div>
                                </div>

                                {((creator as any).matchBreakdown?.bonus || 0) > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Bonus (Follower Fit)</span>
                                            <span className="font-medium">{(creator as any).matchBreakdown?.bonus || 0}/10</span>
                                        </div>
                                        <div className="w-full bg-primary/10 rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${((creator as any).matchBreakdown?.bonus || 0) / 10 * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground italic">
                                        "{creator.matchReason}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Users className="w-4 h-4" />
                                    Audience
                                </div>
                                <div className="text-xl sm:text-2xl font-bold">{creator.followers}</div>
                                <div className="text-xs text-muted-foreground mt-1">Authentic</div>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Engagement
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-success">{creator.engagement}</div>
                                <div className="text-xs text-muted-foreground mt-1">Above Avg</div>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-muted/50 col-span-2">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Avg. Likes per Post
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-primary">
                                    {creator.instagramMetrics?.avgLikes?.toLocaleString() || "N/A"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Content */}
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Instagram className="w-4 h-4" />
                            Recent Content
                        </h3>

                        {loadingPosts ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {posts.map((post) => (
                                    <a
                                        key={post.id}
                                        href={post.permalink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative aspect-square rounded-xl overflow-hidden group bg-muted"
                                    >
                                        <img
                                            src={post.thumbnail || post.permalink} // Fallback might vary
                                            alt={post.caption}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        {post.media_type === "VIDEO" && (
                                            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                                                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                            <p className="text-white text-xs line-clamp-3 text-center">
                                                {post.caption}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Instagram className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">{error || "Unable to load recent posts."}</p>
                                {error && (
                                    <div className="mt-4">
                                        <p className="text-xs text-muted-foreground mb-2">Try connecting with the creator directly.</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <a
                                                href={`https://instagram.com/${creator.instagramUsername}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View on Instagram
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button className="flex-1" variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button className="flex-1" variant="hero" onClick={onApprove}>
                            <Check className="w-4 h-4 mr-2" />
                            {isApplicant ? "Approve Application" : "Send Proposal"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
