import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Calendar, Users, DollarSign, ArrowLeft, Target, Sparkles,
    Loader2, MapPin, Briefcase, FileCheck, UserCheck, Edit2, Trash2, AlertTriangle, CreditCard, Package, Copy, Check
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";
import { MatchDetailsDialog } from "@/components/brand/MatchDetailsDialog";

export default function CampaignDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);

    const [applicationsCount, setApplicationsCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [collaboratingCount, setCollaboratingCount] = useState(0);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [isPaid, setIsPaid] = useState(false);

    // Creator dialog state
    const [selectedCreator, setSelectedCreator] = useState<any>(null);
    const [isCreatorDialogOpen, setIsCreatorDialogOpen] = useState(false);

    // Delete state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Shipping data modal state
    const [shippingModalCreator, setShippingModalCreator] = useState<any>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyDelivery = (creator: any) => {
        const addr = creator.shippingAddress;
        const isExchange = campaign?.compensationType === "exchange" || campaign?.compensationType === "hybrid";
        const logistics = isExchange ? [
            campaign?.exchangeDeliveryType === "establishment" ? `📍 Establecimiento: ${campaign?.establishmentAddress || ""}` : "",
            campaign?.exchangeDeliveryType === "product" && campaign?.productDeliveryMethod === "shipping"
                ? `🚚 Mensajería: ${campaign?.shippingService || ""}` : "",
            campaign?.exchangeDeliveryType === "product" && campaign?.productDeliveryMethod === "pickup"
                ? `📍 Recogida en: ${campaign?.pickupAddress || ""}` : "",
        ].filter(Boolean).join("\n") : "";

        const text = [
            `📦 Datos de Envío — ${creator.displayName || "Creador"}`,
            addr?.street ? `Calle: ${addr.street}` : "",
            addr?.sector ? `Sector: ${addr.sector}` : "",
            addr?.city ? `Ciudad: ${addr.city}` : "",
            addr?.reference ? `Referencia: ${addr.reference}` : "",
            creator.phone ? `📞 Tel: ${creator.phone}` : "",
            logistics ? `\n🔧 Logística:\n${logistics}` : "",
        ].filter(Boolean).join("\n");

        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, "campaigns", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const campaignData = { id: docSnap.id, ...docSnap.data() };
                    setCampaign(campaignData);

                    // 1. Fetch applications
                    const appsQuery = query(collection(db, "applications"), where("campaignId", "==", id));
                    const appsSnapshot = await getDocs(appsQuery);
                    const allApps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    setApplicationsCount(allApps.length);
                    const approvedApps = allApps.filter((a: any) =>
                        ["approved", "active", "collaborating"].includes(a.status)
                    );
                    setApprovedCount(allApps.filter((a: any) => a.status === "approved").length);
                    setCollaboratingCount(approvedApps.length);

                    // 2. Fetch collaborator profiles
                    if (approvedApps.length > 0) {
                        const creatorIds = [...new Set(approvedApps.map((a: any) => a.creatorId))];
                        // Fetch users in chunks if necessary (max 30 for 'in' operator)
                        // but here we likely have few collaborators (1-10+)
                        const userProfiles: any[] = [];
                        for (let i = 0; i < creatorIds.length; i += 10) {
                            const chunk = creatorIds.slice(i, i + 10);
                            const usersQuery = query(collection(db, "users"), where("__name__", "in", chunk));
                            const usersSnap = await getDocs(usersQuery);
                            usersSnap.forEach(uDoc => userProfiles.push({ id: uDoc.id, ...uDoc.data() }));
                        }
                        setCollaborators(userProfiles);
                    }

                    // 3. Check for paid invoice
                    const invoicesQuery = query(
                        collection(db, "invoices"),
                        where("campaignId", "==", id),
                        where("status", "==", "paid"),
                        where("type", "==", "campaign_budget")
                    );
                    const invoicesSnap = await getDocs(invoicesQuery);
                    setIsPaid(!invoicesSnap.empty);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        fetchCampaignData();
    }, [id, user]);

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "campaigns", id));
            toast.success("Campaña eliminada.");
            navigate("/brand");
        } catch (error) {
            toast.error("Error al eliminar la campaña.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex min-h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">Campaña no encontrada</h2>
                <Link to="/brand"><Button>Volver</Button></Link>
            </div>
        );
    }

    const neededCount = campaign.creatorCount || 1;
    const progress = (approvedCount / neededCount) * 100;

    // Fee derived from campaign data (e.g. 10% → 0.10). Applied to creator payout, invisible in UI.
    const feeDecimal = (campaign.platformFeePercent || 10) / 100;

    const isMonetary = campaign.compensationType === 'monetary' || campaign.compensationType === 'hybrid';
    const totalMax = (campaign.maxReward || 0) * neededCount;
    const totalBudget = (campaign.totalBudgetPerCreator || 0) * neededCount;
    const perCreatorGross = campaign.maxReward || campaign.totalBudgetPerCreator || 0;
    const totalFee = totalBudget * ((campaign.platformFeePercent || 10) / 100);
    const totalNet = totalBudget - totalFee;

    // Status calculation
    // Priority: always trust the stored campaign.status (completed / expired set by system).
    // Only auto-derive from date when status is still 'active'.
    const storedStatus = campaign.status as string;
    const isDateExpired = campaign.endDate && new Date(campaign.endDate) < new Date();
    const isCompleted = storedStatus === "completed" || (approvedCount >= neededCount && neededCount > 0);
    const isExpired   = storedStatus === "expired"   || (!isCompleted && !!isDateExpired);

    const statusLabel =
      storedStatus === "completed"             ? "Completada" :
      storedStatus === "expired"               ? "Expirada"   :
      (isDateExpired && !isCompleted)          ? "Expirada"   :
      isCompleted                              ? "Completada" :
                                                 "Activa";

    const statusColor =
      statusLabel === "Completada" ? "bg-green-100 text-green-700 border-green-200" :
      statusLabel === "Expirada"   ? "bg-red-100 text-red-700 border-red-200"       :
                                     "bg-blue-100 text-blue-700 border-blue-200";


    const handleCreatorClick = (collab: any) => {
        // Map collaborator to CreatorDetails format expected by MatchDetailsDialog
        const creatorDetails = {
            id: collab.id,
            name: collab.displayName || "Creador",
            avatar: collab.photoURL || "",
            location: collab.location || "N/A",
            followers: (collab.followers || collab.instagramMetrics?.followers || collab.tiktokMetrics?.followers || 0).toLocaleString(),
            engagement: (collab.engagementRate || collab.instagramMetrics?.engagementRate || collab.tiktokMetrics?.engagementRate || 0).toFixed(1) + "%",
            matchScore: 100,
            tags: collab.categories || [],
            matchReason: "Colaborador aprobado y activo en esta campaña.",
            bio: collab.bio || "Este creador no ha proporcionado una biografía todavía.",
            instagramUsername: collab.instagramUsername,
            tiktokUsername: collab.tiktokUsername,
            instagramMetrics: collab.instagramMetrics,
            tiktokMetrics: collab.tiktokMetrics,
            aiAnalysis: null
        };
        setSelectedCreator(creatorDetails);
        setIsCreatorDialogOpen(true);
    };
    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
                <div className="mb-6">
                    <Link to="/brand" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </Link>
                </div>

                {/* Header with Edit/Delete */}
                <DashboardHeader 
                    title={
                        <div className="flex items-center gap-3">
                            {campaign.name}
                            <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 ${statusColor}`}>
                                {statusLabel}
                            </Badge>
                        </div>
                    } 
                    subtitle={`Detalles de la Campaña y Progreso • ${statusLabel}`} 
                >
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/brand/campaigns/edit/${campaign.id}`}>
                            <Button variant="outline" size="sm">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setIsDeleteOpen(true)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                        {!isCompleted && !isExpired && (
                            <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                                <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Ver Matches
                                </Button>
                            </Link>
                        )}
                    </div>
                </DashboardHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-card p-6 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 border-blue-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Solicitudes</p>
                                        <p className="text-2xl font-bold">{applicationsCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-6 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 border-green-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <UserCheck className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Aprobados</p>
                                        <p className="text-2xl font-bold">{approvedCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-6 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/10 border-purple-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Colaborando</p>
                                        <p className="text-2xl font-bold">{collaboratingCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collaborators List */}
                        {collaborators.length > 0 && (
                            <div className="glass-card p-6 bg-gradient-to-br from-background to-accent/5">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Creators collaborating
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {collaborators.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex flex-col gap-2 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-border/40 hover:border-primary/30 transition-all"
                                        >
                                            <div
                                                onClick={() => handleCreatorClick(c)}
                                                className="flex items-center gap-3 group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all flex-shrink-0">
                                                    {c.photoURL ? (
                                                        <img src={c.photoURL} alt={c.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/10">
                                                            <Users className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{c.displayName || "Creador"}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Badge variant="outline" className="text-[10px] h-4 bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            Activo
                                                        </Badge>
                                                        {c.shippingAddress?.city && (
                                                            <span className="text-[10px] text-muted-foreground">{c.shippingAddress.city}{c.shippingAddress.sector ? `, ${c.shippingAddress.sector}` : ""}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {(campaign?.compensationType === "exchange" || campaign?.compensationType === "hybrid") && (
                                                <button
                                                    onClick={() => setShippingModalCreator(c)}
                                                    className="flex items-center gap-1.5 w-full justify-center text-xs text-primary border border-primary/20 rounded-lg py-1.5 hover:bg-primary/5 transition-all"
                                                >
                                                    <Package className="w-3.5 h-3.5" />
                                                    Ver Datos de Envío
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="glass-card p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-semibold">Sobre esta Campaña</h3>
                                {(campaign.brandProfileName || campaign.brandName) && (
                                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full">
                                        <span className="text-xs text-muted-foreground">Marca Asignada:</span>
                                        {campaign.brandProfileLogo && (
                                            <img src={campaign.brandProfileLogo} alt="Logo" className="w-5 h-5 rounded-full object-cover border border-border" />
                                        )}
                                        <span className="font-medium text-sm text-foreground">{campaign.brandProfileName || campaign.brandName}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                        </div>

                        {/* Content & Compensation */}
                        {(campaign.contentTypes || campaign.compensationType) && (
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold mb-4">Contenido y Compensación</h3>
                                <div className="space-y-4">
                                    {(campaign.deliverables?.length > 0 || campaign.contentTypes?.length > 0) && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Tipos de Contenido Necesarios</p>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.deliverables?.length > 0 ? (
                                                    campaign.deliverables.map((del: any, i: number) => (
                                                        <Badge key={i} variant="secondary" className="capitalize">
                                                            {del.quantity}x {del.type} {del.platform ? (del.platform.toLowerCase() === "tiktok" ? "TikTok" : "Instagram") : ""}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    campaign.contentTypes?.map((type: string) => (
                                                        <Badge key={type} variant="secondary" className="capitalize">{type}</Badge>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {campaign.compensationType && (
                                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                            <p className="text-sm text-muted-foreground mb-1">Tipo de Compensación</p>
                                            <p className="font-medium">
                                                {campaign.compensationType === "hybrid"
                                                    ? "💵🎁 Híbrido (Pago + Intercambio)"
                                                    : isMonetary
                                                        ? "💰 Pago Monetario"
                                                        : "🎁 Intercambio"}
                                            </p>
                                            {/* Exchange details (hybrid or exchange) */}
                                            {(campaign.compensationType === "exchange" || campaign.compensationType === "hybrid") && campaign.exchangeDetails && (
                                                <p className="text-sm text-muted-foreground">🎁 {campaign.exchangeDetails}</p>
                                            )}
                                            {/* Monetary details (monetary or hybrid) */}
                                            {(isMonetary || campaign.compensationType === "hybrid") && (
                                                <div className="mt-2 pt-2 border-t border-border/40 space-y-1.5 text-sm">
                                                    {/* Payment CTA Banner - Hidden if already paid or campaign is not pending */}
                                                    {!isPaid && campaign.status === 'pending' && (
                                                        <div className="mb-3 p-4 bg-primary/5 border border-primary/30 rounded-xl animate-in fade-in duration-500">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                                                                    <CreditCard className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-foreground mb-0.5">
                                                                        Para activar esta campaña, transfiere el presupuesto a RELA
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                                        Transfiere <strong className="text-foreground">${(totalMax > 0 ? totalMax : totalBudget).toLocaleString()}</strong> a RELA Collab antes de asignar colaboradores. El creador recibe su parte al aprobar el contenido.
                                                                    </p>
                                                                    <Link to="/brand/payments" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:underline">
                                                                        <CreditCard className="w-3.5 h-3.5" />
                                                                        Ir a Facturación para pagar →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {campaign.minReward && campaign.maxReward ? (
                                                        <>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Rango por creador (bruto)</span>
                                                                <span className="font-semibold">${campaign.minReward.toLocaleString()} – ${campaign.maxReward.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Creator recibe (neto)</span>
                                                                <span className="text-green-600 font-medium whitespace-nowrap">
                                                                    ${(campaign.minReward * (1 - feeDecimal)).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} – ${(campaign.maxReward * (1 - feeDecimal)).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Por creator (bruto)</span>
                                                                <span className="font-medium">${perCreatorGross.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Neto al creator</span>
                                                                <span className="text-green-600 font-medium">
                                                                    ${(campaign.creatorPayment || perCreatorGross).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="flex justify-between font-semibold pt-1 border-t border-border/40 mt-1">
                                                        <span>Total a transferir a RELA{neededCount > 1 ? ` (${neededCount} creadores)` : ""}</span>
                                                        <span className="text-primary">${(totalMax > 0 ? totalMax : totalBudget).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Targeting & Vibe */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">Público Objetivo y Vibe</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <MapPin className="w-4 h-4" /> Ubicación
                                    </div>
                                    <div className="font-medium">{campaign.location || "Cualquier lugar"}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Users className="w-4 h-4" /> Rango de Edad
                                    </div>
                                    <div className="font-medium">{campaign.ageRange}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Target className="w-4 h-4" /> Objetivo
                                    </div>
                                    <div className="font-medium capitalize">{campaign.goal}</div>
                                </div>
                            </div>

                            {campaign.vibes?.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-3">Palabras Clave de Vibe</p>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.vibes.map((vibe: string) => (
                                            <Badge key={vibe} variant="secondary" className="px-3 py-1 capitalize">{vibe}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Progress Card */}
                        <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Progreso de Contratación
                            </h3>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">Creadores Contratados</span>
                                <span className="font-medium">{approvedCount} / {neededCount}</span>
                            </div>
                            <Progress value={progress} className="h-2 mb-4" />
                            <p className="text-xs text-muted-foreground mb-4">
                                {approvedCount >= neededCount
                                    ? "🎉 ¡Objetivo alcanzado! Has contratado a todos los creadores necesarios."
                                    : `Necesitas ${neededCount - approvedCount} creador${neededCount - approvedCount !== 1 ? "es" : ""} más para alcanzar tu objetivo.`}
                            </p>
                            {!isCompleted && !isExpired && (
                                <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                                    <Button className="w-full" variant="outline">Buscar Creadores</Button>
                                </Link>
                            )}
                        </div>

                        {/* Details Card */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Fecha de Inicio</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "No establecido"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Fecha de Fin</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "No establecido"}
                                </span>
                            </div>

                            {/* ✅ Budget = totalBudgetPerCreator × creatorCount */}
                            <div className="pt-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm leading-tight">
                                            {campaign.compensationType === 'hybrid' 
                                                ? "Presupuesto Monetario + Intercambio" 
                                                : "Presupuesto Monetario"}
                                        </span>
                                    </div>
                                    {isMonetary ? (
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-primary text-lg">${totalBudget.toLocaleString()}</span>
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-[10px] text-muted-foreground text-right">
                                                    {neededCount} creador{neededCount > 1 ? "es" : ""} × ${perCreatorGross.toLocaleString()} {campaign.minReward && campaign.maxReward ? "(máx)" : ""}
                                                </p>
                                                <Badge variant="secondary" className="text-[9px] h-4 font-bold bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                                                    {campaign.compensationType === 'hybrid' ? "💳 Monetario + 🎁 Intercambio" : "💰 Monetario"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 self-start">
                                            🎁 Intercambio
                                        </Badge>
                                    )}
                                </div>
                                {isMonetary && totalFee > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                            <span>Comisión RELA</span>
                                            <span className="text-destructive">-${totalFee.toLocaleString()}</span>
                                        </div>
                                        {campaign.minReward && campaign.maxReward ? (
                                            <div className="flex justify-between font-medium text-foreground">
                                                <span>Creadores reciben</span>
                                                <span className="text-green-600">${(campaign.minReward * 0.9 * neededCount).toLocaleString()} – ${(campaign.maxReward * 0.9 * neededCount).toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between font-medium text-foreground">
                                                <span>Creadores reciben</span>
                                                <span className="text-green-600">${totalNet.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Shipping Data Modal ────────────────────── */}
            <Dialog open={!!shippingModalCreator} onOpenChange={(o) => { if (!o) setShippingModalCreator(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Datos de Envío — {shippingModalCreator?.displayName || "Creador"}
                        </DialogTitle>
                        <DialogDescription>
                            Dirección completa compartida por el match aprobado.
                        </DialogDescription>
                    </DialogHeader>

                    {shippingModalCreator && (
                        <div className="space-y-4">
                            {/* Creator address */}
                            {shippingModalCreator.shippingAddress?.street ? (
                                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📍 Dirección del Creador</p>
                                    <p className="text-sm"><strong>Calle:</strong> {shippingModalCreator.shippingAddress.street}</p>
                                    {shippingModalCreator.shippingAddress.sector && <p className="text-sm"><strong>Sector:</strong> {shippingModalCreator.shippingAddress.sector}</p>}
                                    {shippingModalCreator.shippingAddress.city && <p className="text-sm"><strong>Ciudad:</strong> {shippingModalCreator.shippingAddress.city}</p>}
                                    {shippingModalCreator.shippingAddress.reference && <p className="text-sm"><strong>Referencia:</strong> {shippingModalCreator.shippingAddress.reference}</p>}
                                    {shippingModalCreator.phone && <p className="text-sm"><strong>📞 Teléfono:</strong> {shippingModalCreator.phone}</p>}
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-sm text-amber-700">⚠️ Este creador aún no ha registrado su dirección de envío. Puedes contactarlo directamente.</p>
                                </div>
                            )}

                            {/* Campaign logistics */}
                            {(campaign?.compensationType === "exchange" || campaign?.compensationType === "hybrid") && (
                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🔧 Logística de la Campaña</p>
                                    {campaign.exchangeDeliveryType === "establishment" && (
                                        <>
                                            <p className="text-sm"><strong>Tipo:</strong> 🏪 Establecimiento</p>
                                            {campaign.establishmentAddress && <p className="text-sm"><strong>Dirección:</strong> {campaign.establishmentAddress}</p>}
                                            {campaign.establishmentInstructions && <p className="text-sm"><strong>Instrucciones:</strong> {campaign.establishmentInstructions}</p>}
                                        </>
                                    )}
                                    {campaign.exchangeDeliveryType === "product" && (
                                        <>
                                            <p className="text-sm"><strong>Tipo:</strong> 📦 Producto Físico</p>
                                            {campaign.productDeliveryMethod === "shipping" && <p className="text-sm"><strong>Método:</strong> 🚚 Envío — {campaign.shippingService}</p>}
                                            {campaign.productDeliveryMethod === "pickup" && (
                                                <>
                                                    <p className="text-sm"><strong>Método:</strong> 📍 Recogida por el creador</p>
                                                    {campaign.pickupAddress && <p className="text-sm"><strong>Dirección de recogida:</strong> {campaign.pickupAddress}</p>}
                                                    {campaign.pickupSchedule && <p className="text-sm"><strong>Horario:</strong> {campaign.pickupSchedule}</p>}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setShippingModalCreator(null)}>Cerrar</Button>
                        <Button
                            variant="default"
                            onClick={() => shippingModalCreator && handleCopyDelivery(shippingModalCreator)}
                            className="gap-2"
                        >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {isCopied ? "¡Copiado!" : "Copiar para Delivery"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ────────────────────── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Eliminar Campaña
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro que deseas eliminar <strong>"{campaign.name}"</strong>?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Match / Creator Profile Dialog */}
            {selectedCreator && (
                <MatchDetailsDialog
                    isOpen={isCreatorDialogOpen}
                    onClose={() => setIsCreatorDialogOpen(false)}
                    creator={selectedCreator}
                    campaign={campaign}
                    isCollaborating={true}
                />
            )}
        </div>
    );
}
