import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, PlusCircle } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";

export default function ActiveCampaigns() {
    const { user } = useAuth();
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveCampaigns = async () => {
            if (!user) return;
            try {
                // Fetch approved applications for this user
                const q = query(
                    collection(db, "applications"),
                    where("userId", "==", user.uid),
                    where("status", "==", "approved")
                );

                const appSnapshot = await getDocs(q);
                const campaigns = [];

                for (const appDoc of appSnapshot.docs) {
                    const appData = appDoc.data();
                    const campaignRef = doc(db, "campaigns", appData.campaignId);
                    const campaignDoc = await getDoc(campaignRef);

                    if (campaignDoc.exists()) {
                        campaigns.push({
                            id: campaignDoc.id,
                            ...campaignDoc.data(),
                            applicationId: appDoc.id, // Keep track of the application ID if needed
                            matchScore: 100 // It's a match!
                        });
                    }
                }

                setActiveCampaigns(campaigns);
            } catch (error) {
                console.error("Error fetching active campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveCampaigns();
    }, [user]);

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Active Campaigns"
                    subtitle="Campaigns you are currently participating in"
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : activeCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeCampaigns.map((campaign, index) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="relative">
                                    <OpportunityCard opportunity={campaign} />
                                    <div className="absolute top-2 right-2 bg-success text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Active
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border rounded-xl bg-muted/20">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <PlusCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No active campaigns yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Start applying to opportunities to get your first collaboration!
                        </p>
                        <Link to="/creator/opportunities">
                            <Button variant="hero">
                                Browse Opportunities
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
