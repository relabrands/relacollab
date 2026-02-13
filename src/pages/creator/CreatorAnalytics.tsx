import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Sparkles, Check, TrendingUp, Users, Instagram, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL_ALBUM";
    thumbnail_url?: string;
    media_url: string;
    permalink: string;
    timestamp: string;
    // Metrics
    view_count?: number;
    reach?: number;
    like_count?: number;
    comments_count?: number;
}

export default function CreatorAnalytics() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [tiktokPosts, setTikTokPosts] = useState<any[]>([]);
    const [loadingTikTokPosts, setLoadingTikTokPosts] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "tiktok">("instagram");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setProfile(userDoc.data());
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    useEffect(() => {
        if (user && profile?.instagramConnected) {
            fetchCreatorPosts();
        }
        if (user && profile?.tiktokConnected) {
            fetchTikTokPosts();
        }
    }, [user, profile]);

    const fetchCreatorPosts = async () => {
        setLoadingPosts(true);
        setPostError(null);
        try {
            const response = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia", {
                userId: user?.uid
            });

            if (response.data.success) {
                setPosts(response.data.data);
            } else {
                console.error("Failed to load posts:", response.data.error);
                setPostError(response.data.error || "Failed to load posts");
            }
        } catch (error) {
            console.error("Error fetching creator posts:", error);
            setPostError("Could not load posts. Instagram token might be expired.");
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchTikTokPosts = async () => {
        setLoadingTikTokPosts(true);
        try {
            const response = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia", {
                userId: user?.uid
            });

            if (response.data.success) {
                setTikTokPosts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching TikTok posts:", error);
        } finally {
            setLoadingTikTokPosts(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentMetrics = selectedPlatform === "instagram" ? profile?.instagramMetrics : profile?.tiktokMetrics;
    const isConnected = selectedPlatform === "instagram" ? profile?.instagramConnected : profile?.tiktokConnected;

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="AI Profile Analysis"
                    subtitle="Deep dive into your social performance and AI insights"
                />

                {/* Platform Toggle */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={selectedPlatform === "instagram" ? "default" : "outline"}
                        onClick={() => setSelectedPlatform("instagram")}
                        className="gap-2"
                    >
                        <Instagram className="w-4 h-4" />
                        Instagram
                    </Button>
                    <Button
                        variant={selectedPlatform === "tiktok" ? "default" : "outline"}
                        onClick={() => setSelectedPlatform("tiktok")}
                        className="gap-2"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        TikTok
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* AI Insights Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Performance Overview
                        </h3>
                        {/* Profile Header */}
                        {isConnected && (
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-background/50 border border-border/50">
                                <img
                                    src={
                                        selectedPlatform === "instagram"
                                            ? (profile.instagramProfilePicture || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop")
                                            : (profile.tiktokAvatar || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop")
                                    }
                                    alt={profile.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                                />
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {
                                            selectedPlatform === "instagram"
                                                ? (profile.instagramName || profile.name)
                                                : (profile.tiktokName || profile.name)
                                        }
                                    </h2>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {selectedPlatform === "instagram" ? <Instagram className="w-4 h-4" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                                        <span>@{
                                            selectedPlatform === "instagram"
                                                ? (profile.instagramMetrics?.handle || profile.instagramUsername || profile.socialHandles?.instagram || "username")
                                                : (profile.socialHandles?.tiktok || "username")
                                        }</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                            {isConnected && currentMetrics ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Followers</p>
                                            <p className="text-xl font-bold text-primary">
                                                {currentMetrics.followers > 1000
                                                    ? `${(currentMetrics.followers / 1000).toFixed(1)}K`
                                                    : currentMetrics.followers}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Eng. Rate</p>
                                            <p className="text-xl font-bold text-success">
                                                {currentMetrics.engagementRate || 0}%
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">{selectedPlatform === 'instagram' ? 'Avg. Likes' : 'Total Likes'}</p>
                                            <p className="text-xl font-bold text-primary">
                                                {selectedPlatform === 'instagram'
                                                    ? (currentMetrics.avgLikes?.toLocaleString() || "0")
                                                    : (currentMetrics.likes?.toLocaleString() || "0")
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">{selectedPlatform === 'instagram' ? 'Avg. Comments' : 'Videos'}</p>
                                            <p className="text-xl font-bold text-primary">
                                                {selectedPlatform === 'instagram'
                                                    ? (currentMetrics.avgComments?.toLocaleString() || "0")
                                                    : (profile.tiktokMetrics?.videoCount || tiktokPosts.length || "0")
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">
                                        Connect your {selectedPlatform === "instagram" ? "Instagram" : "TikTok"} account in Profile settings to unlock AI-powered insights.
                                    </p>
                                    <Button variant="outline" asChild>
                                        <a href="/creator/profile">Go to Profile</a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Posts Grid */}
                    {isConnected && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                {selectedPlatform === "instagram" ? <Instagram className="w-5 h-5 text-[#E1306C]" /> : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                                Recent Content
                            </h3>

                            {(selectedPlatform === "instagram" ? loadingPosts : loadingTikTokPosts) ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (selectedPlatform === "instagram" ? posts : tiktokPosts).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {(selectedPlatform === "instagram" ? posts : tiktokPosts).map((post) => (
                                        <a
                                            key={post.id}
                                            href={post.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted block hover-lift transition-all"
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
                                                    src={post.thumbnail_url || post.top_image_url || post.media_url}
                                                    alt={post.caption}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "https://placehold.co/400x700?text=No+Image";
                                                    }}
                                                />
                                            )}

                                            {/* Top Overlay (Views/Reach) */}
                                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full text-xs text-white backdrop-blur-sm flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {(selectedPlatform === 'instagram'
                                                    ? (post.reach || post.view_count || 0)
                                                    : (post.view_count || 0)
                                                ).toLocaleString()}
                                            </div>

                                            {/* Bottom Overlay (Likes/Comments) */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end min-h-[100px] opacity-100 group-hover:opacity-100 transition-all">
                                                <p className="text-white text-xs line-clamp-2 mb-2">
                                                    {post.caption}
                                                </p>
                                                <div className="flex items-center gap-3 text-white/90 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        ❤️ {(post.like_count || 0).toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        💬 {(post.comments_count || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-muted-foreground">{postError || "No posts found."}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
