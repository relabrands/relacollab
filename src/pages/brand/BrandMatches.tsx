import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreatorCard } from "@/components/dashboard/CreatorCard";
import { MatchDetailsDialog } from "@/components/brand/MatchDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Filter, SlidersHorizontal, Loader2, Plus, Users, UserCheck } from "lucide-react";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";
import { calculateMatchScore } from "@/lib/matchScoring";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};


export default function BrandMatches() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]); // All active campaigns

  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  // Applicants State

  const [applicants, setApplicants] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'matches' | 'invited' | 'applicants' | 'collaborating'>('matches');

  // Dialog State
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        console.error("Error fetching campaigns:", error);
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
        const invitedCreatorIds = invitationsSnapshot.docs.map(doc => doc.data().creatorId);
        setApprovedIds(invitedCreatorIds);

        // Submissions (Content)
        const submissionsQuery = query(
          collection(db, "submissions"),
          where("campaignId", "==", activeCampaign.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs.map(d => d.data());

        // Applications (Inbound & Collaborating)
        const applicationsQuery = query(
          collection(db, "applications"),
          where("campaignId", "==", activeCampaign.id)
        );
        const appsSnapshot = await getDocs(applicationsQuery);

        // Enrich Application Data with Creator Profile
        const applicationPromises = appsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          const creatorDoc = await getDoc(doc(db, "users", appData.creatorId));
          if (creatorDoc.exists()) {
            const creatorData = creatorDoc.data();
            const { score, reasons, breakdown } = calculateMatchScore(activeCampaign, creatorData);

            // Find submission for this creator
            const submission = submissions.find((s: any) => s.userId === creatorData.id || s.userId === appData.creatorId);

            return {
              ...creatorData,
              id: creatorDoc.id, // Creator ID
              applicationId: appDoc.id, // Application Ref
              matchScore: score,
              matchReason: "Applied to your campaign",
              matchBreakdown: breakdown,
              name: creatorData.displayName || "Unknown Creator",
              avatar: creatorData.photoURL || creatorData.avatar,
              tags: creatorData.categories || creatorData.tags || ["General"],
              status: appData.status, // 'pending', 'approved', 'rejected'
              followers: formatNumber(creatorData.instagramMetrics?.followers || 0),
              engagement: (creatorData.instagramMetrics?.engagementRate || 0) + "%",
              instagramMetrics: creatorData.instagramMetrics,
              location: creatorData.location || "Unknown",
              submissionUrl: submission?.postUrl || null
            };
          }
          return null;
        });

        const allApplications = (await Promise.all(applicationPromises)).filter(Boolean);

        // Filter into buckets
        setApplicants(allApplications.filter((a: any) => a.status === 'pending'));
        setCollaborators(allApplications.filter((a: any) => a.status === 'approved'));


        // 2. Fetch All Creators (for Matches view)
        const creatorsQuery = query(collection(db, "users"), where("role", "==", "creator"));
        const creatorsSnapshot = await getDocs(creatorsQuery);

        const validCreators = creatorsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => c.instagramConnected && c.displayName);

        // 3. Match Logic
        let matchedCreators = validCreators.map((creator: any) => {
          const { score, reasons, breakdown } = calculateMatchScore(activeCampaign, creator);
          let matchReason = reasons.join(" • ");
          if (!matchReason) matchReason = "Matched based on availability";

          return {
            ...creator,
            name: creator.displayName || "Unnamed Creator",
            avatar: creator.photoURL || creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
            matchScore: score,
            matchReason: matchReason,
            matchBreakdown: breakdown,
            tags: creator.categories || creator.tags || ["General"],
            followers: formatNumber(creator.instagramMetrics?.followers || 0),
            engagement: (creator.instagramMetrics?.engagementRate || 0) + "%",
            instagramMetrics: creator.instagramMetrics,
            location: creator.location || "Unknown"
          };
        })
          .filter(c => c.matchScore >= 40)
          .sort((a, b) => b.matchScore - a.matchScore);

        setCreators(matchedCreators);
      } catch (error) {
        console.error("Error fetching match details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesAndApps();
  }, [activeCampaign]);

  const handleSendProposal = async (id: string, creatorName: string) => {
    if (!activeCampaign || !user) return;
    if (approvedIds.includes(id)) {
      toast.info(`Already sent a proposal to ${creatorName}`);
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
          title: activeCampaign.name || "Untitled Campaign",
          brandName: activeCampaign.brandName || "Brand",
          image: activeCampaign.images?.[0] || "",
          budget: activeCampaign.budget || "Negotiable"
        }
      });
      setApprovedIds((prev) => [...prev, id]);
      toast.success(`Proposal sent to ${creatorName}!`);
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Failed to send proposal.");
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

      toast.success(`Approved ${creator.name}!`, {
        description: "The campaign is now active for them."
      });

      // Remove from list locally
      setApplicants(prev => prev.filter(a => a.id !== creator.id));
    } catch (error) {
      console.error("Error approving applicant:", error);
      toast.error("Failed to approve applicant");
    }
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => [...prev, id]);
    // In a real app we might update DB too, currently just hiding from view
  };

  const handleRejectApplicant = async (creator: any) => {
    try {
      await updateDoc(doc(db, "applications", creator.applicationId), {
        status: "rejected"
      });
      setApplicants(prev => prev.filter(a => a.id !== creator.id));
      toast.info("Application rejected");
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  const visibleCreators = viewMode === 'collaborating'
    ? collaborators
    : viewMode === 'applicants'
      ? applicants
      : creators.filter((c) => {
        if (viewMode === 'matches') {
          return !approvedIds.includes(c.id) && !rejectedIds.includes(c.id) && !applicants.find(a => a.id === c.id) && !collaborators.find(col => col.id === c.id);
        } else {
          return approvedIds.includes(c.id) && !collaborators.find(col => col.id === c.id);
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
      toast.info("Content not yet submitted", {
        description: "This creator hasn't submitted their content link yet."
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
                viewMode === 'matches' ? "Your Matches" :
                  viewMode === 'applicants' ? "Applicants" : "Invited Creators"
              }
              subtitle={
                viewMode === 'matches' ? "Creators that perfectly fit your campaigns" :
                  viewMode === 'applicants' ? "Creators who want to work with you" : "Creators you have sent proposals to"
              }
            />

            {/* Campaign Selector */}
            {campaigns.length > 0 && (
              <div className="w-full md:w-64 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Searching Matches For:
                </Label>
                <Select
                  value={activeCampaign?.id}
                  onValueChange={(val) => {
                    const found = campaigns.find(c => c.id === val);
                    if (found) setActiveCampaign(found);
                  }}
                >
                  <SelectTrigger className="w-full bg-background border-input">
                    <SelectValue placeholder="Select a Campaign" />
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
                {viewMode === 'applicants' ? "Application Status" : "AI Match Summary"}
              </h3>
              {activeCampaign ? (
                <p className="text-muted-foreground">
                  {viewMode === 'applicants'
                    ? `You have ${applicants.length} pending applications to review for ${activeCampaign.name}.`
                    : `We found ${creators.length} potential matches for ${activeCampaign.name}.`
                  }
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No active campaign found. <Link to="/brand/campaigns/new" className="text-primary hover:underline">Create a campaign</Link> to get better matches.
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
              Applicants
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
              Collaborating ({collaborators.length})
            </Button>
            <Button
              variant={viewMode === 'invited' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('invited')}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Invited ({approvedIds.filter(id => !collaborators.some(c => c.id === id)).length})
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
                  } else if (viewMode === 'matches') {
                    await handleSendProposal(id, creator.name);
                  } else if (viewMode === 'collaborating') {
                    handleViewContent(creator);
                  }
                }}
                onReject={(id) => {
                  if (viewMode === 'applicants') {
                    handleRejectApplicant(creator);
                  } else {
                    handleReject(id);
                  }
                }}
                hideActions={viewMode === 'invited'} // Allow view content for collaborating
                isInvite={viewMode === 'matches'}
                isApplicant={viewMode === 'applicants'} // Pass this prop to modify card button text
                isCollaborating={viewMode === 'collaborating'}
                campaignId={activeCampaign?.id}
                creatorId={creator.id}
              />
            </motion.div>
          )) : (
            <div className="col-span-3 text-center py-20">
              <p className="text-muted-foreground">Select a campaign to see matches.</p>
            </div>
          )}
        </div>

        {/* Empty States */}
        {activeCampaign && visibleCreators.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {viewMode === 'applicants' ? "No pending applications" : "No matches found"}
            </h3>
            <p className="text-muted-foreground">
              {viewMode === 'applicants'
                ? "Creators will appear here when they apply to your campaign."
                : "Try adjusting your filters or campaign criteria."}
            </p>
          </div>
        )}

        {!activeCampaign && campaigns.length === 0 && (
          <div className="text-center py-20">
            <Link to="/brand/campaigns/new">
              <Button variant="hero">Create Campaign</Button>
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
          isCollaborating={viewMode === 'collaborating'}
          onApprove={() => {
            if (viewMode === 'applicants') {
              handleApproveApplicant(selectedCreator);
            } else if (viewMode === 'collaborating') {
              handleViewContent(selectedCreator);
            } else {
              handleSendProposal(selectedCreator.id, selectedCreator.name);
            }
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}