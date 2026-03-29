import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  // Pequeño delay para que la animación de entrada se vea
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header mínimo */}
      <header className="border-b bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/">
            <img
              src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
              alt="RELA Collab"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Contenido central */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div
          className="text-center max-w-md w-full"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* Ícono animado */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(83,74,183,0.12)", animation: "rela-ping 1.8s ease-out infinite" }}
            />
            <div
              className="absolute inset-2 rounded-full"
              style={{ background: "rgba(83,74,183,0.18)", animation: "rela-ping 1.8s ease-out infinite 0.35s" }}
            />
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #534AB7, #0F6E56)" }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Chispas */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  color: "#534AB7",
                  fontSize: "1.2rem",
                  display: "inline-block",
                  animation: `rela-bounce 1.1s ease infinite ${i * 0.18}s`,
                }}
              >
                ✦
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold mb-3">¡Suscripción activada!</h1>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Bienvenido a RELA Collab. Ya puedes crear campañas y conectar con los
            mejores creadores de contenido UGC de República Dominicana.
          </p>

          {checkoutId && (
            <p className="text-xs text-muted-foreground mb-8 font-mono bg-muted/40 px-3 py-1.5 rounded-lg inline-block">
              Confirmación: {checkoutId.slice(0, 24)}…
            </p>
          )}

          {/* Próximos pasos */}
          <div className="bg-card border border-border rounded-2xl p-6 text-left mb-8 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Próximos pasos
            </p>
            {[
              "Completa el perfil de tu marca",
              "Crea tu primera campaña",
              "Revisa los creadores sugeridos por IA",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <div
                  className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ background: "#534AB7" }}
                >
                  {i + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full font-semibold rounded-xl gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #534AB7, #6d64cc)" }}
            asChild
          >
            <Link to={user ? "/brand" : "/login"}>
              <Sparkles className="w-4 h-4" />
              Ir al Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </main>

      <style>{`
        @keyframes rela-ping {
          0%   { transform: scale(1); opacity: 0.8; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes rela-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
