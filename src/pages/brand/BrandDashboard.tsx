import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { Button } from "@/components/ui/button";
import { FileText, Users, TrendingUp, DollarSign, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function BrandDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    title: string;
    value: string | number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: any;
    iconColor: "primary" | "accent" | "success";
  }[]>([
    {
      title: "Active Campaigns",
      value: 0,
      change: "0 this month",
      changeType: "neutral",
      icon: FileText,
      iconColor: "primary",
    },
    {
      title: "Matched Creators",
      value: 0,
      change: "0 this week",
      changeType: "neutral",
      icon: Users,
      iconColor: "accent",
    },
    {
      title: "Total Spend",
      value: "$0",
      change: "This month",
      changeType: "neutral",
      icon: DollarSign,
      iconColor: "primary",
    },
  ]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch Campaigns
        const q = query(
          collection(db, "campaigns"),
          where("brandId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const campaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentCampaigns(campaigns);

        // Calculate Stats (Basic implementation)
        const activeCount = campaigns.filter((c: any) => c.status === 'active').length;

        setStats(prev => [
          { ...prev[0], value: activeCount }, // Active Campaigns
          { ...prev[1], value: 0 }, // Matched Creators (Placeholder logic)
          { ...prev[2], value: "$0" } // Total Spend (Placeholder logic)
        ]);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title={`Welcome back, ${user?.displayName || 'Brand'}`}
          subtitle="Here's what's happening with your campaigns"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Campaigns</h2>
          <Link to="/brand/campaigns/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Campaigns Grid */}
        {recentCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-muted-foreground mb-4">No campaigns yet.</p>
            <Link to="/brand/campaigns/new">
              <Button variant="outline">Create your first campaign</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}