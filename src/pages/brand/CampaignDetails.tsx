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
    Loader2, MapPin, Briefcase, FileCheck, UserCheck, Edit2, Trash2, AlertTriangle
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";

export default function CampaignDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);

    const [applicationsCount, setApplicationsCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [collaboratingCount, setCollaboratingCount] = useState(0);

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    // Delete state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, "campaigns", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const campaignData = { id: docSnap.id, ...docSnap.data() };
                    setCampaign(campaignData);
                    setEditForm(campaignData);

                    const appsQuery = query(collection(db, "applications"), where("campaignId", "==", id));
                    const appsSnapshot = await getDocs(appsQuery);
                    const allApps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    setApplicationsCount(allApps.length);
                    setApprovedCount(allApps.filter((a: any) => a.status === "approved").length);
                    setCollaboratingCount(allApps.filter((a: any) =>
                        ["approved", "active", "collaborating"].includes(a.status)).length);
                }
            } catch (error) {
                console.error("Error fetching campaign data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaignData();
    }, [id, user]);

    const handleSaveEdit = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "campaigns", id), {
                name: editForm.name,
                description: editForm.description,
                startDate: editForm.startDate,
                endDate: editForm.endDate,
                location: editForm.location,
                updatedAt: new Date().toISOString(),
            });
            setCampaign((prev: any) => ({ ...prev, ...editForm }));
            setIsEditOpen(false);
            toast.success("Campaña actualizada correctamente.");
        } catch (error) {
            console.error("Error updating campaign:", error);
            toast.error("Error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "campaigns", id));
            toast.success("Campaña eliminada.");
            navigate("/brand");
        } catch (error) {
            console.error("Error deleting campaign:", error);
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
                <h2 className="text-xl font-semibold">Campaign not found</h2>
                <Link to="/brand"><Button>Go Back</Button></Link>
            </div>
        );
    }

    const neededCount = campaign.creatorCount || 1;
    const progress = (approvedCount / neededCount) * 100;

    // ✅ Total budget = gross per creator × number of creators
    const perCreatorGross = campaign.totalBudgetPerCreator || campaign.budget || 0;
    const totalBudget = perCreatorGross * neededCount;
    const totalFee = (campaign.platformFeeAmount || 0) * neededCount;
    const totalNet = (campaign.creatorPayment || perCreatorGross) * neededCount;
    const isMonetary = campaign.compensationType === "monetary";

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <div className="mb-6">
                    <Link to="/brand" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Header with Edit/Delete */}
                <div className="flex items-start justify-between mb-8 gap-4">
                    <DashboardHeader title={campaign.name} subtitle="Campaign Details & Progress" />
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => { setEditForm(campaign); setIsEditOpen(true); }}>
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setIsDeleteOpen(true)}>
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Eliminar
                        </Button>
                        <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                            <Button variant="hero" size="sm">
                                <Sparkles className="w-4 h-4 mr-2" />
                                View Matches
                            </Button>
                        </Link>
                    </div>
                </div>

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
                                        <p className="text-sm text-muted-foreground">Applications</p>
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
                                        <p className="text-sm text-muted-foreground">Approved</p>
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
                                        <p className="text-sm text-muted-foreground">Collaborating</p>
                                        <p className="text-2xl font-bold">{collaboratingCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">About this Campaign</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                        </div>

                        {/* Content & Compensation */}
                        {(campaign.contentTypes || campaign.compensationType) && (
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold mb-4">Content & Compensation</h3>
                                <div className="space-y-4">
                                    {campaign.contentTypes?.length > 0 && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Content Types Needed</p>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.contentTypes.map((type: string) => (
                                                    <Badge key={type} variant="secondary" className="capitalize">{type}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {campaign.compensationType && (
                                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                            <p className="text-sm text-muted-foreground mb-1">Compensation Type</p>
                                            <p className="font-medium capitalize">
                                                {isMonetary ? "💰 Pago Monetario" : "🎁 Intercambio"}
                                            </p>
                                            {!isMonetary && campaign.exchangeDetails && (
                                                <p className="text-sm text-muted-foreground">{campaign.exchangeDetails}</p>
                                            )}
                                            {isMonetary && (
                                                <div className="mt-2 pt-2 border-t border-border/40 space-y-1.5 text-sm">
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
                                                    {neededCount > 1 && (
                                                        <div className="flex justify-between font-semibold pt-1 border-t border-border/40">
                                                            <span>Total ({neededCount} creators)</span>
                                                            <span className="text-primary">${totalBudget.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Targeting & Vibe */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">Targeting & Vibe</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <MapPin className="w-4 h-4" /> Location
                                    </div>
                                    <div className="font-medium">{campaign.location || "Anywhere"}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Users className="w-4 h-4" /> Age Range
                                    </div>
                                    <div className="font-medium">{campaign.ageRange}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Target className="w-4 h-4" /> Goal
                                    </div>
                                    <div className="font-medium capitalize">{campaign.goal}</div>
                                </div>
                            </div>

                            {campaign.vibes?.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-3">Vibe Keywords</p>
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
                                Hiring Progress
                            </h3>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">Creators Hired</span>
                                <span className="font-medium">{approvedCount} / {neededCount}</span>
                            </div>
                            <Progress value={progress} className="h-2 mb-4" />
                            <p className="text-xs text-muted-foreground mb-4">
                                {approvedCount >= neededCount
                                    ? "🎉 Goal reached! You've hired all needed creators."
                                    : `You need ${neededCount - approvedCount} more creator${neededCount - approvedCount !== 1 ? "s" : ""} to reach your goal.`}
                            </p>
                            <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                                <Button className="w-full" variant="outline">Find Creators</Button>
                            </Link>
                        </div>

                        {/* Details Card */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Start Date</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "Not set"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>End Date</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "Not set"}
                                </span>
                            </div>

                            {/* ✅ Budget = totalBudgetPerCreator × creatorCount */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="w-4 h-4" />
                                        <span>Budget</span>
                                    </div>
                                    {isMonetary ? (
                                        <div className="text-right">
                                            <span className="font-bold text-primary text-lg">${totalBudget.toLocaleString()}</span>
                                            <p className="text-[10px] text-muted-foreground">{neededCount} creator{neededCount > 1 ? "s" : ""} × ${perCreatorGross.toLocaleString()}</p>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            🎁 Intercambio
                                        </Badge>
                                    )}
                                </div>
                                {isMonetary && totalFee > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                            <span>Fee RELA</span>
                                            <span className="text-destructive">-${totalFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between font-medium text-foreground">
                                            <span>Creators reciben</span>
                                            <span className="text-green-600">${totalNet.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Campaña</DialogTitle>
                        <DialogDescription>Actualiza los detalles de la campaña.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="space-y-1.5">
                            <Label>Nombre de la Campaña</Label>
                            <Input value={editForm.name || ""} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Descripción</Label>
                            <Textarea
                                value={editForm.description || ""}
                                onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Fecha de Inicio</Label>
                                <Input
                                    type="date"
                                    value={editForm.startDate || ""}
                                    onChange={e => setEditForm((p: any) => ({ ...p, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Fecha de Fin</Label>
                                <Input
                                    type="date"
                                    value={editForm.endDate || ""}
                                    onChange={e => setEditForm((p: any) => ({ ...p, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ubicación</Label>
                            <Input value={editForm.location || ""} onChange={e => setEditForm((p: any) => ({ ...p, location: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
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
        </div>
    );
}
