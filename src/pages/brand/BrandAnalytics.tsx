import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import {
    Loader2, Instagram, ChevronDown, ChevronUp, ExternalLink,
    Clock, DollarSign, Users, TrendingUp, MessageSquare,
    ThumbsUp, Tag, MapPin, Info, Zap, LayoutGrid,
    ShoppingCart, BarChart2
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
const HOURLY_RATE = 50;
const CONVERSION_RATE = 0.001; // 0.1% of reach (realistic social-to-customer rate)
const AVG_TICKET = 2500; // RD$2,500 average ticket
const CURRENCY = "RD$";

// Hours saved per automated activity
const AUTOMATION_HOURS = {
    campaignManagement: (approvedCreators: number) => Math.max(approvedCreators * 6, 10),
    influencerInvites: (totalInvites: number) => Math.max(Math.round(totalInvites * 0.5), 5),
    contentCreation: (approvedCreators: number) => Math.max(approvedCreators * 3, 5),
    scheduling: (approvedCreators: number) => Math.max(approvedCreators * 2, 3),
};

// Comment intent classification using keyword matching
const INTENT_KEYWORDS = {
    askingForInfo: [
        "where", "how", "when", "what", "price", "cost", "available",
        "info", "link", "website", "buy", "get", "donde", "como",
        "cuanto", "precio", "disponible", "información"
    ],
    positive: [
        "love", "amazing", "great", "beautiful", "gorgeous", "perfect",
        "awesome", "incredible", "obsessed", "stunning", "wow", "omg",
        "need", "want", "favorite", "fav", "❤️", "😍", "🔥", "💯",
        "hermoso", "increíble", "me encanta", "precioso", "wow"
    ],
    intentVisits: [
        "going", "visit", "there", "location", "address", "directions",
        "near me", "coming", "see you", "voy", "visitar", "dirección"
    ],
    taggingFriends: ["@"],
};

function classifyComment(text: string): "askingForInfo" | "positive" | "intentVisits" | "taggingFriends" | "other" {
    const lower = text.toLowerCase();
    if (INTENT_KEYWORDS.taggingFriends.some(kw => lower.includes(kw))) return "taggingFriends";
    if (INTENT_KEYWORDS.askingForInfo.some(kw => lower.includes(kw))) return "askingForInfo";
    if (INTENT_KEYWORDS.intentVisits.some(kw => lower.includes(kw))) return "intentVisits";
    if (INTENT_KEYWORDS.positive.some(kw => lower.includes(kw))) return "positive";
    return "other";
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CommentAnalysisResult {
    total: number;
    askingForInfo: number;
    positive: number;
    intentVisits: number;
    taggingFriends: number;
    fetched: boolean;
}

// ─── Time-series generator from real cumulative metrics ──────────────────────
function buildAreaChartData(
    totalReach: number,
    approvedCreators: number,
    timeSaved: number
): Array<{ month: string; revenue: number; timeSavedValue: number }> {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const totalRevenue = Math.round(totalReach * CONVERSION_RATE * AVG_TICKET);
    const totalTimeSavedValue = timeSaved * HOURLY_RATE;
    return months.map((month, i) => {
        const progress = (i + 1) / months.length;
        const curve = Math.pow(progress, 1.4);
        return {
            month,
            revenue: Math.round(totalRevenue * curve),
            timeSavedValue: Math.round(totalTimeSavedValue * curve),
        };
    });
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg text-sm">
            <p className="font-semibold mb-1 text-foreground">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color }} className="text-xs">
                    {entry.name}: ${entry.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BrandAnalytics() {
    const { user } = useAuth();
    const { limits, loading: limitsLoading } = usePlanLimits();

    // ── Core data state ──
    const [loading, setLoading] = useState(true);
    const [rawSubmissions, setRawSubmissions] = useState<any[]>([]);
    const [campMap, setCampMap] = useState<Map<string, string>>(new Map());
    const [stats, setStats] = useState({
        totalPosts: 0, totalLikes: 0, totalComments: 0, totalReach: 0,
        totalSaved: 0, totalShares: 0, totalViews: 0, totalInteractions: 0
    });
    const [creatorPerformance, setCreatorPerformance] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);

    // ── Automation data state ──
    const [totalInvites, setTotalInvites] = useState(0);
    const [totalApplications, setTotalApplications] = useState(0);

    // ── Comment analysis state ──
    const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysisResult>({
        total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0, fetched: false
    });
    const [loadingComments, setLoadingComments] = useState(false);

    // ── UI state ──
    const [activePlatform, setActivePlatform] = useState<"all" | "instagram" | "tiktok">("all");
    const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());

    // ─── Fetch: campaigns + submissions + invitations + applications ────────
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const campaignSnapshot = await getDocs(q);
                const campaignIds = campaignSnapshot.docs.map(d => d.id);
                const campaignMap = new Map(campaignSnapshot.docs.map(d => [d.id, d.data().name]));
                setCampMap(campaignMap);

                if (campaignIds.length === 0) { setLoading(false); return; }

                // Submissions + invitations + applications in parallel
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

                let allSubmissions: any[] = [];
                submissionSnaps.forEach(snap => {
                    allSubmissions = [...allSubmissions, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
                });
                setRawSubmissions(allSubmissions);

                let inviteCount = 0;
                inviteSnaps.forEach(snap => { inviteCount += snap.size; });
                setTotalInvites(inviteCount);

                let appCount = 0;
                appSnaps.forEach(snap => { appCount += snap.size; });
                setTotalApplications(appCount);

            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // ─── Process submissions by platform filter ────────────────────────────
    useEffect(() => {
        const process = async () => {
            if (loading) return;
            try {
                let filteredSubs = activePlatform === "all"
                    ? rawSubmissions
                    : rawSubmissions.filter(s => (s.platform || s.metrics?.inputPlatform || "instagram") === activePlatform);

                filteredSubs = filteredSubs.filter(s => s.status === "approved");

                // Deduplicate by slot key (latest version wins)
                const slotsMap = new Map<string, any>();
                filteredSubs.forEach(s => {
                    const creatorId = s.userId || s.creatorId;
                    if (!creatorId) return;
                    const slotKey = `${s.campaignId}_${creatorId}_${s.deliverableType || 'default'}_${s.deliverableNumber || 0}`;
                    const existing = slotsMap.get(slotKey);
                    const getTs = (obj: any) => {
                        if (!obj) return 0;
                        if (typeof obj.toMillis === 'function') return obj.toMillis();
                        if (obj.seconds) return obj.seconds * 1000;
                        if (obj.toDate && typeof obj.toDate === 'function') return obj.toDate().getTime();
                        return new Date(obj).getTime() || 0;
                    };
                    const currentTs = Math.max(getTs(s.updatedAt), getTs(s.createdAt));
                    const existingTs = existing ? Math.max(getTs(existing.updatedAt), getTs(existing.createdAt)) : -1;
                    if (!existing || currentTs > existingTs) slotsMap.set(slotKey, s);
                });

                const finalSubmissions = Array.from(slotsMap.values());
                let tPosts = 0, tLikes = 0, tComments = 0, tReach = 0;
                let tSaved = 0, tShares = 0, tViews = 0, tInteractions = 0;
                const creatorStats: any = {};

                for (const sub of finalSubmissions) {
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

                    const creatorKey = sub.userId || sub.creatorId || "unknown";
                    if (!creatorStats[creatorKey]) {
                        creatorStats[creatorKey] = {
                            userId: creatorKey, posts: 0, likes: 0, comments: 0,
                            reach: 0, saved: 0, shares: 0, views: 0, interactions: 0,
                            campaigns: new Set(), individualPosts: [], postUrls: []
                        };
                    }
                    creatorStats[creatorKey].posts++;
                    creatorStats[creatorKey].likes += likes;
                    creatorStats[creatorKey].comments += comments;
                    creatorStats[creatorKey].reach += reach;
                    creatorStats[creatorKey].saved += saved;
                    creatorStats[creatorKey].shares += shares;
                    creatorStats[creatorKey].views += views;
                    creatorStats[creatorKey].interactions += interactions;
                    creatorStats[creatorKey].individualPosts.push({
                        id: sub.id, campaignId: sub.campaignId,
                        campaignName: campMap.get(sub.campaignId) || "Unknown",
                        deliverableType: sub.deliverableType || "Post",
                        deliverableNumber: sub.deliverableNumber || 1,
                        likes, comments, reach, saved, shares, views, interactions,
                        status: sub.status, contentUrl: sub.contentUrl,
                        platform: sub.platform || sub.metrics?.inputPlatform || "instagram",
                        postUrl: sub.postUrl || sub.contentUrl || null,
                    });
                    if (sub.campaignId) {
                        creatorStats[creatorKey].campaigns.add(campMap.get(sub.campaignId) || "Unknown");
                    }
                    if (sub.postUrl || sub.contentUrl) {
                        creatorStats[creatorKey].postUrls.push({
                            url: sub.postUrl || sub.contentUrl,
                            userId: creatorKey,
                        });
                    }
                }

                setStats({ totalPosts: tPosts, totalLikes: tLikes, totalComments: tComments, totalReach: tReach, totalSaved: tSaved, totalShares: tShares, totalViews: tViews, totalInteractions: tInteractions });

                const creatorIds = Object.keys(creatorStats).filter(id => id !== "unknown");
                if (creatorIds.length > 0) {
                    const userPromises = creatorIds.map(id => getDoc(doc(db, "users", id)));
                    const userSnaps = await Promise.all(userPromises);
                    const creatorsData = userSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter((c): c is any => c !== null);

                    const enriched = creatorIds.map(id => {
                        const profile = creatorsData.find((c: any) => c.id === id);
                        const stat = creatorStats[id];
                        return {
                            ...stat,
                            name: profile?.displayName || profile?.name || "Unknown Creator",
                            avatar: profile?.photoURL || profile?.avatar,
                            handle: profile?.instagramUsername || profile?.socialHandles?.instagram || profile?.socialHandles?.tiktok,
                            instagramAccessToken: profile?.instagramAccessToken,
                            instagramId: profile?.instagramId,
                            campaigns: Array.from(stat.campaigns).join(", "),
                            individualPosts: stat.individualPosts,
                            postUrls: stat.postUrls,
                        };
                    });
                    setCreatorPerformance(enriched);
                } else {
                    setCreatorPerformance([]);
                }

                // Chart data by campaign
                const campaignGroups: any = {};
                finalSubmissions.forEach(sub => {
                    if (!sub.campaignId) return;
                    if (!campaignGroups[sub.campaignId]) {
                        campaignGroups[sub.campaignId] = { name: campMap.get(sub.campaignId) || "Unknown", likes: 0, posts: 0 };
                    }
                    campaignGroups[sub.campaignId].likes += (sub.metrics?.likes || 0);
                    campaignGroups[sub.campaignId].posts += 1;
                });
                setData(Object.values(campaignGroups).map((c: any) => ({
                    name: String(c.name || "Unknown").substring(0, 12),
                    likes: Number(c.likes) || 0,
                    posts: Number(c.posts) || 0,
                })));

            } catch (error) {
                console.error("Error processing analytics data:", error);
            }
        };
        process();
    }, [rawSubmissions, activePlatform, campMap, loading]);

    // ─── Fetch real comments from Instagram for approved posts ─────────────
    // Reset comment analysis whenever platform changes so TikTok shows no stale IG data
    useEffect(() => {
        setCommentAnalysis({ total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0, fetched: false });
    }, [activePlatform]);

    useEffect(() => {
        // Only fetch for instagram or all; TikTok comments API not available
        if (loading || creatorPerformance.length === 0) return;
        if (activePlatform === "tiktok") {
            // TikTok: no comment text API — mark as fetched with 0 so we show real stats.totalComments
            setCommentAnalysis({ total: 0, askingForInfo: 0, positive: 0, intentVisits: 0, taggingFriends: 0, fetched: true });
            return;
        }

        const fetchComments = async () => {
            setLoadingComments(true);
            let askingForInfo = 0, positive = 0, intentVisits = 0, taggingFriends = 0, fetchedTotal = 0;

            try {
                // Only process Instagram creators
                const igCreators = creatorPerformance.filter(c => c.instagramAccessToken && c.instagramId && c.postUrls?.length);
                for (const creator of igCreators) {
                    const { instagramAccessToken: accessToken, instagramId: igUserId } = creator;

                    // Get list of recent IG media IDs
                    let mediaItems: any[] = [];
                    try {
                        const mediaRes = await axios.get(
                            `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,shortcode,permalink&limit=50&access_token=${accessToken}`
                        );
                        mediaItems = mediaRes.data?.data || [];
                    } catch {
                        continue;
                    }

                    // For each submitted post URL, find matching media and fetch comments (paginate up to 200)
                    for (const { url } of creator.postUrls) {
                        if (!url) continue;
                        const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                        const postId = match ? match[2] : null;
                        if (!postId) continue;

                        const foundMedia = mediaItems.find((item: any) =>
                            (item.permalink && item.permalink.includes(postId)) ||
                            (item.shortcode && item.shortcode === postId)
                        );
                        if (!foundMedia) continue;

                        try {
                            // Fetch up to 200 comments via pagination
                            let nextUrl: string | null =
                                `https://graph.facebook.com/v19.0/${foundMedia.id}/comments?fields=text&limit=100&access_token=${accessToken}`;
                            let pages = 0;
                            while (nextUrl && pages < 2) {
                                const commentsRes = await axios.get(nextUrl);
                                const comments: any[] = commentsRes.data?.data || [];
                                for (const c of comments) {
                                    if (!c.text) continue;
                                    fetchedTotal++;
                                    const category = classifyComment(c.text);
                                    if (category === "askingForInfo") askingForInfo++;
                                    else if (category === "positive") positive++;
                                    else if (category === "intentVisits") intentVisits++;
                                    else if (category === "taggingFriends") taggingFriends++;
                                }
                                nextUrl = commentsRes.data?.paging?.next || null;
                                pages++;
                            }
                        } catch {
                            // Comments may not be accessible (permissions) — skip silently
                        }
                    }
                }
            } catch (err) {
                console.warn("Comment analysis fetch error:", err);
            } finally {
                setCommentAnalysis({ total: fetchedTotal, askingForInfo, positive, intentVisits, taggingFriends, fetched: true });
                setLoadingComments(false);
            }
        };

        fetchComments();
    }, [creatorPerformance, loading, activePlatform]);

    // ─── Derived metrics ──────────────────────────────────────────────────
    const impactMetrics = useMemo(() => {
        const approvedCreators = creatorPerformance.length;
        const campaignMgmt = AUTOMATION_HOURS.campaignManagement(approvedCreators);
        const invites = AUTOMATION_HOURS.influencerInvites(totalInvites + totalApplications);
        const contentCreation = AUTOMATION_HOURS.contentCreation(approvedCreators);
        const scheduling = AUTOMATION_HOURS.scheduling(approvedCreators);
        const timeSaved = campaignMgmt + invites + contentCreation + scheduling;
        const moneySaved = timeSaved * HOURLY_RATE;
        const newCustomers = Math.round(stats.totalReach * CONVERSION_RATE);
        const estimatedSales = newCustomers * AVG_TICKET;
        return { timeSaved, moneySaved, newCustomers, estimatedSales, campaignMgmt, invites, contentCreation, scheduling };
    }, [creatorPerformance, stats.totalReach, totalInvites, totalApplications]);

    const areaChartData = useMemo(() =>
        buildAreaChartData(stats.totalReach, creatorPerformance.length, impactMetrics.timeSaved),
        [stats.totalReach, creatorPerformance.length, impactMetrics.timeSaved]
    );

    const toggleCreator = (creatorId: string) => {
        setExpandedCreators(prev => {
            const next = new Set(prev);
            if (next.has(creatorId)) next.delete(creatorId); else next.add(creatorId);
            return next;
        });
    };

    // ─── Loading / Gate ───────────────────────────────────────────────────
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
                <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center justify-center text-center">
                    <div className="max-w-md p-8 border border-border/50 rounded-2xl bg-card shadow-lg space-y-4">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                            <BarChart2 className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">Analíticas Avanzadas Bloqueadas</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            El análisis en tiempo real y la métrica de rendimiento detallada están disponibles en planes superiores.
                        </p>
                        <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white" onClick={() => window.open('https://buy.stripe.com/test_8wM8xm0o3eJmaT66oo', '_blank')}>
                            Mejorar a Plan Growth
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    const hasData = stats.totalPosts > 0 || creatorPerformance.length > 0;

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 space-y-8">

                {/* ── Header ── */}
                <DashboardHeader
                    title="Analytics"
                    subtitle="Track your campaign performance and ROI"
                />

                {/* ── Platform Filter ── */}
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

                {/* ══════════════════════════════════════════════════════════
                    SECTION 1 — Campaign Impact Summary (4 KPI cards)
                ══════════════════════════════════════════════════════════ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Zap className="w-4 h-4 text-primary" />
                            Campaign Impact Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Time Saved */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    Time Saved
                                </div>
                                <div className="text-3xl font-black tracking-tight">
                                    {impactMetrics.timeSaved.toLocaleString()}
                                    <span className="text-base font-medium text-muted-foreground ml-1">hrs</span>
                                </div>
                            </div>
                            {/* Money Saved */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Money Saved
                                </div>
                                <div className="text-3xl font-black tracking-tight">
                                    {CURRENCY}{impactMetrics.moneySaved.toLocaleString()}
                                </div>
                            </div>
                            {/* New Customers */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Users className="w-3.5 h-3.5" />
                                    New Customers
                                </div>
                                <div className="text-3xl font-black tracking-tight">
                                    {impactMetrics.newCustomers.toLocaleString()}
                                </div>
                            </div>
                            {/* Estimated Sales */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Estimated Sales
                                </div>
                                <div className="text-3xl font-black tracking-tight">
                                    {CURRENCY}{impactMetrics.estimatedSales.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 2 — Area Chart + Automation Breakdown
                ══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Business Impact Over Time (Area Chart) ── */}
                    <Card className="lg:col-span-2 border-border/40 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Business Impact Over Time
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">Track your revenue, time savings, and ROI trends</p>
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
                                    <Legend
                                        wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                        formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Estimated Revenue"
                                        stroke="hsl(152 69% 45%)"
                                        strokeWidth={2}
                                        fill="url(#gradRevenue)"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="timeSavedValue"
                                        name="Time Saved Value"
                                        stroke="hsl(243 75% 65%)"
                                        strokeWidth={2}
                                        fill="url(#gradTimeSaved)"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* ── Automation Breakdown (Time Saved) ── */}
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Time Saved
                                <span className="text-xs font-normal text-muted-foreground ml-1">Automation breakdown</span>
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
                                            <span className="font-semibold tabular-nums">{hours} Hours</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Hourly Rate</span>
                                <span className="text-sm font-bold">{CURRENCY}{HOURLY_RATE}/hr</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 3 — Comment Analysis (AI)
                ══════════════════════════════════════════════════════════ */}
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Comment Analysis
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">Understanding audience intent and sentiment</p>
                            </div>
                            <div className="text-right">
                                {loadingComments ? (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Analyzing...
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
                    <CardContent className="pt-5">
                        {(() => {
                            // Always use stats.totalComments as the true total (from Firestore submission metrics).
                            // If we fetched real comment texts (commentAnalysis.fetched && total > 0),
                            // scale the proportions from the sample to the real total.
                            // If fetch returned 0 (TikTok, no permissions, etc.), show 0 per category.
                            const realTotal = stats.totalComments;
                            const sampleTotal = commentAnalysis.fetched ? commentAnalysis.total : 0;

                            const scale = (n: number) =>
                                sampleTotal > 0 ? Math.round(realTotal * (n / sampleTotal)) : 0;

                            const categories = [
                                    { key: "askingForInfo", label: "Asking for Info", count: scale(commentAnalysis.askingForInfo), icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { key: "positive", label: "Positive", count: scale(commentAnalysis.positive), icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { key: "intentVisits", label: "Intent Visits", count: scale(commentAnalysis.intentVisits), icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
                                    { key: "taggingFriends", label: "Tagging Friends", count: scale(commentAnalysis.taggingFriends), icon: Tag, color: "text-violet-500", bg: "bg-violet-500/10" },
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
                                                <div className="text-2xl font-black">{count.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{pct}%</div>
                                                <div className="text-xs font-medium mt-1">{label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {commentAnalysis.fetched && commentAnalysis.total === 0 && (
                            <p className="text-xs text-muted-foreground text-center mt-4">
                                No se pudieron cargar comentarios en tiempo real. Verifica que los creadores tengan posts de Instagram conectados.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 4 — 8 Classic Metric Cards
                ══════════════════════════════════════════════════════════ */}
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Posts", value: stats.totalPosts, color: "text-foreground" },
                            { label: "Total Views", value: stats.totalViews?.toLocaleString() || 0, color: "text-indigo-500" },
                            { label: "Total Reach", value: stats.totalReach?.toLocaleString() || 0, color: "text-blue-500" },
                            { label: "Total Interactions", value: stats.totalInteractions?.toLocaleString() || 0, color: "text-teal-500" },
                            { label: "Total Likes", value: stats.totalLikes.toLocaleString(), color: "text-pink-500" },
                            { label: "Total Comments", value: stats.totalComments.toLocaleString(), color: "text-primary" },
                            { label: "Total Saved", value: stats.totalSaved?.toLocaleString() || 0, color: "text-purple-500" },
                            { label: "Total Shares", value: stats.totalShares?.toLocaleString() || 0, color: "text-orange-500" },
                        ].map(({ label, value, color }) => (
                            <Card key={label} className="border-border/40 shadow-sm hover:border-border/70 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 5 — Campaign Bar Chart (conditional)
                ══════════════════════════════════════════════════════════ */}
                {data.length > 0 && (
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="border-b border-border/30 pb-3">
                            <CardTitle className="text-sm font-semibold">Campaign Performance (Likes)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2 pt-4">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                                    />
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
                            <Users className="w-4 h-4 text-primary" />
                            Creator Performance
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
                                        {creatorPerformance.map((item) => (
                                            <React.Fragment key={item.userId}>
                                                <tr
                                                    className={`border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors ${expandedCreators.has(item.userId) ? 'bg-muted/10' : ''}`}
                                                    onClick={() => toggleCreator(item.userId)}
                                                >
                                                    <td className="px-4 py-3 text-center">
                                                        {item.individualPosts.length > 1
                                                            ? expandedCreators.has(item.userId)
                                                                ? <ChevronUp className="w-4 h-4 text-primary" />
                                                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                            : null}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
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
                                                                            <th className="px-4 py-2 text-left">Post / Deliverable</th>
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
                                                                                            View <ExternalLink className="w-2.5 h-2.5" />
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

                {/* No data at all */}
                {!hasData && (
                    <div className="text-center p-10 border border-border/40 rounded-2xl bg-card">
                        <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No analytics data available yet. Launch a campaign to see your results!</p>
                    </div>
                )}

            </main>
        </div>
    );
}
