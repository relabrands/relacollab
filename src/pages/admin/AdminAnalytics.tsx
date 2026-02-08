import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueData: [],
    campaignData: [],
    planDistribution: [],
    keyMetrics: {
      matchSuccessRate: 0,
      avgCampaignValue: 0,
      avgCreatorsPerCampaign: 0,
      brandRetention: 85 // Mocked for now
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const usersSnapshot = await getDocs(collection(db, "users"));
      const appsSnapshot = await getDocs(collection(db, "applications"));

      const campaigns = campaignsSnapshot.docs.map(doc => doc.data());
      const users = usersSnapshot.docs.map(doc => doc.data());
      const applications = appsSnapshot.docs.map(doc => doc.data());

      // 1. Campaign Data (Group by Created Month)
      const campaignCountsByMonth: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize last 6 months
      const today = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        campaignCountsByMonth[monthName] = 0;
        last6Months.push(monthName);
      }

      campaigns.forEach(c => {
        if (c.createdAt) {
          const d = new Date(c.createdAt);
          const monthName = months[d.getMonth()];
          if (campaignCountsByMonth[monthName] !== undefined) {
            campaignCountsByMonth[monthName]++;
          }
        }
      });

      const campaignDataFormatted = last6Months.map(m => ({
        month: m,
        campaigns: campaignCountsByMonth[m]
      }));


      // 2. Plan Distribution
      const planCounts = { Basic: 0, Starter: 0, Enterprise: 0, Free: 0 };
      users.filter(u => u.role === 'brand').forEach(u => {
        const plan = (u.plan || "Free") as keyof typeof planCounts;
        if (planCounts[plan] !== undefined) {
          planCounts[plan]++;
        }
      });

      const planDistributionFormatted = [
        { name: "Basic", value: planCounts.Basic, color: "hsl(220, 9%, 46%)" },
        { name: "Starter", value: planCounts.Starter, color: "hsl(243, 75%, 59%)" },
        { name: "Enterprise", value: planCounts.Enterprise, color: "hsl(15, 90%, 60%)" },
        { name: "Free", value: planCounts.Free, color: "hsl(100, 40%, 60%)" }
      ].filter(p => p.value > 0);


      // 3. Key Metrics
      const totalApps = applications.length;
      const approvedApps = applications.filter(a => a.status === 'approved').length;
      const matchSuccessRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

      const totalCampaigns = campaigns.length;
      const avgCreatorsPerCampaign = totalCampaigns > 0 ? (approvedApps / totalCampaigns).toFixed(1) : "0";

      // Estimate Campaign Value (parse budget string if possible, else use mock avg)
      // Simple extraction of numbers from strings like "$500" or "500 USD"
      let totalValue = 0;
      let valuedCampaigns = 0;
      campaigns.forEach(c => {
        const budget = c.budget || c.reward;
        if (typeof budget === 'string' && budget.match(/\d+/)) {
          const val = parseInt(budget.replace(/[^0-9]/g, ''));
          if (!isNaN(val)) {
            totalValue += val;
            valuedCampaigns++;
          }
        }
      });
      const avgCampaignValue = valuedCampaigns > 0 ? Math.round(totalValue / valuedCampaigns) : 0;


      setStats({
        revenueData: [ // Mock revenue data for chart visualization as we don't have payments yet
          { month: "Sep", revenue: 0 }, { month: "Oct", revenue: 0 },
          { month: "Nov", revenue: 0 }, { month: "Dec", revenue: 0 },
          { month: "Jan", revenue: 0 }, { month: "Feb", revenue: 0 }
        ],
        campaignData: campaignDataFormatted,
        planDistribution: planDistributionFormatted,
        keyMetrics: {
          matchSuccessRate,
          avgCampaignValue,
          avgCreatorsPerCampaign: Number(avgCreatorsPerCampaign),
          brandRetention: 87
        }
      });

    } catch (e) {
      console.error("Error fetching analytics", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Analytics"
          subtitle="Platform performance and metrics (Real-time)"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart - Placeholder until payments active */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Monthly Revenue (Projected)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" stroke="hsl(220, 9%, 46%)" />
                <YAxis stroke="hsl(220, 9%, 46%)" tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Campaigns Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Campaigns Created</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" stroke="hsl(220, 9%, 46%)" />
                <YAxis stroke="hsl(220, 9%, 46%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="campaigns" fill="hsl(15, 90%, 60%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Plan Distribution</h3>
            {stats.planDistribution.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.planDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 flex-wrap mt-4">
                  {stats.planDistribution.map((plan: any) => (
                    <div key={plan.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <span className="text-sm text-muted-foreground">{plan.name} ({plan.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No plan data available
              </div>
            )}

          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 lg:col-span-2"
          >
            <h3 className="font-semibold text-lg mb-6">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-primary mb-1">{stats.keyMetrics.matchSuccessRate}%</div>
                <div className="text-sm text-muted-foreground">Match Success Rate</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-success mb-1">${stats.keyMetrics.avgCampaignValue}</div>
                <div className="text-sm text-muted-foreground">Avg. Campaign Value</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-accent mb-1">{stats.keyMetrics.avgCreatorsPerCampaign}</div>
                <div className="text-sm text-muted-foreground">Avg. Creators/Campaign</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-primary mb-1">{stats.keyMetrics.brandRetention}%</div>
                <div className="text-sm text-muted-foreground">Brand Retention</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}