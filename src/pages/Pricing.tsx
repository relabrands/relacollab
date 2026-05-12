import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanKey } from "@/lib/polar";
import { POLAR_CHECKOUT_URLS } from "@/lib/polarCheckoutUrls";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const PURPLE = "#534AB7";
const TEAL = "#0F6E56";

export default function Pricing() {
  const { plan: activePlan, loading } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(false);
  const planKeys: PlanKey[] = ["starter", "growth", "pro"];

  const handleSelect = (key: PlanKey) => {
    if (key === "growth" && isAnnual) {
      window.open(POLAR_CHECKOUT_URLS.growthAnnual, "_blank");
    } else if (key === "pro" && isAnnual) {
      window.open(POLAR_CHECKOUT_URLS.proAnnual, "_blank");
    } else {
      window.open(POLAR_CHECKOUT_URLS[key], "_blank");
    }
  };

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
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button
              size="sm"
              className="text-white"
              style={{ background: PURPLE }}
              asChild
            >
              <Link to="/login">Comenzar gratis</Link>
            </Button>
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
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
          Conecta con creadores verificados usando IA. Sin contratos largos, cancela cuando quieras.
        </p>

        {/* ── Billing Toggle ── */}
        <div className="inline-flex items-center gap-3 bg-muted/60 rounded-full px-2 py-1.5 border border-border/60 backdrop-blur-sm">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              !isAnnual
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensual
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              isAnnual
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
              style={{ background: "#16a34a" }}
            >
              -10%
            </span>
          </button>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {planKeys.map((key) => {
            const plan = PLANS[key];
            const isCurrent = !loading && activePlan === key;
            const dark = plan.highlighted;
            const showAnnualPrice = isAnnual && plan.priceMonthly > 0;
            const displayPrice = showAnnualPrice ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={key}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col gap-6 transition-all duration-200",
                  dark ? "shadow-2xl" : "bg-card shadow-sm hover:shadow-md",
                  isCurrent && "ring-2 ring-primary"
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
                {/* Badge "Más popular" */}
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

                  {/* Price row */}
                  <div className="flex items-end gap-2 mb-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showAnnualPrice ? "annual" : "monthly"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="text-4xl font-bold tabular-nums"
                      >
                        {plan.price === 0 ? "Gratis" : `$${displayPrice.toFixed(2)}`}
                      </motion.span>
                    </AnimatePresence>

                    {plan.price > 0 && (
                      <div className="flex items-end gap-1.5 mb-1.5">
                        <span
                          className="text-sm"
                          style={{ color: dark ? "#a5b4fc" : "var(--muted-foreground)" }}
                        >
                          /mes
                        </span>
                        {showAnnualPrice && (
                          <span
                            className="text-sm line-through"
                            style={{ color: dark ? "#a5b4fc" : "var(--muted-foreground)" }}
                          >
                            ${plan.priceMonthly}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Annual billing note */}
                  {showAnnualPrice && (
                    <AnimatePresence>
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-medium mb-2"
                        style={{ color: dark ? "#34d399" : TEAL }}
                      >
                        Facturado ${plan.annualTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} al año
                      </motion.p>
                    </AnimatePresence>
                  )}

                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: dark ? "#c4b5fd" : "var(--muted-foreground)" }}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  className="w-full font-semibold rounded-xl h-11 gap-2"
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
