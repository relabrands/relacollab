import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
    Loader2,
    Building2,
    Mail,
    Calendar,
    CreditCard,
    FileText,
    MapPin,
    Globe,
    Phone,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BrandDetailsDialogProps {
    brand: any;
    isOpen: boolean;
    onClose: () => void;
}

export function BrandDetailsDialog({ brand, isOpen, onClose }: BrandDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        if (brand?.id && isOpen) {
            fetchBrandData();
        }
    }, [brand, isOpen]);

    const fetchBrandData = async () => {
        setLoading(true);
        try {
            if (!brand?.id) return;

            const q = query(
                collection(db, "campaigns"),
                where("brandId", "==", brand.id),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const campaignsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCampaigns(campaignsData);
        } catch (error) {
            console.error("Error fetching brand details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!brand) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {brand.avatar ? (
                                <img src={brand.avatar} alt={brand.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <Building2 className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {brand.name}
                                <Badge variant={brand.status === 'active' ? 'default' : 'secondary'} className="ml-2 capitalize">
                                    {brand.status}
                                </Badge>
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground mt-1 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> {brand.email}
                                </div>
                                {brand.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3 h-3" /> {brand.website}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="overview">Overview & Info</TabsTrigger>
                                <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <CreditCard className="w-5 h-5 text-primary mb-2" />
                                            <div className="text-xl font-bold">{brand.plan || "Free"}</div>
                                            <div className="text-xs text-muted-foreground">Current Plan</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <FileText className="w-5 h-5 text-blue-500 mb-2" />
                                            <div className="text-xl font-bold">{campaigns.length}</div>
                                            <div className="text-xs text-muted-foreground">Total Campaigns</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <Calendar className="w-5 h-5 text-green-500 mb-2" />
                                            <div className="text-xl font-bold">{brand.joined}</div>
                                            <div className="text-xs text-muted-foreground">Joined Date</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold mb-3">Company Details</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Industry</span>
                                                <span className="font-medium">{brand.industry || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Company Size</span>
                                                <span className="font-medium">{brand.companySize || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Location</span>
                                                <div className="flex items-center gap-1 font-medium">
                                                    {brand.location && <MapPin className="w-3 h-3 text-muted-foreground" />}
                                                    {brand.location || "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Phone</span>
                                                <div className="flex items-center gap-1 font-medium">
                                                    {brand.phone && <Phone className="w-3 h-3 text-muted-foreground" />}
                                                    {brand.phone || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-3">Brand Bio</h3>
                                        <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground min-h-[100px]">
                                            {brand.bio || "No biography provided."}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="campaigns" className="mt-0">
                                {loading ? (
                                    <div className="flex h-40 items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : campaigns.length > 0 ? (
                                    <div className="space-y-4">
                                        {campaigns.map((campaign) => (
                                            <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{campaign.name || campaign.title}</div>
                                                        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                                            <span>Created: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>Budget: {campaign.budget || campaign.reward || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={`capitalize ${campaign.status === 'active' ? 'text-green-600 bg-green-500/10 border-green-200' :
                                                                campaign.status === 'completed' ? 'text-blue-600 bg-blue-500/10 border-blue-200' :
                                                                    'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {campaign.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {campaign.applicationCount || 0} applications
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                                        <FileText className="w-10 h-10 mb-3 opacity-20" />
                                        <p>No campaigns created yet.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
