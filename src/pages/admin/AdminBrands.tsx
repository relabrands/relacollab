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
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { motion } from "framer-motion";
 import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
 import { toast } from "sonner";
 
 interface Brand {
   id: string;
   name: string;
   email: string;
   plan: "Basic" | "Starter" | "Enterprise";
   status: "active" | "pending" | "inactive";
   campaigns: number;
   joined: string;
 }
 
 const initialBrands: Brand[] = [
   { id: "1", name: "Sunrise Cafe", email: "hello@sunrisecafe.com", plan: "Enterprise", status: "active", campaigns: 12, joined: "Feb 1, 2024" },
   { id: "2", name: "FitLife Gym", email: "contact@fitlifegym.com", plan: "Starter", status: "active", campaigns: 5, joined: "Jan 28, 2024" },
   { id: "3", name: "Organic Market", email: "info@organicmarket.com", plan: "Basic", status: "pending", campaigns: 2, joined: "Jan 25, 2024" },
   { id: "4", name: "Yoga Studio One", email: "namaste@yogastudio.com", plan: "Starter", status: "active", campaigns: 8, joined: "Jan 20, 2024" },
   { id: "5", name: "Green Smoothie Co", email: "hello@greensmoothie.com", plan: "Basic", status: "active", campaigns: 3, joined: "Jan 15, 2024" },
   { id: "6", name: "Boutique Hotel LA", email: "reservations@boutiquehotel.com", plan: "Enterprise", status: "active", campaigns: 15, joined: "Jan 10, 2024" },
 ];
 
 const planColors = {
   Basic: "bg-muted text-muted-foreground",
   Starter: "bg-primary/10 text-primary",
   Enterprise: "bg-accent/10 text-accent",
 };
 
 const statusColors = {
   active: "bg-success/10 text-success",
   pending: "bg-warning/10 text-warning",
   inactive: "bg-destructive/10 text-destructive",
 };
 
 export default function AdminBrands() {
   const [brands, setBrands] = useState<Brand[]>(initialBrands);
   const [searchQuery, setSearchQuery] = useState("");
   const [isAddOpen, setIsAddOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
   const [newBrand, setNewBrand] = useState({
     name: "",
     email: "",
     plan: "Basic" as "Basic" | "Starter" | "Enterprise",
   });
 
   const filteredBrands = brands.filter(
     (brand) =>
       brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       brand.email.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const handleAddBrand = () => {
     if (!newBrand.name || !newBrand.email) {
       toast.error("Please fill in all fields");
       return;
     }
 
     const brand: Brand = {
       id: Date.now().toString(),
       name: newBrand.name,
       email: newBrand.email,
       plan: newBrand.plan,
       status: "pending",
       campaigns: 0,
       joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
     };
 
     setBrands([brand, ...brands]);
     setNewBrand({ name: "", email: "", plan: "Basic" });
     setIsAddOpen(false);
     toast.success(`${brand.name} has been added successfully`);
   };
 
   const handleEditBrand = () => {
     if (!selectedBrand) return;
 
     setBrands(brands.map((b) => (b.id === selectedBrand.id ? selectedBrand : b)));
     setIsEditOpen(false);
     toast.success(`${selectedBrand.name} has been updated`);
   };
 
   const handleDeleteBrand = (brand: Brand) => {
     setBrands(brands.filter((b) => b.id !== brand.id));
     toast.success(`${brand.name} has been removed`);
   };
 
   const handleChangePlan = (brandId: string, newPlan: "Basic" | "Starter" | "Enterprise") => {
     setBrands(brands.map((b) => (b.id === brandId ? { ...b, plan: newPlan } : b)));
     toast.success("Subscription plan updated");
   };
 
   const handleChangeStatus = (brandId: string, newStatus: "active" | "pending" | "inactive") => {
     setBrands(brands.map((b) => (b.id === brandId ? { ...b, status: newStatus } : b)));
     toast.success("Status updated");
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="Manage Brands"
           subtitle="Add, edit, and manage brand accounts"
         />
 
         {/* Actions Bar */}
         <div className="flex items-center justify-between mb-6">
           <div className="relative w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search brands..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>
 
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
             <DialogTrigger asChild>
               <Button variant="hero">
                 <Plus className="w-4 h-4" />
                 Add Brand
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add New Brand</DialogTitle>
                 <DialogDescription>
                   Create a new brand account on the platform
                 </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div>
                   <Label htmlFor="brand-name">Brand Name</Label>
                   <Input
                     id="brand-name"
                     placeholder="e.g., Sunrise Cafe"
                     value={newBrand.name}
                     onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="brand-email">Email Address</Label>
                   <Input
                     id="brand-email"
                     type="email"
                     placeholder="hello@brand.com"
                     value={newBrand.email}
                     onChange={(e) => setNewBrand({ ...newBrand, email: e.target.value })}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label>Subscription Plan</Label>
                   <Select
                     value={newBrand.plan}
                     onValueChange={(value: "Basic" | "Starter" | "Enterprise") =>
                       setNewBrand({ ...newBrand, plan: value })
                     }
                   >
                     <SelectTrigger className="mt-2">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Basic">Basic - $49/month</SelectItem>
                       <SelectItem value="Starter">Starter - $149/month</SelectItem>
                       <SelectItem value="Enterprise">Enterprise - $499/month</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                   Cancel
                 </Button>
                 <Button variant="hero" onClick={handleAddBrand}>
                   Add Brand
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Brands Table */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card overflow-hidden"
         >
           <table className="w-full">
             <thead className="bg-muted/50">
               <tr>
                 <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                 <th className="text-left p-4 font-medium text-muted-foreground">Campaigns</th>
                 <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredBrands.map((brand) => (
                 <tr key={brand.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                         <Building2 className="w-5 h-5 text-primary" />
                       </div>
                       <span className="font-medium">{brand.name}</span>
                     </div>
                   </td>
                   <td className="p-4 text-muted-foreground">{brand.email}</td>
                   <td className="p-4">
                     <Select
                       value={brand.plan}
                       onValueChange={(value: "Basic" | "Starter" | "Enterprise") =>
                         handleChangePlan(brand.id, value)
                       }
                     >
                       <SelectTrigger className={`w-32 h-8 text-xs font-medium ${planColors[brand.plan]}`}>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Basic">Basic</SelectItem>
                         <SelectItem value="Starter">Starter</SelectItem>
                         <SelectItem value="Enterprise">Enterprise</SelectItem>
                       </SelectContent>
                     </Select>
                   </td>
                   <td className="p-4">
                     <Select
                       value={brand.status}
                       onValueChange={(value: "active" | "pending" | "inactive") =>
                         handleChangeStatus(brand.id, value)
                       }
                     >
                       <SelectTrigger className={`w-28 h-8 text-xs font-medium capitalize ${statusColors[brand.status]}`}>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="active">Active</SelectItem>
                         <SelectItem value="pending">Pending</SelectItem>
                         <SelectItem value="inactive">Inactive</SelectItem>
                       </SelectContent>
                     </Select>
                   </td>
                   <td className="p-4">{brand.campaigns}</td>
                   <td className="p-4">
                     <div className="flex items-center justify-end gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => {
                           setSelectedBrand(brand);
                           setIsEditOpen(true);
                         }}
                       >
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-destructive hover:text-destructive"
                         onClick={() => handleDeleteBrand(brand)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
 
           {filteredBrands.length === 0 && (
             <div className="p-12 text-center">
               <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="font-semibold mb-2">No brands found</h3>
               <p className="text-muted-foreground text-sm">
                 {searchQuery ? "Try adjusting your search" : "Add your first brand to get started"}
               </p>
             </div>
           )}
         </motion.div>
 
         {/* Edit Dialog */}
         <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Edit Brand</DialogTitle>
               <DialogDescription>
                 Update brand information
               </DialogDescription>
             </DialogHeader>
             {selectedBrand && (
               <div className="space-y-4 py-4">
                 <div>
                   <Label htmlFor="edit-name">Brand Name</Label>
                   <Input
                     id="edit-name"
                     value={selectedBrand.name}
                     onChange={(e) =>
                       setSelectedBrand({ ...selectedBrand, name: e.target.value })
                     }
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="edit-email">Email Address</Label>
                   <Input
                     id="edit-email"
                     type="email"
                     value={selectedBrand.email}
                     onChange={(e) =>
                       setSelectedBrand({ ...selectedBrand, email: e.target.value })
                     }
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label>Subscription Plan</Label>
                   <Select
                     value={selectedBrand.plan}
                     onValueChange={(value: "Basic" | "Starter" | "Enterprise") =>
                       setSelectedBrand({ ...selectedBrand, plan: value })
                     }
                   >
                     <SelectTrigger className="mt-2">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Basic">Basic - $49/month</SelectItem>
                       <SelectItem value="Starter">Starter - $149/month</SelectItem>
                       <SelectItem value="Enterprise">Enterprise - $499/month</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             )}
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                 Cancel
               </Button>
               <Button variant="hero" onClick={handleEditBrand}>
                 Save Changes
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </main>
     </div>
   );
 }