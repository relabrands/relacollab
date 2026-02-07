import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, Sparkles, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'experience'>('all');

  // Dialog State
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Track applied campaign IDs to hide them or show as applied
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;
      try {
        // 0. Fetch existing applications to exclude/mark them
        const appsQuery = query(collection(db, "applications"), where("creatorId", "==", user.uid));
        const appsSnapshot = await getDocs(appsQuery);
        const appliedIds = new Set(appsSnapshot.docs.map(doc => doc.data().campaignId));
        setAppliedCampaignIds(appliedIds);

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
            return {
              id: invData.campaignId,
              invitationId: invDoc.id,
              ...campaignData,
              title: campaignData.name || "Untitled Campaign",
              isInvited: true,
              matchScore: 98,
              rewardType: campaignData.reward === 'paid' ? 'paid' : (campaignData.reward === 'experience' ? 'experience' : 'hybrid')
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
        const generalOpportunities = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              title: data.name,
              matchScore: data.matchScore || (80 + Math.floor(Math.random() * 15)),
              isInvited: false,
              rewardType: data.reward === 'paid' ? 'paid' : (data.reward === 'experience' ? 'experience' : 'hybrid')
            };
          })
          .filter(op => !invitedCampaignIds.has(op.id))
          .filter(op => !appliedIds.has(op.id)); // Hide already applied campaigns

        setOpportunities([...resolvedInvitations, ...generalOpportunities]);
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
      // Create application
      await addDoc(collection(db, "applications"), {
        campaignId: campaignId,
        creatorId: user.uid,
        brandId: campaign.brandId,
        status: "pending",
        createdAt: new Date().toISOString(),
        campaignData: {
          title: campaign.title,
          name: campaign.name,
          image: campaign.images?.[0] || ""
        },
        creatorData: {
          // In a real app we'd fetch this from user profile or context
          // For now we rely on backend or simple ID
          id: user.uid,
          email: user.email
        }
      });

      toast.success("Application Sent!", {
        description: "The brand has been notified of your interest.",
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
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity, index) => (
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
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl bg-white/5">
            <p className="text-muted-foreground">No active opportunities found at the moment.</p>
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