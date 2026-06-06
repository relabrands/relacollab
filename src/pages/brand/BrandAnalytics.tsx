import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import {
    Loader2, Instagram, ChevronDown, ChevronUp, ExternalLink,
    Clock, DollarSign, Users, TrendingUp, MessageSquare,
    ThumbsUp, Tag, MapPin, Info, Zap, LayoutGrid, BarChart2, Sparkles
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import {
    AreaChart, Area, Bar, BarChart, ResponsiveContainer,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import axios from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURLY_RATE = 2500;          // RD$2,500 / hour
const CONVERSION_RATE = 0.001;     // 0.1% social → customer
const AVG_TICKET = 2500;           // RD$2,500 average ticket
const CURRENCY = "RD$";

// URL of the deployed analyzeComments Cloud Function
const ANALYZE_COMMENTS_URL = "https://us-central1-rela-collab.cloudfunctions.net/analyzeComments";

// Hours saved per automated activity (returns 0 if no real data)
const AUTOMATION_HOURS = {
    campaignManagement: (n: number) => n * 6,
    influencerInvites:  (n: number) => Math.round(n * 0.5),
    contentCreation:    (n: number) => n * 3,
    scheduling:         (n: number) => n * 2,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign { id: string; name: string; }

interface CommentAnalysisResult {
    total: number;
    askingForInfo: number;
    positive: number;
    intentVisits: number;
    taggingFriends: number;
    other: number;
    summary: string;
    fetched: boolean;
    analyzedCount: number;
}

// ─── Time-series chart data ───────────────────────────────────────────────────
function buildAreaChartData(totalReach: number, timeSaved: number) {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const totalRevenue = Math.round(totalReach * CONVERSION_RATE * AVG_TICKET);
    const totalTimeSavedValue = timeSaved * HOURLY_RATE;
    return months.map((month, i) => {
        const curve = Math.pow((i + 1) / months.length, 1.4);
        return {
            month,
            revenue: Math.round(totalRevenue * curve),
            timeSavedValue: Math.round(totalTimeSavedValue * curve),
        };
    });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg text-sm">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((e: any) => (
                <p key={e.name} style={{ color: e.color }} className="text-xs">
                    {e.name}: {CURRENCY}{e.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BrandAnalytics() {
    const { user } = useAuth();
    const { limits, loading: limitsLoading } = usePlanLimits();

    // ── Data state ──
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [rawSubmissions, setRawSubmissions] = useState<any[]>([]);
    const [campMap, setCampMap] = useState<Map<string, string>>(new Map());
    const [totalInvites, setTotalInvites] = useState(0);
    const [totalApplications, setTotalApplications] = useState(0);
    const [stats, setStats] = useState({
        totalPosts: 0, totalLikes: 0, totalComments: 0, totalReach: 0,
        totalSaved: 0, totalShares: 0, totalViews: 0, totalInteractions: 0
    });
    const [creatorPerformance, setCreatorPerformance] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    // ── Comment analysis state ──
    const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysisResult>({
        total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0,
        other: 0, summary: "", fetched: false, analyzedCount: 0
    });
    const [loadingComments, setLoadingComments] = useState(false);

    // ── UI state ──
    const [activePlatform, setActivePlatform] = useState<"all" | "instagram" | "tiktok">("all");
    const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
    const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);

    // ─── 1. Fetch campaigns + submissions + invitations ────────────────────
    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const campaignSnapshot = await getDocs(q);
                const campaignIds = campaignSnapshot.docs.map(d => d.id);
                const cMap = new Map(campaignSnapshot.docs.map(d => [d.id, d.data().name as string]));
                setCampMap(cMap);
                setCampaigns(campaignSnapshot.docs.map(d => ({ id: d.id, name: d.data().name })));

                if (campaignIds.length === 0) { setLoading(false); return; }

                const [submissionSnaps, inviteSnaps, appSnaps] = await Promise.all([
                    Promise.all(campaignIds.map(id =>
                        getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
                    )),
                    Promise.all(campaignIds.map(id =>
                        getDocs(query(collection(db, "invitations"), where("campaignId", "==", id)))
                    )),
                    Promise.all(campaignIds.map(id =>
                        getDocs(query(collection(db, "applications"), where("campaignId", "==", id)))
                    )),
                ]);

                let allSubs: any[] = [];
                submissionSnaps.forEach(snap => {
                    allSubs = [...allSubs, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
                });
                setRawSubmissions(allSubs);

                let inv = 0; inviteSnaps.forEach(s => { inv += s.size; }); setTotalInvites(inv);
                let apps = 0; appSnaps.forEach(s => { apps += s.size; }); setTotalApplications(apps);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // ─── 2. Process submissions when filters change ────────────────────────
    useEffect(() => {
        if (loading) return;
        const process = async () => {
            try {
                let filtered = rawSubmissions.filter(s => s.status === "approved");

                // Campaign filter
                if (selectedCampaignId !== "all") {
                    filtered = filtered.filter(s => s.campaignId === selectedCampaignId);
                }

                // Platform filter
                if (activePlatform !== "all") {
                    filtered = filtered.filter(s =>
                        (s.platform || s.metrics?.inputPlatform || "instagram") === activePlatform
                    );
                }

                // Deduplicate by slot (latest wins)
                const slotsMap = new Map<string, any>();
                filtered.forEach(s => {
                    const creatorId = s.userId || s.creatorId;
                    if (!creatorId) return;
                    const key = `${s.campaignId}_${creatorId}_${s.deliverableType || "d"}_${s.deliverableNumber || 0}`;
                    const getTs = (obj: any): number => {
                        if (!obj) return 0;
                        if (typeof obj.toMillis === "function") return obj.toMillis();
                        if (obj.seconds) return obj.seconds * 1000;
                        if (obj.toDate) return obj.toDate().getTime();
                        return new Date(obj).getTime() || 0;
                    };
                    const ts = Math.max(getTs(s.updatedAt), getTs(s.createdAt));
                    const ex = slotsMap.get(key);
                    const exTs = ex ? Math.max(getTs(ex.updatedAt), getTs(ex.createdAt)) : -1;
                    if (!ex || ts > exTs) slotsMap.set(key, s);
                });

                const final = Array.from(slotsMap.values());
                let tPosts = 0, tLikes = 0, tComments = 0, tReach = 0;
                let tSaved = 0, tShares = 0, tViews = 0, tInteractions = 0;
                const creatorStats: Record<string, any> = {};

                for (const sub of final) {
                    tPosts++;
                    const m = sub.metrics || {};
                    const likes = Number(m.likes) || 0;
                    const comments = Number(m.comments) || 0;
                    const reach = Number(m.reach) || 0;
                    const saved = Number(m.saved) || 0;
                    const shares = Number(m.shares) || 0;
                    const views = Number(m.views) || 0;
                    const interactions = Number(m.interactions) || 0;

                    tLikes += likes; tComments += comments; tReach += reach;
                    tSaved += saved; tShares += shares; tViews += views; tInteractions += interactions;

                    const cKey = sub.userId || sub.creatorId || "unknown";
                    if (!creatorStats[cKey]) {
                        creatorStats[cKey] = {
                            userId: cKey, posts: 0, likes: 0, comments: 0,
                            reach: 0, saved: 0, shares: 0, views: 0, interactions: 0,
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
                        contentUrl: sub.contentUrl,
                        platform: sub.platform || sub.metrics?.inputPlatform || "instagram",
                        postUrl: sub.postUrl || sub.contentUrl || null,
                    });
                    if (sub.postUrl || sub.contentUrl) {
                        c.postUrls.push({ url: sub.postUrl || sub.contentUrl });
                    }
                }

                setStats({ totalPosts: tPosts, totalLikes: tLikes, totalComments: tComments, totalReach: tReach, totalSaved: tSaved, totalShares: tShares, totalViews: tViews, totalInteractions: tInteractions });

                // Enrich creators with profiles
                const creatorIds = Object.keys(creatorStats).filter(id => id !== "unknown");
                if (creatorIds.length > 0) {
                    const snaps = await Promise.all(creatorIds.map(id => getDoc(doc(db, "users", id))));
                    const enriched = creatorIds.map(id => {
                        const profile = snaps.find(s => s.id === id);
                        const pd = profile?.data() as any || {};
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
                } else {
                    setCreatorPerformance([]);
                }

                // Chart data
                const campGroups: Record<string, any> = {};
                final.forEach(sub => {
                    if (!sub.campaignId) return;
                    if (!campGroups[sub.campaignId]) {
                        campGroups[sub.campaignId] = { name: campMap.get(sub.campaignId) || "Unknown", likes: 0, posts: 0 };
                    }
                    campGroups[sub.campaignId].likes += (sub.metrics?.likes || 0);
                    campGroups[sub.campaignId].posts++;
                });
                setChartData(Object.values(campGroups).map((c: any) => ({
                    name: String(c.name).substring(0, 14),
                    likes: Number(c.likes) || 0,
                    posts: Number(c.posts) || 0,
                })));

            } catch (err) {
                console.error("Process error:", err);
            }
        };
        process();
    }, [rawSubmissions, activePlatform, selectedCampaignId, campMap, loading]);

    // ─── 3. Reset comment analysis on filter changes ───────────────────────
    useEffect(() => {
        setCommentAnalysis({ total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0, other: 0, summary: "", fetched: false, analyzedCount: 0 });
    }, [activePlatform, selectedCampaignId]);

    // ─── 4. Fetch real comments + AI analysis ─────────────────────────────
    useEffect(() => {
        if (loading || creatorPerformance.length === 0) return;

        // TikTok: no comment text API available
        if (activePlatform === "tiktok") {
            setCommentAnalysis(prev => ({ ...prev, fetched: true }));
            return;
        }

        const fetchAndAnalyze = async () => {
            setLoadingComments(true);
            const allCommentTexts: string[] = [];

            try {
                // Only Instagram creators with tokens
                const igCreators = creatorPerformance.filter(c => c.instagramAccessToken && c.instagramId && c.postUrls?.length);
                for (const creator of igCreators) {
                    const { instagramAccessToken: token, instagramId: igId } = creator;

                    // Fetch media list for this creator
                    let mediaItems: any[] = [];
                    try {
                        const mr = await axios.get(
                            `https://graph.facebook.com/v19.0/${igId}/media?fields=id,shortcode,permalink&limit=50&access_token=${token}`
                        );
                        mediaItems = mr.data?.data || [];
                    } catch { continue; }

                    // For each approved post, fetch comments (paginate up to 200)
                    for (const { url } of creator.postUrls) {
                        if (!url) continue;
                        const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                        const postId = match ? match[2] : null;
                        if (!postId) continue;

                        const media = mediaItems.find((m: any) =>
                            (m.permalink && m.permalink.includes(postId)) ||
                            (m.shortcode && m.shortcode === postId)
                        );
                        if (!media) continue;

                        try {
                            let nextUrl: string | null = `https://graph.facebook.com/v19.0/${media.id}/comments?fields=text&limit=100&access_token=${token}`;
                            let pages = 0;
                            while (nextUrl && pages < 3) {
                                const cr = await axios.get(nextUrl);
                                const batch: any[] = cr.data?.data || [];
                                batch.forEach(c => { if (c.text) allCommentTexts.push(c.text); });
                                nextUrl = cr.data?.paging?.next || null;
                                pages++;
                            }
                        } catch { /* permissions issue — skip */ }
                    }
                }

                if (allCommentTexts.length === 0) {
                    setCommentAnalysis(prev => ({ ...prev, fetched: true }));
                    setLoadingComments(false);
                    return;
                }

                // ── Call AI Cloud Function ──
                const aiRes = await axios.post(ANALYZE_COMMENTS_URL, { comments: allCommentTexts });
                const { askingForInfo = 0, positive = 0, intentVisits = 0, taggingFriends = 0, other = 0, summary = "", analyzedCount = 0 } = aiRes.data;

                setCommentAnalysis({
                    total: allCommentTexts.length,
                    askingForInfo, positive, intentVisits, taggingFriends, other, summary,
                    fetched: true, analyzedCount,
                });
            } catch (err) {
                console.warn("Comment AI analysis error:", err);
                setCommentAnalysis(prev => ({ ...prev, fetched: true }));
            } finally {
                setLoadingComments(false);
            }
        };

        fetchAndAnalyze();
    }, [creatorPerformance, loading, activePlatform, selectedCampaignId]);

    // ─── 5. Derived impact metrics ────────────────────────────────────────
    const impactMetrics = useMemo(() => {
        const n = creatorPerformance.length; // 0 if no creators → 0 hours
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

    const areaChartData = useMemo(() =>
        buildAreaChartData(stats.totalReach, impactMetrics.timeSaved),
        [stats.totalReach, impactMetrics.timeSaved]
    );

    const toggleCreator = (id: string) => {
        setExpandedCreators(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─── Loading / Plan Gate ──────────────────────────────────────────────
    if (loading || limitsLoading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    if (!limits.analyticsEnabled) {
        return (
            <div className="flex min-h-screen bg-background">
                <DashboardSidebar type="brand" />
                <MobileNav type="brand" />
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
    }

    const selectedCampaignName = selectedCampaignId === "all" ? "Todas las Campañas" : (campMap.get(selectedCampaignId) || "Campaña");

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 space-y-8">

                {/* ── Header ── */}
                <DashboardHeader title="Analytics" subtitle="Rendimiento real de tus campañas" />

                {/* ══ FILTERS: Campaign Selector + Platform Tabs ══ */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Campaign Dropdown */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs rounded-xl pr-8 pl-4 border-border/60"
                            onClick={() => setShowCampaignDropdown(v => !v)}
                        >
                            <span className="font-medium truncate max-w-[160px]">{selectedCampaignName}</span>
                            <ChevronDown className="w-3.5 h-3.5 ml-2 shrink-0" />
                        </Button>
                        {showCampaignDropdown && (
                            <div className="absolute z-50 top-full mt-1 left-0 min-w-[220px] bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
                                {[{ id: "all", name: "Todas las Campañas" }, ...campaigns].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedCampaignId(c.id); setShowCampaignDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors ${selectedCampaignId === c.id ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform Tabs */}
                    <div className="flex gap-2">
                        {[
                            { label: "All Platforms", value: "all" },
                            { label: "Instagram", value: "instagram" },
                            { label: "TikTok", value: "tiktok" },
                        ].map(p => (
                            <Button
                                key={p.value}
                                variant={activePlatform === p.value ? "default" : "outline"}
                                onClick={() => setActivePlatform(p.value as any)}
                                size="sm"
                                className="text-xs rounded-full"
                            >
                                {p.value === "instagram" && <Instagram className="w-3.5 h-3.5 mr-1.5" />}
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 1 — Campaign Impact Summary (4 KPIs)
                ══════════════════════════════════════════════════════════ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Campaign Impact Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />Time Saved</div>
                                <div className="text-3xl font-black tracking-tight">
                                    {impactMetrics.timeSaved.toLocaleString()}
                                    <span className="text-base font-medium text-muted-foreground ml-1">hrs</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign className="w-3.5 h-3.5" />Money Saved</div>
                                <div className="text-3xl font-black tracking-tight">{CURRENCY}{impactMetrics.moneySaved.toLocaleString()}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" />New Customers</div>
                                <div className="text-3xl font-black tracking-tight">{impactMetrics.newCustomers.toLocaleString()}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="w-3.5 h-3.5" />Estimated Sales</div>
                                <div className="text-3xl font-black tracking-tight">{CURRENCY}{impactMetrics.estimatedSales.toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 2 — Area Chart + Automation Breakdown
                ══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <Card className="lg:col-span-2 border-border/40 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Business Impact Over Time
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">Proyección de revenue y valor de tiempo ahorrado</p>
                                </div>
                                <div className="flex gap-4 text-right shrink-0">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spend</div>
                                        <div className="text-sm font-bold">{CURRENCY}{(impactMetrics.moneySaved * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Revenue</div>
                                        <div className="text-sm font-bold text-emerald-500">{CURRENCY}{impactMetrics.estimatedSales.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={areaChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(152 69% 45%)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradTimeSaved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(243 75% 65%)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(243 75% 65%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                                        tickFormatter={(v) => v >= 1000 ? `${CURRENCY}${(v / 1000).toFixed(0)}k` : `${CURRENCY}${v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                        formatter={(value) => <span className="text-muted-foreground">{value}</span>} />
                                    <Area type="monotone" dataKey="revenue" name="Estimated Revenue"
                                        stroke="hsl(152 69% 45%)" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="timeSavedValue" name="Time Saved Value"
                                        stroke="hsl(243 75% 65%)" strokeWidth={2} fill="url(#gradTimeSaved)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Time Saved
                                <span className="text-xs font-normal text-muted-foreground ml-1">Desglose de automatización</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col justify-between h-[calc(100%-60px)]">
                            <div>
                                <div className="text-4xl font-black tracking-tight mb-5">
                                    {impactMetrics.timeSaved.toLocaleString()}
                                    <span className="text-lg font-medium text-muted-foreground ml-1">Hours</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: "Campaign Management", hours: impactMetrics.campaignMgmt },
                                        { label: "Influencer Invites", hours: impactMetrics.invites },
                                        { label: "Content Creation", hours: impactMetrics.contentCreation },
                                        { label: "Scheduling & Coordination", hours: impactMetrics.scheduling },
                                    ].map(({ label, hours }) => (
                                        <div key={label} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                                {label}
                                            </div>
                                            <span className="font-semibold tabular-nums">{hours} hrs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Hourly Rate</span>
                                <span className="text-sm font-bold">{CURRENCY}{HOURLY_RATE.toLocaleString()}/hr</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 3 — Comment Analysis (AI Real)
                ══════════════════════════════════════════════════════════ */}
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
                                        ? `Gemini analizó ${commentAnalysis.analyzedCount} comentarios reales`
                                        : "Análisis de intención y sentimiento de la audiencia"}
                                </p>
                            </div>
                            <div className="text-right">
                                {loadingComments ? (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Analizando con IA...
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
                        {/* AI Summary */}
                        {commentAnalysis.fetched && commentAnalysis.summary && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                                <p className="text-xs text-foreground leading-relaxed">
                                    <span className="font-semibold text-primary">Resumen IA: </span>
                                    {commentAnalysis.summary}
                                </p>
                            </div>
                        )}

                        {/* 4 Category Cards */}
                        {(() => {
                            const realTotal = stats.totalComments;
                            const fetched = commentAnalysis.fetched;
                            const sample = commentAnalysis.total; // actual comments read from API

                            // Scale from sample to real total
                            const scale = (n: number) =>
                                sample > 0 ? Math.round(realTotal * (n / sample)) : 0;

                            const categories = [
                                { key: "askingForInfo", label: "Asking for Info", count: fetched ? scale(commentAnalysis.askingForInfo) : 0, icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { key: "positive", label: "Positive", count: fetched ? scale(commentAnalysis.positive) : 0, icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                { key: "intentVisits", label: "Intent Visits", count: fetched ? scale(commentAnalysis.intentVisits) : 0, icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
                                { key: "taggingFriends", label: "Tagging Friends", count: fetched ? scale(commentAnalysis.taggingFriends) : 0, icon: Tag, color: "text-violet-500", bg: "bg-violet-500/10" },
                            ];

                            return (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {categories.map(({ key, label, count, icon: Icon, color, bg }) => {
                                        const pct = realTotal > 0 ? ((count / realTotal) * 100).toFixed(1) : "0.0";
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
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                No se pudieron obtener textos de comentarios vía API (puede requerir el permiso <code>instagram_manage_comments</code>).
                            </p>
                        )}
                        {activePlatform === "tiktok" && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                El análisis de comentarios no está disponible para TikTok (limitación de la API).
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 4 — 8 Performance Metric Cards
                ══════════════════════════════════════════════════════════ */}
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
                            <Card key={label} className="border-border/40 shadow-sm hover:border-border/70 transition-colors">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
                                <CardContent><div className={`text-2xl font-bold ${color}`}>{value}</div></CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 5 — Campaign Performance Bar Chart
                ══════════════════════════════════════════════════════════ */}
                {chartData.length > 0 && (
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="border-b border-border/30 pb-3">
                            <CardTitle className="text-sm font-semibold">Campaign Performance (Likes)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2 pt-4">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                                    <Bar dataKey="likes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* ══════════════════════════════════════════════════════════
                    SECTION 6 — Creator Performance Table
                ══════════════════════════════════════════════════════════ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" /> Creator Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {creatorPerformance.length > 0 ? (
                            <div className="w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-muted/30 text-muted-foreground text-xs border-b border-border/30">
                                            <th className="px-4 py-3 w-8" />
                                            <th className="px-4 py-3">Creator</th>
                                            <th className="px-4 py-3">Campaigns</th>
                                            <th className="px-4 py-3 text-right">Posts</th>
                                            <th className="px-4 py-3 text-right">Views</th>
                                            <th className="px-4 py-3 text-right">Reach</th>
                                            <th className="px-4 py-3 text-right">Likes</th>
                                            <th className="px-4 py-3 text-right">Comments</th>
                                            <th className="px-4 py-3 text-right">Saved</th>
                                            <th className="px-4 py-3 text-right">Shares</th>
                                            <th className="px-4 py-3 text-right">Interactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {creatorPerformance.map(item => (
                                            <React.Fragment key={item.userId}>
                                                <tr
                                                    className={`border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors ${expandedCreators.has(item.userId) ? "bg-muted/10" : ""}`}
                                                    onClick={() => toggleCreator(item.userId)}
                                                >
                                                    <td className="px-4 py-3 text-center">
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
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.campaigns}</td>
                                                    <td className="px-4 py-3 text-right">{item.posts}</td>
                                                    <td className="px-4 py-3 text-right">{item.views?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">{item.reach?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-500 font-medium">{item.likes.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">{item.comments.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">{item.saved?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">{item.shares?.toLocaleString() || 0}</td>
                                                    <td className="px-4 py-3 text-right">{item.interactions?.toLocaleString() || 0}</td>
                                                </tr>
                                                {expandedCreators.has(item.userId) && (
                                                    <tr className="bg-muted/5">
                                                        <td colSpan={11} className="px-8 py-4">
                                                            <div className="border border-border/40 rounded-xl bg-card/50 overflow-hidden">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="bg-muted/20 text-muted-foreground border-b border-border/30">
                                                                            <th className="px-4 py-2 text-left">Deliverable</th>
                                                                            <th className="px-4 py-2 text-right">Views</th>
                                                                            <th className="px-4 py-2 text-right">Likes</th>
                                                                            <th className="px-4 py-2 text-right">Comments</th>
                                                                            <th className="px-4 py-2 text-right">Saved</th>
                                                                            <th className="px-4 py-2 text-right">Shares</th>
                                                                            <th className="px-4 py-2 text-right">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {item.individualPosts.map((post: any, idx: number) => (
                                                                            <tr key={post.id || idx} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                                                                <td className="px-4 py-2">
                                                                                    <div className="font-medium text-primary/80">{post.deliverableType} #{post.deliverableNumber}</div>
                                                                                    <div className="text-[10px] text-muted-foreground uppercase">{post.platform}</div>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right">{post.views?.toLocaleString() || 0}</td>
                                                                                <td className="px-4 py-2 text-right text-emerald-500">{post.likes.toLocaleString()}</td>
                                                                                <td className="px-4 py-2 text-right">{post.comments.toLocaleString()}</td>
                                                                                <td className="px-4 py-2 text-right">{post.saved?.toLocaleString() || 0}</td>
                                                                                <td className="px-4 py-2 text-right">{post.shares?.toLocaleString() || 0}</td>
                                                                                <td className="px-4 py-2 text-right">
                                                                                    {post.contentUrl && (
                                                                                        <a href={post.contentUrl} target="_blank" rel="noopener noreferrer"
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
                                <p className="text-muted-foreground text-sm">No creator data available yet. Start a campaign to see results!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* No data empty state */}
                {stats.totalPosts === 0 && creatorPerformance.length === 0 && (
                    <div className="text-center p-10 border border-border/40 rounded-2xl bg-card">
                        <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                            {selectedCampaignId !== "all"
                                ? `No hay contenido aprobado en "${selectedCampaignName}" para la plataforma seleccionada.`
                                : "No analytics data available yet. Launch a campaign to see your results!"}
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
}
