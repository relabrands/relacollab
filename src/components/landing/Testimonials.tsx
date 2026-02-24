import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        quote: "RELA Collab me cambió la vida. Pasé de luchar por conseguir acuerdos a tener un flujo constante de oportunidades que realmente encajan con mi estilo. ¡El matching de IA es increíblemente preciso!",
        name: "María González",
        handle: "@mariagram",
        role: "Creadora • 85K seguidores",
        type: "creator",
        avatar: "MG",
    },
    {
        quote: "Lanzamos tres campañas en RELA Collab y vimos una mejora de 3x en la interacción con respecto a nuestra estrategia anterior. La calidad de los creadores es impresionante.",
        name: "Carlos Reyes",
        handle: "Director de Marketing",
        role: "Marca de Belleza",
        type: "brand",
        avatar: "CR",
    },
    {
        quote: "Los scores de match son reales. Cada creador con el que trabajé fue la elección correcta. He reducido mi tiempo de búsqueda en un 80%.",
        name: "Daniela Ortiz",
        handle: "CMO",
        role: "Startup de Moda",
        type: "brand",
        avatar: "DO",
    },
    {
        quote: "Por fin una plataforma que trata a los creadores como profesionales. Pagos transparentes, marcas reales, y me notifican cuando llegan oportunidades, ya no tengo que buscar.",
        name: "Luis Marte",
        handle: "@luismarte",
        role: "Creador Fitness • 42K seguidores",
        type: "creator",
        avatar: "LM",
    },
    {
        quote: "Redujimos nuestro gasto en influencers en un 40% y duplicamos nuestro contenido. El dashboard hace que todo sea súper fácil de gestionar.",
        name: "Sofía Tavares",
        handle: "Growth Lead",
        role: "Startup Tech",
        type: "brand",
        avatar: "ST",
    },
    {
        quote: "Era escéptica, pero después de mi primera campaña pagada me enganché. Mi primer acuerdo llegó a la semana de registrarme. Sin correos fríos ni negociaciones incómodas.",
        name: "Ana Belén",
        handle: "@anabelen",
        role: "Creadora de Viajes • 120K seguidores",
        type: "creator",
        avatar: "AB",
    },
];

function StarRating() {
    return (
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
            ))}
        </div>
    );
}

export function Testimonials() {
    return (
        <section className="py-24 bg-background" id="testimonials">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
                            <Star className="w-4 h-4 fill-success" />
                            Lo que dice la gente
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Elegido por Creadores{" "}
                            <span className="gradient-text">y Marcas por igual</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Resultados reales de personas reales. Descubre por qué RELA Collab es la plataforma de UGC preferida en Latinoamérica.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.name}
                                className="glass-card p-6 hover-lift flex flex-col"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.07 }}
                            >
                                <StarRating />
                                <blockquote className="text-sm leading-relaxed text-muted-foreground flex-1 mb-6 italic">
                                    "{testimonial.quote}"
                                </blockquote>
                                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0 ${testimonial.type === "creator" ? "bg-gradient-accent" : "bg-gradient-primary"
                                            }`}
                                    >
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{testimonial.name}</div>
                                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                                    </div>
                                    <span
                                        className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${testimonial.type === "creator"
                                            ? "bg-accent/10 text-accent"
                                            : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        {testimonial.type === "creator" ? "Creador" : "Marca"}
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
