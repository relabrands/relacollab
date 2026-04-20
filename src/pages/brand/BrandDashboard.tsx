import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { Button } from "@/components/ui/button";
import { FileText, Users, TrendingUp, DollarSign, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionGateModal } from "@/components/brand/SubscriptionGateModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrandDashboard() {
  const { user } = useAuth();
  const { plan, isActive, loading: subLoading } = useSubscription();
  // La modal se abre si terminó de cargar y no hay suscripción activa
  const [gateOpen, setGateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brandProfiles, setBrandProfiles] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all");
  const [stats, setStats] = useState<{
    title: string;
    value: string | number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: any;
    iconColor: "primary" | "accent" | "success";
  }[]>([
    {
      title: "Campañas",
      value: 0,
      change: "Total: 0",
      changeType: "neutral",
      icon: FileText,
      iconColor: "primary",
    },
    {
      title: "Creadores Matcheados",
      value: 0,
      change: "0 esta semana",
      changeType: "neutral",
      icon: Users,
      iconColor: "accent",
    },
    {
      title: "Inversión Total",
      value: "$0",
      change: "Histórico",
      changeType: "neutral",
      icon: DollarSign,
      iconColor: "primary",
    },
  ]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch brand profiles
        const brandsQ = query(collection(db, "brand_profiles"), where("ownerId", "==", user.uid));
        const brandsSnap = await getDocs(brandsQ);
        const profiles: any[] = [];
        brandsSnap.forEach(b => profiles.push({ id: b.id, ...b.data() }));
        setBrandProfiles(profiles);

        // Fetch ALL Campaigns for accurate total counts
        const allCampaignsQuery = query(
          collection(db, "campaigns"),
          where("brandId", "==", user.uid)
        );
        const allCampaignsSnapshot = await getDocs(allCampaignsQuery);
        let allCampaigns = allCampaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Filter by selected brand if any
        if (selectedBrandId && selectedBrandId !== "all") {
            allCampaigns = allCampaigns.filter(c => c.brandProfileId === selectedBrandId || (!c.brandProfileId && profiles.length > 0 && profiles[0].id === selectedBrandId));
        }

        // Calculate Stats
        const activeCount = allCampaigns.filter(c => c.status === 'active').length;
        const totalCount = allCampaigns.length;

        // Fetch Payouts to calculate Total Investment
        const payoutsQuery = query(
          collection(db, "payouts"),
          where("brandId", "==", user.uid)
        );
        const payoutsSnapshot = await getDocs(payoutsQuery);
        let payouts = payoutsSnapshot.docs.map(doc => doc.data() as any);
        
        if (selectedBrandId && selectedBrandId !== "all") {
            const campaignIdsSet = new Set(allCampaigns.map(c => c.id));
            payouts = payouts.filter(p => campaignIdsSet.has(p.campaignId));
        }

        const totalInvestment = payouts.reduce((acc, data) => {
          return acc + (data.grossAmount || 0);
        }, 0);

        setRecentCampaigns(allCampaigns.sort((a: any, b: any) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ).slice(0, 5));

        // Fetch all applications for this brand's campaigns
        const campaignIds = allCampaigns.map(c => c.id);
        let totalMatched = 0;

        if (campaignIds.length > 0) {
          // Fetch applications for all campaigns (chunking because of Firestore 'in' limit of 30)
          const chunks = [];
          for (let i = 0; i < campaignIds.length; i += 10) {
            chunks.push(campaignIds.slice(i, i + 10));
          }

          const appsPromises = chunks.map(chunk => 
            getDocs(query(collection(db, "applications"), where("campaignId", "in", chunk)))
          );
          
          const appsSnapshots = await Promise.all(appsPromises);
          let allApps: any[] = [];
          appsSnapshots.forEach(snap => {
            allApps = [...allApps, ...snap.docs.map(d => d.data())];
          });

          // Count approved/collaborating creators
          totalMatched = allApps.filter(data => {
            const status = data.status;
            return status === "approved" || status === "active" || status === "collaborating";
          }).length;
        }

        setStats(prev => [
          { 
            ...prev[0], 
            value: activeCount, 
            change: `Total: ${totalCount}`,
            changeType: "neutral" 
          },
          { 
            ...prev[1], 
            value: totalMatched, 
            change: `${totalMatched} esta semana`, 
            changeType: totalMatched > 0 ? "positive" : "neutral" 
          },
          { 
            ...prev[2], 
            value: `$${totalInvestment.toLocaleString()}`,
            change: "Dinero invertido",
            changeType: "positive"
          }
        ]);

      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, selectedBrandId]);

  // Abre el gate solo si terminó de cargar y NO tiene suscripción activa.
  // Si ya tiene plan activo, cierra el gate automáticamente.
  useEffect(() => {
    if (subLoading) return;
    setGateOpen(!isActive);
  }, [subLoading, isActive]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title={`Bienvenido de nuevo, ${user?.displayName || 'Marca'}`}
          subtitle="Esto es lo que está pasando con tus campañas"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Campañas Recientes</h2>
              {brandProfiles.length > 0 && (
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {brandProfiles.map((bp) => (
                      <SelectItem key={bp.id} value={bp.id}>{bp.brandName || "Sin Nombre"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
          </div>
          <Link to="/brand/campaigns/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Crear Campaña
            </Button>
          </Link>
        </div>

        {/* Campaigns Grid */}
        {recentCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-muted-foreground mb-4">Aún no hay campañas.</p>
            <Link to="/brand/campaigns/new">
              <Button variant="outline">Crea tu primera campaña</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Gate de suscripción — no dismissible hasta elegir un plan */}
      <SubscriptionGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        dismissible={false}
      />
    </div>
  );
}