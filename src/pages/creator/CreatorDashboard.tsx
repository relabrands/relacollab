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
        // 1. Calculate Profile Completion being real
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        let completion = 20; // Base for being registered
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.niche) completion += 20;
          if (data.bio) completion += 20;
          if (data.socialLinks?.instagram) completion += 20;
          if (data.photoURL) completion += 20;
        }
        setProfileCompletion(completion);

        // 2. Fetch Opportunities (Active campaigns)
        // For now, fetch all active campaigns. In future, filter by niche match.
        const q = query(
          collection(db, "campaigns"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(4)
        );
        const querySnapshot = await getDocs(q);
        const opps = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          matchScore: 85 + Math.floor(Math.random() * 10) // Mock match score
        }));
        setOpportunities(opps);

        // 3. Fetch Active Applications count
        const activeAppsQuery = query(
          collection(db, "applications"),
          where("userId", "==", user.uid),
          where("status", "==", "approved")
        );
        const activeAppsSnap = await getDocs(activeAppsQuery);
        const activeCount = activeAppsSnap.size;

        // Update stats
        setStats(prev => [
          { ...prev[0], value: opps.length },
          { ...prev[1], value: activeCount },
          { ...prev[2], value: opps.length > 0 ? "88%" : "0%" },
          { ...prev[3], value: "$0" } // Still mocked until earnings logic is fully connected
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

      <main className="flex-1 ml-64 p-8">
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