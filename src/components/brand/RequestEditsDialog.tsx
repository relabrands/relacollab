import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface ContentSubmission {
    id: string;
    campaignId: string;
    creatorId: string;
    deliverableType: string;
    deliverableNumber: number;
    contentUrl: string;
    status: "pending" | "approved" | "needs_revision";
}

interface RequestEditsDialogProps {
    content: ContentSubmission;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const editCategories = [
    { id: "lighting", label: "Improve Lighting" },
    { id: "audio", label: "Audio Quality" },
    { id: "framing", label: "Better Framing" },
    { id: "caption", label: "Caption Changes" },
    { id: "voiceover", label: "Add Voiceover" },
    { id: "music", label: "Different Music" },
    { id: "reshoot", label: "Needs Reshoot" },
    { id: "other", label: "Other" },
];

export function RequestEditsDialog({
    content,
    open,
    onClose,
    onSuccess,
}: RequestEditsDialogProps) {
    const { user } = useAuth();
    const [feedback, setFeedback] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            toast.error("Please provide feedback for the creator");
            return;
        }

        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setLoading(true);
        try {
            // 1. Create edit request
            await addDoc(collection(db, "content_edit_requests"), {
                contentId: content.id,
                campaignId: content.campaignId,
                creatorId: content.creatorId,
                brandId: user.uid,
                feedback,
                categories: selectedCategories,
                status: "pending",
                createdAt: new Date().toISOString(),
            });

            // 2. Update content status to needs_revision
            await updateDoc(doc(db, "content_submissions", content.id), {
                status: "needs_revision",
                editRequest: {
                    feedback,
                    createdAt: new Date().toISOString(),
                },
            });

            toast.success("Edit request sent to creator");
            setFeedback("");
            setSelectedCategories([]);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error requesting edits:", error);
            toast.error("Failed to send edit request");
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Request Edits
                    </DialogTitle>
                    <DialogDescription>
                        Provide specific feedback to the creator on what needs to be improved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Content Info */}
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <span className="text-2xl">
                            {content.deliverableType === "Post" && "📸"}
                            {content.deliverableType === "Reel" && "🎬"}
                            {content.deliverableType === "Story" && "📱"}
                            {content.deliverableType === "Carousel" && "🖼️"}
                            {content.deliverableType === "Video" && "🎥"}
                        </span>
                        <div>
                            <div className="font-medium">
                                {content.deliverableType} #{content.deliverableNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {content.contentUrl}
                            </div>
                        </div>
                    </div>

                    {/* Edit Categories */}
                    <div>
                        <Label className="mb-3 block">What needs improvement? (optional)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {editCategories.map(category => (
                                <div
                                    key={category.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={category.id}
                                        checked={selectedCategories.includes(category.id)}
                                        onCheckedChange={() => toggleCategory(category.id)}
                                    />
                                    <label
                                        htmlFor={category.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {category.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div>
                        <Label htmlFor="feedback" className="mb-2 block">
                            Detailed Feedback *
                        </Label>
                        <Textarea
                            id="feedback"
                            placeholder="Be specific about what needs to change. Example: 'Please reshoot with better natural lighting and add trending audio in the background...'"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Clear, constructive feedback helps creators deliver exactly what you need.
                        </p>
                    </div>

                    {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">Selected:</span>
                            {selectedCategories.map(catId => {
                                const category = editCategories.find(c => c.id === catId);
                                return (
                                    <Badge key={catId} variant="secondary">
                                        {category?.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSubmit}
                        disabled={loading || !feedback.trim()}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Send Edit Request
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
