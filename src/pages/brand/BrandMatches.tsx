import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreatorCard } from "@/components/dashboard/CreatorCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function BrandMatches() {
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "creator"));
        const snapshot = await getDocs(q);
        const fetchedCreators = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().displayName || "Unnamed Creator",
          location: "Unknown Location", // Placeholder until we added location to Creator profile
          followers: "10K", // Placeholder
          engagement: "5.0%", // Placeholder
          matchScore: 85 + Math.floor(Math.random() * 10), // Mock score
          tags: doc.data().niche ? [doc.data().niche] : ["General"],
          matchReason: "Matches your campaign criteria based on niche and location."
        }));
        setCreators(fetchedCreators);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, []);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => [...prev, id]);
  };

  const visibleCreators = creators.filter(
    (c) => !approvedIds.includes(c.id) && !rejectedIds.includes(c.id)
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="AI-Matched Creators"
          subtitle="Recommended creators for your campaigns"
        />

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
              <p className="text-muted-foreground">
                We found <span className="font-semibold text-primary">{creators.length} potential matches</span> based on your platform activity.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              All Matches ({visibleCreators.length})
            </Button>
            <Button variant="ghost" size="sm">
              Approved ({approvedIds.length})
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
            >
              <CreatorCard
                creator={creator}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </motion.div>
          ))}
        </div>

        {visibleCreators.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No creators found!</h3>
            <p className="text-muted-foreground">
              {creators.length > 0 ? "You've reviewed all current matches." : "Wait for more creators to join the platform."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}