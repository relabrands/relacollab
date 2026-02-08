import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, ArrowRight, FileCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: "draft" | "active" | "completed" | "pending";
    goal: string;
    budget?: number;
    creatorCount?: number;
    endDate?: string;
    startDate?: string;
  };
  onClick?: () => void;
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    applications: 0,
    approved: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const appsQuery = query(
          collection(db, "applications"),
          where("campaignId", "==", campaign.id)
        );
        const appsSnapshot = await getDocs(appsQuery);
        const apps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const total = apps.length;
        const approved = apps.filter((app: any) => app.status === "approved").length;

        setStats({ applications: total, approved });
      } catch (error) {
        console.error("Error fetching campaign stats:", error);
      }
    };

    fetchStats();
  }, [campaign.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/brand/campaigns/${campaign.id}`);
    }
  };

  return (
    <div className="glass-card p-6 hover-lift cursor-pointer group" onClick={handleClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{campaign.goal}</p>
        </div>
        <Badge className={cn("font-medium border", statusColors[campaign.status])}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Budget
          </div>
          <div className="font-semibold text-sm">
            ${campaign.budget?.toLocaleString() || "500"}
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="w-3 h-3" />
            Creators Needed
          </div>
          <div className="font-semibold text-sm">{campaign.creatorCount || "-"}</div>
        </div>

        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs mb-1">
            <FileCheck className="w-3 h-3" />
            Applications
          </div>
          <div className="font-semibold text-sm text-blue-700 dark:text-blue-400">
            {stats.applications}
          </div>
        </div>

        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Approved
          </div>
          <div className="font-semibold text-sm text-green-700 dark:text-green-400">
            {stats.approved}
          </div>
        </div>
      </div>

      {/* Due Date */}
      {campaign.endDate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b">
          <Calendar className="w-4 h-4" />
          <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full justify-between text-primary hover:text-primary hover:bg-primary/5"
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