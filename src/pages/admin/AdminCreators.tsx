 import { useState } from "react";
 import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { motion } from "framer-motion";
 import { Search, Eye, Ban, CheckCircle, Users } from "lucide-react";
 import { toast } from "sonner";
 
 interface Creator {
   id: string;
   name: string;
   email: string;
   avatar: string;
   followers: string;
   engagement: string;
   status: "active" | "pending" | "suspended";
   campaigns: number;
   earnings: string;
 }
 
 const initialCreators: Creator[] = [
   { id: "1", name: "Maria Santos", email: "maria@example.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", followers: "125K", engagement: "4.8%", status: "active", campaigns: 12, earnings: "$8,450" },
   { id: "2", name: "Jorge Rivera", email: "jorge@example.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", followers: "89K", engagement: "5.2%", status: "active", campaigns: 8, earnings: "$5,200" },
   { id: "3", name: "Sophia Chen", email: "sophia@example.com", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", followers: "210K", engagement: "3.9%", status: "pending", campaigns: 0, earnings: "$0" },
   { id: "4", name: "Alex Thompson", email: "alex@example.com", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", followers: "156K", engagement: "4.1%", status: "active", campaigns: 15, earnings: "$12,800" },
   { id: "5", name: "Priya Patel", email: "priya@example.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", followers: "78K", engagement: "6.2%", status: "active", campaigns: 6, earnings: "$4,100" },
   { id: "6", name: "David Kim", email: "david@example.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", followers: "92K", engagement: "4.5%", status: "suspended", campaigns: 3, earnings: "$1,800" },
 ];
 
 const statusColors = {
   active: "bg-success/10 text-success",
   pending: "bg-warning/10 text-warning",
   suspended: "bg-destructive/10 text-destructive",
 };
 
 export default function AdminCreators() {
   const [creators, setCreators] = useState<Creator[]>(initialCreators);
   const [searchQuery, setSearchQuery] = useState("");
 
   const filteredCreators = creators.filter(
     (creator) =>
       creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       creator.email.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const handleChangeStatus = (creatorId: string, newStatus: "active" | "pending" | "suspended") => {
     setCreators(creators.map((c) => (c.id === creatorId ? { ...c, status: newStatus } : c)));
     toast.success("Creator status updated");
   };
 
   const handleSuspend = (creator: Creator) => {
     setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "suspended" } : c)));
     toast.success(`${creator.name} has been suspended`);
   };
 
   const handleActivate = (creator: Creator) => {
     setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "active" } : c)));
     toast.success(`${creator.name} has been activated`);
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Manage Creators"
           subtitle="View and manage creator accounts"
         />
 
         {/* Actions Bar */}
         <div className="flex items-center justify-between mb-6">
           <div className="relative w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search creators..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>
 
           <div className="flex items-center gap-3">
             <span className="text-sm text-muted-foreground">
               {filteredCreators.length} creators
             </span>
           </div>
         </div>
 
         {/* Creators Table */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card overflow-hidden"
         >
           <table className="w-full">
             <thead className="bg-muted/50">
               <tr>
                 <th className="text-left p-4 font-medium text-muted-foreground">Creator</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Followers</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Engagement</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Campaigns</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Earnings</th>
                 <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredCreators.map((creator) => (
                 <tr key={creator.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-3">
                       <img
                         src={creator.avatar}
                         alt={creator.name}
                         className="w-10 h-10 rounded-xl object-cover"
                       />
                       <div>
                         <div className="font-medium">{creator.name}</div>
                         <div className="text-sm text-muted-foreground">{creator.email}</div>
                       </div>
                     </div>
                   </td>
                   <td className="p-4 font-medium">{creator.followers}</td>
                   <td className="p-4">
                     <span className="text-success font-medium">{creator.engagement}</span>
                   </td>
                   <td className="p-4">
                     <Select
                       value={creator.status}
                       onValueChange={(value: "active" | "pending" | "suspended") =>
                         handleChangeStatus(creator.id, value)
                       }
                     >
                       <SelectTrigger className={`w-32 h-8 text-xs font-medium capitalize ${statusColors[creator.status]}`}>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="active">Active</SelectItem>
                         <SelectItem value="pending">Pending</SelectItem>
                         <SelectItem value="suspended">Suspended</SelectItem>
                       </SelectContent>
                     </Select>
                   </td>
                   <td className="p-4">{creator.campaigns}</td>
                   <td className="p-4 font-medium">{creator.earnings}</td>
                   <td className="p-4">
                     <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="icon">
                         <Eye className="w-4 h-4" />
                       </Button>
                       {creator.status === "suspended" ? (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="text-success hover:text-success"
                           onClick={() => handleActivate(creator)}
                         >
                           <CheckCircle className="w-4 h-4" />
                         </Button>
                       ) : (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="text-destructive hover:text-destructive"
                           onClick={() => handleSuspend(creator)}
                         >
                           <Ban className="w-4 h-4" />
                         </Button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
 
           {filteredCreators.length === 0 && (
             <div className="p-12 text-center">
               <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="font-semibold mb-2">No creators found</h3>
               <p className="text-muted-foreground text-sm">
                 Try adjusting your search
               </p>
             </div>
           )}
         </motion.div>
       </main>
     </div>
   );
 }