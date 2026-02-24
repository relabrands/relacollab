import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, TrendingUp, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen bg-mesh overflow-hidden">
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-[8%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-[20%] w-48 h-48 bg-success/10 rounded-full blur-2xl"
          animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative z-10 px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Plataforma de Matching de Creadores impulsada por IA
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="block">Donde las marcas encuentran</span>
            <span className="gradient-text">a su creador perfecto</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            El marketplace de UGC más inteligente. No solo listamos creadores: los{" "}
            <span className="text-foreground font-semibold">conectamos con precisión</span> usando IA entrenada con resultados reales de campañas.
          </motion.p>

          {/* Quick Value Props */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {["Sin propuestas en frío", "Pagos seguros", "Analíticas en tiempo real", "Creadores verificados"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-1 rounded-full border border-border/60 bg-background/50">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/login">
              <Button variant="hero" size="xl">
                Soy una Marca
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="glass" size="xl">
                Soy un Creador
                <Zap className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">2.5K+</div>
              <div className="text-muted-foreground text-xs md:text-sm">Creadores verificados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">94%</div>
              <div className="text-muted-foreground text-xs md:text-sm">Precisión de IA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">500+</div>
              <div className="text-muted-foreground text-xs md:text-sm">Marcas registradas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">3x</div>
              <div className="text-muted-foreground text-xs md:text-sm">Aumento de interacción</div>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards Preview */}
        <motion.div
          className="mt-20 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="glass-card p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Motor de Matching con IA</h3>
                <p className="text-muted-foreground text-sm">
                  Análisis profundo de objetivos de campaña, datos de audiencia y patrones de interacción para un matching preciso.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Seguimiento de rendimiento</h3>
                <p className="text-muted-foreground text-sm">
                  Métricas en tiempo real de cada entregable de la campaña. Conoce tu ROI antes de que termine.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-success/5 to-success/10 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Pagos protegidos</h3>
                <p className="text-muted-foreground text-sm">
                  Pagos en custodia aseguran que los fondos solo se liberen cuando el contenido sea revisado y aprobado.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}