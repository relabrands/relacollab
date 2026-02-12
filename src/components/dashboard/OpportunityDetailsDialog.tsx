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
                                    Personal Invitation
                                </Badge>
                            )}
                            <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Building2 className="w-4 h-4" />
                                <span>{opportunity.brandName || opportunity.brandProfile?.displayName || "Unknown Brand"}</span>
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

                {/* Campaign Stats Bar */}
                <div className="flex gap-4 mb-2 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{opportunity.applicationCount || 0}</span> Applications
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <UserCheck className="w-4 h-4 text-success" />
                        <span className="font-medium">{opportunity.approvedCount || 0} / {opportunity.creatorCount || "?"}</span> Spots Filled
                    </div>
                </div>

                <div className="space-y-6 py-4">
                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">Location</span>
                            </div>
                            <p>{opportunity.location || "Remote"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Deadline</span>
                            </div>
                            <p>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : (opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : "Open Duration")}</p>
                        </div>
                    </div>

                    {/* Reward Section */}
                    <div className="p-4 rounded-xl border border-border">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-primary" />
                            Compensation & Perks
                        </h4>

                        {(opportunity.compensationType === 'monetary' || opportunity.rewardType === 'paid') ? (
                            <div className="space-y-3">
                                <div className="space-y-2 pb-2 border-b border-border/50">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Pago Bruto de la Marca:</span>
                                        <span>${(opportunity.totalBudgetPerCreator || opportunity.creatorPayment || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            Fee de Servicio RELA ({opportunity.platformFeePercent || 0}%):
                                            <span className="group relative">
                                                <div className="cursor-help w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] border border-border">?</div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    Este fee cubre el uso de la plataforma, la gestión de la campaña y la garantía de pago seguro por parte de RELA Collab.
                                                </div>
                                            </span>
                                        </span>
                                        <span className="text-destructive">-${(opportunity.platformFeeAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-lg">Pago Neto a Recibir:</span>
                                    <span className="text-2xl font-bold text-success">
                                        ${(opportunity.creatorPayment || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary">Paid Project</Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium text-lg">
                                        {opportunity.compensationType === 'exchange'
                                            ? opportunity.exchangeDetails
                                            : (opportunity.reward || opportunity.budget || "Negotiable")}
                                    </p>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">Product Exchange</Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {opportunity.matchScore && (
                            <div className="text-right mt-2 pt-2 border-t border-dashed border-border/50">
                                <div className="text-sm font-medium text-success">{opportunity.matchScore}% Match Score</div>
                            </div>
                        )}
                    </div>

                    {/* Brand & Campaign Description */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">About the Brand</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {opportunity.brandProfile?.description || opportunity.brandDescription || "A leading brand in the active lifestyle space."}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">About the Campaign</h4>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {opportunity.description || "No description provided."}
                            </p>
                        </div>

                        {/* Campaign Goals/Objectives */}
                        {opportunity.goal && (
                            <div>
                                <h4 className="font-semibold mb-2">Campaign Objectives</h4>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {opportunity.goal}
                                </p>
                            </div>
                        )}
                        {/* Deliverables */}
                        {opportunity.deliverables && opportunity.deliverables.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3">Required Content</h4>
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
                                                    {item.quantity}x {item.type}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.required ? "Required" : "Optional"}
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
                            <h4 className="font-semibold mb-2">Vibe & Style</h4>
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
                        Close
                    </Button>
                    {!isActive && (
                        <Button
                            variant="hero"
                            onClick={onAccept}
                            className="w-full sm:w-auto"
                            disabled={!isInvited && (opportunity.approvedCount || 0) >= (opportunity.creatorCount || 999)}
                        >
                            {isInvited
                                ? "Accept Invitation"
                                : ((opportunity.approvedCount || 0) >= (opportunity.creatorCount || 999) ? "Campaign Full" : "Apply to Campaign")
                            }
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
