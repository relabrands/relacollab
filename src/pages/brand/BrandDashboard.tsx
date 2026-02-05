 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { StatCard } from "@/components/dashboard/StatCard";
 import { CampaignCard } from "@/components/dashboard/CampaignCard";
 import { Button } from "@/components/ui/button";
 import { FileText, Users, TrendingUp, DollarSign, Plus } from "lucide-react";
 import { Link } from "react-router-dom";
 
 const stats = [
   {
     title: "Active Campaigns",
     value: 4,
     change: "+2 this month",
     changeType: "positive" as const,
     icon: FileText,
     iconColor: "primary" as const,
   },
   {
     title: "Matched Creators",
     value: 28,
     change: "+12 this week",
     changeType: "positive" as const,
     icon: Users,
     iconColor: "accent" as const,
   },
   {
     title: "Avg. Match Score",
     value: "92%",
     change: "+3%",
     changeType: "positive" as const,
     icon: TrendingUp,
     iconColor: "success" as const,
   },
   {
     title: "Total Spend",
     value: "$12.4K",
     change: "This month",
     changeType: "neutral" as const,
     icon: DollarSign,
     iconColor: "primary" as const,
   },
 ];
 
 const recentCampaigns = [
   {
     id: "1",
     name: "Summer Wellness Launch",
     status: "active" as const,
     goal: "Awareness",
     budget: "$5,000",
     creators: 8,
     dueDate: "Feb 28, 2024",
   },
   {
     id: "2",
     name: "New Restaurant Opening",
     status: "pending" as const,
     goal: "Conversion",
     budget: "$3,200",
     creators: 5,
     dueDate: "Mar 15, 2024",
   },
   {
     id: "3",
     name: "Fitness App Promo",
     status: "draft" as const,
     goal: "Content Production",
     budget: "$2,800",
     creators: 0,
     dueDate: "Mar 22, 2024",
   },
 ];
 
 export default function BrandDashboard() {
   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="brand" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Welcome back, John"
           subtitle="Here's what's happening with your campaigns"
         />
 
         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {recentCampaigns.map((campaign) => (
             <CampaignCard key={campaign.id} campaign={campaign} />
           ))}
         </div>
       </main>
     </div>
   );
 }