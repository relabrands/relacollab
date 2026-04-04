import { motion } from "framer-motion";

const testimonials = [
    {
        quote: "Pasé de luchar por conseguir acuerdos a tener un flujo constante de oportunidades que realmente encajan con mi estilo. El matching de IA es increíblemente preciso.",
        name: "María González",
        role: "Creadora · 85K seguidores",
        type: "creator",
        avatar: "MG",
    },
    {
        quote: "Lanzamos tres campañas y vimos una mejora de 3x en engagement frente a nuestra estrategia anterior. La calidad de los creadores es impresionante.",
        name: "Carlos Reyes",
        role: "Director de Marketing · Marca de Belleza",
        type: "brand",
        avatar: "CR",
    },
    {
        quote: "Por fin una plataforma que trata a los creadores como profesionales. Acuerdos directos, marcas reales, y las oportunidades llegan solas.",
        name: "Luis Marte",
        role: "Creador Fitness · 42K seguidores",
        type: "creator",
        avatar: "LM",
    },
    {
        quote: "Redujimos el gasto en influencers un 40% y duplicamos el volumen de contenido. El dashboard hace que todo sea fácil de gestionar.",
        name: "Sofía Tavares",
        role: "Growth Lead · Startup Tech",
        type: "brand",
        avatar: "ST",
    },
];

export function Testimonials() {
    return (
        <section className="py-20 md:py-28 bg-muted/20" id="testimonials">
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
                        <span className="section-eyebrow">Testimonios</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-3">
                            Elegido por marcas{" "}
                            <span className="gradient-text">y creadores.</span>
                        </h2>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                        {testimonials.map((t, index) => (
                            <motion.div
                                key={t.name}
                                className="p-5 md:p-6 rounded-2xl border border-border/60 bg-background"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.07 }}
                            >
                                <blockquote className="text-sm md:text-base leading-relaxed text-foreground mb-5">
                                    "{t.quote}"
                                </blockquote>
                                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                                    <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{t.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${t.type === "creator"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                        }`}>
                                        {t.type === "creator" ? "Creador" : "Marca"}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
