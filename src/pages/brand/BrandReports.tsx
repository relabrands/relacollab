import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, getDoc, doc as fsDoc } from "firebase/firestore";
import {
    Download,
    FileText,
    Users,
    BarChart3,
    ChevronDown,
    Loader2,
    TrendingUp,
    CheckCircle2,
    Clock,
    DollarSign,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Helper to convert data to CSV and trigger download
function downloadCSV(filename: string, rows: string[][], headers: string[]) {
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csvContent = [
        headers.map(escape).join(","),
        ...rows.map((r) => r.map(escape).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const STATUS_LABEL: Record<string, string> = {
    pending: "Pendiente",
    approved: "Colaborando",
    accepted: "Colaborando",
    rejected: "Rechazado",
    active: "Activo",
    completed: "Completado",
    no_content: "Sin Contenido Enviado",
    content_submitted: "Contenido Enviado",
};

export default function BrandReports() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [creators, setCreators] = useState<Record<string, any>>({});
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    // ─── Fetch campaigns + applications + submissions ────────────────
    useEffect(() => {
        const load = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // 1. All campaigns for this brand
                const cSnap = await getDocs(
                    query(collection(db, "campaigns"), where("brandId", "==", user.uid), orderBy("createdAt", "desc"))
                );
                const campaignsData: any[] = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setCampaigns(campaignsData);

                const allApps: any[] = [];
                const creatorMap: Record<string, any> = {};

                for (const camp of campaignsData) {
                    // 2. Fetch applications from root collection by campaignId
                    const appsSnap = await getDocs(
                        query(collection(db, "applications"), where("campaignId", "==", camp.id))
                    );

                    // 3. Fetch content submissions for this campaign
                    const subsSnap = await getDocs(
                        query(collection(db, "content_submissions"), where("campaignId", "==", camp.id))
                    );
                    const submissions = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

                    for (const appDoc of appsSnap.docs) {
                        const appData = appDoc.data();
                        const creatorId = appData.creatorId;
                        if (!creatorId) continue;

                        // Fetch creator profile once per unique creator
                        if (!creatorMap[creatorId]) {
                            try {
                                const cDoc = await getDoc(fsDoc(db, "users", creatorId));
                                if (cDoc.exists()) creatorMap[creatorId] = { id: creatorId, ...cDoc.data() };
                            } catch { }
                        }

                        // Determine content submission status
                        const submission = submissions.find(
                            (s: any) => s.userId === creatorId || s.creatorId === creatorId
                        );
                        const submissionStatus = submission?.status || null;

                        // Compute rich status label
                        let richStatus = appData.status;
                        if (appData.status === "approved" || appData.status === "accepted") {
                            if (submissionStatus === "approved") richStatus = "completed";
                            else if (submission) richStatus = "content_submitted";
                            else richStatus = "no_content";
                        }

                        allApps.push({
                            id: appDoc.id,
                            campaignId: camp.id,
                            campaignTitle: camp.title || "—",
                            creatorId,
                            status: appData.status,
                            richStatus,
                            submissionStatus,
                            paidAmount: appData.paidAmount || 0,
                            creatorPayment: appData.creatorPayment || 0,
                            createdAt: appData.createdAt || null,
                        });
                    }
                }

                setApplications(allApps);
                setCreators(creatorMap);
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar los datos");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [user]);

    // ─── Filtered data ─────────────────────────────────────────────
    const filteredApps =
        selectedCampaignId === "all"
            ? applications
            : applications.filter((a) => a.campaignId === selectedCampaignId);

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

    // ─── Summary stats ─────────────────────────────────────────────
    const totalApplicants = filteredApps.length;
    const approved = filteredApps.filter((a) => ["approved", "accepted", "no_content", "content_submitted", "completed"].includes(a.richStatus || a.status)).length;
    const pending = filteredApps.filter((a) => (a.richStatus || a.status) === "pending").length;
    const totalPaid = filteredApps
        .filter((a) => (a.richStatus || a.status) === "completed")
        .reduce((acc, a) => acc + (a.paidAmount || a.creatorPayment || 0), 0);

    // ─── Download handlers ─────────────────────────────────────────
    const downloadCampaignReport = () => {
        setIsDownloading(true);
        try {
            const campToReport = selectedCampaignId === "all" ? campaigns : campaigns.filter((c) => c.id === selectedCampaignId);
            const headers = ["Campaña", "Estado", "Tipo", "Presupuesto (USD)", "Creadores Requeridos", "Aplicaciones", "Aprobados", "Fecha Inicio", "Fecha Fin"];
            const rows = campToReport.map((c) => {
                const apps = applications.filter((a) => a.campaignId === c.id);
                const appr = apps.filter((a) => a.status === "approved" || a.status === "active").length;
                return [
                    c.title || "",
                    STATUS_LABEL[c.status] || c.status || "",
                    c.compensationType || "",
                    String(c.budget || c.totalBudget || 0),
                    String(c.creatorCount || ""),
                    String(apps.length),
                    String(appr),
                    c.startDate ? new Date(c.startDate).toLocaleDateString() : "",
                    c.endDate || c.deadline ? new Date(c.endDate || c.deadline).toLocaleDateString() : "",
                ];
            });
            const suffix = selectedCampaignId === "all" ? "todas" : (selectedCampaign?.title || selectedCampaignId).replace(/\s+/g, "_");
            downloadCSV(`RELA_Campanas_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
            toast.success("Reporte de campañas descargado ✅");
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadCreatorReport = () => {
        setIsDownloading(true);
        try {
            const headers = ["Creador", "Instagram", "TikTok", "Campaña", "Estado", "Fecha Aplicación", "Pago Neto (USD)"];
            const rows = filteredApps.map((a) => {
                const creator = creators[a.creatorId] || {};
                const campTitle = campaigns.find((c) => c.id === a.campaignId)?.title || a.campaignTitle || a.campaignId || "";
                return [
                    creator.displayName || creator.name || a.creatorName || a.creatorId || "N/A",
                    creator.socialHandles?.instagram || creator.instagramUsername || "",
                    creator.socialHandles?.tiktok || "",
                    campTitle,
                    STATUS_LABEL[a.status] || a.status || "",
                    a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
                    String(a.paidAmount || a.creatorPayment || 0),
                ];
            });
            const suffix = selectedCampaignId === "all" ? "todas" : (selectedCampaign?.title || selectedCampaignId).replace(/\s+/g, "_");
            downloadCSV(`RELA_Creadores_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
            toast.success("Reporte de creadores descargado ✅");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Reportes"
                    subtitle="Genera y descarga reportes de rendimiento de tus campañas y creadores"
                />

                {/* Campaign selector */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
                    <div className="w-full sm:w-80">
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una campaña" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">📊 Todas las campañas</SelectItem>
                                {campaigns.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedCampaignId !== "all" && selectedCampaign && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            {STATUS_LABEL[selectedCampaign.status] || selectedCampaign.status}
                        </Badge>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Summary KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "Aplicaciones", value: totalApplicants, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                                { label: "Aprobados", value: approved, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
                                { label: "Pendientes", value: pending, icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
                                { label: "Total Pagado (USD)", value: `$${totalPaid.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    className="glass-card p-5"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Report cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Campaign report */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="glass-card p-6"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <BarChart3 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Reporte por Campaña</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Estado, presupuesto, aplicaciones y aprobaciones de {selectedCampaignId === "all" ? "todas tus" : "la"} campaña{selectedCampaignId === "all" ? "s" : ""}.
                                        </p>
                                    </div>
                                </div>
                                <ul className="text-sm text-muted-foreground space-y-1.5 mb-6 pl-1">
                                    {["Nombre y estado de campaña", "Tipo de compensación", "Presupuesto total", "Total de aplicaciones y aprobados", "Fechas de inicio y fin"].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant="hero"
                                    className="w-full"
                                    onClick={downloadCampaignReport}
                                    disabled={isDownloading || campaigns.length === 0}
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                    Descargar CSV — Campañas
                                </Button>
                            </motion.div>

                            {/* Creator report */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.18 }}
                                className="glass-card p-6"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-6 h-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Reporte por Creador</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Detalle de cada creador participante: estado, redes sociales y pago.
                                        </p>
                                    </div>
                                </div>
                                <ul className="text-sm text-muted-foreground space-y-1.5 mb-6 pl-1">
                                    {["Nombre del creador", "Redes sociales (Instagram / TikTok)", "Campaña asociada", "Estado de la aplicación", "Fecha de aplicación y pago neto"].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant="outline"
                                    className="w-full border-accent/30 hover:bg-accent/10"
                                    onClick={downloadCreatorReport}
                                    disabled={isDownloading || filteredApps.length === 0}
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                    Descargar CSV — Creadores
                                </Button>
                            </motion.div>
                        </div>

                        {/* Applications table preview */}
                        {filteredApps.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="glass-card p-6"
                            >
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Vista Previa — Creadores ({filteredApps.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-muted-foreground">
                                                <th className="text-left py-2 pr-4 font-medium">Creador</th>
                                                <th className="text-left py-2 pr-4 font-medium">Instagram</th>
                                                <th className="text-left py-2 pr-4 font-medium">Campaña</th>
                                                <th className="text-left py-2 pr-4 font-medium">Estado</th>
                                                <th className="text-right py-2 font-medium">Pago (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApps.slice(0, 20).map((app, i) => {
                                                const creator = creators[app.creatorId] || {};
                                                const campTitle = app.campaignTitle || campaigns.find((c) => c.id === app.campaignId)?.title || "—";
                                                const statusKey = app.richStatus || app.status;
                                                const statusColors: Record<string, string> = {
                                                    pending: "bg-orange-400/15 text-orange-400",
                                                    approved: "bg-primary/15 text-primary",
                                                    accepted: "bg-primary/15 text-primary",
                                                    no_content: "bg-yellow-500/15 text-yellow-500",
                                                    content_submitted: "bg-blue-500/15 text-blue-400",
                                                    completed: "bg-success/15 text-success",
                                                    rejected: "bg-destructive/15 text-destructive",
                                                    active: "bg-primary/15 text-primary",
                                                };
                                                return (
                                                    <tr key={app.id || i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                        <td className="py-3 pr-4 font-medium">
                                                            {creator.displayName || creator.name || "N/A"}
                                                        </td>
                                                        <td className="py-3 pr-4 text-muted-foreground">
                                                            {creator.socialHandles?.instagram ? `@${creator.socialHandles.instagram}` : creator.instagramUsername ? `@${creator.instagramUsername}` : "—"}
                                                        </td>
                                                        <td className="py-3 pr-4 text-muted-foreground truncate max-w-[180px]">{campTitle}</td>
                                                        <td className="py-3 pr-4">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[statusKey] || "bg-muted text-muted-foreground"}`}>
                                                                {STATUS_LABEL[statusKey] || statusKey || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right font-mono">
                                                            {app.paidAmount || app.creatorPayment
                                                                ? `$${(app.paidAmount || app.creatorPayment).toLocaleString()}`
                                                                : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {filteredApps.length > 20 && (
                                        <p className="text-xs text-muted-foreground text-center mt-3">
                                            Mostrando 20 de {filteredApps.length} registros. Descarga el CSV para ver todos.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="glass-card p-10 text-center">
                                <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">No hay datos disponibles para los filtros seleccionados.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
