import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
    Sparkles,
    TrendingUp,
    Users,
    Zap,
    Shield,
    Award,
    DollarSign,
    Camera,
    Target,
    CheckCircle2,
    ArrowRight,
    Star,
    Instagram,
    Play,
    Clock,
} from "lucide-react";


import { motion } from "framer-motion";
import { Header } from "@/components/landing/Header";

export default function Apply() {
    const beneficios = [
        {
            icon: DollarSign,
            title: "Cobros Garantizados",
            description: "Recibe pagos puntuales por cada campaña completada. Sin perseguir marcas, sin incertidumbre."
        },
        {
            icon: Target,
            title: "Matching con IA",
            description: "Nuestro algoritmo te conecta con marcas que encajan con tu estilo, nicho y audiencia perfectamente."
        },
        {
            icon: Zap,
            title: "Oportunidades Diarias",
            description: "Accede a decenas de campañas activas todos los días. Aplica con un clic y empieza a crear."
        },
        {
            icon: Shield,
            title: "Contratos Protegidos",
            description: "Cada colaboración está respaldada por un contrato digital. Tú creas, nosotros protegemos."
        },
        {
            icon: Award,
            title: "Construye tu Portafolio",
            description: "Trabaja con marcas reconocidas y construye un portafolio que abra más puertas."
        },
        {
            icon: TrendingUp,
            title: "Crece como Creador",
            description: "Accede a analytics, recursos y capacitaciones exclusivas para llevar tu contenido al siguiente nivel."
        }
    ];

    const estadisticas = [
        { value: "$0", label: "Para creadores" },
        { value: "Top", label: "Marcas aliadas" },
        { value: "100%", label: "Pagos garantizados" },
        { value: "IA", label: "Match inteligente" }
    ];

    const comoFunciona = [
        {
            step: "01",
            title: "Crea tu perfil",
            description: "Regístrate en minutos. Conecta tu Instagram y/o TikTok y muestra tu estilo único.",
            icon: Camera
        },
        {
            step: "02",
            title: "Recibe matches",
            description: "Nuestra IA analiza tu perfil y te sugiere campañas que se adaptan a tu contenido y audiencia.",
            icon: Sparkles
        },
        {
            step: "03",
            title: "Crea y gana",
            description: "Entrega tu contenido, obtén aprobación y recibe tu pago. Así de simple.",
            icon: CheckCircle2
        }
    ];

    const requisitos = [
        "Tener cuenta activa en Instagram o TikTok",
        "Mínimo 1,000 seguidores",
        "Contenido original y auténtico",
        "Disponibilidad para completar campañas a tiempo",
        "Ganas de crecer y colaborar con marcas"
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="pt-24 pb-16 md:pb-20 px-4 relative overflow-hidden">
                {/* Subtle single orb — no floating animated blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

                <div className="container mx-auto max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="text-center space-y-5"
                    >
                        {/* Eyebrow */}
                        <div className="flex justify-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-background text-xs font-medium text-muted-foreground tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                                Creadores fundadores de RELA Collab
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                            Convierte tu contenido
                            <br />
                            <span className="gradient-text">en ingresos reales</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            La plataforma de UGC más inteligente de República Dominicana. Conecta con marcas top y cobra por lo que amas hacer.
                        </p>

                        {/* Trust line */}
                        <p className="text-xs sm:text-sm text-muted-foreground/70">
                            Sin costo · Sin tarjeta de crédito · Empieza en menos de 3 minutos
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Link to="/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8 gap-2 group">
                                    Empezar a ganar hoy
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8 gap-2">
                                <Play className="w-4 h-4 fill-current" />
                                Ver cómo funciona
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 max-w-2xl mx-auto">
                            {estadisticas.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + index * 0.08 }}
                                    className="text-center"
                                >
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Cómo Funciona */}
            <section id="como-funciona" className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Proceso simple</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Cómo funciona</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Desde que te registras hasta tu primer pago en solo tres pasos
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {comoFunciona.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                            >
                                <Card className="relative overflow-hidden h-full hover:shadow-lg transition-all hover:border-primary/30 group">
                                    <CardContent className="p-8">
                                        <div className="absolute top-0 right-0 text-9xl font-bold text-primary/5 leading-none select-none">
                                            {item.step}
                                        </div>
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                                <item.icon className="w-7 h-7 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Beneficios */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Por qué elegirnos</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Todo lo que necesitas para triunfar
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Construimos la plataforma definitiva para creadores que quieren monetizar sin complicaciones
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {beneficios.map((beneficio, index) => (
                            <motion.div
                                key={beneficio.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08 }}
                            >
                                <Card className="h-full hover:shadow-md transition-all hover:border-primary/40 group">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                            <beneficio.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{beneficio.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {beneficio.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Requisitos */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <Badge className="mb-4">¿Califico?</Badge>
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                ¿Qué necesitas para unirte?
                            </h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                Buscamos creadores auténticos de cualquier nicho: food, lifestyle, belleza, tecnología, fitness y más. Si tienes audiencia y pasión, tienes un lugar aquí.
                            </p>
                            <ul className="space-y-3">
                                {requisitos.map((req, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium">{req}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            {/* Testimonial card */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm italic text-muted-foreground mb-4 leading-relaxed">
                                        "Antes tardaba semanas buscando marcas. Ahora RELA Collab me manda oportunidades que encajan perfecto con mi contenido. ¡Ya generé más de $3,000 en mis primeros 2 meses!"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                                            VM
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">Valentina M.</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Instagram className="w-3 h-3" /> 45K seguidores · Lifestyle
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm italic text-muted-foreground mb-4 leading-relaxed">
                                        "Lo que más me gusta es la transparencia. Sé exactamente cuánto voy a cobrar antes de aceptar una campaña. No más sorpresas, no más regateos."
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm">
                                            CR
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">Carlos R.</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Instagram className="w-3 h-3" /> 22K seguidores · Food & Tech
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Card className="border-primary/20 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <CardContent className="p-6 sm:p-10 md:p-12 text-center relative">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                    ¿Listo para empezar a ganar?
                                </h2>
                                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                                    Únete a miles de creadores que ya monetizan su contenido con marcas que los valoran. Es gratis y toma menos de 3 minutos.
                                </p>

                                <Link to="/login" className="block w-full sm:w-auto sm:inline-block">
                                    <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-12 h-12 sm:h-14 group gap-2">
                                        Crear mi cuenta gratis
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                                    </Button>
                                </Link>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                        Sin tarjeta de crédito
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                                        Aprobación en 24h
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                                        100% seguro
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border">
                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2025 RELA Collab. Todos los derechos reservados.</p>
                    <div className="flex gap-4">
                        <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors">
                            Privacidad
                        </Link>
                        <Link to="/terminos-y-condiciones" className="hover:text-foreground transition-colors">
                            Términos
                        </Link>
                        <Link to="/login" className="hover:text-foreground transition-colors">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
