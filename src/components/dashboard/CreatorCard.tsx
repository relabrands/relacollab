import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Check, X, Eye, Sparkles, Instagram, Users } from "lucide-react";
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
    displayScore?: number;
    aiAnalysis?: any | null;
    matchBreakdown?: {
      compensation?: boolean;
      contentType?: number;
      niche?: number;
      experience?: number;
      socialMetrics?: number;
      composition?: number;
      demographics?: number;
      availability?: number;
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

const getScoreMeta = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200" };
  if (score >= 60) return { label: "Good", color: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200" };
  if (score >= 40) return { label: "Fair", color: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-200" };
  return { label: "Low", color: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-200" };
};

export function CreatorCard({
  creator,
  onApprove,
  onReject,
  isInvite = false,
  isApplicant = false,
  hideActions = false,
  isCollaborating = false,
}: CreatorCardProps) {
  const score = creator.displayScore ?? creator.matchScore;
  const { label, color, text, ring } = getScoreMeta(score);
  const hasAI = creator.aiAnalysis?.matchPercentage !== undefined;

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) onApprove(creator.id);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) onReject(creator.id);
    else toast.info("Skipped");
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">

      {/* ── Top gradient accent bar ── */}
      <div className={`h-1 w-full ${color} opacity-70`} />

      {/* ── Header: avatar + name + score ── */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-3">
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 border-background ring-2 ${ring} shadow-sm`}>
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=7c3aed&color=fff&size=128`;
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight line-clamp-2">{creator.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{creator.location}</span>
          </div>
          {creator.instagramUsername && (
            <div className="flex items-center gap-1 mt-1">
              <Instagram className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground truncate">@{creator.instagramUsername}</span>
            </div>
          )}
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className={`${color} text-white font-black text-base w-14 h-14 rounded-2xl flex flex-col items-center justify-center leading-none shadow-sm`}>
            <span>{score}%</span>
            <span className="text-[8px] font-semibold opacity-80 uppercase tracking-wider">{label}</span>
          </div>
          {hasAI && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <Sparkles className="w-2.5 h-2.5" />
              RELA AI
            </span>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-5 grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <Users className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Followers</span>
          </div>
          <div className="font-bold text-sm">{creator.followers}</div>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Engagement</span>
          </div>
          <div className={`font-bold text-sm ${text}`}>{creator.engagement}</div>
        </div>
      </div>

      {/* ── AI Summary (if available) or match reason ── */}
      <div className="px-5 flex-1">
        {hasAI && creator.aiAnalysis?.matchSummary ? (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
            <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
            {creator.aiAnalysis.matchSummary}
          </p>
        ) : creator.matchReason ? (
          <p className="text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-3 leading-relaxed line-clamp-3">
            "{creator.matchReason}"
          </p>
        ) : null}
      </div>

      {/* ── Tags ── */}
      {creator.tags && creator.tags.length > 0 && (
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
          {creator.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium border border-border/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="px-5 pt-4 pb-5 mt-auto">
        {!hideActions ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors"
              onClick={handleReject}
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Skip
            </Button>
            <Button
              size="sm"
              className="flex-2 flex-grow bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
              onClick={handleApprove}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              {isApplicant ? "Approve" : isInvite ? "Invite" : "Approve"}
            </Button>
          </div>
        ) : isCollaborating ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full hover:bg-primary/5 hover:border-primary/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onApprove) onApprove(creator.id);
            }}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View Content
          </Button>
        ) : (
          <Button
            disabled
            variant="secondary"
            size="sm"
            className="w-full opacity-70 cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Invitation Sent
          </Button>
        )}
      </div>
    </div>
  );
}