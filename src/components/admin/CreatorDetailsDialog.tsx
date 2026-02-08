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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MapPin, Phone, Instagram, Globe, Calendar, DollarSign, Award, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface CreatorDetailsDialogProps {
    creator: any;
    isOpen: boolean;
    onClose: () => void;
    applications?: any[]; // List of applications for this creator
}

export function CreatorDetailsDialog({ creator, isOpen, onClose, applications = [] }: CreatorDetailsDialogProps) {
    if (!creator) return null;

    // Filter applications for this creator
    const creatorApps = applications.filter(app => app.creatorId === creator.id && app.status === 'approved');

    // Check onboarding completion
    const getOnboardingStep = () => {
        if (!creator.contentTypes || creator.contentTypes.length === 0) {
            return { step: 1, message: "No ha completado el tipo de contenido" };
        }
        if (!creator.whoAppearsInContent || creator.whoAppearsInContent.length === 0) {
            return { step: 2, message: "No ha indicado quién aparece en su contenido" };
        }
        if (!creator.experienceTime) {
            return { step: 2, message: "No ha indicado su tiempo de experiencia" };
        }
        if (!creator.collaborationPreference) {
            return { step: 2, message: "No ha indicado su preferencia de colaboración" };
        }
        if (creator.hasBrandExperience === undefined) {
            return { step: 2, message: "No ha indicado experiencia con marcas" };
        }
        if (creator.onboardingCompleted) {
            return null; // Completed
        }
        return { step: 3, message: "Onboarding incompleto (información de redes)" };
    };

    const onboardingStatus = getOnboardingStep();
    const isOnboardingIncomplete = onboardingStatus !== null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={creator.avatar} objectFit="cover" />
                            <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl font-bold">{creator.name}</DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Mail className="w-3 h-3" />
                                {creator.email}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Badge variant={creator.status === 'active' ? 'default' : creator.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                                {creator.status}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        {/* Onboarding Status Alert */}
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

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Instagram className="w-3 h-3" /> Followers
                                </div>
                                <div className="font-semibold">{creator.followers}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Engagement
                                </div>
                                <div className="font-semibold">{creator.engagement}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Campaigns
                                </div>
                                <div className="font-semibold">{creatorApps.length}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Earnings
                                </div>
                                <div className="font-semibold">{creator.earnings}</div>
                            </div>
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
            </DialogContent>
        </Dialog>
    );
}
