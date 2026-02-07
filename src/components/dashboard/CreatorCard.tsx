import { Button } from "@/components/ui/button";
import { MatchScore } from "./MatchScore";
import { MapPin, TrendingUp, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface CreatorCardProps {
  creator: {
    id: string;
    name: string;
    avatar: string;
    location: string;
    followers: string;
    engagement: string;
    matchScore: number;
    matchBreakdown?: {
      location: number;
      vibe: number;
      engagement: number;
      bonus: number;
    };
    tags: string[];
    matchReason?: string;
    bio?: string;
    instagramUsername?: string;
    campaignName?: string;
  };
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isInvite?: boolean;
  isApplicant?: boolean;

  hideActions?: boolean;
  isCollaborating?: boolean;
  campaignId?: string;
  creatorId?: string;
}

export function CreatorCard({ creator, onApprove, onReject, isInvite = false, isApplicant = false, hideActions = false, isCollaborating = false, campaignId, creatorId }: CreatorCardProps) {

  const handleApprove = () => {
    if (onApprove) {
      onApprove(creator.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(creator.id);
    } else {
      toast.info("Skipped");
    }
  };

  return (
    <div className="glass-card p-6 hover-lift relative overflow-hidden group h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{creator.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 mr-1" />
              {creator.location}
            </div>
          </div>
        </div>
        <MatchScore score={creator.matchScore} breakdown={creator.matchBreakdown} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/40 p-2 rounded-lg text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Followers</div>
          <div className="font-bold">{creator.followers}</div>
        </div>
        <div className="bg-muted/40 p-2 rounded-lg text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Engagement</div>
          <div className="font-bold text-success">{creator.engagement}</div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {creator.campaignName && (
          <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary">
            Matched for: {creator.campaignName}
          </div>
        )}

        {creator.matchReason && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 leading-relaxed">
            "{creator.matchReason}"
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(creator.tags || []).slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto">
        {/* Actions */}
        {!hideActions ? (
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                handleReject();
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Skip
            </Button>
            <Button
              variant={isInvite ? "default" : "success"}
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove();
              }}
            >
              {isInvite ? (
                <TrendingUp className="w-4 h-4 mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isApplicant ? "Approve App" : (isInvite ? "Invite" : "Approve")}
            </Button>
          </div>
        ) : isCollaborating ? (
          <div className="w-full pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (onApprove) onApprove(creator.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Content
            </Button>
          </div>
        ) : (
          <div className="w-full pt-4 border-t border-border">
            <Button disabled variant="secondary" className="w-full cursor-not-allowed opacity-80">
              <Check className="w-4 h-4 mr-2" />
              Invitation Sent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}