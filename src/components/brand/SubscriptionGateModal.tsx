import { CheckCircle, Zap, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PLANS, type PlanKey } from "@/lib/polar";
import { POLAR_CHECKOUT_URLS } from "@/lib/polarCheckoutUrls";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const PURPLE = "#534AB7";
const TEAL = "#0F6E56";

interface SubscriptionGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si true, el usuario puede cerrarlo. Si false (gate obligatorio), no se puede cerrar */
  dismissible?: boolean;
}

/**
 * Modal que muestra los 3 planes de Polar.
 * Se usa como gate (obligatorio) cuando un brand sin suscripción
 * intenta usar el dashboard, y como selector de plan en la página de Suscripción.
 */
export function SubscriptionGateModal({
  open,
  onOpenChange,
  dismissible = false,
}: SubscriptionGateModalProps) {
  const { user } = useAuth();
  const { plan: activePlan, isActive } = useSubscription();
  const planKeys: PlanKey[] = ["starter", "growth", "pro"];

  const handleSelect = async (key: PlanKey) => {
    if (key === "starter") {
      // Starter es gratis — solo marcamos que el usuario ya eligió un plan
      if (user) {
        try {
          await updateDoc(doc(db, "users", user.uid), { hasChosenPlan: true });
        } catch {
          // Si falla (doc no existe), el gate simplemente se cierra igual
        }
      }
      onOpenChange(false); // Cierra el gate inmediatamente
    } else {
      // Planes de pago — abre Polar checkout en nueva pestaña
      window.open(POLAR_CHECKOUT_URLS[key], "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <DialogContent
        className="max-w-3xl w-full p-0 overflow-hidden border-0 shadow-2xl"
        // Oculta el botón X por defecto cuando no es dismissible
        onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 text-center relative"
          style={{
            background: "linear-gradient(160deg, #0d0d1a 0%, #1a1135 100%)",
          }}
        >
          {dismissible && (
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white/80">Elige tu plan para continuar</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Activa tu suscripción RELA Collab
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Conecta tu marca con los mejores creadores UGC de República Dominicana.
            Empieza gratis y escala cuando estés listo.
          </p>
        </div>

        {/* Cards */}
        <div className="bg-background p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {planKeys.map((key) => {
              const plan = PLANS[key];
              const isCurrent = isActive && activePlan === key;
              const dark = plan.highlighted;

              return (
                <div
                  key={key}
                  className={cn(
                    "relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200",
                    dark ? "shadow-xl" : "bg-card hover:shadow-md hover:border-primary/40",
                    isCurrent && "ring-2 ring-primary"
                  )}
                  style={
                    dark
                      ? {
                          background: "linear-gradient(160deg, #1a1135, #0d0d1a)",
                          borderColor: PURPLE,
                          color: "white",
                        }
                      : {}
                  }
                >
                  {/* Badge más popular */}
                  {dark && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge
                        className="px-3 py-0.5 text-[10px] font-semibold text-white border-0"
                        style={{ background: PURPLE }}
                      >
                        ✦ Más popular
                      </Badge>
                    </div>
                  )}

                  {/* Nombre + precio */}
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                      style={{ color: dark ? "#a5b4fc" : PURPLE }}
                    >
                      {plan.name}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">
                        {plan.price === 0 ? "Gratis" : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span
                          className="text-xs mb-0.5"
                          style={{ color: dark ? "#a5b4fc" : "var(--muted-foreground)" }}
                        >
                          /mes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-1.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <CheckCircle
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: dark ? "#34d399" : TEAL }}
                        />
                        <span style={{ color: dark ? "#e2e8f0" : "var(--muted-foreground)" }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className="w-full font-semibold rounded-xl h-9 gap-1.5 text-sm"
                    style={
                      isCurrent
                        ? { background: "var(--muted)", color: "var(--muted-foreground)" }
                        : { background: dark ? PURPLE : `${PURPLE}cc`, color: "white" }
                    }
                    disabled={isCurrent}
                    onClick={() => !isCurrent && handleSelect(key)}
                  >
                    {isCurrent ? (
                      "Plan actual ✓"
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Pago seguro por{" "}
            <a
              href="https://polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Polar.sh
            </a>
            . Cancela cuando quieras.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
