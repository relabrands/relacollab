import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, ArrowRight, FileCheck, TrendingUp, Share2 } from "lucide-react";
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
    totalBudgetPerCreator?: number;
    compensationType?: "monetary" | "exchange" | "hybrid";
    exchangeDetails?: string;
    minReward?: number;
    maxReward?: number;
  };
  onClick?: () => void;
  onShare?: () => void;
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export function CampaignCard({ campaign, onClick, onShare }: CampaignCardProps) {
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

  const totalBudget = (campaign.totalBudgetPerCreator || 0) * (campaign.creatorCount || 1) || campaign.budget || 0;

  return (
    <div className="glass-card p-6 hover-lift cursor-pointer group w-full max-w-full overflow-hidden" onClick={handleClick}>
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{campaign.goal}</p>
        </div>
        <Badge className={cn("font-medium border", statusColors[campaign.status])}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {campaign.compensationType === "exchange" ? (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <span className="text-orange-400">🎁</span>
              Intercambio
            </div>
            <div className="font-semibold text-sm truncate" title={campaign.exchangeDetails || "Producto/Servicio"}>
              {campaign.exchangeDetails || "Producto/Servicio"}
            </div>
          </div>
        ) : campaign.compensationType === "hybrid" ? (
          <div className="bg-muted/30 p-3 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <span className="text-green-400">💵</span> + <span className="text-orange-400">🎁</span>
              Híbrido
            </div>
            {campaign.minReward && campaign.maxReward ? (
              <div className="font-semibold text-sm truncate" title={`$${(campaign.minReward * (campaign.creatorCount || 1)).toLocaleString()} – $${(campaign.maxReward * (campaign.creatorCount || 1)).toLocaleString()} + ${campaign.exchangeDetails || "Intercambio"}`}>
                ${(campaign.minReward * (campaign.creatorCount || 1)).toLocaleString()} – ${(campaign.maxReward * (campaign.creatorCount || 1)).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">+ {campaign.exchangeDetails || "Regalo"}</span>
              </div>
            ) : (
              <div className="font-semibold text-sm truncate" title={`$${totalBudget.toLocaleString()} + ${campaign.exchangeDetails || "Intercambio"}`}>
                ${totalBudget.toLocaleString()} + {campaign.exchangeDetails || "Intercambio"}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              Presupuesto
            </div>
            {campaign.minReward && campaign.maxReward ? (
              <div className="font-semibold text-sm">
                ${(campaign.minReward * (campaign.creatorCount || 1)).toLocaleString()} – ${(campaign.maxReward * (campaign.creatorCount || 1)).toLocaleString()}
              </div>
            ) : (
              <div className="font-semibold text-sm">
                ${totalBudget.toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="w-3 h-3" />
            Creadores Necesarios
          </div>
          <div className="font-semibold text-sm">{campaign.creatorCount || "-"}</div>
        </div>

        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs mb-1">
            <FileCheck className="w-3 h-3" />
            Solicitudes
          </div>
          <div className="font-semibold text-sm text-blue-700 dark:text-blue-400">
            {stats.applications}
          </div>
        </div>

        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Aprobados
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
          <span>Finaliza: {new Date(campaign.endDate).toLocaleDateString()}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-between text-primary hover:text-primary hover:bg-primary/5"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Ver Detalles
          <ArrowRight className="w-4 h-4" />
        </Button>
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            className="px-3 gap-1.5 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Historia
          </Button>
        )}
      </div>
    </div>
  );
}