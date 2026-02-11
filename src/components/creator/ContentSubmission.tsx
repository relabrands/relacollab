import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Trash2, Play, ExternalLink } from "lucide-react";
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
  }>;
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
        const needsRevision = submissions.filter(s => s.status === "needs_revision").length;

        return {
          campaign: {
            id: campaignId,
            name: campaignData.name,
            brandName: campaignData.brandName,
            deliverables,
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
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
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
      toast.error("Cannot delete: submission ID missing");
      return;
    }

    if (!confirm("Are you sure you want to delete this submission? This cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "content_submissions", submissionId));
      toast.success("Submission deleted successfully");
      // Refresh the campaigns list
      fetchActiveCampaigns();
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
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
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
          <p className="text-muted-foreground text-center">
            You don't have any approved campaigns yet. Apply to opportunities to get started!
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle>{campaign.name}</CardTitle>
                    {allRequiredComplete && (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {needsRevision > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {needsRevision} Needs Revision
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    by {campaign.brandName} • {totalApproved}/{totalRequired} Required Deliverables Approved
                  </CardDescription>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
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
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {needsRevision > 0 ? "Resubmit Content" : "Submit Content"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(campaign.id)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        View Deliverables ({totalSubmitted} submitted)
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="space-y-2">
                    {campaign.deliverables.map((deliverable) => {
                      return Array.from({ length: deliverable.quantity }, (_, index) => {
                        const deliverableNumber = index + 1;
                        const submission = getDeliverableStatus(
                          campaign,
                          submissions,
                          deliverable.type,
                          deliverableNumber
                        );

                        return (
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
                                  title="View on Instagram"
                                >
                                  <img
                                    src={submission.thumbnailUrl || submission.mediaUrl || "https://via.placeholder.com/80"}
                                    alt={`${deliverable.type} #${deliverableNumber}`}
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                                    }}
                                  />
                                  {(deliverable.type === "Reel" || deliverable.type === "Video") && (
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
                                  {deliverable.type === "Post" && "📸"}
                                  {deliverable.type === "Reel" && "🎬"}
                                  {deliverable.type === "Story" && "📱"}
                                  {deliverable.type === "Carousel" && "🖼️"}
                                  {deliverable.type === "Video" && "🎥"}
                                </span>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">
                                  {deliverable.type} #{deliverableNumber}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={deliverable.required ? "default" : "outline"} className="text-xs">
                                    {deliverable.required ? "Required" : "Optional"}
                                  </Badge>
                                  {submission && (
                                    <Badge
                                      variant={
                                        submission.status === "approved"
                                          ? "success"
                                          : submission.status === "needs_revision"
                                            ? "destructive"
                                            : submission.status === "revision_requested"
                                              ? "destructive"
                                              : submission.status === "resubmitted"
                                                ? "secondary"
                                                : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {submission.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                                      {(submission.status === "needs_revision" || submission.status === "revision_requested") && <AlertCircle className="w-3 h-3 mr-1" />}
                                      {submission.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                      {submission.status.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                {submission?.revisionHistory && submission.revisionHistory.length > 0 && (
                                  <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200">
                                    <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
                                      ✏️ Edits Requested:
                                    </p>
                                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                                      {submission.revisionHistory[submission.revisionHistory.length - 1].notes}
                                    </p>
                                    {submission.status === "revision_requested" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full text-xs"
                                        onClick={() => handleResubmit(campaign, submission)}
                                      >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Resubmit Content
                                      </Button>
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
                      });
                    })}
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