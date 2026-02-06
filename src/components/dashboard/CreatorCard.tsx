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
  hideActions?: boolean;
}

export function CreatorCard({ creator, onApprove, onReject, isInvite = false, hideActions = false }: CreatorCardProps) {
  // ... (handlers)

  return (
    <div className="glass-card p-6 hover-lift">
      {/* ... (existing content) */}

      {/* Actions */}
      {!hideActions ? (
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
      ) : (
        <div className="w-full">
          <Button disabled variant="secondary" className="w-full cursor-not-allowed opacity-80">
            <Check className="w-4 h-4 mr-2" />
            Invitation Sent
          </Button>
        </div>
      )}
    </div>
  );
}