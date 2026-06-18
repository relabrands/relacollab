import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MapPin, Phone, Instagram, Globe, Calendar, DollarSign, Award, AlertCircle, CheckCircle2, Clock, Send, Heart, MessageCircle, Eye, Activity, Users } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "sonner";

interface CreatorDetailsDialogProps {
    creator: any;
    isOpen: boolean;
    onClose: () => void;
    applications?: any[];
    onStatusChange?: (creatorId: string, newStatus: string) => void;
}

export function CreatorDetailsDialog({ creator, isOpen, onClose, applications = [], onStatusChange }: CreatorDetailsDialogProps) {
    const [sendingReminder, setSendingReminder] = useState(false);

    if (!creator) return null;

    // Filter applications for this creator
    const creatorApps = applications.filter(app => app.creatorId === creator.id && app.status === 'approved');

    // Check onboarding completion
    const getOnboardingStep = () => {
        // Priority check: if completed, don't check details
        if (creator.onboardingCompleted) return null;

        // Step 1: Categories
        if (!creator.categories || creator.categories.length === 0) {
            return { step: 1, message: "No ha seleccionado categorías de contenido" };
        }
        // Step 2: Content Formats
        if (!creator.contentFormats || creator.contentFormats.length === 0) {
            return { step: 2, message: "No ha seleccionado formatos de contenido" };
        }
        // Step 3: Vibes (Optional) - We don't block on this, but good to know
        // Step 4: Details
        if (!creator.whoAppearsInContent || creator.whoAppearsInContent.length === 0) {
            return { step: 4, message: "No ha indicado quién aparece en su contenido" };
        }
        if (!creator.experienceTime) {
            return { step: 4, message: "No ha indicado su tiempo de experiencia" };
        }
        if (!creator.collaborationPreference) {
            return { step: 4, message: "No ha indicado su preferencia de colaboración" };
        }
        if (creator.hasBrandExperience === undefined) {
            return { step: 4, message: "No ha indicado experiencia con marcas" };
        }
        // Step 5: Social Handles (Optional)

        if (creator.onboardingCompleted) {
            return null; // Completed
        }
        return { step: 6, message: "Onboarding final (revisión pendiente)" };
    };

    const onboardingStatus = getOnboardingStep();
    const isOnboardingIncomplete = onboardingStatus !== null;

    const handleSendReminder = async () => {
        if (!onboardingStatus) return;
        setSendingReminder(true);
        try {
            const sendTestEmailFn = httpsCallable(functions, "sendTestEmail");
            await sendTestEmailFn({
                templateId: "onboarding_reminder",
                toEmail: creator.email,
                vars: {
                    name: creator.name || creator.displayName || "Creador",
                    stepMessage: `Paso ${onboardingStatus.step} - ${onboardingStatus.message}`,
                    dashboardUrl: "https://relacollab.com/creator",
                }
            });
            toast.success("Recordatorio enviado al creador");
        } catch (error) {
            toast.error("Error al enviar el recordatorio");
        } finally {
            setSendingReminder(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={creator.avatar} className="object-cover" />
                            <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl font-bold">{creator.name}</DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Mail className="w-3 h-3" />
                                {creator.email}
                            </div>
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-2">
                            <Badge
                                variant={creator.status === 'active' ? 'default' : creator.status === 'pending' ? 'secondary' : 'destructive'}
                                className={`capitalize ${
                                    creator.status === 'disqualified' ? 'bg-muted text-muted-foreground border-muted-foreground/20' : ''
                                }`}
                            >
                                {creator.status === 'disqualified' ? 'No califica' :
                                 creator.status === 'active' ? 'Activo' :
                                 creator.status === 'pending' ? 'Pendiente' :
                                 creator.status === 'suspended' ? 'Suspendido' : creator.status}
                            </Badge>
                            {/* Quick status actions */}
                            {onStatusChange && creator.status !== 'active' && (
                                <button
                                    onClick={() => onStatusChange(creator.id, 'active')}
                                    className="text-[11px] text-success hover:underline font-medium"
                                >
                                    ✓ Aprobar
                                </button>
                            )}
                            {onStatusChange && creator.status === 'pending' && (
                                <button
                                    onClick={() => onStatusChange(creator.id, 'disqualified')}
                                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    No califica
                                </button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        {/* Onboarding Status Alert */}
                        {/* Internal note for disqualified */}
                        {creator.status === 'disqualified' && (
                            <Alert className="border-muted-foreground/20 bg-muted/30">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <AlertDescription>
                                    <p className="font-medium text-muted-foreground">Uso interno — No califica</p>
                                    <p className="text-sm mt-1 text-muted-foreground/80">
                                        Este creador fue marcado como "No califica" por el equipo de RELA. No recibió ninguna notificación y no es visible para las marcas.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}

                        {creator.status === 'pending' && (
                            <Alert variant={isOnboardingIncomplete ? "destructive" : "default"} className="border-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <div>
                                        {isOnboardingIncomplete ? (
                                            <div>
                                                <p className="font-medium">Onboarding Incompleto</p>
                                                <p className="text-sm mt-1">
                                                    Se quedó en: <strong>Paso {onboardingStatus.step}</strong> - {onboardingStatus.message}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <p className="font-medium">Onboarding completado - Pendiente de aprobación</p>
                                            </div>
                                        )}
                                    </div>
                                    {isOnboardingIncomplete && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="ml-4 flex-shrink-0"
                                            onClick={handleSendReminder}
                                            disabled={sendingReminder}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            {sendingReminder ? "Enviando..." : "Enviar Recordatorio"}
                                        </Button>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Bio */}
                        {creator.bio && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Biografía</h4>
                                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                    {creator.bio}
                                </p>
                            </div>
                        )}

                        {/* Generic Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Colaboraciones
                                </div>
                                <div className="font-semibold">{creatorApps.length}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Ganancias
                                </div>
                                <div className="font-semibold">{creator.earnings || "$0"}</div>
                            </div>
                        </div>

                        {/* Detailed Social Metrics */}
                        <div className="space-y-4">
                            {/* Instagram */}
                            {creator.instagramConnected && creator.instagramMetrics && (
                                <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Instagram className="w-5 h-5 text-pink-500" />
                                        <h4 className="font-medium text-pink-700 dark:text-pink-400">Métricas de Instagram</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Seguidores</div>
                                            <div className="font-semibold">{creator.instagramMetrics.followers ? (creator.instagramMetrics.followers >= 10000 ? (creator.instagramMetrics.followers / 1000).toFixed(1) + 'K' : creator.instagramMetrics.followers) : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Engagement</div>
                                            <div className="font-semibold">{creator.instagramMetrics.engagementRate ? parseFloat(creator.instagramMetrics.engagementRate).toFixed(2) + '%' : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Prom. Likes</div>
                                            <div className="font-semibold">{creator.instagramMetrics.averageLikes ? (creator.instagramMetrics.averageLikes >= 1000 ? (creator.instagramMetrics.averageLikes / 1000).toFixed(1) + 'K' : creator.instagramMetrics.averageLikes) : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Prom. Comentarios</div>
                                            <div className="font-semibold">{creator.instagramMetrics.averageComments || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TikTok */}
                            {creator.tiktokConnected && creator.tiktokMetrics && (
                                <div className="bg-black/5 dark:bg-white/10 p-4 rounded-xl border border-black/10 dark:border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-md">Tk</div>
                                        <h4 className="font-medium">Métricas de TikTok</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Seguidores</div>
                                            <div className="font-semibold">{creator.tiktokMetrics.followers ? (creator.tiktokMetrics.followers >= 10000 ? (creator.tiktokMetrics.followers / 1000).toFixed(1) + 'K' : creator.tiktokMetrics.followers) : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Engagement</div>
                                            <div className="font-semibold">{creator.tiktokMetrics.engagementRate ? parseFloat(creator.tiktokMetrics.engagementRate).toFixed(2) + '%' : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Prom. Likes</div>
                                            <div className="font-semibold">{creator.tiktokMetrics.averageLikes ? (creator.tiktokMetrics.averageLikes >= 1000 ? (creator.tiktokMetrics.averageLikes / 1000).toFixed(1) + 'K' : creator.tiktokMetrics.averageLikes) : 'N/A'}</div>
                                        </div>
                                        <div className="bg-background/50 p-2 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Prom. Vistas</div>
                                            <div className="font-semibold">{creator.tiktokMetrics.averageViews ? (creator.tiktokMetrics.averageViews >= 1000 ? (creator.tiktokMetrics.averageViews / 1000).toFixed(1) + 'K' : creator.tiktokMetrics.averageViews) : 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(!creator.instagramConnected && !creator.tiktokConnected) && (
                                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                                    <p className="text-sm text-muted-foreground">No hay redes sociales conectadas.</p>
                                </div>
                            )}
                        </div>

                        {/* Onboarding Data (if pending) */}
                        {creator.status === 'pending' && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Datos del Onboarding
                                    </h4>

                                    {/* Content Types */}
                                    {creator.contentTypes && creator.contentTypes.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Tipo de Contenido</p>
                                            <div className="flex flex-wrap gap-2">
                                                {creator.contentTypes.map((type: string) => (
                                                    <Badge key={type} variant="secondary">{type}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Who Appears */}
                                    {creator.whoAppearsInContent && creator.whoAppearsInContent.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Quién aparece en el contenido</p>
                                            <div className="flex flex-wrap gap-2">
                                                {creator.whoAppearsInContent.map((who: string) => (
                                                    <Badge key={who} variant="outline">{who}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {creator.experienceTime && (
                                        <div className="bg-muted/20 p-3 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Tiempo de experiencia</p>
                                            <p className="text-sm font-medium mt-1">{creator.experienceTime}</p>
                                        </div>
                                    )}

                                    {/* Collaboration Preference */}
                                    {creator.collaborationPreference && (
                                        <div className="bg-muted/20 p-3 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Preferencia de colaboración</p>
                                            <p className="text-sm font-medium mt-1">{creator.collaborationPreference}</p>
                                        </div>
                                    )}

                                    {/* Brand Experience */}
                                    {creator.hasBrandExperience !== undefined && (
                                        <div className="bg-muted/20 p-3 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Experiencia con marcas</p>
                                            <p className="text-sm font-medium mt-1">{creator.hasBrandExperience ? "Sí" : "No"}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Personal Details</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Location:</span>
                                    <span>{creator.location || "Not specified"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span>{creator.phone || "Not specified"}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Social Handles</h4>
                                <div className="space-y-2">
                                    {creator.socialHandles?.instagram && (
                                        <div className="flex items-center gap-2 text-sm bg-muted/20 p-2 rounded-md">
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                            <span>@{creator.socialHandles.instagram}</span>
                                        </div>
                                    )}
                                    {creator.socialHandles?.tiktok && (
                                        <div className="flex items-center gap-2 text-sm bg-muted/20 p-2 rounded-md">
                                            <div className="w-4 h-4 bg-black text-white text-[8px] font-bold flex items-center justify-center rounded-full">Tk</div>
                                            <span>@{creator.socialHandles.tiktok}</span>
                                        </div>
                                    )}
                                    {!creator.socialHandles?.instagram && !creator.socialHandles?.tiktok && (
                                        <span className="text-sm text-muted-foreground italic">No handles added</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        {creator.categories && creator.categories.length > 0 && (
                            <div>
                                <h4 className="font-medium text-sm mb-3">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {creator.categories.map((cat: string) => (
                                        <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}


                        <Separator />

                        {/* Active Campaigns List */}
                        <div>
                            <h4 className="font-medium text-sm mb-4">Active & Approved Collaborations</h4>
                            {creatorApps.length > 0 ? (
                                <div className="space-y-3">
                                    {creatorApps.map((app, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{app.campaignTitle || "Unknown Campaign"}</span>
                                                <span className="text-xs text-muted-foreground">Status: <span className="text-green-600 font-medium capitalize">{app.status}</span></span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Reward: {app.budget || "N/A"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                                    No active collaborations found.
                                </div>
                            )}
                        </div>

                    </div>
                </ScrollArea>
            </DialogContent >
        </Dialog >
    );
}
