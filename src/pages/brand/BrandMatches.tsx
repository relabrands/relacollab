import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreatorCard } from "@/components/dashboard/CreatorCard";
import { MatchDetailsDialog } from "@/components/brand/MatchDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Filter, SlidersHorizontal, Loader2, Plus } from "lucide-react";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";

// ...

export default function BrandMatches() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  // Dialog State
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ...

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 0. Fetch Brand Profile (New)
        let brandProfile: any = null;
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          brandProfile = userDocSnap.data();
        }

        // 1. Fetch Active Campaign
        let campaign: any = null;

        if (campaignId) {
          // Fetch specific campaign if ID provided
          const docRef = doc(db, "campaigns", campaignId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            campaign = { id: docSnap.id, ...docSnap.data() };
            setActiveCampaign(campaign);
          }
        } else {
          // Default: Fetch latest active
          const campaignQuery = query(
            collection(db, "campaigns"),
            where("brandId", "==", user.uid),
            where("status", "==", "active"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const campaignSnapshot = await getDocs(campaignQuery);

          if (!campaignSnapshot.empty) {
            campaign = { id: campaignSnapshot.docs[0].id, ...campaignSnapshot.docs[0].data() };
            setActiveCampaign(campaign);
          }
        }

        // 1.5 Fetch Existing Invitations for this Campaign
        if (campaign) {
          const invitationsQuery = query(
            collection(db, "invitations"),
            where("campaignId", "==", campaign.id)
          );
          const invitationsSnapshot = await getDocs(invitationsQuery);
          const invitedCreatorIds = invitationsSnapshot.docs.map(doc => doc.data().creatorId);
          setApprovedIds(invitedCreatorIds);
        }

        // 2. Fetch All Creators
        // In a real app with many users, this should be a backend function or more specific query
        const creatorsQuery = query(collection(db, "users"), where("role", "==", "creator"));
        const creatorsSnapshot = await getDocs(creatorsQuery);

        const validCreators = creatorsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => {
            // MUST have Instagram connected and complete profile
            return c.instagramConnected && c.displayName;
          });

        // 3. Match Logic
        // 3. Match Logic
        let matchedCreators = [];

        if (campaign) {
          matchedCreators = validCreators.map((creator: any) => {
            let score = 0;
            const reasons: string[] = [];
            const analysisPoints: string[] = [];
            const creatorCategories = creator.categories || [];
            const campaignVibes = campaign.vibes || [];

            // A. Campaign Location (Crucial)
            if (campaign.location) {
              const campaignLoc = campaign.location.toLowerCase();
              const creatorLoc = (creator.location || "").toLowerCase();

              if (creatorLoc.includes(campaignLoc) || campaignLoc === "global" || campaignLoc === "any") {
                score += 30;
                reasons.push("Location");
                analysisPoints.push(`Located in ${creator.location || "target area"} matching campaign requirement.`);
              }
            } else {
              // If no location specified, treat as global/neutral
              score += 15;
            }

            // B. Campaign Niche/Vibe (Crucial)
            const matchedVibes = campaignVibes.filter((v: string) =>
              creatorCategories.some((c: string) =>
                c.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(c.toLowerCase())
              )
            );

            if (matchedVibes.length > 0) {
              score += 40;
              reasons.push("Niche");
              analysisPoints.push(`Creates content in ${matchedVibes.join(", ")} which fits the campaign vibe.`);
            } else if (creatorCategories.length > 0) {
              // Soft match
              const allTags = creatorCategories.join(" ").toLowerCase();
              const campaignName = (campaign.name + " " + (campaign.description || "")).toLowerCase();
              if (creatorCategories.some((c: string) => campaignName.includes(c.toLowerCase()))) {
                score += 20;
                analysisPoints.push(`Content style (${creatorCategories[0]}) is relevant to campaign description.`);
              }
            }

            // C. Brand Fit (Bonus)
            if (brandProfile?.industry) {
              const brandInd = brandProfile.industry.toLowerCase();
              if (creatorCategories.some((c: string) => c.toLowerCase().includes(brandInd))) {
                score += 15;
                if (!reasons.includes("Niche")) {
                  analysisPoints.push(`Matches your brand industry (${brandProfile.industry}).`);
                }
              }
            }

            // D. Engagement Quality (Bonus)
            const engagementRate = creator.instagramMetrics?.engagementRate || 0;
            if (engagementRate >= 2) {
              score += 15;
              analysisPoints.push(`High engagement rate (${engagementRate}%).`);
            }

            // E. Past Performance / Reliability (Future)
            // if (creator.completedJobs > 5) score += 10;

            // Cap Score
            if (score > 98) score = 98;
            // Minimum score to show: 50
            // If Location matches (+30) and Engagement (+15) = 45 -> Needs a little more niche fit.

            // Build Reason
            let matchReason = "";
            if (analysisPoints.length > 0) {
              matchReason = analysisPoints.join(" ");
            } else {
              matchReason = "Matched based on general availability.";
            }

            return {
              ...creator,
              name: creator.displayName || "Unnamed Creator",
              avatar: creator.photoURL || creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
              location: creator.location || "Unknown",
              followers: creator.instagramMetrics?.followers
                ? (creator.instagramMetrics.followers > 1000
                  ? `${(creator.instagramMetrics.followers / 1000).toFixed(1)}K`
                  : creator.instagramMetrics.followers)
                : "0",
              engagement: `${engagementRate}%`,
              matchScore: score,
              tags: creator.categories || ["General"],
              rawEngagement: engagementRate,
              instagramUsername: creator.instagramUsername,
              bio: creator.bio,
              matchReason: matchReason, // Pass this to the card
              campaignName: campaign.name || "Unknown Campaign"
            };
          })
            .filter(c => c.matchScore >= 45) // Strict filter
            .sort((a, b) => b.matchScore - a.matchScore);
        } else {
          // No campaign = No matches
          matchedCreators = [];
        }

        setCreators(matchedCreators);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const [viewMode, setViewMode] = useState<'matches' | 'invited'>('matches');

  // ... (existing code)

  const handleSendProposal = async (id: string, creatorName: string) => {
    if (!activeCampaign || !user) {
      if (!activeCampaign) console.error("No active campaign found");
      return;
    }

    if (approvedIds.includes(id)) {
      toast.info(`Already sent a proposal to ${creatorName}`);
      return;
    }

    try {
      // 1. Create Invitation Document
      await addDoc(collection(db, "invitations"), {
        campaignId: activeCampaign.id,
        brandId: user.uid,
        creatorId: id,
        status: "pending",
        createdAt: new Date().toISOString(),
        campaignData: {
          title: activeCampaign.name || "Untitled Campaign",
          brandName: activeCampaign.brandName || "Brand",
          image: activeCampaign.images?.[0] || "",
          budget: activeCampaign.budget || "Negotiable"
        }
      });

      // 2. Update Local State
      setApprovedIds((prev) => [...prev, id]);

      toast.success(`Proposal sent to ${creatorName}!`, {
        description: "They will see this in their opportunities.",
      });
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Failed to send proposal. Check console for details.");
    }
  };

  // ...

  const handleReject = (id: string) => {
    setRejectedIds((prev) => [...prev, id]);
  };

  const handleCardClick = (creator: any) => {
    setSelectedCreator(creator);
    setIsDialogOpen(true);
  };

  const visibleCreators = creators.filter((c) => {
    if (viewMode === 'matches') {
      return !approvedIds.includes(c.id) && !rejectedIds.includes(c.id);
    } else {
      // 'invited' mode
      return approvedIds.includes(c.id);
    }
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader
            title={viewMode === 'matches' ? "Your Matches" : "Invited Creators"}
            subtitle={viewMode === 'matches' ? "Creators that perfectly fit your campaigns" : "Creators you have sent proposals to"}
          />
        </div>

        {/* AI Summary */}
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
              <h3 className="font-semibold text-lg mb-2">AI Match Summary</h3>
              {activeCampaign ? (
                <p className="text-muted-foreground">
                  We found <span className="font-semibold text-primary">{creators.length} potential matches</span> based on your campaign criteria.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No active campaign found. <Link to="/brand/campaigns/new" className="text-primary hover:underline">Create a campaign</Link> to get better matches.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === 'matches' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('matches')}
            >
              <Filter className="w-4 h-4 mr-2" />
              New Matches
            </Button>
            <Button
              variant={viewMode === 'invited' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('invited')}
            >
              Invited ({approvedIds.length})
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCardClick(creator)} // Add click handler
              className="cursor-pointer"
            >
              <CreatorCard
                creator={creator}
                onApprove={(id) => {
                  handleSendProposal(id, creator.name);
                }}
                onReject={handleReject}
                isInvite={viewMode === 'matches'} // Only show send button in matches view
                hideActions={viewMode === 'invited'} // Hide actions in invited view
              />
            </motion.div>
          ))}
        </div>

        {activeCampaign && visibleCreators.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No new matches found!</h3>
            <p className="text-muted-foreground">
              {creators.length > 0 ? "You've reviewed all current matches." : "Try adjusting your campaign criteria or wait for more creators."}
            </p>
          </div>
        )}

        {!activeCampaign && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start your first Campaign</h3>
            <Link to="/brand/campaigns/new">
              <Button variant="hero" className="mt-4">Create Campaign</Button>
            </Link>
          </div>
        )}
      </main>

      {selectedCreator && (
        <MatchDetailsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          creator={selectedCreator}
          campaign={activeCampaign} // Pass campaign context
        />
      )}
    </div>
  );
}