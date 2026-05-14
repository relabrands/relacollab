import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Building2, Loader2, Eye, SlidersHorizontal, Calendar } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BrandDetailsDialog } from "@/components/admin/BrandDetailsDialog";
import { MobileNav } from "@/components/dashboard/MobileNav";

interface Brand {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  plan: string;
  credits: number;
  status: "active" | "pending" | "inactive";
  campaigns: number;
  joined: string;
  joinedTs: number;
  avatar?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  phone?: string;
  bio?: string;
  description?: string;
  contactPerson?: string;
  socialLinks?: any;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  inactive: "bg-destructive/10 text-destructive",
};

const AVAILABLE_PLANS = [
  { id: "none", name: "Sin Plan" },
  { id: "starter", name: "Starter" },
  { id: "growth", name: "Growth" },
  { id: "pro", name: "Pro" }
];

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", email: "", plan: "starter" });

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "brand"));
      const querySnapshot = await getDocs(q);

      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const campaignCounts: Record<string, number> = {};
      campaignsSnapshot.docs.forEach(d => {
        const data = d.data();
        if (data.brandId) campaignCounts[data.brandId] = (campaignCounts[data.brandId] || 0) + 1;
      });

      const brandsData = querySnapshot.docs.map(d => {
        const data = d.data();
        const subscription = data.subscription;
        let currentPlan = "starter";
        if (subscription && subscription.status === "active") currentPlan = subscription.planKey || "starter";
        else if (data.hasChosenPlan) currentPlan = "starter";
        else currentPlan = data.plan || "starter";

        let actualOnboardingCompleted = !!data.onboardingCompleted;
        let actualOnboardingStep = data.onboardingStep || (actualOnboardingCompleted ? undefined : 1);
        if (!actualOnboardingCompleted) {
          const miss = !data.brandName && !data.displayName || !data.contactPerson || !data.industry || !data.phone;
          actualOnboardingStep = miss ? 1 : 2;
        }

        // Compact date
        let joined = "N/A";
        let joinedTs = 0;
        if (data.createdAt) {
          const dt = data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt);
          if (!isNaN(dt.getTime())) {
            const sameYear = dt.getFullYear() === new Date().getFullYear();
            joined = dt.toLocaleString("es-DO", {
              day: "2-digit", month: "short",
              ...(!sameYear ? { year: "numeric" } : {}),
              hour: "2-digit", minute: "2-digit"
            }).replace(",", " ·");
            joinedTs = dt.getTime();
          }
        }

        return {
          id: d.id,
          name: data.brandName || data.displayName || "Unknown Brand",
          email: data.email || "",
          plan: currentPlan,
          credits: data.credits || 0,
          status: data.status || "pending",
          campaigns: campaignCounts[d.id] || 0,
          joined,
          joinedTs,
          avatar: data.photoURL || data.avatar,
          website: data.website,
          industry: data.industry,
          companyName: data.companyName || data.brandName || data.displayName,
          companySize: data.companySize,
          location: data.location,
          phone: data.phone,
          bio: data.bio,
          description: data.description,
          contactPerson: data.contactPerson,
          socialLinks: data.socialLinks,
          onboardingStep: actualOnboardingStep,
          onboardingCompleted: actualOnboardingCompleted
        } as Brand;
      });

      setBrands(brandsData);
    } catch (error) {
      toast.error("Error al cargar marcas");
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const now = Date.now(); const ONE_DAY = 86400000;
    let matchDate = true;
    if (dateFilter === "today") matchDate = now - b.joinedTs <= ONE_DAY;
    else if (dateFilter === "week") matchDate = now - b.joinedTs <= 7 * ONE_DAY;
    else if (dateFilter === "month") matchDate = now - b.joinedTs <= 30 * ONE_DAY;
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => sortBy === "newest" ? b.joinedTs - a.joinedTs : a.joinedTs - b.joinedTs);

  const handleAddBrand = () => {
    toast.info("Para agregar una marca, usa el flujo de invitación o la página de registro.");
    setIsAddOpen(false);
  };

  const handleEditBrand = async () => {
    if (!selectedBrand) return;
    try {
      const updateData: any = {
        brandName: selectedBrand.name,
        email: selectedBrand.email,
        plan: selectedBrand.plan,
        credits: parseFloat(selectedBrand.credits.toString()) || 0
      };
      if (selectedBrand.plan === "none") {
        updateData.subscription = null; updateData.hasChosenPlan = false;
      } else {
        updateData.subscription = { planKey: selectedBrand.plan, status: "active", id: `manual_${Date.now()}` };
        updateData.hasChosenPlan = true;
      }
      await updateDoc(doc(db, "users", selectedBrand.id), updateData);
      setBrands(brands.map(b => b.id === selectedBrand.id ? { ...selectedBrand, credits: parseFloat(selectedBrand.credits.toString()) || 0 } : b));
      setIsEditOpen(false);
      toast.success(`${selectedBrand.name} actualizada`);
    } catch { toast.error("Error al actualizar"); }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`¿Eliminar permanentemente a ${brand.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, "users", brand.id));
      setBrands(brands.filter(b => b.id !== brand.id));
      toast.success(`${brand.name} eliminada`);
    } catch { toast.error("Error al eliminar"); }
  };

  const handleChangePlan = async (brandId: string, newPlanKey: string) => {
    try {
      let updateData: any = newPlanKey === "none"
        ? { plan: "none", subscription: null, hasChosenPlan: false }
        : { subscription: { planKey: newPlanKey, status: "active", id: `manual_${Date.now()}` }, hasChosenPlan: true, plan: newPlanKey };
      await updateDoc(doc(db, "users", brandId), updateData);
      setBrands(brands.map(b => b.id === brandId ? { ...b, plan: newPlanKey } : b));
      toast.success(`Plan actualizado a ${AVAILABLE_PLANS.find(p => p.id === newPlanKey)?.name || newPlanKey}`);
    } catch { toast.error("Error al actualizar plan"); }
  };

  const handleChangeStatus = async (brandId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", brandId), { status: newStatus });
      setBrands(brands.map(b => b.id === brandId ? { ...b, status: newStatus as any } : b));
      toast.success("Estado actualizado");
    } catch { toast.error("Error al actualizar estado"); }
  };

  const handleViewDetails = (brand: Brand) => { setSelectedBrand(brand); setIsDetailsOpen(true); };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <MobileNav type="admin" />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-w-0 pb-20 md:pb-8">
        <DashboardHeader title="Marcas" subtitle="Gestiona las cuentas de marcas registradas" />

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Cargando marcas...</p>
          </div>
        ) : (
          <>
            {/* ── Control bar ── */}
            <div className="mb-6 space-y-3">
              {/* Row 1: status tabs + add button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all" as const, label: "Todas", count: brands.length },
                    { key: "active" as const, label: "Activas", count: brands.filter(b => b.status === "active").length },
                    { key: "pending" as const, label: "Pendientes", count: brands.filter(b => b.status === "pending").length },
                    { key: "inactive" as const, label: "Inactivas", count: brands.filter(b => b.status === "inactive").length },
                  ].map(tab => (
                    <Button
                      key={tab.key}
                      variant={statusFilter === tab.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(tab.key)}
                      className="gap-1.5 h-8"
                    >
                      {tab.label}
                      <Badge variant="secondary" className={`ml-0.5 h-5 px-1.5 text-[11px] ${statusFilter === tab.key ? "bg-white/20 text-white" : ""}`}>
                        {tab.count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="sm" className="h-8 gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Nueva Marca
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Nueva Marca</DialogTitle>
                      <DialogDescription>Crea una nueva cuenta de marca en la plataforma</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="brand-name">Nombre de la Marca</Label>
                        <Input id="brand-name" placeholder="ej. Sunrise Cafe" value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="brand-email">Email</Label>
                        <Input id="brand-email" type="email" placeholder="hola@marca.com" value={newBrand.email} onChange={e => setNewBrand({ ...newBrand, email: e.target.value })} className="mt-2" />
                      </div>
                      <div>
                        <Label>Plan</Label>
                        <Select value={newBrand.plan} onValueChange={value => setNewBrand({ ...newBrand, plan: value })}>
                          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>{AVAILABLE_PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                      <Button variant="hero" onClick={handleAddBrand}>Agregar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Row 2: search + date + sort + count */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
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
                    <SelectItem value="oldest">Más antiguas</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground ml-auto">
                  {filteredBrands.length} de {brands.length} marcas
                </span>
              </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Marca</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Registro</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Plan</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Créditos</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Onboarding</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Estado</th>
                      <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Camps.</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map(brand => (
                      <tr key={brand.id} className="border-t border-border hover:bg-muted/30 transition-colors group">
                        {/* Marca */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                              {brand.avatar
                                ? <img src={brand.avatar} alt={brand.name} className="w-full h-full object-cover" />
                                : <Building2 className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-sm truncate max-w-[160px] block" title={brand.name}>{brand.name}</span>
                              {brand.industry && <span className="text-xs text-muted-foreground truncate max-w-[160px] block">{brand.industry}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Registro */}
                        <td className="p-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{brand.joined}</span>
                        </td>

                        {/* Email */}
                        <td className="p-3 text-xs text-muted-foreground max-w-[180px] truncate" title={brand.email}>{brand.email}</td>

                        {/* Plan */}
                        <td className="p-3">
                          <Select value={brand.plan} onValueChange={value => handleChangePlan(brand.id, value)}>
                            <SelectTrigger className="w-28 h-7 text-xs font-semibold border-0 bg-primary/10 text-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              {!AVAILABLE_PLANS.find(p => p.id === brand.plan) && brand.plan && (
                                <SelectItem value={brand.plan}>{brand.plan}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Créditos */}
                        <td className="p-3">
                          <span className={`text-sm font-semibold ${brand.credits > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {brand.credits}
                          </span>
                        </td>

                        {/* Onboarding */}
                        <td className="p-3">
                          {brand.onboardingCompleted
                            ? <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">✓ Completo</span>
                            : brand.onboardingStep
                              ? <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">Paso {brand.onboardingStep}</span>
                              : <span className="text-xs text-muted-foreground">—</span>
                          }
                        </td>

                        {/* Estado */}
                        <td className="p-3">
                          <Select value={brand.status} onValueChange={(value: "active" | "pending" | "inactive") => handleChangeStatus(brand.id, value)}>
                            <SelectTrigger className={`w-28 h-7 text-xs font-semibold capitalize border-0 ${statusColors[brand.status] || "bg-muted"}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Activa</SelectItem>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="inactive">Inactiva</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Campañas */}
                        <td className="p-3 text-center">
                          <span className={`text-sm font-medium ${brand.campaigns > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                            {brand.campaigns}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="Ver detalles" onClick={() => handleViewDetails(brand)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-500/10 text-muted-foreground hover:text-orange-500" title="Editar" onClick={() => { setSelectedBrand(brand); setIsEditOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Eliminar" onClick={() => handleDeleteBrand(brand)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredBrands.length === 0 && (
                <div className="p-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No se encontraron marcas</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "Intenta ajustar tu búsqueda" : "Agrega tu primera marca para comenzar"}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Marca</DialogTitle>
              <DialogDescription>Actualiza la información de la marca</DialogDescription>
            </DialogHeader>
            {selectedBrand && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" value={selectedBrand.name} onChange={e => setSelectedBrand({ ...selectedBrand, name: e.target.value })} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={selectedBrand.email} onChange={e => setSelectedBrand({ ...selectedBrand, email: e.target.value })} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="edit-credits">Créditos</Label>
                  <Input id="edit-credits" type="number" min="0" value={selectedBrand.credits} onChange={e => setSelectedBrand({ ...selectedBrand, credits: parseFloat(e.target.value) || 0 })} className="mt-2" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={selectedBrand.plan} onValueChange={value => setSelectedBrand({ ...selectedBrand, plan: value })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>{AVAILABLE_PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button variant="hero" onClick={handleEditBrand}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BrandDetailsDialog brand={selectedBrand} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      </main>
    </div>
  );
}