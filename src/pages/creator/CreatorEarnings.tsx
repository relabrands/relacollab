import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    DollarSign, 
    ArrowDownLeft, 
    Clock, 
    Search, 
    Download, 
    Loader2, 
    Settings, 
    Wallet, 
    Gift, 
    ChevronDown, 
    ChevronUp, 
    Sparkles, 
    TrendingUp,
    ArrowUpRight,
    ExternalLink
} from "lucide-react";
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
    const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [stats, setStats] = useState({
        totalEarned: 0,
        pending: 0,
        available: 0,
        requested: 0
    });

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        ready_to_withdraw: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        requested: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        paid: "bg-green-500/10 text-green-600 border-green-500/20",
        completed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };

    const statusLabels: Record<string, string> = {
        pending: "Pendiente",
        ready_to_withdraw: "Listo para retirar",
        requested: "Procesando",
        paid: "Pagado",
        completed: "Completado",
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
            const q = query(
                collection(db, "payouts"),
                where("creatorId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);

            const fetchedPayments: any[] = [];
            let total = 0;
            let pendingArr = 0;
            let availableArr = 0;
            let requestedArr = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedPayments.push({ id: doc.id, ...data });

                const amount = data.netAmount || 0;

                if (data.status === 'paid') {
                    total += amount;
                } else if (data.status === 'pending') {
                    pendingArr += amount;
                } else if (data.status === 'ready_to_withdraw') {
                    availableArr += amount;
                } else if (data.status === 'requested') {
                    requestedArr += amount;
                }
            });

            setPayments(fetchedPayments);
            setStats({
                totalEarned: total,
                pending: pendingArr,
                available: availableArr,
                requested: requestedArr
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
            toast.info("Por favor configura tus datos bancarios primero.");
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
            toast.success("¡Solicitud de pago enviada exitosamente!");
            fetchEarnings();
        } catch (error) {
            toast.error("Error al solicitar el pago.");
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
                    title="Ganancias"
                    subtitle="Rastrea tus ingresos y administra tus pagos"
                >
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
                        <Settings className="w-4 h-4" />
                        Configuración de Pagos
                    </Button>
                </DashboardHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                                    <Clock className="h-4 w-4 text-warning" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.pending.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">De campañas activas</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card bg-primary/5 border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Disponible para Retiro</CardTitle>
                                    <Wallet className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.available.toLocaleString()}</div>
                                    {stats.requested > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            +${stats.requested.toLocaleString()} en proceso
                                        </p>
                                    )}
                                    <Button
                                        size="sm"
                                        className="mt-3 w-full"
                                        disabled={stats.available <= 0 || isRequesting}
                                        onClick={handleRequestPayout}
                                    >
                                        {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Solicitar Pago
                                    </Button>
                                    {!hasBankDetails && stats.available > 0 && (
                                        <p className="text-[10px] text-destructive mt-1 text-center cursor-pointer hover:underline" onClick={() => setIsSettingsOpen(true)}>
                                            * Configura los datos bancarios para retirar
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                                    <DollarSign className="h-4 w-4 text-success" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Ganancias totales</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Historial de Transacciones</CardTitle>
                                        <CardDescription>Pagos recientes y actividad</CardDescription>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <div className="relative flex-1 md:flex-initial md:w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Buscar por campaña..." 
                                                className="pl-8" 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
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
                                        {(() => {
                                            const filteredPayments = payments.filter(p => 
                                                p.campaignName?.toLowerCase().includes(searchQuery.toLowerCase())
                                            );

                                            const withdrawalBatchGroups: Record<string, any> = {};
                                            const earningsGroups: Record<string, any> = {};

                                            filteredPayments.forEach(p => {
                                                // --- 1. Campaign Grouping (History) ---
                                                // All payments regardless of status go here to keep history complete
                                                const cid = p.campaignId || 'other';
                                                if (!earningsGroups[cid]) {
                                                    earningsGroups[cid] = {
                                                        id: cid,
                                                        name: p.campaignName || "Sin Nombre",
                                                        transactions: [],
                                                        totalNet: 0,
                                                        latestDate: p.createdAt,
                                                        status: p.status,
                                                        isGroup: true
                                                    };
                                                }
                                                earningsGroups[cid].transactions.push(p);
                                                earningsGroups[cid].totalNet += (p.netAmount || 0);
                                                
                                                // Update latest status/date for the campaign group
                                                if (new Date(p.createdAt) > new Date(earningsGroups[cid].latestDate)) {
                                                    earningsGroups[cid].latestDate = p.createdAt;
                                                    // We prioritize 'pending' or 'ready' status for the group label 
                                                    // if some transactions inside are still active
                                                    if (p.status === 'pending' || p.status === 'ready_to_withdraw') {
                                                        earningsGroups[cid].status = p.status;
                                                    }
                                                }

                                                // --- 2. Withdrawal Movement Grouping (Standalone) ---
                                                if (p.status === 'requested' || p.status === 'paid') {
                                                    const batchKey = p.status === 'paid' 
                                                        ? `paid_${p.paidAt}` 
                                                        : `req_${p.requestedAt}`;
                                                    
                                                    if (!withdrawalBatchGroups[batchKey]) {
                                                        withdrawalBatchGroups[batchKey] = {
                                                            id: batchKey,
                                                            isWithdrawal: true,
                                                            status: p.status,
                                                            latestDate: p.status === 'paid' ? p.paidAt : p.requestedAt,
                                                            batchTotal: 0,
                                                            receiptUrl: p.receiptUrl,
                                                            payoutIds: []
                                                        };
                                                    }
                                                    withdrawalBatchGroups[batchKey].batchTotal += (p.netAmount || 0);
                                                    withdrawalBatchGroups[batchKey].payoutIds.push(p.id);
                                                    // If any in the batch has a receipt, use it
                                                    if (p.receiptUrl) withdrawalBatchGroups[batchKey].receiptUrl = p.receiptUrl;
                                                }
                                            });

                                            const allItems = [
                                                ...Object.values(earningsGroups),
                                                ...Object.values(withdrawalBatchGroups)
                                            ].sort((a: any, b: any) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

                                            return allItems.map((item: any) => {
                                                if (item.isWithdrawal) {
                                                    const isPaid = item.status === 'paid';
                                                    return (
                                                        <div key={item.id} className="border border-primary/20 rounded-xl overflow-hidden bg-primary/5 hover:bg-primary/10 transition-all duration-300 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`p-2.5 rounded-xl ${isPaid ? 'bg-success/10' : 'bg-orange-500/10'}`}>
                                                                        <ArrowUpRight className={`h-5 w-5 ${isPaid ? 'text-success' : 'text-orange-500'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-semibold text-foreground">
                                                                            {isPaid ? 'Retiro Recibido' : 'Solicitud de Retiro en Proceso'}
                                                                        </h3>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Transferencia Bancaria • {new Date(item.latestDate).toLocaleDateString("es-DO", {
                                                                                day: 'numeric',
                                                                                month: 'long',
                                                                                year: 'numeric'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-right hidden sm:block">
                                                                        <p className="text-sm font-medium text-muted-foreground">Monto Retirado</p>
                                                                        <p className={`font-bold text-lg ${isPaid ? 'text-success' : 'text-orange-600'}`}>
                                                                            -${(item.batchTotal || 0).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isPaid && item.receiptUrl && (
                                                                            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                                                                                <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                                    <span className="text-[10px] uppercase font-bold">Ver Recibo</span>
                                                                                </a>
                                                                            </Button>
                                                                        )}
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`capitalize text-[10px] px-2 py-0 ${statusColors[item.status] || ''}`}
                                                                        >
                                                                            {statusLabels[item.status] || item.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const group = item;
                                                const isExpanded = expandedCampaigns.includes(group.id);
                                                
                                                return (
                                                    <div key={group.id} className="border border-border/50 rounded-xl overflow-hidden bg-muted/20 hover:bg-muted/30 transition-all duration-300">
                                                        <div 
                                                            className="flex items-center justify-between p-4 cursor-pointer select-none"
                                                            onClick={() => {
                                                                setExpandedCampaigns(prev => 
                                                                    prev.includes(group.id) 
                                                                        ? prev.filter(id => id !== group.id)
                                                                        : [...prev, group.id]
                                                                );
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2.5 rounded-xl bg-primary/10">
                                                                    <TrendingUp className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(group.latestDate).toLocaleDateString("es-DO", { 
                                                                            day: 'numeric', 
                                                                            month: 'long', 
                                                                            year: 'numeric' 
                                                                        })}
                                                                        {group.transactions.length > 1 && ` • ${group.transactions.length} movimientos`}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="text-sm font-medium text-muted-foreground">Total Neto</p>
                                                                    <p className="font-bold text-lg text-primary">+${group.totalNet.toLocaleString()}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`capitalize text-[10px] px-2 py-0 ${statusColors[group.status] || ''}`}
                                                                    >
                                                                        {statusLabels[group.status] || group.status}
                                                                    </Badge>
                                                                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                <div className="h-px bg-border/50 mb-4" />
                                                                {group.transactions.map((payment: any) => {
                                                                    const isExchange = payment.type === 'exchange';
                                                                    const isMaxReward = !isExchange && payment.grossAmount >= payment.maxReward && payment.maxReward > 0;
                                                                    
                                                                    return (
                                                                        <div key={payment.id} className="bg-background/40 border border-border/30 rounded-lg p-4">
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`p-2 rounded-full ${isExchange ? 'bg-purple-500/10' : 'bg-green-500/10'}`}>
                                                                                        {isExchange ? <Gift className="h-4 w-4 text-purple-500" /> : <ArrowDownLeft className="h-4 w-4 text-green-500" />}
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                                            {isExchange ? 'Intercambio' : 'Pago Monetario'}
                                                                                        </span>
                                                                                        {isMaxReward && (
                                                                                            <Badge className="ml-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 transition-colors animate-pulse">
                                                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                                                ¡Pago Máximo!
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {!isExchange ? (
                                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-muted/30 p-3 rounded-lg border border-border/20">
                                                                                    <div className="space-y-1">
                                                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Monto Bruto</p>
                                                                                        <p className="font-semibold text-foreground text-sm">${(payment.grossAmount || 0).toLocaleString()}</p>
                                                                                    </div>
                                                                                    <div className="space-y-1 border-l border-border/50 pl-4">
                                                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Fee Rela ({payment.feePercent}%)</p>
                                                                                        <p className="font-semibold text-destructive text-sm">-${(payment.feeAmount || 0).toLocaleString()}</p>
                                                                                    </div>
                                                                                    <div className="space-y-1 border-l border-border/50 pl-4">
                                                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Monto Neto</p>
                                                                                        <p className="font-bold text-success text-sm">+${(payment.netAmount || 0).toLocaleString()}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="mt-3 bg-purple-500/5 p-3 rounded-lg border border-purple-500/10">
                                                                                    <p className="text-sm text-purple-700 font-medium leading-relaxed">
                                                                                        🎁 {payment.exchangeDetails || "Detalles del intercambio"}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {!isExchange && payment.minReward && payment.maxReward && (
                                                                                <p className="text-[10px] text-muted-foreground mt-3 text-center sm:text-left italic">
                                                                                    Basado en rango de campaña: ${payment.minReward.toLocaleString()} – ${payment.maxReward.toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="p-4 bg-muted rounded-full">
                                            <DollarSign className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Aún no hay transacciones</p>
                                            <p className="text-sm text-muted-foreground">Cuando completes campañas, los pagos aparecerán aquí.</p>
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
                    toast.success("¡Datos actualizados!");
                }}
            />
        </div>
    );
}
