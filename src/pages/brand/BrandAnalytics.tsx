import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePrompt } from "@/components/brand/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function BrandAnalytics() {
    const { user } = useAuth();
    const { limits, loading: limitsLoading } = usePlanLimits();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalReach: 0,
        totalSaved: 0,
        totalShares: 0,
        totalViews: 0,
        totalInteractions: 0
    });
    const [creatorPerformance, setCreatorPerformance] = useState<any[]>([]);
    const [activePlatform, setActivePlatform] = useState<"all" | "instagram" | "tiktok">("all");
    const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
    const [rawSubmissions, setRawSubmissions] = useState<any[]>([]);
    const [campMap, setCampMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const campaignSnapshot = await getDocs(q);
                const campaignIds = campaignSnapshot.docs.map(d => d.id);
                const campaignMap = new Map(campaignSnapshot.docs.map(d => [d.id, d.data().name]));
                setCampMap(campaignMap);

                if (campaignIds.length === 0) {
                    setLoading(false);
                    return;
                }

                const submissionsPromises = campaignIds.map(id =>
                    getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
                );

                const snapshots = await Promise.all(submissionsPromises);
                let allSubmissions: any[] = [];
                snapshots.forEach(snap => {
                    allSubmissions = [...allSubmissions, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
                });

                setRawSubmissions(allSubmissions);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const process = async () => {
            if (loading) return; 

            try {
                let filteredSubs = activePlatform === "all"
                    ? rawSubmissions
                    : rawSubmissions.filter(s => (s.platform || (s.metrics?.inputPlatform) || "instagram") === activePlatform);
                
                filteredSubs = filteredSubs.filter(s => s.status === "approved");

                const slotsMap = new Map();
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

                    if (!existing || currentTs > existingTs) {
                        slotsMap.set(slotKey, s);
                    }
                });

                const finalSubmissions = Array.from(slotsMap.values());

                let tPosts = 0;
                let tLikes = 0;
                let tComments = 0;
                let tReach = 0;
                let tSaved = 0;
                let tShares = 0;
                let tViews = 0;
                let tInteractions = 0;

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

                    tLikes += likes;
                    tComments += comments;
                    tReach += reach;
                    tSaved += saved;
                    tShares += shares;
                    tViews += views;
                    tInteractions += interactions;

                    const creatorKey = sub.userId || sub.creatorId || "unknown";
                    if (!creatorStats[creatorKey]) {
                        creatorStats[creatorKey] = {
                            userId: creatorKey,
                            posts: 0,
                            likes: 0,
                            comments: 0,
                            reach: 0,
                            saved: 0,
                            shares: 0,
                            views: 0,
                            interactions: 0,
                            campaigns: new Set(),
                            individualPosts: []
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
                    
                    const postDetail = {
                        id: sub.id,
                        campaignId: sub.campaignId,
                        campaignName: campMap.get(sub.campaignId) || "Desconocido",
                        deliverableType: sub.deliverableType || "Post",
                        deliverableNumber: sub.deliverableNumber || 1,
                        likes,
                        comments,
                        reach,
                        saved,
                        shares,
                        views,
                        interactions,
                        status: sub.status,
                        contentUrl: sub.contentUrl,
                        platform: sub.platform || (sub.metrics?.inputPlatform) || "instagram"
                    };
                    creatorStats[creatorKey].individualPosts.push(postDetail);

                    if (sub.campaignId) {
                        creatorStats[creatorKey].campaigns.add(campMap.get(sub.campaignId) || "Desconocido");
                    }
                }

                setStats({
                    totalPosts: tPosts,
                    totalLikes: tLikes,
                    totalComments: tComments,
                    totalReach: tReach,
                    totalSaved: tSaved,
                    totalShares: tShares,
                    totalViews: tViews,
                    totalInteractions: tInteractions
                });

                const creatorIds = Object.keys(creatorStats).filter(id => id !== "unknown");
                if (creatorIds.length > 0) {
                    const userPromises = creatorIds.map(id => getDoc(doc(db, "users", id)));
                    const userSnaps = await Promise.all(userPromises);
                    const creatorsData: any[] = userSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter((c): c is any => c !== null);

                    const enrichedPerformance = creatorIds.map(id => {
                        const profile = creatorsData.find((c: any) => c.id === id);
                        const stat = creatorStats[id];
                        return {
                            ...stat,
                            name: profile?.displayName || profile?.name || "Creador Desconocido",
                            avatar: profile?.photoURL || profile?.avatar,
                            handle: profile?.instagramUsername || profile?.socialHandles?.instagram || profile?.socialHandles?.tiktok,
                            campaigns: Array.from(stat.campaigns).join(", "),
                            individualPosts: stat.individualPosts
                        };
                    });
                    setCreatorPerformance(enrichedPerformance);
                } else {
                    setCreatorPerformance([]);
                }

                const campaignGroups: any = {};
                finalSubmissions.forEach(sub => {
                    if (!sub.campaignId) return;
                    if (!campaignGroups[sub.campaignId]) {
                        campaignGroups[sub.campaignId] = {
                            name: campMap.get(sub.campaignId) || "Desconocido",
                            likes: 0,
                            posts: 0
                        };
                    }
                    campaignGroups[sub.campaignId].likes += (sub.metrics?.likes || 0);
                    campaignGroups[sub.campaignId].posts += 1;
                });
                const chartData = Object.values(campaignGroups).map((c: any) => ({
                    name: String(c.name || "Desconocido").substring(0, 10),
                    likes: Number(c.likes) || 0,
                    posts: Number(c.posts) || 0
                }));
                setData(chartData);
            } catch (error) {
                console.error("Error processing analytics data:", error);
            }
        };

        process();
    }, [rawSubmissions, activePlatform, campMap, loading]);

    const toggleCreator = (creatorId: string) => {
        setExpandedCreators(prev => {
            const next = new Set(prev);
            if (next.has(creatorId)) next.delete(creatorId);
            else next.add(creatorId);
            return next;
        });
    };

    if (loading || limitsLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!limits.analyticsEnabled) {
        return (
            <div className="flex min-h-screen bg-background">
                <DashboardSidebar type="brand" />
                <MobileNav type="brand" />
                <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center justify-center text-center">
                    <div className="max-w-md p-8 border rounded-2xl bg-white shadow-sm space-y-4">
                        <div className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold">Analíticas Avanzadas Bloqueadas</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            El análisis en tiempo real y la métrica de rendimiento de campañas detallada están disponibles en planes superiores.
                        </p>
                        <Button className="w-full mt-4 bg-[#534AB7] hover:bg-[#534AB7]/90 text-white" onClick={() => window.open('https://buy.stripe.com/test_8wM8xm0o3eJmaT66oo', '_blank')}>
                            Mejorar a Plan Growth
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Resumen de Analytics" subtitle="Rendimiento en tiempo real de los envíos válidos" />

                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activePlatform === "all" ? "default" : "outline"}
                        onClick={() => setActivePlatform("all")}
                        size="sm"
                    >
                        Todas las Plataformas
                    </Button>
                    <Button
                        variant={activePlatform === "instagram" ? "default" : "outline"}
                        onClick={() => setActivePlatform("instagram")}
                        size="sm"
                        className="gap-2"
                    >
                        <Instagram className="w-4 h-4" /> Instagram
                    </Button>
                    <Button
                        variant={activePlatform === "tiktok" ? "default" : "outline"}
                        onClick={() => setActivePlatform("tiktok")}
                        size="sm"
                        className="gap-2"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg> TikTok
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Publicaciones Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.totalPosts}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vistas Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-indigo-600">{stats.totalViews?.toLocaleString() || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Alcance Total</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-blue-600">{stats.totalReach?.toLocaleString() || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Interacciones Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-teal-600">{stats.totalInteractions?.toLocaleString() || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Me gusta Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-pink-600">{stats.totalLikes.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Comentarios Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-primary">{stats.totalComments.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Guardados Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-purple-600">{stats.totalSaved?.toLocaleString() || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Compartidos Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-orange-600">{stats.totalShares?.toLocaleString() || 0}</div></CardContent>
                    </Card>
                </div>

                {data.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="col-span-3 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Rendimiento de Campaña (Me gusta)</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="likes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Rendimiento de Creadores</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {creatorPerformance.length > 0 ? (
                                        <div className="w-full overflow-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                                    <tr className="bg-muted/30 text-muted-foreground text-sm">
                                                        <th className="px-4 py-3 text-left rounded-l-lg w-10"></th>
                                                        <th className="px-4 py-3 text-left">Creador</th>
                                                        <th className="px-4 py-3 text-left">Campañas</th>
                                                        <th className="px-4 py-3 text-right">Publicaciones</th>
                                                        <th className="px-4 py-3 text-right">Vistas</th>
                                                        <th className="px-4 py-3 text-right">Alcance</th>
                                                        <th className="px-4 py-3 text-right">Me gusta</th>
                                                        <th className="px-4 py-3 text-right">Comentarios</th>
                                                        <th className="px-4 py-3 text-right">Guardados</th>
                                                        <th className="px-4 py-3 text-right">Compartidos</th>
                                                        <th className="px-4 py-3 text-right rounded-r-lg">Interacciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {creatorPerformance.map((item) => (
                                                        <React.Fragment key={item.userId}>
                                                            <tr 
                                                                className={`border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors ${expandedCreators.has(item.userId) ? 'bg-muted/10' : ''}`}
                                                                onClick={() => toggleCreator(item.userId)}
                                                            >
                                                                <td className="px-4 py-3 text-center">
                                                                    {item.individualPosts.length > 1 ? (
                                                                        expandedCreators.has(item.userId) ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                                    ) : null}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                                                                        {item.avatar && <img src={item.avatar} className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">{item.name}</div>
                                                                        <div className="text-xs text-muted-foreground">@{item.handle}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground">{item.campaigns}</td>
                                                                <td className="px-4 py-3 text-right">{item.posts}</td>
                                                                <td className="px-4 py-3 text-right">{item.views?.toLocaleString() || 0}</td>
                                                                <td className="px-4 py-3 text-right">{item.reach?.toLocaleString() || 0}</td>
                                                                <td className="px-4 py-3 text-right text-success font-medium">{item.likes.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right">{item.comments.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right">{item.saved?.toLocaleString() || 0}</td>
                                                                <td className="px-4 py-3 text-right">{item.shares?.toLocaleString() || 0}</td>
                                                                <td className="px-4 py-3 text-right">{item.interactions?.toLocaleString() || 0}</td>
                                                            </tr>
                                                            {expandedCreators.has(item.userId) && (
                                                                <tr className="bg-muted/5">
                                                                    <td colSpan={11} className="px-8 py-4">
                                                                        <div className="border rounded-lg bg-white/50 overflow-hidden">
                                                                            <table className="w-full text-xs">
                                                                                <thead>
                                                                                    <tr className="bg-muted/20 text-muted-foreground border-b">
                                                                                        <th className="px-4 py-2 text-left">Publicación / Entregable</th>
                                                                                        <th className="px-4 py-2 text-right">Vistas</th>
                                                                                        <th className="px-4 py-2 text-right">Me Gusta</th>
                                                                                        <th className="px-4 py-2 text-right">Comentarios</th>
                                                                                        <th className="px-4 py-2 text-right">Guardados</th>
                                                                                        <th className="px-4 py-2 text-right">Compartidos</th>
                                                                                        <th className="px-4 py-2 text-right">Acción</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {item.individualPosts.map((post: any, idx: number) => (
                                                                                        <tr key={post.id || idx} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                                                                                            <td className="px-4 py-2">
                                                                                                <div className="font-medium text-sm text-primary/80">
                                                                                                    {post.deliverableType} #{post.deliverableNumber}
                                                                                                </div>
                                                                                                <div className="text-[10px] text-muted-foreground uppercase">{post.platform}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-right">{post.views?.toLocaleString() || 0}</td>
                                                                                            <td className="px-4 py-2 text-right text-success">{post.likes.toLocaleString()}</td>
                                                                                            <td className="px-4 py-2 text-right">{post.comments.toLocaleString()}</td>
                                                                                            <td className="px-4 py-2 text-right">{post.saved?.toLocaleString() || 0}</td>
                                                                                            <td className="px-4 py-2 text-right">{post.shares?.toLocaleString() || 0}</td>
                                                                                            <td className="px-4 py-2 text-right">
                                                                                                {post.contentUrl && (
                                                                                                    <a 
                                                                                                        href={post.contentUrl} 
                                                                                                        target="_blank" 
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                                                                                    >
                                                                                                        Ver <ExternalLink className="w-2 h-2" />
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
                                        <p className="text-center text-muted-foreground py-8">Aún no hay datos específicos de creadores disponibles.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center p-8 border rounded-lg bg-white">
                        <p>Aún no hay datos de analytics disponibles. ¡Inicia una campaña para ver los resultados!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

