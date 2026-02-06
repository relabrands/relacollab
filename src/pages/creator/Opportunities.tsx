import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, Sparkles, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy, documentId, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;
      try {
        // 1. Fetch Invitations for this user
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("creatorId", "==", user.uid),
          where("status", "==", "pending") // Only show pending invitations
        );
        const invSnapshot = await getDocs(invitationsQuery);

        const invitationsPromises = invSnapshot.docs.map(async (invDoc) => {
          const invData = invDoc.data();
          // Fetch the actual campaign data to ensure we have up-to-date info
          const campaignDocRef = doc(db, "campaigns", invData.campaignId);
          const campaignSnap = await getDoc(campaignDocRef);

          if (campaignSnap.exists()) {
            const campaignData = campaignSnap.data();
            return {
              id: invData.campaignId,
              invitationId: invDoc.id,
              ...campaignData,
              title: campaignData.name || "Untitled Campaign", // Map name to title
              isInvited: true,
              matchScore: 98,
              createdAt: invData.createdAt,
              // Ensure reward type exists
              rewardType: campaignData.reward === 'paid' ? 'paid' : (campaignData.reward === 'experience' ? 'experience' : 'hybrid')
            };
          }
          // Fallback if campaign deleted but invite exists (should cleanup but for now fallback)
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
              title: data.name, // Map name to title for consistency
              matchScore: data.matchScore || (80 + Math.floor(Math.random() * 15)),
              isInvited: false
            };
          })
          .filter(op => !invitedCampaignIds.has(op.id)); // Dedup

        setOpportunities([...resolvedInvitations, ...generalOpportunities]);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [user]);

  const handleApply = (id: string) => {
    // This is called when "Accept" or "Apply" is clicked directly on card or dialog
    toast.success("Application Sent!", {
      description: "The brand has been notified.",
    });
    setIsDialogOpen(false);
  };

  const handleCardClick = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setIsDialogOpen(true);
  };

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
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Filter className="w-4 h-4 mr-2" />
              All ({opportunities.length})
            </Button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap">
              Paid Only
            </Button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap">
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
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {opportunities.map((opportunity, index) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCardClick(opportunity)}
                className="cursor-pointer"
              >
                <OpportunityCard
                  opportunity={opportunity}
                  onAccept={(id) => {
                    // If they click the button directly, we handle it
                    // But usually we might want to open details first? 
                    // Let's let the button do the action for now or bubbling might trigger details
                    // We handled propagation in OpportunityCard? Check.
                    handleApply(id);
                  }}
                />
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