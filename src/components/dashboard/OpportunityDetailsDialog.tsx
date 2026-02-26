import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, DollarSign, Gift, Check, ExternalLink, Sparkles, Building2, Users, UserCheck, Instagram } from "lucide-react";

interface OpportunityDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: any;
    onAccept: () => void;
    isActive?: boolean;
}

export function OpportunityDetailsDialog({ isOpen, onClose, opportunity, onAccept, isActive }: OpportunityDetailsDialogProps) {
    if (!opportunity) return null;

    const isInvited = opportunity.isInvited;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <img
                            src={opportunity.brandLogo || opportunity.image || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop"}
                            alt={opportunity.brandName || opportunity.brandProfile?.displayName}
                            className="w-16 h-16 rounded-xl object-cover border"
                        />
                        <div>
                            {isInvited && (
                                <Badge variant="default" className="mb-2 bg-gradient-brand border-none">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Invitación Personal
                                </Badge>
                            )}
                            <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Building2 className="w-4 h-4" />
                                <span>{opportunity.brandName || opportunity.brandProfile?.displayName || "Marca Desconocida"}</span>
                                {opportunity.brandProfile?.instagram && (
                                    <a
                                        href={`https://instagram.com/${opportunity.brandProfile.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center ml-2 text-pink-600 hover:text-pink-700 font-medium text-xs bg-pink-50 px-2 py-0.5 rounded-full"
                                    >
                                        <Instagram className="w-3 h-3 mr-1" />
                                        @{opportunity.brandProfile.instagram.replace('@', '')}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Cover Image */}
                {opportunity.coverImage && (
                    <div className="w-full h-48 rounded-xl overflow-hidden mb-4 relative">
                        <img
                            src={opportunity.coverImage}
                            alt={opportunity.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                )}

                {/* Campaign Stats Bar */}
                <div className="flex gap-4 mb-2 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{opportunity.applicationCount || 0}</span> Solicitudes
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <UserCheck className="w-4 h-4 text-success" />
                        <span className="font-medium">{opportunity.approvedCount || 0} / {opportunity.creatorCount || "?"}</span> Cupos Llenos
                    </div>
                </div>

                <div className="space-y-6 py-4">
                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">Ubicación</span>
                            </div>
                            <p>{opportunity.location || "Remoto"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Fecha Límite</span>
                            </div>
                            <p>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : (opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : "Duración Abierta")}</p>
                        </div>
                    </div>

                    {/* Reward Section */}
                    <div className="p-4 rounded-xl border border-border">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-primary" />
                            Compensación y Beneficios
                        </h4>

                        {(opportunity.compensationType === 'monetary' || opportunity.rewardType === 'paid') ? (
                            <div className="space-y-3">
                                <div className="space-y-2 pb-2 border-b border-border/50">
                                    {/* Show range if available, otherwise fallback to fixed */}
                                    {opportunity.minReward && opportunity.maxReward ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Rango de Pago por Creador:</span>
                                                <span className="font-bold text-lg text-primary">
                                                    ${opportunity.minReward.toLocaleString()} – ${opportunity.maxReward.toLocaleString()} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Mínimo garantizado (si aprueba):</span>
                                                <span className="text-green-600 font-medium">${opportunity.minReward.toLocaleString()} USD</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Fee de Servicio RELA ({opportunity.platformFeePercent || 0}%):</span>
                                                <span className="text-destructive">-${(opportunity.platformFeeAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Presupuesto de la Campaña:</span>
                                                <span>${(opportunity.totalBudgetPerCreator || opportunity.creatorPayment || opportunity.budget || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    Fee de Servicio RELA ({opportunity.platformFeePercent || 0}%)
                                                    <span className="group relative">
                                                        <div className="cursor-help w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] border border-border">?</div>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            Este fee se deduce del presupuesto total para cubrir el uso de la plataforma y garantía de pago seguro.
                                                        </div>
                                                    </span>
                                                </span>
                                                <span className="text-destructive">-${(opportunity.platformFeeAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-lg">Tu Pago Neto:</span>
                                    <span className="text-2xl font-bold text-success">
                                        ${(opportunity.creatorPayment || opportunity.budget || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary">Proyecto Pagado</Badge>
                                    {opportunity.minReward && opportunity.maxReward && (
                                        <Badge variant="outline" className="border-amber-300 text-amber-600">
                                            ✨ Basado en calidad y performance
                                        </Badge>
                                    )}
                                </div>
                                {opportunity.minReward && opportunity.maxReward && (
                                    <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
                                        La marca asignará el pago final entre <strong>${opportunity.minReward.toLocaleString()}</strong> y <strong>${opportunity.maxReward.toLocaleString()}</strong> al aprobar tu contenido. El mínimo garantizado es <strong>${opportunity.minReward.toLocaleString()} USD</strong>.
                                    </p>
                                )}
                            </div>
                        ) : opportunity.compensationType === 'hybrid' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-semibold text-lg">Tu Pago Neto:</span>
                                    <span className="text-2xl font-bold text-success">
                                        ${(opportunity.creatorPayment || opportunity.budget || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <p className="font-medium text-sm text-muted-foreground">Más intercambio de producto:</p>
                                    <p className="font-medium">
                                        {opportunity.exchangeDetails || "Detalles de intercambio no especificados"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary">Pago Mixto</Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium text-lg">
                                        {opportunity.compensationType === 'exchange'
                                            ? opportunity.exchangeDetails
                                            : (opportunity.reward || opportunity.budget || "Negociable")}
                                    </p>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">Intercambio de Producto</Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {opportunity.matchScore !== undefined && (
                            <div className="text-right mt-2 pt-2 border-t border-dashed border-border/50">
                                <div className="text-sm font-medium text-success">{opportunity.matchScore}% Match Score</div>
                            </div>
                        )}
                    </div>

                    {/* Brand & Campaign Description */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Sobre la Marca</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {opportunity.brandProfile?.description || opportunity.brandDescription || "Una marca líder."}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Sobre la Campaña</h4>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {opportunity.description || "No se proporcionó descripción."}
                            </p>
                        </div>

                        {/* Campaign Goals/Objectives */}
                        {opportunity.goal && (
                            <div>
                                <h4 className="font-semibold mb-2">Objetivos de la Campaña</h4>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {opportunity.goal}
                                </p>
                            </div>
                        )}
                        {/* Deliverables */}
                        {opportunity.deliverables && opportunity.deliverables.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3">Contenido Requerido</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {opportunity.deliverables.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                            <div className="text-2xl">
                                                {item.type === "Post" && "📸"}
                                                {item.type === "Reel" && "🎬"}
                                                {item.type === "Story" && "📱"}
                                                {item.type === "Carousel" && "🖼️"}
                                                {item.type === "Video" && "🎥"}
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {item.quantity}x {item.type}{item.platform ? ` ${item.platform.toLowerCase() === 'tiktok' ? 'TikTok' : 'Instagram'}` : ''}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.required ? "Requerido" : "Opcional"}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Requirements/Vibes */}
                    {opportunity.vibes && opportunity.vibes.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Vibe y Estilo</h4>
                            <div className="flex flex-wrap gap-2">
                                {opportunity.vibes.map((vibe: string) => (
                                    <Badge key={vibe} variant="outline" className="px-3 py-1">
                                        {vibe}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                    {!isActive && (
                        <Button
                            variant="hero"
                            onClick={onAccept}
                            className="w-full sm:w-auto"
                            disabled={!isInvited && (opportunity.approvedCount || 0) >= (opportunity.creatorCount || 999)}
                        >
                            {isInvited
                                ? "Aceptar Invitación"
                                : ((opportunity.approvedCount || 0) >= (opportunity.creatorCount || 999) ? "Campaña Llena" : "Aplicar a la Campaña")
                            }
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
