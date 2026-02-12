
import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    CreditCard,
    DollarSign,
    Download,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Upload,
    Building2,
    Copy,
    Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BrandBilling() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    // Modal States
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState<any>(null);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, [user]);

    const fetchPayments = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch payouts where brandId is current user
            const q = query(
                collection(db, "payouts"),
                where("brandId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);

            const all: any[] = [];
            querySnapshot.forEach(doc => all.push({ id: doc.id, ...doc.data() }));

            setPendingPayments(all.filter(p => ['pending_brand_payment', 'verifying_brand_payment'].includes(p.status)));
            setPaymentHistory(all.filter(p => !['pending_brand_payment', 'verifying_brand_payment'].includes(p.status)));

        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadReceipt = async () => {
        if (!selectedPayout || !receiptUrl) return;
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "payouts", selectedPayout.id), {
                status: 'verifying_brand_payment',
                brandPaymentReceipt: receiptUrl,
                updatedAt: new Date().toISOString()
            });

            toast.success("Receipt uploaded! Admin will verify shortly.");
            setIsUploadOpen(false);
            fetchPayments(); // Refresh list
        } catch (error) {
            console.error("Error uploading receipt:", error);
            toast.error("Failed to upload receipt info.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />

            <main className="flex-1 ml-64 p-8">
                <DashboardHeader
                    title="Billing & Payments"
                    subtitle="Manage campaign payments and subscriptions"
                />

                <Tabs defaultValue="pending" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="pending">Pending Payments ({pendingPayments.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    </TabsList>

                    {/* Pending Payments Tab */}
                    <TabsContent value="pending" className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                        ) : pendingPayments.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Invoices Due</CardTitle>
                                    <CardDescription>Upload payment proof for completed campaigns.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingPayments.map(payment => (
                                        <div key={payment.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{payment.campaignName}</span>
                                                    <Badge variant="outline" className={payment.status === 'verifying_brand_payment' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}>
                                                        {payment.status === 'verifying_brand_payment' ? 'Verifying' : 'Action Required'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Creator ID: {payment.creatorId}</p>
                                                <div className="flex gap-4 text-sm mt-2">
                                                    <span>Gross: <strong>${payment.grossAmount?.toLocaleString()}</strong></span>
                                                    <span className="text-muted-foreground">Fee: ${payment.feeAmount?.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" onClick={() => setIsInstructionOpen(true)}>
                                                    Instructions
                                                </Button>
                                                {payment.status === 'pending_brand_payment' && (
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedPayout(payment);
                                                            setIsUploadOpen(true);
                                                        }}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Receipt
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <h3 className="font-semibold text-lg">All caught up!</h3>
                                <p className="text-muted-foreground">No pending payments found.</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Just a simple list for now */}
                                {paymentHistory.length === 0 && <p className="text-muted-foreground text-center py-8">No payment history yet.</p>}
                                {paymentHistory.map(payment => (
                                    <div key={payment.id} className="flex justify-between p-4 border-b last:border-0">
                                        <div>
                                            <p className="font-medium">{payment.campaignName}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${payment.grossAmount?.toLocaleString()}</p>
                                            <Badge variant="secondary" className="capitalize">{payment.status.replace(/_/g, " ")}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Subscription Tab (Placeholder) */}
                    <TabsContent value="subscription">
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>Current Plan</CardTitle>
                                <CardDescription>You are on the <span className="font-bold text-primary">Standard Plan</span>.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-4">
                                    <div>
                                        <p className="font-medium">Standard Plan</p>
                                        <p className="text-sm text-muted-foreground">$29/month</p>
                                    </div>
                                    <Badge>Active</Badge>
                                </div>
                                <Button variant="outline" className="w-full">Manage Subscription</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Instructions Modal */}
            <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payment Instructions</DialogTitle>
                        <DialogDescription>Please transfer the total amount to the following bank account.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="p-4 bg-muted rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <span className="font-semibold">Banco Popular Dominicano</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Account Type</p>
                                <p className="font-medium">Corriente (Checking)</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Account Number</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-lg font-bold">789-555-123</p>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard("789555123")}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Beneficiary</p>
                                <p className="font-medium">RELA Collab, S.R.L.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">RNC</p>
                                <p className="font-medium">1-32-00000-1</p>
                            </div>
                        </div>

                        <div className="flex gap-2 items-start p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Important: Please include the <strong>Campaign Name</strong> or <strong>Invoice ID</strong> in the transfer description.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Upload Receipt Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Payment</DialogTitle>
                        <DialogDescription>Upload or paste the receipt URL for this transaction.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Receipt URL</Label>
                            <Input
                                placeholder="https://..."
                                value={receiptUrl}
                                onChange={(e) => setReceiptUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Paste a link to the image/pdf (e.g. Google Drive, Dropbox, or upload using the media tools)</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUploadReceipt} disabled={isSubmitting || !receiptUrl}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
