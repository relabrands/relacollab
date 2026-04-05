import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Clock, ShieldCheck, BarChart3 } from "lucide-react";

const brandBenefits = [
    {
        icon: Sparkles,
        title: "El match lo hace el sistema",
        description: "Describes tu campaña y la plataforma cruza tu brief con los perfiles de creadores disponibles. Ves los más compatibles primero, no una lista de miles.",
    },
    {
        icon: Clock,
        title: "Campaña activa en el mismo día",
        description: "Publica el brief, selecciona creadores e invítalos directamente desde el panel. Sin llamadas de ventas, sin propuestas en PDF, sin semanas de coordinación.",
    },
    {
        icon: BarChart3,
        title: "Sabes exactamente qué pasó",
        description: "Cada entrega queda registrada. Ves qué contenido se aprobó, qué se rechazó y cómo se cerró cada campaña. Sin Excel ni seguimientos por WhatsApp.",
    },
    {
        icon: ShieldCheck,
        title: "Contrato digital en cada campaña",
        description: "El creador acepta los términos digitalmente antes de empezar. Los entregables, fechas y compensación quedan registrados. Sin malentendidos al final.",
    },
];

export function ForBrands() {
    return (
        <section className="py-20 md:py-28 bg-background" id="for-brands">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="mb-14"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="section-eyebrow">Para Marcas</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-3 mb-4">
                            Deja de buscar creadores en Instagram.{" "}
                            <span className="gradient-text">Ellos llegan a ti.</span>
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Las marcas que usan RELA Collab no pierden tiempo levantando el teléfono ni revisando miles de perfiles. Publican una campaña y reciben propuestas de creadores que ya encajan.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 md:gap-5 mb-12">
                        {brandBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="flex gap-4 p-5 md:p-6 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors duration-200"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.07 }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <benefit.icon className="w-5 h-5 text-background" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-1">{benefit.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 md:p-8 rounded-2xl bg-foreground text-background"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-bold mb-1">¿Tienes una campaña en mente?</h3>
                            <p className="text-background/60 text-sm">Crea tu cuenta y publica tu primer brief. Los creadores correctos estarán esperando.</p>
                        </div>
                        <Link to="/business" className="flex-shrink-0">
                            <Button className="bg-background text-foreground hover:bg-background/90 h-11 px-6 rounded-xl font-medium">
                                Empezar como Marca
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
