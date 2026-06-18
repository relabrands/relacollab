import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Search, Eye, Ban, CheckCircle, Users, Loader2, Trash2, Mail,
  Instagram, SlidersHorizontal, Calendar, LayoutList, LayoutGrid,
  XCircle, TrendingUp, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { CreatorDetailsDialog } from "@/components/admin/CreatorDetailsDialog";
import { MobileNav } from "@/components/dashboard/MobileNav";

interface Application {
  id: string;
  creatorId: string;
  campaignId: string;
  status: string;
  campaignTitle?: string;
  budget?: string;
}

interface Creator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  followers: string;
  engagement: string;
  status: "active" | "pending" | "suspended" | "disqualified";
  campaigns: number;
  earnings: string;
  location?: string;
  phone?: string;
  bio?: string;
  socialHandles?: { instagram?: string; tiktok?: string };
  categories?: string[];
  contentTypes?: string[];
  contentFormats?: string[];
  vibes?: string[];
  whoAppearsInContent?: string[];
  experienceTime?: string;
  collaborationPreference?: string;
  hasBrandExperience?: boolean;
  onboardingCompleted?: boolean;
  instagramMetrics?: any;
  tiktokMetrics?: any;
  instagramConnected?: boolean;
  tiktokConnected?: boolean;
  createdAtStr: string;
  createdAtTs: number;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  suspended: "bg-destructive/10 text-destructive",
  disqualified: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  suspended: "Suspendido",
  disqualified: "No califica",
};

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended" | "disqualified">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), where("role", "==", "creator"));
      const querySnapshot = await getDocs(q);

      const appsSnapshot = await getDocs(collection(db, "applications"));
      const allApps = appsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as Application;
      });

      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const campaignMap: Record<string, string> = {};
      campaignsSnapshot.docs.forEach(docSnap => {
        const campaignData = docSnap.data();
        campaignMap[docSnap.id] = campaignData.title || campaignData.name || "Untitled";
      });

      const enrichedApps = allApps
        .map(app => ({
          ...app,
          campaignTitle: campaignMap[app.campaignId] || "Unknown Campaign"
        }))
        .filter(app => app.campaignTitle !== "Unknown Campaign");

      setApplications(enrichedApps);

      const appCounts: Record<string, number> = {};
      enrichedApps.forEach(app => {
        if (app.creatorId && app.status === 'approved') {
          appCounts[app.creatorId] = (appCounts[app.creatorId] || 0) + 1;
        }
      });

      const creatorsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const followersCount = data.instagramMetrics?.followers || data.instagramFollowers || 0;
        const engagementRate = data.instagramMetrics?.engagementRate || data.engagementRate || 0;

        let createdAtStr = "N/A";
        let createdAtTs = 0;
        if (data.createdAt) {
          const d = data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt);
          if (!isNaN(d.getTime())) {
            const now = new Date();
            const sameYear = d.getFullYear() === now.getFullYear();
            createdAtStr = d.toLocaleString('es-DO', {
              day: '2-digit', month: 'short',
              ...(!sameYear ? { year: 'numeric' } : {}),
              hour: '2-digit', minute: '2-digit'
            }).replace(',', ' ·');
            createdAtTs = d.getTime();
          }
        }

        return {
          id: docSnap.id,
          name: data.displayName || data.name || "Unknown Creator",
          email: data.email || "",
          avatar: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          followers: followersCount > 0 ? `${(followersCount / 1000).toFixed(1)}K` : "0",
          engagement: engagementRate > 0 ? `${parseFloat(engagementRate).toFixed(2)}%` : "0%",
          status: data.status || "pending",
          campaigns: appCounts[docSnap.id] || 0,
          earnings: "$0",
          location: data.location,
          phone: data.phone,
          bio: data.bio,
          socialHandles: data.socialHandles,
          categories: data.categories,
          contentTypes: data.contentTypes,
          contentFormats: data.contentFormats || [],
          vibes: data.vibes || [],
          whoAppearsInContent: data.whoAppearsInContent,
          experienceTime: data.experienceTime,
          collaborationPreference: data.collaborationPreference,
          hasBrandExperience: data.hasBrandExperience,
          onboardingCompleted: data.onboardingCompleted,
          instagramMetrics: data.instagramMetrics,
          tiktokMetrics: data.tiktokMetrics,
          instagramConnected: data.instagramConnected,
          tiktokConnected: data.tiktokConnected,
          createdAtStr,
          createdAtTs
        } as Creator;
      });
      setCreators(creatorsData);
    } catch (error) {
      toast.error("Failed to load creators");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creators.filter(
    (creator) => {
      const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || creator.status === statusFilter;

      let matchesDate = true;
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (dateFilter === "today") {
        matchesDate = (now - creator.createdAtTs) <= ONE_DAY;
      } else if (dateFilter === "week") {
        matchesDate = (now - creator.createdAtTs) <= 7 * ONE_DAY;
      } else if (dateFilter === "month") {
        matchesDate = (now - creator.createdAtTs) <= 30 * ONE_DAY;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }
  ).sort((a, b) => {
    if (sortBy === "newest") return b.createdAtTs - a.createdAtTs;
    if (sortBy === "oldest") return a.createdAtTs - b.createdAtTs;
    return 0;
  });

  const handleChangeStatus = async (creatorId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", creatorId), { status: newStatus });
      setCreators(creators.map((c) => (c.id === creatorId ? { ...c, status: newStatus as any } : c)));
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleActivate = async (creator: Creator) => {
    try {
      await updateDoc(doc(db, "users", creator.id), { status: "active" });
      setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "active" } : c)));
      toast.success(`${creator.name} activado`);
    } catch (error) {
      toast.error("Error al activar el creador");
    }
  };

  const handleSuspend = async (creator: Creator) => {
    if (!confirm(`¿Suspender a ${creator.name}?`)) return;
    try {
      await updateDoc(doc(db, "users", creator.id), { status: "suspended" });
      setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "suspended" } : c)));
      toast.success(`${creator.name} suspendido`);
    } catch (error) {
      toast.error("Error al suspender");
    }
  };

  // ── NEW: No email sent, purely internal ──
  const handleDisqualify = async (creator: Creator) => {
    if (!confirm(`¿Marcar a ${creator.name} como "No califica"? Esta acción es interna y no notifica al creador.`)) return;
    try {
      await updateDoc(doc(db, "users", creator.id), { status: "disqualified" });
      setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "disqualified" } : c)));
      toast.success(`${creator.name} marcado como "No califica"`);
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async (creator: Creator) => {
    if (!confirm(`¿Eliminar permanentemente a ${creator.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, "users", creator.id));
      setCreators(creators.filter((c) => c.id !== creator.id));
      toast.success(`Creador eliminado`);
    } catch (error) {
      toast.error("Error al eliminar el creador");
    }
  };

  const handleViewDetails = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsDetailsOpen(true);
  };

  const handleSendSocialReminders = async () => {
    if (!confirm("¿Enviar correos recordatorios a todos los creadores activos que no han conectado sus redes?")) return;
    setSendingReminders(true);
    try {
      const triggerSocialReminders = httpsCallable(functions, "triggerSocialReminders");
      const result = await triggerSocialReminders();
      const data = result.data as { success: boolean; sentCount: number; errors: any[] };
      if (data.success) {
        toast.success(`Se enviaron ${data.sentCount} correos.`);
      }
    } catch (error: any) {
      toast.error(`Error al enviar correos: ${error.message}`);
    } finally {
      setSendingReminders(false);
    }
  };

  const tabs = [
    { key: "all" as const,          label: "Todos",       count: creators.length },
    { key: "pending" as const,      label: "Pendientes",  count: creators.filter(c => c.status === "pending").length },
    { key: "active" as const,       label: "Activos",     count: creators.filter(c => c.status === "active").length },
    { key: "disqualified" as const, label: "No califica", count: creators.filter(c => c.status === "disqualified").length },
    { key: "suspended" as const,    label: "Suspendidos", count: creators.filter(c => c.status === "suspended").length },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <MobileNav type="admin" />

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title="Creadores"
          subtitle="Gestiona y revisa las cuentas de creadores registrados"
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Cargando creadores...</p>
          </div>
        ) : (
          <>
            {/* ── Top control bar ── */}
            <div className="mb-6 space-y-3">
              {/* Row 1: status tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {tabs.map(tab => (
                    <Button
                      key={tab.key}
                      variant={statusFilter === tab.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(tab.key)}
                      className="gap-1.5 h-8"
                    >
                      {tab.label}
                      <Badge
                        variant="secondary"
                        className={`ml-0.5 h-5 px-1.5 text-[11px] ${statusFilter === tab.key ? "bg-white/20 text-white" : ""}`}
                      >
                        {tab.count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendSocialReminders}
                    disabled={sendingReminders}
                    className="hidden md:flex gap-2 h-8"
                  >
                    {sendingReminders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Recordar Redes
                  </Button>
                </div>
              </div>

              {/* Row 2: search + filters + view toggle */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 h-9"
                  />
                </div>

                <Select value={dateFilter} onValueChange={(val: any) => setDateFilter(val)}>
                  <SelectTrigger className="w-[150px] h-9 gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier fecha</SelectItem>
                    <SelectItem value="today">Últimas 24 h</SelectItem>
                    <SelectItem value="week">Últimos 7 días</SelectItem>
                    <SelectItem value="month">Últimos 30 días</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="w-[145px] h-9 gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground">
                  {filteredCreators.length} de {creators.length}
                </span>

                {/* View toggle */}
                <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode("table")}
                    title="Vista de tabla"
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode("cards")}
                    title="Vista de tarjetas"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ── TABLE VIEW ── */}
            {viewMode === "table" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
              >
                <div className="w-full flex-1 min-w-0 overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Creator</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Registro</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Redes</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Followers</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Engagement</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Estado</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Collabs</th>
                        <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCreators.map((creator) => (
                        <tr key={creator.id} className="border-t border-border hover:bg-muted/30 transition-colors group">
                          {/* Creator */}
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={creator.avatar}
                                alt={creator.name}
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 ring-1 ring-border"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate max-w-[160px]" title={creator.name}>{creator.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[160px]" title={creator.email}>{creator.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{creator.createdAtStr}</span>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                creator.instagramConnected ? 'bg-pink-500/10 text-pink-500' : 'bg-muted text-muted-foreground'
                              }`}>
                                <Instagram className="w-3 h-3" />
                                {creator.instagramConnected ? 'IG' : '-'}
                              </span>
                              <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                creator.tiktokConnected ? 'bg-sky-500/10 text-sky-500' : 'bg-muted text-muted-foreground'
                              }`}>
                                TT {creator.tiktokConnected ? '✓' : '-'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 font-medium text-sm">{creator.followers}</td>

                          <td className="p-3 text-sm">
                            <span className={creator.engagement === '0%' ? 'text-muted-foreground' : 'text-emerald-500 font-medium'}>
                              {creator.engagement}
                            </span>
                          </td>

                          <td className="p-3">
                            <Select
                              value={creator.status}
                              onValueChange={(value) => handleChangeStatus(creator.id, value)}
                            >
                              <SelectTrigger className={`w-[120px] h-7 text-xs font-semibold capitalize border-0 ${
                                statusColors[creator.status] || 'bg-muted'
                              }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="suspended">Suspendido</SelectItem>
                                <SelectItem value="disqualified">No califica</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="p-3 text-center">
                            <span className={`text-sm font-medium ${
                              creator.campaigns > 0 ? 'text-foreground' : 'text-muted-foreground'
                            }`}>{creator.campaigns}</span>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                title="Ver detalles"
                                onClick={() => handleViewDetails(creator)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {creator.status === "active" ? (
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 hover:bg-orange-500/10 text-muted-foreground hover:text-orange-500"
                                  title="Suspender"
                                  onClick={() => handleSuspend(creator)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              ) : creator.status === "suspended" || creator.status === "disqualified" ? (
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 hover:bg-success/10 text-muted-foreground hover:text-success"
                                  title="Activar"
                                  onClick={() => handleActivate(creator)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                // pending — show quick action: activate or disqualify
                                <>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 hover:bg-success/10 text-muted-foreground hover:text-success"
                                    title="Aprobar"
                                    onClick={() => handleActivate(creator)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 hover:bg-muted text-muted-foreground"
                                    title="No califica (uso interno)"
                                    onClick={() => handleDisqualify(creator)}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                title="Eliminar"
                                onClick={() => handleDelete(creator)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredCreators.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Sin resultados</h3>
                    <p className="text-muted-foreground text-sm">Ajusta los filtros para encontrar creadores.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CARD VIEW ── */}
            {viewMode === "cards" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredCreators.map((creator) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-2xl overflow-hidden flex flex-col"
                  >
                    {/* Card header */}
                    <div className="relative">
                      {/* Status strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        creator.status === 'active' ? 'bg-success' :
                        creator.status === 'pending' ? 'bg-warning' :
                        creator.status === 'suspended' ? 'bg-destructive' :
                        'bg-muted-foreground/40'
                      }`} />

                      <div className="p-4 pt-5 flex items-start gap-3">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" title={creator.name}>{creator.name}</p>
                          <p className="text-xs text-muted-foreground truncate" title={creator.email}>{creator.email}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{creator.createdAtStr}</p>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 flex-shrink-0 font-semibold ${statusColors[creator.status]}`}>
                          {statusLabels[creator.status] || creator.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <Users className="w-3 h-3" />
                        </div>
                        <p className="text-xs font-semibold">{creator.followers}</p>
                        <p className="text-[9px] text-muted-foreground">Seguidores</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <p className={`text-xs font-semibold ${creator.engagement !== '0%' ? 'text-emerald-500' : ''}`}>
                          {creator.engagement}
                        </p>
                        <p className="text-[9px] text-muted-foreground">Engagement</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <UserCheck className="w-3 h-3" />
                        </div>
                        <p className="text-xs font-semibold">{creator.campaigns}</p>
                        <p className="text-[9px] text-muted-foreground">Collabs</p>
                      </div>
                    </div>

                    {/* Social badges */}
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        creator.instagramConnected ? 'bg-pink-500/10 text-pink-500' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Instagram className="w-3 h-3" />
                        {creator.instagramConnected ? 'Instagram' : 'Sin IG'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        creator.tiktokConnected ? 'bg-sky-500/10 text-sky-500' : 'bg-muted text-muted-foreground'
                      }`}>
                        TT {creator.tiktokConnected ? '✓ TikTok' : 'Sin TT'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto border-t border-border/50 p-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1.5"
                        onClick={() => handleViewDetails(creator)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver perfil
                      </Button>

                      {(creator.status === "pending" || creator.status === "disqualified") && (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-success/10 hover:bg-success/20 text-success border border-success/30"
                          variant="outline"
                          onClick={() => handleActivate(creator)}
                          title="Aprobar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {creator.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 text-muted-foreground hover:bg-muted"
                          onClick={() => handleDisqualify(creator)}
                          title="No califica (uso interno, sin correo)"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {creator.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hover:bg-orange-500/10 hover:text-orange-500 text-muted-foreground"
                          onClick={() => handleSuspend(creator)}
                          title="Suspender"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {creator.status === "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hover:bg-success/10 hover:text-success text-muted-foreground"
                          onClick={() => handleActivate(creator)}
                          title="Reactivar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {filteredCreators.length === 0 && (
                  <div className="col-span-full p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Sin resultados</h3>
                    <p className="text-muted-foreground text-sm">Ajusta los filtros para encontrar creadores.</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* Creator Details Dialog */}
        <CreatorDetailsDialog
          creator={selectedCreator}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          applications={applications}
          onStatusChange={handleChangeStatus}
        />
      </main>
    </div>
  );
}