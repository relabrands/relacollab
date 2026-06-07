import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import {
    Loader2, Instagram, ChevronDown, ChevronUp, ExternalLink,
    Clock, DollarSign, Users, TrendingUp, MessageSquare,
    ThumbsUp, Tag, MapPin, Info, Zap, LayoutGrid, BarChart2,
    Sparkles, Bookmark, Share2, Eye, Activity, Medal, CalendarDays,
    ArrowUpRight
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import {
    AreaChart, Area, Bar, BarChart, LineChart, Line,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import axios from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURLY_RATE = 2500;
const CONVERSION_RATE = 0.001;
const AVG_TICKET = 2500;
const CURRENCY = "RD$";
const ANALYZE_COMMENTS_URL = "https://us-central1-rela-collab.cloudfunctions.net/analyzeComments";

const AUTOMATION_HOURS = {
    campaignManagement: (n: number) => n * 6,
    influencerInvites:  (n: number) => Math.round(n * 0.5),
    contentCreation:    (n: number) => n * 3,
    scheduling:         (n: number) => n * 2,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMs(ts: any): number {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    if (ts.toDate) return ts.toDate().getTime();
    const n = new Date(ts).getTime();
    return isNaN(n) ? 0 : n;
}

function fmtDate(ts: any): string {
    const ms = toMs(ts);
    if (!ms) return "";
    return new Date(ms).toLocaleDateString("es-DO", { month: "short", day: "numeric", year: "numeric" });
}

function fmtShortDate(ts: any): string {
    const ms = toMs(ts);
    if (!ms) return "";
    return new Date(ms).toLocaleDateString("es-DO", { month: "short", day: "numeric" });
}

/** Score 0-100: 40% reach share + 40% engagement rate (capped at 15%) + 20% save rate (capped at 5%) */
function calcScore(creator: any, maxReach: number): number {
    const reachScore = maxReach > 0 ? (creator.reach / maxReach) * 40 : 0;
    const eng = creator.reach > 0
        ? ((creator.likes + creator.comments + creator.saved + creator.shares) / creator.reach) * 100 : 0;
    const engScore = Math.min(eng / 15, 1) * 40;
    const saveRate = creator.reach > 0 ? (creator.saved / creator.reach) * 100 : 0;
    const saveScore = Math.min(saveRate / 5, 1) * 20;
    return Math.round(reachScore + engScore + saveScore);
}

function engColor(val: number, good: number, ok: number): string {
    if (val >= good) return "text-emerald-500";
    if (val >= ok) return "text-amber-500";
    return "text-rose-500";
}

function engBg(val: number, good: number, ok: number): string {
    if (val >= good) return "bg-emerald-500/10";
    if (val >= ok) return "bg-amber-500/10";
    return "bg-rose-500/10";
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Campaign { id: string; name: string; }
interface TimelinePost {
    id: string; ts: number; dateLabel: string;
    platform: string; reach: number; likes: number; views: number;
    comments: number; saved: number; shares: number; interactions: number;
    contentUrl?: string; postUrl?: string;
    creatorName: string; creatorAvatar?: string; creatorHandle?: string;
    campaignName: string;
}

interface CommentResult {
    total: number; askingForInfo: number; positive: number;
    intentVisits: number; taggingFriends: number; other: number;
    summary: string; fetched: boolean; analyzedCount: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CumulativeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-xl text-xs space-y-1">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            {payload.map((e: any) => (
                <p key={e.name} style={{ color: e.color }}>
                    {e.name}: {Number(e.value).toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BrandAnalytics() {
    const { user } = useAuth();
    const { limits, loading: limitsLoading } = usePlanLimits();

    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("all");
    const [rawSubmissions, setRawSubmissions] = useState<any[]>([]);
    const [campMap, setCampMap] = useState<Map<string, string>>(new Map());
    const [totalInvites, setTotalInvites] = useState(0);
    const [totalApplications, setTotalApplications] = useState(0);

    const [stats, setStats] = useState({
        totalPosts: 0, totalLikes: 0, totalComments: 0, totalReach: 0,
        totalSaved: 0, totalShares: 0, totalViews: 0, totalInteractions: 0,
    });
    const [creatorPerformance, setCreatorPerformance] = useState<any[]>([]);
    const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
    const [cumulativeData, setCumulativeData] = useState<any[]>([]);

    const [commentAnalysis, setCommentAnalysis] = useState<CommentResult>({
        total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0,
        other: 0, summary: "", fetched: false, analyzedCount: 0,
    });
    const [loadingComments, setLoadingComments] = useState(false);

    const [activePlatform, setActivePlatform] = useState<"all" | "instagram" | "tiktok">("all");
    const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
    const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
    const [showAllTimeline, setShowAllTimeline] = useState(false);

    // ─── 1. Fetch raw data ────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const campSnap = await getDocs(q);
                const cMap = new Map(campSnap.docs.map(d => [d.id, d.data().name as string]));
                setCampMap(cMap);
                setCampaigns(campSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
                const ids = campSnap.docs.map(d => d.id);
                if (!ids.length) { setLoading(false); return; }

                const [subSnaps, invSnaps, appSnaps] = await Promise.all([
                    Promise.all(ids.map(id => getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id))))),
                    Promise.all(ids.map(id => getDocs(query(collection(db, "invitations"), where("campaignId", "==", id))))),
                    Promise.all(ids.map(id => getDocs(query(collection(db, "applications"), where("campaignId", "==", id))))),
                ]);

                let all: any[] = [];
                subSnaps.forEach(s => { all = [...all, ...s.docs.map(d => ({ id: d.id, ...d.data() }))]; });
                setRawSubmissions(all);

                let inv = 0; invSnaps.forEach(s => { inv += s.size; }); setTotalInvites(inv);
                let apps = 0; appSnaps.forEach(s => { apps += s.size; }); setTotalApplications(apps);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [user]);

    // ─── 2. Process filtered submissions ─────────────────────────────────
    useEffect(() => {
        if (loading) return;
        const process = async () => {
            try {
                let filtered = rawSubmissions.filter(s => s.status === "approved");
                if (selectedCampaignId !== "all") filtered = filtered.filter(s => s.campaignId === selectedCampaignId);
                if (activePlatform !== "all") {
                    filtered = filtered.filter(s =>
                        (s.platform || s.metrics?.inputPlatform || "instagram") === activePlatform
                    );
                }

                // Deduplicate by slot
                const slots = new Map<string, any>();
                filtered.forEach(s => {
                    const cId = s.userId || s.creatorId;
                    if (!cId) return;
                    const key = `${s.campaignId}_${cId}_${s.deliverableType || "d"}_${s.deliverableNumber || 0}`;
                    const ts = Math.max(toMs(s.updatedAt), toMs(s.createdAt));
                    const ex = slots.get(key);
                    if (!ex || ts > Math.max(toMs(ex.updatedAt), toMs(ex.createdAt))) slots.set(key, s);
                });
                const final = Array.from(slots.values());

                // Aggregate stats
                let tPosts = 0, tLikes = 0, tComments = 0, tReach = 0;
                let tSaved = 0, tShares = 0, tViews = 0, tInteractions = 0;
                const creatorStats: Record<string, any> = {};

                final.forEach(sub => {
                    tPosts++;
                    const m = sub.metrics || {};
                    const likes = Number(m.likes) || 0, comments = Number(m.comments) || 0;
                    const reach = Number(m.reach) || 0, saved = Number(m.saved) || 0;
                    const shares = Number(m.shares) || 0, views = Number(m.views) || 0;
                    const interactions = Number(m.interactions) || 0;
                    tLikes += likes; tComments += comments; tReach += reach;
                    tSaved += saved; tShares += shares; tViews += views; tInteractions += interactions;

                    const cKey = sub.userId || sub.creatorId || "unknown";
                    if (!creatorStats[cKey]) {
                        creatorStats[cKey] = {
                            userId: cKey, posts: 0, likes: 0, comments: 0, reach: 0,
                            saved: 0, shares: 0, views: 0, interactions: 0,
                            campaigns: new Set<string>(), individualPosts: [], postUrls: []
                        };
                    }
                    const c = creatorStats[cKey];
                    c.posts++; c.likes += likes; c.comments += comments; c.reach += reach;
                    c.saved += saved; c.shares += shares; c.views += views; c.interactions += interactions;
                    if (sub.campaignId) c.campaigns.add(campMap.get(sub.campaignId) || "Unknown");
                    c.individualPosts.push({
                        id: sub.id, campaignId: sub.campaignId,
                        campaignName: campMap.get(sub.campaignId) || "Unknown",
                        deliverableType: sub.deliverableType || "Post",
                        deliverableNumber: sub.deliverableNumber || 1,
                        likes, comments, reach, saved, shares, views, interactions,
                        contentUrl: sub.contentUrl, postUrl: sub.postUrl || sub.contentUrl,
                        platform: sub.platform || sub.metrics?.inputPlatform || "instagram",
                        approvedAt: sub.approvedAt || sub.updatedAt || sub.createdAt,
                    });
                    if (sub.postUrl || sub.contentUrl) c.postUrls.push({ url: sub.postUrl || sub.contentUrl });
                });

                setStats({ totalPosts: tPosts, totalLikes: tLikes, totalComments: tComments, totalReach: tReach, totalSaved: tSaved, totalShares: tShares, totalViews: tViews, totalInteractions: tInteractions });

                // Fetch creator profiles
                const creatorIds = Object.keys(creatorStats).filter(id => id !== "unknown");
                const profileMap: Record<string, any> = {};
                if (creatorIds.length) {
                    const snaps = await Promise.all(creatorIds.map(id => getDoc(doc(db, "users", id))));
                    snaps.forEach(s => { if (s.exists()) profileMap[s.id] = s.data(); });
                }

                const enriched = creatorIds.map(id => {
                    const pd = profileMap[id] || {};
                    return {
                        ...creatorStats[id],
                        name: pd.displayName || pd.name || "Unknown Creator",
                        avatar: pd.photoURL || pd.avatar,
                        handle: pd.instagramUsername || pd.socialHandles?.instagram || pd.socialHandles?.tiktok,
                        instagramAccessToken: pd.instagramAccessToken,
                        instagramId: pd.instagramId,
                        campaigns: Array.from(creatorStats[id].campaigns).join(", "),
                    };
                });
                setCreatorPerformance(enriched);

                // ── Build real cumulative chart ──────────────────────────
                // Gather all individual posts from all creators, attach creator name
                const allPosts: any[] = [];
                enriched.forEach(creator => {
                    creator.individualPosts.forEach((p: any) => {
                        allPosts.push({ ...p, creatorName: creator.name, creatorAvatar: creator.avatar, creatorHandle: creator.handle });
                    });
                });

                // Sort by real date ASC
                allPosts.sort((a, b) => toMs(a.approvedAt) - toMs(b.approvedAt));

                // Build timeline posts (for the timeline feed section)
                const tlPosts: TimelinePost[] = allPosts
                    .filter(p => toMs(p.approvedAt) > 0)
                    .map(p => ({
                        id: p.id,
                        ts: toMs(p.approvedAt),
                        dateLabel: fmtDate(p.approvedAt),
                        platform: p.platform,
                        reach: p.reach, likes: p.likes, views: p.views,
                        comments: p.comments, saved: p.saved, shares: p.shares, interactions: p.interactions,
                        contentUrl: p.contentUrl, postUrl: p.postUrl,
                        creatorName: p.creatorName, creatorAvatar: p.creatorAvatar, creatorHandle: p.creatorHandle,
                        campaignName: p.campaignName,
                    }));
                setTimelinePosts(tlPosts);

                // Build cumulative chart data
                let cumReach = 0, cumLikes = 0, cumViews = 0;
                const cum = allPosts
                    .filter(p => toMs(p.approvedAt) > 0)
                    .map(p => {
                        // For TikTok (no reach), use views as proxy
                        cumReach += p.platform === "tiktok" ? p.views : (p.reach || p.views || 0);
                        cumLikes += p.likes;
                        cumViews += p.views;
                        return {
                            date: fmtShortDate(p.approvedAt),
                            "Reach Acumulado": cumReach,
                            "Likes Acumulados": cumLikes,
                            "Views Acumuladas": cumViews,
                            _creator: p.creatorName,
                        };
                    });
                setCumulativeData(cum);

            } catch (err) { console.error(err); }
        };
        process();
    }, [rawSubmissions, activePlatform, selectedCampaignId, campMap, loading]);

    // ─── 3. Reset + fetch comment analysis ───────────────────────────────
    useEffect(() => {
        setCommentAnalysis({ total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0, other: 0, summary: "", fetched: false, analyzedCount: 0 });
    }, [activePlatform, selectedCampaignId]);

    useEffect(() => {
        if (loading || creatorPerformance.length === 0) return;
        if (activePlatform === "tiktok") { setCommentAnalysis(p => ({ ...p, fetched: true })); return; }

        const run = async () => {
            setLoadingComments(true);
            const texts: string[] = [];
            try {
                const igCreators = creatorPerformance.filter(c => c.instagramAccessToken && c.instagramId && c.postUrls?.length);
                for (const creator of igCreators) {
                    const { instagramAccessToken: token, instagramId: igId } = creator;
                    let mediaItems: any[] = [];
                    try {
                        const mr = await axios.get(`https://graph.facebook.com/v19.0/${igId}/media?fields=id,shortcode,permalink&limit=50&access_token=${token}`);
                        mediaItems = mr.data?.data || [];
                    } catch { continue; }

                    for (const { url } of creator.postUrls) {
                        if (!url) continue;
                        const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                        const postId = match?.[2];
                        if (!postId) continue;
                        const media = mediaItems.find((m: any) =>
                            (m.permalink?.includes(postId)) || m.shortcode === postId
                        );
                        if (!media) continue;
                        try {
                            let next: string | null = `https://graph.facebook.com/v19.0/${media.id}/comments?fields=text&limit=100&access_token=${token}`;
                            let pages = 0;
                            while (next && pages < 3) {
                                const cr = await axios.get(next);
                                (cr.data?.data || []).forEach((c: any) => { if (c.text) texts.push(c.text); });
                                next = cr.data?.paging?.next || null;
                                pages++;
                            }
                        } catch { /* permissions */ }
                    }
                }
                if (texts.length === 0) { setCommentAnalysis(p => ({ ...p, fetched: true })); return; }
                const ai = await axios.post(ANALYZE_COMMENTS_URL, { comments: texts });
                const { askingForInfo = 0, positive = 0, intentVisits = 0, taggingFriends = 0, other = 0, summary = "", analyzedCount = 0 } = ai.data;
                setCommentAnalysis({ total: texts.length, askingForInfo, positive, intentVisits, taggingFriends, other, summary, fetched: true, analyzedCount });
            } catch { setCommentAnalysis(p => ({ ...p, fetched: true })); }
            finally { setLoadingComments(false); }
        };
        run();
    }, [creatorPerformance, loading, activePlatform, selectedCampaignId]);

    // ─── 4. Derived metrics ───────────────────────────────────────────────
    const impactMetrics = useMemo(() => {
        const n = creatorPerformance.length;
        const campaignMgmt = AUTOMATION_HOURS.campaignManagement(n);
        const invites = AUTOMATION_HOURS.influencerInvites(totalInvites + totalApplications);
        const contentCreation = AUTOMATION_HOURS.contentCreation(n);
        const scheduling = AUTOMATION_HOURS.scheduling(n);
        const timeSaved = campaignMgmt + invites + contentCreation + scheduling;
        const moneySaved = timeSaved * HOURLY_RATE;
        const newCustomers = Math.round(stats.totalReach * CONVERSION_RATE);
        const estimatedSales = newCustomers * AVG_TICKET;
        return { timeSaved, moneySaved, newCustomers, estimatedSales, campaignMgmt, invites, contentCreation, scheduling };
    }, [creatorPerformance, stats.totalReach, totalInvites, totalApplications]);

    const engagementMetrics = useMemo(() => {
        const { totalReach: r, totalLikes: l, totalComments: c, totalSaved: sv, totalShares: sh } = stats;
        if (r === 0) return { engagementRate: 0, saveRate: 0, commentRate: 0, viralityScore: 0 };
        return {
            engagementRate: ((l + c + sv + sh) / r) * 100,
            saveRate: (sv / r) * 100,
            commentRate: (c / r) * 100,
            viralityScore: (sh / r) * 100,
        };
    }, [stats]);

    const leaderboard = useMemo(() => {
        const maxReach = Math.max(...creatorPerformance.map(c => c.reach), 1);
        return [...creatorPerformance]
            .map(c => ({ ...c, score: calcScore(c, maxReach), engRate: c.reach > 0 ? ((c.likes + c.comments + c.saved + c.shares) / c.reach) * 100 : 0 }))
            .sort((a, b) => b.score - a.score);
    }, [creatorPerformance]);

    const toggleCreator = (id: string) => {
        setExpandedCreators(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    // ─── Plan gate ────────────────────────────────────────────────────────
    if (loading || limitsLoading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    if (!limits.analyticsEnabled) return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" /><MobileNav type="brand" />
            <main className="flex-1 ml-0 md:ml-64 p-8 flex items-center justify-center">
                <div className="max-w-md p-8 border border-border/50 rounded-2xl bg-card text-center space-y-4">
                    <BarChart2 className="w-10 h-10 text-primary mx-auto" />
                    <h2 className="text-xl font-bold">Analíticas Avanzadas Bloqueadas</h2>
                    <p className="text-muted-foreground text-sm">Disponible en planes superiores.</p>
                    <Button className="w-full bg-primary text-white" onClick={() => window.open("https://buy.stripe.com/test_8wM8xm0o3eJmaT66oo", "_blank")}>
                        Mejorar a Plan Growth
                    </Button>
                </div>
            </main>
        </div>
    );

    const selectedCampaignName = selectedCampaignId === "all" ? "Todas las Campañas" : (campMap.get(selectedCampaignId) || "Campaña");
    const visibleTimeline = showAllTimeline ? timelinePosts : timelinePosts.slice(0, 4);

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" /><MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 space-y-8">

                <DashboardHeader title="Analytics" subtitle="Impacto real de tus campañas de influencer marketing" />

                {/* ── Filters ── */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Campaign Dropdown */}
                    <div className="relative">
                        <Button variant="outline" size="sm" className="text-xs rounded-xl pr-3 pl-4 border-border/60 gap-2"
                            onClick={() => setShowCampaignDropdown(v => !v)}>
                            <span className="font-medium truncate max-w-[160px]">{selectedCampaignName}</span>
                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        </Button>
                        {showCampaignDropdown && (
                            <div className="absolute z-50 top-full mt-1 left-0 min-w-[220px] bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
                                {[{ id: "all", name: "Todas las Campañas" }, ...campaigns].map(c => (
                                    <button key={c.id}
                                        onClick={() => { setSelectedCampaignId(c.id); setShowCampaignDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors ${selectedCampaignId === c.id ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform Tabs */}
                    {(["all", "instagram", "tiktok"] as const).map(p => (
                        <Button key={p} variant={activePlatform === p ? "default" : "outline"}
                            onClick={() => setActivePlatform(p)} size="sm" className="text-xs rounded-full">
                            {p === "instagram" && <Instagram className="w-3.5 h-3.5 mr-1.5" />}
                            {p === "all" ? "All Platforms" : p === "instagram" ? "Instagram" : "TikTok"}
                        </Button>
                    ))}
                </div>

                {/* ══ SECTION 1 — Impact Summary ══ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" /> Campaign Impact Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "Time Saved", icon: Clock, value: `${impactMetrics.timeSaved.toLocaleString()} hrs`, note: "horas de trabajo automatizado" },
                                { label: "Money Saved", icon: DollarSign, value: `${CURRENCY}${impactMetrics.moneySaved.toLocaleString()}`, note: `a ${CURRENCY}${HOURLY_RATE.toLocaleString()}/hr` },
                                { label: "New Customers", icon: Users, value: impactMetrics.newCustomers.toLocaleString(), note: "est. 0.1% del alcance" },
                                { label: "Estimated Sales", icon: TrendingUp, value: `${CURRENCY}${impactMetrics.estimatedSales.toLocaleString()}`, note: `ticket prom. ${CURRENCY}${AVG_TICKET.toLocaleString()}` },
                            ].map(({ label, icon: Icon, value, note }) => (
                                <div key={label} className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}</div>
                                    <div className="text-2xl md:text-3xl font-black tracking-tight">{value}</div>
                                    <div className="text-[10px] text-muted-foreground">{note}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ══ SECTION 2 — Cumulative Performance Over Time (REAL DATES) ══ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Cumulative Performance Over Time
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {cumulativeData.length > 0
                                        ? `Acumulativo real desde ${cumulativeData[0]?.date} — cada punto = un contenido aprobado`
                                        : "Sin datos aún — aprueba contenido para ver la evolución real"}
                                </p>
                            </div>
                            {cumulativeData.length > 0 && (
                                <div className="flex gap-4 shrink-0">
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Reach Total</div>
                                        <div className="text-sm font-bold text-emerald-500">{stats.totalReach.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Views Total</div>
                                        <div className="text-sm font-bold text-indigo-400">{stats.totalViews.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {cumulativeData.length === 0 ? (
                            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                                <div className="text-center space-y-2">
                                    <Activity className="w-8 h-8 mx-auto opacity-30" />
                                    <p>Aprueba contenido de creadores para ver la evolución real</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={cumulativeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(152 69% 45%)" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(243 75% 65%)" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="hsl(243 75% 65%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(35 90% 55%)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(35 90% 55%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                                    <Tooltip content={<CumulativeTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                        formatter={v => <span className="text-muted-foreground">{v}</span>} />
                                    <Area type="monotone" dataKey="Reach Acumulado" stroke="hsl(152 69% 45%)" strokeWidth={2.5} fill="url(#gReach)" dot={{ r: 5, fill: "hsl(152 69% 45%)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    <Area type="monotone" dataKey="Likes Acumulados" stroke="hsl(243 75% 65%)" strokeWidth={2} fill="url(#gLikes)" dot={{ r: 4, fill: "hsl(243 75% 65%)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    <Area type="monotone" dataKey="Views Acumuladas" stroke="hsl(35 90% 55%)" strokeWidth={2} fill="url(#gViews)" dot={{ r: 4, fill: "hsl(35 90% 55%)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ══ SECTION 3 — Engagement Intelligence ══ */}
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> Engagement Intelligence
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Engagement Rate", icon: ThumbsUp,
                                value: `${engagementMetrics.engagementRate.toFixed(2)}%`,
                                note: engagementMetrics.engagementRate >= 5 ? "⭐ Excelente" : engagementMetrics.engagementRate >= 1 ? "Bueno (ref: 1-3%)" : "Por debajo del benchmark",
                                good: 5, ok: 1, raw: engagementMetrics.engagementRate,
                            },
                            {
                                label: "Save Rate", icon: Bookmark,
                                value: `${engagementMetrics.saveRate.toFixed(2)}%`,
                                note: engagementMetrics.saveRate >= 2 ? "⭐ Contenido de alto valor" : engagementMetrics.saveRate >= 0.5 ? "Promedio sector" : "Baja retención",
                                good: 2, ok: 0.5, raw: engagementMetrics.saveRate,
                            },
                            {
                                label: "Comment Rate", icon: MessageSquare,
                                value: `${engagementMetrics.commentRate.toFixed(2)}%`,
                                note: engagementMetrics.commentRate >= 1 ? "⭐ Alta conversación" : engagementMetrics.commentRate >= 0.3 ? "Conversación activa" : "Audiencia pasiva",
                                good: 1, ok: 0.3, raw: engagementMetrics.commentRate,
                            },
                            {
                                label: "Virality Score", icon: Share2,
                                value: `${engagementMetrics.viralityScore.toFixed(2)}%`,
                                note: engagementMetrics.viralityScore >= 0.5 ? "⭐ Alta difusión orgánica" : engagementMetrics.viralityScore >= 0.1 ? "Difusión normal" : "Difusión baja",
                                good: 0.5, ok: 0.1, raw: engagementMetrics.viralityScore,
                            },
                        ].map(({ label, icon: Icon, value, note, good, ok, raw }) => (
                            <Card key={label} className="border-border/40 shadow-sm">
                                <CardContent className="pt-5 pb-4">
                                    <div className={`w-9 h-9 rounded-xl ${engBg(raw, good, ok)} flex items-center justify-center mb-3`}>
                                        <Icon className={`w-4.5 h-4.5 ${engColor(raw, good, ok)}`} />
                                    </div>
                                    <div className={`text-2xl font-black tracking-tight ${engColor(raw, good, ok)}`}>{value}</div>
                                    <div className="text-xs font-semibold mt-1">{label}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">{note}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* ══ SECTION 4 — Content Publication Timeline (CEO-ready) ══ */}
                {timelinePosts.length > 0 && (
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-primary" />
                                        Content Publication Timeline
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Cada publicación aprobada con métricas reales en tiempo real
                                    </p>
                                </div>
                                <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
                                    {timelinePosts.length} {timelinePosts.length === 1 ? "publicación" : "publicaciones"}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {visibleTimeline.map((post, idx) => (
                                <div key={post.id || idx}
                                    className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group">
                                    {/* Date column */}
                                    <div className="shrink-0 text-center w-16">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {new Date(post.ts).toLocaleDateString("es-DO", { month: "short" })}
                                        </div>
                                        <div className="text-2xl font-black leading-none">
                                            {new Date(post.ts).getDate()}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {new Date(post.ts).getFullYear()}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px bg-border/50 shrink-0" />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Creator + platform */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {post.creatorAvatar && (
                                                <img src={post.creatorAvatar} className="w-6 h-6 rounded-full object-cover" alt={post.creatorName} />
                                            )}
                                            <span className="font-semibold text-sm">{post.creatorName}</span>
                                            <span className="text-muted-foreground text-xs">@{post.creatorHandle}</span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${post.platform === "tiktok" ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-400"}`}>
                                                {post.platform === "tiktok" ? "TikTok" : "Instagram"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">{post.campaignName}</span>
                                        </div>

                                        {/* Metrics row */}
                                        <div className="flex flex-wrap gap-3 text-xs">
                                            {[
                                                { icon: Eye, label: "Views", value: post.views, color: "text-indigo-400" },
                                                { icon: Users, label: "Reach", value: post.reach, color: "text-emerald-500" },
                                                { icon: ThumbsUp, label: "Likes", value: post.likes, color: "text-pink-500" },
                                                { icon: MessageSquare, label: "Comments", value: post.comments, color: "text-primary" },
                                                { icon: Bookmark, label: "Saved", value: post.saved, color: "text-purple-500" },
                                                { icon: Share2, label: "Shares", value: post.shares, color: "text-orange-500" },
                                            ].filter(m => m.value > 0).map(({ icon: MIcon, label, value, color }) => (
                                                <div key={label} className="flex items-center gap-1">
                                                    <MIcon className={`w-3 h-3 ${color}`} />
                                                    <span className="font-semibold">{value.toLocaleString()}</span>
                                                    <span className="text-muted-foreground">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Link */}
                                    {(post.contentUrl || post.postUrl) && (
                                        <a href={post.postUrl || post.contentUrl} target="_blank" rel="noopener noreferrer"
                                            className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                                <ArrowUpRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </a>
                                    )}
                                </div>
                            ))}

                            {timelinePosts.length > 4 && (
                                <button onClick={() => setShowAllTimeline(v => !v)}
                                    className="w-full py-2.5 text-xs text-primary font-medium hover:bg-primary/5 rounded-xl border border-dashed border-border/50 transition-colors">
                                    {showAllTimeline ? "Ver menos" : `Ver ${timelinePosts.length - 4} publicaciones más`}
                                </button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ══ SECTION 5 — Performance Metrics (8 cards) ══ */}
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" /> Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Posts", value: stats.totalPosts, color: "text-foreground" },
                            { label: "Total Views", value: stats.totalViews.toLocaleString(), color: "text-indigo-500" },
                            { label: "Total Reach", value: stats.totalReach.toLocaleString(), color: "text-blue-500" },
                            { label: "Total Interactions", value: stats.totalInteractions.toLocaleString(), color: "text-teal-500" },
                            { label: "Total Likes", value: stats.totalLikes.toLocaleString(), color: "text-pink-500" },
                            { label: "Total Comments", value: stats.totalComments.toLocaleString(), color: "text-primary" },
                            { label: "Total Saved", value: stats.totalSaved.toLocaleString(), color: "text-purple-500" },
                            { label: "Total Shares", value: stats.totalShares.toLocaleString(), color: "text-orange-500" },
                        ].map(({ label, value, color }) => (
                            <Card key={label} className="border-border/40 shadow-sm hover:border-border/60 transition-colors">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
                                <CardContent><div className={`text-2xl font-bold ${color}`}>{value}</div></CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* ══ SECTION 6 — Comment Analysis (AI) ══ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Comment Analysis
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                        <Sparkles className="w-2.5 h-2.5" /> AI Powered
                                    </span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {commentAnalysis.fetched && commentAnalysis.analyzedCount > 0
                                        ? `Gemini clasificó ${commentAnalysis.analyzedCount} comentarios reales`
                                        : "Análisis de intención y sentimiento de la audiencia"}
                                </p>
                            </div>
                            <div className="text-right">
                                {loadingComments ? (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando con IA...
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-2xl font-black">{stats.totalComments}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Comments</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                        {commentAnalysis.fetched && commentAnalysis.summary && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                                <p className="text-xs text-foreground leading-relaxed">
                                    <span className="font-semibold text-primary">Resumen IA: </span>
                                    {commentAnalysis.summary}
                                </p>
                            </div>
                        )}
                        {(() => {
                            const real = stats.totalComments;
                            const sample = commentAnalysis.total;
                            const scale = (n: number) => sample > 0 ? Math.round(real * (n / sample)) : 0;
                            const cats = [
                                { key: "askingForInfo", label: "Asking for Info", count: scale(commentAnalysis.askingForInfo), icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { key: "positive", label: "Positive", count: scale(commentAnalysis.positive), icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                { key: "intentVisits", label: "Intent Visits", count: scale(commentAnalysis.intentVisits), icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
                                { key: "taggingFriends", label: "Tagging Friends", count: scale(commentAnalysis.taggingFriends), icon: Tag, color: "text-violet-500", bg: "bg-violet-500/10" },
                            ];
                            return (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {cats.map(({ key, label, count, icon: Icon, color, bg }) => {
                                        const pct = real > 0 ? ((count / real) * 100).toFixed(1) : "0.0";
                                        return (
                                            <div key={key} className="rounded-xl border border-border/40 p-4 hover:border-border/70 transition-colors">
                                                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                                                    <Icon className={`w-4 h-4 ${color}`} />
                                                </div>
                                                <div className="text-2xl font-black">{loadingComments ? "—" : count.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{loadingComments ? "—" : `${pct}%`}</div>
                                                <div className="text-xs font-medium mt-1">{label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {commentAnalysis.fetched && commentAnalysis.total === 0 && stats.totalComments > 0 && activePlatform !== "tiktok" && (
                            <p className="text-xs text-muted-foreground text-center pt-2">No se pudo acceder al texto de comentarios vía API (requiere <code>instagram_manage_comments</code>).</p>
                        )}
                        {activePlatform === "tiktok" && (
                            <p className="text-xs text-muted-foreground text-center pt-2">Análisis de comentarios no disponible para TikTok.</p>
                        )}
                    </CardContent>
                </Card>

                {/* ══ SECTION 7 — Creator Leaderboard ══ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Medal className="w-4 h-4 text-primary" /> Creator Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {leaderboard.length > 0 ? (
                            <div className="w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-muted/30 text-muted-foreground text-xs border-b border-border/30">
                                            <th className="px-4 py-3 w-10">#</th>
                                            <th className="px-4 py-3" />
                                            <th className="px-4 py-3">Creator</th>
                                            <th className="px-4 py-3">Campaña</th>
                                            <th className="px-4 py-3 text-right">Posts</th>
                                            <th className="px-4 py-3 text-right">Views</th>
                                            <th className="px-4 py-3 text-right">Reach</th>
                                            <th className="px-4 py-3 text-right">Likes</th>
                                            <th className="px-4 py-3 text-right">Eng%</th>
                                            <th className="px-4 py-3 text-right">Saved</th>
                                            <th className="px-4 py-3 text-right">Shares</th>
                                            <th className="px-4 py-3 text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((item, rank) => (
                                            <React.Fragment key={item.userId}>
                                                <tr className={`border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors ${expandedCreators.has(item.userId) ? "bg-muted/10" : ""}`}
                                                    onClick={() => toggleCreator(item.userId)}>
                                                    <td className="px-4 py-3 font-bold text-muted-foreground">
                                                        {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : rank + 1}
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        {item.individualPosts.length > 1 && (
                                                            expandedCreators.has(item.userId)
                                                                ? <ChevronUp className="w-4 h-4 text-primary" />
                                                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                                                                {item.avatar && <img src={item.avatar} className="w-full h-full object-cover" alt={item.name} />}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-sm">{item.name}</div>
                                                                <div className="text-xs text-muted-foreground">@{item.handle}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{item.campaigns}</td>
                                                    <td className="px-4 py-3 text-right">{item.posts}</td>
                                                    <td className="px-4 py-3 text-right text-indigo-400">{item.views?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">{item.reach?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-500 font-medium">{item.likes.toLocaleString()}</td>
                                                    <td className={`px-4 py-3 text-right font-semibold ${engColor(item.engRate, 5, 1)}`}>{item.engRate.toFixed(1)}%</td>
                                                    <td className="px-4 py-3 text-right">{item.saved?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">{item.shares?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-black text-sm ${item.score >= 70 ? "text-emerald-500" : item.score >= 40 ? "text-amber-500" : "text-muted-foreground"}`}>
                                                            {item.score}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">/100</span>
                                                    </td>
                                                </tr>
                                                {expandedCreators.has(item.userId) && (
                                                    <tr className="bg-muted/5">
                                                        <td colSpan={12} className="px-8 py-4">
                                                            <div className="border border-border/40 rounded-xl bg-card/50 overflow-hidden">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="bg-muted/20 text-muted-foreground border-b border-border/30">
                                                                            <th className="px-4 py-2 text-left">Deliverable</th>
                                                                            <th className="px-4 py-2 text-left">Fecha</th>
                                                                            <th className="px-4 py-2 text-right">Views</th>
                                                                            <th className="px-4 py-2 text-right">Likes</th>
                                                                            <th className="px-4 py-2 text-right">Comments</th>
                                                                            <th className="px-4 py-2 text-right">Saved</th>
                                                                            <th className="px-4 py-2 text-right">Ver</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {item.individualPosts.map((p: any, idx: number) => (
                                                                            <tr key={p.id || idx} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                                                                <td className="px-4 py-2">
                                                                                    <div className="font-medium text-primary/80">{p.deliverableType} #{p.deliverableNumber}</div>
                                                                                    <div className="text-[10px] text-muted-foreground uppercase">{p.platform}</div>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-muted-foreground">{fmtShortDate(p.approvedAt)}</td>
                                                                                <td className="px-4 py-2 text-right">{p.views?.toLocaleString() || 0}</td>
                                                                                <td className="px-4 py-2 text-right text-emerald-500">{p.likes.toLocaleString()}</td>
                                                                                <td className="px-4 py-2 text-right">{p.comments.toLocaleString()}</td>
                                                                                <td className="px-4 py-2 text-right">{p.saved?.toLocaleString() || 0}</td>
                                                                                <td className="px-4 py-2 text-right">
                                                                                    {(p.postUrl || p.contentUrl) && (
                                                                                        <a href={p.postUrl || p.contentUrl} target="_blank" rel="noopener noreferrer"
                                                                                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                                                                                            Ver <ExternalLink className="w-2.5 h-2.5" />
                                                                                        </a>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">
                                    {selectedCampaignId !== "all"
                                        ? `No hay contenido aprobado en "${selectedCampaignName}".`
                                        : "No creator data available yet. Launch a campaign to see results!"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
