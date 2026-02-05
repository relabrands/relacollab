 import { useState } from "react";
 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { CreatorCard } from "@/components/dashboard/CreatorCard";
 import { Button } from "@/components/ui/button";
 import { motion } from "framer-motion";
 import { Sparkles, Filter, SlidersHorizontal } from "lucide-react";
 
 const matchedCreators = [
   {
     id: "1",
     name: "Maria Santos",
     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
     location: "Los Angeles, CA",
     followers: "125K",
     engagement: "4.8%",
     matchScore: 95,
     tags: ["Wellness", "Fitness", "Healthy Living"],
     matchReason: "Maria's audience is 78% local, health-focused, and her visual style aligns perfectly with your wellness and breakfast content goals.",
   },
   {
     id: "2",
     name: "Jorge Rivera",
     avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
     location: "Los Angeles, CA",
     followers: "89K",
     engagement: "5.2%",
     matchScore: 92,
     tags: ["Food", "Lifestyle", "Local"],
     matchReason: "Jorge's content showcases local food experiences with high engagement. His audience demographics match your target age range of 25-34.",
   },
   {
     id: "3",
     name: "Sophia Chen",
     avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
     location: "San Diego, CA",
     followers: "210K",
     engagement: "3.9%",
     matchScore: 88,
     tags: ["Premium", "Travel", "Lifestyle"],
     matchReason: "Sophia creates premium lifestyle content that resonates with health-conscious audiences. Her aesthetic aligns with your brand vibe.",
   },
   {
     id: "4",
     name: "Alex Thompson",
     avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
     location: "Los Angeles, CA",
     followers: "156K",
     engagement: "4.1%",
     matchScore: 85,
     tags: ["Fitness", "Morning Routine", "Motivation"],
     matchReason: "Alex's morning routine and fitness content naturally incorporates breakfast themes. Strong engagement in the wellness niche.",
   },
   {
     id: "5",
     name: "Priya Patel",
     avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
     location: "Los Angeles, CA",
     followers: "78K",
     engagement: "6.2%",
     matchScore: 82,
     tags: ["Healthy Recipes", "Family", "Wellness"],
     matchReason: "Priya's healthy recipe content and family-friendly approach matches your brand values. Exceptional engagement rate indicates highly loyal audience.",
   },
   {
     id: "6",
     name: "David Kim",
     avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
     location: "Orange County, CA",
     followers: "92K",
     engagement: "4.5%",
     matchScore: 79,
     tags: ["Food Photography", "Brunch", "Local Spots"],
     matchReason: "David specializes in visually stunning food photography with a focus on brunch content. Perfect for UGC ad production.",
   },
 ];
 
 export default function BrandMatches() {
   const [approvedIds, setApprovedIds] = useState<string[]>([]);
   const [rejectedIds, setRejectedIds] = useState<string[]>([]);
 
   const handleApprove = (id: string) => {
     setApprovedIds((prev) => [...prev, id]);
   };
 
   const handleReject = (id: string) => {
     setRejectedIds((prev) => [...prev, id]);
   };
 
   const visibleCreators = matchedCreators.filter(
     (c) => !approvedIds.includes(c.id) && !rejectedIds.includes(c.id)
   );
 
   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="brand" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="AI-Matched Creators"
           subtitle="Recommended creators for your Summer Wellness Launch campaign"
         />
 
         {/* AI Summary */}
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
               <h3 className="font-semibold text-lg mb-2">AI Match Summary</h3>
               <p className="text-muted-foreground">
                 Based on your campaign goals (Awareness, Wellness vibe) and target audience (Los Angeles, 25-34), 
                 we found <span className="font-semibold text-primary">{matchedCreators.length} highly compatible creators</span>. 
                 Top matches have local audiences, health-focused content, and visual styles that align with breakfast and fitness themes.
               </p>
             </div>
           </div>
         </motion.div>
 
         {/* Filters */}
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Button variant="outline" size="sm">
               <Filter className="w-4 h-4 mr-2" />
               All Matches ({visibleCreators.length})
             </Button>
             <Button variant="ghost" size="sm">
               Approved ({approvedIds.length})
             </Button>
           </div>
           <Button variant="outline" size="sm">
             <SlidersHorizontal className="w-4 h-4 mr-2" />
             Filters
           </Button>
         </div>
 
         {/* Creators Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {visibleCreators.map((creator, index) => (
             <motion.div
               key={creator.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
             >
               <CreatorCard
                 creator={creator}
                 onApprove={handleApprove}
                 onReject={handleReject}
               />
             </motion.div>
           ))}
         </div>
 
         {visibleCreators.length === 0 && (
           <div className="text-center py-20">
             <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
               <Sparkles className="w-8 h-8 text-success" />
             </div>
             <h3 className="text-xl font-semibold mb-2">All creators reviewed!</h3>
             <p className="text-muted-foreground">
               You've approved {approvedIds.length} creators for this campaign.
             </p>
           </div>
         )}
       </main>
     </div>
   );
 }