import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        quote: "RELA Collab changed my life. I went from struggling to find brand deals to having a consistent stream of opportunities that actually match my content style. The AI matching is scary accurate!",
        name: "María González",
        handle: "@mariagram",
        role: "Lifestyle Creator • 85K followers",
        type: "creator",
        avatar: "MG",
    },
    {
        quote: "We launched three campaigns through RELA Collab and saw a 3x improvement in engagement compared to our previous influencer strategy. The creator quality is genuinely impressive.",
        name: "Carlos Reyes",
        handle: "Director de Marketing",
        role: "Beauty Brand • Santo Domingo",
        type: "brand",
        avatar: "CR",
    },
    {
        quote: "The AI match scores are real. Every creator I've worked with through RELA was a genuine fit. I've cut my creator sourcing time by 80%.",
        name: "Daniela Ortiz",
        handle: "CMO",
        role: "Fashion Startup",
        type: "brand",
        avatar: "DO",
    },
    {
        quote: "Finally a platform that treats creators like professionals. Transparent pay, real brands, and I get notified when opportunities land in my feed — no more inbox hunting.",
        name: "Luis Marte",
        handle: "@luismarte",
        role: "Fitness Creator • 42K followers",
        type: "creator",
        avatar: "LM",
    },
    {
        quote: "We reduced our influencer spend by 40% and doubled our content output. The campaign dashboard makes everything effortless to manage.",
        name: "Sofía Tavares",
        handle: "Growth Lead",
        role: "Tech Startup",
        type: "brand",
        avatar: "ST",
    },
    {
        quote: "I was skeptical, but after my first paid campaign I was hooked. My first deal came within a week of signing up. No cold emails, no awkward negotiations — just content creation.",
        name: "Ana Belén",
        handle: "@anabelen",
        role: "Food & Travel Creator • 120K followers",
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
                            What People Are Saying
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Trusted by Creators{" "}
                            <span className="gradient-text">& Brands Alike</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Real results from real people. See why RELA Collab is the preferred UGC platform in Latin America.
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
                                        {testimonial.type === "creator" ? "Creator" : "Brand"}
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
