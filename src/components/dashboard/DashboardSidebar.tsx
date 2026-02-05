 import { Link, useLocation } from "react-router-dom";
 import { cn } from "@/lib/utils";
 import {
   LayoutDashboard,
   FileText,
   Users,
   Settings,
   CreditCard,
   BarChart3,
   Sparkles,
   LogOut,
   Zap,
   Inbox,
   User,
   Image,
 } from "lucide-react";
 
 interface DashboardSidebarProps {
   type: "brand" | "creator";
 }
 
 const brandNavItems = [
   { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
   { icon: FileText, label: "Campaigns", path: "/brand/campaigns" },
   { icon: Users, label: "Matches", path: "/brand/matches" },
   { icon: Image, label: "Content Library", path: "/brand/content" },
   { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
   { icon: CreditCard, label: "Payments", path: "/brand/payments" },
   { icon: Settings, label: "Settings", path: "/brand/settings" },
 ];
 
 const creatorNavItems = [
   { icon: LayoutDashboard, label: "Dashboard", path: "/creator" },
   { icon: Inbox, label: "Opportunities", path: "/creator/opportunities" },
   { icon: Zap, label: "Active Campaigns", path: "/creator/active" },
   { icon: Image, label: "My Content", path: "/creator/content" },
   { icon: User, label: "My Profile", path: "/creator/profile" },
   { icon: CreditCard, label: "Earnings", path: "/creator/earnings" },
   { icon: Settings, label: "Settings", path: "/creator/settings" },
 ];
 
 export function DashboardSidebar({ type }: DashboardSidebarProps) {
   const location = useLocation();
   const navItems = type === "brand" ? brandNavItems : creatorNavItems;
 
   return (
     <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
       {/* Logo */}
       <Link to="/" className="flex items-center gap-3 px-6 py-6">
         <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
           <Sparkles className="w-5 h-5 text-primary-foreground" />
         </div>
         <span className="font-bold text-lg">RELA Collab</span>
       </Link>
 
       {/* Type badge */}
       <div className="px-6 mb-6">
         <div className={cn(
           "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
           type === "brand" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
         )}>
           {type === "brand" ? "Brand Dashboard" : "Creator Dashboard"}
         </div>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 px-4 space-y-1">
         {navItems.map((item) => {
           const isActive = location.pathname === item.path;
           return (
             <Link
               key={item.path}
               to={item.path}
               className={cn("sidebar-item", isActive && "active")}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </Link>
           );
         })}
       </nav>
 
       {/* Footer */}
       <div className="p-4 border-t border-sidebar-border">
         <button className="sidebar-item w-full text-sidebar-foreground/50 hover:text-sidebar-foreground">
           <LogOut className="w-5 h-5" />
           Sign Out
         </button>
       </div>
     </aside>
   );
 }