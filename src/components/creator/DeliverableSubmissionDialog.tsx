import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

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
    deliverableType: string;
    deliverableNumber: number;
    contentUrl: string;
    status: "pending" | "approved" | "needs_revision";
}

interface DeliverableSubmissionDialogProps {
    campaign: CampaignWithDeliverables;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeliverableSubmissionDialog({
    campaign,
    open,
    onClose,
    onSuccess,
}: DeliverableSubmissionDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submittedContent, setSubmittedContent] = useState<SubmittedContent[]>([]);
    const [selectedDeliverables, setSelectedDeliverables] = useState<Map<string, string>>(new Map());

    // Fetch existing submissions when dialog opens
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

    const handleSelectContent = (key: string, url: string) => {
        setSelectedDeliverables(prev => {
            const newMap = new Map(prev);
            newMap.set(key, url);
            return newMap;
        });
    };

    const handleSubmitSelected = async () => {
        if (selectedDeliverables.size === 0) {
            toast.error("Please select at least one deliverable to submit");
            return;
        }

        setLoading(true);
        try {
            const submissions = [];

            // Create submissions for each selected deliverable
            for (const [key, url] of selectedDeliverables.entries()) {
                const [type, numberStr] = key.split("_");
                const number = parseInt(numberStr);

                submissions.push(addDoc(collection(db, "content_submissions"), {
                    campaignId: campaign.id,
                    creatorId: user!.uid,
                    deliverableType: type,
                    deliverableNumber: number,
                    contentUrl: url,
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    metrics: {}, // Will be fetched from Instagram later
                }));
            }

            await Promise.all(submissions);
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
                        {deliverableSlots.map(slot => (
                            <div
                                key={slot.key}
                                className={`p-4 border-2 rounded-lg ${slot.submitted
                                        ? slot.submitted.status === "approved"
                                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                            : slot.submitted.status === "needs_revision"
                                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                                                : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                        : "border-border"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {slot.type === "Post" && "📸"}
                                            {slot.type === "Reel" && "🎬"}
                                            {slot.type === "Story" && "📱"}
                                            {slot.type === "Carousel" && "🖼️"}
                                            {slot.type === "Video" && "🎥"}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {slot.type} #{slot.number}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={slot.required ? "default" : "outline"}>
                                                    {slot.required ? "Required" : "Optional"}
                                                </Badge>
                                                {slot.submitted && (
                                                    <Badge
                                                        variant={
                                                            slot.submitted.status === "approved"
                                                                ? "success"
                                                                : slot.submitted.status === "needs_revision"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {slot.submitted.status === "approved" && <Check className="w-3 h-3 mr-1" />}
                                                        {slot.submitted.status === "needs_revision" && <AlertCircle className="w-3 h-3 mr-1" />}
                                                        {slot.submitted.status === "pending" && "⏳"}
                                                        {" "}
                                                        {slot.submitted.status.toUpperCase().replace("_", " ")}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {slot.submitted ? (
                                            <div className="text-sm text-muted-foreground">
                                                {slot.submitted.status === "needs_revision" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            // TODO: Open Instagram picker for resubmission
                                                            toast.info("Resubmission coming soon");
                                                        }}
                                                    >
                                                        Resubmit
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Open Instagram media picker
                                                    // For now, use placeholder
                                                    const placeholderUrl = `https://instagram.com/p/placeholder_${slot.key}`;
                                                    handleSelectContent(slot.key, placeholderUrl);
                                                    toast.success(`Selected ${slot.type} #${slot.number}`);
                                                }}
                                                disabled={loading}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                {selectedDeliverables.has(slot.key) ? "Selected ✓" : "Select from Instagram"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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
            </DialogContent>
        </Dialog>
    );
}
