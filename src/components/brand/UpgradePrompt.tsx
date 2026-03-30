import { ArrowRight, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { POLAR_CHECKOUT_URLS } from "@/lib/polarCheckoutUrls";
import { PLANS } from "@/lib/polar";

const PURPLE = "#534AB7";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cuál fue el límite que se alcanzó */
  reason: string;
  /** Plan recomendado para subir */
  recommendedPlan?: "growth" | "pro";
}

/**
 * Modal que aparece cuando un brand intenta sobrepasar el límite de su plan.
 * Muestra el motivo, el plan recomendado y un CTA al checkout de Polar.
 */
export function UpgradePrompt({
  open,
  onOpenChange,
  reason,
  recommendedPlan = "growth",
}: UpgradePromptProps) {
  const plan = PLANS[recommendedPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header oscuro */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{
            background: "linear-gradient(160deg, #0d0d1a 0%, #1a1135 100%)",
          }}
        >
          {/* Ícono de lock animado */}
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${PURPLE}33`, border: `1px solid ${PURPLE}66` }}
          >
            <Lock className="w-7 h-7" style={{ color: "#a5b4fc" }} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Límite de plan alcanzado
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            {reason}
          </p>
        </div>

        {/* Card del plan recomendado */}
        <div className="bg-background p-6 space-y-4">
          <div
            className="rounded-2xl p-5 border"
            style={{ borderColor: PURPLE, background: `${PURPLE}0d` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${PURPLE}33` }}
              >
                <Zap className="w-4 h-4" style={{ color: "#a5b4fc" }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Plan {plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${plan.price}/mes — Todo lo que necesitas para crecer
                </p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Ahora no
            </Button>
            <Button
              className="flex-1 font-semibold gap-1.5 text-white"
              style={{ background: PURPLE }}
              onClick={() => {
                window.open(POLAR_CHECKOUT_URLS[recommendedPlan], "_blank");
                onOpenChange(false);
              }}
            >
              Mejorar plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Pago seguro · Cancela cuando quieras
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
