import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Video,
  ExternalLink,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Filter,
  Search,
  Calendar,
  Instagram,
  Play,
  Loader2,
  Check,
  X,
  RefreshCw,
  Bookmark,
  BarChart2,
  Edit,
  Star,
  MessageSquareShare,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { addDoc, updateDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { RequestEditsDialog } from "@/components/brand/RequestEditsDialog";

interface ContentItem {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  campaignName: string;
  type: "image" | "video" | "story";
  platform: "instagram" | "tiktok";
  thumbnail: string;
  postUrl: string;
  status: "pending" | "approved" | "live" | "rejected" | "revision_requested";
  submittedAt: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    saved: number;
    interactions: number;
    updatedAt?: string;
  };
  revisionHistory?: {
    requestedAt: string;
    requestedBy: string;
    notes: string;
    previousMediaUrl?: string;
    resubmittedAt?: string;
  }[];
  minReward?: number;
  maxReward?: number;
  compensationType?: string;
}

interface ContentCardProps {
  content: ContentItem;
  onStatusChange?: (id: string, status: "approved" | "rejected") => void;
  onApproveClick?: (content: ContentItem) => void;
  onRefreshMetrics?: (content: ContentItem) => void;
  onRequestEdit?: (content: ContentItem) => void;
}

function ContentCard({ content, onStatusChange, onApproveClick, onRefreshMetrics, onRequestEdit }: ContentCardProps) {
  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    approved: "bg-primary/20 text-primary border-primary/30",
    live: "bg-success/20 text-success border-success/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
    revision_requested: "bg-orange-500/20 text-orange-600 border-orange-500/30"
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const [imgError, setImgError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card className="glass-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {!imgError ? (
          <img
            src={content.thumbnail}
            alt={content.campaignName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 bg-muted/50">
            {content.type === 'video' ? (
              <Video className="w-12 h-12 mb-2 opacity-50" />
            ) : (
              <Image className="w-12 h-12 mb-2 opacity-50" />
            )}
            <span className="text-xs text-center">Vista previa no disponible</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50">
            {content.type === "video" ? (
              <Video className="w-3 h-3 mr-1" />
            ) : (
              <Image className="w-3 h-3 mr-1" />
            )}
            {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
          </Badge>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${content.platform === "instagram"
            ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
            : "bg-black"
            }`}>
            {content.platform === "instagram" ? (
              <Instagram className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Play button for videos */}
        {(content.type === "video") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {content.postUrl && (
            <Button size="sm" variant="glass" className="flex-1" asChild>
              <a href={content.postUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver
              </a>
            </Button>
          )}

          <Button
            size="sm"
            variant="glass"
            onClick={(e) => {
              e.stopPropagation();
              onRefreshMetrics?.(content);
            }}
            title="Actualizar Métricas (Obtener portada y estadísticas recientes)"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {content.status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-success/80 hover:bg-success text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onApproveClick?.(content);
                }}
                title="Aprobar Contenido"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="glass"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestEdit?.(content);
                }}
                title="Solicitar Ediciones"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={content.creatorAvatar}
            alt={content.creatorName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{content.creatorName}</p>
            <p className="text-xs text-muted-foreground truncate">{content.campaignName}</p>
          </div>
          <Badge className={statusColors[content.status]}>
            {content.status === "rejected" ? "rechazado" :
              content.status === "revision_requested" ? "revisión solicitada" :
                content.status === "approved" ? "aprobado" :
                  content.status === "pending" ? "pendiente" :
                    content.status === "live" ? "en vivo" :
                      content.status}
          </Badge>
        </div>

        {/* Metrics */}
        {content.metrics && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
            {/* Row 1 */}
            <div className="text-center group-hover:scale-105 transition-transform" title="Vistas">
              <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.views)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Alcance">
              <BarChart2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.reach)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Guardados">
              <Bookmark className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.saved)}</p>
            </div>

            {/* Row 2 */}
            <div className="text-center group-hover:scale-105 transition-transform" title="Me gusta">
              <Heart className={`w-4 h-4 mx-auto mb-1 ${content.metrics.likes > 0 ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium">{formatNumber(content.metrics.likes)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Comentarios">
              <MessageCircle className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.comments)}</p>
            </div>
            <div className="text-center group-hover:scale-105 transition-transform" title="Compartidos">
              <Share2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.shares)}</p>
            </div>
          </div>
        )}

          {/* Submitted Date */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {content.submittedAt}
            </div>
            {content.metrics?.updatedAt && (
              <span className="text-[10px] opacity-70">
                Actualizado {new Date(content.metrics.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* History Collapsible */}
          {content.revisionHistory && content.revisionHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                className="flex items-center justify-center w-full gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <Clock className="w-3.5 h-3.5" />
                {showHistory ? "Ocultar Historial" : `Ver Historial (${content.revisionHistory.length})`}
              </button>
              
              {showHistory && (
                <div className="mt-3 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                   {content.revisionHistory.map((rev, index) => (
                      <div key={index} className="flex flex-col gap-2 text-xs">
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
                           <div className="flex items-center gap-1.5 mb-1.5">
                             <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                             <span className="font-semibold text-red-800 dark:text-red-300">Revisión #{index + 1}</span>
                             <span className="ml-auto text-[10px] text-red-600/70">{new Date(rev.requestedAt).toLocaleDateString()}</span>
                           </div>
                           <div className="text-red-700/90 dark:text-red-400/90 bg-white/50 dark:bg-black/20 p-2 rounded whitespace-pre-wrap">{rev.notes}</div>
                        </div>
                        
                        {rev.resubmittedAt && (
                           <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900/30 ml-4 relative">
                             <div className="absolute top-0 left-[-16px] w-[12px] h-[50%] border-l-2 border-b-2 border-blue-200 dark:border-blue-800/50 rounded-bl-lg"></div>
                             <div className="flex items-center gap-1.5 mb-1">
                               <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                               <span className="font-semibold text-blue-800 dark:text-blue-300">Contenido Reenviado</span>
                               <span className="ml-auto text-[10px] text-blue-600/70">{new Date(rev.resubmittedAt).toLocaleDateString()}</span>
                             </div>
                             {rev.previousMediaUrl && (
                               <a href={rev.previousMediaUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1">
                                 <ExternalLink className="w-3 h-3" /> Ver entrega anterior
                               </a>
                             )}
                           </div>
                        )}
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card >
  );
}

export default function ContentLibrary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activePlatform, setActivePlatform] = useState("all");
  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Rating Dialog State
  const [contentToRate, setContentToRate] = useState<ContentItem | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [finalPayment, setFinalPayment] = useState<number | "">("");

  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;
      try {
        // 1. Get Brand's Campaigns
        const campaignsQuery = query(collection(db, "campaigns"), where("brandId", "==", user.uid));
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaignIds = campaignsSnapshot.docs.map(d => d.id);
        const campaignMap = new Map(campaignsSnapshot.docs.map(d => [d.id, d.data()]));

        if (campaignIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Get Submissions for these campaigns
        const submissionsPromises = campaignIds.map(id =>
          getDocs(query(collection(db, "content_submissions"), where("campaignId", "==", id)))
        );
        const snapshots = await Promise.all(submissionsPromises);
        let allSubmissions: any[] = [];
        snapshots.forEach(snap => {
          allSubmissions = [...allSubmissions, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        });

        // 3. Enrich with Creator Data
        const enrichedContent = await Promise.all(
          allSubmissions.map(async (sub) => {
            let creatorData: any = {};
            try {
              // Ensure we have correct creatorId field (userId or creatorId)
              const creatorId = sub.creatorId || sub.userId;
              if (creatorId) {
                const creatorDoc = await getDoc(doc(db, "users", creatorId));
                if (creatorDoc.exists()) {
                  creatorData = creatorDoc.data();
                }
              }
            } catch (e) {
            }

            const campaignData = campaignMap.get(sub.campaignId) || {};

            return {
              id: sub.id,
              campaignId: sub.campaignId || "",
              creatorId: sub.creatorId || sub.userId,
              creatorName: creatorData.displayName || "Creador Desconocido",
              creatorAvatar: creatorData.photoURL || creatorData.avatar || "https://via.placeholder.com/150",
              campaignName: campaignData.name || sub.campaignName || "Campaña Desconocida",
              minReward: campaignData.minReward,
              maxReward: campaignData.maxReward,
              compensationType: campaignData.compensationType,
              // Determine type from mediaType or fallback
              type: (sub.mediaType === "VIDEO" || sub.mediaType === "REELS") ? "video" : "image",
              platform: sub.platform || "instagram",
              // Use thumbnailUrl or mediaUrl (for images)
              thumbnail: sub.thumbnailUrl || sub.mediaUrl || "https://via.placeholder.com/400x500",
              postUrl: sub.contentUrl || sub.postUrl, // Handle both potential field names
              status: sub.status || "pending",
              submittedAt: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              metrics: {
                ...(sub.metrics || {}),
                views: sub.metrics?.views || 0,
                likes: sub.metrics?.likes || 0,
                comments: sub.metrics?.comments || 0,
                shares: sub.metrics?.shares || 0,
                reach: sub.metrics?.reach || 0,
                saved: sub.metrics?.saved || 0,
                interactions: sub.metrics?.interactions || 0
              },
              revisionHistory: sub.revisionHistory || []
            } as ContentItem;
          })
        );

        setContentList(enrichedContent);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [user]);

  const filteredContent = contentList.filter(content => {
    const matchesSearch =
      content.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.campaignName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = activePlatform === "all" || content.platform === activePlatform;

    if (activeTab === "all") return matchesSearch && matchesPlatform;
    if (activeTab === "revision_requested") return matchesSearch && matchesPlatform && (content.status === "revision_requested" || content.status === "rejected");
    return matchesSearch && matchesPlatform && content.status === activeTab;
  });

  const stats = {
    total: contentList.length,
    live: contentList.filter(c => c.status === "live").length,
    approved: contentList.filter(c => c.status === "approved").length,
    pending: contentList.filter(c => c.status === "pending").length,
    revisions: contentList.filter(c => c.status === "revision_requested" || c.status === "rejected").length,
    totalViews: contentList.reduce((acc, c) => acc + (c.metrics?.views || 0), 0),
    totalEngagement: contentList.reduce((acc, c) =>
      acc + (c.metrics?.likes || 0) + (c.metrics?.comments || 0) + (c.metrics?.shares || 0), 0
    )
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Handler for status updates
  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected", providedRating?: number, providedReview?: string, finalPaymentAmount?: number) => {
    try {
      const submission = contentList.find(c => c.id === id);

      await updateDoc(doc(db, "content_submissions", id), {
        status: newStatus,
        reviewedAt: new Date().toISOString()
      });

      // ✅ Auto-create creator earning/payout record when content is APPROVED
      if (newStatus === "approved" && submission?.creatorId) {
        try {
          const subDoc = await getDoc(doc(db, "content_submissions", id));
          const subData = subDoc.data();
          const campaignId = subData?.campaignId;

          if (campaignId) {
            const campaignDoc = await getDoc(doc(db, "campaigns", campaignId));
            const campaign = campaignDoc.data();

            if (campaign) {
              // (Payout creation logic moved down to only run when all deliverables are approved)
            }

            // --- AUTO-COMPLETE CAMPAIGN LOGIC ---
            if (campaign && campaign.status !== "completed") {
              // 1. Calculate how many deliverables are required per creator
              const totalRequiredPerCreator = (campaign.deliverables || []).reduce(
                (acc: number, item: any) => acc + (item.required ? item.quantity : 0),
                0
              ) || 1; // Default to 1 if no discrete deliverables specified

              // 2. Fetch all approved submissions for this campaign (including the one we just approved in state)
              const approvedSubmissionsQuery = query(
                collection(db, "content_submissions"),
                where("campaignId", "==", campaignId),
                where("status", "==", "approved")
              );
              const approvedSubmissionsSnap = await getDocs(approvedSubmissionsQuery);
              const approvedDocs = approvedSubmissionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

              // Ensure the current one is counted as approved even if the snap didn't catch our recent update yet
              if (!approvedDocs.find(d => d.id === id)) {
                approvedDocs.push({ id, creatorId: submission.creatorId } as any);
              }

              // 3. Group approved submissions by creator
              const creatorApprovalCounts: Record<string, number> = {};
              approvedDocs.forEach((doc: any) => {
                const cId = doc.creatorId || doc.userId;
                if (cId) {
                  creatorApprovalCounts[cId] = (creatorApprovalCounts[cId] || 0) + 1;
                }
              });

              // ✅ Check if THIS specific creator just hit the required limit
              if (creatorApprovalCounts[submission.creatorId] >= totalRequiredPerCreator) {
                // Duplicate guard: only create one record per creator per campaign
                const existingQ = query(
                  collection(db, "payouts"),
                  where("creatorId", "==", submission.creatorId),
                  where("campaignId", "==", campaignId)
                );
                const existing = await getDocs(existingQ);

                if (existing.empty) {
                  const creatorDoc = await getDoc(doc(db, "users", submission.creatorId));
                  const creator = creatorDoc.data();

                  if (campaign.compensationType === "monetary" || campaign.compensationType === "hybrid") {
                    // Decide final payment
                    let finalGross = campaign.totalBudgetPerCreator || campaign.maxReward || 0;
                    if (finalPaymentAmount !== undefined && !isNaN(finalPaymentAmount) && finalPaymentAmount > 0) {
                        finalGross = finalPaymentAmount;
                    }

                    const feePercent = campaign.platformFeePercent || 10;
                    const feeAmount = finalGross * (feePercent / 100);
                    const netAmount = finalGross - feeAmount;

                    if (finalGross > 0) {
                      // 💵 MONETARY — real cash payout
                      await addDoc(collection(db, "payouts"), {
                        type: "monetary",
                        brandId: campaign.brandId,
                        creatorId: submission.creatorId,
                        creatorName: creator?.displayName || "Creator",
                        creatorAvatar: creator?.photoURL || "",
                        creatorBankAccount: creator?.bankAccount || null,
                        campaignId,
                        campaignName: campaign.name || submission.campaignName,
                        contentSubmissionId: id,
                        grossAmount: finalGross,
                        feeAmount: feeAmount,
                        netAmount: netAmount,
                        feePercent: feePercent,
                        status: "pending",  // pending -> ready_to_withdraw -> requested -> paid -> completed
                        createdAt: new Date().toISOString(),
                      });
                    }
                  } 
                  
                  if (campaign.compensationType === "exchange" || campaign.compensationType === "hybrid") {
                    // 🎁 EXCHANGE — product/food/experience record
                    await addDoc(collection(db, "payouts"), {
                      type: "exchange",
                      brandId: campaign.brandId,
                      creatorId: submission.creatorId,
                      creatorName: creator?.displayName || "Creator",
                      creatorAvatar: creator?.photoURL || "",
                      campaignId,
                      campaignName: campaign.name || submission.campaignName,
                      contentSubmissionId: id,
                      grossAmount: 0,
                      feeAmount: 0,
                      netAmount: 0,
                      exchangeDetails: campaign.exchangeDetails || "Intercambio",
                      status: "completed",
                      createdAt: new Date().toISOString(),
                    });
                  }
                }
              }

              // 4. Count how many creators have completed all their required deliverables
              let creatorsCompleted = 0;
              Object.values(creatorApprovalCounts).forEach(count => {
                if (count >= totalRequiredPerCreator) {
                  creatorsCompleted++;
                }
              });

              // 5. Compare against the total slots approved for this campaign
              const totalApprovedCreatorsForCampaign = campaign.approvedCount || 0;

              if (totalApprovedCreatorsForCampaign > 0 && creatorsCompleted >= totalApprovedCreatorsForCampaign) {
                // Auto-complete the campaign
                await updateDoc(doc(db, "campaigns", campaignId), {
                  status: "completed",
                  completedAt: new Date().toISOString()
                });
                toast.success("¡Campaña autocompletada! Todos los creadores han finalizado sus entregables.", { duration: 5000 });
              }
            }
            // -------------------------------------

          }
        } catch (payoutErr) {
          // Non-blocking — log but don't block the UI
        }
      }

      setContentList(prev => prev.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      ));

      // ─── Save Rating ───
      if (newStatus === "approved" && providedRating && submission?.creatorId && user) {
        try {
          const creatorDocRef = doc(db, "users", submission.creatorId);
          const creatorDoc = await getDoc(creatorDocRef);
          if (creatorDoc.exists()) {
            const cData = creatorDoc.data();
            const currentTotal = (cData.averageRating || 5) * (cData.reviewCount || 0);
            const newTotal = currentTotal + providedRating;
            const newCount = (cData.reviewCount || 0) + 1;
            const newAverage = newTotal / newCount;
            const roundedAvg = Math.round(newAverage * 10) / 10;

            await updateDoc(creatorDocRef, {
              averageRating: roundedAvg,
              reviewCount: newCount
            });

            await addDoc(collection(db, "reviews"), {
              creatorId: submission.creatorId,
              brandId: user.uid,
              campaignId: submission?.campaignId || null,
              rating: providedRating,
              comment: providedReview?.trim() || null,
              createdAt: new Date().toISOString()
            });
          }
        } catch (ratingErr) {
        }
      }

      toast.success(newStatus === "approved" ? "¡Contenido aprobado!" : "Cambios solicitados");
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleApproveClick = (content: ContentItem) => {
    setContentToRate(content);
    setRating(5);
    setHoveredRating(0);
    setReviewText("");
    
    // Set default final payment to maxReward
    if ((content.compensationType === 'monetary' || content.compensationType === 'hybrid') && content.maxReward) {
      setFinalPayment(content.maxReward);
    } else {
      setFinalPayment("");
    }
    
    setIsRatingDialogOpen(true);
  };

  // Handler for requesting edits
  const handleRequestEdit = (content: ContentItem) => {
    setContentToEdit(content);
    setIsEditDialogOpen(true);
  };

  // Handler for metrics refresh
  const handleRefreshMetrics = async (content: ContentItem) => {
    if (!content.postUrl) return;

    // Extract post ID
    const match = content.postUrl.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
    const postId = match ? match[2] : null;

    if (!postId || !content.creatorId) { // Need creatorId to fetch metrics (we need their token)
      // Wait we need creatorId in content item, let's check if we have it. Yes we enriched it.
      // But wait, in ContentLibrary we enriched creatorName but maybe didn't save creatorId?
      // Ah, in enrichment map we use sub.userId.
      // Let's check enrichment logic.
      toast.error("No se puede actualizar: falta información de la publicación");
      return;
    }

    const toastId = toast.loading("Actualizando métricas...");

    try {
      const response = await fetch("https://us-central1-rella-collab.cloudfunctions.net/getPostMetrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: content.creatorId, postId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.metrics) {
          // Update in Firestore - use dot notation for nested metrics
          await updateDoc(doc(db, "content_submissions", content.id), {
            "metrics.likes": data.metrics.likes || 0,
            "metrics.comments": data.metrics.comments || 0,
            "metrics.views": data.metrics.views || 0,
            "metrics.reach": data.metrics.reach || 0,
            "metrics.saved": data.metrics.saved || 0,
            "metrics.shares": data.metrics.shares || 0,
            "metrics.interactions": data.metrics.interactions || 0,
            "metrics.updatedAt": new Date().toISOString(),
            metricsLastFetched: new Date().toISOString()
          });

          // Update local state
          setContentList(prev => prev.map(item => {
            if (item.id === content.id) {
              return {
                ...item,
                metrics: {
                  ...item.metrics!,
                  likes: data.metrics.likes,
                  comments: data.metrics.comments,
                  views: data.metrics.views || 0,
                  reach: data.metrics.reach || 0,
                  saved: data.metrics.saved || 0,
                  shares: data.metrics.shares || 0,
                  interactions: data.metrics.interactions || 0,
                  updatedAt: new Date().toISOString()
                }
              };
            }
            return item;
          }));
          toast.success("¡Métricas actualizadas!", { id: toastId });
        } else {
          toast.error("Error al obtener las métricas", { id: toastId });
        }
      } else {
        // Try to get error message from response
        let errorMessage = "Error del servidor";
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || "Error del servidor";
        } catch (e) { }
        toast.error(`Error: ${errorMessage}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Error de red al intentar actualizar", { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title="Biblioteca de Contenidos"
          subtitle="Todo el contenido de los creadores de tus campañas"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Contenido Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Publicaciones en Vivo</p>
              <p className="text-2xl font-bold text-success">{stats.live}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Vistas Totales</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Interacción Total</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalEngagement)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por creador o campaña..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex gap-2">
            <Button
              variant={activePlatform === "all" ? "default" : "outline"}
              onClick={() => setActivePlatform("all")}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={activePlatform === "instagram" ? "default" : "outline"}
              onClick={() => setActivePlatform("instagram")}
              size="sm"
              className="gap-2"
            >
              <Instagram className="w-4 h-4" /> Instagram
            </Button>
            <Button
              variant={activePlatform === "tiktok" ? "default" : "outline"}
              onClick={() => setActivePlatform("tiktok")}
              size="sm"
              className="gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg> TikTok
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="revision_requested">Revisiones ({stats.revisions})</TabsTrigger>
            <TabsTrigger value="approved">Aprobados ({stats.approved})</TabsTrigger>
            <TabsTrigger value="live">En Vivo ({stats.live})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onStatusChange={handleStatusChange}
              onApproveClick={handleApproveClick}
              onRefreshMetrics={handleRefreshMetrics}
              onRequestEdit={handleRequestEdit}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontró contenido</h3>
            <p className="text-muted-foreground">
              {contentList.length === 0 ? "Aún no has recibido ningún envío de contenido." : "Intenta ajustar tu búsqueda o filtros"}
            </p>
          </div>
        )}
      </main>

      {/* Request Edits Dialog */}
      {contentToEdit && (
        <RequestEditsDialog
          content={{
            id: contentToEdit.id,
            campaignId: contentToEdit.id, // This should be the actual campaign ID
            creatorId: contentToEdit.creatorId,
            deliverableType: contentToEdit.type,
            deliverableNumber: 1, // This should be tracked from submission
            contentUrl: contentToEdit.postUrl,
            status: contentToEdit.status as any
          }}
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setContentToEdit(null);
          }}
          onSuccess={() => {
            // Refresh the page to show updated status
            window.location.reload();
          }}
        />
      )}

      {/* Approve & Rate Creator Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aprobar y Calificar</DialogTitle>
            <DialogDescription>
              Apunto de aprobar el contenido de {contentToRate?.creatorName}. Opcionalmente, puedes dejarle una calificación.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">¿Qué tal fue trabajar con este creador?</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-transform hover:scale-110 ${(hoveredRating || rating) >= star
                      ? "text-yellow-400"
                      : "text-muted-foreground/30"
                      }`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {rating} de 5 estrellas
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MessageSquareShare className="w-4 h-4" />
                Reseña (Opcional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={`¿Qué te pareció el contenido creado por ${contentToRate?.creatorName}?`}
                className="w-full min-h-[100px] p-3 rounded-xl bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Variable Payment Selection for applicable campaigns */}
            {(contentToRate?.compensationType === 'monetary' || contentToRate?.compensationType === 'hybrid') && 
             contentToRate.minReward !== undefined && 
             contentToRate.maxReward !== undefined && 
             contentToRate.minReward < contentToRate.maxReward && (
              <div className="space-y-2 mt-4 px-3 py-3 bg-primary/5 rounded-xl border border-primary/20">
                <label className="text-sm font-semibold text-primary flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-1 rounded-full"><Star className="w-3 h-3 fill-current" /></span>
                  Pago Final Asignado
                </label>
                <div className="text-xs text-muted-foreground/80 leading-relaxed">
                  Esta campaña tiene un pago dinámico entre <strong>${contentToRate.minReward}</strong> y <strong>${contentToRate.maxReward}</strong>. 
                  <p className="mt-1 text-[11px] text-green-600 dark:text-green-500 font-medium">¡Incentiva la genialidad! Da el valor máximo si el video superó tus expectativas. 🚀</p>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input 
                    type="number" 
                    min={contentToRate.minReward}
                    max={contentToRate.maxReward}
                    value={finalPayment}
                    onChange={(e) => setFinalPayment(e.target.value ? Number(e.target.value) : "")}
                    className="pl-7 bg-background text-base font-semibold"
                    placeholder={`${contentToRate.maxReward}`}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isApproving}
              onClick={async () => {
                if (!contentToRate) return;
                
                // Validate range if applicable
                const isVariable = (contentToRate.compensationType === 'monetary' || contentToRate.compensationType === 'hybrid') && contentToRate.maxReward && contentToRate.minReward && contentToRate.minReward < contentToRate.maxReward;
                let paymentAmount = undefined;
                
                if (isVariable) {
                    if (finalPayment === "" || Number(finalPayment) < contentToRate.minReward! || Number(finalPayment) > contentToRate.maxReward!) {
                        toast.error(`El pago debe estar entre $${contentToRate.minReward} y $${contentToRate.maxReward}.`);
                        return;
                    }
                    paymentAmount = Number(finalPayment);
                }

                setIsApproving(true);
                await handleStatusChange(contentToRate.id, "approved", rating, reviewText, paymentAmount);
                setIsApproving(false);
                setIsRatingDialogOpen(false);
                setContentToRate(null);
              }}
            >
              {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmar Aprobación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}