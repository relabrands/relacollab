import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreatorCard } from "@/components/dashboard/CreatorCard";
import { MatchDetailsDialog } from "@/components/brand/MatchDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Filter, SlidersHorizontal, Loader2, Plus, Users, UserCheck, CheckCircle, FileText } from "lucide-react";
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";
import { calculateMatchScore } from "@/lib/matchScoring";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ContractTemplate } from "@/components/contracts/ContractTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};


import { usePlanLimits } from "@/hooks/usePlanLimits";

export default function BrandMatches() {
  const { user } = useAuth();
  const { limits } = usePlanLimits();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]); // All active campaigns

  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [permanentRejectedIds, setPermanentRejectedIds] = useState<string[]>([]);

  // Applicants State

  const [applicants, setApplicants] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [completedCreators, setCompletedCreators] = useState<any[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>("instagram");
  const [allApplications, setAllApplications] = useState<any[]>([]); // Debugging state
  const [viewMode, setViewMode] = useState<'matches' | 'invited' | 'applicants' | 'collaborating' | 'completed' | 'discarded'>('matches');

  // Dialog State
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  // 1. Fetch Campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;
      try {
        const campaignQuery = query(
          collection(db, "campaigns"),
          where("brandId", "==", user.uid),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );
        const campaignSnapshot = await getDocs(campaignQuery);
        const fetchedCampaigns = campaignSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCampaigns(fetchedCampaigns);

        // Set initial active campaign
        if (fetchedCampaigns.length > 0) {
          if (campaignId) {
            const found = fetchedCampaigns.find(c => c.id === campaignId);
            setActiveCampaign(found || fetchedCampaigns[0]);
          } else {
            setActiveCampaign(fetchedCampaigns[0]);
          }
        } else {
          setLoading(false); // No campaigns, stop loading
        }
      } catch (error) {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  // 2. Fetch Matches & Apps when Active Campaign Changes
  useEffect(() => {
    const fetchMatchesAndApps = async () => {
      if (!user || !activeCampaign) return;
      setLoading(true);

      try {
        // Update URL
        setSearchParams({ campaignId: activeCampaign.id });

        // Invitations (Outbound)
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("campaignId", "==", activeCampaign.id)
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const allInvitations = invitationsSnapshot.docs.map(doc => doc.data());
        const invitedCreatorIds = allInvitations.filter(inv => inv.status !== 'discarded').map(inv => inv.creatorId);
        const permDiscardedIds = allInvitations.filter(inv => inv.status === 'discarded').map(inv => inv.creatorId);

        setApprovedIds(invitedCreatorIds);
        setPermanentRejectedIds(permDiscardedIds);

        // Submissions (Content)
        const submissionsQuery = query(
          collection(db, "content_submissions"),
          where("campaignId", "==", activeCampaign.id),
          orderBy("submittedAt", "desc")
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs.map(d => d.data());

        // Applications (Inbound & Collaborating)
        const applicationsQuery = query(
          collection(db, "applications"),
          where("campaignId", "==", activeCampaign.id)
        );
        const appsSnapshot = await getDocs(applicationsQuery);

        // Check invitations too
        const invQuery = query(
          collection(db, "invitations"),
          where("campaignId", "==", activeCampaign.id)
        );
        const invSnap = await getDocs(invQuery);


        // Enrich Application Data with Creator Profile
        const applicationPromises = appsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          const creatorDoc = await getDoc(doc(db, "users", appData.creatorId));
          if (creatorDoc.exists()) {
            const creatorData = creatorDoc.data();
            const { score, reasons, breakdown } = calculateMatchScore(activeCampaign, creatorData);

            // ── Fetch existing AI analysis from the matches subcollection ──
            let aiAnalysis: any = null;
            if (limits.aiMatchEnabled) {
              try {
                const matchRef = doc(db, "campaigns", activeCampaign.id, "matches", appDoc.id.includes(appData.creatorId) ? appData.creatorId : appData.creatorId);
                const matchSnap = await getDoc(matchRef);
                if (matchSnap.exists()) {
                  const mData = matchSnap.data();
                  if (mData.aiAnalysis?.matchPercentage !== undefined) {
                    aiAnalysis = mData.aiAnalysis;
                  }
                }
              } catch (e) {
                // AI analysis not available – fall back to calculated score
              }
            }

            // Find submission for this creator
            const submission = submissions.find((s: any) => s.userId === creatorData.id || s.userId === appData.creatorId);

            return {
              ...creatorData,
              id: creatorDoc.id, // Creator ID
              applicationId: appDoc.id, // Application Ref
              matchScore: score,
              displayScore: aiAnalysis?.matchPercentage ?? score,
              aiAnalysis,
              matchReason: appData.status === 'approved' || appData.status === 'accepted' ? "Colaboración Activa" : "Aplicó a tu campaña",
              matchBreakdown: breakdown,
              name: creatorData.displayName || "Creador Desconocido",
              avatar: creatorData.photoURL || creatorData.avatar,
              tags: creatorData.categories || creatorData.tags || ["General"],
              status: appData.status, // 'pending', 'approved', 'rejected'
              followers: formatNumber(creatorData.instagramMetrics?.followers || creatorData.tiktokMetrics?.followers || 0),
              engagement: (creatorData.instagramMetrics?.engagementRate || creatorData.tiktokMetrics?.engagementRate || 0) + "%",
              instagramMetrics: creatorData.instagramMetrics,
              instagramAudienceDemographics: creatorData.instagramAudienceDemographics || null,
              location: creatorData.location || "Desconocido",
              averageRating: creatorData.averageRating,
              reviewCount: creatorData.reviewCount,
              submissionUrl: submission?.postUrl || null,
              submissionStatus: submission?.status || null
            };
          }
          return null;
        });

        const allApplications = (await Promise.all(applicationPromises)).filter(Boolean);
        setAllApplications(allApplications);

        // Filter into buckets
        setApplicants(allApplications.filter((a: any) => a.status === 'pending'));
        setCollaborators(allApplications.filter((a: any) => (a.status === 'approved' || a.status === 'accepted') && a.submissionStatus !== 'approved'));
        setCompletedCreators(allApplications.filter((a: any) => (a.status === 'approved' || a.status === 'accepted') && a.submissionStatus === 'approved'));

        // DEBUG LOGS



        // 2. Fetch All Creators (for Matches view)
        const creatorsQuery = query(collection(db, "users"), where("role", "==", "creator"));
        const creatorsSnapshot = await getDocs(creatorsQuery);

        const validCreators = creatorsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // Must have a display name
          .filter((c: any) => c.displayName)
          // Must be active (admin-controlled status)
          .filter((c: any) => c.status === 'active')
          // Must have at least 1 connected social account
          .filter((c: any) => c.instagramConnected === true || c.tiktokConnected === true)
          // Respect privacy: skip creators who explicitly set publicProfile to false
          .filter((c: any) => c.privacySettings?.publicProfile !== false);


        // 3. Match Logic
        let matchedCreators = validCreators.map((creator: any) => {
          const { score, reasons, breakdown } = calculateMatchScore(activeCampaign, creator);

          let matchReason = reasons.join(" • ");
          if (!matchReason) matchReason = "Match basado en disponibilidad";

          return {
            ...creator,
            name: creator.displayName || "Unnamed Creator",
            avatar: creator.photoURL || creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
            matchScore: score,
            matchReason: matchReason,
            matchBreakdown: breakdown,
            tags: creator.categories || creator.tags || ["General"],
            followers: formatNumber(creator.instagramMetrics?.followers || creator.tiktokMetrics?.followers || 0),
            engagement: (creator.instagramMetrics?.engagementRate || creator.tiktokMetrics?.engagementRate || 0) + "%",
            instagramMetrics: creator.instagramMetrics,
            instagramAudienceDemographics: creator.instagramAudienceDemographics || null,
            tiktokMetrics: creator.tiktokMetrics,
            tiktokUsername: creator.socialHandles?.tiktok,
            instagramUsername: creator.instagramUsername || creator.socialHandles?.instagram,
            location: creator.location || "Desconocido",
            averageRating: creator.averageRating,
            reviewCount: creator.reviewCount,
            showMetrics: creator.privacySettings?.showMetrics !== false, // default show unless explicitly false
            aiAnalysis: null as any,
          };
        })
          .filter(c => c.matchScore >= 20) // Broad pre-filter to limit AI fetches
          .sort((a, b) => b.matchScore - a.matchScore);

        // 4. Pre-fetch existing AI analysis from Firestore matches subcollection
        const aiMap: Record<string, any> = {};
        if (limits.aiMatchEnabled) {
          const aiPromises = matchedCreators.map(async (creator: any) => {
            try {
              const matchRef = doc(db, "campaigns", activeCampaign.id, "matches", creator.id);
              const matchSnap = await getDoc(matchRef);
              if (matchSnap.exists()) {
                const matchData = matchSnap.data();
                if (matchData.aiAnalysis?.matchPercentage !== undefined) {
                  return { id: creator.id, aiAnalysis: matchData.aiAnalysis };
                }
              }
            } catch (_) { /* Ignore individual fetch errors */ }
            return { id: creator.id, aiAnalysis: null };
          });

          const aiResults = await Promise.all(aiPromises);
          aiResults.forEach(r => { if (r.aiAnalysis) aiMap[r.id] = r.aiAnalysis; });
        }

        // Merge AI data, re-sort by AI score
        matchedCreators = matchedCreators.map((c: any) => ({
          ...c,
          aiAnalysis: aiMap[c.id] || null,
          // displayScore = AI % if available, otherwise rule-based score
          displayScore: aiMap[c.id]?.matchPercentage ?? c.matchScore,
        })).sort((a: any, b: any) => b.displayScore - a.displayScore);

        // Enforce maxMonthlyApplications limit visually for applicants
        let finalApplications = allApplications;
        if (limits.maxMonthlyApplications !== -1) {
            finalApplications = finalApplications.slice(0, limits.maxMonthlyApplications);
        }
        setApplicants(finalApplications.filter((a: any) => a.status === 'pending'));

        // Enforce maxMatchesPerCampaign limit
        if (limits.maxMatchesPerCampaign !== -1) {
            matchedCreators = matchedCreators.slice(0, limits.maxMatchesPerCampaign);
        }

        setCreators(matchedCreators);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesAndApps();
  }, [activeCampaign]);

  const handleSendProposal = async (id: string, creatorName: string) => {
    if (!activeCampaign || !user) return;
    if (approvedIds.includes(id)) {
      toast.info(`Ya se envió una propuesta a ${creatorName}`);
      return;
    }

    try {
      await addDoc(collection(db, "invitations"), {
        campaignId: activeCampaign.id,
        brandId: user.uid,
        creatorId: id,
        status: "pending",
        createdAt: new Date().toISOString(),
        campaignData: {
          title: activeCampaign.name || "Campaña Sin Título",
          brandName: activeCampaign.brandName || "Marca",
          image: activeCampaign.images?.[0] || "",
          budget: activeCampaign.budget || "Negociable"
        }
      });
      setApprovedIds((prev) => [...prev, id]);
      toast.success(`¡Propuesta enviada a ${creatorName}!`);
    } catch (error) {
      toast.error("Error al enviar la propuesta.");
    }
  };

  const handleApproveApplicant = async (creator: any) => {
    try {
      // Update application status
      await updateDoc(doc(db, "applications", creator.applicationId), {
        status: "approved",
        approvedAt: new Date().toISOString()
      });

      // Increment approvedCount on campaign
      if (activeCampaign?.id) {
        await updateDoc(doc(db, "campaigns", activeCampaign.id), {
          approvedCount: increment(1)
        });
      }

      toast.success(`¡Aprobado ${creator.name}!`, {
        description: "La campaña ahora está activa para ellos."
      });

      // Remove from list locally
      setApplicants(prev => prev.filter(a => a.id !== creator.id));
    } catch (error) {
      toast.error("Error al aprobar al solicitante");
    }
  };

  const handleReject = async (creator: any, isPermanent?: boolean) => {
    if (isPermanent) {
      if (!activeCampaign || !user) return;
      try {
        await addDoc(collection(db, "invitations"), {
          campaignId: activeCampaign.id,
          brandId: user.uid,
          creatorId: creator.id,
          status: "discarded",
          createdAt: new Date().toISOString()
        });
        setPermanentRejectedIds((prev) => [...prev, creator.id]);
        toast.info("Creador descartado permanentemente", {
          description: `${creator.name} no volverá a aparecer en esta campaña.`
        });
      } catch (error) {
        toast.error("Error al descartar al creador.");
      }
    } else {
      setRejectedIds((prev) => [...prev, creator.id]);
      toast.info("Creador descartado temporalmente", {
        description: `${creator.name} ha sido movido a la pestaña de Descartados.`
      });
    }
  };

  const handleRejectApplicant = async (creator: any) => {
    // Add confirmation
    if (!confirm(`¿Estás seguro de que deseas rechazar la solicitud de ${creator.name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, "applications", creator.applicationId), {
        status: "rejected"
      });
      setApplicants(prev => prev.filter(a => a.id !== creator.id));

      toast.info("Solicitud rechazada", {
        description: `${creator.name} ha sido movido a la pestaña de Descartados.`
      });

      // Also track locally so they appear in discarded
      setRejectedIds((prev) => [...prev, creator.id]);
    } catch (error) {
      toast.error("Error al rechazar la solicitud. Por favor, inténtalo de nuevo.");
    }
  };

  const visibleCreators = viewMode === 'collaborating'
    ? collaborators
    : viewMode === 'completed'
      ? completedCreators
      : viewMode === 'applicants'
        ? applicants
        : creators.filter((c) => {
          if (viewMode === 'discarded') {
            return c.displayScore < 50 || rejectedIds.includes(c.id) || permanentRejectedIds.includes(c.id);
          } else if (viewMode === 'matches') {
            return c.displayScore >= 50 && !approvedIds.includes(c.id) && !rejectedIds.includes(c.id) && !permanentRejectedIds.includes(c.id) && !applicants.find(a => a.id === c.id) && !collaborators.find(col => col.id === c.id) && !completedCreators.find(col => col.id === c.id);
          } else { // invited
            return approvedIds.includes(c.id) && !collaborators.find(col => col.id === c.id) && !completedCreators.find(col => col.id === c.id);
          }
        });

  const handleCardClick = (creator: any) => {
    setSelectedCreator(creator);
    setIsDialogOpen(true);
  };

  const handleViewContent = (creator: any) => {
    if (creator.submissionUrl) {
      window.open(creator.submissionUrl, "_blank");
    } else {
      toast.info("Contenido aún no enviado", {
        description: "Este creador aún no ha enviado el enlace de su contenido."
      });
    }
  };

  if (loading && campaigns.length === 0) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <DashboardHeader
              title={
                viewMode === 'matches' ? "Tus Matches" :
                  viewMode === 'applicants' ? "Solicitantes" : "Creadores Invitados"
              }
              subtitle={
                viewMode === 'matches' ? "Creadores que encajan perfectamente con tus campañas" :
                  viewMode === 'applicants' ? "Creadores que quieren trabajar contigo" : "Creadores a los que has enviado propuestas"
              }
            />

            {/* Campaign Selector */}
            {campaigns.length > 0 && (
              <div className="w-full md:w-64 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Buscando Matches Para:
                </Label>
                <Select
                  value={activeCampaign?.id}
                  onValueChange={(val) => {
                    const found = campaigns.find(c => c.id === val);
                    if (found) setActiveCampaign(found);
                  }}
                >
                  <SelectTrigger className="w-full bg-background border-input">
                    <SelectValue placeholder="Selecciona una Campaña" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              {viewMode === 'applicants' ? (
                <Users className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {viewMode === 'applicants' ? "Estado de Solicitudes" : "Resumen de Match con IA"}
              </h3>
              {activeCampaign ? (
                <p className="text-muted-foreground">
                  {viewMode === 'applicants'
                    ? `Tienes ${applicants.length} solicitudes pendientes por revisar para ${activeCampaign.name}.`
                    : `Encontramos ${creators.length} posibles matches para ${activeCampaign.name}.`
                  }
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No se encontró ninguna campaña activa. <Link to="/brand/campaigns/new" className="text-primary hover:underline">Crear una campaña</Link> para obtener mejores matches.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs / Filters */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === 'matches' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('matches')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Matches
            </Button>
            <Button
              variant={viewMode === 'applicants' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('applicants')}
              className="relative"
            >
              <Users className="w-4 h-4 mr-2" />
              Solicitantes
              {applicants.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {applicants.length}
                </span>
              )}
            </Button>
            <Button
              variant={viewMode === 'collaborating' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('collaborating')}
            >
              <Users className="w-4 h-4 mr-2" />
              Colaborando ({collaborators.length})
            </Button>
            <Button
              variant={viewMode === 'completed' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('completed')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completadas ({completedCreators.length})
            </Button>
            <Button
              variant={viewMode === 'invited' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('invited')}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Invitados ({approvedIds.filter(id => !collaborators.some(c => c.id === id) && !completedCreators.some(c => c.id === id)).length})
            </Button>
            <Button
              variant={viewMode === 'discarded' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('discarded')}
              className={viewMode === 'discarded' ? "" : "text-muted-foreground hover:text-foreground"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              Descartados
            </Button>
          </div>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCampaign ? visibleCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCardClick(creator)}
              className="cursor-pointer"
            >
              <CreatorCard
                creator={creator}
                // Determine actions based on view mode
                onApprove={async (id) => {
                  if (viewMode === 'applicants') {
                    await handleApproveApplicant(creator);
                  } else if (viewMode === 'matches' || viewMode === 'discarded') {
                    await handleSendProposal(id, creator.name);
                  } else if (viewMode === 'collaborating') {
                    handleViewContent(creator);
                  }
                }}
                onReject={(id, isPermanent) => {
                  if (viewMode === 'applicants') {
                    handleRejectApplicant(creator);
                  } else {
                    handleReject(creator, isPermanent);
                  }
                }}
                hideActions={viewMode === 'invited' || viewMode === 'collaborating'} // Only hide for invited/collaborating
                isInvite={viewMode === 'matches' || viewMode === 'discarded'}
                isApplicant={viewMode === 'applicants'} // Pass this prop to modify card button text
                isCollaborating={viewMode === 'collaborating'}
                campaignId={activeCampaign?.id}
                creatorId={creator.id}
              />
              {/* Ver Contrato — only in collaborating mode */}
              {viewMode === 'collaborating' && (
                <div className="mt-2 px-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={async () => {
                      if (!user || !activeCampaign) return;
                      setLoadingContract(true);
                      setContractOpen(true);
                      try {
                        const cq = query(
                          collection(db, "contracts"),
                          where("campaignId", "==", activeCampaign.id),
                          where("creatorId", "==", creator.id)
                        );
                        const snap = await getDocs(cq);
                        if (!snap.empty) {
                          const data = snap.docs[0].data();
                          setSelectedContract({ ...data, contractId: snap.docs[0].id });
                        } else {
                          // Fallback from live data
                          setSelectedContract({
                            contractId: "—",
                            status: "active",
                            signedByCreatorAt: creator.approvedAt || new Date().toISOString(),
                            campaign: {
                              title: activeCampaign.title || activeCampaign.name || "",
                              description: activeCampaign.description || "",
                              deliverables: activeCampaign.deliverables || [],
                              compensationType: activeCampaign.compensationType || "exchange",
                              creatorPayment: activeCampaign.creatorPayment || activeCampaign.budget || 0,
                              exchangeDetails: activeCampaign.exchangeDetails || "",
                              deadline: activeCampaign.deadline || activeCampaign.endDate || "",
                              location: activeCampaign.location || "",
                            },
                            brand: {
                              displayName: activeCampaign.brandName || user.displayName || "Marca",
                              email: user.email || "",
                            },
                            creator: {
                              displayName: creator.name || creator.displayName || "Creador",
                              email: creator.email || "",
                              instagram: creator.instagram || "",
                            },
                          });
                        }
                      } catch {
                        setSelectedContract(null);
                      } finally {
                        setLoadingContract(false);
                      }
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver Contrato
                  </Button>
                </div>
              )}
            </motion.div>
          )) : (
            <div className="col-span-3 text-center py-20">
              <p className="text-muted-foreground">Selecciona una campaña para ver los matches.</p>
            </div>
          )}
        </div>

        {/* Empty States */}
        {activeCampaign && visibleCreators.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {viewMode === 'applicants' ? "Aún no hay solicitudes pendientes" :
                viewMode === 'matches' ? "No se encontraron creadores compatibles" :
                  viewMode === 'collaborating' ? "No hay colaboraciones activas" :
                    viewMode === 'completed' ? "No hay colaboraciones completadas" :
                      "No hay creadores invitados"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {viewMode === 'applicants'
                ? "Los creadores aparecerán aquí cuando descubran y soliciten unirse a tu campaña. Comparte tu campaña para atraer más solicitantes."
                : viewMode === 'matches'
                  ? "No pudimos encontrar creadores que coincidan con los criterios de tu campaña. Intenta ampliar tus requisitos o vuelve más tarde, ya que se unen nuevos creadores a diario."
                  : viewMode === 'collaborating'
                    ? "Una vez que apruebes a los solicitantes o los creadores acepten las invitaciones, aparecerán aquí."
                    : viewMode === 'completed'
                      ? "Cuando se apruebe el contenido de un creador, se moverá a esta pestaña."
                      : "Los creadores que invites aparecerán aquí. Explora la pestaña Matches para encontrar e invitar creadores."}
            </p>

            {viewMode === 'matches' && (
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-left">
                <p className="font-medium mb-2">💡 Consejos para obtener más matches:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Ajusta las preferencias de ubicación</li>
                  <li>• Revisa las vibras y categorías de la campaña</li>
                  <li>• Asegúrate de que el presupuesto sea competitivo</li>
                  <li>• Haz que la descripción de la campaña sea atractiva</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {!activeCampaign && campaigns.length === 0 && (
          <div className="text-center py-20">
            <Link to="/brand/campaigns/new">
              <Button variant="hero">Crear Campaña</Button>
            </Link>
          </div>
        )}
      </main>

      {selectedCreator && (
        <MatchDetailsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          creator={selectedCreator}
          campaign={activeCampaign}
          isApplicant={viewMode === 'applicants'} // Pass context to dialog
          isCollaborating={viewMode === 'collaborating' || viewMode === 'completed'}
          limits={limits}
          onApprove={() => {
            if (viewMode === 'applicants') {
              handleApproveApplicant(selectedCreator);
            } else if (viewMode === 'collaborating' || viewMode === 'completed') {
              handleViewContent(selectedCreator);
            } else {
              handleSendProposal(selectedCreator.id, selectedCreator.name);
            }
            setIsDialogOpen(false);
          }}
        />
      )}

      {/* Contract Dialog — Brand side */}
      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contrato de Colaboración
            </DialogTitle>
          </DialogHeader>
          {loadingContract ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedContract ? (
            <ContractTemplate contract={selectedContract} showDownload={true} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No se encontró el contrato para esta colaboración.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}