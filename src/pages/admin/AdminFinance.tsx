
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
import { Search, DollarSign, FileText, CheckCircle, Download, ExternalLink, Loader2 as Loader, Eye, Upload, CreditCard, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { collection, query, getDocs, doc, updateDoc, orderBy, getDoc } from "firebase/firestore";
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

interface Payout {
    id: string;
    creatorId: string;
    creatorName?: string;
    campaignId: string;
    campaignName: string;
    amount: number; // This is usually the net amount
    status: "pending" | "requested" | "paid";
    createdAt: any;
    receiptUrl?: string;
    // Bank details fetched on demand
    bankDetails?: {
        bankName: string;
        accountType: string;
        accountNumber: string;
        identityDocument: string;
        accountHolder: string;
    };
}

export default function AdminFinance() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("invoices");

    // Dialog States
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
    const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
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

            // Fetch Creator Payouts
            const payoutsRef = collection(db, "payouts");
            const payoutsQuery = query(payoutsRef, orderBy("createdAt", "desc"));
            const payoutsSnap = await getDocs(payoutsQuery);

            const payoutsData = payoutsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    amount: data.netAmount || data.amount || 0
                };
            }) as Payout[];

            setPayouts(payoutsData);

        } catch (error) {
            console.error("Error fetching finance data:", error);
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
        if (!confirm("Confirm that you have received payment for this invoice?")) return;

        try {
            await updateDoc(doc(db, "invoices", invoice.id), {
                status: "paid",
                paidAt: new Date().toISOString()
            });

            toast.success("Invoice marked as PAID");
            setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: "paid" } : i));
            setIsInvoiceDetailsOpen(false);
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error("Failed to update invoice");
        }
    };

    // --- Payout Logic ---
    const handleViewPayout = async (payout: Payout) => {
        setSelectedPayout(payout);
        setIsPayoutDetailsOpen(true);
        setPayoutReceiptUrl("");

        // Fetch Bank Details if not present
        if (!payout.bankDetails) {
            setIsLoadingBankDetails(true);
            try {
                const userDoc = await getDoc(doc(db, "users", payout.creatorId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const bankDetails = userData.bankAccount;
                    if (bankDetails) {
                        setSelectedPayout(prev => prev ? { ...prev, bankDetails } : null);
                    }
                }
            } catch (error) {
                console.error("Error fetching bank details:", error);
                toast.error("Could not load creator bank details");
            } finally {
                setIsLoadingBankDetails(false);
            }
        }
    };

    const handleMarkPayoutPaid = async () => {
        if (!selectedPayout) return;
        if (!payoutReceiptUrl) {
            toast.error("Please provide a receipt URL");
            return;
        }

        setIsSubmittingPayout(true);
        try {
            await updateDoc(doc(db, "payouts", selectedPayout.id), {
                status: "paid",
                receiptUrl: payoutReceiptUrl,
                paidAt: new Date().toISOString()
            });

            toast.success("Payout marked as PAID");
            setPayouts(prev => prev.map(p => p.id === selectedPayout.id ? { ...p, status: "paid", receiptUrl: payoutReceiptUrl } : p));
            setIsPayoutDetailsOpen(false);
        } catch (error) {
            console.error("Error updating payout:", error);
            toast.error("Failed to update payout");
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

    const filteredPayouts = payouts.filter(item =>
        item.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="invoices" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Brand Invoices
                            <Badge variant="secondary" className="ml-1">
                                {filteredInvoices.filter(i => i.status === 'pending' || i.status === 'verifying').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="payouts" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Creator Payouts
                            <Badge variant="secondary" className="ml-1">
                                {filteredPayouts.filter(p => p.status === 'pending' || p.status === 'requested').length}
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
                                                        <td className="p-4 font-semibold">{formatCurrency(invoice.totalGross || invoice.amount)}</td>
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
                                                <th className="text-left p-4 font-medium text-muted-foreground">Payout Amount</th>
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
                                                        <td className="p-4 font-medium">{payout.campaignName || "Unknown"}</td>
                                                        <td className="p-4">{payout.creatorName || "Unknown"}</td>
                                                        <td className="p-4 text-muted-foreground">{formatDate(payout.createdAt)}</td>
                                                        <td className="p-4 font-semibold">{formatCurrency(payout.amount)}</td>
                                                        <td className="p-4">
                                                            <Badge
                                                                variant={payout.status === 'paid' ? 'success' : payout.status === 'requested' ? 'warning' : 'secondary'}
                                                                className="capitalize"
                                                            >
                                                                {payout.status === 'requested' ? 'Processing' : payout.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewPayout(payout)}>
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
                            {selectedInvoice?.status !== 'paid' && (
                                <Button
                                    variant="hero"
                                    onClick={() => selectedInvoice && handleMarkInvoicePaid(selectedInvoice)}
                                    disabled={!selectedInvoice?.receiptUrl}
                                >
                                    Confirm Payment Received
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* --- Payout Details Dialog --- */}
                <Dialog open={isPayoutDetailsOpen} onOpenChange={setIsPayoutDetailsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Process Payout</DialogTitle>
                            <DialogDescription>Review bank details and mark as paid.</DialogDescription>
                        </DialogHeader>

                        {selectedPayout && (
                            <div className="space-y-6 mt-2">
                                {/* Amount & Summary */}
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amount to Pay</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(selectedPayout.amount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Creator</p>
                                        <p className="font-medium">{selectedPayout.creatorName || "Unknown"}</p>
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
                                    ) : selectedPayout.bankDetails ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Bank</Label>
                                                <p className="font-medium">{selectedPayout.bankDetails.bankName}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Account Type</Label>
                                                <p className="font-medium capitalize">{selectedPayout.bankDetails.accountType}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Account Number</Label>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono font-medium text-lg">{selectedPayout.bankDetails.accountNumber}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">ID (RNC/Cedula)</Label>
                                                <p className="font-medium">{selectedPayout.bankDetails.identityDocument}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs text-muted-foreground">Account Holder</Label>
                                                <p className="font-medium flex items-center gap-2">
                                                    <User className="w-3 h-3" />
                                                    {selectedPayout.bankDetails.accountHolder}
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
                                {selectedPayout.status !== 'paid' ? (
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
                                            <span className="font-medium text-green-700">Paid on {formatDate(selectedPayout.paidAt)}</span>
                                        </div>
                                        {selectedPayout.receiptUrl && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={selectedPayout.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Receipt
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsPayoutDetailsOpen(false)}>Cancel</Button>
                            {selectedPayout?.status !== 'paid' && (
                                <Button
                                    variant="hero"
                                    onClick={handleMarkPayoutPaid}
                                    disabled={isSubmittingPayout || !payoutReceiptUrl}
                                >
                                    {isSubmittingPayout && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                    Mark as Paid
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
