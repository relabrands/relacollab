import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, BarChart3, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function BusinessHero() {
  return (
    <section className="relative bg-background overflow-hidden pt-24 pb-16 md:pb-20">
      {/* Single subtle orb — no animated blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-background text-xs font-medium text-muted-foreground tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Soluciones para Marcas y Negocios
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <span className="block">Multiplica tu alcance con</span>
            <span className="gradient-text">los creadores ideales</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            Escala tu estrategia de contenido UGC. Nuestra IA conecta tu marca con creadores que realmente encajan con tu audiencia para{" "}
            <span className="text-foreground font-semibold">maximizar tu ROI</span>.
          </motion.p>

          {/* Value props — simple inline */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.22 }}
          >
            {["Campañas llave en mano", "Pagos protegidos", "Resultados medibles"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
          >
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-medium rounded-xl gap-2">
                Empezar como Marca
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Feature cards — 3 col on desktop, stacked on mobile */}
          <motion.div
            className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            <div className="flex gap-4 p-5 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Matching Preciso</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">La IA analiza tu brief y te conecta solo con creadores relevantes para tu marca.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Gestión Centralizada</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Contratos, comunicaciones y aprobaciones desde un solo lugar.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">ROI Transparente</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Métricas claras de rendimiento para cada pieza de contenido entregada.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
