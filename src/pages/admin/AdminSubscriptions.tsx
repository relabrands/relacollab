 import { useState } from "react";
 import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { motion } from "framer-motion";
 import { Edit, Check, CreditCard, Users, Zap, Crown } from "lucide-react";
 import { toast } from "sonner";
 
 interface Plan {
   id: string;
   name: string;
   price: number;
   interval: string;
   features: string[];
   subscribers: number;
   revenue: string;
   icon: typeof CreditCard;
   color: string;
 }
 
 const initialPlans: Plan[] = [
   {
     id: "basic",
     name: "Basic",
     price: 49,
     interval: "month",
     features: [
       "Up to 3 campaigns/month",
       "Basic AI matching",
       "Email support",
       "Standard analytics",
     ],
     subscribers: 45,
     revenue: "$2,205",
     icon: CreditCard,
     color: "muted",
   },
   {
     id: "starter",
     name: "Starter",
     price: 149,
     interval: "month",
     features: [
       "Up to 10 campaigns/month",
       "Advanced AI matching",
       "Priority support",
       "Advanced analytics",
       "Creator messaging",
     ],
     subscribers: 78,
     revenue: "$11,622",
     icon: Zap,
     color: "primary",
   },
   {
     id: "enterprise",
     name: "Enterprise",
     price: 499,
     interval: "month",
     features: [
       "Unlimited campaigns",
       "Premium AI matching",
       "Dedicated account manager",
       "Custom integrations",
       "White-label options",
       "API access",
     ],
     subscribers: 33,
     revenue: "$16,467",
     icon: Crown,
     color: "accent",
   },
 ];
 
 export default function AdminSubscriptions() {
   const [plans, setPlans] = useState<Plan[]>(initialPlans);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
 
   const totalRevenue = plans.reduce((sum, plan) => {
     return sum + parseFloat(plan.revenue.replace(/[$,]/g, ""));
   }, 0);
 
   const totalSubscribers = plans.reduce((sum, plan) => sum + plan.subscribers, 0);
 
   const handleEditPlan = () => {
     if (!selectedPlan) return;
 
     setPlans(plans.map((p) => (p.id === selectedPlan.id ? selectedPlan : p)));
     setIsEditOpen(false);
     toast.success(`${selectedPlan.name} plan updated`);
   };
 
   const colorClasses = {
     muted: "bg-muted/50 border-border",
     primary: "bg-primary/5 border-primary/20",
     accent: "bg-accent/5 border-accent/20",
   };
 
   const iconColorClasses = {
     muted: "bg-muted text-muted-foreground",
     primary: "bg-primary/10 text-primary",
     accent: "bg-accent/10 text-accent",
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Subscription Plans"
           subtitle="Manage pricing and plan features"
         />
 
         {/* Summary Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="glass-card p-6"
           >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Users className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <div className="text-2xl font-bold">{totalSubscribers}</div>
                 <div className="text-sm text-muted-foreground">Total Subscribers</div>
               </div>
             </div>
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="glass-card p-6"
           >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                 <CreditCard className="w-6 h-6 text-success" />
               </div>
               <div>
                 <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                 <div className="text-sm text-muted-foreground">Monthly Revenue</div>
               </div>
             </div>
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="glass-card p-6"
           >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                 <Crown className="w-6 h-6 text-accent" />
               </div>
               <div>
                 <div className="text-2xl font-bold">${Math.round(totalRevenue / totalSubscribers)}</div>
                 <div className="text-sm text-muted-foreground">Avg. Revenue per User</div>
               </div>
             </div>
           </motion.div>
         </div>
 
         {/* Plans Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {plans.map((plan, index) => (
             <motion.div
               key={plan.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               className={`glass-card p-6 border-2 ${colorClasses[plan.color as keyof typeof colorClasses]}`}
             >
               <div className="flex items-start justify-between mb-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColorClasses[plan.color as keyof typeof iconColorClasses]}`}>
                   <plan.icon className="w-6 h-6" />
                 </div>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => {
                     setSelectedPlan(plan);
                     setIsEditOpen(true);
                   }}
                 >
                   <Edit className="w-4 h-4" />
                 </Button>
               </div>
 
               <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
               <div className="flex items-baseline gap-1 mb-6">
                 <span className="text-3xl font-bold">${plan.price}</span>
                 <span className="text-muted-foreground">/{plan.interval}</span>
               </div>
 
               <div className="space-y-3 mb-6">
                 {plan.features.map((feature) => (
                   <div key={feature} className="flex items-center gap-2 text-sm">
                     <Check className="w-4 h-4 text-success" />
                     <span>{feature}</span>
                   </div>
                 ))}
               </div>
 
               <div className="pt-4 border-t border-border">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">Subscribers</span>
                   <span className="font-medium">{plan.subscribers}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm mt-2">
                   <span className="text-muted-foreground">Monthly Revenue</span>
                   <span className="font-medium text-success">{plan.revenue}</span>
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
 
         {/* Edit Dialog */}
         <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle>Edit {selectedPlan?.name} Plan</DialogTitle>
               <DialogDescription>
                 Update pricing and features
               </DialogDescription>
             </DialogHeader>
             {selectedPlan && (
               <div className="space-y-4 py-4">
                 <div>
                   <Label htmlFor="plan-name">Plan Name</Label>
                   <Input
                     id="plan-name"
                     value={selectedPlan.name}
                     onChange={(e) =>
                       setSelectedPlan({ ...selectedPlan, name: e.target.value })
                     }
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="plan-price">Price (USD)</Label>
                   <Input
                     id="plan-price"
                     type="number"
                     value={selectedPlan.price}
                     onChange={(e) =>
                       setSelectedPlan({ ...selectedPlan, price: parseInt(e.target.value) || 0 })
                     }
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label>Features (one per line)</Label>
                   <textarea
                     value={selectedPlan.features.join("\n")}
                     onChange={(e) =>
                       setSelectedPlan({
                         ...selectedPlan,
                         features: e.target.value.split("\n").filter(Boolean),
                       })
                     }
                     className="mt-2 w-full min-h-[120px] px-3 py-2 rounded-xl border border-input bg-background text-sm"
                   />
                 </div>
               </div>
             )}
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                 Cancel
               </Button>
               <Button variant="hero" onClick={handleEditPlan}>
                 Save Changes
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </main>
     </div>
   );
 }