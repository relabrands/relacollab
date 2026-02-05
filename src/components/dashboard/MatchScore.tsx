 import { cn } from "@/lib/utils";
 
 interface MatchScoreProps {
   score: number;
   size?: "sm" | "md" | "lg";
   showLabel?: boolean;
 }
 
 export function MatchScore({ score, size = "md", showLabel = true }: MatchScoreProps) {
   const getScoreColor = () => {
     if (score >= 90) return "bg-success text-success-foreground";
     if (score >= 75) return "bg-warning text-warning-foreground";
     return "bg-accent text-accent-foreground";
   };
 
   const getScoreLabel = () => {
     if (score >= 90) return "Excellent Match";
     if (score >= 75) return "Good Match";
     return "Fair Match";
   };
 
   const sizeClasses = {
     sm: "w-10 h-10 text-sm",
     md: "w-14 h-14 text-lg",
     lg: "w-20 h-20 text-2xl",
   };
 
   return (
     <div className="flex items-center gap-3">
       <div
         className={cn(
           "rounded-xl font-bold flex items-center justify-center",
           sizeClasses[size],
           getScoreColor()
         )}
       >
         {score}%
       </div>
       {showLabel && (
         <span className="text-sm text-muted-foreground">{getScoreLabel()}</span>
       )}
     </div>
   );
 }