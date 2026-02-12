import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { InstagramMediaPicker } from "./InstagramMediaPicker";

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: string;
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    like_count?: number;
    comments_count?: number;
    view_count?: number; // Added for TikTok compatibility
}

import { TikTokMediaPicker } from "./TikTokMediaPicker";

interface DeliverableItem {
    type: string;
    quantity: number;
    required: boolean;
}

interface CampaignWithDeliverables {
    id: string;
    name: string;
    deliverables: DeliverableItem[];
}

interface SubmittedContent {
    id?: string;
    deliverableType: string;
    deliverableNumber: number;
    contentUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    status: "pending" | "approved" | "needs_revision" | "revision_requested" | "resubmitted";
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

interface DeliverableSubmissionDialogProps {
    campaign: CampaignWithDeliverables;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingSubmission?: SubmittedContent; // For resubmission
}

export function DeliverableSubmissionDialog({
    campaign,
    open,
    onClose,
    onSuccess,
    existingSubmission,
}: DeliverableSubmissionDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submittedContent, setSubmittedContent] = useState<SubmittedContent[]>([]);
    const [selectedDeliverables, setSelectedDeliverables] = useState<Map<string, InstagramMedia>>(new Map());
    const [showInstagramPicker, setShowInstagramPicker] = useState(false);
    const [showTikTokPicker, setShowTikTokPicker] = useState(false);
    const [currentDeliverable, setCurrentDeliverable] = useState<{ key: string; type: string } | null>(null);

    // Fetch existing submissions when dialog opens
    useEffect(() => {
        if (open) {
            fetchExistingSubmissions();
        }
    }, [open, user, campaign.id]);

    const fetchExistingSubmissions = async () => {
        if (!user || !campaign.id) return;

        try {
            const q = query(
                collection(db, "content_submissions"),
                where("campaignId", "==", campaign.id),
                where("creatorId", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            const submissions = snapshot.docs.map(doc => doc.data() as SubmittedContent);
            setSubmittedContent(submissions);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        }
    };

    // Generate deliverable items from campaign config
    const generateDeliverableSlots = () => {
        const slots: Array<{
            type: string;
            number: number;
            required: boolean;
            key: string;
            submitted?: SubmittedContent;
        }> = [];

        campaign.deliverables?.forEach(deliverable => {
            for (let i = 1; i <= deliverable.quantity; i++) {
                const key = `${deliverable.type}_${i}`;
                const existing = submittedContent.find(
                    s => s.deliverableType === deliverable.type && s.deliverableNumber === i
                );

                slots.push({
                    type: deliverable.type,
                    number: i,
                    required: deliverable.required,
                    key,
                    submitted: existing,
                });
            }
        });

        return slots;
    };

    const deliverableSlots = generateDeliverableSlots();
    const missingRequired = deliverableSlots.filter(
        slot => slot.required && !slot.submitted
    ).length;

    const handleOpenInstagramPicker = (key: string, type: string) => {
        setCurrentDeliverable({ key, type });
        setShowInstagramPicker(true);
    };

    const handleOpenTikTokPicker = (key: string, type: string) => {
        setCurrentDeliverable({ key, type });
        setShowTikTokPicker(true);
    };

    const handleInstagramMediaSelected = (media: InstagramMedia) => {
        if (currentDeliverable) {
            setSelectedDeliverables(prev => {
                const newMap = new Map(prev);
                newMap.set(currentDeliverable.key, media);
                return newMap;
            });
            toast.success(`Selected ${currentDeliverable.type} from Instagram`);
        }
        setShowInstagramPicker(false);
        setCurrentDeliverable(null);
    };

    const handleTikTokMediaSelected = (media: any) => {
        if (currentDeliverable) {
            setSelectedDeliverables(prev => {
                const newMap = new Map(prev);
                // Adapt TikTok media structure to minimal interface if needed, or just store as is
                newMap.set(currentDeliverable.key, {
                    ...media,
                    media_type: "VIDEO", // Force standardized type
                    platform: "tiktok"
                });
                return newMap;
            });
            toast.success(`Selected ${currentDeliverable.type} from TikTok`);
        }
        setShowTikTokPicker(false);
        setCurrentDeliverable(null);
    };

    const handleSubmitSelected = async () => {
        if (selectedDeliverables.size === 0) {
            toast.error("Please select at least one deliverable to submit");
            return;
        }

        setLoading(true);
        try {
            // RESUBMISSION MODE: Update existing submission
            if (existingSubmission && existingSubmission.id) {
                const [key, media] = Array.from(selectedDeliverables.entries())[0]; // Get first selected media

                if (!media) {
                    toast.error("Please select content to resubmit");
                    setLoading(false);
                    return;
                }

                const previousMediaUrl = existingSubmission.contentUrl;
                const latestRevision = existingSubmission.revisionHistory?.[existingSubmission.revisionHistory.length - 1];

                // Update existing submission
                const submissionRef = doc(db, "content_submissions", existingSubmission.id);
                await updateDoc(submissionRef, {
                    contentUrl: media.permalink,
                    mediaUrl: media.media_url || "",
                    thumbnailUrl: media.thumbnail_url || media.media_url || "",
                    caption: media.caption || "",
                    mediaType: media.media_type,
                    status: "resubmitted",
                    updatedAt: new Date().toISOString(),
                    metrics: {
                        likes: media.like_count || 0,
                        comments: media.comments_count || 0,
                        views: 0,
                        reach: 0,
                        saved: 0,
                        shares: 0,
                        interactions: 0
                    },
                    revisionHistory: arrayUnion({
                        ...latestRevision,
                        resubmittedAt: new Date().toISOString(),
                        previousMediaUrl
                    })
                });

                // Auto-fetch metrics for resubmitted content
                try {
                    // Start metrics Logic
                    if ((media as any).platform === 'tiktok') {
                        // TikTok metrics are already in the media object from selection (approx),
                        // but ideally we'd want to refresh them. For sandbox, we might not have a separate 'getSingleVideo' endpoint easily.
                        // We will trust the selection values for now.
                        console.log("TikTok submission - using fresh selection metrics");
                        await updateDoc(submissionRef, {
                            "metrics.views": media.view_count || 0,
                            "metrics.likes": media.like_count || 0,
                            "metrics.comments": media.comments_count || 0,
                            "metrics.shares": (media as any).share_count || 0,
                            "metrics.inputPlatform": "tiktok",
                            "metrics.updatedAt": new Date().toISOString()
                        });
                    } else {
                        // Instagram Logic
                        const match = media.permalink.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
                        const postId = match ? match[2] : null;

                        if (postId) {
                            console.log("📡 Fetching metrics for resubmitted content:", postId);
                            fetch("https://us-central1-rella-collab.cloudfunctions.net/getPostMetrics", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: user!.uid, postId })
                            }).then(async (res) => {
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data.success && data.metrics) {
                                        await updateDoc(submissionRef, {
                                            "metrics.views": data.metrics.views || 0,
                                            "metrics.reach": data.metrics.reach || 0,
                                            "metrics.saved": data.metrics.saved || 0,
                                            "metrics.shares": data.metrics.shares || 0,
                                            "metrics.interactions": data.metrics.interactions || 0,
                                            "metrics.likes": data.metrics.likes || 0,
                                            "metrics.comments": data.metrics.comments || 0,
                                            "metrics.updatedAt": new Date().toISOString()
                                        });
                                        console.log("✅ Fetched metrics for resubmitted content");
                                    }
                                }
                            }).catch(err => console.error("Error fetching metrics for resubmission:", err));
                        }
                    }
                } catch (e) {
                    console.error("Error initiating metric fetch for resubmission:", e);
                }

                toast.success("Content resubmitted successfully!");
                setSelectedDeliverables(new Map());
                onSuccess();
                onClose();
                setLoading(false);
                return;
            }

            // NORMAL SUBMISSION MODE: Create new documents
            const submissionPromises = Array.from(selectedDeliverables.entries()).map(async ([key, media]) => {
                const [type, numberStr] = key.split("_");
                const number = parseInt(numberStr);

                // 1. Create the submission document locally first
                const docRef = await addDoc(collection(db, "content_submissions"), {
                    campaignId: campaign.id,
                    creatorId: user!.uid,
                    userId: user!.uid, // For BrandAnalytics grouping
                    deliverableType: type,
                    deliverableNumber: number,
                    contentUrl: media.permalink,
                    mediaUrl: media.media_url || "",
                    thumbnailUrl: media.thumbnail_url || media.media_url || "",
                    caption: media.caption || "",
                    mediaType: media.media_type,
                    platform: (media as any).platform || "instagram", // Save platform explicitly
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    metrics: {
                        likes: media.like_count || 0,
                        comments: media.comments_count || 0,
                        views: 0,
                        reach: 0,
                        saved: 0,
                        shares: 0,
                        interactions: 0
                    },
                });

                // 2. Fetch detailed metrics immediately (Fire and forget, but we await the start)
                try {
                    const match = media.permalink.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
                    const postId = match ? match[2] : null;

                    console.log("🔍 Auto-fetch metrics:", { permalink: media.permalink, postId, hasMatch: !!match });

                    if ((media as any).platform === 'tiktok') {
                        console.log("Using TikTok metrics from selection for new submission");
                        await updateDoc(docRef, {
                            "metrics.views": media.view_count || 0,
                            "metrics.likes": media.like_count || 0,
                            "metrics.comments": media.comments_count || 0,
                            "metrics.shares": (media as any).share_count || 0,
                            "metrics.inputPlatform": "tiktok",
                            "metrics.updatedAt": new Date().toISOString(),
                            metricsLastFetched: new Date().toISOString()
                        });
                    } else {
                        // Instagram Logic
                        if (postId) {
                            // We use fetch here to call our cloud function
                            console.log("📡 Calling getPostMetrics for postId:", postId);
                            fetch("https://us-central1-rella-collab.cloudfunctions.net/getPostMetrics", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: user!.uid, postId })
                            }).then(async (res) => {
                                console.log("📥 getPostMetrics response status:", res.status);

                                if (res.ok) {
                                    const data = await res.json();
                                    console.log("📊 getPostMetrics data:", data);

                                    if (data.success && data.metrics) {
                                        // Update the doc we just created with complete metrics
                                        await updateDoc(docRef, {
                                            "metrics.views": data.metrics.views || 0,
                                            "metrics.reach": data.metrics.reach || 0,
                                            "metrics.saved": data.metrics.saved || 0,
                                            "metrics.shares": data.metrics.shares || 0,
                                            "metrics.interactions": data.metrics.interactions || 0,
                                            "metrics.likes": data.metrics.likes || 0,
                                            "metrics.comments": data.metrics.comments || 0,
                                            "metrics.updatedAt": new Date().toISOString(),
                                            metricsLastFetched: new Date().toISOString()
                                        });
                                        console.log("✅ Automatically fetched detailed metrics for submission");
                                    } else {
                                        console.warn("⚠️ getPostMetrics succeeded but no metrics:", data);
                                    }
                                } else {
                                    const errorText = await res.text();
                                    console.error("❌ getPostMetrics HTTP error:", res.status, errorText);
                                }
                            }).catch(err => console.error("❌ Error auto-fetching metrics:", err));
                        } else {
                            console.warn("⚠️ Could not extract postId from permalink:", media.permalink);
                        }
                    }
                } catch (e) {
                    console.error("❌ Error initiating metric fetch", e);
                }

                return docRef;
            });

            await Promise.all(submissionPromises);
            toast.success(`Submitted ${selectedDeliverables.size} deliverable(s)`);
            setSelectedDeliverables(new Map());
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting deliverables:", error);
            toast.error("Failed to submit content");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Submit Campaign Deliverables</DialogTitle>
                        <DialogDescription>
                            Campaign: <span className="font-medium">{campaign.name}</span>
                            {missingRequired > 0 && (
                                <span className="text-orange-600 ml-2">
                                    • {missingRequired} required deliverable(s) remaining
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[50vh] overflow-y-auto pr-4">
                        <div className="space-y-3">
                            {deliverableSlots.map(slot => {
                                const selectedMedia = selectedDeliverables.get(slot.key);

                                return (
                                    <div
                                        key={slot.key}
                                        className={`p-4 border-2 rounded-lg ${slot.submitted
                                            ? slot.submitted.status === "approved"
                                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                : slot.submitted.status === "needs_revision"
                                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                                                    : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                            : selectedMedia
                                                ? "border-primary bg-primary/5"
                                                : "border-border"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                {/* Icon or Thumbnail */}
                                                <div className="flex-shrink-0">
                                                    {slot.submitted?.thumbnailUrl ? (
                                                        <img
                                                            src={slot.submitted.thumbnailUrl}
                                                            alt={`${slot.type} #${slot.number}`}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                        />
                                                    ) : selectedMedia ? (
                                                        (selectedMedia.media_type === 'VIDEO' || selectedMedia.media_type === 'REELS') && !selectedMedia.thumbnail_url ? (
                                                            <video
                                                                src={selectedMedia.media_url}
                                                                className="w-16 h-16 rounded-lg object-cover"
                                                                muted
                                                            />
                                                        ) : (
                                                            <img
                                                                src={selectedMedia.thumbnail_url || selectedMedia.media_url}
                                                                alt="Selected"
                                                                className="w-16 h-16 rounded-lg object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = "https://placehold.co/400x400?text=No+Image";
                                                                }}
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                                                            {slot.type === "Post" && "📸"}
                                                            {(slot.type === "Reel" || slot.type === "Video") && "🎥"}
                                                            {slot.type === "Story" && "📱"}
                                                            {slot.type === "Carousel" && "🖼️"}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">
                                                        {slot.type} #{slot.number}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <Badge variant={slot.required ? "default" : "outline"} className="text-xs">
                                                            {slot.required ? "Required" : "Optional"}
                                                        </Badge>
                                                        {slot.submitted && (
                                                            <Badge
                                                                variant={
                                                                    slot.submitted.status === "approved"
                                                                        ? "default"
                                                                        : slot.submitted.status === "needs_revision"
                                                                            ? "destructive"
                                                                            : "secondary"
                                                                }
                                                                className={
                                                                    slot.submitted.status === "approved"
                                                                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                                                        : "text-xs"
                                                                }
                                                            >
                                                                {slot.submitted.status === "approved" && <Check className="w-3 h-3 mr-1" />}
                                                                {slot.submitted.status === "needs_revision" && <AlertCircle className="w-3 h-3 mr-1" />}
                                                                {slot.submitted.status === "pending" && "⏳"}
                                                                {" "}
                                                                {slot.submitted.status.replace("_", " ").toUpperCase()}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Caption preview */}
                                                    {(slot.submitted?.caption || selectedMedia?.caption) && (
                                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                            {slot.submitted?.caption || selectedMedia?.caption}
                                                        </p>
                                                    )}

                                                    {/* Metrics */}
                                                    {(slot.submitted?.metrics || selectedMedia) && (
                                                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                                            {(slot.submitted?.metrics?.likes || selectedMedia?.like_count) && (
                                                                <span>❤️ {(slot.submitted?.metrics?.likes || selectedMedia?.like_count || 0).toLocaleString()}</span>
                                                            )}
                                                            {(slot.submitted?.metrics?.comments || selectedMedia?.comments_count) && (
                                                                <span>💬 {slot.submitted?.metrics?.comments || selectedMedia?.comments_count}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                {slot.submitted ? (
                                                    <div className="text-sm text-muted-foreground">
                                                        {slot.submitted.status === "needs_revision" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenInstagramPicker(slot.key, slot.type)}
                                                            >
                                                                Resubmit
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant={selectedMedia ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleOpenInstagramPicker(slot.key, slot.type)}
                                                            disabled={loading}
                                                            className={selectedMedia && (selectedMedia as any).platform !== 'tiktok' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                                        >
                                                            {selectedMedia && (selectedMedia as any).platform !== 'tiktok' ? (
                                                                <>
                                                                    <Check className="w-4 h-4 mr-2" />
                                                                    Change IG
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="w-4 h-4 mr-2" />
                                                                    Select Instagram
                                                                </>
                                                            )}
                                                        </Button>

                                                        {/* Only show TikTok for video types */}
                                                        {["Video", "Reel", "Post"].includes(slot.type) && (
                                                            <Button
                                                                variant={selectedMedia && (selectedMedia as any).platform === 'tiktok' ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => handleOpenTikTokPicker(slot.key, slot.type)}
                                                                disabled={loading}
                                                                className={selectedMedia && (selectedMedia as any).platform === 'tiktok' ? "bg-black hover:bg-gray-800 text-white" : ""}
                                                            >
                                                                {selectedMedia && (selectedMedia as any).platform === 'tiktok' ? (
                                                                    <>
                                                                        <Check className="w-4 h-4 mr-2" />
                                                                        Change TikTok
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                                                        Select TikTok
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {selectedDeliverables.size} deliverable(s) selected
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose} disabled={loading}>
                                Close
                            </Button>
                            <Button
                                variant="hero"
                                onClick={handleSubmitSelected}
                                disabled={loading || selectedDeliverables.size === 0}
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Submit Selected
                            </Button>
                        </div>
                    </div>
                </DialogContent >
            </Dialog >

            {/* Instagram Media Picker */}
            {
                showInstagramPicker && currentDeliverable && user && (
                    <InstagramMediaPicker
                        open={showInstagramPicker}
                        onClose={() => {
                            setShowInstagramPicker(false);
                            setCurrentDeliverable(null);
                        }}
                        onSelect={handleInstagramMediaSelected}
                        userId={user.uid}
                        filterType={currentDeliverable.type as any}
                    />
                )
            }

            {/* TikTok Media Picker */}
            {
                showTikTokPicker && currentDeliverable && user && (
                    <TikTokMediaPicker
                        open={showTikTokPicker}
                        onClose={() => {
                            setShowTikTokPicker(false);
                            setCurrentDeliverable(null);
                        }}
                        onSelect={handleTikTokMediaSelected}
                        userId={user.uid}
                    />
                )
            }
        </>
    );
}
