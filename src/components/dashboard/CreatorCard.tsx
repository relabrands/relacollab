import { Button } from "@/components/ui/button";
import { MatchScore } from "./MatchScore";
import { Instagram, MapPin, Users, TrendingUp, Check, X } from "lucide-react";
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
    matchReason: string;
  };
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isInvite?: boolean;
}

export function CreatorCard({ creator, onApprove, onReject, isInvite = false }: CreatorCardProps) {
  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove?.(creator.id);
    // Toast handled by parent now for better context
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.(creator.id);
    toast.info(`${creator.name} skipped`);
  };

  return (
    <div className="glass-card p-6 hover-lift">
      {/* ... existing header ... */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-16 h-16 rounded-2xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{creator.name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {creator.location}
            </span>
            <span className="flex items-center gap-1">
              <Instagram className="w-4 h-4" />
              {creator.followers}
            </span>
          </div>
        </div>
        <MatchScore score={creator.matchScore} size="md" showLabel={false} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="w-4 h-4" />
            Followers
          </div>
          <div className="font-semibold">{creator.followers}</div>
        </div>
        <div className="p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Engagement
          </div>
          <div className="font-semibold text-success">{creator.engagement}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {creator.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* AI Match Reason */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">AI</span>
          Match Insight
        </div>
        <p className="text-sm text-muted-foreground">{creator.matchReason}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReject}
        >
          <X className="w-4 h-4 mr-2" />
          Skip
        </Button>
        <Button
          variant={isInvite ? "default" : "success"}
          className="flex-1"
          onClick={handleApprove}
        >
          {isInvite ? (
            <TrendingUp className="w-4 h-4 mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {isInvite ? "Send Proposal" : "Approve"}
        </Button>
      </div>
    </div>
  );
}