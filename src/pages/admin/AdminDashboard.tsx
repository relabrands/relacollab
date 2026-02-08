import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where, writeBatch } from "firebase/firestore";
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

        // Calculate Revenue (Mock for now, or sum budgets if available)
        // For now we keep it as placeholder or sum paid campaigns budget

        setStats(prev => [
          { ...prev[0], value: brandCount, change: `Total registered` },
          { ...prev[1], value: creatorCount, change: `Total registered` },
          { ...prev[2], value: campaignCount, change: `Total active` },
          { ...prev[3], value: "$0" } // Keep as placeholder until payments are real
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

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

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

          <Button
            variant="destructive"
            onClick={() => setIsResetDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset Database
          </Button>
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

        <div className="glass-card overflow-hidden">
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
      </main>
    </div>
  );
}