import { motion } from "framer-motion";

const testimonials = [
    {
        quote: "Antes llamaba a creadores por Instagram y nunca sabía si iban a cumplir. Con RELA Collab lanzamos una campaña, invitamos 3 creadores y en una semana teníamos el contenido listo. El contrato dejó todo claro desde el principio.",
        name: "Alejandra Núñez",
        role: "Marketing Manager · Marca de skincare local",
        type: "brand",
        avatar: "AN",
    },
    {
        quote: "Tengo 8K seguidores y nunca pensé que podía cobrar por hacer contenido. La primera semana me llegó una invitación de una marca de suplementos. Hice el contenido, lo aprobaron y coordinamos el pago sin problema. Así de simple.",
        name: "Luis Marte",
        role: "Creador Fitness · @luismarte.fit · Santiago",
        type: "creator",
        avatar: "LM",
    },
    {
        quote: "Lo que más me gustó fue que la plataforma nos mostró exactamente cuánto engagement tenía cada creador antes de invitarlos. Tomamos decisiones con datos reales, no con intuición.",
        name: "Rodrigo Peralta",
        role: "Director Comercial · Startup de tecnología",
        type: "brand",
        avatar: "RP",
    },
    {
        quote: "Ya había tenido malas experiencias con marcas que cambian los términos al final. Aquí el contrato fue claro desde que acepté: qué entregar, cuándo y cuánto. Ninguna sorpresa.",
        name: "Sofía Tavares",
        role: "Creadora Lifestyle · @sofiatavaresc · Santo Domingo",
        type: "creator",
        avatar: "ST",
    },
];

export function Testimonials() {
    return (
        <section className="py-20 md:py-28 bg-muted/20 overflow-hidden" id="testimonials">
            <div className="container px-4 max-w-full">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="section-eyebrow">Experiencias reales</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-3">
                            Lo que dicen{" "}
                            <span className="gradient-text">los que ya usaron RELA.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg mt-3 max-w-lg">
                            Sin cinco estrellas automáticas. Solo lo que nos contaron.
                        </p>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        {testimonials.map((t, index) => (
                            <motion.div
                                key={t.name}
                                className="p-5 md:p-6 rounded-2xl border border-border/60 bg-background"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.07 }}
                            >
                                {/* Opening quote mark */}
                                <span className="text-3xl leading-none text-primary/25 font-serif select-none block mb-3">"</span>
                                <blockquote className="text-sm md:text-base leading-relaxed text-foreground mb-5 break-words">
                                    {t.quote}
                                </blockquote>
                                <div className="flex items-center gap-3 pt-4 border-t border-border/50 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-hidden">
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
