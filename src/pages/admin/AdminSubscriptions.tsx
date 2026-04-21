import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import {
  Edit,
  Plus,
  CreditCard,
  Trash2,
  Zap,
  Copy,
  Archive,
  RotateCcw,
  Shield,
  Gift,
  SlidersHorizontal,
  Infinity as InfinityIcon,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, doc, query, onSnapshot, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_LIMITS, type PlanLimits } from "@/hooks/usePlanLimits";

const PLAN_KEYS = ["starter", "growth", "pro"] as const;
type PlanKey = typeof PLAN_KEYS[number];

const PLAN_LABELS: Record<PlanKey, { label: string; price: string; color: string }> = {
  starter: { label: "Starter", price: "Gratis", color: "#6b7280" },
  growth:  { label: "Growth",  price: "$89/mes", color: "#534AB7" },
  pro:     { label: "Pro",     price: "$249/mes", color: "#0F6E56" },
};

const NUMERIC_LIMITS: { key: keyof PlanLimits; label: string; hint: string }[] = [
  { key: "maxBrands",              label: "Marcas permitidas",         hint: "-1 = ilimitado" },
  { key: "maxActiveCampaigns",     label: "Campañas activas",          hint: "-1 = ilimitado" },
  { key: "maxTotalCampaigns",      label: "Campañas totales",          hint: "-1 = ilimitado" },
  { key: "maxMatchesPerCampaign",  label: "Matches por campaña",       hint: "-1 = ilimitado" },
  { key: "maxMonthlyApplications", label: "Aplicaciones / mes",        hint: "-1 = ilimitado" },
];

const BOOLEAN_LIMITS: { key: keyof PlanLimits; label: string }[] = [
  { key: "aiMatchEnabled",          label: "IA Match habilitado" },
  { key: "analyticsEnabled",        label: "Analytics avanzado" },
  { key: "contentLibraryEnabled",   label: "Content Library" },
  { key: "exportEnabled",           label: "Exportar datos (CSV/PDF)" },
  { key: "prioritySupportEnabled",  label: "Soporte prioritario" },
  { key: "teamMembersEnabled",      label: "Invitar miembros del equipo" },
];

export default function AdminSubscriptions() {
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({ starter: 0, growth: 0, pro: 0 });
  const [loading, setLoading] = useState(true);

  // Plan Limits state
  const [limitsData, setLimitsData] = useState<Record<PlanKey, PlanLimits>>(
    DEFAULT_LIMITS as Record<PlanKey, PlanLimits>
  );
  const [savingLimits, setSavingLimits] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    fetchActiveCounts();
    // Suscribe a cambios en planLimits en tiempo real
    const unsubs = PLAN_KEYS.map((key) =>
      onSnapshot(doc(db, "planLimits", key), (snap) => {
        if (snap.exists()) {
          setLimitsData((prev) => ({ ...prev, [key]: snap.data() as PlanLimits }));
        }
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const fetchActiveCounts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "brand"));
      const snapshot = await getDocs(q);
      
      const counts: Record<string, number> = { starter: 0, growth: 0, pro: 0 };
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const subscription = data.subscription;
        
        let plan = "starter";
        if (subscription && subscription.status === "active") {
          plan = subscription.planKey || "starter";
        } else if (data.hasChosenPlan) {
          plan = "starter";
        } else {
          plan = data.plan || "starter";
        }
        
        if (counts[plan] !== undefined) {
          counts[plan]++;
        } else {
          counts["starter"]++; // default fallback
        }
      });
      
      setActiveCounts(counts);
    } catch (error) {
      toast.error("Failed to load active counts");
    } finally {
      setLoading(false);
    }
  };

  // ─── Guardar límites ────────────────────────────────────────────────────────
  const handleSaveLimits = async (planKey: PlanKey) => {
    setSavingLimits(true);
    try {
      await setDoc(doc(db, "planLimits", planKey), limitsData[planKey]);
      toast.success(`Límites de ${PLAN_LABELS[planKey].label} guardados`);
    } catch {
      toast.error("Error al guardar límites");
    } finally {
      setSavingLimits(false);
    }
  };

  const updateNumericLimit = (planKey: PlanKey, field: keyof PlanLimits, value: number) => {
    setLimitsData((prev) => ({
      ...prev,
      [planKey]: { ...prev[planKey], [field]: value },
    }));
  };

  const updateBooleanLimit = (planKey: PlanKey, field: keyof PlanLimits, value: boolean) => {
    setLimitsData((prev) => ({
      ...prev,
      [planKey]: { ...prev[planKey], [field]: value },
    }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Plan & Pricing Configuration"
          subtitle="Manage platform tiers, credit allocations, permissions, and plan limits."
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="mb-8">
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="w-4 h-4" /> Planes
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Límites por Plan
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: Planes ── */}
          <TabsContent value="plans">
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2">Planes Actuales (Polar)</h2>
              <p className="text-muted-foreground">La gestión de pagos y suscripciones está automatizada a través de Polar. Aquí puedes ver el volumen de marcas activas por cada tier.</p>
            </div>

            {loading ? (
              <div className="text-center py-12">Cargando conteos de planes...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {PLAN_KEYS.map((planKey, index) => {
                  const meta = PLAN_LABELS[planKey];
                  const limit = limitsData[planKey];
                  const count = activeCounts[planKey] || 0;
                  return (
                    <motion.div
                      key={planKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card relative overflow-hidden flex flex-col"
                      style={{ borderTop: `4px solid ${meta.color}` }}
                    >
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-2xl font-bold" style={{ color: meta.color }}>{meta.label}</h3>
                          <Badge variant="secondary" className="bg-primary/5">{meta.price}</Badge>
                        </div>

                        <div className="bg-muted/30 rounded-xl p-6 text-center mb-6">
                          <div className="text-5xl font-black">{count}</div>
                          <div className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wider">Marcas Activas</div>
                        </div>

                        <div className="space-y-3 mt-auto">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Límites Principales</Label>
                          <div className="flex justify-between items-center text-sm border-b pb-2">
                            <span className="text-muted-foreground">Campañas Totales</span>
                            <span className="font-semibold">{limit?.maxTotalCampaigns === -1 ? 'Ilimitado' : limit?.maxTotalCampaigns}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b pb-2">
                            <span className="text-muted-foreground">Matches por Campaña</span>
                            <span className="font-semibold">{limit?.maxMatchesPerCampaign === -1 ? 'Ilimitado' : limit?.maxMatchesPerCampaign}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Aplicaciones/Mes</span>
                            <span className="font-semibold">{limit?.maxMonthlyApplications === -1 ? 'Ilimitado' : limit?.maxMonthlyApplications}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── TAB: Límites ── */}
          <TabsContent value="limits">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {PLAN_KEYS.map((planKey) => {
                const meta = PLAN_LABELS[planKey];
                const limits = limitsData[planKey];
                return (
                  <Card key={planKey} className="border-2" style={{ borderColor: `${meta.color}33` }}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{meta.label}</CardTitle>
                          <CardDescription>{meta.price}</CardDescription>
                        </div>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${meta.color}22` }}
                        >
                          <SlidersHorizontal className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Límites numéricos */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Límites numéricos</p>
                        {NUMERIC_LIMITS.map(({ key, label, hint }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs flex justify-between">
                              <span>{label}</span>
                              <span className="text-muted-foreground">{hint}</span>
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={-1}
                                value={(limits[key] as number)}
                                onChange={(e) =>
                                  updateNumericLimit(planKey, key, parseInt(e.target.value) || -1)
                                }
                                className="pr-10 h-9 text-sm"
                              />
                              {(limits[key] as number) === -1 && (
                                <InfinityIcon
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Funciones booleanas */}
                      <div className="space-y-3 border-t pt-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Funcionalidades</p>
                        {BOOLEAN_LIMITS.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm font-normal cursor-pointer">{label}</Label>
                            <Switch
                              checked={limits[key] as boolean}
                              onCheckedChange={(val) => updateBooleanLimit(planKey, key, val)}
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full gap-2 text-white"
                        style={{ background: meta.color }}
                        disabled={savingLimits}
                        onClick={() => handleSaveLimits(planKey)}
                      >
                        <Save className="w-3.5 h-3.5" />
                        Guardar {meta.label}
                      </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
  );
}