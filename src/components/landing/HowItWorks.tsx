import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, Sparkles, Users, CheckCircle, Inbox, DollarSign, Star, Phone } from "lucide-react";

const brandSteps = [
    {
        icon: FileText,
        title: "Crea el brief",
        description: "Define objetivos, público, presupuesto e identidad de marca. Nuestro formulario te guía en cada paso.",
    },
    {
        icon: Sparkles,
        title: "La IA hace el match",
        description: "El sistema cruza tu brief con miles de perfiles y te entrega una lista curada con scores de coincidencia.",
    },
    {
        icon: Users,
        title: "Invita y colabora",
        description: "Revisa portafolios, envía propuestas e inicia la colaboración directamente desde la plataforma.",
    },
    {
        icon: CheckCircle,
        title: "Aprueba y paga",
        description: "Revisa el contenido, solicita revisiones si necesitas, aprueba y gestiona el cierre de tu campaña.",
    },
];

const creatorSteps = [
    {
        icon: Phone,
        title: "Crea tu perfil",
        description: "Conecta tu TikTok o Instagram. Los datos de tu audiencia hablan por sí solos.",
    },
    {
        icon: Inbox,
        title: "Descubre oportunidades",
        description: "Explora campañas ordenadas por compatibilidad. Cada una tiene un score calculado para ti.",
    },
    {
        icon: Star,
        title: "Aplica o recibe invitaciones",
        description: "Aplica a campañas que te gusten o recibe invitaciones de marcas que ya te eligieron.",
    },
    {
        icon: DollarSign,
        title: "Crea y cobra",
        description: "Sube el link del contenido, espera la aprobación y coordina directamente con la marca. Así de directo.",
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
                                Simple para todos.
                            </h2>

                            {/* Toggle — minimal text version */}
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