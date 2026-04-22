import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { Button } from "@/components/ui/button";
import { Inbox, DollarSign, TrendingUp, CheckCircle, ArrowRight, Loader2, AlertTriangle, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { ProfileCompleteBanner } from "@/components/creator/ProfileCompleteBanner";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [igTokenExpired, setIgTokenExpired] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [missingOptionalFields, setMissingOptionalFields] = useState<string[]>([]);
  const [showMissingDetails, setShowMissingDetails] = useState(false);

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
      title: "Ganancias Totales",
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

        // ── Instagram token expired flag ──
        if (userData.instagramTokenExpired === true) {
          setIgTokenExpired(true);
        }

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

        // Detect missing fields for banner
        const missing: string[] = [];
        if (!userData.bio)                         missing.push("📝 Biografía");
        if (!userData.location)                    missing.push("📍 Ubicación");
        if (!userData.phone)                       missing.push("📞 Teléfono");
        if (!userData.photoURL)                    missing.push("🧑 Foto de perfil");
        if (!userData.categories?.length)          missing.push("🏷️ Categorías de contenido");
        if (!userData.contentFormats?.length)      missing.push("🎥 Formatos de contenido");
        if (!userData.vibes?.length)               missing.push("✨ Estilo / Vibe");
        if (!userData.whoAppearsInContent?.length) missing.push("👥 Quién aparece en el contenido");
        if (!userData.experienceTime)              missing.push("📅 Tiempo de experiencia");
        if (!userData.collaborationPreference)     missing.push("🤝 Preferencia de colaboración");
        if (!userData.instagramConnected && !userData.tiktokConnected)
                                                   missing.push("📱 Red social conectada (Instagram o TikTok)");
        if (!userData.shippingAddress?.street)     missing.push("📦 Logística de Envíos (Dirección)");
        setMissingFields(missing);

        // Optional fields (not scored)
        const optional: string[] = [];
        setMissingOptionalFields(optional);

        // 2. Fetch all creator's applications to filter them out
        const applicationsQuery = query(
          collection(db, "applications"),
          where("creatorId", "==", user.uid)
        );
        const applicationsSnap = await getDocs(applicationsQuery);
        const appliedCampaignIds = applicationsSnap.docs.map(doc => doc.data().campaignId);

        // Count active campaigns (approved applications) by verifying campaign existence and completion status
        const approvedApps = applicationsSnap.docs.filter(
          doc => doc.data().status === "approved"
        );

        let activeCount = 0;
        const activePromises = approvedApps.map(async (appDoc) => {
          try {
            const campaignId = appDoc.data().campaignId;
            const campaignDoc = await getDoc(doc(db, "campaigns", campaignId));
            
            if (campaignDoc.exists()) {
              const campaignData = campaignDoc.data();
              
              // Check completion status (synchronized with ActiveCampaigns.tsx)
              const submissionsQuery = query(
                collection(db, "content_submissions"),
                where("campaignId", "==", campaignId),
                where("creatorId", "==", user.uid)
              );
              const submissionsSnap = await getDocs(submissionsQuery);
              const submissions = submissionsSnap.docs.map(d => d.data());
              
              const slotsMap = new Map();
              submissions.forEach(s => {
                const slotId = `${s.deliverableType}_${s.deliverableNumber}`;
                if (!slotsMap.has(slotId) || (s.updatedAt || s.createdAt) > (slotsMap.get(slotId).updatedAt || slotsMap.get(slotId).createdAt)) {
                  slotsMap.set(slotId, s);
                }
              });
              
              const latestSubmissions = Array.from(slotsMap.values());
              const deliverables = campaignData.deliverables || [];
              const totalRequired = deliverables
                .filter((d: any) => d.required)
                .reduce((sum: number, d: any) => sum + (Number(d.quantity) || 1), 0);
              
              const totalApproved = latestSubmissions.filter(s => s.status === "approved").length;
              
              // logic from ActiveCampaigns.tsx: 
              // completed if totalApproved >= totalRequired AND totalRequired > 0
              const isCompleted = totalRequired > 0 && totalApproved >= totalRequired;

              if (!isCompleted) {
                return true;
              }
            }
            return false;
          } catch (e) {
            console.error("Error checking campaign completion:", e);
            return false;
          }
        });

        const activeResults = await Promise.all(activePromises);
        activeCount = activeResults.filter(Boolean).length;
        const totalCount = approvedApps.length;

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

          let effectiveScore = matchResult.score;
          try {
            const matchRef = doc(db, "campaigns", campaignId, "matches", user.uid);
            const matchSnap = await getDoc(matchRef);
            if (matchSnap.exists()) {
              const aiPct = matchSnap.data()?.aiAnalysis?.matchPercentage;
              if (typeof aiPct === "number") effectiveScore = aiPct;
            }
          } catch (_) { /* fallback to rule-based */ }

          // Only include campaigns with score >= 50 or if invited
          if (effectiveScore >= 50 || isInvited) {
            matchedOpportunities.push({
              id: campaignId,
              title: campaignData.name || "Campaña sin título",
              ...campaignData,
              matchScore: effectiveScore, // use effectiveScore here for display
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

        // 5. Fetch Earnings (Historical Totals from payouts collection)
        const payoutsQuery = query(
          collection(db, "payouts"),
          where("creatorId", "==", user.uid)
        );
        const payoutsSnap = await getDocs(payoutsQuery);

        let totalEarned = 0;
        let pendingEarnings = 0;

        payoutsSnap.docs.forEach((payoutDoc) => {
          const data = payoutDoc.data();
          const amount = Number(data.netAmount || data.amount || 0);
          
          if (data.status === 'paid') {
            totalEarned += amount;
          } else if (['pending', 'ready_to_withdraw', 'requested'].includes(data.status)) {
            pendingEarnings += amount;
          }
        });

        // Update stats
        setStats(prev => [
          { ...prev[0], value: matchedOpportunities.length, change: `${topOpportunities.length} mejores matches` },
          { ...prev[1], value: activeCount, change: `Historial: ${totalCount} campañas` },
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

        {/* Instagram Token Expired Banner */}
        {igTokenExpired && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Tu conexión de Instagram expiró</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
                Las marcas no pueden ver tus publicaciones recientes. Reconecta tu cuenta para mejorar tus matches.
              </p>
            </div>
            <Link to="/creator/profile">
              <Button size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-none gap-1.5">
                <Instagram className="w-3.5 h-3.5" />
                Reconectar
              </Button>
            </Link>
          </div>
        )}

        {/* Profile Incomplete Banner */}
        <ProfileCompleteBanner
          completion={profileCompletion}
          missingFields={missingFields}
          optionalFields={missingOptionalFields}
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