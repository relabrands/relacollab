import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Zap, TrendingUp, Award } from "lucide-react";

const creatorBenefits = [
    {
        icon: Zap,
        title: "Las campañas te llegan, no al revés",
        description: "Nada de DMs que nadie responde. Cuando tu perfil encaja con una campaña, la marca te invita directamente o tú ves la oportunidad en tu panel.",
    },
    {
        icon: DollarSign,
        title: "Sabes cuánto te pagan antes de decir que sí",
        description: "Cada campaña muestra la compensación desde el principio. Aceptas solo si te conviene. Sin regateos ni sorpresas después de entregar el contenido.",
    },
    {
        icon: TrendingUp,
        title: "Tu historial habla por ti",
        description: "Cada campaña completada queda en tu perfil. Con el tiempo, acumulas credenciales que abren puertas a marcas más grandes y mejor pagadas.",
    },
    {
        icon: Award,
        title: "Solo marcas que saben lo que quieren",
        description: "Cada marca en la plataforma tiene un brief claro: qué contenido necesitan, cuándo y bajo qué condiciones. No pierdes tiempo con propuestas vagas.",
    },
];

export function ForCreators() {
    return (
        <section className="py-20 md:py-28 bg-muted/20" id="for-creators">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="mb-14"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="section-eyebrow">Para Creadores</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-3 mb-4">
                            Tu contenido ya tiene valor.{" "}
                            <span className="gradient-text">Ahora que te lo paguen.</span>
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            No necesitas ser famoso. Necesitas contenido auténtico y audiencia real. Con eso, RELA Collab hace el resto: te conecta con marcas que buscan exactamente lo que tú haces.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 md:gap-5 mb-12">
                        {creatorBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="flex gap-4 p-5 md:p-6 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors duration-200"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.07 }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <benefit.icon className="w-5 h-5 text-background" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-1">{benefit.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 md:p-8 rounded-2xl border border-border/60 bg-background"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-bold mb-1">Aplica gratis. Sin tarjeta.</h3>
                            <p className="text-muted-foreground text-sm">Revisamos tu perfil en menos de 24 horas. Si calificas, ya puedes ver las campañas disponibles.</p>
                        </div>
                        <Link to="/apply" className="flex-shrink-0">
                            <Button className="h-11 px-6 rounded-xl font-medium w-full sm:w-auto">
                                Únete como Creador
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
