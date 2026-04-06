import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Trash2, Play, ExternalLink, DollarSign, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DeliverableSubmissionDialog } from "./DeliverableSubmissionDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CampaignWithDeliverables {
  id: string;
  name: string;
  brandName: string;
  deliverables: Array<{
    type: string;
    quantity: number;
    required: boolean;
    platform?: "instagram" | "tiktok";
  }>;
  netPayment?: number;
}

interface SubmittedContent {
  id?: string; // Firestore document ID
  deliverableType: string;
  deliverableNumber: number;
  status: "pending" | "approved" | "needs_revision" | "revision_requested" | "resubmitted";
  contentUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    views?: number;
    reach?: number;
    saved?: number;
    shares?: number;
    interactions?: number;
  };
  revisionHistory?: Array<{
    requestedAt: string;
    requestedBy: string;
    notes: string;
    resubmittedAt?: string;
    previousMediaUrl?: string;
  }>;
}

interface CampaignProgress {
  campaign: CampaignWithDeliverables;
  submissions: SubmittedContent[];
  totalRequired: number;
  totalSubmitted: number;
  totalApproved: number;
  needsRevision: number;
}

export function ContentSubmission() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithDeliverables | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [submissionToResubmit, setSubmissionToResubmit] = useState<SubmittedContent | null>(null);

  useEffect(() => {
    fetchActiveCampaigns();
  }, [user]);

  const fetchActiveCampaigns = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Fetch approved applications
      const appsQuery = query(
        collection(db, "applications"),
        where("creatorId", "==", user.uid),
        where("status", "==", "approved")
      );
      const appsSnapshot = await getDocs(appsQuery);

      const campaignDataPromises = appsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        const campaignId = appData.campaignId;

        // 2. Fetch campaign details
        const campaignDoc = await getDoc(doc(db, "campaigns", campaignId));
        if (!campaignDoc.exists()) return null;

        const campaignData = campaignDoc.data();

        // 3. Fetch submissions for this campaign
        const submissionsQuery = query(
          collection(db, "content_submissions"),
          where("campaignId", "==", campaignId),
          where("creatorId", "==", user.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SubmittedContent));

        // 4. Calculate progress
        const deliverables = campaignData.deliverables || [];
        const totalRequired = deliverables
          .filter((d: any) => d.required)
          .reduce((sum: number, d: any) => sum + d.quantity, 0);

        const totalSubmitted = submissions.length;
        const totalApproved = submissions.filter(s => s.status === "approved").length;
        const needsRevision = submissions.filter(s => s.status === "needs_revision" || s.status === "revision_requested").length;

        // Fetch Net Payment
        const netPayment = campaignData.creatorPayment || 0;

        return {
          campaign: {
            id: campaignId,
            name: campaignData.name,
            brandName: campaignData.brandName,
            deliverables,
            netPayment, // Add net payment
          },
          submissions,
          totalRequired,
          totalSubmitted,
          totalApproved,
          needsRevision,
        };
      });

      const campaignData = (await Promise.all(campaignDataPromises)).filter(Boolean) as CampaignProgress[];
      setCampaigns(campaignData);
    } catch (error) {
      toast.error("Error al cargar campañas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (campaign: CampaignWithDeliverables) => {
    setSelectedCampaign(campaign);
    setSubmissionToResubmit(null); // Clear any resubmission
    setIsDialogOpen(true);
  };

  const handleResubmit = (campaign: CampaignWithDeliverables, submission: SubmittedContent) => {
    setSelectedCampaign(campaign);
    setSubmissionToResubmit(submission);
    setIsDialogOpen(true);
  };

  const toggleExpanded = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!submissionId) {
      toast.error("No se puede eliminar: falta el ID del contenido");
      return;
    }

    if (!confirm("¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "content_submissions", submissionId));
      toast.success("Contenido eliminado exitosamente");
      // Refresh the campaigns list
      fetchActiveCampaigns();
    } catch (error) {
      toast.error("Error al eliminar contenido");
    }
  };

  const getDeliverableStatus = (
    campaign: CampaignWithDeliverables,
    submissions: SubmittedContent[],
    type: string,
    number: number
  ) => {
    return submissions.find(
      s => s.deliverableType === type && s.deliverableNumber === number
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin Campañas Activas</h3>
          <p className="text-muted-foreground text-center">
            Aún no tienes campañas aprobadas. ¡Aplica a oportunidades para empezar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {campaigns.map((campaignProgress) => {
        const { campaign, submissions, totalRequired, totalSubmitted, totalApproved, needsRevision } = campaignProgress;
        const isExpanded = expandedCampaigns.has(campaign.id);
        const allRequiredComplete = totalApproved >= totalRequired;
        const progressPercentage = totalRequired > 0 ? (totalApproved / totalRequired) * 100 : 0;

        return (
          <Card key={campaign.id} className={allRequiredComplete ? "border-green-500" : ""}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    {allRequiredComplete && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                    {needsRevision > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {needsRevision} Requiere Revisión
                      </Badge>
                    )}
                    {/* Display Net Payment */}
                    {campaign.netPayment && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Ganancia: ${campaign.netPayment.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    por {campaign.brandName} • {totalApproved}/{totalRequired} Entregables Requeridos Aprobados
                  </CardDescription>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => handleOpenDialog(campaign)}
                  disabled={allRequiredComplete && needsRevision === 0}
                  className="w-full md:w-auto shrink-0"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {needsRevision > 0 ? "Reenviar Contenido" : "Enviar Contenido"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(campaign.id)}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`w-full relative shadow-sm hover:shadow-md transition-all duration-300 ${!isExpanded && needsRevision > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 border" : ""}`}
                  >
                    {!isExpanded && needsRevision > 0 && (
                      <span className="absolute left-3 flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ocultar Detalles
                      </>
                    ) : (
                      <>
                        <ChevronDown className={`w-4 h-4 mr-2 ${needsRevision > 0 ? "text-red-600" : ""}`} />
                        Ver Entregables ({totalSubmitted} enviados) 
                        {needsRevision > 0 && (
                          <span className="ml-2 font-bold underline decoration-2 underline-offset-4 inline-block">
                            ¡REVISIÓN REQUERIDA!
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="space-y-2">
                    {(() => {
                      const typeCounters: Record<string, number> = {};
                      const renderSlots: React.ReactNode[] = [];

                      campaign.deliverables.forEach((deliverable) => {
                        for (let i = 1; i <= deliverable.quantity; i++) {
                          typeCounters[deliverable.type] = (typeCounters[deliverable.type] || 0) + 1;
                          const deliverableNumber = typeCounters[deliverable.type];

                          const submission = getDeliverableStatus(
                            campaign,
                            submissions,
                            deliverable.type,
                            deliverableNumber
                          );

                          renderSlots.push(
                            <div
                              key={`${deliverable.type}_${deliverableNumber}`}
                              className={`flex items-center justify-between p-3 rounded-lg border ${submission?.status === "approved"
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : submission?.status === "needs_revision"
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                                  : submission?.status === "pending"
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                    : "border-border"
                                }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {/* Thumbnail Preview or Emoji */}
                                {submission ? (
                                  <a
                                    href={submission.contentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group flex-shrink-0"
                                    title="View on Platform"
                                  >
                                    <img
                                      src={submission.thumbnailUrl || submission.contentUrl || "https://via.placeholder.com/80"}
                                      alt={`${deliverable.type} #${deliverableNumber}`}
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                                      }}
                                    />
                                    {(deliverable.type === "Reel" || deliverable.type === "Video" || deliverable.type === "TikTok") && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
                                        <Play className="w-6 h-6 text-white fill-white" />
                                      </div>
                                    )}
                                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ExternalLink className="w-3 h-3 text-white" />
                                    </div>
                                  </a>
                                ) : (
                                  <span className="text-3xl flex-shrink-0">
                                    {deliverable.type === "Post" ? "📸" :
                                      deliverable.type === "Reel" ? "🎬" :
                                        deliverable.type === "Story" ? "📱" :
                                          deliverable.type === "Carousel" ? "🖼️" :
                                            deliverable.type === "Video" ? "🎥" : "✨"}
                                  </span>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {deliverable.type} #{deliverableNumber} {deliverable.platform ? `- ${deliverable.platform.charAt(0).toUpperCase() + deliverable.platform.slice(1)}` : ""}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={deliverable.required ? "default" : "outline"} className="text-xs">
                                      {deliverable.required ? "Requerido" : "Opcional"}
                                    </Badge>
                                    {submission && (
                                      <Badge
                                        variant={
                                          submission.status === "approved"
                                            ? "default"
                                            : submission.status === "needs_revision"
                                              ? "destructive"
                                              : submission.status === "revision_requested"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className={
                                          submission.status === "approved"
                                            ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                            : "text-xs"
                                        }
                                      >
                                        {submission.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {(submission.status === "needs_revision" || submission.status === "revision_requested") && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {submission.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                        {submission.status.replace(/_/g, " ").toUpperCase()}
                                      </Badge>
                                    )}
                                  </div>
                                  {submission?.revisionHistory && submission.revisionHistory.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        Historial de Cambios
                                      </div>
                                      <div className="space-y-4">
                                        {submission.revisionHistory.map((rev, index) => (
                                          <div key={index} className="flex flex-col gap-2">
                                            {/* Revision Requested */}
                                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200">
                                              <div className="flex items-center gap-1.5 mb-2">
                                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                <span className="text-sm font-semibold text-red-800 dark:text-red-300">
                                                  Cambios Solicitados (Revisión #{index + 1})
                                                </span>
                                                <span className="text-xs text-red-600/70 ml-auto">
                                                  {new Date(rev.requestedAt).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <div className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-2.5 rounded border border-red-100 dark:border-red-900/30">
                                                {rev.notes}
                                              </div>
                                            </div>
                                            
                                            {/* Resubmission Response */}
                                            {rev.resubmittedAt && (
                                              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 ml-4 relative">
                                                <div className="absolute top-0 left-[-16px] w-[12px] h-[50%] border-l-2 border-b-2 border-blue-200 rounded-bl-lg"></div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                                    Contenido Reenviado
                                                  </span>
                                                  <span className="text-xs text-blue-600/70 ml-auto">
                                                    {new Date(rev.resubmittedAt).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                {rev.previousMediaUrl && (
                                                  <a href={rev.previousMediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    Ver entrega anterior
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>

                                      {(submission.status === "revision_requested" || submission.status === "needs_revision") && (
                                        <div className="mt-4">
                                          <div className="mb-3 p-3 bg-red-100/60 dark:bg-red-900/40 rounded border border-red-200 dark:border-red-800/40 flex items-start gap-3">
                                            <MessageCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                            <div>
                                              <p className="text-sm text-red-900 dark:text-red-300 font-semibold mb-0.5">
                                                ¿Tienes dudas sobre esta corrección?
                                              </p>
                                              <p className="text-xs text-red-800/90 dark:text-red-400/90 leading-relaxed">
                                                Comunícate directamente con la marca usando el <strong>ícono de chat púrpura</strong> en la esquina inferior derecha ↘️ antes de regrabar o corregir tu contenido.
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="w-full text-xs font-medium py-4"
                                            onClick={() => handleResubmit(campaign, submission)}
                                          >
                                            <Upload className="w-4 h-4 mr-1.5" />
                                            Reenviar Contenido Corregido
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Delete button for pending submissions */}
                              {submission?.status === "pending" && submission.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSubmission(submission.id!)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        }
                      });

                      return renderSlots;
                    })()}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        );
      })}

      {
        selectedCampaign && (
          <DeliverableSubmissionDialog
            campaign={selectedCampaign}
            open={isDialogOpen}
            existingSubmission={submissionToResubmit || undefined}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedCampaign(null);
              setSubmissionToResubmit(null);
            }}
            onSuccess={() => {
              fetchActiveCampaigns();
            }}
          />
        )
      }
    </div >
  );
}