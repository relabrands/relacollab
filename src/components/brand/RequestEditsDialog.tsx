import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface ContentSubmission {
    id: string;
    campaignId: string;
    creatorId: string;
    deliverableType: string;
    deliverableNumber: number;
    contentUrl: string;
    status: "pending" | "approved" | "needs_revision" | "revision_requested" | "resubmitted";
}

interface RequestEditsDialogProps {
    content: ContentSubmission;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const editCategories = [
    { id: "lighting", label: "Mejorar Iluminación" },
    { id: "audio", label: "Mejorar Audio" },
    { id: "framing", label: "Mejorar Encuadre" },
    { id: "caption", label: "Cambios en el Texto" },
    { id: "voiceover", label: "Añadir Voz en Off" },
    { id: "music", label: "Cambiar Música" },
    { id: "reshoot", label: "Volver a Grabar" },
    { id: "other", label: "Otro" },
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
            toast.error("Por favor, provee una corrección específica para el creador");
            return;
        }

        if (!user) {
            toast.error("Debes iniciar sesión");
            return;
        }

        setLoading(true);
        try {
            const categoryLabels = selectedCategories
                .map(catId => editCategories.find(c => c.id === catId)?.label)
                .filter(Boolean);
            
            const categoryText = categoryLabels.length > 0 
                ? `Tipos de mejora sugeridos: ${categoryLabels.join(", ")}\n\nDetalles:\n` 
                : "";
                
            const finalNotes = categoryText + feedback.trim();

            // Update content status to revision_requested and add to revisionHistory
            await updateDoc(doc(db, "content_submissions", content.id), {
                status: "revision_requested",
                revisionHistory: arrayUnion({
                    requestedAt: new Date().toISOString(),
                    requestedBy: user.uid,
                    notes: finalNotes
                })
            });

            toast.success("Corrección solicitada exitosamente");
            setFeedback("");
            setSelectedCategories([]);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Hubo un error al solicitar la corrección");
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
                        Solicitar Corrección
                    </DialogTitle>
                    <DialogDescription>
                        Frecuentemente detalla los cambios o mejoras que buscas en el entregable.
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
                        <Label className="mb-3 block">¿Qué necesita ser arreglado? (opcional)</Label>
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
                            Detalles de la corrección *
                        </Label>
                        <Textarea
                            id="feedback"
                            placeholder="Sé específico sobre qué quieres cambiar. Ejemplo: 'Por favor, grábalo con mejor iluminación natural y añade el audio en tendencia.'"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Aportar feedback directo y constructivo le ayuda a los creadores a entenderte mejor.
                        </p>
                    </div>

                    {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">Seleccionado:</span>
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
                        Cancelar
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSubmit}
                        disabled={loading || !feedback.trim()}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Enviar Solicitud
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
