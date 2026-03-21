import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Users, CheckCircle, Inbox, DollarSign, Star, Phone } from "lucide-react";

const brandSteps = [
  {
    icon: FileText,
    title: "Crea el brief de tu campaña",
    description: "Define tus objetivos, público, presupuesto e identidad. Nuestro formulario te guía en cada detalle.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "La IA encuentra tus mejores matches",
    description: "Nuestra IA cruza tu brief con miles de perfiles. Recibes una lista curada calificada por nivel de coincidencia.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Invita y colabora",
    description: "Revisa puntajes de match y portafolios, envía propuestas e inicia la colaboración desde la plataforma.",
    color: "success",
  },
  {
    icon: CheckCircle,
    title: "Aprueba el contenido y paga",
    description: "Revisa el UGC, pide revisiones si es necesario, aprueba el contenido y libera el pago con un clic.",
    color: "primary",
  },
];

const creatorSteps = [
  {
    icon: Phone,
    title: "Crea tu perfil de creador",
    description: "Conecta tu TikTok o Instagram, elige tus categorías y deja que los datos de tu audiencia hablen por sí solos.",
    color: "accent",
  },
  {
    icon: Inbox,
    title: "Descubre oportunidades perfectas",
    description: "Explora campañas ordenadas por qué tanto encajan con tu nicho y audiencia. Cada una tiene un puntaje calculado para ti.",
    color: "primary",
  },
  {
    icon: Star,
    title: "Aplica o recibe invitaciones",
    description: "Aplica a las campañas que te encanten o recibe invitaciones de marcas que ya te eligieron como su match ideal.",
    color: "success",
  },
  {
    icon: DollarSign,
    title: "Crea, envía y recibe tu pago",
    description: "Sube el link de tu contenido, espera la aprobación de la marca y recibe tu pago. Así de sencillo.",
    color: "primary",
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
    <section className="py-24 bg-background" id="how-it-works">
      <div className="container px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Cómo funciona</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Un flujo simple y poderoso, ya seas una marca o un creador.
          </p>

          {/* Toggle */}
          {!hideToggle && (
            <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-muted border border-border">
              <Button
                variant={activeView === "brand" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("brand")}
                className="px-6"
              >
                Soy una Marca
              </Button>
              <Button
                variant={activeView === "creator" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("creator")}
                className="px-6"
              >
                Soy un Creador
              </Button>
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="text-center p-4">
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${step.color === "primary"
                    ? "bg-gradient-primary"
                    : step.color === "accent"
                      ? "bg-gradient-accent"
                      : "bg-gradient-success"
                    }`}
                >
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Paso {index + 1}</div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}