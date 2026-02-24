import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, DollarSign, Star, TrendingUp, Inbox, Award } from "lucide-react";

const creatorBenefits = [
    {
        icon: Inbox,
        title: "Las oportunidades llegan a ti",
        description: "No más propuestas en frío ni perseguir marcas. Consigue matches con campañas que se ajusten naturalmente a tu estilo y audiencia.",
    },
    {
        icon: DollarSign,
        title: "Pago real y transparente",
        description: "Conoce exactamente cuánto ganarás antes de aplicar. Campañas pagadas, intercambios de productos o ambos: tú eliges.",
    },
    {
        icon: Zap,
        title: "Matching con IA, no asignaciones al azar",
        description: "Nuestra IA califica tu perfil frente a cada campaña. Solo las oportunidades de alta coincidencia llegan a tu feed.",
    },
    {
        icon: TrendingUp,
        title: "Haz crecer tu negocio como creador",
        description: "Construye un historial con campañas verificadas, acumula reseñas y desbloquea acuerdos mejor pagados.",
    },
    {
        icon: Star,
        title: "Muestra tu mejor trabajo",
        description: "Tu biblioteca de contenido vive en tu perfil de creador, facilitando que las marcas descubran tu estilo.",
    },
    {
        icon: Award,
        title: "Pagos protegidos, siempre",
        description: "Las marcas financian las campañas antes de que empieces a crear. Sin facturas pendientes, sin ghosting. Tus ganancias están aseguradas.",
    },
];

export function ForCreators() {
    return (
        <section className="py-24 bg-gradient-to-br from-accent/5 via-background to-background" id="for-creators">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Para Creadores
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Convierte tu contenido en{" "}
                            <span className="gradient-text">Ingresos consistentes</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Deja de lidiar para conseguir acuerdos con marcas. RELA Collab te conecta con empresas que realmente encajan con tu nicho, audiencia y estilo.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {creatorBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="glass-card p-6 hover-lift group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <benefit.icon className="w-6 h-6 text-accent-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Banner */}
                    <motion.div
                        className="glass-card p-8 md:p-12 bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            ¿Listo para trabajar con tus marcas ideales?
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Aplica en minutos. Consigue matches al instante. Empieza a crear para marcas que valoran tu audiencia.
                        </p>
                        <Link to="/login">
                            <Button variant="glass" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                Únete como Creador
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
