import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function BrandAnalytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
                const snapshot = await getDocs(q);
                // Mocking analytics data based on campaign count for now, as we don't have real analytics events yet
                const chartData = snapshot.docs.map((doc, index) => ({
                    name: doc.data().name.substring(0, 10),
                    views: Math.floor(Math.random() * 1000) + 100, // Real analytics would fetch this
                    clicks: Math.floor(Math.random() * 500) + 50
                }));
                setData(chartData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Analytics Overview" subtitle="Performance of your campaigns" />

                {data.length > 0 ? (
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={data}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Bar dataKey="views" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="clicks" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center p-8 border rounded-lg bg-white">
                        <p>No analytics data available yet. Start a campaign to see results!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
