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
  };
  onAccept?: (id: string) => void;
  isActive?: boolean;
  onViewDetails?: () => void;
}

const rewardTypeColors = {
  paid: "bg-success/10 text-success",
  experience: "bg-primary/10 text-primary",
  hybrid: "bg-accent/10 text-accent",
};

const rewardTypeLabels = {
  paid: "Paid",
  experience: "Product/Service Exchange",
  hybrid: "Experience + Cash",
};

export function OpportunityCard({ opportunity, onAccept, isActive = false, onViewDetails }: OpportunityCardProps) {
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop opening the dialog
    if (onAccept) {
      onAccept(opportunity.id);
    }
    toast.success(opportunity.isInvited ? `Accepted invitation for "${opportunity.title}"` : `Applied to "${opportunity.title}"`, {
      description: `${opportunity.brandName} will be notified.`,
    });
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  return (
    <div
      className={cn(
        "glass-card p-6 hover-lift relative transition-all",
        opportunity.isInvited && "border-primary/50 shadow-lg shadow-primary/5",
        onViewDetails && "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      {opportunity.isInvited && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-brand text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
          <Gift className="w-3 h-3" />
          Personal Invitation
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <img
          src={opportunity.brandLogo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop"} // Fallback image
          alt={opportunity.brandName}
          className="w-14 h-14 rounded-xl object-cover border border-border/50"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{opportunity.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{opportunity.brandName}</p>
        </div>
        {!isActive && <MatchScore score={opportunity.matchScore} size="md" showLabel={false} />}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {opportunity.location || "Remote"}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : (opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : "Open Duration")}
        </div>
      </div>

      {/* Reward */}
      <div className="p-4 rounded-xl bg-muted/50 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {opportunity.rewardType === "paid" ? (
              <DollarSign className="w-5 h-5 text-success" />
            ) : (
              <Gift className="w-5 h-5 text-primary" />
            )}
            <span className="font-semibold">{opportunity.reward || "Negotiable"}</span>
          </div>
          <Badge className={cn("font-medium", rewardTypeColors[opportunity.rewardType || "experience"])}>
            {rewardTypeLabels[opportunity.rewardType || "experience"]}
          </Badge>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(opportunity.tags || []).map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Active Campaign Details */}
      {isActive && (
        <div className="mb-4 space-y-3 p-3 bg-muted/30 rounded-lg text-sm">
          {opportunity.brandDescription && (
            <div>
              <span className="font-semibold block mb-1">About the Brand:</span>
              <p className="text-muted-foreground line-clamp-2">{opportunity.brandDescription}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            <div>
              <span className="font-semibold block text-xs uppercase text-muted-foreground">Compensation</span>
              <p>{opportunity.reward || "Negotiable"}</p>
            </div>
            <div>
              <span className="font-semibold block text-xs uppercase text-muted-foreground">Deadline</span>
              <p>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "Open"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action */}
      {isActive ? (
        <Link to="/creator/content">
          <Button variant="hero" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Submit Content
          </Button>
        </Link>
      ) : (
        <Button
          variant={opportunity.isInvited ? "hero" : "outline"}
          className="w-full"
          onClick={handleApply}
        >
          {opportunity.isInvited ? "Accept Invitation" : "Apply Now"}
          <ArrowRight className="w-4 h-4 mr-2" />
        </Button>
      )}
    </div>
  );
}