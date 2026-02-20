import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
    Loader2, Sparkles, Users, Instagram, TrendingUp, TrendingDown,
    Heart, MessageCircle, Eye, BarChart2, Star, AlertCircle, CheckCircle, Zap, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL_ALBUM";
    thumbnail_url?: string;
    media_url: string;
    permalink: string;
    timestamp: string;
    view_count?: number;
    reach?: number;
    like_count?: number;
    comments_count?: number;
}

interface AiProfileAnalysis {
    score: number;
    tier: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    brandAppeal: string;
}

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const tierColorMap: Record<string, string> = {
    "Nano Creator": "bg-slate-100 text-slate-700",
    "Micro Creator": "bg-blue-100 text-blue-700",
    "Micro Influencer": "bg-blue-100 text-blue-700",
    "Rising Creator": "bg-green-100 text-green-700",
    "Power Creator": "bg-purple-100 text-purple-700",
    "Top Creator": "bg-yellow-100 text-yellow-700",
    "Viral Creator": "bg-red-100 text-red-700",
};

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

    // Real Gemini AI analysis (same pattern as MatchDetailsDialog)
    const [igAnalysis, setIgAnalysis] = useState<AiProfileAnalysis | null>(null);
    const [igAiStatus, setIgAiStatus] = useState<string | null>(null);
    const [ttAnalysis, setTtAnalysis] = useState<AiProfileAnalysis | null>(null);
    const [ttAiStatus, setTtAiStatus] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setProfile(userDoc.data());
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    useEffect(() => {
        if (!user || !profile) return;

        const unsubs: (() => void)[] = [];

        // ── Instagram Analysis ──
        if (profile.instagramConnected) {
            fetchCreatorPosts();
            const igRef = doc(db, "users", user.uid, "profileAnalysis", "instagram");
            const unsub = onSnapshot(igRef, async (snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    setIgAiStatus(d.aiStatus || null);
                    if (d.aiAnalysis && d.aiStatus === "completed") {
                        setIgAnalysis(d.aiAnalysis);
                    } else if (d.aiStatus !== "pending" && d.aiStatus !== "running") {
                        // Trigger analysis
                        await setDoc(igRef, { aiStatus: "pending", requestedAt: new Date().toISOString() }, { merge: true });
                    }
                } else {
                    // First time — create doc to trigger Cloud Function
                    await setDoc(igRef, { userId: user.uid, platform: "instagram", aiStatus: "pending", requestedAt: new Date().toISOString() });
                }
            });
            unsubs.push(unsub);
        }

        // ── TikTok Analysis ──
        if (profile.tiktokConnected) {
            fetchTikTokPosts();
            const ttRef = doc(db, "users", user.uid, "profileAnalysis", "tiktok");
            const unsub = onSnapshot(ttRef, async (snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    setTtAiStatus(d.aiStatus || null);
                    if (d.aiAnalysis && d.aiStatus === "completed") {
                        setTtAnalysis(d.aiAnalysis);
                    } else if (d.aiStatus !== "pending" && d.aiStatus !== "running") {
                        await setDoc(ttRef, { aiStatus: "pending", requestedAt: new Date().toISOString() }, { merge: true });
                    }
                } else {
                    await setDoc(ttRef, { userId: user.uid, platform: "tiktok", aiStatus: "pending", requestedAt: new Date().toISOString() });
                }
            });
            unsubs.push(unsub);
        }

        return () => unsubs.forEach(u => u());
    }, [user, profile]);

    const fetchCreatorPosts = async () => {
        setLoadingPosts(true);
        setPostError(null);
        try {
            const res = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia", { userId: user?.uid });
            if (res.data.success) setPosts(res.data.data);
            else setPostError(res.data.error || "Failed to load posts");
        } catch {
            setPostError("Could not load posts. Instagram token might be expired.");
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchTikTokPosts = async () => {
        setLoadingTikTokPosts(true);
        try {
            const res = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia", { userId: user?.uid });
            if (res.data.success) setTikTokPosts(res.data.data);
        } catch { /* silent */ }
        finally { setLoadingTikTokPosts(false); }
    };

    const handleRetryAnalysis = async () => {
        if (!user) return;
        const ref = doc(db, "users", user.uid, "profileAnalysis", selectedPlatform);
        if (selectedPlatform === "instagram") setIgAiStatus("pending");
        else setTtAiStatus("pending");
        await setDoc(ref, { aiStatus: "pending", forceRetry: true, requestedAt: new Date().toISOString() }, { merge: true });
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
    const analysis = selectedPlatform === "instagram" ? igAnalysis : ttAnalysis;
    const aiStatus = selectedPlatform === "instagram" ? igAiStatus : ttAiStatus;
    const isAiLoading = aiStatus === "pending" || aiStatus === "running";

    const tierColor = analysis ? (tierColorMap[analysis.tier] || "bg-primary/10 text-primary") : "";

    const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) =>
        trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> :
            trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
                <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />;

    // Build insight rows from raw metrics
    const metricRows = currentMetrics ? (selectedPlatform === "instagram" ? [
        { label: "Followers", value: currentMetrics.followers >= 1000 ? `${(currentMetrics.followers / 1000).toFixed(1)}K` : String(currentMetrics.followers || 0), trend: "up" as const, note: "Seguidores activos" },
        { label: "Eng. Rate", value: `${currentMetrics.engagementRate || 0}%`, trend: (currentMetrics.engagementRate >= 3 ? "up" : "down") as "up" | "down", note: parseFloat(currentMetrics.engagementRate) >= 3 ? "✅ Por encima del promedio" : "⚠️ Por debajo del promedio" },
        { label: "Avg. Likes", value: String(currentMetrics.avgLikes || 0), trend: "neutral" as const, note: `${((currentMetrics.avgLikes || 0) / (currentMetrics.followers || 1) * 100).toFixed(1)}% de seguidores` },
        { label: "Avg. Comments", value: String(currentMetrics.avgComments || 0), trend: "neutral" as const, note: "Conversaciones por post" },
    ] : [
        { label: "Followers", value: currentMetrics.followers >= 1000 ? `${(currentMetrics.followers / 1000).toFixed(1)}K` : String(currentMetrics.followers || 0), trend: "up" as const, note: "Seguidores TikTok" },
        { label: "Eng. Rate", value: `${currentMetrics.engagementRate || 0}%`, trend: (currentMetrics.engagementRate >= 10 ? "up" : "down") as "up" | "down", note: parseFloat(currentMetrics.engagementRate) >= 10 ? "🔥 Sobre el promedio" : "⚠️ En crecimiento" },
        { label: "Total Likes", value: currentMetrics.likes >= 1000 ? `${(currentMetrics.likes / 1000).toFixed(1)}K` : String(currentMetrics.likes || 0), trend: "neutral" as const, note: "Likes totales en la cuenta" },
        { label: "Videos", value: String(currentMetrics.videoCount || tiktokPosts.length || 0), trend: "neutral" as const, note: "Videos publicados" },
    ]) : [];

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
                    <Button variant={selectedPlatform === "instagram" ? "default" : "outline"} onClick={() => setSelectedPlatform("instagram")} className="gap-2">
                        <Instagram className="w-4 h-4" /> Instagram
                    </Button>
                    <Button variant={selectedPlatform === "tiktok" ? "default" : "outline"} onClick={() => setSelectedPlatform("tiktok")} className="gap-2">
                        <TikTokIcon className="w-4 h-4" /> TikTok
                    </Button>
                </div>

                {!isConnected ? (
                    <div className="glass-card p-12 text-center rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            {selectedPlatform === "instagram" ? <Instagram className="w-8 h-8 text-muted-foreground" /> : <TikTokIcon className="w-8 h-8 text-muted-foreground" />}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{selectedPlatform === "instagram" ? "Instagram" : "TikTok"} no conectado</h3>
                        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                            Conecta tu cuenta para desbloquear el análisis IA de tu perfil basado en tus publicaciones reales.
                        </p>
                        <Button variant="outline" asChild><a href="/creator/profile">Conectar en Perfil →</a></Button>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* ── Profile Header ── */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                            <img
                                src={selectedPlatform === "instagram"
                                    ? (profile.instagramProfilePicture || profile.photoURL || `https://ui-avatars.com/api/?name=${profile.name}`)
                                    : (profile.tiktokAvatar || profile.photoURL || `https://ui-avatars.com/api/?name=${profile.name}`)
                                }
                                alt={profile.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold">
                                        {selectedPlatform === "instagram" ? (profile.instagramName || profile.name) : (profile.tiktokName || profile.name)}
                                    </h2>
                                    {analysis?.tier && (
                                        <Badge className={tierColor}>{analysis.tier}</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                    {selectedPlatform === "instagram" ? <Instagram className="w-4 h-4" /> : <TikTokIcon className="w-4 h-4" />}
                                    <span>@{selectedPlatform === "instagram"
                                        ? (profile.instagramMetrics?.handle || profile.instagramUsername || profile.socialHandles?.instagram || "username")
                                        : (profile.socialHandles?.tiktok || "username")}
                                    </span>
                                </div>
                            </div>

                            {/* Score gauge */}
                            {analysis && (
                                <div className="hidden md:flex flex-col items-center flex-shrink-0">
                                    <div className="relative w-16 h-16">
                                        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                strokeDasharray={`${analysis.score} ${100 - analysis.score}`}
                                                className="text-primary transition-all duration-1000" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center font-black text-sm">{analysis.score}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">Score IA</span>
                                </div>
                            )}
                            {isAiLoading && !analysis && (
                                <div className="hidden md:flex flex-col items-center flex-shrink-0">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground mt-2">Analizando...</span>
                                </div>
                            )}
                        </div>

                        {/* ── Metrics Row ── */}
                        {currentMetrics && (
                            <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {metricRows.map(m => (
                                        <div key={m.label} className="p-4 bg-background/50 rounded-xl text-center space-y-1">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <TrendIcon trend={m.trend} /> {m.label}
                                            </div>
                                            <p className="text-2xl font-black text-primary">{m.value}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{m.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── AI Analysis Card ── */}
                        <div className="glass-card rounded-2xl overflow-hidden border border-primary/20">
                            <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-base">
                                    Análisis IA — {selectedPlatform === "instagram" ? "Instagram" : "TikTok"}
                                </h3>
                                <Badge variant="outline" className="ml-auto text-[10px]">RELA AI</Badge>
                                {analysis && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleRetryAnalysis}>
                                        <RefreshCw className="w-3 h-3 mr-1" /> Refrescar
                                    </Button>
                                )}
                            </div>

                            <div className="p-6">
                                {isAiLoading && !analysis ? (
                                    /* Loading state */
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <div className="text-center">
                                            <p className="font-medium">RELA AI está analizando tu perfil...</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Revisando tus publicaciones reales y métricas de {selectedPlatform === "instagram" ? "Instagram" : "TikTok"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap justify-center">
                                            {["Analizando posts...", "Calculando engagement...", "Generando recomendaciones..."].map(s => (
                                                <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : aiStatus === "error" ? (
                                    /* Error state */
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                                        <p className="font-medium mb-1">El análisis falló</p>
                                        <p className="text-sm text-muted-foreground mb-4">Esto puede pasar si el token de la red social venció.</p>
                                        <Button variant="outline" size="sm" onClick={handleRetryAnalysis}>
                                            <RefreshCw className="w-4 h-4 mr-2" /> Reintentar análisis
                                        </Button>
                                    </div>
                                ) : analysis ? (
                                    /* Analysis result */
                                    <div className="space-y-6">
                                        {/* Summary */}
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm mb-1">Resumen General</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Strengths */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <p className="font-semibold text-sm text-green-700 dark:text-green-400">Puntos Fuertes</p>
                                                </div>
                                                <ul className="space-y-2">
                                                    {analysis.strengths?.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                            <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" /> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Improvements */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                    <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">Áreas de Mejora</p>
                                                </div>
                                                <ul className="space-y-2">
                                                    {analysis.improvements?.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                            <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" /> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Brand Appeal */}
                                        <div className="rounded-xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-start gap-3">
                                            <Heart className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm mb-1">Potencial con Marcas</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{analysis.brandAppeal}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Not triggered yet */
                                    <div className="text-center py-8">
                                        <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="font-medium mb-1">Análisis pendiente</p>
                                        <p className="text-sm text-muted-foreground">El análisis se iniciará automáticamente.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Recent Content ── */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                {selectedPlatform === "instagram" ? <Instagram className="w-5 h-5 text-[#E1306C]" /> : <TikTokIcon className="w-5 h-5" />}
                                Recent Content
                            </h3>
                            {(selectedPlatform === "instagram" ? loadingPosts : loadingTikTokPosts) ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                            ) : (selectedPlatform === "instagram" ? posts : tiktokPosts).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {(selectedPlatform === "instagram" ? posts : tiktokPosts).map((post) => (
                                        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                                            className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted block hover-lift transition-all">
                                            {(post.media_type === "VIDEO" || post.media_type === "REELS") && !post.thumbnail_url ? (
                                                <video src={post.media_url} className="w-full h-full object-cover" muted playsInline
                                                    onMouseOver={e => e.currentTarget.play()}
                                                    onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                                            ) : (
                                                <img src={post.thumbnail_url || post.top_image_url || post.media_url} alt={post.caption}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={e => { e.currentTarget.src = "https://placehold.co/400x700?text=No+Image"; }} />
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full text-xs text-white backdrop-blur-sm flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {(selectedPlatform === "instagram" ? (post.reach || post.view_count || 0) : (post.view_count || 0)).toLocaleString()}
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end min-h-[100px]">
                                                <p className="text-white text-xs line-clamp-2 mb-2">{post.caption}</p>
                                                <div className="flex items-center gap-3 text-white/90 text-xs">
                                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {(post.like_count || 0).toLocaleString()}</span>
                                                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {(post.comments_count || 0).toLocaleString()}</span>
                                                    {post.view_count > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count.toLocaleString()}</span>}
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

                    </div>
                )}
            </main>
        </div>
    );
}
