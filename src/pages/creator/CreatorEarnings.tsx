import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Search, Download, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CreatorEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarned: 0,
        pending: 0,
        available: 0
    });

    useEffect(() => {
        const fetchEarnings = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch real payments from subcollection
                const paymentsRef = collection(db, "users", user.uid, "payments");
                const q = query(paymentsRef, orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);

                const fetchedPayments: any[] = [];
                let total = 0;
                let pending = 0;
                let available = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedPayments.push({ id: doc.id, ...data });

                    if (data.status === 'completed') {
                        total += data.amount || 0;
                        available += data.amount || 0; // Assuming all completed are available for now, unless 'withdrawn' status exists
                    } else if (data.status === 'pending') {
                        pending += data.amount || 0;
                    }
                });

                setPayments(fetchedPayments);
                setStats({
                    totalEarned: total,
                    pending: pending,
                    available: available // Adjust logic if you have withdrawals
                });
            } catch (error) {
                console.error("Error fetching earnings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarnings();
    }, [user]);

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Earnings"
                    subtitle="Track your income and payment history"
                />

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : payments.length > 0 ? (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="glass-card bg-primary/5 border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                                    <DollarSign className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                    <Clock className="h-4 w-4 text-warning" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.pending.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">releasing soon</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                                    <DollarSign className="h-4 w-4 text-success" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.available.toLocaleString()}</div>
                                    <Button size="sm" className="mt-2 w-full" variant="outline" disabled={stats.available <= 0}>
                                        Request Payout
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transactions */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Transaction History</CardTitle>
                                        <CardDescription>Recent payments and activity</CardDescription>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <div className="relative flex-1 md:flex-initial md:w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Search transactions..." className="pl-8" />
                                        </div>
                                        <Button variant="outline" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${payment.status === 'completed' ? 'bg-success/10' : 'bg-warning/10'}`}>
                                                    {payment.status === 'completed' ? (
                                                        <ArrowDownLeft className={`h-4 w-4 ${payment.status === 'completed' ? 'text-success' : 'text-warning'}`} />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-warning" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{payment.brand || "Unknown Brand"}</p>
                                                    <p className="text-sm text-muted-foreground">{payment.type || "Payment"} • {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">+${payment.amount?.toLocaleString()}</p>
                                                <p className={`text-xs capitalize ${payment.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                                                    {payment.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <DollarSign className="w-10 h-10 text-primary" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="text-2xl font-bold">Start Earning Today!</h3>
                            <p className="text-muted-foreground">
                                You haven't received any payments yet. Apply to campaigns and collaborate with brands to start building your income.
                            </p>
                        </div>
                        <Button size="lg" asChild className="mt-4">
                            <a href="/creator/opportunities">
                                Find Opportunities <ArrowUpRight className="ml-2 w-4 h-4" />
                            </a>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
