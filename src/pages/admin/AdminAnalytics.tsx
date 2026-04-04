import { useState, useEffect, useMemo } from "react";
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
  Legend,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, Users, TrendingUp } from "lucide-react";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30D"); // "7D", "30D", "6M", "1Y"
  
  const [stats, setStats] = useState({
    revenueData: [],
    campaignData: [],
    planDistribution: [],
    keyMetrics: {
      matchSuccessRate: 0,
      avgCampaignValue: 0,
      avgCreatorsPerCampaign: 0,
      brandRetention: 85 // Mocked for now
    },
    usersRaw: [] // Store raw here
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
        revenueData: [
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
        },
        usersRaw: users as any
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Growth Calculation Logic ---
  const usersGrowthData = useMemo(() => {
    if (!stats.usersRaw.length) return [];
    
    let daysToLookBack = 30;
    if (timeRange === "7D") daysToLookBack = 7;
    if (timeRange === "6M") daysToLookBack = 180;
    if (timeRange === "1Y") daysToLookBack = 365;

    const dataPoints: Record<string, { date: string; brands: number; creators: number }> = {};
    const now = new Date();

    // Initialize the empty data points to ensure the line chart goes all the way back
    for (let i = daysToLookBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        let key = "";
        
        // Group by month if 6M or 1Y
        if (timeRange === "6M" || timeRange === "1Y") {
          key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else {
          key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        if (!dataPoints[key]) {
             dataPoints[key] = { date: key, brands: 0, creators: 0 };
        }
    }

    // Cumulative Tracking arrays (sort of)
    // Actually, normally "growth" shows new users joined per period, or cumulative total.
    // Let's show "new users" per period to see growth spikes clearly.
    stats.usersRaw.forEach((u: any) => {
        if (!u.createdAt) return;
        const d = new Date(u.createdAt);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays <= daysToLookBack) {
            let key = "";
            if (timeRange === "6M" || timeRange === "1Y") {
               key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            } else {
               key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
            if (dataPoints[key]) {
                if (u.role === "brand") dataPoints[key].brands++;
                if (u.role === "creator") dataPoints[key].creators++;
            }
        }
    });

    return Object.values(dataPoints);
  }, [stats.usersRaw, timeRange]);

  const totalBrandsCount = stats.usersRaw.filter((u: any) => u.role === 'brand').length;
  const totalCreatorsCount = stats.usersRaw.filter((u: any) => u.role === 'creator').length;


  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Platform Analytics"
          subtitle="Real-time growth and performance metrics"
        />

        {/* Top Level Cards: Total Users Growth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex items-center justify-between"
            >
                <div>
                   <p className="text-muted-foreground text-sm font-medium">Total Brands</p>
                   <h3 className="text-3xl font-bold mt-2">{totalBrandsCount}</h3>
                </div>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                </div>
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 flex items-center justify-between"
            >
                <div>
                   <p className="text-muted-foreground text-sm font-medium">Total Creators</p>
                   <h3 className="text-3xl font-bold mt-2">{totalCreatorsCount}</h3>
                </div>
                <div className="w-12 h-12 bg-success/10 text-success rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 flex items-center justify-between border-primary/20 bg-primary/5"
            >
                <div>
                   <p className="text-primary text-sm font-medium">Platform Total</p>
                   <h3 className="text-3xl font-bold mt-2 text-primary">{totalBrandsCount + totalCreatorsCount}</h3>
                </div>
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </motion.div>
        </div>

        {/* Platform Growth Chart */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-semibold text-lg">Platform Growth (New Signups)</h3>
                    <p className="text-sm text-muted-foreground">Compare creator vs brand acquisition over time</p>
                </div>
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    {["7D", "30D", "6M", "1Y"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                timeRange === range 
                                ? "bg-background text-foreground shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={usersGrowthData}>
                <defs>
                  <linearGradient id="colorBrands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCreators" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(15, 90%, 60%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(15, 90%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                <Area
                  type="monotone"
                  name="New Brands"
                  dataKey="brands"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBrands)"
                />
                <Area
                  type="monotone"
                  name="New Creators"
                  dataKey="creators"
                  stroke="hsl(15, 90%, 60%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreators)"
                />
              </AreaChart>
            </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart - Placeholder until payments active */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Monthly Revenue (Projected)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(100, 40%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(100, 40%, 60%)" stopOpacity={0} />
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
                  stroke="hsl(100, 40%, 60%)"
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
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Campaigns Created</h3>
            <ResponsiveContainer width="100%" height={250}>
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
                <Bar dataKey="campaigns" fill="hsl(243, 75%, 59%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Plan Distribution</h3>
            {stats.planDistribution.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
                <div className="flex justify-center gap-4 flex-wrap mt-2">
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
            transition={{ delay: 0.7 }}
            className="glass-card p-6 lg:col-span-2"
          >
            <h3 className="font-semibold text-lg mb-6">Key Interactions Metrics</h3>
            <div className="grid grid-cols-2 gap-6 h-[250px]">
              <div className="text-center flex flex-col justify-center p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="text-4xl font-bold text-primary mb-2">{stats.keyMetrics.matchSuccessRate}%</div>
                <div className="text-sm text-muted-foreground">Application Success Rate</div>
              </div>
              <div className="text-center flex flex-col justify-center p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="text-4xl font-bold text-success mb-2">${stats.keyMetrics.avgCampaignValue}</div>
                <div className="text-sm text-muted-foreground">Avg. Campaign Value</div>
              </div>
              <div className="text-center flex flex-col justify-center p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="text-4xl font-bold text-accent mb-2">{stats.keyMetrics.avgCreatorsPerCampaign}</div>
                <div className="text-sm text-muted-foreground">Avg. Creators / Campaign</div>
              </div>
              <div className="text-center flex flex-col justify-center p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="text-4xl font-bold text-primary mb-2">{stats.keyMetrics.brandRetention}%</div>
                <div className="text-sm text-muted-foreground">Brand Retention (Est)</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}