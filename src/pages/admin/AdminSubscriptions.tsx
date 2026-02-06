import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Check,
  CreditCard,
  Trash2,
  Zap,
  Crown,
  Copy,
  Archive,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Plan {
  id: string;
  name: string;
  price: number; // Monthly price in USD
  credits: number; // Credits included per month
  stripePriceId: string;
  costPerExtraCredit: number;
  features: string[];
  active: boolean;
  interval: "month" | "year";
}

const defaultPlan: Omit<Plan, "id"> = {
  name: "",
  price: 0,
  credits: 0,
  stripePriceId: "",
  costPerExtraCredit: 0,
  features: ["Access to Creator Database", "Basic Analytics"],
  active: true,
  interval: "month"
};

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
        stripePriceId: plan.stripePriceId,
        costPerExtraCredit: plan.costPerExtraCredit,
        features: plan.features,
        active: plan.active,
        interval: plan.interval
      });
    } else {
      setEditingPlan(null);
      setFormData(defaultPlan);
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        // Update
        await updateDoc(doc(db, "plans", editingPlan.id), formData);
        toast.success("Plan updated successfully");
      } else {
        // Create
        await addDoc(collection(db, "plans"), {
          ...formData,
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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Plan & Pricing Configuration"
          subtitle="Manage platform tiers, credit allocations, and Stripe connections."
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

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {plan.interval === "year" ? "Yearly" : "Monthly"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plan.price}</div>
                      <div className="text-xs text-muted-foreground">USD / mo</div>
                    </div>
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

                  {/* Stripe ID */}
                  <div className="mb-6">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Stripe Price ID</Label>
                    <div
                      className="flex items-center justify-between text-xs bg-muted p-2 rounded cursor-pointer hover:bg-muted/80 transition-colors group"
                      onClick={() => copyToClipboard(plan.stripePriceId)}
                      title="Click to copy"
                    >
                      <span className="font-mono truncate mr-2">{plan.stripePriceId || "Not configured"}</span>
                      <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-1 space-y-2 mb-6">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Features</Label>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
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
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan Configuration" : "Create New Subscription Plan"}</DialogTitle>
              <DialogDescription>
                Configure the pricing, credits, and features for this tier.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
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
                <div className="space-y-2">
                  <Label htmlFor="extraCost">Cost per Extra Credit ($)</Label>
                  <Input
                    id="extraCost"
                    type="number"
                    placeholder="150"
                    value={formData.costPerExtraCredit}
                    onChange={(e) => setFormData({ ...formData, costPerExtraCredit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeId">Stripe Product/Price ID</Label>
                <Input
                  id="stripeId"
                  placeholder="price_H8..."
                  value={formData.stripePriceId}
                  onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Plan Features</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFeature()}
                  />
                  <Button type="button" onClick={addFeature} variant="secondary">Add</Button>
                </div>
                <div className="space-y-2 mt-3 max-h-[150px] overflow-y-auto pr-2">
                  {formData.features.map((feature, index) => (
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
                  {formData.features.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No features added yet.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSavePlan}>
                {editingPlan ? "Update Plan Configuration" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}