import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { PLANS, type PlanKey } from "@/lib/polar";
import { createCheckout } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PURPLE = "#534AB7";
const TEAL = "#0F6E56";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleSubscribe = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];

    // Plan gratuito → directo al login/registro
    if (plan.price === 0) {
      navigate("/login");
      return;
    }

    if (!user?.email) {
      toast.error("Inicia sesión para suscribirte.");
      navigate("/login");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const { url } = await createCheckout(plan.productId, user.email);
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar el pago.";
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const planKeys: PlanKey[] = ["starter", "growth", "pro"];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img
              src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
              alt="RELA Collab"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/brand">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button
                  size="sm"
                  className="text-white"
                  style={{ background: PURPLE }}
                  asChild
                >
                  <Link to="/login">Comenzar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
          <Zap className="w-3.5 h-3.5" />
          Planes para marcas
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          El plan perfecto para{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(90deg, ${PURPLE}, ${TEAL})` }}
          >
            tu marca
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Conecta con creadores verificados usando IA. Sin contratos largos, cancela cuando quieras.
        </p>
      </section>

      {/* ── Cards ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {planKeys.map((key) => {
            const plan = PLANS[key];
            const isLoading = loadingPlan === key;
            const dark = plan.highlighted;

            return (
              <div
                key={key}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col gap-6 transition-all duration-200",
                  dark ? "shadow-2xl" : "bg-card shadow-sm hover:shadow-md"
                )}
                style={
                  dark
                    ? {
                        background: "linear-gradient(160deg, #1a1135 0%, #0d0d1a 100%)",
                        borderColor: PURPLE,
                        color: "white",
                      }
                    : {}
                }
              >
                {/* Badge más popular */}
                {dark && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge
                      className="px-4 py-1 text-xs font-semibold text-white border-0"
                      style={{ background: PURPLE }}
                    >
                      ✦ Más popular
                    </Badge>
                  </div>
                )}

                {/* Nombre y precio */}
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: dark ? "#a5b4fc" : PURPLE }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-bold">
                      {plan.price === 0 ? "Gratis" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span
                        className="text-sm mb-1.5"
                        style={{ color: dark ? "#a5b4fc" : "var(--muted-foreground)" }}
                      >
                        /mes
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: dark ? "#c4b5fd" : "var(--muted-foreground)" }}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  className="w-full font-semibold rounded-xl h-11 gap-2 text-white hover:opacity-90"
                  style={{ background: dark ? PURPLE : `${PURPLE}cc` }}
                  disabled={isLoading}
                  onClick={() => handleSubscribe(key)}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Features */}
                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle
                        className="w-4 h-4 shrink-0"
                        style={{ color: dark ? "#34d399" : TEAL }}
                      />
                      <span style={{ color: dark ? "#e2e8f0" : undefined }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Pago seguro procesado por{" "}
          <a
            href="https://polar.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Polar.sh
          </a>
          . Cancela en cualquier momento.
        </p>
      </section>
    </div>
  );
}
