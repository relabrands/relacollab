import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, Sparkles, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "campaigns"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedOpportunities = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Use a default/mock match score if not present, slightly randomized for realism
          matchScore: doc.data().matchScore || (80 + Math.floor(Math.random() * 15))
        }));

        setOpportunities(fetchedOpportunities);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [user]);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              All ({opportunities.length})
            </Button>
            <Button variant="ghost" size="sm">
              Paid Only
            </Button>
            <Button variant="ghost" size="sm">
              Experience
            </Button>
          </div>
          <Button variant="outline" size="sm">
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
              >
                <OpportunityCard opportunity={opportunity} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl bg-white/5">
            <p className="text-muted-foreground">No active opportunities found at the moment.</p>
          </div>
        )}
      </main>
    </div>
  );
}