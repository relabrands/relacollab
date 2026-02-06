import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { Plus, Loader2, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function BrandCampaigns() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "campaigns"),
                    where("brandId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const campaignsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCampaigns(campaignsData);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [user]);

    const filteredCampaigns = campaigns.filter(c => {
        if (filter === "all") return true;
        return c.status === filter;
    });

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <DashboardHeader
                        title="Campaigns"
                        subtitle="Manage your active and past campaigns"
                    />
                    <Link to="/brand/campaigns/new">
                        <Button variant="hero">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "active" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("active")}
                    >
                        Active
                    </Button>
                    <Button
                        variant={filter === "completed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("completed")}
                    >
                        Completed
                    </Button>
                    <Button
                        variant={filter === "draft" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("draft")}
                    >
                        Drafts
                    </Button>
                </div>

                {/* Loader */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Campaigns Grid */}
                {!loading && filteredCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCampaigns.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                ) : !loading && (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Filter className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">No campaigns found.</p>
                        {filter !== "all" ? (
                            <Button variant="link" onClick={() => setFilter("all")}>Clear filters</Button>
                        ) : (
                            <Link to="/brand/campaigns/new">
                                <Button variant="outline">Create your first campaign</Button>
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
