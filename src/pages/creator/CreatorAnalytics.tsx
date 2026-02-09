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
}

export default function CreatorAnalytics() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);

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
    }, [user, profile?.instagramConnected]);

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

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="AI Profile Analysis"
                    subtitle="Deep dive into your Instagram performance and AI insights"
                />

                <div className="space-y-8">
                    {/* AI Insights Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Performance Overview
                        </h3>
                        {/* Profile Header */}
                        {profile?.instagramConnected && (
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-background/50 border border-border/50">
                                <img
                                    src={profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"}
                                    alt={profile.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{profile.name}</h2>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Instagram className="w-4 h-4" />
                                        <span>@{profile.instagramMetrics?.handle || profile.socialHandles?.instagram || "username"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                            {profile?.instagramConnected && profile.instagramMetrics ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Followers</p>
                                            <p className="text-xl font-bold text-primary">
                                                {profile.instagramMetrics.followers > 1000
                                                    ? `${(profile.instagramMetrics.followers / 1000).toFixed(1)}K`
                                                    : profile.instagramMetrics.followers}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Eng. Rate</p>
                                            <p className="text-xl font-bold text-success">
                                                {profile.instagramMetrics.engagementRate || 0}%
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Avg. Likes</p>
                                            <p className="text-xl font-bold text-primary">
                                                {profile.instagramMetrics.avgLikes?.toLocaleString() || "0"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Avg. Comments</p>
                                            <p className="text-xl font-bold text-primary">
                                                {profile.instagramMetrics.avgComments?.toLocaleString() || "0"}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Content Insights</h4>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-success mt-0.5" />
                                                High engagement on video content (Reels).
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-success mt-0.5" />
                                                <span>Audience primarily active between 6pm - 9pm.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">Connect your Instagram account in Profile settings to unlock AI-powered insights.</p>
                                    <Button variant="outline" asChild>
                                        <a href="/creator/profile">Go to Profile</a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Posts Grid */}
                    {profile?.instagramConnected && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Instagram className="w-5 h-5 text-[#E1306C]" />
                                Recent Content
                            </h3>

                            {loadingPosts ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : posts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {posts.map((post) => (
                                        <a
                                            key={post.id}
                                            href={post.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-square rounded-xl overflow-hidden bg-muted block hover-lift transition-all"
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
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "https://placehold.co/400x400?text=No+Image";
                                                    }}
                                                />
                                            )}
                                            {(post.media_type === "VIDEO" || post.media_type === "REELS") && (
                                                <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                <p className="text-white text-xs line-clamp-2 mb-2">
                                                    {post.caption}
                                                </p>
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
