import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
import {
    Download,
    FileText,
    Users,
    BarChart3,
    Loader2,
    TrendingUp,
    Eye,
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    Radio,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── CSV utility ──────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][], headers: string[]) {
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function fmt(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
}

function fmtFull(n: number) {
    return n.toLocaleString();
}

// ─── Component ────────────────────────────────────────────────────
export default function BrandReports() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [creatorProfiles, setCreatorProfiles] = useState<Record<string, any>>({});
    const [isCampaignLoading, setIsCampaignLoading] = useState(true);
    const [isMetricsLoading, setIsMetricsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());

    // ─── 1. Fetch campaigns independently so dropdown always works ─
    useEffect(() => {
        if (!user) return;
        setIsCampaignLoading(true);
        getDocs(query(collection(db, "campaigns"), where("brandId", "==", user.uid), orderBy("createdAt", "desc")))
            .then((snap) => setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
            .catch((err) => {
                toast.error("Error al cargar campañas");
            })
            .finally(() => setIsCampaignLoading(false));
    }, [user]);

    // ─── 2. Fetch submissions when campaign selection changes ──────
    useEffect(() => {
        if (!user || isCampaignLoading) return;
        const campaignIds =
            selectedCampaignId === "all" ? campaigns.map((c) => c.id) : [selectedCampaignId];
        if (campaignIds.length === 0) {
            setSubmissions([]);
            return;
        }
        setIsMetricsLoading(true);
        Promise.all(
            campaignIds.map((id) =>
                getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
            )
        )
            .then(async (snaps) => {
                const allSubs: any[] = [];
                snaps.forEach((snap) =>
                    snap.docs.forEach((d) => allSubs.push({ id: d.id, ...d.data() }))
                );
                
                // 1. Filter by status (only approved)
                let finalSubs = allSubs.filter(s => s.status === "approved");

                // 2. De-duplicate by slot (campaign + creator + deliverable type/number)
                const slotsMap = new Map();
                finalSubs.forEach(s => {
                    const creatorId = s.userId || s.creatorId;
                    const slotKey = `${s.campaignId}_${creatorId}_${s.deliverableType || 'default'}_${s.deliverableNumber || 0}`;
                    const existing = slotsMap.get(slotKey);
                    
                    const currentTs = (s.updatedAt?.toMillis?.() || s.createdAt?.toMillis?.() || (s.updatedAt?.seconds * 1000) || (s.createdAt?.seconds * 1000) || 0);
                    const existingTs = existing ? (existing.updatedAt?.toMillis?.() || existing.createdAt?.toMillis?.() || (existing.updatedAt?.seconds * 1000) || (existing.createdAt?.seconds * 1000) || 0) : -1;

                    if (!existing || currentTs > existingTs) {
                        slotsMap.set(slotKey, s);
                    }
                });

                finalSubs = Array.from(slotsMap.values());
                setSubmissions(finalSubs);

                // Fetch creator profiles for unique creatorIds
                const creatorIds = [...new Set(finalSubs.map((s) => s.userId || s.creatorId).filter(Boolean))];
                const profileMap: Record<string, any> = {};
                await Promise.all(
                    creatorIds.map(async (cid: string) => {
                        try {
                            const snap = await getDoc(doc(db, "users", cid));
                            if (snap.exists()) profileMap[cid] = { id: snap.id, ...snap.data() };
                        } catch { }
                    })
                );
                setCreatorProfiles(profileMap);
            })
            .catch((err) => {
                toast.error("Error al cargar métricas");
            })
            .finally(() => setIsMetricsLoading(false));
    }, [selectedCampaignId, campaigns, user, isCampaignLoading]);

    // ─── Derived: aggregate metrics ───────────────────────────────
    const totals = submissions.reduce(
        (acc, s) => ({
            views: acc.views + (s.metrics?.views || 0),
            reach: acc.reach + (s.metrics?.reach || 0),
            likes: acc.likes + (s.metrics?.likes || 0),
            comments: acc.comments + (s.metrics?.comments || 0),
            saved: acc.saved + (s.metrics?.saved || 0),
            shares: acc.shares + (s.metrics?.shares || 0),
        }),
        { views: 0, reach: 0, likes: 0, comments: 0, saved: 0, shares: 0 }
    );

    // Group by creator
    const creatorMetrics = Object.values(
        submissions.reduce((acc: any, s) => {
            const cid = s.userId || s.creatorId || "unknown";
            if (!acc[cid]) {
                acc[cid] = { 
                    cid, 
                    views: 0, 
                    reach: 0, 
                    likes: 0, 
                    comments: 0, 
                    saved: 0, 
                    shares: 0, 
                    posts: 0,
                    individualPosts: []
                };
            }
            acc[cid].posts++;
            acc[cid].views += s.metrics?.views || 0;
            acc[cid].reach += s.metrics?.reach || 0;
            acc[cid].likes += s.metrics?.likes || 0;
            acc[cid].comments += s.metrics?.comments || 0;
            acc[cid].saved += s.metrics?.saved || 0;
            acc[cid].shares += s.metrics?.shares || 0;
            
            acc[cid].individualPosts.push({
                id: s.id,
                deliverableType: s.deliverableType || "Post",
                deliverableNumber: s.deliverableNumber || 1,
                views: s.metrics?.views || 0,
                likes: s.metrics?.likes || 0,
                comments: s.metrics?.comments || 0,
                saved: s.metrics?.saved || 0,
                shares: s.metrics?.shares || 0,
                contentUrl: s.contentUrl,
                platform: s.platform || (s.metrics?.inputPlatform) || "instagram"
            });
            
            return acc;
        }, {})
    ) as any[];

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

    // ─── Download CSV ─────────────────────────────────────────────
    const downloadMetricsCSV = () => {
        setIsDownloading(true);
        try {
            const headers = ["Creador", "Instagram", "Posts", "Vistas", "Alcance", "Likes", "Comentarios", "Guardados", "Compartidos", "Campaña"];
            const rows = creatorMetrics.map((cm) => {
                const profile = creatorProfiles[cm.cid] || {};
                const campName =
                    selectedCampaignId === "all"
                        ? (submissions.find((s) => (s.userId || s.creatorId) === cm.cid)
                            ? campaigns.find((c) => c.id === submissions.find((s) => (s.userId || s.creatorId) === cm.cid)?.campaignId)?.title
                            : "") || "Múltiples"
                        : selectedCampaign?.title || "";
                return [
                    profile.displayName || profile.name || cm.cid,
                    profile.socialHandles?.instagram ? `@${profile.socialHandles.instagram}` : profile.instagramUsername ? `@${profile.instagramUsername}` : "",
                    String(cm.posts),
                    String(cm.views),
                    String(cm.reach),
                    String(cm.likes),
                    String(cm.comments),
                    String(cm.saved),
                    String(cm.shares),
                    campName,
                ];
            });
            const suffix = selectedCampaignId === "all" ? "todas" : (selectedCampaign?.title || selectedCampaignId).replace(/\s+/g, "_");
            downloadCSV(`RELA_Rendimiento_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
            toast.success("Reporte descargado ✅");
        } finally {
            setIsDownloading(false);
        }
    };

    const toggleCreator = (creatorId: string) => {
        setExpandedCreators(prev => {
            const next = new Set(prev);
            if (next.has(creatorId)) next.delete(creatorId);
            else next.add(creatorId);
            return next;
        });
    };

    const isLoading = isCampaignLoading || isMetricsLoading;

    const kpis = [
        { label: "Vistas", value: fmt(totals.views), icon: Eye, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        { label: "Alcance", value: fmt(totals.reach), icon: Radio, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Likes", value: fmt(totals.likes), icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10" },
        { label: "Comentarios", value: fmt(totals.comments), icon: MessageCircle, color: "text-primary", bg: "bg-primary/10" },
        { label: "Guardados", value: fmt(totals.saved), icon: Bookmark, color: "text-purple-400", bg: "bg-purple-400/10" },
        { label: "Compartidos", value: fmt(totals.shares), icon: Share2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Reportes de Rendimiento"
                    subtitle="Métricas reales de contenido publicado por tus creadores"
                />

                {/* Campaign selector + download */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
                    <div className="w-full sm:w-80">
                        {isCampaignLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando campañas…
                            </div>
                        ) : (
                            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una campaña" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">📊 Todas las campañas</SelectItem>
                                    {campaigns.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title || c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <Button
                        variant="hero"
                        onClick={downloadMetricsCSV}
                        disabled={isDownloading || creatorMetrics.length === 0}
                        className="gap-2 flex-shrink-0"
                    >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar Reporte CSV
                    </Button>
                </div>

                {isMetricsLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* KPI grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {kpis.map((kpi, i) => (
                                <motion.div
                                    key={kpi.label}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="glass-card p-4"
                                >
                                    <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                                        <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                                    </div>
                                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Engagement rate KPI */}
                        {totals.reach > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 mb-8 flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <BarChart3 className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Engagement Rate promedio (alcance)</div>
                                    <div className="text-xl font-bold text-accent">
                                        {(((totals.likes + totals.comments + totals.saved + totals.shares) / totals.reach) * 100).toFixed(2)}%
                                    </div>
                                </div>
                                <div className="ml-auto text-sm text-muted-foreground">
                                    {submissions.length} publicación{submissions.length !== 1 ? "es" : ""} · {creatorMetrics.length} creador{creatorMetrics.length !== 1 ? "es" : ""}
                                </div>
                            </motion.div>
                        )}

                        {/* Creator performance table */}
                        {creatorMetrics.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6"
                            >
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Rendimiento por Creador
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                                                <th className="w-8 py-3 font-medium"></th>
                                                <th className="text-left py-3 pr-4 font-medium">Creador</th>
                                                <th className="text-right py-3 pr-4 font-medium">Posts</th>
                                                <th className="text-right py-3 pr-4 font-medium">Vistas</th>
                                                <th className="text-right py-3 pr-4 font-medium">Alcance</th>
                                                <th className="text-right py-3 pr-4 font-medium">❤️ Likes</th>
                                                <th className="text-right py-3 pr-4 font-medium">💬 Coment.</th>
                                                <th className="text-right py-3 pr-4 font-medium">🔖 Guard.</th>
                                                <th className="text-right py-3 font-medium">↗ Compart.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {creatorMetrics
                                                .sort((a, b) => b.views - a.views)
                                                .map((cm, i) => {
                                                    const profile = creatorProfiles[cm.cid] || {};
                                                    const igHandle = profile.socialHandles?.instagram || profile.instagramUsername;
                                                    const isExpanded = expandedCreators.has(cm.cid);
                                                    return (
                                                        <React.Fragment key={cm.cid}>
                                                            <tr 
                                                                className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                                                                onClick={() => toggleCreator(cm.cid)}
                                                            >
                                                                <td className="py-3 text-center">
                                                                    {cm.individualPosts.length > 1 ? (
                                                                        isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                                    ) : null}
                                                                </td>
                                                                <td className="py-3 pr-4">
                                                                    <div className="flex items-center gap-3">
                                                                        {profile.photoURL ? (
                                                                            <img src={profile.photoURL} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                                        ) : (
                                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                                                                {(profile.displayName || "?")[0]}
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <div className="font-medium">{profile.displayName || profile.name || cm.cid}</div>
                                                                            {igHandle && <div className="text-xs text-muted-foreground">@{igHandle}</div>}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 pr-4 text-right">{cm.posts}</td>
                                                                <td className="py-3 pr-4 text-right font-mono text-indigo-400">{fmt(cm.views)}</td>
                                                                <td className="py-3 pr-4 text-right font-mono text-blue-400">{fmt(cm.reach)}</td>
                                                                <td className="py-3 pr-4 text-right font-mono text-rose-400">{fmt(cm.likes)}</td>
                                                                <td className="py-3 pr-4 text-right font-mono">{fmt(cm.comments)}</td>
                                                                <td className="py-3 pr-4 text-right font-mono text-purple-400">{fmt(cm.saved)}</td>
                                                                <td className="py-3 text-right font-mono text-emerald-400">{fmt(cm.shares)}</td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr className="bg-muted/5">
                                                                    <td colSpan={9} className="px-4 py-4">
                                                                        <div className="border border-border/40 rounded-xl bg-white/40 overflow-hidden">
                                                                            <table className="w-full text-[11px]">
                                                                                <thead>
                                                                                    <tr className="bg-muted/10 text-muted-foreground border-b border-border/30">
                                                                                        <th className="px-4 py-2 text-left font-medium">Contenido</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Vistas</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Likes</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Coment.</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Guard.</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Compar.</th>
                                                                                        <th className="px-4 py-2 text-right font-medium">Link</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {cm.individualPosts.map((post: any, pIdx: number) => (
                                                                                        <tr key={post.id || pIdx} className="border-b border-border/10 last:border-0 hover:bg-white/60 transition-colors">
                                                                                            <td className="px-4 py-2">
                                                                                                <div className="font-bold text-primary/80">
                                                                                                    {post.deliverableType} #{post.deliverableNumber}
                                                                                                </div>
                                                                                                <div className="text-[9px] uppercase opacity-60 font-mono tracking-tighter">{post.platform}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-right font-mono">{fmtFull(post.views)}</td>
                                                                                            <td className="px-4 py-2 text-right font-mono text-rose-500/80">{fmtFull(post.likes)}</td>
                                                                                            <td className="px-4 py-2 text-right font-mono">{fmtFull(post.comments)}</td>
                                                                                            <td className="px-4 py-2 text-right font-mono text-purple-500/60">{fmtFull(post.saved)}</td>
                                                                                            <td className="px-4 py-2 text-right font-mono text-emerald-500/80">{fmtFull(post.shares)}</td>
                                                                                            <td className="px-4 py-2 text-right">
                                                                                                {post.contentUrl && (
                                                                                                    <a 
                                                                                                        href={post.contentUrl} 
                                                                                                        target="_blank" 
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="p-1.5 hover:bg-primary/10 rounded-lg inline-flex items-center text-primary"
                                                                                                    >
                                                                                                        <ExternalLink className="w-3 h-3" />
                                                                                                    </a>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-border font-bold text-sm">
                                                <td className="py-3"></td>
                                                <td className="py-3 pr-4 text-muted-foreground">TOTAL</td>
                                                <td className="py-3 pr-4 text-right">{submissions.length}</td>
                                                <td className="py-3 pr-4 text-right text-indigo-400">{fmt(totals.views)}</td>
                                                <td className="py-3 pr-4 text-right text-blue-400">{fmt(totals.reach)}</td>
                                                <td className="py-3 pr-4 text-right text-rose-400">{fmt(totals.likes)}</td>
                                                <td className="py-3 pr-4 text-right">{fmt(totals.comments)}</td>
                                                <td className="py-3 pr-4 text-right text-purple-400">{fmt(totals.saved)}</td>
                                                <td className="py-3 text-right text-emerald-400">{fmt(totals.shares)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="glass-card p-10 text-center">
                                <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">Sin datos de rendimiento aún</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">
                                    Los creadores deben enviar su contenido y que sea aprobado para que aparezcan aquí sus métricas.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
