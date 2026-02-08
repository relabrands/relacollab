import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Inbox, DollarSign, TrendingUp, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    title: string;
    value: string | number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: any;
    iconColor: "primary" | "accent" | "success";
  }[]>([
    {
      title: "New Opportunities",
      value: 0,
      change: "0 today",
      changeType: "neutral",
      icon: Inbox,
      iconColor: "primary",
    },
    {
      title: "Active Campaigns",
      value: 0,
      change: "In progress",
      changeType: "neutral",
      icon: CheckCircle,
      iconColor: "accent",
    },
    {
      title: "Avg. Match Score",
      value: "0%",
      change: "+0%",
      changeType: "neutral",
      icon: TrendingUp,
      iconColor: "success",
    },
    {
      title: "This Month",
      value: "$0",
      change: "Pending: $0",
      changeType: "neutral",
      icon: DollarSign,
      iconColor: "primary",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch creator profile data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Calculate Profile Completion
        let completion = 20; // Base for being registered
        if (userData.niche || userData.categories?.length > 0) completion += 20;
        if (userData.bio) completion += 20;
        if (userData.socialHandles?.instagram) completion += 20;
        if (userData.photoURL) completion += 20;
        setProfileCompletion(completion);

        // 2. Fetch all creator's applications to filter them out
        const applicationsQuery = query(
          collection(db, "applications"),
          where("creatorId", "==", user.uid)
        );
        const applicationsSnap = await getDocs(applicationsQuery);
        const appliedCampaignIds = applicationsSnap.docs.map(doc => doc.data().campaignId);

        // Count active campaigns (approved applications)
        const activeCount = applicationsSnap.docs.filter(
          doc => doc.data().status === "approved"
        ).length;

        // 3. Fetch ALL active campaigns
        const campaignsQuery = query(
          collection(db, "campaigns"),
          where("status", "==", "active")
        );
        const campaignsSnap = await getDocs(campaignsQuery);

        // 4. Filter out campaigns already applied to and calculate match scores
        const { calculateMatchScore } = await import("@/lib/matchScoring");

        const matchedOpportunities = [];
        for (const campaignDoc of campaignsSnap.docs) {
          const campaignId = campaignDoc.id;

          // Skip if already applied
          if (appliedCampaignIds.includes(campaignId)) continue;

          const campaignData = campaignDoc.data();

          // Calculate real match score
          const matchResult = calculateMatchScore(campaignData, userData);

          // Only include campaigns with score > 0 (passed compensation filter)
          if (matchResult.score > 0) {
            matchedOpportunities.push({
              id: campaignId,
              ...campaignData,
              matchScore: matchResult.score,
              matchBreakdown: matchResult.breakdown
            });
          }
        }

        // Sort by match score and get top 4
        matchedOpportunities.sort((a, b) => b.matchScore - a.matchScore);
        const topOpportunities = matchedOpportunities.slice(0, 4);

        setOpportunities(topOpportunities);

        // Calculate average match score
        const avgMatchScore = topOpportunities.length > 0
          ? Math.round(topOpportunities.reduce((sum, opp) => sum + opp.matchScore, 0) / topOpportunities.length)
          : 0;

        // Update stats
        setStats(prev => [
          { ...prev[0], value: matchedOpportunities.length, change: `${topOpportunities.length} top matches` },
          { ...prev[1], value: activeCount, change: activeCount > 0 ? "In progress" : "No active campaigns" },
          { ...prev[2], value: `${avgMatchScore}%`, change: avgMatchScore >= 70 ? "Great fit!" : "Find your match" },
          { ...prev[3], value: "$0", change: "Pending: $0" }
        ]);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      <DashboardSidebar type="creator" />
      <MobileNav type="creator" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title={`Welcome back, ${user?.displayName || 'Creator'}`}
          subtitle="Here are your personalized opportunities"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Top Opportunities */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Top Matches for You</h2>
          <Link to="/creator/opportunities">
            <Button variant="ghost">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-lg bg-white mb-8">
            <p className="text-muted-foreground">No active opportunities found at the moment.</p>
          </div>
        )}

        {/* Profile Completion */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Complete Your Profile</h3>
              <p className="text-muted-foreground text-sm">
                A complete profile helps us find better matches for you
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{profileCompletion}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <Link to="/creator/profile">
                <Button variant="hero">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}