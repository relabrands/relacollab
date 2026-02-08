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
import { Search, Eye, FileText, CheckCircle, XCircle, Trash2, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CampaignDetailsDialog } from "@/components/admin/CampaignDetailsDialog";

interface Campaign {
    id: string;
    title: string;
    brandName: string;
    brandId: string;
    status: "active" | "completed" | "draft" | "paused";
    budget: string;
    applications: number;
    createdAt: string;
    description?: string; // Add description for details view
}

const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    completed: "bg-primary/10 text-primary",
    draft: "bg-muted text-muted-foreground",
    paused: "bg-warning/10 text-warning",
};

export default function AdminCampaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Deletion State
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Details State
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const campaignsData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();

                // Fetch Brand Name if missing or ensure it is up to date
                let brandName = data.brandName || "Unknown Brand";
                if (data.brandId && (!data.brandName || data.brandName === "Unknown Brand")) {
                    try {
                        const brandDoc = await getDoc(doc(db, "users", data.brandId));
                        if (brandDoc.exists()) {
                            brandName = brandDoc.data().brandName || brandDoc.data().displayName || brandName;
                        }
                    } catch (e) {
                        console.error("Error fetching brand for campaign", e);
                    }
                }

                return {
                    id: docSnap.id,
                    title: data.name || data.title || "Untitled Campaign",
                    brandName: brandName,
                    brandId: data.brandId,
                    status: data.status || "draft",
                    budget: data.reward || data.budget || "N/A",
                    applications: data.applicationCount || 0,
                    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A",
                    description: data.description || ""
                } as Campaign;
            }));

            setCampaigns(campaignsData);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const filteredCampaigns = campaigns.filter(
        (campaign) =>
            campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            campaign.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChangeStatus = async (campaignId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "campaigns", campaignId), { status: newStatus });
            setCampaigns(campaigns.map((c) => (c.id === campaignId ? { ...c, status: newStatus as any } : c)));
            toast.success("Campaign status updated");
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const handleDeleteCampaign = async () => {
        if (!campaignToDelete) return;

        try {
            await deleteDoc(doc(db, "campaigns", campaignToDelete.id));
            setCampaigns(campaigns.filter((c) => c.id !== campaignToDelete.id));
            toast.success("Campaign deleted successfully");
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting campaign:", error);
            toast.error("Failed to delete campaign");
        }
    };

    const handleViewDetails = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setIsDetailsOpen(true);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 ml-64 p-8">
                <DashboardHeader
                    title="Manage Campaigns"
                    subtitle="View and manage all campaigns"
                />

                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Campaigns Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card overflow-hidden"
                >
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Campaign</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Budget</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Applications</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCampaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-medium max-w-[200px] truncate" title={campaign.title}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                {campaign.title}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                {campaign.brandName}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Select
                                                value={campaign.status}
                                                onValueChange={(value) => handleChangeStatus(campaign.id, value)}
                                            >
                                                <SelectTrigger className={`w-28 h-8 text-xs font-medium capitalize ${statusColors[campaign.status] || "bg-muted"}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="paused">Paused</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{campaign.budget}</td>
                                        <td className="p-4">{campaign.applications}</td>
                                        <td className="p-4 text-muted-foreground">{campaign.createdAt}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewDetails(campaign)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setCampaignToDelete(campaign);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredCampaigns.length === 0 && (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No campaigns found</h3>
                            <p className="text-muted-foreground text-sm">
                                There are no campaigns matching your search.
                            </p>
                        </div>
                    )}
                </motion.div>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Campaign</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{campaignToDelete?.title}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteCampaign}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Details Dialog */}
                <CampaignDetailsDialog
                    campaign={selectedCampaign}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                />

            </main>
        </div>
    );
}
