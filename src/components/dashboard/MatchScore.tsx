import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  breakdown?: {
    compensation?: boolean;
    contentType?: number;
    niche?: number;
    experience?: number;
    socialMetrics?: number;
    composition?: number;
    demographics?: number;
    availability?: number;
  };
}

export function MatchScore({ score, size = "md", showLabel = true, breakdown }: MatchScoreProps) {
  const getScoreColor = () => {
    if (score >= 90) return "bg-success text-success-foreground";
    if (score >= 75) return "bg-warning text-warning-foreground";
    return "bg-accent text-accent-foreground";
  };

  const getScoreLabel = () => {
    if (score >= 90) return "Excellent Match";
    if (score >= 75) return "Good Match";
    return "Fair Match";
  };

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-xl font-bold flex items-center justify-center",
          sizeClasses[size],
          getScoreColor()
        )}
      >
        {score}%
      </div>
      {showLabel && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{getScoreLabel()}</span>
          {breakdown && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold mb-2">Match Score Breakdown:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">📸 Content Types:</span>
                        <span className="font-medium">{breakdown.contentType || 0}/25</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">✨ Vibe & Niche:</span>
                        <span className="font-medium">{breakdown.niche || 0}/20</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">⭐ Experience:</span>
                        <span className="font-medium">{breakdown.experience || 0}/15</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">📈 Metrics:</span>
                        <span className="font-medium">{breakdown.socialMetrics || 0}/15</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">📍 Location:</span>
                        <span className="font-medium">{breakdown.demographics || 0}/10</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">👥 Composition:</span>
                        <span className="font-medium">{breakdown.composition || 0}/10</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">🟢 Availability:</span>
                        <span className="font-medium">{breakdown.availability || 0}/5</span>
                      </div>
                      <div className="border-t pt-1 mt-2 flex justify-between gap-4 font-semibold">
                        <span>Total:</span>
                        <span>{score}/100</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}