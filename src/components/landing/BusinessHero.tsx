import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, BarChart3, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function BusinessHero() {
  return (
    <section className="relative min-h-screen bg-mesh overflow-hidden flex items-center pt-24">
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
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Target className="w-4 h-4" />
              Soluciones para Marcas y Negocios
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="block">Multiplica tu alcance con</span>
            <span className="gradient-text">los creadores ideales</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Escala tu estrategia de contenido UGC. Nuestra IA conecta tu marca con creadores 
            que realmente encajan con tu audiencia para <span className="text-foreground font-semibold">maximizar tu ROI</span>.
          </motion.p>

          {/* Quick Value Props */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {["Campañas llave en mano", "Pagos protegidos", "Resultados medibles", "Aprobación de contenido total"].map((item) => (
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
                Empezar como Marca
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Feature Highlight Cards inline */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="p-6 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Matching Preciso</h3>
              <p className="text-sm text-muted-foreground">La IA analiza tu brief y te conecta solo con creadores relevantes.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Gestión Centralizada</h3>
              <p className="text-sm text-muted-foreground">Administra contratos, comunicaciones y aprobaciones desde un solo lugar.</p>
            </div>

            <div className="p-6 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm hover:border-success/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold mb-2">ROI Transparente</h3>
              <p className="text-sm text-muted-foreground">Métricas claras de rendimiento para cada pieza de contenido entregada.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
