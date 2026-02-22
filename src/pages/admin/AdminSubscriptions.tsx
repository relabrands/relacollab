import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import {
  Edit,
  Plus,
  CreditCard,
  Trash2,
  Zap,
  Copy,
  Archive,
  RotateCcw,
  Shield,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Plan {
  id: string;
  name: string;
  price: number; // Monthly price in USD
  credits: number; // Credits included per month
  costPerExtraCredit: number;
  features: string[]; // Display text features
  permissions: string[]; // Functional permissions
  active: boolean;
  interval: "month" | "year";
  isFree: boolean; // Verification check for free trial/plan
}

const defaultPlan: Omit<Plan, "id"> = {
  name: "",
  price: 0,
  credits: 0,
  costPerExtraCredit: 0,
  features: ["Access to Creator Database", "Basic Analytics"],
  permissions: ["view_creators"],
  active: true,
  interval: "month",
  isFree: false
};

const AVAILABLE_PERMISSIONS = [
  { id: "view_creators", label: "View Creator Database" },
  { id: "create_campaigns", label: "Create Campaigns" },
  { id: "advanced_analytics", label: "Access Advanced Analytics" },
  { id: "export_data", label: "Export Data (CSV/PDF)" },
  { id: "priority_support", label: "Priority Support" },
  { id: "api_access", label: "API Access" },
  { id: "invite_team", label: "Invite Team Members" }
];

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null); // Null means creating new
  const [formData, setFormData] = useState<Omit<Plan, "id">>(defaultPlan);

  // Feature Input State
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "plans"), orderBy("price", "asc"));
      const snapshot = await getDocs(q);
      const fetchedPlans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        credits: plan.credits,
        costPerExtraCredit: plan.costPerExtraCredit,
        features: plan.features || [],
        permissions: plan.permissions || [],
        active: plan.active,
        interval: plan.interval,
        isFree: plan.isFree || false
      });
    } else {
      setEditingPlan(null);
      setFormData(defaultPlan);
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      const planData = {
        ...formData,
        // Ensure nulls/undefineds are handled
        price: formData.isFree ? 0 : formData.price
      };

      if (editingPlan) {
        // Update
        await updateDoc(doc(db, "plans", editingPlan.id), planData);
        toast.success("Plan updated successfully");
      } else {
        // Create
        await addDoc(collection(db, "plans"), {
          ...planData,
          createdAt: new Date().toISOString()
        });
        toast.success("New plan created");
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      await updateDoc(doc(db, "plans", plan.id), {
        active: !plan.active
      });
      toast.success(`Plan ${plan.active ? "archived" : "activated"}`);
      fetchPlans();
    } catch (error) {
      console.error("Error toggling plan:", error);
      toast.error("Failed to update status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(permissionId)) {
        return { ...prev, permissions: current.filter(p => p !== permissionId) };
      } else {
        return { ...prev, permissions: [...current, permissionId] };
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Plan & Pricing Configuration"
          subtitle="Manage platform tiers, credit allocations, and permissions."
        />

        {/* Actions */}
        <div className="flex justify-end mb-8">
          <Button variant="hero" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground mb-4">No subscription plans configured yet.</p>
            <Button variant="outline" onClick={() => handleOpenDialog()}>Create First Plan</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card relative overflow-hidden flex flex-col ${!plan.active ? "opacity-60 grayscale" : ""}`}
              >
                {!plan.active && (
                  <div className="absolute top-0 left-0 right-0 bg-muted text-center text-xs py-1 font-medium z-10">
                    ARCHIVED
                  </div>
                )}

                {plan.isFree && (
                  <div className="absolute top-0 right-0 p-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Free / Trial</Badge>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {plan.interval === "year" ? "Yearly" : "Monthly"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-4">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ {plan.interval}</span>
                  </div>

                  {/* Credit Allocation */}
                  <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">{plan.credits} Credits</div>
                        <div className="text-xs text-muted-foreground">per month included</div>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Preview */}
                  {plan.permissions && plan.permissions.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Permissions</Label>
                      <div className="flex flex-wrap gap-1">
                        {plan.permissions.slice(0, 3).map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{p.replace(/_/g, " ")}</Badge>
                        ))}
                        {plan.permissions.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">+{plan.permissions.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}


                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/20 flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => handleOpenDialog(plan)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={plan.active ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-primary hover:text-primary hover:bg-primary/10"}
                    onClick={() => handleToggleStatus(plan)}
                  >
                    {plan.active ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan Configuration" : "Create New Subscription Plan"}</DialogTitle>
              <DialogDescription>
                Configure pricing, credits, and system permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Free / Paid Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Free / Trial Plan</div>
                    <div className="text-xs text-muted-foreground">Does not require payment method</div>
                  </div>
                </div>
                <Switch
                  checked={formData.isFree}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Starter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="49"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    disabled={formData.isFree}
                    className={formData.isFree ? "opacity-50" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Monthly Credits included</Label>
                  <Input
                    id="credits"
                    type="number"
                    placeholder="4"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  System Permissions
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <div key={perm.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={(formData.permissions || []).includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Label
                        htmlFor={`perm-${perm.id}`}
                        className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-0.5"
                      >
                        {perm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Features Section */}
              <div className="space-y-2 border-t pt-4">
                <Label>Display Features (Marketing List)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature text..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFeature()}
                  />
                  <Button type="button" onClick={addFeature} variant="secondary">Add</Button>
                </div>
                <div className="space-y-2 mt-3 max-h-[150px] overflow-y-auto pr-2">
                  {formData.features?.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md text-sm group">
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSavePlan}>
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}