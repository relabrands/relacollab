import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScore } from "@/components/dashboard/MatchScore";
import {
    Instagram, MapPin, Users, TrendingUp, Sparkles, Loader2,
    ExternalLink, Check, Eye, Music2, ThumbsUp, ThumbsDown,
    Target, BarChart2, MessageSquare, Zap, AlertTriangle
} from "lucide-react";
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
        likes: number;
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
    };
    aiAnalysis?: AiAnalysis | null;
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
    // Legacy fields
    instagram?: string;
    tiktok?: string;
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

const getMatchColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-500";
    if (pct >= 60) return "text-blue-500";
    if (pct >= 40) return "text-amber-500";
    return "text-red-500";
};

const getMatchBorderColor = (pct: number) => {
    if (pct >= 80) return "border-emerald-400";
    if (pct >= 60) return "border-blue-400";
    if (pct >= 40) return "border-amber-400";
    return "border-red-400";
};

const getMatchLabel = (pct: number) => {
    if (pct >= 80) return "Excellent Match";
    if (pct >= 60) return "Good Match";
    if (pct >= 40) return "Fair Match";
    return "Low Match";
};

export function MatchDetailsDialog({ isOpen, onClose, creator, campaign, isApplicant, isCollaborating, onApprove }: MatchDetailsDialogProps) {
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(creator.aiAnalysis || null);
    const [aiStatus, setAiStatus] = useState<string | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [activePlatform, setActivePlatform] = useState<"instagram" | "tiktok">("instagram");

    useEffect(() => {
        if (!isOpen || !creator.id || !campaign?.id) return;

        // Reset
        setActivePlatform("instagram");
        fetchCreatorPosts("instagram");

        // If creator already brought pre-loaded analysis, use it
        if (creator.aiAnalysis?.matchPercentage !== undefined) {
            setAiAnalysis(creator.aiAnalysis);
            setLoadingAnalysis(false);
        } else {
            setLoadingAnalysis(true);
        }

        // Always listen to the match doc for real-time updates
        const matchRef = doc(db, "campaigns", campaign.id, "matches", creator.id);
        const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setAiStatus(data.aiStatus || null);

                if (data.aiAnalysis?.matchPercentage !== undefined) {
                    // New format — show it
                    setAiAnalysis(data.aiAnalysis);
                    setLoadingAnalysis(false);
                } else if (data.aiStatus === "error") {
                    setLoadingAnalysis(false);
                } else if (data.aiStatus === "pending" || data.aiStatus === "running") {
                    setLoadingAnalysis(true);
                } else if (!data.aiAnalysis || typeof data.aiAnalysis.matchPercentage === "undefined") {
                    // Old/legacy format or missing — trigger re-analysis
                    if (data.aiStatus !== "pending") {
                        console.log("Triggering AI re-analysis...");
                        await setDoc(matchRef, { aiStatus: "pending", forceRetry: true }, { merge: true });
                        setLoadingAnalysis(true);
                    }
                } else {
                    setLoadingAnalysis(false);
                }
            } else {
                // Document missing — create it to trigger the Cloud Function
                try {
                    await setDoc(matchRef, {
                        creatorId: creator.id,
                        campaignId: campaign.id,
                        brandCategory: campaign.category || "General",
                        campaignGoal: campaign.goal || "Brand Awareness",
                        status: "potential",
                        aiStatus: "pending",
                        createdAt: new Date(),
                    });
                    setLoadingAnalysis(true);
                } catch (err) {
                    console.error("Error creating match doc:", err);
                    setLoadingAnalysis(false);
                }
            }
        });

        return () => unsubscribe();
    }, [isOpen, creator.id, campaign?.id]);

    useEffect(() => {
        if (isOpen && creator.id) {
            fetchCreatorPosts(activePlatform);
        }
    }, [activePlatform]);

    const fetchCreatorPosts = async (platform: "instagram" | "tiktok") => {
        setLoadingPosts(true);
        setError(null);
        setPosts([]);
        try {
            const endpoint =
                platform === "instagram"
                    ? "https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia"
                    : "https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia";
            const response = await axios.post(endpoint, { userId: creator.id });
            if (response.data.success) {
                setPosts(response.data.data.slice(0, 6));
            } else {
                setError(response.data.error || `Failed to load ${platform} content`);
            }
        } catch {
            setError("Could not load content.");
        } finally {
            setLoadingPosts(false);
        }
    };

    // Determine displayed match % — prefer AI if available
    const displayScore = aiAnalysis?.matchPercentage ?? creator.matchScore;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* ─── Header ─── */}
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-border/50"
                        />
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                                {creator.name}
                                <div className="flex gap-1 ml-1">
                                    {creator.instagramUsername && (
                                        <a
                                            href={`https://instagram.com/${creator.instagramUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-[#E1306C] transition-colors p-1"
                                            title="Instagram"
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
                                            title="TikTok"
                                        >
                                            <Music2 className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </DialogTitle>
                            <DialogDescription className="text-base mt-0.5">
                                {creator.bio || "No bio available"}
                            </DialogDescription>
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                {creator.location}
                            </div>
                        </div>
                        {/* Score badge */}
                        <div className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl font-black text-3xl border-4 shadow-lg bg-background ${getMatchBorderColor(displayScore)} ${getMatchColor(displayScore)}`}>
                            {displayScore}%
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground -mt-1">
                                {aiAnalysis?.matchPercentage !== undefined ? "AI Match" : "Match"}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-2">

                    {/* ─── AI Match Intelligence ─── */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                            <Sparkles className="w-4 h-4 text-primary" />
                            AI Match Intelligence
                            {aiAnalysis?.matchPercentage !== undefined && (
                                <Badge variant="outline" className="text-xs font-normal ml-1 border-primary/30 text-primary">
                                    Powered by Gemini
                                </Badge>
                            )}
                        </h3>

                        {loadingAnalysis && !aiAnalysis ? (
                            /* Loading skeleton */
                            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-5 space-y-4 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">
                                        Gemini AI is analyzing this match for your campaign...
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-primary/10 rounded-full w-full" />
                                    <div className="h-3 bg-primary/10 rounded-full w-4/5" />
                                    <div className="h-3 bg-primary/10 rounded-full w-3/5" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="h-16 bg-primary/10 rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ) : aiAnalysis?.matchPercentage !== undefined ? (
                            /* ── New Format ── */
                            <div className="rounded-2xl border border-primary/20 overflow-hidden">
                                {/* Top strip: score + label */}
                                <div className={`px-5 py-3 flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/10`}>
                                    <div className={`text-4xl font-black ${getMatchColor(aiAnalysis.matchPercentage)}`}>
                                        {aiAnalysis.matchPercentage}%
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{getMatchLabel(aiAnalysis.matchPercentage)}</div>
                                        <div className="text-xs text-muted-foreground">AI-predicted compatibility</div>
                                    </div>
                                    {loadingAnalysis && (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
                                    )}
                                </div>

                                {/* Summary */}
                                {aiAnalysis.matchSummary && (
                                    <div className="px-5 py-4 bg-background/80">
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {aiAnalysis.matchSummary}
                                        </p>
                                    </div>
                                )}

                                {/* Predicted Metrics */}
                                {aiAnalysis.predictedMetrics && (
                                    <div className="px-5 py-4 border-t border-border/50 bg-muted/20">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                                            <Target className="w-3.5 h-3.5" />
                                            Predicted Impact per Post
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-background rounded-xl p-3 text-center border border-border/50 shadow-sm">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Views</span>
                                                </div>
                                                <div className="text-xl font-black text-blue-500">
                                                    {aiAnalysis.predictedMetrics.avgViews.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-background rounded-xl p-3 text-center border border-border/50 shadow-sm">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <ThumbsUp className="w-3.5 h-3.5 text-pink-500" />
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Likes</span>
                                                </div>
                                                <div className="text-xl font-black text-pink-500">
                                                    {aiAnalysis.predictedMetrics.avgLikes.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-background rounded-xl p-3 text-center border border-border/50 shadow-sm">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Comments</span>
                                                </div>
                                                <div className="text-xl font-black text-violet-500">
                                                    {aiAnalysis.predictedMetrics.avgComments.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Strengths & Weaknesses */}
                                {((aiAnalysis.strengths && aiAnalysis.strengths.length > 0) ||
                                    (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0)) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-border/50">
                                            {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                                                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-border/50">
                                                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                                                        <Zap className="w-3.5 h-3.5" />
                                                        Strengths
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {aiAnalysis.strengths.map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                                <span className="text-foreground/80">{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                                                <div className="px-5 py-4 bg-red-50/50 dark:bg-red-950/20">
                                                    <div className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Watch-outs
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {aiAnalysis.weaknesses.map((w, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                                                <span className="text-foreground/80">{w}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        ) : aiStatus === "error" ? (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                AI analysis failed. Check that Vertex AI is enabled in this Firebase project.
                            </div>
                        ) : null}
                    </div>

                    {/* ─── Rule-Based Breakdown + Platform Stats ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Match Breakdown */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                                <BarChart2 className="w-4 h-4" />
                                Match Breakdown
                            </h3>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 space-y-3">
                                {[
                                    { label: "📸 Content Types", value: creator.matchBreakdown?.contentType ?? 0, max: 25 },
                                    { label: "✨ Vibe & Niche", value: creator.matchBreakdown?.niche ?? 0, max: 20 },
                                    { label: "⭐ Experience", value: creator.matchBreakdown?.experience ?? 0, max: 15 },
                                    { label: "📈 Metrics", value: creator.matchBreakdown?.socialMetrics ?? 0, max: 15 },
                                    { label: "📍 Location", value: creator.matchBreakdown?.demographics ?? 0, max: 10 },
                                    { label: "👥 Audience Fit", value: creator.matchBreakdown?.composition ?? 0, max: 10 },
                                ].map(({ label, value, max }) => (
                                    <div key={label} className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{value}/{max}</span>
                                        </div>
                                        <div className="w-full bg-primary/10 rounded-full h-1.5">
                                            <div
                                                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(value / max) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                                        "{creator.matchReason}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Platform Stats */}
                        <div className="space-y-3">
                            {/* Platform Toggle */}
                            <div className="flex p-1 bg-muted rounded-lg w-full">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activePlatform === "instagram" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                    onClick={() => setActivePlatform("instagram")}
                                >
                                    <Instagram className="w-4 h-4" /> Instagram
                                </button>
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activePlatform === "tiktok" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                    onClick={() => setActivePlatform("tiktok")}
                                >
                                    <Music2 className="w-4 h-4" /> TikTok
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                        <Users className="w-3.5 h-3.5" /> Audience
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {activePlatform === "instagram"
                                            ? (creator.instagramMetrics?.followers?.toLocaleString() ?? "N/A")
                                            : (creator.tiktokMetrics?.followers?.toLocaleString() ?? "N/A")}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">Followers</div>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                        <TrendingUp className="w-3.5 h-3.5" /> Engagement
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {activePlatform === "instagram"
                                            ? (creator.instagramMetrics?.engagementRate != null
                                                ? creator.instagramMetrics.engagementRate + "%"
                                                : "N/A")
                                            : (creator.tiktokMetrics?.engagementRate != null
                                                ? creator.tiktokMetrics.engagementRate + "%"
                                                : "N/A")}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">Rate</div>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50 col-span-2">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                        {activePlatform === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Music2 className="w-3.5 h-3.5" />}
                                        {activePlatform === "instagram" ? "Avg. Likes per Post" : "Total Likes"}
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                        {activePlatform === "instagram"
                                            ? (creator.instagramMetrics?.avgLikes?.toLocaleString() ?? "N/A")
                                            : (creator.tiktokMetrics?.likes?.toLocaleString() ?? "N/A")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Recent Content ─── */}
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                            {activePlatform === "instagram" ? <Instagram className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
                            Recent Content ({activePlatform === "instagram" ? "Instagram" : "TikTok"})
                        </h3>

                        {loadingPosts ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {posts.map((post) => (
                                    <a
                                        key={post.id}
                                        href={post.permalink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative aspect-square rounded-xl overflow-hidden group bg-muted"
                                    >
                                        {(post.media_type === "VIDEO" || post.media_type === "REELS") && !post.thumbnail_url ? (
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
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                                            <p className="text-white text-xs line-clamp-3 text-center">{post.caption}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                {activePlatform === "instagram" ? (
                                    <Instagram className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                ) : (
                                    <Music2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                )}
                                <p className="text-muted-foreground text-sm">{error || "No recent content found."}</p>
                                {creator.instagramUsername && activePlatform === "instagram" && (
                                    <div className="mt-4">
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

                    {/* ─── Action Buttons ─── */}
                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1" variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            className="flex-1"
                            variant={isCollaborating ? "outline" : "default"}
                            onClick={onApprove}
                        >
                            {isCollaborating ? (
                                <Eye className="w-4 h-4 mr-2" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            {isApplicant ? "Approve Application" : isCollaborating ? "View Content" : "Send Proposal"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
