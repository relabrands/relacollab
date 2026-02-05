 import { cn } from "@/lib/utils";
 import { LucideIcon } from "lucide-react";
 
 interface StatCardProps {
   title: string;
   value: string | number;
   change?: string;
   changeType?: "positive" | "negative" | "neutral";
   icon: LucideIcon;
   iconColor?: "primary" | "accent" | "success";
 }
 
 export function StatCard({
   title,
   value,
   change,
   changeType = "neutral",
   icon: Icon,
   iconColor = "primary",
 }: StatCardProps) {
   return (
     <div className="glass-card p-6 hover-lift">
       <div className="flex items-start justify-between mb-4">
         <div
           className={cn(
             "w-12 h-12 rounded-xl flex items-center justify-center",
             iconColor === "primary" && "bg-primary/10 text-primary",
             iconColor === "accent" && "bg-accent/10 text-accent",
             iconColor === "success" && "bg-success/10 text-success"
           )}
         >
           <Icon className="w-6 h-6" />
         </div>
         {change && (
           <span
             className={cn(
               "text-sm font-medium px-2 py-1 rounded-lg",
               changeType === "positive" && "text-success bg-success/10",
               changeType === "negative" && "text-destructive bg-destructive/10",
               changeType === "neutral" && "text-muted-foreground bg-muted"
             )}
           >
             {change}
           </span>
         )}
       </div>
 
       <div className="text-3xl font-bold mb-1">{value}</div>
       <div className="text-muted-foreground text-sm">{title}</div>
     </div>
   );
 }