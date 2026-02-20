import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Eye, Ban, CheckCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreatorDetailsDialog } from "@/components/admin/CreatorDetailsDialog";

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
  // Additional fields for details view
  location?: string;
  phone?: string;
  bio?: string;
  socialHandles?: { instagram?: string; tiktok?: string };
  categories?: string[];
  // Onboarding fields
  contentTypes?: string[];
  contentFormats?: string[]; // NEW
  vibes?: string[]; // NEW
  whoAppearsInContent?: string[];
  experienceTime?: string;
  collaborationPreference?: string;
  hasBrandExperience?: boolean;
  onboardingCompleted?: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  suspended: "bg-destructive/10 text-destructive",
};

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "creator"));
      const querySnapshot = await getDocs(q);

      const appsSnapshot = await getDocs(collection(db, "applications"));
      const allApps = await Promise.all(appsSnapshot.docs.map(async docSnap => {
        const appData = docSnap.data();
        if (appData.campaignId) return { id: docSnap.id, ...appData };
        return { id: docSnap.id, ...appData };
      }));

      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const campaignMap: Record<string, string> = {};
      campaignsSnapshot.docs.forEach(docSnap => {
        campaignMap[docSnap.id] = docSnap.data().title || docSnap.data().name || "Untitled";
      });

      const enrichedApps = allApps
        .map(app => ({
          ...app,
          campaignTitle: campaignMap[app.campaignId] || "Unknown Campaign"
        }))
        .filter(app => app.campaignTitle !== "Unknown Campaign");

      setApplications(enrichedApps);

      const appCounts: Record<string, number> = {};
      enrichedApps.forEach(app => {
        if (app.creatorId && app.status === 'approved') {
          appCounts[app.creatorId] = (appCounts[app.creatorId] || 0) + 1;
        }
      });

      const creatorsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();

        const followersCount = data.instagramMetrics?.followers || data.instagramFollowers || 0;
        const engagementRate = data.instagramMetrics?.engagementRate || data.engagementRate || 0;

        return {
          id: docSnap.id,
          name: data.displayName || data.name || "Unknown Creator",
          email: data.email || "",
          avatar: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          followers: followersCount > 0 ? `${(followersCount / 1000).toFixed(1)}K` : "0",
          engagement: engagementRate > 0 ? `${parseFloat(engagementRate).toFixed(2)}%` : "0%",
          status: data.status || "active",
          campaigns: appCounts[docSnap.id] || 0,
          earnings: "$0", // Placeholder
          // Extra data
          location: data.location,
          phone: data.phone,
          bio: data.bio,
          socialHandles: data.socialHandles,
          categories: data.categories,
          // Onboarding fields for pending approval
          contentTypes: data.contentTypes,
          contentFormats: data.contentFormats || [], // Extract new field
          vibes: data.vibes || [], // Extract new field
          whoAppearsInContent: data.whoAppearsInContent,
          experienceTime: data.experienceTime,
          collaborationPreference: data.collaborationPreference,
          hasBrandExperience: data.hasBrandExperience,
          onboardingCompleted: data.onboardingCompleted
        } as Creator;
      });
      setCreators(creatorsData);
    } catch (error) {
      console.error("Error fetching creators:", error);
      toast.error("Failed to load creators");
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");

  const filteredCreators = creators.filter(
    (creator) => {
      const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || creator.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const handleChangeStatus = async (creatorId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", creatorId), { status: newStatus });
      setCreators(creators.map((c) => (c.id === creatorId ? { ...c, status: newStatus as any } : c)));
      toast.success("Creator status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSuspend = async (creator: Creator) => {
    if (!confirm(`Are you sure you want to suspend ${creator.name}?`)) return;
    try {
      await updateDoc(doc(db, "users", creator.id), { status: "suspended" });
      setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "suspended" } : c)));
      toast.success(`${creator.name} has been suspended`);
    } catch (error) {
      console.error("Error suspending creator:", error);
      toast.error("Failed to suspend creator");
    }
  };

  const handleActivate = async (creator: Creator) => {
    try {
      await updateDoc(doc(db, "users", creator.id), { status: "active" });
      setCreators(creators.map((c) => (c.id === creator.id ? { ...c, status: "active" } : c)));
      toast.success(`${creator.name} has been activated`);
    } catch (error) {
      console.error("Error activating creator:", error);
      toast.error("Failed to activate creator");
    }
  };

  const handleViewDetails = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Manage Creators"
          subtitle="View and manage creator accounts"
        />

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: "all" as const, label: "Todos", count: creators.length },
            { key: "active" as const, label: "Activos", count: creators.filter(c => c.status === "active").length },
            { key: "pending" as const, label: "Pendientes", count: creators.filter(c => c.status === "pending").length },
            { key: "suspended" as const, label: "Suspendidos", count: creators.filter(c => c.status === "suspended").length }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <Badge variant={statusFilter === tab.key ? "secondary" : "outline"} className="ml-1">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

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
                <th className="text-left p-4 font-medium text-muted-foreground">Active Collabs</th>
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
                      <SelectTrigger className={`w-32 h-8 text-xs font-medium capitalize ${statusColors[creator.status] || "bg-muted"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-center">{creator.campaigns}</td>
                  <td className="p-4 font-medium">{creator.earnings}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(creator)}>
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

        {/* Creator Details Dialog */}
        <CreatorDetailsDialog
          creator={selectedCreator}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          applications={applications}
        />

      </main>
    </div>
  );
}