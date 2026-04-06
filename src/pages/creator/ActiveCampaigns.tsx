import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, PlusCircle, FileText } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";
import { OpportunityDetailsDialog } from "@/components/dashboard/OpportunityDetailsDialog";
import { ContractTemplate } from "@/components/contracts/ContractTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateMatchScore } from "@/lib/matchScoring";
import { cn } from "@/lib/utils";

export default function ActiveCampaigns() {
    const { user } = useAuth();
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [contractOpen, setContractOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [loadingContract, setLoadingContract] = useState(false);

    useEffect(() => {
        const fetchActiveCampaigns = async () => {
            if (!user) return;
            try {
                // Fetch Creator Profile for Scoring
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const creatorProfile = userDocSnap.exists() ? userDocSnap.data() : {};

                // Fetch approved applications for this user
                const q = query(
                    collection(db, "applications"),
                    where("creatorId", "==", user.uid),
                    where("status", "==", "approved")
                );

                const appSnapshot = await getDocs(q);
                const campaigns = [];

                for (const appDoc of appSnapshot.docs) {
                    const appData = appDoc.data();
                    const campaignRef = doc(db, "campaigns", appData.campaignId);
                    const campaignDoc = await getDoc(campaignRef);

                    if (campaignDoc.exists()) {
                        const campaignData = campaignDoc.data();
                        const brandId = campaignData.brandId;

                        let brandName = "Unknown Brand";
                        let brandLogo = campaignData.brandLogo || "";
                        let brandProfile = {};

                        // Fetch detailed brand info
                        if (brandId) {
                            try {
                                const brandDoc = await getDoc(doc(db, "users", brandId));
                                if (brandDoc.exists()) {
                                    const brandData = brandDoc.data();
                                    brandName = brandData.brandName || brandData.displayName || "Marca Desconocida";
                                    brandLogo = brandData.photoURL || brandData.avatar || brandLogo;
                                    brandProfile = brandData;
                                }
                            } catch (e) {
                            }
                        }

                        // Calculate Match Score
                        const { score } = calculateMatchScore(campaignData, creatorProfile);

                        // Fetch content submissions and payouts for completion check
                        let isCompleted = false;
                        let progressStatus = "Activa";
                        
                        try {
                            const submissionsQuery = query(
                                collection(db, "content_submissions"),
                                where("campaignId", "==", campaignDoc.id),
                                where("creatorId", "==", user.uid)
                            );
                            const submissionsSnap = await getDocs(submissionsQuery);
                            const submissions = submissionsSnap.docs.map(d => d.data());
                            
                            // Group by slot to find latest unique approved submissions
                            const slotsMap = new Map();
                            submissions.forEach(s => {
                                const slotId = `${s.deliverableType}_${s.deliverableNumber}`;
                                if (!slotsMap.has(slotId) || (s.updatedAt || s.createdAt) > (slotsMap.get(slotId).updatedAt || slotsMap.get(slotId).createdAt)) {
                                    slotsMap.set(slotId, s);
                                }
                            });
                            
                            const latestSubmissions = Array.from(slotsMap.values());
                            const deliverables = campaignData.deliverables || [];
                            const totalRequired = deliverables
                                .filter((d: any) => d.required)
                                .reduce((sum: number, d: any) => sum + (d.quantity || 1), 0);
                            
                            const totalApproved = latestSubmissions.filter(s => s.status === "approved").length;
                            
                            // Fetch payout status
                            const payoutQuery = query(
                                collection(db, "payouts"),
                                where("campaignId", "==", campaignDoc.id),
                                where("creatorId", "==", user.uid)
                            );
                            const payoutSnap = await getDocs(payoutQuery);
                            const isPaid = payoutSnap.docs.some(d => d.data().status === "paid");
                            
                            // A campaign is "Completed" if all required content is approved AND (optionally) paid
                            // However, we'll mark as completed if content is approved to give immediate feedback.
                            // If they are paid, it's definitely completed.
                            if (totalApproved >= totalRequired && totalRequired > 0) {
                                isCompleted = true;
                                progressStatus = isPaid ? "Pagado" : "Pendiente de Pago";
                            }
                        } catch (e) {
                        }

                        campaigns.push({
                            id: campaignDoc.id,
                            ...campaignData,
                            brandName: brandName, 
                            brandLogo: brandLogo, 
                            applicationId: appDoc.id,
                            matchScore: score, 
                            title: campaignData.title || campaignData.name || "Campaña sin Título",
                            brandDescription: campaignData.brandDescription || campaignData.description || "",
                            brandProfile: brandProfile,
                            isCompleted: isCompleted,
                            progressStatus: progressStatus
                        });
                    }
                }

                setActiveCampaigns(campaigns);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        fetchActiveCampaigns();
    }, [user]);

    const handleViewDetails = (campaign: any) => {
        setSelectedCampaign(campaign);
        setIsDialogOpen(true);
    };

    const handleViewContract = async (campaign: any) => {
        if (!user) return;
        setLoadingContract(true);
        setContractOpen(true);
        try {
            const q = query(
                collection(db, "contracts"),
                where("campaignId", "==", campaign.id),
                where("creatorId", "==", user.uid)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setSelectedContract({ ...data, contractId: snap.docs[0].id });
            } else {
                // Fallback: build contract from campaign data
                setSelectedContract({
                    contractId: "—",
                    status: "active",
                    signedByCreatorAt: new Date().toISOString(),
                    campaign: {
                        title: campaign.title,
                        description: campaign.description,
                        deliverables: campaign.deliverables || [],
                        compensationType: campaign.compensationType || "exchange",
                        creatorPayment: campaign.creatorPayment || campaign.budget || 0,
                        exchangeDetails: campaign.exchangeDetails,
                        deadline: campaign.deadline || campaign.endDate,
                        location: campaign.location,
                    },
                    brand: {
                        displayName: campaign.brandName,
                        email: campaign.brandProfile?.email,
                        logo: campaign.brandLogo,
                    },
                    creator: {
                        displayName: user.displayName || user.email || "Creador",
                        email: user.email || "",
                    },
                });
            }
        } catch {
            setSelectedContract(null);
        } finally {
            setLoadingContract(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Campañas Activas"
                    subtitle="Campañas en las que estás participando actualmente"
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : activeCampaigns.length > 0 ? (
                    <>
                        {/* Incentive banner — shown when any campaign has a reward range */}
                        {activeCampaigns.some((c: any) => c.minReward && c.maxReward) && (
                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 flex items-start gap-3">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">¡Tu pago final está en tus manos!</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        La marca asignará el pago entre el mínimo y el máximo al aprobar tu video. Los contenidos con mayor
                                        engagement, mejor edición y mayor impacto suelen recibir el <strong>pago máximo</strong>.
                                        ¡Esfuérzate en cada detalle!
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeCampaigns.map((campaign, index) => (
                                <motion.div
                                    key={campaign.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="relative">
                                        <OpportunityCard
                                            opportunity={campaign}
                                            isActive={true}
                                            isCompleted={campaign.isCompleted}
                                            onViewDetails={() => handleViewDetails(campaign)}
                                        />
                                        <div className={cn(
                                            "absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm border border-white/10",
                                            campaign.isCompleted 
                                                ? (campaign.progressStatus === "Pagado" ? "bg-green-600/90" : "bg-blue-600/90")
                                                : "bg-success"
                                        )}>
                                            {campaign.isCompleted ? campaign.progressStatus : "Activa"}
                                        </div>
                                        {/* Ver Contrato button */}
                                        <div className="mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 text-xs"
                                                onClick={() => handleViewContract(campaign)}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Ver mi Contrato
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 border rounded-xl bg-muted/20">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <PlusCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Aún no tienes campañas activas</h3>
                        <p className="text-muted-foreground mb-6">
                            ¡Empieza a aplicar a oportunidades para conseguir tu primera colaboración!
                        </p>
                        <Link to="/creator/opportunities">
                            <Button variant="hero">
                                Explorar Oportunidades
                            </Button>
                        </Link>
                    </div>
                )}
            </main>

            <OpportunityDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                opportunity={selectedCampaign}
                onAccept={() => { }} // No accept action needed for active campaigns
                isActive={true}
            />

            {/* Contract Dialog */}
            <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Mi Contrato de Colaboración
                        </DialogTitle>
                    </DialogHeader>
                    {loadingContract ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : selectedContract ? (
                        <ContractTemplate contract={selectedContract} showDownload={true} />
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No se encontró el contrato para esta campaña.</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

