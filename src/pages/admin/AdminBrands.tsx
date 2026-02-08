import { useState, useEffect } from "react";
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
import { Plus, Search, Edit, Trash2, Building2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BrandDetailsDialog } from "@/components/admin/BrandDetailsDialog";

interface Brand {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: "active" | "pending" | "inactive";
  campaigns: number;
  joined: string;
  // Extra fields for details
  avatar?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  phone?: string;
  bio?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  inactive: "bg-destructive/10 text-destructive",
};

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Dynamic Plans State
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Details Dialog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // New Brand State (Conceptual - requires Auth creation separately)
  const [newBrand, setNewBrand] = useState({
    name: "",
    email: "",
    plan: "Basic",
  });

  useEffect(() => {
    fetchBrands();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const q = query(collection(db, "plans"), orderBy("price", "asc"));
      const snapshot = await getDocs(q);
      const plans = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        credits: doc.data().credits,
        permissions: doc.data().permissions
      }));
      setAvailablePlans(plans);
    } catch (e) {
      console.error("Error fetching plans", e);
    }
  };

  const fetchBrands = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "brand"));
      const querySnapshot = await getDocs(q);

      // Fetch campaigns to count them per brand
      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const campaignCounts: Record<string, number> = {};
      campaignsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.brandId) {
          campaignCounts[data.brandId] = (campaignCounts[data.brandId] || 0) + 1;
        }
      });

      const brandsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.brandName || data.displayName || "Unknown Brand",
          email: data.email || "",
          plan: data.plan || "Free",
          status: data.status || "active", // Default to active if missing
          campaigns: campaignCounts[doc.id] || 0,
          joined: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A",
          // Extra Details
          avatar: data.photoURL || data.avatar,
          website: data.website,
          industry: data.industry,
          companySize: data.companySize,
          location: data.location,
          phone: data.phone,
          bio: data.bio
        } as Brand;
      });

      setBrands(brandsData);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBrand = () => {
    // This implies creating a user, which usually requires Auth. 
    // For now, we'll just show a toast that feature needs Auth integration
    toast.info("To add a brand manually, uses the invitation flow or register page.");
    setIsAddOpen(false);
  };

  const handleEditBrand = async () => {
    if (!selectedBrand) return;

    try {
      await updateDoc(doc(db, "users", selectedBrand.id), {
        brandName: selectedBrand.name,
        email: selectedBrand.email, // Note: Changing email in Firestore doesn't change Auth email
        plan: selectedBrand.plan
      });

      setBrands(brands.map((b) => (b.id === selectedBrand.id ? selectedBrand : b)));
      setIsEditOpen(false);
      toast.success(`${selectedBrand.name} has been updated`);
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error("Failed to update brand");
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete ${brand.name}? This cannot be undone.`)) return;

    try {
      // Logic to delete user doc (Cloud function usually handles Auth deletion)
      await deleteDoc(doc(db, "users", brand.id));
      setBrands(brands.filter((b) => b.id !== brand.id));
      toast.success(`${brand.name} has been removed`);
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    }
  };

  /* Update handleChangePlan to sync with plan data */
  const handleChangePlan = async (brandId: string, newPlanName: string) => {
    try {
      // Find the plan details
      const planDetails = availablePlans.find(p => p.name === newPlanName);
      let updateData: any = { plan: newPlanName };

      // If we have details, update credits/permissions on the user profile too
      if (planDetails) {
        updateData = {
          ...updateData,
          credits: planDetails.credits || 0,
          permissions: planDetails.permissions || []
        };
      }

      await updateDoc(doc(db, "users", brandId), updateData);

      // Update local state
      setBrands(brands.map((b) => (b.id === brandId ? { ...b, plan: newPlanName } : b)));

      toast.success(`Plan updated to ${newPlanName}`);
      if (planDetails && planDetails.credits) {
        toast.info(`Credits updated to ${planDetails.credits}`);
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update subscription plan");
    }
  };

  const handleChangeStatus = async (brandId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", brandId), { status: newStatus });
      setBrands(brands.map((b) => (b.id === brandId ? { ...b, status: newStatus as any } : b)));
      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleViewDetails = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDetailsOpen(true);
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
                    onValueChange={(value) =>
                      setNewBrand({ ...newBrand, plan: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                      ))}
                      {/* Fallback option if no plans loaded */}
                      {availablePlans.length === 0 && <SelectItem value="Free">Free</SelectItem>}
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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {brand.avatar ? <img src={brand.avatar} alt={brand.name} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-primary" />}
                      </div>
                      <span className="font-medium">{brand.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{brand.email}</td>
                  <td className="p-4">
                    <Select
                      value={brand.plan}
                      onValueChange={(value) =>
                        handleChangePlan(brand.id, value)
                      }
                    >
                      <SelectTrigger className={`w-32 h-8 text-xs font-medium`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                        ))}
                        {/* Ensure current value is always an option to avoid UI bugs if plan is deprecated */}
                        {!availablePlans.find(p => p.name === brand.plan) && brand.plan && (
                          <SelectItem value={brand.plan}>{brand.plan}</SelectItem>
                        )}
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
                        onClick={() => handleViewDetails(brand)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
                    onValueChange={(value) =>
                      setSelectedBrand({ ...selectedBrand, plan: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                      ))}
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

        {/* Detail Dialog */}
        <BrandDetailsDialog
          brand={selectedBrand}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />

      </main>
    </div>
  );
}