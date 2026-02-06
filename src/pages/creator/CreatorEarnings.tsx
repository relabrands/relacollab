import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Search, Download } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CreatorEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalEarned: 0,
        pending: 0,
        available: 0
    });

    useEffect(() => {
        // In a real app, you'd fetch from a subcollection or separate payments collection
        // For now, we'll mock the data logic structure but pretend to fetch
        const fetchEarnings = async () => {
            if (!user) return;

            // Mock data logic for demonstration
            // Replace with actual Firestore query when payments collection exists
            const mockPayments = [
                { id: "1", brand: "Sunrise Cafe", amount: 500, status: "completed", date: "2024-02-15", type: "Campaign" },
                { id: "2", brand: "FitLife Gym", amount: 350, status: "pending", date: "2024-02-28", type: "Campaign" },
            ];

            setPayments(mockPayments);
            setStats({
                totalEarned: 500,
                pending: 350,
                available: 500
            });
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="glass-card bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.totalEarned}</div>
                            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-warning" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.pending}</div>
                            <p className="text-xs text-muted-foreground">releasing soon</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                            <DollarSign className="h-4 w-4 text-success" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.available}</div>
                            <Button size="sm" className="mt-2 w-full" variant="outline">
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
                            {payments.length > 0 ? (
                                payments.map((payment) => (
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
                                                <p className="font-medium">{payment.brand}</p>
                                                <p className="text-sm text-muted-foreground">{payment.type} • {payment.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">+${payment.amount}</p>
                                            <p className={`text-xs capitalize ${payment.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                                                {payment.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions found
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
