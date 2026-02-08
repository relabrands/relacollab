import { useState, useEffect } from "react";
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
import { Search, Eye, Ban, CheckCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  suspended: "bg-destructive/10 text-destructive",
};

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "creator"));
      const querySnapshot = await getDocs(q);

      // Fetch applications to count active/completed campaigns per creator
      const appsSnapshot = await getDocs(collection(db, "applications"));
      const appCounts: Record<string, number> = {};
      appsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.creatorId && data.status === 'approved') {
          appCounts[data.creatorId] = (appCounts[data.creatorId] || 0) + 1;
        }
      });

      const creatorsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.name || "Unknown Creator",
          email: data.email || "",
          avatar: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          followers: data.instagramFollowers ? `${(data.instagramFollowers / 1000).toFixed(1)}K` : "0",
          engagement: data.engagementRate ? `${data.engagementRate}%` : "0%",
          status: data.status || "active",
          campaigns: appCounts[doc.id] || 0,
          earnings: "$0" // Placeholder until payments are implemented
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

  const filteredCreators = creators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.email.toLowerCase().includes(searchQuery.toLowerCase())
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