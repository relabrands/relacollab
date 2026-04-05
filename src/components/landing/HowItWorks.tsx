import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, Users, CheckCircle, Inbox, DollarSign, Phone, Search, Send } from "lucide-react";

const brandSteps = [
    {
        icon: FileText,
        title: "Escribe tu brief",
        description: "¿Qué producto? ¿Para quién? ¿Qué tono? Nuestro formulario te guía. No necesitas saber de marketing para llenarlo bien.",
    },
    {
        icon: Search,
        title: "Recibe a los creadores que encajan",
        description: "El sistema sugiere perfiles ordenados por compatibilidad con tu campaña. Ves sus métricas, su contenido y su nicho antes de decidir.",
    },
    {
        icon: Send,
        title: "Invita y coordina desde la plataforma",
        description: "Envía invitaciones directamente. El creador las recibe, lee el contrato y acepta o no. Sin WhatsApp grupal, sin correos perdidos.",
    },
    {
        icon: CheckCircle,
        title: "Aprueba el contenido y cierra",
        description: "El creador sube el contenido. Tú lo revisas, solicitas cambios si aplica, apruebas y listo. Todo queda registrado.",
    },
];

const creatorSteps = [
    {
        icon: Phone,
        title: "Crea tu perfil en minutos",
        description: "Conecta tu Instagram o TikTok. El sistema analiza tus métricas y define tu perfil automáticamente. Sin formularios interminables.",
    },
    {
        icon: Inbox,
        title: "Explora campañas o recibe invitaciones",
        description: "Ves campañas ordenadas por compatibilidad. Cada una muestra lo que debes entregar, cuándo y cuánto recibes. Antes de aplicar.",
    },
    {
        icon: FileText,
        title: "Lee el contrato y acepta",
        description: "Cada colaboración genera un contrato digital con los términos claros. Lo lees, lo aceptas y empieza la campaña. Sin papel.",
    },
    {
        icon: DollarSign,
        title: "Entrega el contenido y coordina el pago",
        description: "Subes el contenido a la plataforma. La marca lo aprueba y coordinas el cierre directamente. Sin perseguir a nadie.",
    },
];

interface HowItWorksProps {
    initialView?: "brand" | "creator";
    hideToggle?: boolean;
}

export function HowItWorks({ initialView = "brand", hideToggle = false }: HowItWorksProps = {}) {
    const [activeView, setActiveView] = useState<"brand" | "creator">(initialView);
    const steps = activeView === "brand" ? brandSteps : creatorSteps;

    return (
        <section className="py-20 md:py-28 bg-background" id="how-it-works">
            <div className="container px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="section-eyebrow">Cómo funciona</span>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mt-3">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight flex-1">
                                Sin aprendizaje.<br />Sin curva.
                            </h2>

                            {/* Toggle */}
                            {!hideToggle && (
                                <div className="flex items-center gap-1 pb-1">
                                    <button
                                        onClick={() => setActiveView("brand")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeView === "brand"
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Marcas
                                    </button>
                                    <button
                                        onClick={() => setActiveView("creator")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeView === "creator"
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Creadores
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Steps */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
                        >
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.title}
                                    className="relative"
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.35, delay: index * 0.07 }}
                                >
                                    {/* Step number + connector */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className="hidden lg:block flex-1 h-px bg-border" />
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}