import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
    Loader2, Sparkles, Users, Instagram, TrendingUp, TrendingDown,
    Heart, MessageCircle, Eye, BarChart2, Star, AlertCircle, CheckCircle, Zap
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

// ── AI Analysis Engine ────────────────────────────────────────────
function generateInstagramAnalysis(metrics: any): {
    score: number;
    tier: string;
    tierColor: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    insights: { label: string; value: string; trend: "up" | "down" | "neutral"; note: string }[];
} {
    const followers = metrics?.followers || 0;
    const engRate = parseFloat(metrics?.engagementRate) || 0;
    const avgLikes = metrics?.avgLikes || 0;
    const avgComments = metrics?.avgComments || 0;

    // Score (0-100)
    let score = 0;
    if (engRate >= 6) score += 40;
    else if (engRate >= 3) score += 25;
    else if (engRate >= 1) score += 12;

    if (followers >= 100000) score += 30;
    else if (followers >= 10000) score += 22;
    else if (followers >= 1000) score += 15;
    else score += 5;

    const commentRatio = avgLikes > 0 ? (avgComments / avgLikes) * 100 : 0;
    if (commentRatio >= 5) score += 20;
    else if (commentRatio >= 2) score += 13;
    else score += 6;

    score = Math.min(100, score + 10); // base

    // Tier
    let tier = "Micro Influencer";
    let tierColor = "bg-blue-100 text-blue-700";
    if (score >= 85) { tier = "Top Creator"; tierColor = "bg-yellow-100 text-yellow-700"; }
    else if (score >= 70) { tier = "Power Creator"; tierColor = "bg-purple-100 text-purple-700"; }
    else if (score >= 55) { tier = "Rising Creator"; tierColor = "bg-green-100 text-green-700"; }

    // Summary
    const engLabel = engRate >= 6 ? "excepcionalmente alta" : engRate >= 3 ? "buena" : "baja";
    const summary = `Tu cuenta de Instagram muestra un engagement rate ${engLabel} del ${engRate}% con ${followers.toLocaleString()} seguidores. ${engRate >= 3
            ? "Tu audiencia está genuinamente comprometida con tu contenido, lo que te hace muy atractivo para marcas."
            : "Hay margen para aumentar la interacción publicando contenido más consistente y usando CTAs en tus captions."
        }`;

    const strengths: string[] = [];
    if (engRate >= 5) strengths.push(`Engagement rate del ${engRate}% — superior al promedio de la industria (3%)`);
    if (avgLikes > 100) strengths.push(`Promedio de ${avgLikes.toLocaleString()} likes por post indica contenido resonante`);
    if (commentRatio >= 3) strengths.push("Alta ratio de comentarios: tu audiencia tiene conversaciones reales");
    if (followers >= 1000) strengths.push(`Base de ${followers.toLocaleString()} seguidores activos en Instagram`);
    if (strengths.length === 0) strengths.push("Cuenta activa con potencial de crecimiento");

    const improvements: string[] = [];
    if (engRate < 3) improvements.push("Aumenta tu engagement publicando Reels — tienen 3× más alcance que fotos");
    if (avgComments < 10) improvements.push("Termina tus captions con una pregunta para estimular comentarios");
    if (followers < 5000) improvements.push("Colabora con otros creators de tu nicho para hacer crecer tu reach");
    if (improvements.length === 0) improvements.push("Mantén la consistencia de publicación (3-4× por semana)");

    const insights = [
        {
            label: "Engagement Rate",
            value: `${engRate}%`,
            trend: engRate >= 3 ? "up" : "down" as "up" | "down",
            note: engRate >= 6 ? "🔥 Excelente — top 10%" : engRate >= 3 ? "✅ Por encima del promedio" : "⚠️ Por debajo del promedio",
        },
        {
            label: "Avg. Likes",
            value: avgLikes.toLocaleString(),
            trend: avgLikes > 50 ? "up" : "neutral" as "up" | "neutral",
            note: `${((avgLikes / (followers || 1)) * 100).toFixed(1)}% de tus seguidores dan like`,
        },
        {
            label: "Avg. Comments",
            value: avgComments.toLocaleString(),
            trend: "neutral" as "neutral",
            note: avgComments >= 10 ? "Conversación activa" : "Baja interacción en comentarios",
        },
        {
            label: "Followers",
            value: followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : String(followers),
            trend: "up" as "up",
            note: followers >= 10000 ? "Macro influencer" : followers >= 1000 ? "Micro influencer" : "Nano influencer",
        },
    ];

    return { score, tier, tierColor, summary, strengths, improvements, insights };
}

function generateTikTokAnalysis(metrics: any, videoCount: number): {
    score: number;
    tier: string;
    tierColor: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    insights: { label: string; value: string; trend: "up" | "down" | "neutral"; note: string }[];
} {
    const followers = metrics?.followers || 0;
    const engRate = parseFloat(metrics?.engagementRate) || 0;
    const likes = metrics?.likes || 0;

    let score = 0;
    if (engRate >= 30) score += 40;
    else if (engRate >= 10) score += 28;
    else if (engRate >= 5) score += 18;
    else score += 8;

    if (followers >= 100000) score += 30;
    else if (followers >= 10000) score += 20;
    else if (followers >= 1000) score += 12;
    else score += 4;

    if (videoCount >= 20) score += 20;
    else if (videoCount >= 10) score += 13;
    else score += 6;

    score = Math.min(100, score + 8);

    let tier = "Nano Creator";
    let tierColor = "bg-blue-100 text-blue-700";
    if (score >= 85) { tier = "Viral Creator"; tierColor = "bg-red-100 text-red-700"; }
    else if (score >= 70) { tier = "Power Creator"; tierColor = "bg-purple-100 text-purple-700"; }
    else if (score >= 55) { tier = "Rising Creator"; tierColor = "bg-green-100 text-green-700"; }

    const engLabel = engRate >= 30 ? "viral" : engRate >= 10 ? "alto" : "en desarrollo";
    const summary = `Tu cuenta de TikTok tiene un engagement rate ${engLabel} del ${engRate}% — ${engRate >= 10
            ? "significativamente por encima del promedio de la plataforma (5.7%). El algoritmo de TikTok favorece este nivel de interacción, amplificando tu contenido a nuevas audiencias."
            : "TikTok premia la consistencia y el uso de tendencias. Publicar más frecuentemente y usar audios virales puede disparar tu alcance orgánico."
        }`;

    const strengths: string[] = [];
    if (engRate >= 20) strengths.push(`Engagement rate del ${engRate}% — nivel viral (promedio TikTok: 5.7%)`);
    if (likes > 100) strengths.push(`${likes.toLocaleString()} likes totales demuestran contenido con valor`);
    if (videoCount >= 10) strengths.push(`${videoCount} videos publicados — consistencia de contenido`);
    if (followers >= 500) strengths.push(`${followers.toLocaleString()} seguidores en TikTok`);
    if (strengths.length === 0) strengths.push("Cuenta activa con potencial viral en TikTok");

    const improvements: string[] = [];
    if (engRate < 10) improvements.push("Usa audios trending en las primeras 24h de lanzamiento para máximo alcance");
    if (videoCount < 10) improvements.push("Publica al menos 1 video diario — el algoritmo premia la frecuencia");
    if (followers < 1000) improvements.push("Participa en duetos y stitches con cuentas de tu nicho");
    if (improvements.length === 0) improvements.push("Experimenta con diferentes formatos: tutorials, trends, behind-the-scenes");

    const avgLikesPerVideo = videoCount > 0 ? Math.round(likes / videoCount) : 0;

    const insights = [
        {
            label: "Engagement Rate",
            value: `${engRate}%`,
            trend: engRate >= 10 ? "up" : "down" as "up" | "down",
            note: engRate >= 30 ? "🔥 Viral — top 5%" : engRate >= 10 ? "✅ Por encima del promedio" : "⚠️ En crecimiento",
        },
        {
            label: "Total Likes",
            value: likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : String(likes),
            trend: likes > 100 ? "up" : "neutral" as "up" | "neutral",
            note: `${avgLikesPerVideo} likes promedio por video`,
        },
        {
            label: "Videos",
            value: String(videoCount),
            trend: videoCount >= 10 ? "up" : "neutral" as "up" | "neutral",
            note: videoCount >= 20 ? "Creador consistente" : "Aumenta la frecuencia",
        },
        {
            label: "Followers",
            value: followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : String(followers),
            trend: "up" as "up",
            note: followers >= 10000 ? "Macro TikToker" : followers >= 1000 ? "Micro TikToker" : "Nano TikToker",
        },
    ];

    return { score, tier, tierColor, summary, strengths, improvements, insights };
}

// ── Component ─────────────────────────────────────────────────────
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
        if (user && profile?.instagramConnected) fetchCreatorPosts();
        if (user && profile?.tiktokConnected) fetchTikTokPosts();
    }, [user, profile]);

    const fetchCreatorPosts = async () => {
        setLoadingPosts(true);
        setPostError(null);
        try {
            const response = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia", { userId: user?.uid });
            if (response.data.success) setPosts(response.data.data);
            else setPostError(response.data.error || "Failed to load posts");
        } catch {
            setPostError("Could not load posts. Instagram token might be expired.");
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchTikTokPosts = async () => {
        setLoadingTikTokPosts(true);
        try {
            const response = await axios.post("https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia", { userId: user?.uid });
            if (response.data.success) setTikTokPosts(response.data.data);
        } catch {
            console.error("Error fetching TikTok posts");
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

    const igAnalysis = profile?.instagramConnected
        ? generateInstagramAnalysis(profile?.instagramMetrics)
        : null;

    const ttAnalysis = profile?.tiktokConnected
        ? generateTikTokAnalysis(profile?.tiktokMetrics, profile?.tiktokMetrics?.videoCount || tiktokPosts.length)
        : null;

    const analysis = selectedPlatform === "instagram" ? igAnalysis : ttAnalysis;

    const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) =>
        trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> :
            trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
                <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />;

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
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                        TikTok
                    </Button>
                </div>

                {!isConnected ? (
                    /* Not connected */
                    <div className="glass-card p-12 text-center rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            {selectedPlatform === "instagram"
                                ? <Instagram className="w-8 h-8 text-muted-foreground" />
                                : <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                            }
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                            {selectedPlatform === "instagram" ? "Instagram" : "TikTok"} no conectado
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                            Conecta tu cuenta para desbloquear el análisis IA de tu perfil, métricas detalladas e insights de contenido.
                        </p>
                        <Button variant="outline" asChild>
                            <a href="/creator/profile">Conectar en Perfil →</a>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* ── Profile Header ── */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                            <img
                                src={
                                    selectedPlatform === "instagram"
                                        ? (profile.instagramProfilePicture || profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.name)
                                        : (profile.tiktokAvatar || profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.name)
                                }
                                alt={profile.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold">
                                        {selectedPlatform === "instagram"
                                            ? (profile.instagramName || profile.name)
                                            : (profile.tiktokName || profile.name)}
                                    </h2>
                                    {analysis && (
                                        <Badge className={analysis.tierColor}>{analysis.tier}</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                    {selectedPlatform === "instagram"
                                        ? <Instagram className="w-4 h-4" />
                                        : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                    }
                                    <span>@{selectedPlatform === "instagram"
                                        ? (profile.instagramMetrics?.handle || profile.instagramUsername || profile.socialHandles?.instagram || "username")
                                        : (profile.socialHandles?.tiktok || "username")}
                                    </span>
                                </div>
                            </div>
                            {analysis && (
                                <div className="hidden md:flex flex-col items-center">
                                    <div className="relative w-16 h-16">
                                        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                                            <circle
                                                cx="18" cy="18" r="15.9" fill="none"
                                                stroke="currentColor" strokeWidth="2.5"
                                                strokeDasharray={`${analysis.score} ${100 - analysis.score}`}
                                                className="text-primary"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center font-black text-sm">{analysis.score}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">Score</span>
                                </div>
                            )}
                        </div>

                        {/* ── Metrics Row ── */}
                        <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                            {currentMetrics ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {analysis?.insights.map((insight) => (
                                        <div key={insight.label} className="p-4 bg-background/50 rounded-xl text-center space-y-1">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <TrendIcon trend={insight.trend} />
                                                {insight.label}
                                            </div>
                                            <p className="text-2xl font-black text-primary">{insight.value}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{insight.note}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">Métricas no disponibles aún.</p>
                            )}
                        </div>

                        {/* ── AI Analysis Card ── */}
                        {analysis && (
                            <div className="glass-card rounded-2xl overflow-hidden border border-primary/20">
                                {/* Header */}
                                <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-base">Análisis IA de tu perfil — {selectedPlatform === "instagram" ? "Instagram" : "TikTok"}</h3>
                                    <Badge variant="outline" className="ml-auto text-[10px]">AI Generado</Badge>
                                </div>

                                <div className="p-6 space-y-6">
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
                                                {analysis.strengths.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                        {s}
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
                                                {analysis.improvements.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Brand Collab Insight */}
                                    <div className="rounded-xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-start gap-3">
                                        <Heart className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Potencial con Marcas</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {analysis.score >= 70
                                                    ? `Con un score de ${analysis.score}/100 y un engagement del ${currentMetrics?.engagementRate}%, eres un perfil muy atractivo para colaboraciones de pago. Las marcas prefieren creators con alta interacción sobre grandes cuentas con baja engagement.`
                                                    : `Con un score de ${analysis.score}/100, tienes una base sólida para iniciar colaboraciones. Enfócate en aumentar tu engagement rate publicando contenido auténtico y constante.`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Recent Content ── */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                {selectedPlatform === "instagram"
                                    ? <Instagram className="w-5 h-5 text-[#E1306C]" />
                                    : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                }
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
                                            {(post.media_type === "VIDEO" || post.media_type === "REELS") && !post.thumbnail_url ? (
                                                <video
                                                    src={post.media_url}
                                                    className="w-full h-full object-cover"
                                                    muted playsInline
                                                    onMouseOver={e => e.currentTarget.play()}
                                                    onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                                />
                                            ) : (
                                                <img
                                                    src={post.thumbnail_url || post.top_image_url || post.media_url}
                                                    alt={post.caption}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={e => { e.currentTarget.src = "https://placehold.co/400x700?text=No+Image"; }}
                                                />
                                            )}

                                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full text-xs text-white backdrop-blur-sm flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {(selectedPlatform === "instagram"
                                                    ? (post.reach || post.view_count || 0)
                                                    : (post.view_count || 0)
                                                ).toLocaleString()}
                                            </div>

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end min-h-[100px]">
                                                <p className="text-white text-xs line-clamp-2 mb-2">{post.caption}</p>
                                                <div className="flex items-center gap-3 text-white/90 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3" /> {(post.like_count || 0).toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-3 h-3" /> {(post.comments_count || 0).toLocaleString()}
                                                    </span>
                                                    {post.view_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" /> {post.view_count.toLocaleString()}
                                                        </span>
                                                    )}
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
