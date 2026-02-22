import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, History, Loader2, Check, Building2, Copy, AlertCircle, Upload } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc, addDoc } from "firebase/firestore";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Plan {
    id: string;
    name: string;
    price: number;
    credits: number;
    credits: number;
    features: string[];
    interval: "month" | "year";
    isFree?: boolean;
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    invoiceId?: string;
}

export default function BrandPayments() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);

    // Manual Payment States
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

    useEffect(() => {
        if (user) {
            fetchPlans();
            fetchPayments();
            fetchUserPlan();
        }
    }, [user]);

    const fetchUserPlan = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setCurrentPlan(userDoc.data().plan || null);
            }
        } catch (error) {
            console.error("Error fetching user plan:", error);
        }
    };

    const fetchPlans = async () => {
        try {
            const q = query(collection(db, "plans"), where("active", "==", true), orderBy("price", "asc"));
            const snapshot = await getDocs(q);
            const fetchedPlans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Plan[];
            setPlans(fetchedPlans);
        } catch (error: any) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to load plans: " + (error.message || "Unknown error"));
        } finally {
            setLoadingPlans(false);
        }
    };

    const fetchPayments = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, "users", user.uid, "payments"), orderBy("created", "desc"));
            const snapshot = await getDocs(q);
            const fetchedPayments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Payment[];
            setPayments(fetchedPayments);
        } catch (error) {
            console.error("Error fetching payments history:", error);
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!user) return;
        // Check if this is a free/trial plan
        if (plan.price === 0 || plan.isFree) {
            setProcessingId(plan.id);
            try {
                // For free plans, we just update the user profile directly without Stripe
                await fetch("/api/update-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.uid, plan: plan.name })
                });

                // Usually this is done via backend, but as a fallback/mock for now if API missing:
                // Note: Real implementation should rely on the API call above.

                toast.success(`Subscribed to ${plan.name} successfully!`);
                setCurrentPlan(plan.name);
            } catch (error) {
                console.error("Error subscribing to free plan", error);
                toast.error("Failed to subscribe");
            } finally {
                setProcessingId(null);
            }
            return;
        }

        // Open manual payment instructions
        setSelectedPlanForPayment(plan);
        setIsInstructionOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles!");
    };

    const handleUploadReceipt = async () => {
        if (!user || !selectedPlanForPayment || !receiptUrl) return;
        setIsSubmittingReceipt(true);
        try {
            await addDoc(collection(db, "subscriptionInvoices"), {
                brandId: user.uid,
                planId: selectedPlanForPayment.id,
                planName: selectedPlanForPayment.name,
                amount: selectedPlanForPayment.price,
                interval: selectedPlanForPayment.interval,
                receiptUrl,
                status: "verifying",
                createdAt: new Date().toISOString()
            });

            toast.success("Comprobante enviado. El equipo RELA verificará el pago.");
            setIsUploadOpen(false);
            setReceiptUrl("");
            setSelectedPlanForPayment(null);

            // Optionally update UI here to reflect pending state
        } catch (error) {
            console.error("Error uploading subscription receipt:", error);
            toast.error("Error al enviar el comprobante.");
        } finally {
            setIsSubmittingReceipt(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Payments" subtitle="Manage your subscription and billing" />

                {/* Plans Section */}
                <div className="mb-10">
                    <h3 className="text-xl font-semibold mb-4">Subscription Plans</h3>
                    {loadingPlans ? (
                        <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>
                    ) : plans.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground border-dashed">
                            No plans available at the moment.
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map(plan => {
                                const isCurrentPlan = currentPlan === plan.name;

                                return (
                                    <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all ${isCurrentPlan ? 'border-primary shadow-md bg-primary/5' : 'hover:shadow-lg hover:border-primary/50'}`}>
                                        {isCurrentPlan && (
                                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                                CURRENT PLAN
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <CardDescription>{plan.interval === "year" ? "Yearly" : "Monthly"} billing</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="mb-4">
                                                <span className="text-4xl font-bold">${plan.price}</span>
                                                <span className="text-muted-foreground">/{plan.interval === "year" ? "yr" : "mo"}</span>
                                            </div>
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-primary text-xs">⚡</span>
                                                    </div>
                                                    {plan.credits} Credits / month
                                                </div>
                                                {plan.features?.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button
                                                className="w-full"
                                                variant={isCurrentPlan ? "outline" : (processingId === plan.id ? "secondary" : "default")}
                                                onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                                                disabled={!!processingId || isCurrentPlan}
                                            >
                                                {processingId === plan.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : isCurrentPlan ? (
                                                    "Current Plan"
                                                ) : plan.isFree || plan.price === 0 ? (
                                                    "Start for Free"
                                                ) : (
                                                    "Subscribe"
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Payment History */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Payment History</h3>
                    <Card>
                        <CardContent className="p-0">
                            {loadingPayments ? (
                                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : payments.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No payment history found.</div>
                            ) : (
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                                                            {payment.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {(payment.amount).toLocaleString('en-US', { style: 'currency', currency: payment.currency.toUpperCase() })}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {new Date(payment.created).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </main>

            {/* Manual Payment Instructions Modal */}
            <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Instrucciones de Pago</DialogTitle>
                        <DialogDescription>Transfiere el monto total a la siguiente cuenta bancaria para activar tu plan {selectedPlanForPayment?.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {selectedPlanForPayment && (
                            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1 my-2">
                                <p className="font-semibold">Plan: {selectedPlanForPayment.name}</p>
                                <p className="font-bold text-primary text-base">${selectedPlanForPayment.price.toLocaleString()} USD / {selectedPlanForPayment.interval === 'year' ? 'yr' : 'mo'}</p>
                            </div>
                        )}
                        <div className="p-4 bg-muted rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <span className="font-semibold">Banco Popular Dominicano</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Tipo de Cuenta</p>
                                <p className="font-medium">Corriente (Checking)</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Número de Cuenta</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-lg font-bold">789-555-123</p>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard("789555123")}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Beneficiario</p>
                                <p className="font-medium">RELA Collab, S.R.L.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">RNC</p>
                                <p className="font-medium">1-32-00000-1</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-start p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Incluye el <strong>nombre de tu marca</strong> y la palabra "Suscripción" en la descripción de la transferencia.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInstructionOpen(false)}>Cancelar</Button>
                        <Button onClick={() => { setIsInstructionOpen(false); setIsUploadOpen(true); }}>
                            <Upload className="w-4 h-4 mr-2" /> Subir Comprobante
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Receipt Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subir Comprobante de Pago</DialogTitle>
                        <DialogDescription>
                            Pega el link del comprobante de transferencia (Google Drive, Dropbox, etc.).
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPlanForPayment && (
                        <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1 my-2">
                            <p className="font-semibold">Plan: {selectedPlanForPayment.name}</p>
                            <p className="font-bold text-primary text-base">${selectedPlanForPayment.price.toLocaleString()} USD</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>URL del Comprobante</Label>
                        <Input
                            placeholder="https://drive.google.com/..."
                            value={receiptUrl}
                            onChange={(e) => setReceiptUrl(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUploadReceipt} disabled={isSubmittingReceipt || !receiptUrl}>
                            {isSubmittingReceipt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar para Verificación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
