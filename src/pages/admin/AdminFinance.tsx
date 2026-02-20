
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Search, DollarSign, FileText, CheckCircle, Download, ExternalLink, Loader2 as Loader } from "lucide-react";
import { toast } from "sonner";
import { collection, query, getDocs, doc, updateDoc, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Invoice {
    id: string;
    brandId: string;
    brandName?: string;
    campaignId: string;
    campaignName: string;
    amount: number;
    status: "pending" | "paid";
    createdAt: any;
    receiptUrl?: string;
}

interface Payout {
    id: string;
    creatorId: string;
    creatorName?: string;
    campaignId: string;
    campaignName: string;
    amount: number;
    status: "pending" | "paid";
    createdAt: any;
    receiptUrl?: string;
}

export default function AdminFinance() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("invoices");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Brand Invoices
            const invoicesRef = collection(db, "invoices");
            const invoicesQuery = query(invoicesRef, orderBy("createdAt", "desc"));
            const invoicesSnap = await getDocs(invoicesQuery);

            const invoicesData = invoicesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Invoice[];

            setInvoices(invoicesData);

            // Fetch Creator Payouts
            const payoutsRef = collection(db, "payouts");
            const payoutsQuery = query(payoutsRef, orderBy("createdAt", "desc"));
            const payoutsSnap = await getDocs(payoutsQuery);

            const payoutsData = payoutsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Payout[];

            setPayouts(payoutsData);

        } catch (error) {
            console.error("Error fetching finance data:", error);
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (collectionName: "invoices" | "payouts", id: string) => {
        if (!confirm("Are you sure you want to mark this as PAID?")) return;

        try {
            await updateDoc(doc(db, collectionName, id), {
                status: "paid",
                paidAt: new Date().toISOString()
            });

            toast.success("Marked as paid successfully");

            // Update local state
            if (collectionName === "invoices") {
                setInvoices(prev => prev.map(item => item.id === id ? { ...item, status: "paid" } : item));
            } else {
                setPayouts(prev => prev.map(item => item.id === id ? { ...item, status: "paid" } : item));
            }

        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const filteredInvoices = invoices.filter(item =>
        item.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayouts = payouts.filter(item =>
        item.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date: any) => {
        if (!date) return "N/A";
        // Handle Firestore Timestamp or Date string
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 ml-64 p-8">
                <DashboardHeader
                    title="Finance Overview"
                    subtitle="Manage brand invoices and creator payouts"
                />

                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by campaign or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Tabs defaultValue="invoices" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="invoices" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Brand Invoices
                            <Badge variant="secondary" className="ml-1">{filteredInvoices.filter(i => i.status === 'pending').length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="payouts" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Creator Payouts
                            <Badge variant="secondary" className="ml-1">{filteredPayouts.filter(p => p.status === 'pending').length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Brand Invoices Tab */}
                            <TabsContent value="invoices">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card overflow-hidden"
                                >
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Campaign</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInvoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                        No invoices found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredInvoices.map((invoice) => (
                                                    <tr key={invoice.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                                        <td className="p-4 font-medium">{invoice.campaignName || "Unknown Campaign"}</td>
                                                        <td className="p-4">{invoice.brandName || "Unknown Brand"}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                                                        <td className="p-4">
                                                            <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'} className="capitalize">
                                                                {invoice.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {invoice.status === 'pending' && (
                                                                <Button size="sm" onClick={() => handleMarkAsPaid('invoices', invoice.id)}>
                                                                    Mark as Paid
                                                                </Button>
                                                            )}
                                                            {invoice.receiptUrl && (
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <a href={invoice.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            </TabsContent>

                            {/* Creator Payouts Tab */}
                            <TabsContent value="payouts">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card overflow-hidden"
                                >
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Content</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Creator</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayouts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                        No payouts found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPayouts.map((payout) => (
                                                    <tr key={payout.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                                        <td className="p-4 font-medium">{payout.campaignName || "Unknown Campaign"}</td>
                                                        <td className="p-4">{payout.creatorName || "Unknown Creator"}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(payout.createdAt)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(payout.amount)}</td>
                                                        <td className="p-4">
                                                            <Badge variant={payout.status === 'paid' ? 'success' : 'warning'} className="capitalize">
                                                                {payout.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {payout.status === 'pending' && (
                                                                <Button size="sm" onClick={() => handleMarkAsPaid('payouts', payout.id)}>
                                                                    Mark as Paid
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </main>
        </div>
    );
}
