import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScore } from "./MatchScore";
import { MapPin, DollarSign, Gift, Clock, ArrowRight, Upload, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface OpportunityCardProps {
  opportunity: {
    id: string;
    brandName: string;
    brandLogo: string;
    title: string;
    location: string;
    reward: string;
    rewardType: "paid" | "experience" | "hybrid";
    matchScore: number;
    deadline: string;
    tags: string[];
    isInvited?: boolean;
    endDate?: string;
    brandDescription?: string;
    goal?: string;
    compensationType?: string;
    creatorPayment?: string | number;
    minReward?: number;
    maxReward?: number;
    exchangeDetails?: string;
    coverImage?: string;
    deliverables?: Array<{ type: string; quantity: number; required: boolean; platform?: string }>;
  };
  onAccept?: (id: string) => void;
  isActive?: boolean;
  onViewDetails?: () => void;
}

const formatDeliverables = (deliverables?: Array<any>) => {
  if (!deliverables || deliverables.length === 0) return null;

  const formatted = deliverables.map(d => {
    const platform = d.platform === 'tiktok' ? 'TT' : 'IG';
    const type = d.type || 'Post';
    return `${d.quantity}x ${platform} ${type}`;
  });

  return formatted.join(' • ');
};

export function OpportunityCard({ opportunity, onAccept, isActive = false, onViewDetails }: OpportunityCardProps) {
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop opening the dialog
    if (onAccept) {
      onAccept(opportunity.id);
    }
    toast.success(opportunity.isInvited ? `Invitación aceptada para "${opportunity.title}"` : `Solicitud enviada a "${opportunity.title}"`, {
      description: `${opportunity.brandName} será notificado(a).`,
    });
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  const hasDeliverables = opportunity.deliverables && opportunity.deliverables.length > 0;

  return (
    <div
      className={cn(
        "group relative w-full h-[400px] sm:h-[450px] max-w-full overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        opportunity.isInvited && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !onViewDetails && "cursor-default"
      )}
      onClick={handleCardClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={opportunity.coverImage || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop"}
          alt={opportunity.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark overlay to make text pop, only at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent h-2/3 mt-auto" />
      </div>

      {opportunity.isInvited && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-violet-600/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 z-10 w-max max-w-[90%] border border-white/20">
          <Gift className="w-3.5 h-3.5 text-white" />
          Invitación Personal
        </div>
      )}

      {/* Top action/status bar (e.g. Match Score) */}
      <div className="absolute top-4 right-4 z-10">
        {!isActive && <MatchScore score={opportunity.matchScore} size="sm" showLabel={false} />}
      </div>

      {/* Content Container positioned at the bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-white z-10">

        {/* Value/Compensation Badge */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {opportunity.compensationType === "hybrid" ? (
            <>
              {/* Cash part - show range if available */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white w-max">
                <span className="text-green-400">💵</span>
                <span>
                  {opportunity.minReward && opportunity.maxReward
                    ? `$${opportunity.minReward} – $${opportunity.maxReward}`
                    : `$${opportunity.creatorPayment}`}
                </span>
              </div>
              {/* Plus sign */}
              <div className="inline-flex items-center justify-center font-bold text-white/80 text-xs">+</div>
              {/* Product/Exchange part */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white w-max max-w-[150px] sm:max-w-[200px]">
                <span className="text-orange-400">🎁</span>
                <span className="truncate">{opportunity.exchangeDetails || "Intercambio"}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white w-max">
                {opportunity.compensationType === "monetary" || opportunity.rewardType === "paid" ? (
                  <span className="text-green-400">💵</span>
                ) : (
                  <span className="text-orange-400">🎁</span>
                )}
                <span>
                  {opportunity.compensationType === 'monetary'
                    ? (opportunity.minReward && opportunity.maxReward
                      ? `$${opportunity.minReward.toLocaleString()} – $${opportunity.maxReward.toLocaleString()} USD`
                      : `$${opportunity.creatorPayment}`)
                    : (opportunity.compensationType === 'exchange'
                      ? (opportunity.exchangeDetails || "Intercambio de Producto")
                      : (opportunity.reward || "Negociable"))}
                </span>
              </div>
              {/* Incentive badge for paid only (not hybrid as requested) */}
              {opportunity.compensationType === 'monetary' && opportunity.minReward && opportunity.maxReward && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/20 text-[10px] font-medium text-amber-300 w-max">
                  ✨ Por Calidad
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl mb-1 text-white leading-tight drop-shadow-md line-clamp-2">
          {opportunity.title}
        </h3>

        {/* Details Line 1: Brand / Description / Goal */}
        <p className="text-white/80 text-[13px] font-medium mb-1 drop-shadow-sm line-clamp-1">
          {opportunity.brandName} {opportunity.goal ? ` • ${opportunity.goal}` : ''}
        </p>

        {/* Deliverables String - mapping what we need */}
        {hasDeliverables && (
          <p className="text-white/90 text-[12px] mb-1.5 font-medium drop-shadow-sm line-clamp-1">
            {formatDeliverables(opportunity.deliverables)}
          </p>
        )}

        {/* Details Line 2: Stats / Location / Deadline */}
        <div className="flex items-center gap-3 text-[11px] text-white/70 mb-3 drop-shadow-sm font-medium">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{opportunity.location || "Remoto"}</span>
          </div>
          <div className="text-white/40">•</div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : (opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : "Abierto")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full mt-2">
          {isActive ? (
            <>
              <Link to="/creator/content" className="w-full">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium backdrop-blur-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Contenido
                </Button>
              </Link>
              {/* Motivational reminder for active campaigns with range */}
              {opportunity.minReward && opportunity.maxReward && (
                <p className="text-[11px] text-amber-300/90 text-center leading-snug px-1">
                  Los videos con mayor engagement suelen recibir el pago máximo (${opportunity.maxReward.toLocaleString()}) 🚀
                </p>
              )}
            </>
          ) : (
            <Button
              className={cn(
                "w-full font-medium transition-colors",
                opportunity.isInvited
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white text-black hover:bg-white/90"
              )}
              onClick={handleApply}
            >
              {opportunity.isInvited ? "Aceptar Invitación" : "Aplicar Ahora"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}