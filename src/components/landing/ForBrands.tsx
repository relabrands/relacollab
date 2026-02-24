import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BarChart3, Clock, ShieldCheck, Target, Users } from "lucide-react";

const brandBenefits = [
    {
        icon: Sparkles,
        title: "Matching de creadores con IA",
        description: "Olvídate de revisar cientos de perfiles. Nuestra IA encuentra al instante creadores cuya audiencia, estilo e interacción encajan con tus objetivos.",
    },
    {
        icon: Target,
        title: "Campañas que realmente convierten",
        description: "Define tus objetivos, público objetivo e identidad de marca; nosotros encontramos creadores cuyos seguidores conectarán genuinamente con tus productos.",
    },
    {
        icon: Clock,
        title: "Lanza en horas, no en semanas",
        description: "Desde el brief de la campaña hasta el contenido en vivo en tiempo récord. Gestiona todo en un solo panel.",
    },
    {
        icon: BarChart3,
        title: "Analíticas de rendimiento en tiempo real",
        description: "Rastrea vistas, interacción, alcance y ROI en las publicaciones de cada creador. Conoce exactamente qué funciona.",
    },
    {
        icon: ShieldCheck,
        title: "Pagos seguros y sin riesgos",
        description: "Los fondos solo se liberan cuando apruebas el contenido. Cero riesgo, control total sobre tu inversión en UGC.",
    },
    {
        icon: Users,
        title: "Red curada de creadores",
        description: "Cada creador en RELA Collab está verificado. Validamos su interacción real, contenido de calidad y profesionalismo.",
    },
];

export function ForBrands() {
    return (
        <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-background" id="for-brands">
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
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Target className="w-4 h-4" />
                            Para Marcas
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Encuentra al creador perfecto.{" "}
                            <span className="gradient-text">Siempre.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Deja de adivinar en tus campañas con influencers. La IA de RELA Collab asegura que cada creador con el que trabajes sea ideal para tu marca.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {brandBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="glass-card p-6 hover-lift group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Banner */}
                    <motion.div
                        className="glass-card p-8 md:p-12 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Inicia tu primera campaña con IA hoy
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Únete a cientos de marcas que han reemplazado las suposiciones con colaboraciones basadas en datos.
                        </p>
                        <Link to="/login">
                            <Button variant="hero" size="lg">
                                Empezar como Marca
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
