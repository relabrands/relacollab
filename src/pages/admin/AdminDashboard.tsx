import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
  Loader2,
  Trash2,
  Settings,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where, writeBatch, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
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
import { usePlatformConfig } from "@/hooks/usePlatformConfig";

export default function AdminDashboard() {
  const { config, loading: configLoading } = usePlatformConfig();
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Payout Management State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Settings State
  const [feePercent, setFeePercent] = useState(10);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [stats, setStats] = useState<{
    title: string;
    value: string | number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: any;
    iconColor: "primary" | "accent" | "success";
  }[]>([
    {
      title: "Total Brands",
      value: 0,
      change: "0 this month",
      changeType: "neutral",
      icon: Building2,
      iconColor: "primary",
    },
    {
      title: "Active Creators",
      value: 0,
      change: "0 this week",
      changeType: "neutral",
      icon: Users,
      iconColor: "accent",
    },
    {
      title: "Active Campaigns",
      value: 0,
      change: "0 this month",
      changeType: "positive", // Hardcoded for now
      icon: FileText,
      iconColor: "success",
    },
    {
      title: "Monthly Revenue",
      value: "$0",
      change: "+0% vs last month",
      changeType: "positive",
      icon: DollarSign,
      iconColor: "primary",
    },
  ]);
  const [recentBrands, setRecentBrands] = useState<any[]>([]);

  useEffect(() => {
    if (!configLoading) {
      setFeePercent(config.serviceFeePercent);
    }
  }, [config, configLoading]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch Users count
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => doc.data());

        const brandCount = users.filter(u => u.role === 'brand').length;
        const creators = users.filter(u => u.role === 'creator');
        const creatorCount = creators.length;

        // Fetch Campaigns count
        const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
        const campaignCount = campaignsSnapshot.size;

        setStats(prev => [
          { ...prev[0], value: brandCount, change: `Total registered` },
          { ...prev[1], value: creatorCount, change: `Total registered` },
          { ...prev[2], value: campaignCount, change: `Total active` },
          { ...prev[3], value: "$0" } // Placeholder
        ]);

        // Recent Brands
        const brandsQuery = query(
          collection(db, "users"),
          where("role", "==", "brand"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const brandsSnap = await getDocs(brandsQuery);
        setRecentBrands(brandsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().brandName || doc.data().displayName || "Unnamed Brand",
          plan: doc.data().plan || "Free",
          status: "active", // Mock status
          joined: new Date(doc.data().createdAt).toLocaleDateString()
        })));

        // Fetch Payouts (admin pays creators directly — status: pending or requested)
        const payoutQuery = query(
          collection(db, "payouts"),
          where("status", "in", ["pending", "requested"])
        );
        const payoutSnap = await getDocs(payoutQuery);
        setPayouts(payoutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "platform_config"), {
        serviceFeePercent: Number(feePercent),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout || !paymentReceiptUrl) return;
    setIsProcessingPayment(true);
    try {
      await updateDoc(doc(db, "payouts", selectedPayout.id), {
        status: 'paid',
        creatorPaymentReceipt: paymentReceiptUrl,
        paidAt: new Date().toISOString()
      });
      setPayouts(prev => prev.filter(p => p.id !== selectedPayout.id));
      setIsPaymentModalOpen(false);
      setSelectedPayout(null);
      setPaymentReceiptUrl("");
      toast.success("✅ Payout marked as paid! Creator will see it in Earnings.");
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Mark payout as ready (skip the old brand-payment verification flow)
  const handleMarkReadyToWithdraw = async (payoutId: string) => {
    try {
      await updateDoc(doc(db, "payouts", payoutId), {
        status: 'ready_to_withdraw',
        readyAt: new Date().toISOString()
      });
      setPayouts(prev => prev.filter(p => p.id !== payoutId));
      toast.success("Creator can now request withdrawal!");
    } catch (error) {
      toast.error("Failed to update payout");
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const collectionsToReset = ["campaigns", "matches", "invitations", "jobs", "submissions"];

      for (const colName of collectionsToReset) {
        const q = query(collection(db, colName)); // Get all docs
        const snapshot = await getDocs(q);

        // Delete in batches of 500
        const batches = [];
        let batch = writeBatch(db);
        let count = 0;

        for (const docSnapshot of snapshot.docs) {
          batch.delete(docSnapshot.ref);
          count++;
          if (count >= 400) { // Safety margin below 500
            batches.push(batch.commit());
            batch = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) {
          batches.push(batch.commit());
        }

        await Promise.all(batches);
        console.log(`Deleted all documents in ${colName}`);
      }

      toast.success("Database reset successfully", {
        description: "All campaigns, matches, and proposals have been deleted."
      });

      // Refresh Data
      setStats(prev => prev.map(s => ({ ...s, value: s.title.includes("Revenue") ? s.value : 0 })));
      setRecentBrands([]);

    } catch (error) {
      console.error("Error resetting database:", error);
      toast.error("Failed to reset database");
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  const planColors: Record<string, string> = {
    Basic: "bg-muted text-muted-foreground",
    Starter: "bg-primary/10 text-primary",
    Enterprise: "bg-accent/10 text-accent",
    Free: "bg-gray-100 text-gray-500"
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    inactive: "bg-destructive/10 text-destructive",
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-start mb-8">
          <DashboardHeader
            title="Admin Dashboard"
            subtitle="Platform overview and management"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => document.getElementById("settings-section")?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsResetDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset Database
            </Button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all:
                <ul className="list-disc list-inside mt-2 font-medium">
                  <li>Active Campaigns</li>
                  <li>Matches & Proposals</li>
                  <li>Jobs & Submissions</li>
                </ul>
                User accounts (Brands/Creators) will NOT be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetDatabase}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Yes, Wipe Data"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/brands" className="glass-card p-6 hover-lift cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Manage Brands</h3>
                <p className="text-sm text-muted-foreground">Add, edit, or remove brands</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Link>

          <Link to="/admin/creators" className="glass-card p-6 hover-lift cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Manage Creators</h3>
                <p className="text-sm text-muted-foreground">View and manage creator accounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Link>

          <Link to="/admin/subscriptions" className="glass-card p-6 hover-lift cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Subscriptions</h3>
                <p className="text-sm text-muted-foreground">Manage plans and billing</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Brands */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Brands</h2>
          <Link to="/admin/brands">
            <Button variant="ghost">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="glass-card overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBrands.length > 0 ? recentBrands.map((brand) => (
                <tr key={brand.id} className="border-t border-border">
                  <td className="p-4 font-medium">{brand.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${planColors[brand.plan as keyof typeof planColors] || planColors.Free}`}>
                      {brand.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[brand.status as keyof typeof statusColors]}`}>
                      {brand.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{brand.joined}</td>
                  <td className="p-4 text-right">
                    <Link to="/admin/brands">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No brands found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payout Management */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Payout Management</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <Tabs defaultValue="pending">
              <TabsList className="mb-6">
                <TabsTrigger value="pending">
                  Por Pagar
                  {payouts.filter(p => p.status === 'pending').length > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {payouts.filter(p => p.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests">
                  Retiros Solicitados
                  {payouts.filter(p => p.status === 'requested').length > 0 && (
                    <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {payouts.filter(p => p.status === 'requested').length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Pending (content approved, awaiting admin payment) */}
              <TabsContent value="pending">
                <div className="space-y-4">
                  {payouts.filter(p => p.status === 'pending').length > 0 ? (
                    payouts.filter(p => p.status === 'pending').map(payout => (
                      <div key={payout.id} className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          {/* Creator info */}
                          <div className="flex items-center gap-3">
                            {payout.creatorAvatar ? (
                              <img src={payout.creatorAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {(payout.creatorName || "C").charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{payout.creatorName || payout.creatorId}</p>
                              <p className="text-xs text-muted-foreground">{payout.campaignName}</p>
                            </div>
                          </div>
                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-primary">${payout.netAmount?.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Bruto: ${payout.grossAmount?.toLocaleString()} • Fee: ${payout.feeAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Bank account details */}
                        {payout.creatorBankAccount && (
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-sm space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Cuenta del Creator</p>
                            <p><span className="text-muted-foreground">Banco:</span> <strong>{payout.creatorBankAccount.bankName}</strong></p>
                            <p><span className="text-muted-foreground">Cuenta:</span> <strong>{payout.creatorBankAccount.accountNumber}</strong></p>
                            {payout.creatorBankAccount.accountHolder && (
                              <p><span className="text-muted-foreground">Titular:</span> {payout.creatorBankAccount.accountHolder}</p>
                            )}
                          </div>
                        )}

                        <Button
                          className="w-full bg-success hover:bg-success/90"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marcar como Pagado al Creator
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No hay pagos pendientes.</p>
                  )}
                </div>
              </TabsContent>

              {/* Requested (creator pressed "Request Payout") */}
              <TabsContent value="requests">
                <div className="space-y-4">
                  {payouts.filter(p => p.status === 'requested').length > 0 ? (
                    payouts.filter(p => p.status === 'requested').map(payout => (
                      <div key={payout.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border gap-4">
                        <div className="flex items-center gap-3">
                          {payout.creatorAvatar ? (
                            <img src={payout.creatorAvatar} className="w-9 h-9 rounded-full object-cover ring-2 ring-border" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {(payout.creatorName || "C").charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{payout.creatorName || payout.creatorId}</p>
                            <p className="text-xs text-muted-foreground">{payout.campaignName}</p>
                            <p className="text-xs text-primary font-medium mt-0.5">${payout.netAmount?.toLocaleString()} neto</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedPayout(payout);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagar
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No hay retiros solicitados.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>


        {/* Platform Settings */}
        <div id="settings-section" className="glass-card p-6 max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Platform Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Fee Percentage (%)</Label>
              <Input
                type="number"
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                This fee is automatically deducted from creator payments and displayed to brands.
              </p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full"
            >
              {isSavingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </div>
      </main>

      {/* Payment Confirmation Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout execution</DialogTitle>
            <DialogDescription>
              Marking this payout as complete. Please upload or paste the receipt URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label>Receipt URL / Transaction ID</Label>
            <Input
              placeholder="https://..."
              value={paymentReceiptUrl}
              onChange={(e) => setPaymentReceiptUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessPayout} disabled={isProcessingPayment || !paymentReceiptUrl}>
              {isProcessingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}