 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { MatchScore } from "./MatchScore";
 import { MapPin, DollarSign, Gift, Clock, ArrowRight } from "lucide-react";
 import { cn } from "@/lib/utils";
import { toast } from "sonner";
 
 interface OpportunityCardProps {
   opportunity: {
     id: string;
     brandName: string;
     brandLogo: string;
     title: string;
     location: string;
     reward: string;
     rewardType: "paid" | "experience" | "hybrid";
     matchScore: number;
     deadline: string;
     tags: string[];
   };
   onAccept?: (id: string) => void;
 }
 
 const rewardTypeColors = {
   paid: "bg-success/10 text-success",
   experience: "bg-primary/10 text-primary",
   hybrid: "bg-accent/10 text-accent",
 };
 
 const rewardTypeLabels = {
   paid: "Paid",
   experience: "Free Experience",
   hybrid: "Experience + Cash",
 };
 
 export function OpportunityCard({ opportunity, onAccept }: OpportunityCardProps) {
  const handleApply = () => {
    if (onAccept) {
      onAccept(opportunity.id);
    }
    toast.success(`Applied to "${opportunity.title}"`, {
      description: `${opportunity.brandName} will review your application soon.`,
    });
  };

   return (
     <div className="glass-card p-6 hover-lift">
       <div className="flex items-start gap-4 mb-4">
         <img
           src={opportunity.brandLogo}
           alt={opportunity.brandName}
           className="w-14 h-14 rounded-xl object-cover"
         />
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
             <h3 className="font-semibold text-lg truncate">{opportunity.title}</h3>
           </div>
           <p className="text-sm text-muted-foreground">{opportunity.brandName}</p>
         </div>
         <MatchScore score={opportunity.matchScore} size="md" showLabel={false} />
       </div>
 
       {/* Details */}
       <div className="grid grid-cols-2 gap-3 mb-4">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <MapPin className="w-4 h-4" />
           {opportunity.location}
         </div>
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <Clock className="w-4 h-4" />
           {opportunity.deadline}
         </div>
       </div>
 
       {/* Reward */}
       <div className="p-4 rounded-xl bg-muted/50 mb-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             {opportunity.rewardType === "paid" ? (
               <DollarSign className="w-5 h-5 text-success" />
             ) : (
               <Gift className="w-5 h-5 text-primary" />
             )}
             <span className="font-semibold">{opportunity.reward}</span>
           </div>
           <Badge className={cn("font-medium", rewardTypeColors[opportunity.rewardType])}>
             {rewardTypeLabels[opportunity.rewardType]}
           </Badge>
         </div>
       </div>
 
       {/* Tags */}
       <div className="flex flex-wrap gap-2 mb-4">
         {opportunity.tags.map((tag) => (
           <span
             key={tag}
             className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium"
           >
             {tag}
           </span>
         ))}
       </div>
 
       {/* Action */}
       <Button
         variant="hero"
         className="w-full"
        onClick={handleApply}
       >
         Apply Now
         <ArrowRight className="w-4 h-4" />
       </Button>
     </div>
   );
 }