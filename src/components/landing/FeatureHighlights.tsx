import { motion } from "framer-motion";
import { Sparkles, BarChart3, Shield, Zap } from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "El match no es aleatorio",
        description: "El sistema cruza tu brief con el nicho, el engagement y la audiencia de cada creador. No ves una lista de nombres, ves perfiles ordenados por compatibilidad real.",
    },
    {
        icon: BarChart3,
        title: "Ves los números antes de decidir",
        description: "Alcance, tasa de engagement, plataforma activa, frecuencia de publicación. Tienes los datos de cada creador disponibles antes de enviar una sola invitación.",
    },
    {
        icon: Shield,
        title: "Cada campaña tiene un contrato",
        description: "Nada de acuerdos de palabra. Cada colaboración genera automáticamente un contrato digital con entregables, fechas y términos. Firmado antes de empezar.",
    },
    {
        icon: Zap,
        title: "Encuentra al creador en 60 segundos",
        description: "Filtra por nicho, plataforma, número de seguidores y tipo de contenido. El descubrimiento no debería tomar días. Con RELA Collab, toma minutos.",
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
                            Todo en un solo panel.{" "}
                            <span className="gradient-text">Nada que descargar.</span>
                        </h2>
                        <p className="text-background/60 text-base md:text-lg max-w-xl">
                            Desde que creas el brief hasta que apruebas el último contenido, todo pasa dentro de RELA Collab. Sin hojas de cálculo, sin seguimientos por correo.
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
