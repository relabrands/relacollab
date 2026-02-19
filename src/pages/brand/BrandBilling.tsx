
import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    Upload,
    Building2,
    Copy,
    Loader2,
    Users,
    FileText,
    TrendingUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";

interface CampaignInvoice {
    id: string;
    campaignName: string;
    campaignId: string;
    creatorCount: number;
    perCreatorGross: number;
    totalGross: number;
    totalFee: number;
    totalNet: number;
    feePercent: number;
    status: string; // "pending" | "verifying" | "paid"
    receiptUrl?: string;
    createdAt: string;
}

export default function BrandBilling() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<CampaignInvoice[]>([]);

    // Upload receipt modal
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<CampaignInvoice | null>(null);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const fetchInvoices = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const q = query(
                collection(db, "invoices"),
                where("brandId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CampaignInvoice[]);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadReceipt = async () => {
        if (!selectedInvoice || !receiptUrl) return;
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "invoices", selectedInvoice.id), {
                status: "verifying",
                receiptUrl: receiptUrl,
                submittedAt: new Date().toISOString()
            });
            toast.success("Comprobante enviado. El equipo RELA verificará el pago.");
            setIsUploadOpen(false);
            setReceiptUrl("");
            fetchInvoices();
        } catch (error) {
            console.error("Error uploading receipt:", error);
            toast.error("Error al enviar el comprobante.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles!");
    };

    const pendingInvoices = invoices.filter(i => i.status === "pending");
    const verifyingInvoices = invoices.filter(i => i.status === "verifying");
    const paidInvoices = invoices.filter(i => i.status === "paid");

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            pending: { label: "Pago Requerido", className: "bg-red-100 text-red-700 border-red-200" },
            verifying: { label: "Verificando", className: "bg-amber-100 text-amber-700 border-amber-200" },
            paid: { label: "Pagado", className: "bg-green-100 text-green-700 border-green-200" },
        };
        const s = map[status] || { label: status, className: "" };
        return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Billing & Payments"
                    subtitle="Facturas de campañas y pagos a RELA"
                />

                {/* Quick link to subscription plans */}
                <div className="mb-6 flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-medium text-sm">Plan de Suscripción</p>
                            <p className="text-xs text-muted-foreground">Administra tu plan RELA y créditos</p>
                        </div>
                    </div>
                    <Link to="/brand/subscription">
                        <Button variant="outline" size="sm">Ver Planes →</Button>
                    </Link>
                </div>

                {!isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <Card className="glass-card">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-red-500/10">
                                    <Clock className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Pendientes de pago</p>
                                    <p className="text-2xl font-bold">
                                        ${pendingInvoices.reduce((a, i) => a + i.totalGross, 0).toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/10">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">En verificación</p>
                                    <p className="text-2xl font-bold">
                                        ${verifyingInvoices.reduce((a, i) => a + i.totalGross, 0).toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total pagado</p>
                                    <p className="text-2xl font-bold">
                                        ${paidInvoices.reduce((a, i) => a + i.totalGross, 0).toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="pending" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="pending">
                            Pendientes
                            {pendingInvoices.length > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pendingInvoices.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="verifying">En Verificación ({verifyingInvoices.length})</TabsTrigger>
                        <TabsTrigger value="history">Historial ({paidInvoices.length})</TabsTrigger>
                    </TabsList>

                    {/* Pending invoices */}
                    <TabsContent value="pending" className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                        ) : pendingInvoices.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl">
                                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <h3 className="font-semibold text-lg">Todo al día</h3>
                                <p className="text-muted-foreground text-sm">No tienes facturas pendientes.</p>
                            </div>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Facturas de Campaña</CardTitle>
                                    <CardDescription>
                                        Transfiere el monto total a RELA y sube el comprobante para liberar los pagos a los creators.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingInvoices.map(invoice => (
                                        <InvoiceRow
                                            key={invoice.id}
                                            invoice={invoice}
                                            onInstructions={() => setIsInstructionOpen(true)}
                                            onUpload={() => {
                                                setSelectedInvoice(invoice);
                                                setIsUploadOpen(true);
                                            }}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Verifying */}
                    <TabsContent value="verifying" className="space-y-4">
                        {verifyingInvoices.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No hay facturas en verificación.</p>
                        ) : (
                            <Card>
                                <CardContent className="divide-y">
                                    {verifyingInvoices.map(invoice => (
                                        <InvoiceRow key={invoice.id} invoice={invoice} readOnly />
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* History */}
                    <TabsContent value="history">
                        {paidInvoices.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">Sin historial de pagos aún.</p>
                        ) : (
                            <Card>
                                <CardContent className="divide-y">
                                    {paidInvoices.map(invoice => (
                                        <InvoiceRow key={invoice.id} invoice={invoice} readOnly />
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Instructions Modal */}
            <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Instrucciones de Pago</DialogTitle>
                        <DialogDescription>Transfiere el monto total a la siguiente cuenta bancaria.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
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
                            <p>Incluye el <strong>nombre de la campaña</strong> en la descripción de la transferencia para identificarla fácilmente.</p>
                        </div>
                    </div>
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
                    {selectedInvoice && (
                        <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1 my-2">
                            <p className="font-semibold">{selectedInvoice.campaignName}</p>
                            <p className="text-muted-foreground">{selectedInvoice.creatorCount} creators × ${selectedInvoice.perCreatorGross.toLocaleString()}</p>
                            <p className="font-bold text-primary text-base">${selectedInvoice.totalGross.toLocaleString()} USD</p>
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
                        <Button onClick={handleUploadReceipt} disabled={isSubmitting || !receiptUrl}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar para Verificación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Reusable InvoiceRow component ─────────────────────────────────────────────
function InvoiceRow({
    invoice,
    onInstructions,
    onUpload,
    readOnly = false,
}: {
    invoice: CampaignInvoice;
    onInstructions?: () => void;
    onUpload?: () => void;
    readOnly?: boolean;
}) {
    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            pending: { label: "Pago Requerido", className: "bg-red-100 text-red-700 border-red-200" },
            verifying: { label: "Verificando", className: "bg-amber-100 text-amber-700 border-amber-200" },
            paid: { label: "Pagado", className: "bg-green-100 text-green-700 border-green-200" },
        };
        const s = map[status] || { label: status, className: "" };
        return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors gap-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{invoice.campaignName}</span>
                    {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{invoice.creatorCount} creator{invoice.creatorCount > 1 ? "s" : ""} × ${invoice.perCreatorGross.toLocaleString()} c/u</span>
                </div>
                <div className="flex gap-4 text-sm mt-1">
                    <span>Total: <strong className="text-foreground">${invoice.totalGross.toLocaleString()}</strong></span>
                    <span className="text-muted-foreground">Fee RELA ({invoice.feePercent}%): ${invoice.totalFee.toLocaleString()}</span>
                    <span className="text-green-600 font-medium">Creators reciben: ${invoice.totalNet.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    {new Date(invoice.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
            </div>

            {!readOnly && invoice.status === "pending" && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={onInstructions}>
                        Instrucciones
                    </Button>
                    <Button size="sm" onClick={onUpload}>
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Subir Comprobante
                    </Button>
                </div>
            )}
            {invoice.status === "verifying" && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0">
                    ⏳ Verificando...
                </Badge>
            )}
            {invoice.status === "paid" && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 flex-shrink-0">
                    ✅ Pagado
                </Badge>
            )}
        </div>
    );
}
