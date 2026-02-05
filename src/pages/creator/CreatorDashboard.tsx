 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { StatCard } from "@/components/dashboard/StatCard";
 import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
 import { Button } from "@/components/ui/button";
 import { Inbox, DollarSign, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
 import { Link } from "react-router-dom";
 
 const stats = [
   {
     title: "New Opportunities",
     value: 8,
     change: "+3 today",
     changeType: "positive" as const,
     icon: Inbox,
     iconColor: "primary" as const,
   },
   {
     title: "Active Campaigns",
     value: 3,
     change: "In progress",
     changeType: "neutral" as const,
     icon: CheckCircle,
     iconColor: "accent" as const,
   },
   {
     title: "Avg. Match Score",
     value: "89%",
     change: "+5%",
     changeType: "positive" as const,
     icon: TrendingUp,
     iconColor: "success" as const,
   },
   {
     title: "This Month",
     value: "$2,450",
     change: "Pending: $800",
     changeType: "neutral" as const,
     icon: DollarSign,
     iconColor: "primary" as const,
   },
 ];
 
 const topOpportunities = [
   {
     id: "1",
     brandName: "Sunrise Cafe",
     brandLogo: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=100&h=100&fit=crop",
     title: "Summer Wellness Launch",
     location: "Los Angeles, CA",
     reward: "$500 + Free dining",
     rewardType: "hybrid" as const,
     matchScore: 95,
     deadline: "Feb 28",
     tags: ["Wellness", "Food", "Instagram"],
   },
   {
     id: "2",
     brandName: "FitLife Gym",
     brandLogo: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100&h=100&fit=crop",
     title: "New Year Fitness Push",
     location: "Los Angeles, CA",
     reward: "$350",
     rewardType: "paid" as const,
     matchScore: 88,
     deadline: "Mar 5",
     tags: ["Fitness", "Reels", "TikTok"],
   },
 ];
 
 export default function CreatorDashboard() {
   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="creator" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Welcome back, Maria"
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
 
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           {topOpportunities.map((opportunity) => (
             <OpportunityCard key={opportunity.id} opportunity={opportunity} />
           ))}
         </div>
 
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
                 <div className="text-2xl font-bold text-primary">75%</div>
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
             <div className="h-full w-3/4 bg-gradient-primary rounded-full" />
           </div>
         </div>
       </main>
     </div>
   );
 }