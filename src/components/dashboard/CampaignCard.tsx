import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ArrowRight, FileCheck, TrendingUp, Share2, DollarSign, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: "draft" | "active" | "completed" | "pending" | "expired" | string;
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
    brandProfileName?: string;
    brandProfileLogo?: string;
    brandName?: string;
  };
  onClick?: () => void;
  onShare?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:     { label: "Borrador", className: "bg-muted text-muted-foreground border-muted" },
  active:    { label: "Activa",   className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
  completed: { label: "Completada", className: "bg-primary/10 text-primary border-primary/20" },
  pending:   { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" },
  expired:   { label: "Expirada", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800" },
};

const goalLabels: Record<string, string> = {
  awareness:  "Awareness",
  conversion: "Conversión",
  engagement: "Engagement",
  traffic:    "Tráfico",
};



export function CampaignCard({ campaign, onClick, onShare }: CampaignCardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ applications: 0, approved: 0 });
  const [currentStatus, setCurrentStatus] = useState(campaign.status);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const appsQuery = query(
          collection(db, "applications"),
          where("campaignId", "==", campaign.id)
        );
        const appsSnapshot = await getDocs(appsQuery);
        const apps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const approvedCount = apps.filter((a: any) => 
          a.status === "approved" || a.status === "active" || a.status === "collaborating" || a.status === "completed"
        ).length;
        
        setStats({
          applications: apps.length,
          approved: approvedCount,
        });

        // Verificar si la fecha ha expirado y actualizar estado automáticamente
        if (currentStatus === "active" && campaign.endDate) {
          const endDate = new Date(`${campaign.endDate}T23:59:59`);
          if (new Date() > endDate) {
            const newStatus = approvedCount > 0 ? "completed" : "expired";
            await updateDoc(doc(db, "campaigns", campaign.id), { status: newStatus });
            setCurrentStatus(newStatus);
          }
        }
      } catch (error) {}
    };
    fetchStats();
  }, [campaign.id]);

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/brand/campaigns/${campaign.id}`);
  };

  /* ─── Compensation label ──────────────────────────────── */
  const compensationLabel = () => {
    const { compensationType, minReward, maxReward, totalBudgetPerCreator, exchangeDetails, creatorCount, budget } = campaign;
    const count = creatorCount || 1;

    if (compensationType === "exchange") {
      return { icon: <Gift className="w-3.5 h-3.5 text-orange-500" />, text: exchangeDetails || "Producto/Servicio" };
    }
    if (compensationType === "hybrid") {
      if (minReward && maxReward) {
        return { icon: <><DollarSign className="w-3.5 h-3.5 text-emerald-500" /><Gift className="w-3.5 h-3.5 text-orange-500" /></>, text: `$${minReward.toLocaleString()} – $${maxReward.toLocaleString()} + ${exchangeDetails || "Regalo"}` };
      }
      const total = (totalBudgetPerCreator || 0) * count || budget || 0;
      return { icon: <><DollarSign className="w-3.5 h-3.5 text-emerald-500" /><Gift className="w-3.5 h-3.5 text-orange-500" /></>, text: `$${total.toLocaleString()} + ${exchangeDetails || "Gift"}` };
    }
    // monetary (default)
    if (minReward && maxReward) {
      return { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />, text: `$${minReward.toLocaleString()} – $${maxReward.toLocaleString()}` };
    }
    const total = (totalBudgetPerCreator || 0) * count || budget || 0;
    return { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />, text: total > 0 ? `$${total.toLocaleString()}` : "—" };
  };

  const comp = compensationLabel();
  const config = statusConfig[currentStatus] || statusConfig.draft;

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group flex flex-col gap-4 w-full"
      onClick={handleClick}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {(campaign.brandProfileLogo || campaign.brandName) ? (
              <>
                {campaign.brandProfileLogo && (
                  <img src={campaign.brandProfileLogo} className="w-4 h-4 rounded-sm object-cover shrink-0" alt="Brand Logo" />
                )}
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">
                  {campaign.brandProfileName || campaign.brandName}
                </span>
              </>
            ) : null}
          </div>
          <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {campaign.name}
          </h3>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {goalLabels[campaign.goal] ?? campaign.goal}
          </span>
        </div>
        <Badge className={cn("shrink-0 text-xs font-medium border", config.className)}>
          {config.label}
        </Badge>
      </div>

      {/* ── Compensation pill ── */}
      <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-2 text-sm font-medium min-w-0">
        <span className="flex items-center gap-1 shrink-0">{comp.icon}</span>
        <span className="truncate text-foreground/85">{comp.text}</span>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Creators */}
        <div className="bg-muted/30 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="w-3 h-3" />
          </div>
          <div className="font-bold text-sm">{campaign.creatorCount ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Cupos</div>
        </div>
        {/* Applications */}
        <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
            <FileCheck className="w-3 h-3" />
          </div>
          <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{stats.applications}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Solicitudes</div>
        </div>
        {/* Approved */}
        <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
            <TrendingUp className="w-3 h-3" />
          </div>
          <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{stats.approved}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Aprobados</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        {campaign.endDate ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Finaliza {new Date(campaign.endDate).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        ) : <div />}

        <div className="flex items-center gap-1.5 shrink-0">
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onShare(); }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-primary hover:bg-primary/8 gap-1"
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            Ver <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}