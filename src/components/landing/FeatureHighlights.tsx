import { motion } from "framer-motion";
import { Sparkles, BarChart3, Shield, Zap, MessageSquare, Clock } from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "Inteligencia de Match con IA",
        description: "Nuestro motor de matching se entrena con miles de señales de rendimiento de campañas para encontrar al creador adecuado para cada brief, al instante.",
        gradient: "from-primary/20 to-primary/5",
        iconGradient: "bg-gradient-primary",
    },
    {
        icon: BarChart3,
        title: "Analíticas de Campaña en Vivo",
        description: "Rastrea cada métrica importante (alcance, impresiones, tasa de interacción, clics en enlaces) en tiempo real en todas tus campañas activas.",
        gradient: "from-accent/20 to-accent/5",
        iconGradient: "bg-gradient-accent",
    },
    {
        icon: Shield,
        title: "Pagos Protegidos en Custodia",
        description: "Las marcas financian las campañas por adelantado. Los creadores reciben su pago automáticamente en cuanto su contenido es aprobado. Cero disputas, cero retrasos.",
        gradient: "from-success/20 to-success/5",
        iconGradient: "bg-gradient-success",
    },
    {
        icon: Zap,
        title: "Descubrimiento Instantáneo de Creadores",
        description: "Filtra por nicho, cantidad de seguidores, ubicación, tasa de interacción y plataforma. Identifica a tu creador ideal en menos de 60 segundos.",
        gradient: "from-warning/20 to-warning/5",
        iconGradient: "bg-gradient-to-br from-warning to-orange-500",
    },
    {
        icon: MessageSquare,
        title: "Centro de Colaboración Integrado",
        description: "Envío de briefs, presentación de contenido, solicitudes de revisión y aprobaciones: todo sucede en la plataforma. Dile adiós al caos de correos.",
        gradient: "from-primary/15 to-accent/10",
        iconGradient: "bg-gradient-primary",
    },
    {
        icon: Clock,
        title: "Gestión de Tiempos de Campaña",
        description: "Establece fechas límite, envía recordatorios automáticos y rastrea el estado de los entregables desde el brief hasta la aprobación final con una línea de tiempo visual.",
        gradient: "from-accent/15 to-success/10",
        iconGradient: "bg-gradient-accent",
    },
];

export function FeatureHighlights() {
    return (
        <section className="py-24 bg-sidebar text-sidebar-foreground" id="features">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Características de la Plataforma
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Todo lo que necesitas para{" "}
                            <span className="gradient-text">gestionar un gran UGC</span>
                        </h2>
                        <p className="text-xl text-sidebar-foreground/70 max-w-2xl mx-auto">
                            Un kit de herramientas completo para colaboraciones modernas entre creadores y marcas: desde el descubrimiento hasta el pago, todo en un solo lugar.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-sidebar-border hover-lift group cursor-default`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.iconGradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-3 text-sidebar-foreground">{feature.title}</h3>
                                <p className="text-sidebar-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
