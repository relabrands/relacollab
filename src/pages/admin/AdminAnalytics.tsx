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
 
 const revenueData = [
   { month: "Sep", revenue: 28000 },
   { month: "Oct", revenue: 32000 },
   { month: "Nov", revenue: 38000 },
   { month: "Dec", revenue: 35000 },
   { month: "Jan", revenue: 42000 },
   { month: "Feb", revenue: 48500 },
 ];
 
 const campaignData = [
   { month: "Sep", campaigns: 180 },
   { month: "Oct", campaigns: 220 },
   { month: "Nov", campaigns: 250 },
   { month: "Dec", campaigns: 200 },
   { month: "Jan", campaigns: 290 },
   { month: "Feb", campaigns: 324 },
 ];
 
 const planDistribution = [
   { name: "Basic", value: 45, color: "hsl(220, 9%, 46%)" },
   { name: "Starter", value: 78, color: "hsl(243, 75%, 59%)" },
   { name: "Enterprise", value: 33, color: "hsl(15, 90%, 60%)" },
 ];
 
 export default function AdminAnalytics() {
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Analytics"
           subtitle="Platform performance and metrics"
         />
 
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           {/* Revenue Chart */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="glass-card p-6"
           >
             <h3 className="font-semibold text-lg mb-6">Monthly Revenue</h3>
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={revenueData}>
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
               <BarChart data={campaignData}>
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
             <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                 <Pie
                   data={planDistribution}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {planDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="flex justify-center gap-6 mt-4">
               {planDistribution.map((plan) => (
                 <div key={plan.name} className="flex items-center gap-2">
                   <div
                     className="w-3 h-3 rounded-full"
                     style={{ backgroundColor: plan.color }}
                   />
                   <span className="text-sm text-muted-foreground">{plan.name}</span>
                 </div>
               ))}
             </div>
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
                 <div className="text-3xl font-bold text-primary mb-1">94%</div>
                 <div className="text-sm text-muted-foreground">Match Success Rate</div>
               </div>
               <div className="text-center p-4 rounded-xl bg-muted/50">
                 <div className="text-3xl font-bold text-success mb-1">$485</div>
                 <div className="text-sm text-muted-foreground">Avg. Campaign Value</div>
               </div>
               <div className="text-center p-4 rounded-xl bg-muted/50">
                 <div className="text-3xl font-bold text-accent mb-1">4.2</div>
                 <div className="text-sm text-muted-foreground">Avg. Creators/Campaign</div>
               </div>
               <div className="text-center p-4 rounded-xl bg-muted/50">
                 <div className="text-3xl font-bold text-primary mb-1">87%</div>
                 <div className="text-sm text-muted-foreground">Brand Retention</div>
               </div>
             </div>
           </motion.div>
         </div>
       </main>
     </div>
   );
 }