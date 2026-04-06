
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Search, DollarSign, FileText, CheckCircle, Download, ExternalLink, Loader2 as Loader, Eye, Upload, CreditCard, Building2, User, Gift } from "lucide-react";
import { toast } from "sonner";
import { collection, query, getDocs, doc, updateDoc, orderBy, getDoc, where, writeBatch, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Types
interface Invoice {
    id: string;
    brandId: string;
    brandName?: string;
    campaignId: string;
    campaignName: string;
    status: "pending" | "verifying" | "paid";
    createdAt: any;
    receiptUrl?: string;
    // Amounts
    totalGross: number;
    totalFee: number;
    totalNet: number;
    feePercent: number;
    creatorCount: number;
    perCreatorGross: number;
}

interface SubscriptionInvoice {
    id: string;
    brandId: string;
    planId: string;
    planName: string;
    planCredits?: number;
    amount: number;
    interval: string;
    status: "verifying" | "paid";
    createdAt: any;
    paidAt?: any;
    receiptUrl: string;
}

interface Payout {
    id: string;
    creatorId: string;
    creatorName?: string;
    campaignId: string;
    campaignName: string;
    amount: number;
    netAmount?: number;
    type?: "monetary" | "exchange";
    status: "pending" | "ready_to_withdraw" | "requested" | "paid" | "completed";
    requestedAt?: any; // Added for grouping
    paidAt?: any;
    createdAt: any;
    receiptUrl?: string;
    exchangeDetails?: string;
    // Bank details fetched on demand
    bankDetails?: {
        bankName: string;
        accountType: string;
        accountNumber: string;
        identityDocument: string;
        accountHolder: string;
    };
}

interface PayoutGroup {
    id: string;
    creatorId: string;
    creatorName: string;
    status: Payout["status"];
    totalAmount: number;
    payouts: Payout[];
    date: any;
    bankDetails?: Payout["bankDetails"];
    receiptUrl?: string;
    paidAt?: any;
}

export default function AdminFinance() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [subscriptionInvoices, setSubscriptionInvoices] = useState<SubscriptionInvoice[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("invoices");

    // Dialog States
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionInvoice | null>(null);
    const [selectedPayoutGroup, setSelectedPayoutGroup] = useState<PayoutGroup | null>(null);
    const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
    const [isSubscriptionDetailsOpen, setIsSubscriptionDetailsOpen] = useState(false);
    const [isPayoutDetailsOpen, setIsPayoutDetailsOpen] = useState(false);

    // Payout Action State
    const [payoutReceiptUrl, setPayoutReceiptUrl] = useState("");
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
    const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);

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

            // Fetch Subscription Invoices
            const subInvoicesRef = collection(db, "subscriptionInvoices");
            const subInvoicesQuery = query(subInvoicesRef, orderBy("createdAt", "desc"));
            const subInvoicesSnap = await getDocs(subInvoicesQuery);

            const subInvoicesData = subInvoicesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SubscriptionInvoice[];

            setSubscriptionInvoices(subInvoicesData);

            // Fetch Creator Payouts
            const payoutsRef = collection(db, "payouts");
            const payoutsQuery = query(payoutsRef, orderBy("createdAt", "desc"));
            const payoutsSnap = await getDocs(payoutsQuery);

            const payoutsData = payoutsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    amount: (data.type === 'exchange') ? 0 : (data.netAmount || data.amount || 0),
                    exchangeDetails: data.exchangeDetails || "Producto/Servicio"
                };
            }) as Payout[];

            setPayouts(payoutsData);

        } catch (error) {
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    };

    // --- Invoice Logic ---
    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsInvoiceDetailsOpen(true);
    };

    const handleMarkInvoicePaid = async (invoice: Invoice) => {
        if (!confirm(`Confirm payment received for ${invoice.campaignName}? This will release creator payouts.`)) return;

        try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            // 1. Mark invoice as paid
            batch.update(doc(db, "invoices", invoice.id), {
                status: "paid",
                paidAt: now
            });

            // 2. Find all `pending` payouts for this campaign and release them to `ready_to_withdraw`
            const payoutsQ = query(
                collection(db, "payouts"),
                where("campaignId", "==", invoice.campaignId),
                where("status", "==", "pending")
            );
            const payoutsSnap = await getDocs(payoutsQ);
            let releasedCount = 0;
            payoutsSnap.docs.forEach(payoutDoc => {
                const d = payoutDoc.data();
                // Only release monetary payouts, not exchanges
                if (d.type !== "exchange") {
                    batch.update(doc(db, "payouts", payoutDoc.id), {
                        status: "ready_to_withdraw",
                        releasedAt: now
                    });
                    releasedCount++;
                }
            });

            await batch.commit();

            toast.success(`Invoice confirmed! ${releasedCount} creator payout${releasedCount !== 1 ? 's' : ''} released for withdrawal.`);
            setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: "paid" } : i));
            // Refresh payouts to reflect new statuses
            const refreshedPayoutsSnap = await getDocs(query(collection(db, "payouts"), orderBy("createdAt", "desc")));
            const refreshed = refreshedPayoutsSnap.docs.map(d => {
                const data = d.data();
                return { id: d.id, ...data, amount: data.netAmount || data.amount || 0 };
            }) as Payout[];
            setPayouts(refreshed);
            setIsInvoiceDetailsOpen(false);
        } catch (error) {
            toast.error("Failed to confirm invoice");
        }
    };

    // --- Subscription Logic ---
    const handleViewSubscription = (invoice: SubscriptionInvoice) => {
        setSelectedSubscription(invoice);
        setIsSubscriptionDetailsOpen(true);
    };

    const handleMarkSubscriptionPaid = async (invoice: SubscriptionInvoice) => {
        if (!confirm(`Confirm payment received for ${invoice.planName} plan? This will activate the brand's subscription.`)) return;

        try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            // 1. Mark subscription invoice as paid
            batch.update(doc(db, "subscriptionInvoices", invoice.id), {
                status: "paid",
                paidAt: now
            });

            // 2. Activate plan for brand and add credits
            batch.update(doc(db, "users", invoice.brandId), {
                plan: invoice.planName,
                subscriptionStatus: "active",
                credits: increment(invoice.planCredits || 0),
                updatedAt: now
            });

            await batch.commit();

            toast.success("Subscription payment confirmed and plan activated.");
            setSubscriptionInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: "paid" } : i));
            setIsSubscriptionDetailsOpen(false);
        } catch (error) {
            toast.error("Failed to confirm subscription payment");
        }
    };

    // --- Payout Logic ---
    const handleViewPayout = async (group: PayoutGroup) => {
        setSelectedPayoutGroup(group);
        setIsPayoutDetailsOpen(true);
        setPayoutReceiptUrl(group.receiptUrl || "");

        // Fetch Bank Details if not present for the first payout in group
        if (!group.bankDetails && group.payouts.length > 0) {
            setIsLoadingBankDetails(true);
            try {
                const userDoc = await getDoc(doc(db, "users", group.creatorId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const bankDetails = userData.bankAccount;
                    if (bankDetails) {
                        setSelectedPayoutGroup(prev => prev ? { ...prev, bankDetails } : null);
                    }
                }
            } catch (error) {
                toast.error("Could not load creator bank details");
            } finally {
                setIsLoadingBankDetails(false);
            }
        }
    };

    const handleMarkPayoutPaid = async () => {
        if (!selectedPayoutGroup) return;
        if (!payoutReceiptUrl) {
            toast.error("Please provide a receipt URL");
            return;
        }

        setIsSubmittingPayout(true);
        try {
            const batch = writeBatch(db);
            const paidAt = new Date().toISOString();

            selectedPayoutGroup.payouts.forEach(payout => {
                batch.update(doc(db, "payouts", payout.id), {
                    status: "paid",
                    receiptUrl: payoutReceiptUrl,
                    paidAt: paidAt
                });
            });

            await batch.commit();

            toast.success("Payouts marked as PAID");
            
            // Update local state
            setPayouts(prev => prev.map(p => {
                const updatedPayout = selectedPayoutGroup.payouts.find(up => up.id === p.id);
                if (updatedPayout) {
                    return { ...p, status: "paid" as const, receiptUrl: payoutReceiptUrl, paidAt };
                }
                return p;
            }));

            setIsPayoutDetailsOpen(false);
        } catch (error) {
            toast.error("Failed to update payouts");
        } finally {
            setIsSubmittingPayout(false);
        }
    };


    // Helpers
    const formatDate = (date: any) => {
        if (!date) return "N/A";
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const filteredInvoices = invoices.filter(item =>
        item.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubInvoices = subscriptionInvoices.filter(item =>
        item.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayouts = payouts.filter(item =>
        item.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping Logic for Creator Payouts
    const groupedPayouts = Array.from(filteredPayouts.reduce((acc, payout) => {
        // Grouping key: For 'requested' or 'paid', use creatorId + timestamp
        // For others, keep separate by using unique ID as part of key
        let groupKey = "";
        if (payout.status === "requested") {
            const reqDate = payout.requestedAt?.seconds ? payout.requestedAt.seconds : (payout.requestedAt || payout.createdAt);
            groupKey = `req_${payout.creatorId}_${reqDate}`;
        } else if (payout.status === "paid") {
            const paidDate = payout.paidAt?.seconds ? payout.paidAt.seconds : (payout.paidAt || payout.createdAt);
            groupKey = `paid_${payout.creatorId}_${paidDate}`;
        } else {
            groupKey = `other_${payout.id}`;
        }

        if (!acc.has(groupKey)) {
            acc.set(groupKey, {
                id: groupKey,
                creatorId: payout.creatorId,
                creatorName: payout.creatorName || "Unknown",
                status: payout.status,
                totalAmount: 0,
                payouts: [],
                date: payout.status === "paid" ? payout.paidAt : (payout.status === "requested" ? payout.requestedAt : payout.createdAt),
                bankDetails: payout.bankDetails,
                receiptUrl: payout.receiptUrl,
                paidAt: payout.paidAt
            });
        }

        const group = acc.get(groupKey)!;
        group.payouts.push(payout);
        group.totalAmount += (payout.amount || 0);

        return acc;
    }, new Map<string, PayoutGroup>()).values()).sort((a, b) => {
        const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
        const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime();
        return (dateB || 0) - (dateA || 0);
    });

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
                            placeholder="Search details..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Tabs defaultValue="invoices" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="invoices" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Campaigns
                            <Badge variant="secondary" className="ml-1">
                                {filteredInvoices.filter(i => i.status === 'pending' || i.status === 'verifying').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Subscriptions
                            <Badge variant="secondary" className="ml-1">
                                {filteredSubInvoices.filter(i => i.status === 'verifying').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="payouts" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Payouts
                            <Badge variant="secondary" className="ml-1">
                                {groupedPayouts.filter(g => g.status === 'pending' || g.status === 'requested' || g.status === 'ready_to_withdraw').length}
                            </Badge>
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
                                                <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
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
                                                        <td className="p-4 font-medium">{invoice.campaignName || "Unknown"}</td>
                                                        <td className="p-4">{invoice.brandName || "Unknown"}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(invoice.totalGross || 0)}</td>
                                                        <td className="p-4">
                                                            <Badge
                                                                variant={invoice.status === 'paid' ? 'success' : invoice.status === 'verifying' ? 'warning' : 'destructive'}
                                                                className="capitalize"
                                                            >
                                                                {invoice.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            </TabsContent>

                            {/* Subscriptions Tab */}
                            <TabsContent value="subscriptions">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card overflow-hidden"
                                >
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Brand ID</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSubInvoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                        No subscription invoices found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSubInvoices.map((invoice) => (
                                                    <tr key={invoice.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                                        <td className="p-4 font-medium">{invoice.planName || "Unknown"}</td>
                                                        <td className="p-4 truncate max-w-[150px]">{invoice.brandId}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                                                        <td className="p-4">
                                                            <Badge
                                                                variant={invoice.status === 'paid' ? 'success' : 'warning'}
                                                                className="capitalize"
                                                            >
                                                                {invoice.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewSubscription(invoice)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Details
                                                            </Button>
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
                                                <th className="text-left p-4 font-medium text-muted-foreground">Campaign / Bundle</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Creator</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Payout Amount</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedPayouts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                        No payouts found
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupedPayouts.map((group) => (
                                                    <tr key={group.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                                        <td className="p-4 font-medium">
                                                            {group.payouts.length > 1 ? (
                                                                <div className="flex flex-col">
                                                                    <span>Transfer Bundle</span>
                                                                    <span className="text-[10px] text-muted-foreground">({group.payouts.length} campaigns combined)</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold">{group.payouts[0].campaignName}</span>
                                                                    {group.payouts[0].type === 'exchange' ? (
                                                                        <div className="flex items-center gap-1.5 mt-1">
                                                                            <Gift className="w-3 h-3 text-primary" />
                                                                            <span className="text-[11px] text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                                                {group.payouts[0].exchangeDetails}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium mt-0.5">Campaña Monetaria</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4">{group.creatorName}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(group.date)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(group.totalAmount)}</td>
                                                        <td className="p-4">
                                                            {(() => {
                                                                const statusMap: Record<string, { label: string; variant: any }> = {
                                                                    pending: { label: "Pending Approval", variant: "secondary" },
                                                                    ready_to_withdraw: { label: "Ready for Payout", variant: "warning" },
                                                                    requested: { label: "Processing", variant: "warning" },
                                                                    paid: { label: "Paid", variant: "success" },
                                                                    completed: { label: "Completed (Exchange)", variant: "success" },
                                                                };
                                                                const s = statusMap[group.status] || { label: group.status, variant: "secondary" };
                                                                return <Badge variant={s.variant} className="capitalize">{s.label}</Badge>;
                                                            })()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewPayout(group)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Details
                                                            </Button>
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

                {/* --- Invoice Details Dialog --- */}
                <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Invoice Details</DialogTitle>
                            <DialogDescription>Review invoice breakdown and status.</DialogDescription>
                        </DialogHeader>
                        {selectedInvoice && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Brand</p>
                                        <p className="font-medium">{selectedInvoice.brandName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Campaign</p>
                                        <p className="font-medium">{selectedInvoice.campaignName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Date Created</p>
                                        <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge
                                            variant={selectedInvoice.status === 'paid' ? 'success' : selectedInvoice.status === 'verifying' ? 'warning' : 'destructive'}
                                            className="capitalize"
                                        >
                                            {selectedInvoice.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <Card className="bg-muted/30 border-muted">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Creators Payment ({selectedInvoice.creatorCount} x {formatCurrency(selectedInvoice.perCreatorGross)})</span>
                                            <span>{formatCurrency(selectedInvoice.totalNet)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground text-sm">
                                            <span>Platform Fee ({selectedInvoice.feePercent}%)</span>
                                            <span>{formatCurrency(selectedInvoice.totalFee)}</span>
                                        </div>
                                        <div className="h-px bg-border my-2" />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total Invoice</span>
                                            <span>{formatCurrency(selectedInvoice.totalGross)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Receipt Section */}
                                {selectedInvoice.receiptUrl ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="font-medium text-green-700">Receipt Submitted</span>
                                        </div>
                                        <Button variant="outline" size="sm" asChild className="gap-2">
                                            <a href={selectedInvoice.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                                View Receipt
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg text-muted-foreground text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        No receipt uploaded yet (Wait for brand to submit)
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsInvoiceDetailsOpen(false)}>Close</Button>
                            {selectedInvoice?.status === 'verifying' && (
                                <Button
                                    variant="hero"
                                    onClick={() => selectedInvoice && handleMarkInvoicePaid(selectedInvoice)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirm & Release Creator Payouts
                                </Button>
                            )}
                            {selectedInvoice?.status === 'pending' && (
                                <div className="text-sm text-muted-foreground italic">
                                    Waiting for brand to upload receipt...
                                </div>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- Subscription Details Dialog --- */}
                <Dialog open={isSubscriptionDetailsOpen} onOpenChange={setIsSubscriptionDetailsOpen}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Subscription Invoice Details</DialogTitle>
                            <DialogDescription>Review subscription payment and activate plan.</DialogDescription>
                        </DialogHeader>
                        {selectedSubscription && (
                            <div className="space-y-6 mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Plan</p>
                                        <p className="font-medium text-lg">{selectedSubscription.planName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Amount</p>
                                        <p className="font-bold text-lg text-primary">{formatCurrency(selectedSubscription.amount)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Brand ID</p>
                                        <p className="font-medium font-mono text-xs break-all">{selectedSubscription.brandId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Date Submitted</p>
                                        <p className="font-medium">{formatDate(selectedSubscription.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Receipt Section */}
                                <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center gap-4">
                                    <p className="text-sm font-medium">Uploaded Receipt</p>
                                    {selectedSubscription.receiptUrl ? (
                                        <Button variant="outline" asChild>
                                            <a href={selectedSubscription.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View Transfer Receipt
                                            </a>
                                        </Button>
                                    ) : (
                                        <p className="text-muted-foreground text-sm italic">No receipt provided</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsSubscriptionDetailsOpen(false)}>Close</Button>
                            {selectedSubscription?.status === 'verifying' && (
                                <Button
                                    variant="hero"
                                    onClick={() => selectedSubscription && handleMarkSubscriptionPaid(selectedSubscription)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify Payment & Activate Plan
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* --- Payout Details Dialog --- */}
                <Dialog open={isPayoutDetailsOpen} onOpenChange={setIsPayoutDetailsOpen}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{selectedPayoutGroup?.status === 'paid' || selectedPayoutGroup?.status === 'completed' ? 'Payout Details' : 'Process Payout'}</DialogTitle>
                            <DialogDescription>Review distribution and bank details.</DialogDescription>
                        </DialogHeader>

                        {selectedPayoutGroup && (
                            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                                {/* Amount & Summary */}
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total to Pay</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(selectedPayoutGroup.totalAmount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Creator</p>
                                        <p className="font-medium">{selectedPayoutGroup.creatorName}</p>
                                    </div>
                                </div>

                                {/* Campaign Distribution Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm text-muted-foreground px-1">Campaign Distribution</h4>
                                    <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
                                        {selectedPayoutGroup.payouts.map((p) => (
                                            <div key={p.id} className="flex justify-between items-start text-sm gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-foreground font-semibold">{p.campaignName}</span>
                                                    {p.type === 'exchange' && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                                                            <Gift className="w-3.5 h-3.5" />
                                                            <span>{p.exchangeDetails}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-md block">{formatCurrency(p.amount)}</span>
                                                    {p.type === 'exchange' && <span className="text-[10px] text-muted-foreground uppercase">Intercambio</span>}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="h-px bg-border my-1" />
                                        <div className="flex justify-between items-center font-bold">
                                            <span>Requested Total</span>
                                            <span>{formatCurrency(selectedPayoutGroup.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Bank Account Details
                                    </h4>

                                    {isLoadingBankDetails ? (
                                        <div className="p-8 flex justify-center"><Loader className="animate-spin w-6 h-6" /></div>
                                    ) : selectedPayoutGroup.bankDetails ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bank</Label>
                                                <p className="font-semibold">{selectedPayoutGroup.bankDetails.bankName}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Type</Label>
                                                <p className="font-semibold capitalize">{selectedPayoutGroup.bankDetails.accountType}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Number</Label>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono font-bold text-lg text-primary">{selectedPayoutGroup.bankDetails.accountNumber}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">ID (RNC/Cedula)</Label>
                                                <p className="font-semibold">{selectedPayoutGroup.bankDetails.identityDocument}</p>
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Holder</Label>
                                                <p className="font-semibold flex items-center gap-2 text-md">
                                                    <User className="w-4 h-4 text-primary" />
                                                    {selectedPayoutGroup.bankDetails.accountHolder}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg text-destructive text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Creator has not configured bank details yet.
                                        </div>
                                    )}
                                </div>

                                {/* Upload Receipt (Only if not paid) */}
                                {selectedPayoutGroup.status !== 'paid' && selectedPayoutGroup.status !== 'completed' ? (
                                    <div className="space-y-2 pt-4 border-t">
                                        <Label>Payment Receipt URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://drive.google.com/..."
                                                value={payoutReceiptUrl}
                                                onChange={(e) => setPayoutReceiptUrl(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Upload the receipt to a cloud storage (Drive, Dropbox) and paste the link here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="font-medium text-green-700">
                                                {selectedPayoutGroup.status === 'completed' ? 'Exchange completed' : `Paid on ${formatDate(selectedPayoutGroup.paidAt)}`}
                                            </span>
                                        </div>
                                        {selectedPayoutGroup.receiptUrl && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={selectedPayoutGroup.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Receipt
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="p-6 pt-2 border-t flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setIsPayoutDetailsOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                            {selectedPayoutGroup?.status !== 'paid' && selectedPayoutGroup?.status !== 'completed' && (
                                <Button
                                    variant="hero"
                                    onClick={handleMarkPayoutPaid}
                                    disabled={isSubmittingPayout || !payoutReceiptUrl}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmittingPayout && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                    Mark all as Paid
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div >
    );
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    )
}
