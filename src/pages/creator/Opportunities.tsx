 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
 import { Button } from "@/components/ui/button";
 import { motion } from "framer-motion";
 import { Filter, SlidersHorizontal, Sparkles } from "lucide-react";
 
 const opportunities = [
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
   {
     id: "3",
     brandName: "Organic Market",
     brandLogo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop",
     title: "Healthy Living Campaign",
     location: "Santa Monica, CA",
     reward: "Free groceries ($200 value)",
     rewardType: "experience" as const,
     matchScore: 84,
     deadline: "Mar 10",
     tags: ["Healthy", "Lifestyle", "Stories"],
   },
   {
     id: "4",
     brandName: "Yoga Studio One",
     brandLogo: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=100&h=100&fit=crop",
     title: "Morning Routine Series",
     location: "Los Angeles, CA",
     reward: "$400 + Free membership",
     rewardType: "hybrid" as const,
     matchScore: 82,
     deadline: "Mar 15",
     tags: ["Yoga", "Wellness", "Video"],
   },
   {
     id: "5",
     brandName: "Green Smoothie Co",
     brandLogo: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100&h=100&fit=crop",
     title: "Product Launch UGC",
     location: "Nationwide",
     reward: "$275",
     rewardType: "paid" as const,
     matchScore: 79,
     deadline: "Mar 20",
     tags: ["Food", "UGC", "Product"],
   },
   {
     id: "6",
     brandName: "Boutique Hotel LA",
     brandLogo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
     title: "Staycation Experience",
     location: "Los Angeles, CA",
     reward: "2-night stay ($800 value)",
     rewardType: "experience" as const,
     matchScore: 76,
     deadline: "Apr 1",
     tags: ["Travel", "Luxury", "Experience"],
   },
 ];
 
 export default function Opportunities() {
   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="creator" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Opportunities"
           subtitle="Campaigns matched to your profile and style"
         />
 
         {/* AI Info */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
         >
           <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
               <Sparkles className="w-6 h-6 text-primary-foreground" />
             </div>
             <div>
               <h3 className="font-semibold text-lg mb-2">Personalized Matches</h3>
               <p className="text-muted-foreground">
                 These opportunities are curated based on your content style, engagement quality, and audience demographics. 
                 Higher match scores mean better alignment with brand requirements.
               </p>
             </div>
           </div>
         </motion.div>
 
         {/* Filters */}
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Button variant="outline" size="sm">
               <Filter className="w-4 h-4 mr-2" />
               All ({opportunities.length})
             </Button>
             <Button variant="ghost" size="sm">
               Paid Only
             </Button>
             <Button variant="ghost" size="sm">
               Experience
             </Button>
           </div>
           <Button variant="outline" size="sm">
             <SlidersHorizontal className="w-4 h-4 mr-2" />
             Filters
           </Button>
         </div>
 
         {/* Opportunities Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {opportunities.map((opportunity, index) => (
             <motion.div
               key={opportunity.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
             >
               <OpportunityCard opportunity={opportunity} />
             </motion.div>
           ))}
         </div>
       </main>
     </div>
   );
 }