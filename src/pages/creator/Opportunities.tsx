import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, Sparkles, Loader2, Clock } from "lucide-react";
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { calculateMatchScore } from "@/lib/matchScoring";


export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'experience' | 'pending'>('all');

  // Dialog State
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Track applied campaign IDs to hide them or show as applied
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<Set<string>>(new Set());

  // Pending applications
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;
      try {
        // 0. Fetch existing applications to exclude/mark them
        const appsQuery = query(collection(db, "applications"), where("creatorId", "==", user.uid));
        const appsSnapshot = await getDocs(appsQuery);
        const appliedIds = new Set(appsSnapshot.docs.map(doc => doc.data().campaignId));
        setAppliedCampaignIds(appliedIds);

        // 0.5 Fetch Current Creator Profile for Matching
        let creatorProfile = {};
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          creatorProfile = userDocSnap.data();
        }


        // 1. Fetch Invitations for this user
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("creatorId", "==", user.uid),
          where("status", "==", "pending")
        );
        const invSnapshot = await getDocs(invitationsQuery);

        const invitationsPromises = invSnapshot.docs.map(async (invDoc) => {
          const invData = invDoc.data();
          const campaignDocRef = doc(db, "campaigns", invData.campaignId);
          const campaignSnap = await getDoc(campaignDocRef);

          if (campaignSnap.exists()) {
            const campaignData = campaignSnap.data();

            // Fetch Brand Details
            let brandData: any = {};
            try {
              const brandDoc = await getDoc(doc(db, "users", campaignData.brandId));
              if (brandDoc.exists()) {
                brandData = brandDoc.data();
              }
            } catch (e) {
              console.error("Error fetching brand details for invite", e);
            }

            const { score } = calculateMatchScore(campaignData, creatorProfile);

            return {
              id: invData.campaignId,
              invitationId: invDoc.id,
              ...campaignData,
              brandName: campaignData.brandName || brandData.displayName || "Unknown Brand",
              title: campaignData.name || "Untitled Campaign",
              isInvited: true,
              matchScore: score,
              rewardType: campaignData.reward === 'paid' ? 'paid' : (campaignData.reward === 'experience' ? 'experience' : 'hybrid'),
              brandProfile: brandData
            };
          }
          return null;
        });

        const resolvedInvitations = (await Promise.all(invitationsPromises)).filter(Boolean);
        const invitedCampaignIds = new Set(resolvedInvitations.map((op: any) => op.id));

        // 2. Fetch Regular Active Campaigns
        const q = query(
          collection(db, "campaigns"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const generalOpportunities = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // Fetch Brand Details
          let brandData: any = {};
          try {
            const brandDoc = await getDoc(doc(db, "users", data.brandId));
            if (brandDoc.exists()) {
              brandData = brandDoc.data();
            }
          } catch (e) {
            console.error("Error fetching brand details for opportunity", e);
          }

          const { score } = calculateMatchScore(data, creatorProfile);

          return {
            id: docSnap.id,
            ...data,
            brandName: data.brandName || brandData.displayName || "Unknown Brand",
            title: data.name,
            matchScore: score,
            isInvited: false,
            rewardType: data.reward === 'paid' ? 'paid' : (data.reward === 'experience' ? 'experience' : 'hybrid'),
            brandProfile: brandData
          };
        }));

        // Filter invitations that might have corresponding applications (redundancy check)
        const filteredInvitations = resolvedInvitations.filter((op: any) => !appliedIds.has(op.id));

        // For general opportunities: also check Firestore for existing AI score
        const generalWithAiScore = await Promise.all(
          generalOpportunities
            .filter(op => !invitedCampaignIds.has(op.id))
            .filter(op => !appliedIds.has(op.id))
            .map(async (op: any) => {
              let effectiveScore = op.matchScore; // start with rule-based
              try {
                const matchRef = doc(db, "campaigns", op.id, "matches", user.uid);
                const matchSnap = await getDoc(matchRef);
                if (matchSnap.exists()) {
                  const aiPct = matchSnap.data()?.aiAnalysis?.matchPercentage;
                  if (typeof aiPct === "number") effectiveScore = aiPct;
                }
              } catch (_) { /* fallback to rule-based */ }
              return { ...op, effectiveScore };
            })
        );

        // ✅ Gate: use best available score (AI first, rule-based fallback) — must be ≥50%
        const filteredGeneral = generalWithAiScore.filter(op => op.effectiveScore >= 50);

        setOpportunities([...filteredInvitations, ...filteredGeneral]);

        // Fetch pending applications for "Pending" tab
        const pendingAppsQuery = query(
          collection(db, "applications"),
          where("creatorId", "==", user.uid),
          where("status", "==", "pending")
        );
        const pendingSnapshot = await getDocs(pendingAppsQuery);

        const pendingAppsPromises = pendingSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          const campaignRef = doc(db, "campaigns", appData.campaignId);
          const campaignSnap = await getDoc(campaignRef);

          if (campaignSnap.exists()) {
            const campaignData = campaignSnap.data();

            // Fetch Brand Details
            let brandData: any = {};
            try {
              const brandDoc = await getDoc(doc(db, "users", campaignData.brandId));
              if (brandDoc.exists()) {
                brandData = brandDoc.data();
              }
            } catch (e) {
              console.error("Error fetching brand details for pending app", e);
            }

            return {
              id: campaignSnap.id,
              applicationId: appDoc.id,
              ...campaignData,
              brandName: campaignData.brandName || brandData.displayName || "Unknown Brand",
              title: campaignData.name || "Untitled Campaign",
              appliedAt: appData.createdAt,
              rewardType: campaignData.reward === 'paid' ? 'paid' : (campaignData.reward === 'experience' ? 'experience' : 'hybrid'),
              brandProfile: brandData,
              isPending: true
            };
          }
          return null;
        });

        const resolvedPendingApps = (await Promise.all(pendingAppsPromises)).filter(Boolean);
        setPendingApplications(resolvedPendingApps);

      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
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
        createdAt: new Date().toISOString(),
        campaignData: {
          title: campaign.title,
          name: campaign.name,
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

      toast.success(campaign.isInvited ? "Invitation Accepted!" : "Application Sent!", {
        description: campaign.isInvited ? "You are now collaborating on this campaign." : "The brand has been notified of your interest.",
      });

      // Update local state to remove from list
      setOpportunities(prev => prev.filter(op => op.id !== campaignId));
      setAppliedCampaignIds(prev => new Set(prev).add(campaignId));
      setIsDialogOpen(false);

    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Failed to submit application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCardClick = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setIsDialogOpen(true);
  };

  const filteredOpportunities = opportunities.filter(op => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return op.rewardType === 'paid' || op.rewardType === 'hybrid';
    if (activeTab === 'experience') return op.rewardType === 'experience' || op.rewardType === 'hybrid';
    return true;
  });

  const displayItems = activeTab === 'pending' ? pendingApplications : filteredOpportunities;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="creator" />
      <MobileNav type="creator" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title="Opportunities"
          subtitle="Campaigns matched to your profile and style"
        />

        {/* AI Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Personalized Matches</h3>
              <p className="text-muted-foreground">
                These opportunities are curated based on your content style, engagement quality, and audience demographics.
                Higher match scores mean better alignment with brand requirements.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            <Button
              variant={activeTab === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="whitespace-nowrap"
            >
              All ({opportunities.length})
            </Button>
            <Button
              variant={activeTab === 'paid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('paid')}
              className="whitespace-nowrap"
            >
              Paid Only
            </Button>
            <Button
              variant={activeTab === 'experience' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('experience')}
              className="whitespace-nowrap"
            >
              Experience
            </Button>
            <Button
              variant={activeTab === 'pending' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className="whitespace-nowrap relative"
            >
              Pending
              {pendingApplications.length > 0 && (
                <span className="ml-1 bg-warning text-warning-foreground text-xs px-1.5 rounded-full">
                  {pendingApplications.length}
                </span>
              )}
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Opportunities Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : displayItems.length > 0 ? (
          <div>
            {activeTab === 'pending' && (
              <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning-foreground">
                  <strong>⏳ Awaiting Brand Approval:</strong> These are campaigns you've applied to. The brand will review your profile and notify you of their decision.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayItems.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCardClick(opportunity)}
                  className="cursor-pointer"
                >
                  <div className="relative">
                    <OpportunityCard
                      opportunity={opportunity}
                      onAccept={(id) => handleApply(id)}
                    />
                    {/* Block interaction if applying */}
                    {processingId === opportunity.id && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-10">
                        <Loader2 className="animate-spin" />
                      </div>
                    )}
                    {opportunity.isPending && (
                      <div className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Approval
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl bg-white/5">
            <p className="text-muted-foreground">
              {activeTab === 'pending'
                ? "No pending applications. Apply to campaigns to see them here!"
                : "No active opportunities found at the moment."}
            </p>
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