import { Button } from "@/components/ui/button";
import { MatchScore } from "./MatchScore";
import { MapPin, TrendingUp, Check, X } from "lucide-react";
import { toast } from "sonner";

interface CreatorCardProps {
  creator: {
    id: string;
    name: string;
    avatar: string;
    location: string;
    followers: string;
    engagement: string;
    matchScore: number;
    tags: string[];
    matchReason?: string;
    bio?: string;
    instagramUsername?: string;
  };
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isInvite?: boolean;
  hideActions?: boolean;
}

export function CreatorCard({ creator, onApprove, onReject, isInvite = false, hideActions = false }: CreatorCardProps) {

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
      <div className="flex items-start justify-between mb-4">
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
        <MatchScore score={creator.matchScore} />
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

      <div className="flex flex-wrap gap-2 mb-4">
        {creator.tags.slice(0, 3).map(tag => (
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
              {isInvite ? "Invite" : "Approve"}
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