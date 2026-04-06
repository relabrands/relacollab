import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { Button } from "@/components/ui/button";
import { Inbox, DollarSign, TrendingUp, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCardClick = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setIsDialogOpen(true);
  };
  const [stats, setStats] = useState<{
    title: string;
    value: string | number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: any;
    iconColor: "primary" | "accent" | "success";
  }[]>([
    {
      title: "Nuevas Oportunidades",
      value: 0,
      change: "0 hoy",
      changeType: "neutral",
      icon: Inbox,
      iconColor: "primary",
    },
    {
      title: "Campañas Activas",
      value: 0,
      change: "En progreso",
      changeType: "neutral",
      icon: CheckCircle,
      iconColor: "accent",
    },
    {
      title: "Score de Match Prom.",
      value: "0%",
      change: "+0%",
      changeType: "neutral",
      icon: TrendingUp,
      iconColor: "success",
    },
    {
      title: "Este Mes",
      value: "$0",
      change: "Pendiente: $0",
      changeType: "neutral",
      icon: DollarSign,
      iconColor: "primary",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch creator profile data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Calculate Profile Completion
        let completion = 0;

        // Basic Info (25%)
        if (userData.displayName || userData.name) completion += 5;
        if (userData.bio) completion += 10;
        if (userData.location) completion += 5;
        if (userData.phone) completion += 5;

        // Visuals (15%)
        if (userData.photoURL) completion += 15;

        // Professional Details (60%)
        if (userData.categories?.length > 0) completion += 10;
        if (userData.contentFormats?.length > 0) completion += 10;
        if (userData.vibes?.length > 0) completion += 10;
        if (userData.whoAppearsInContent?.length > 0) completion += 10;
        if (userData.experienceTime) completion += 10;
        if (userData.collaborationPreference) completion += 10;

        setProfileCompletion(completion);

        // 2. Fetch all creator's applications to filter them out
        const applicationsQuery = query(
          collection(db, "applications"),
          where("creatorId", "==", user.uid)
        );
        const applicationsSnap = await getDocs(applicationsQuery);
        const appliedCampaignIds = applicationsSnap.docs.map(doc => doc.data().campaignId);

        // Count active campaigns (approved applications) by verifying campaign existence
        const approvedApps = applicationsSnap.docs.filter(
          doc => doc.data().status === "approved"
        );

        const activePromises = approvedApps.map(async (appDoc) => {
          try {
            const campaignDoc = await getDoc(doc(db, "campaigns", appDoc.data().campaignId));
            return campaignDoc.exists();
          } catch (e) {
            return false;
          }
        });

        const activeResults = await Promise.all(activePromises);
        const activeCount = activeResults.filter(Boolean).length;

        // 2.5 Fetch Invitations
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("creatorId", "==", user.uid),
          where("status", "==", "pending")
        );
        const invSnapshot = await getDocs(invitationsQuery);
        const invitationsMap: Record<string, string> = {};
        invSnapshot.docs.forEach(doc => {
          invitationsMap[doc.data().campaignId] = doc.id;
        });

        // 3. Fetch ALL active campaigns
        const campaignsQuery = query(
          collection(db, "campaigns"),
          where("status", "==", "active")
        );
        const campaignsSnap = await getDocs(campaignsQuery);

        // 4. Filter out campaigns already applied to and calculate match scores
        const { calculateMatchScore } = await import("@/lib/matchScoring");

        const matchedOpportunities = [];
        for (const campaignDoc of campaignsSnap.docs) {
          const campaignId = campaignDoc.id;

          // Skip if already applied
          if (appliedCampaignIds.includes(campaignId)) continue;

          const campaignData = campaignDoc.data();
          
          // Verify campaign is valid (skip empty/test dummy campaigns)
          if (!campaignData.name || (!campaignData.brandName && !campaignData.brandId)) continue;

          // Calculate real match score
          const matchResult = calculateMatchScore(campaignData, userData);
          const isInvited = !!invitationsMap[campaignId];

          // Only include campaigns with score > 0 (passed compensation filter) or if invited
          if (matchResult.score > 0 || isInvited) {
            matchedOpportunities.push({
              id: campaignId,
              title: campaignData.name || "Campaña sin título",
              ...campaignData,
              matchScore: matchResult.score,
              matchBreakdown: matchResult.breakdown,
              isInvited: isInvited,
              invitationId: invitationsMap[campaignId] || undefined
            });
          }
        }

        // Sort by invitations first, then match score, and get top 4
        matchedOpportunities.sort((a, b) => {
          if (a.isInvited && !b.isInvited) return -1;
          if (!a.isInvited && b.isInvited) return 1;
          return b.matchScore - a.matchScore;
        });
        const topOpportunities = matchedOpportunities.slice(0, 4);

        setOpportunities(topOpportunities);

        // Calculate average match score
        const avgMatchScore = topOpportunities.length > 0
          ? Math.round(topOpportunities.reduce((sum, opp) => sum + opp.matchScore, 0) / topOpportunities.length)
          : 0;

        // 5. Fetch Earnings
        const paymentsRef = collection(db, "users", user.uid, "payments");
        const paymentsSnap = await getDocs(paymentsRef);

        let totalEarned = 0;
        let pendingEarnings = 0;

        paymentsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'completed') {
            totalEarned += data.amount || 0;
          } else if (data.status === 'pending') {
            pendingEarnings += data.amount || 0;
          }
        });

        // Update stats
        setStats(prev => [
          { ...prev[0], value: matchedOpportunities.length, change: `${topOpportunities.length} mejores matches` },
          { ...prev[1], value: activeCount, change: activeCount > 0 ? "En progreso" : "Sin campañas activas" },
          { ...prev[2], value: `${avgMatchScore}%`, change: avgMatchScore >= 70 ? "¡Excelente match!" : "Encuentra tu match" },
          { ...prev[3], value: `$${totalEarned.toLocaleString()}`, change: `Pendiente: $${pendingEarnings.toLocaleString()}` }
        ]);

      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApply = async (campaignId: string) => {
    if (!user || processingId) return;

    // Find campaign details
    const campaign = opportunities.find(op => op.id === campaignId);
    if (!campaign) return;

    setProcessingId(campaignId);

    try {
      const isInvitation = campaign.isInvited;
      const invitationId = campaign.invitationId;

      await addDoc(collection(db, "applications"), {
        campaignId: campaignId,
        creatorId: user.uid,
        brandId: campaign.brandId,
        status: isInvitation ? "approved" : "pending",
        isInvitation: !!isInvitation,
        createdAt: new Date().toISOString(),
        campaignData: {
          title: campaign.title,
          name: campaign.name || campaign.title,
          image: campaign.images?.[0] || ""
        },
        creatorData: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          avatar: user.photoURL
        }
      });

      // Increment applicationCount on campaign (for non-invited applications)
      if (!isInvitation) {
        await updateDoc(doc(db, "campaigns", campaignId), {
          applicationCount: increment(1)
        });
      }

      if (isInvitation && invitationId) {
        await updateDoc(doc(db, "invitations", invitationId), {
          status: "accepted"
        });

        // Also increment approvedCount for accepted invitations
        await updateDoc(doc(db, "campaigns", campaignId), {
          approvedCount: increment(1)
        });
      }

      // ====== CREATE CONTRACT IN FIRESTORE ======
      try {
        await addDoc(collection(db, "contracts"), {
          campaignId: campaignId,
          creatorId: user.uid,
          brandId: campaign.brandId,
          status: isInvitation ? "active" : "pending",
          signedByCreatorAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          campaign: {
            title: campaign.title || campaign.name || "",
            description: campaign.description || "",
            deliverables: campaign.deliverables || [],
            compensationType: campaign.compensationType || campaign.rewardType || "exchange",
            creatorPayment: campaign.creatorPayment || campaign.budget || 0,
            exchangeDetails: campaign.exchangeDetails || "",
            deadline: campaign.deadline || campaign.endDate || "",
            location: campaign.location || "",
          },
          brand: {
            displayName: campaign.brandName || campaign.brandProfile?.displayName || "Marca",
            email: campaign.brandProfile?.email || "",
            logo: campaign.brandLogo || "",
          },
          creator: {
            displayName: user.displayName || user.email || "Creador",
            email: user.email || "",
            avatar: user.photoURL || "",
          },
        });
      } catch (_contractError) {
        // Contract creation failed silently — don't block the application
      }

      toast.success(campaign.isInvited ? "¡Invitación Aceptada!" : "¡Solicitud Enviada!", {
        description: campaign.isInvited ? "Contrato firmado. Ahora estás colaborando en esta campaña." : "La marca ha sido notificada. Tu contrato se activará al ser aprobado.",
      });

      // Optimistically update UI
      setOpportunities(prev => prev.filter(p => p.id !== campaignId));
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error", {
        description: "Por favor intenta de nuevo en un momento."
      });
    } finally {
      setProcessingId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="creator" />
      <MobileNav type="creator" />

      <main className="flex-1 min-w-0 w-full ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden">
        <DashboardHeader
          title={`Bienvenido de nuevo, ${user?.displayName || 'Creador'}`}
          subtitle="Aquí están tus oportunidades personalizadas"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Top Opportunities */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Mejores Matches para Ti</h2>
          <Link to="/creator/opportunities">
            <Button variant="ghost">
              Ver Todas
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full overflow-hidden mb-8">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="w-full relative">
                 <OpportunityCard 
                   opportunity={opportunity} 
                   onAccept={(id) => handleApply(id)}
                   onViewDetails={() => handleCardClick(opportunity)} 
                 />
                 {processingId === opportunity.id && (
                   <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-20 w-full h-full">
                     <Loader2 className="animate-spin" />
                   </div>
                 )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-lg bg-white mb-8">
            <p className="text-muted-foreground">No se encontraron oportunidades activas en este momento.</p>
          </div>
        )}

        {/* Profile Completion */}
        {profileCompletion < 100 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Completa tu Perfil</h3>
                <p className="text-muted-foreground text-sm">
                  Un perfil completo nos ayuda a encontrar mejores matches para ti
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{profileCompletion}%</div>
                  <div className="text-sm text-muted-foreground">Completado</div>
                </div>
                <Link to="/creator/profile">
                  <Button variant="hero">
                    Completar Perfil
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        )}
      </main>
      
      <OpportunityDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        opportunity={selectedOpportunity}
        onAccept={() => selectedOpportunity && handleApply(selectedOpportunity.id)}
      />
    </div>
  );
}