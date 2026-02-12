import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Search, Download, Loader2, Settings, Wallet } from "lucide-react";
import { collection, query, where, getDocs, orderBy, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { PayoutSettings } from "@/components/creator/PayoutSettings";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function CreatorEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hasBankDetails, setHasBankDetails] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    const [stats, setStats] = useState({
        totalEarned: 0,
        pending: 0,
        available: 0,
        requested: 0
    });

    const statusColors = {
        pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        ready_to_withdraw: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        requested: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        paid: "bg-green-500/10 text-green-500 border-green-500/20",
    };

    const statusLabels = {
        pending: "Pending",
        ready_to_withdraw: "Ready to Withdraw",
        requested: "Processing",
        paid: "Paid"
    };

    useEffect(() => {
        if (user) {
            checkBankDetails();
            fetchEarnings();
        }
    }, [user]);

    const checkBankDetails = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().bankAccount) {
                setHasBankDetails(true);
            } else {
                setHasBankDetails(false);
            }
        } catch (error) {
            console.error("Error checking bank details:", error);
        }
    };

    const fetchEarnings = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch payouts from root collection
            const q = query(
                collection(db, "payouts"),
                where("creatorId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);

            const fetchedPayments: any[] = [];
            let total = 0;
            let pending = 0;
            let available = 0;
            let requested = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedPayments.push({ id: doc.id, ...data });

                const amount = data.netAmount || 0;

                if (data.status === 'paid') {
                    total += amount;
                } else if (data.status === 'pending') {
                    pending += amount;
                } else if (data.status === 'ready_to_withdraw') {
                    available += amount;
                } else if (data.status === 'requested') {
                    requested += amount;
                }
            });

            setPayments(fetchedPayments);
            setStats({
                totalEarned: total,
                pending: pending,
                available: available,
                requested: requested
            });
        } catch (error) {
            console.error("Error fetching earnings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        if (!user || stats.available <= 0) return;

        if (!hasBankDetails) {
            setIsSettingsOpen(true);
            toast.info("Please configure your bank details first.");
            return;
        }

        setIsRequesting(true);
        try {
            const batch = writeBatch(db);
            const readyPayouts = payments.filter(p => p.status === 'ready_to_withdraw');

            readyPayouts.forEach(p => {
                const payoutRef = doc(db, "payouts", p.id);
                batch.update(payoutRef, {
                    status: 'requested',
                    requestedAt: new Date().toISOString()
                });
            });

            await batch.commit();
            toast.success("Payout request submitted successfully!");
            fetchEarnings(); // Refresh data
        } catch (error) {
            console.error("Error requesting payout:", error);
            toast.error("Failed to request payout.");
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Earnings"
                    subtitle="Track your income and manage payouts"
                >
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
                        <Settings className="w-4 h-4" />
                        Payout Settings
                    </Button>
                </DashboardHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                                    <Clock className="h-4 w-4 text-warning" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.pending.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">From active campaigns</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card bg-primary/5 border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                                    <Wallet className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.available.toLocaleString()}</div>
                                    {stats.requested > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            +${stats.requested.toLocaleString()} processing
                                        </p>
                                    )}
                                    <Button
                                        size="sm"
                                        className="mt-3 w-full"
                                        disabled={stats.available <= 0 || isRequesting}
                                        onClick={handleRequestPayout}
                                    >
                                        {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Request Payout
                                    </Button>
                                    {!hasBankDetails && stats.available > 0 && (
                                        <p className="text-[10px] text-destructive mt-1 text-center cursor-pointer hover:underline" onClick={() => setIsSettingsOpen(true)}>
                                            * Setup bank details to withdraw
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                    <DollarSign className="h-4 w-4 text-success" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Lifetime earnings</p>
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
                                {payments.length > 0 ? (
                                    <div className="space-y-4">
                                        {payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${payment.status === 'paid' ? 'bg-success/10' : 'bg-muted'}`}>
                                                        {payment.status === 'paid' ? (
                                                            <ArrowDownLeft className="h-4 w-4 text-success" />
                                                        ) : (
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{payment.campaignName || "Campaign Payment"}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
                                                            {payment.feeAmount > 0 && ` • Fee: $${payment.feeAmount}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">+${(payment.netAmount || 0).toLocaleString()}</p>
                                                    <Badge variant="outline" className={`mt-1 capitalize ${statusColors[payment.status as keyof typeof statusColors] || ''}`}>
                                                        {statusLabels[payment.status as keyof typeof statusLabels] || payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="p-4 bg-muted rounded-full">
                                            <DollarSign className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">No transactions yet</p>
                                            <p className="text-sm text-muted-foreground">When you complete campaigns, payments will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>

            <PayoutSettings
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                onSuccess={() => {
                    checkBankDetails();
                    toast.success("Details updated check!");
                }}
            />
        </div>
    );
}
