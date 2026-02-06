import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: "draft" | "active" | "completed" | "pending";
    goal: string;
    budget: string;
    creators: number;
    dueDate: string;
  };
  onClick?: () => void;
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  completed: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning",
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/brand/campaigns/${campaign.id}`);
    }
  };

  return (
    <div className="glass-card p-6 hover-lift cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">{campaign.goal}</p>
        </div>
        <Badge className={cn("font-medium", statusColors[campaign.status])}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span>{campaign.budget}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{campaign.creators} creators</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{campaign.dueDate}</span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full justify-between text-primary hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        View Details
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}