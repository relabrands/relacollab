import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function BrandAnalytics() {
    const { user } = useAuth();
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
    const [originalSubmissions, setOriginalSubmissions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Get Brand Campaigns
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const campaignSnapshot = await getDocs(q);
                const campaignIds = campaignSnapshot.docs.map(d => d.id);
                const campaignMap = new Map(campaignSnapshot.docs.map(d => [d.id, d.data().name]));

                if (campaignIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Get Submissions for these campaigns
                // Firestore 'in' query supports up to 10 items. If more, we might need multiple queries or just fetch all submissions and filter (if not too many).
                // For Scalability: Query submissions by brandId if we added it, but we didn't.
                // Alternative: Query *all* submissions and filter in JS (okay for MVP).
                // Better: Fetch submissions for each campaign (Promise.all).

                const submissionsPromises = campaignIds.map(id =>
                    getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
                );

                const snapshots = await Promise.all(submissionsPromises);
                let allSubmissions: any[] = [];
                snapshots.forEach(snap => {
                    allSubmissions = [...allSubmissions, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
                });

                setOriginalSubmissions(allSubmissions);
                processData(allSubmissions, "all");

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        // 2. Process Data when Platform or Submissions Change
        useEffect(() => {
            const process = async () => {
                if (loading) return; // Wait until initial data fetching is complete

                const filteredSubmissions = activePlatform === "all"
                    ? rawSubmissions
                    : rawSubmissions.filter(s => (s.platform || (s.metrics?.inputPlatform) || "instagram") === activePlatform);

                // Aggregate Data
                let tPosts = 0;
                let tLikes = 0;
                let tComments = 0;
                let tReach = 0;
                let tSaved = 0;
                let tShares = 0;
                let tViews = 0;
                let tInteractions = 0;

                const creatorStats: any = {};

                for (const sub of filteredSubmissions) {
                    tPosts++;
                    const likes = sub.metrics?.likes || 0;
                    const comments = sub.metrics?.comments || 0;
                    const reach = sub.metrics?.reach || 0;
                    const saved = sub.metrics?.saved || 0;
                    const shares = sub.metrics?.shares || 0;
                    const views = sub.metrics?.views || 0;
                    const interactions = sub.metrics?.interactions || 0;

                    tLikes += likes;
                    tComments += comments;
                    tReach += reach;
                    tSaved += saved;
                    tShares += shares;
                    tViews += views;
                    tInteractions += interactions;

                    const creatorKey = sub.userId || sub.creatorId;
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
                            campaigns: new Set()
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
                    creatorStats[creatorKey].campaigns.add(campMap.get(sub.campaignId) || "Unknown");
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

                // Fetch Creator Profiles
                const creatorIds = Object.keys(creatorStats);
                if (creatorIds.length > 0) {
                    const userPromises = creatorIds.map(id => getDoc(doc(db, "users", id)));
                    const userSnaps = await Promise.all(userPromises);
                    const creatorsData = userSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);

                    const enrichedPerformance = creatorIds.map(id => {
                        const profile: any = creatorsData.find((c: any) => c.id === id);
                        const stat = creatorStats[id];
                        return {
                            ...stat,
                            name: profile?.displayName || "Unknown Creator",
                            avatar: profile?.photoURL || profile?.avatar,
                            handle: profile?.instagramUsername || profile?.socialHandles?.tiktok,
                            campaigns: Array.from(stat.campaigns).join(", ")
                        };
                    });
                    setCreatorPerformance(enrichedPerformance);
                } else {
                    setCreatorPerformance([]);
                }

                // Chart Data
                // We need to re-map based on filtered submissions to show how campaigns are doing for this platform
                const campaignGroups: any = {};
                filteredSubmissions.forEach(sub => {
                    if (!campaignGroups[sub.campaignId]) {
                        campaignGroups[sub.campaignId] = {
                            name: campMap.get(sub.campaignId) || "Unknown",
                            likes: 0,
                            posts: 0
                        };
                    }
                    campaignGroups[sub.campaignId].likes += (sub.metrics?.likes || 0);
                    campaignGroups[sub.campaignId].posts += 1;
                });
                const chartData = Object.values(campaignGroups).map((c: any) => ({
                    name: c.name.substring(0, 10),
                    likes: c.likes,
                    posts: c.posts
                }));
                setData(chartData);
            };

            process();
        }, [rawSubmissions, activePlatform, campMap, loading]); // Dependencies for re-processing

        if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

        return (
            <div className="flex min-h-screen bg-background">
                <DashboardSidebar type="brand" />
                <MobileNav type="brand" />

                <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                    <DashboardHeader title="Analytics Overview" subtitle="Real-time performance from valid submissions" />

                    {/* Platform Toggle */}
                    <div className="flex gap-2 mb-6">
                        <Button
                            variant={activePlatform === "all" ? "default" : "outline"}
                            onClick={() => setActivePlatform("all")}
                            size="sm"
                        >
                            All Platforms
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

                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{stats.totalPosts}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-indigo-600">{stats.totalViews?.toLocaleString() || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.totalReach?.toLocaleString() || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Interactions</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-teal-600">{stats.totalInteractions?.toLocaleString() || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-pink-600">{stats.totalLikes.toLocaleString()}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-primary">{stats.totalComments.toLocaleString()}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-purple-600">{stats.totalSaved?.toLocaleString() || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Shares</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-orange-600">{stats.totalShares?.toLocaleString() || 0}</div></CardContent>
                        </Card>
                    </div>

                    {data.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chart */}
                            <Card className="col-span-3 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Campaign Performance (Likes)</CardTitle>
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

                            {/* Creator Breakdown Table */}
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Creator Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {creatorPerformance.length > 0 ? (
                                            <div className="w-full overflow-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                                        <tr>
                                                            <th className="px-4 py-3 rounded-l-lg">Creator</th>
                                                            <th className="px-4 py-3">Campaigns</th>
                                                            <th className="px-4 py-3 text-right">Posts</th>
                                                            <th className="px-4 py-3 text-right">Views</th>
                                                            <th className="px-4 py-3 text-right">Reach</th>
                                                            <th className="px-4 py-3 text-right">Likes</th>
                                                            <th className="px-4 py-3 text-right">Comments</th>
                                                            <th className="px-4 py-3 text-right">Saved</th>
                                                            <th className="px-4 py-3 text-right">Shares</th>
                                                            <th className="px-4 py-3 text-right rounded-r-lg">Interactions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {creatorPerformance.map((item) => (
                                                            <tr key={item.userId} className="border-b border-border/50 hover:bg-muted/20">
                                                                <td className="px-4 py-3 font-medium flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
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
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No specific creator data available yet.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center p-8 border rounded-lg bg-white">
                            <p>No analytics data available yet. Start a campaign to see results!</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }
                        </div >
                    )
}
                </main >
            </div >
        );
    }
