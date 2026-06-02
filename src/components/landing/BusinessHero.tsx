import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, BarChart3, Users, CheckCircle, Sparkles, Building2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export function BusinessHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background overflow-hidden pt-24 pb-16 md:pb-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-[100px] -translate-y-1/4 translate-x-1/4 pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-[80px] pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">

          {/* Left Content */}
          <div className="text-left space-y-8">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary tracking-wide backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              Soluciones Premium para Marcas
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <span className="block text-foreground">Multiplica tu alcance</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                con creadores UGC
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Escala tu estrategia de contenido. Nuestra plataforma conecta tu marca con creadores auténticos para generar contenido de alto impacto y{" "}
              <span className="text-foreground font-semibold border-b border-primary/30">maximizar tu ROI</span>.
            </motion.p>

            {/* Value props */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {["Campañas llave en mano", "Derechos de uso 100%"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-sm md:text-base font-medium text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border/50">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  <Building2 className="w-5 h-5 mr-2" />
                  Crear mi primera campaña
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Content - Visual Elements */}
          <motion.div
            className="relative lg:h-[600px] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* Glassmorphic Dashboard Preview */}
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
              {/* Header Mockup */}
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="h-4 w-24 bg-muted rounded-md mb-1.5" />
                    <div className="h-3 w-16 bg-muted/50 rounded-md" />
                  </div>
                </div>
                <div className="h-8 w-20 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">+142% ROI</span>
                </div>
              </div>

              {/* Stats Grid Mockup */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                  <div className="text-2xl font-bold mb-1">1.2M</div>
                  <div className="text-xs text-muted-foreground">Impresiones Generadas</div>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <Users className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold mb-1">45</div>
                  <div className="text-xs text-muted-foreground">Creadores Activos</div>
                </div>
              </div>

              {/* Activity Mockup */}
              <div className="mt-4 flex-1 rounded-2xl bg-secondary/30 border border-border/50 p-4 space-y-4">
                <div className="h-4 w-32 bg-muted rounded-md mb-2" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-full bg-muted rounded-md" />
                      <div className="h-3 w-2/3 bg-muted/50 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Badge */}
              <motion.div 
                className="absolute -right-6 -bottom-6 bg-background rounded-2xl p-4 border border-border shadow-xl flex items-center gap-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-bold">Contenido Aprobado</div>
                  <div className="text-xs text-muted-foreground">Listo para Ads</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>

        {/* Feature cards below hero */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mt-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-4 p-6 rounded-3xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Matching Preciso</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Nuestra tecnología analiza tu brief y te conecta exactamente con los creadores que encajan con los valores de tu marca.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6 rounded-3xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Contenido de Alto Rendimiento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Obtén videos e imágenes en formato nativo, diseñados específicamente para convertir en paid media y orgánico.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6 rounded-3xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Derechos de Uso Incluidos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Todo el contenido generado (UGC) te pertenece. Úsalo libremente en tus anuncios y redes sin costos adicionales.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
