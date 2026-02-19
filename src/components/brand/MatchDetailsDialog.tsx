import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { MatchScore } from "@/components/dashboard/MatchScore";
import { Instagram, MapPin, Users, TrendingUp, Sparkles, Loader2, ExternalLink, Check, Eye, Music2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    tiktokUsername?: string;
    instagramMetrics?: {
        followers: number;
        engagementRate: number;
        avgLikes?: number;
        avgComments?: number;
        avgViews?: number;
    };
    tiktokMetrics?: {
        followers: number;
        likes: number; // Total likes usually
        engagementRate?: number;
        avgViews?: number;
    };
    matchBreakdown?: {
        compensation?: boolean;
        contentType?: number;
        niche?: number;
        experience?: number;
        socialMetrics?: number;
        composition?: number;
        demographics?: number;
        availability?: number;
        bonus?: number; // Keep bonus for compatibility if needed, though not in core logic anymore
    };
}

interface MatchDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    creator: CreatorDetails;
    campaign?: any;
    isApplicant?: boolean;
    isCollaborating?: boolean;
    onApprove?: () => void;
}

interface AiAnalysis {
    matchPercentage?: number;
    matchSummary?: string;
    predictedMetrics?: {
        avgViews: number;
        avgLikes: number;
        avgComments: number;
    };
    strengths?: string[];
    weaknesses?: string[];
    instagram?: string; // Legacy
    tiktok?: string;    // Legacy
}

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL_ALBUM";
    thumbnail_url?: string;
    media_url: string;
    permalink: string;
    timestamp: string;
}

export function MatchDetailsDialog({ isOpen, onClose, creator, campaign, isApplicant, isCollaborating, onApprove }: MatchDetailsDialogProps) {
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const [activePlatform, setActivePlatform] = useState<"instagram" | "tiktok">("instagram");

    useEffect(() => {
        if (isOpen && creator.id && campaign?.id) {
            // Reset to Instagram or preferred platform
            setActivePlatform("instagram");
            fetchCreatorPosts("instagram"); // Initial load

            // Listen for AI Analysis updates
            setLoadingAnalysis(true);
            const matchRef = doc(db, "campaigns", campaign.id, "matches", creator.id);
            const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.aiAnalysis) {
                        setAiAnalysis(data.aiAnalysis);
                        setLoadingAnalysis(false);
                    } else if (data.aiStatus === 'error') {
                        console.error("AI Analysis failed:", data.aiError);
                        setLoadingAnalysis(false);
                    } else if (data.aiStatus === 'pending') {
                        setLoadingAnalysis(true);
                    } else if (
                        (!data.aiAnalysis && data.aiStatus !== 'completed') ||
                        (data.aiAnalysis && typeof data.aiAnalysis.matchPercentage === 'undefined' && data.aiStatus !== 'pending')
                    ) {
                        // Trigger if:
                        // 1. No analysis exists AND not completed (legacy/error state)
                        // 2. Analysis exists but is OLD format (no matchPercentage) AND not currently pending
                        console.log("Triggering re-analysis for improved AI...");
                        setDoc(matchRef, { aiStatus: 'pending', forceRetry: true }, { merge: true });
                        setLoadingAnalysis(true);
                    }
                } else {
                    // If document doesn't exist, create it to trigger AI analysis
                    try {
                        await setDoc(matchRef, {
                            creatorId: creator.id,
                            campaignId: campaign.id,
                            brandCategory: campaign.category || "General",
                            campaignGoal: campaign.goal || "Brand Awareness",
                            status: 'potential', // Mark as potential match
                            aiStatus: 'pending',
                            createdAt: new Date()
                        });
                    } catch (err) {
                        console.error("Error creating match trigger:", err);
                        setLoadingAnalysis(false);
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [isOpen, creator.id, campaign]);

    // Handle platform change
    useEffect(() => {
        if (isOpen && creator.id) {
            fetchCreatorPosts(activePlatform);
        }
    }, [activePlatform]);

    const fetchCreatorPosts = async (platform: "instagram" | "tiktok") => {
        setLoadingPosts(true);
        setError(null);
        setPosts([]); // Clear previous posts

        try {
            const endpoint = platform === "instagram"
                ? "https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia"
                : "https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia";

            const response = await axios.post(endpoint, {
                userId: creator.id
            });

            if (response.data.success) {
                setPosts(response.data.data.slice(0, 6));
            } else {
                console.error(`Failed to load ${platform} posts:`, response.data.error);
                setError(response.data.error || `Failed to load ${platform} content`);
            }
        } catch (error) {
            console.error(`Error fetching ${platform} posts:`, error);
            setError(`Could not load content.`);
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
                                <div className="flex gap-1 ml-2">
                                    {creator.instagramUsername && (
                                        <a
                                            href={`https://instagram.com/${creator.instagramUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-[#E1306C] transition-colors p-1"
                                            title="View Instagram"
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {creator.tiktokUsername && (
                                        <a
                                            href={`https://tiktok.com/@${creator.tiktokUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-black transition-colors p-1"
                                            title="View TikTok"
                                        >
                                            <Music2 className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                {creator.bio || "No bio available"}
                            </DialogDescription>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {creator.location}
                                </span>
                            </div>
                        </div>
                        <MatchScore score={creator.matchScore} size="lg" showLabel={false} />
                    </div>
                </DialogHeader>

                <div className="space-y-6 md:space-y-8 py-4">
                    {/* AI Predictor Analysis */}
                    {(loadingAnalysis || aiAnalysis) && (
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI ROI Predictor
                            </h3>

                            {loadingAnalysis ? (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-pulse space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-4 bg-muted rounded w-1/2"></div>
                                    <div className="h-20 bg-muted rounded w-full mt-4"></div>
                                </div>
                            ) : aiAnalysis ? (
                                <div className="space-y-4">
                                    {/* New Format */}
                                    {aiAnalysis.matchPercentage !== undefined ? (
                                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5">
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                {/* Score Circle */}
                                                <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary/20 relative mx-auto md:mx-0">
                                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-3xl font-bold text-primary">{aiAnalysis.matchPercentage}%</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Match</span>
                                                    </div>
                                                </div>

                                                {/* Summary & Metrics */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="prose prose-sm max-w-none text-muted-foreground">
                                                        <p className="whitespace-pre-wrap">{aiAnalysis.matchSummary}</p>
                                                    </div>

                                                    {/* Predicted Metrics */}
                                                    {aiAnalysis.predictedMetrics && (
                                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 bg-white/50 p-3 rounded-lg border border-border/50">
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-primary">{aiAnalysis.predictedMetrics.avgViews.toLocaleString()}</div>
                                                                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">Avg Views</div>
                                                            </div>
                                                            <div className="text-center border-l border-border/50">
                                                                <div className="text-lg font-bold text-pink-500">{aiAnalysis.predictedMetrics.avgLikes.toLocaleString()}</div>
                                                                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">Avg Likes</div>
                                                            </div>
                                                            <div className="text-center border-l border-border/50">
                                                                <div className="text-lg font-bold text-blue-500">{aiAnalysis.predictedMetrics.avgComments.toLocaleString()}</div>
                                                                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">Avg Comments</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Legacy Format Fallback
                                        <div className="grid grid-cols-1 gap-3">
                                            {aiAnalysis.instagram && (
                                                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex gap-3 items-start">
                                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                                        <Instagram className="w-4 h-4 text-[#E1306C]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-foreground font-medium">Instagram Prediction</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{aiAnalysis.instagram}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {aiAnalysis.tiktok && (
                                                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 flex gap-3 items-start">
                                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                                        <Music2 className="w-4 h-4 text-black" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-foreground font-medium">TikTok Prediction</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{aiAnalysis.tiktok}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                    {/* AI Insights & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Match Breakdown
                            </h3>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 space-y-3">
                                {/* Content Type (25) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            📸 Content Types
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.contentType || 0}/25</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.contentType || 0) / 25 * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Vibe & Niche (20) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            ✨ Vibe & Niche
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.niche || 0}/20</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.niche || 0) / 20 * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Experience (15) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            ⭐ Experience
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.experience || 0}/15</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.experience || 0) / 15 * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Social Metrics (15) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            📈 Metrics
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.socialMetrics || 0}/15</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.socialMetrics || 0) / 15 * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Location (10) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            📍 Location
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.demographics || 0}/10</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.demographics || 0) / 10 * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Composition (10) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            👥 Audience Fit
                                        </span>
                                        <span className="font-medium">{creator.matchBreakdown?.composition || 0}/10</span>
                                    </div>
                                    <div className="w-full bg-primary/10 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(creator.matchBreakdown?.composition || 0) / 10 * 100}%` }}></div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground italic">
                                        "{creator.matchReason}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Platform Toggle */}
                            <div className="flex p-1 bg-muted rounded-lg w-full">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activePlatform === 'instagram' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setActivePlatform("instagram")}
                                >
                                    <Instagram className="w-4 h-4" /> Instagram
                                </button>
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activePlatform === 'tiktok' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setActivePlatform("tiktok")}
                                >
                                    <Music2 className="w-4 h-4" /> TikTok
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-3 sm:p-4 rounded-xl bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Users className="w-4 h-4" />
                                        Audience
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold">
                                        {activePlatform === 'instagram'
                                            ? (creator.instagramMetrics?.followers?.toLocaleString() || "N/A")
                                            : (creator.tiktokMetrics?.followers?.toLocaleString() || "N/A")
                                        }
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {activePlatform === 'instagram' ? "Followers" : "Followers"}
                                    </div>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        Engagement
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-success">
                                        {activePlatform === 'instagram'
                                            ? (creator.instagramMetrics?.engagementRate ? creator.instagramMetrics.engagementRate + "%" : "N/A")
                                            : "N/A" // TikTok API doesn't always give ER directly, or we calculate it. For now N/A or calculate.
                                        }
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Rate</div>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-muted/50 col-span-2">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        {activePlatform === 'instagram' ? <Instagram className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
                                        {activePlatform === 'instagram' ? "Avg. Likes per Post" : "Total Likes"}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-primary">
                                        {activePlatform === 'instagram'
                                            ? (creator.instagramMetrics?.avgLikes?.toLocaleString() || "N/A")
                                            : (creator.tiktokMetrics?.likes?.toLocaleString() || "N/A")
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Content */}
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            {activePlatform === 'instagram' ? <Instagram className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
                            Recent Content ({activePlatform === 'instagram' ? 'Instagram' : 'TikTok'})
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
                                        {(post.media_type === 'VIDEO' || post.media_type === 'REELS') && !post.thumbnail_url ? (
                                            <video
                                                src={post.media_url}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                onMouseOver={(e) => e.currentTarget.play()}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.pause();
                                                    e.currentTarget.currentTime = 0;
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={post.thumbnail_url || post.media_url}
                                                alt={post.caption}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://placehold.co/400x400?text=No+Image";
                                                }}
                                            />
                                        )}
                                        {(post.media_type === "VIDEO" || post.media_type === "REELS") && (
                                            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full pointer-events-none">
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
                        <Button className="flex-1" variant={isCollaborating ? "outline" : "hero"} onClick={onApprove}>
                            {isCollaborating ? <Eye className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {isApplicant ? "Approve Application" : isCollaborating ? "View Content" : "Send Proposal"}
                        </Button>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}
