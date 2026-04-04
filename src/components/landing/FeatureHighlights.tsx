import { motion } from "framer-motion";
import { Sparkles, BarChart3, Shield, Zap } from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "Matching con IA",
        description: "Motor entrenado con miles de señales de rendimiento de campañas. Encuentra al creador adecuado para cada brief al instante.",
    },
    {
        icon: BarChart3,
        title: "Analíticas en tiempo real",
        description: "Alcance, impresiones, engagement, clics. Todo en vivo en todas tus campañas activas desde un solo dashboard.",
    },
    {
        icon: Shield,
        title: "Colaboraciones verificadas",
        description: "Flujo de campaña estructurado: brief, selección de creadores, entrega, aprobación y cierre. Todo gestionado desde un solo panel.",
    },
    {
        icon: Zap,
        title: "Descubrimiento instantáneo",
        description: "Filtra por nicho, seguidores, ubicación, plataforma y engagement. Identifica al creador ideal en menos de 60 segundos.",
    },
];

export function FeatureHighlights() {
    return (
        <section className="py-20 md:py-28 bg-foreground text-background" id="features">
            <div className="container px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="mb-14"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="text-xs font-medium uppercase tracking-[0.15em] text-background/40 block mb-3">
                            La plataforma
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Todo lo que necesitas para{" "}
                            <span className="gradient-text">gran UGC.</span>
                        </h2>
                        <p className="text-background/60 text-base md:text-lg max-w-xl">
                            Un kit completo para colaboraciones modernas: desde el descubrimiento hasta la gestión de tu campaña, todo en un solo lugar.
                        </p>
                    </motion.div>

                    {/* Features grid */}
                    <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="flex gap-4"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.08 }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-background/10 border border-background/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <feature.icon className="w-5 h-5 text-background" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-1 text-background">{feature.title}</h3>
                                    <p className="text-background/55 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
