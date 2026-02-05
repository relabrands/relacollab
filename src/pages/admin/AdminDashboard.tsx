 import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { StatCard } from "@/components/dashboard/StatCard";
 import { Button } from "@/components/ui/button";
 import { motion } from "framer-motion";
 import {
   Building2,
   Users,
   FileText,
   DollarSign,
   TrendingUp,
   ArrowRight,
   Plus,
 } from "lucide-react";
 import { Link } from "react-router-dom";
 
 const stats = [
   {
     title: "Total Brands",
     value: 156,
     change: "+12 this month",
     changeType: "positive" as const,
     icon: Building2,
     iconColor: "primary" as const,
   },
   {
     title: "Active Creators",
     value: "2,547",
     change: "+89 this week",
     changeType: "positive" as const,
     icon: Users,
     iconColor: "accent" as const,
   },
   {
     title: "Active Campaigns",
     value: 324,
     change: "+28 this month",
     changeType: "positive" as const,
     icon: FileText,
     iconColor: "success" as const,
   },
   {
     title: "Monthly Revenue",
     value: "$48.5K",
     change: "+18% vs last month",
     changeType: "positive" as const,
     icon: DollarSign,
     iconColor: "primary" as const,
   },
 ];
 
 const recentBrands = [
   { id: "1", name: "Sunrise Cafe", plan: "Enterprise", status: "active", joined: "Feb 1, 2024" },
   { id: "2", name: "FitLife Gym", plan: "Starter", status: "active", joined: "Jan 28, 2024" },
   { id: "3", name: "Organic Market", plan: "Basic", status: "pending", joined: "Jan 25, 2024" },
   { id: "4", name: "Yoga Studio One", plan: "Starter", status: "active", joined: "Jan 20, 2024" },
 ];
 
 const planColors = {
   Basic: "bg-muted text-muted-foreground",
   Starter: "bg-primary/10 text-primary",
   Enterprise: "bg-accent/10 text-accent",
 };
 
 const statusColors = {
   active: "bg-success/10 text-success",
   pending: "bg-warning/10 text-warning",
   inactive: "bg-destructive/10 text-destructive",
 };
 
 export default function AdminDashboard() {
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Admin Dashboard"
           subtitle="Platform overview and management"
         />
 
         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           {stats.map((stat, index) => (
             <motion.div
               key={stat.title}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
             >
               <StatCard {...stat} />
             </motion.div>
           ))}
         </div>
 
         {/* Quick Actions */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <Link to="/admin/brands" className="glass-card p-6 hover-lift cursor-pointer">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-lg mb-1">Manage Brands</h3>
                 <p className="text-sm text-muted-foreground">Add, edit, or remove brands</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Building2 className="w-6 h-6 text-primary" />
               </div>
             </div>
           </Link>
 
           <Link to="/admin/creators" className="glass-card p-6 hover-lift cursor-pointer">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-lg mb-1">Manage Creators</h3>
                 <p className="text-sm text-muted-foreground">View and manage creator accounts</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                 <Users className="w-6 h-6 text-accent" />
               </div>
             </div>
           </Link>
 
           <Link to="/admin/subscriptions" className="glass-card p-6 hover-lift cursor-pointer">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-lg mb-1">Subscriptions</h3>
                 <p className="text-sm text-muted-foreground">Manage plans and billing</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                 <DollarSign className="w-6 h-6 text-success" />
               </div>
             </div>
           </Link>
         </div>
 
         {/* Recent Brands */}
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-semibold">Recent Brands</h2>
           <Link to="/admin/brands">
             <Button variant="ghost">
               View All
               <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
         </div>
 
         <div className="glass-card overflow-hidden">
           <table className="w-full">
             <thead className="bg-muted/50">
               <tr>
                 <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                 <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
               </tr>
             </thead>
             <tbody>
               {recentBrands.map((brand) => (
                 <tr key={brand.id} className="border-t border-border">
                   <td className="p-4 font-medium">{brand.name}</td>
                   <td className="p-4">
                     <span className={`px-3 py-1 rounded-lg text-xs font-medium ${planColors[brand.plan as keyof typeof planColors]}`}>
                       {brand.plan}
                     </span>
                   </td>
                   <td className="p-4">
                     <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[brand.status as keyof typeof statusColors]}`}>
                       {brand.status}
                     </span>
                   </td>
                   <td className="p-4 text-muted-foreground">{brand.joined}</td>
                   <td className="p-4 text-right">
                     <Link to="/admin/brands">
                       <Button variant="ghost" size="sm">
                         Edit
                       </Button>
                     </Link>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </main>
     </div>
   );
 }