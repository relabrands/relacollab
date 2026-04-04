import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    TrendingUp,
    Zap,
    Shield,
    DollarSign,
    Camera,
    Target,
    CheckCircle2,
    ArrowRight,
    Star,
    Instagram,
    Clock,
    Play,
    ChevronDown,
    Users,
    Plus,
    Minus,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { TrustedBrands } from "@/components/landing/TrustedBrands";
import { useRef, useState } from "react";

const niches = ["Lifestyle", "Belleza", "Food", "Tech", "Fitness", "Moda", "Viajes", "Gaming", "Educación", "Mascotas"];

const beneficios = [
    {
        icon: DollarSign,
        title: "Gestión de Acuerdos",
        description: "Visualiza tus términos y cumple tus entregables sin complicaciones. Todo organizado en un solo lugar."
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
        title: "Acuerdos Digitales",
        description: "Mantén tus términos de colaboración claros y organizados. Tú creas, nosotros ordenamos.",
    },
    {
        icon: TrendingUp,
        title: "Crece como Creador",
        description: "Analytics, recursos y capacitaciones exclusivas para llevar tu contenido al siguiente nivel."
    },
    {
        icon: Camera,
        title: "Construye tu Portafolio",
        description: "Trabaja con marcas reconocidas y construye un portafolio que abra muchas más puertas."
    }
];

const comoFunciona = [
    {
        step: "01",
        title: "Crea tu perfil en minutos",
        description: "Regístrate gratis. Conecta tu Instagram o TikTok y muestra tu estilo único al mundo.",
        icon: Camera,
        color: "from-primary/20 to-primary/5"
    },
    {
        step: "02",
        title: "La IA trabaja para ti",
        description: "Nuestro algoritmo analiza tu perfil y te sugiere campañas perfectas para tu nicho y audiencia.",
        icon: Sparkles,
        color: "from-accent/20 to-accent/5"
    },
    {
        step: "03",
        title: "Crea, entrega y cobra",
        description: "Entrega tu contenido, recibe aprobación y finaliza tu colaboración. Así de simple.",
        icon: CheckCircle2,
        color: "from-success/20 to-success/5"
    }
];

const testimonials = [
    {
        quote: "Antes tardaba semanas buscando marcas. Ahora RELA Collab me manda oportunidades que encajan perfecto. ¡Ya completé 5 colaboraciones exitosas!",
        name: "Valentina M.",
        handle: "@valentina.crea",
        followers: "45K seguidores",
        niche: "Lifestyle",
        initials: "VM",
        gradient: "from-primary to-accent"
    },
    {
        quote: "Lo que más me gusta es la transparencia. Sé exactamente los términos antes de cerrar cada campaña. No más sorpresas ni regateos.",
        name: "Carlos R.",
        handle: "@carlostech.do",
        followers: "22K seguidores",
        niche: "Tech & Food",
        initials: "CR",
        gradient: "from-accent to-primary"
    },
    {
        quote: "En solo 2 meses ya trabajé con 3 marcas increíbles. La plataforma es super intuitiva y el soporte responde rápido.",
        name: "María J.",
        handle: "@mariajfit",
        followers: "68K seguidores",
        niche: "Fitness",
        initials: "MJ",
        gradient: "from-success to-primary"
    }
];

const requisitos = [
    "Cuenta activa en Instagram o TikTok",
    "Mínimo 1,000 seguidores",
    "Contenido original y auténtico",
    "Disponibilidad para cumplir campañas a tiempo",
    "Pasión por crear y colaborar con marcas"
];

const faqs = [
    {
        q: "¿Es gratis para los creadores?",
        a: "Sí, 100% gratis para los creadores. Nunca te cobraremos por registrarte ni por aplicar a campañas. RELA Collab cobra una comisión a las marcas, no a ti."
    },
    {
        q: "¿Cuántos seguidores necesito para aplicar?",
        a: "Mínimo 1,000 seguidores en Instagram o TikTok. Valoramos más la calidad del contenido y el engagement que el número de seguidores. ¡Creadores pequeños también califican!"
    },
    {
        q: "¿Cómo se manejan los pagos?",
        a: "Los pagos se acuerdan directamente dentro de la plataforma. La marca deposita el monto acordado y tú lo recibes una vez aprobado tu contenido. Todo es transparente desde el inicio."
    },
    {
        q: "¿Qué tipo de contenido puedo crear?",
        a: "UGC (User Generated Content): videos para TikTok, Reels de Instagram, fotos de producto, unboxings, reviews, etc. Las marcas especifican el formato que necesitan en cada campaña."
    },
    {
        q: "¿Cuánto tiempo tarda la aprobación?",
        a: "Revisamos tu solicitud en menos de 24 horas hábiles. Te notificamos por correo electrónico una vez que tu perfil esté activo y listo para aplicar a campañas."
    },
    {
        q: "¿Puedo trabajar con varias marcas al mismo tiempo?",
        a: "¡Sí! Puedes aplicar a múltiples campañas simultáneamente. Tú controlas tu carga de trabajo y seleccionas las oportunidades que mejor se adaptan a tu calendario y estilo de contenido."
    },
];

function FaqSection() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <section className="py-28 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="grid md:grid-cols-[1fr_1.6fr] gap-12 items-start">
                    {/* Left heading */}
                    <div className="md:sticky md:top-32">
                        <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">Preguntas frecuentes</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">¿Tienes dudas?</h2>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            Aquí respondemos las preguntas más comunes. Si tienes alguna otra, escríbenos directo desde el chat.
                        </p>
                        <Link to="/login">
                            <Button variant="outline" className="gap-2 rounded-xl">
                                Crear cuenta gratis
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Right accordion */}
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className={`glass-card overflow-hidden transition-all duration-200 ${open === i ? "border-primary/30" : "border-border/50 hover:border-primary/20"}`}
                            >
                                <button
                                    onClick={() => setOpen(open === i ? null : i)}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                                >
                                    <span className="font-semibold text-sm sm:text-base">{faq.q}</span>
                                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open === i ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                        {open === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open === i && (
                                        <motion.div
                                            key="answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                        >
                                            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Apply() {

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Header />

            {/* ===== HERO ===== */}
            <section ref={heroRef} className="relative min-h-[92vh] flex flex-col items-center justify-center pt-20 pb-10 px-4 overflow-hidden">
                {/* Dark gradient background overlay */}
                <div className="absolute inset-0 bg-gradient-dark opacity-[0.97]" />

                {/* Mesh orbs */}
                <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary/25 blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/20 blur-[120px]" />
                    <div className="absolute top-[40%] left-[-5%] w-[300px] h-[300px] rounded-full bg-primary/15 blur-[100px]" />
                </motion.div>

                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
                />

                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="relative z-10 container mx-auto max-w-5xl text-center space-y-8"
                >
                    {/* Eyebrow pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/80 tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                            Creadores fundadores · Cupos limitados
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-tight text-white"
                    >
                        Tu contenido{" "}
                        <span className="gradient-text">vale dinero.</span>
                        <br />
                        Empieza a cobrarlo.
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed"
                    >
                        La primera plataforma de UGC de RD que conecta creadores como tú con las mejores marcas del país. Gratis, en minutos, sin complicaciones.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
                    >
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-10 gap-2 group rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]">
                                Empezar gratis ahora
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <a href="#como-funciona">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg px-10 gap-2 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm">
                                <Play className="w-4 h-4 fill-current" />
                                Ver cómo funciona
                            </Button>
                        </a>
                    </motion.div>

                    {/* Trust signals */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm text-white/40"
                    >
                        Sin costo · Sin tarjeta de crédito · Aprobación en menos de 24h
                    </motion.p>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto border-t border-white/10"
                    >
                        {[
                            { value: "$0", label: "Para creadores" },
                            { value: "Top", label: "Marcas aliadas" },
                            { value: "100%", label: "Transparencia" },
                            { value: "IA", label: "Match inteligente" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.07 }}
                                className="text-center"
                            >
                                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                                <div className="text-xs text-white/50">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll hint */}
                <motion.a
                    href="#como-funciona"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors"
                >
                    <span className="text-xs tracking-widest uppercase">Descubre más</span>
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                </motion.a>
            </section>

            {/* ===== NICHES MARQUEE ===== */}
            <div className="py-5 bg-primary/5 border-y border-primary/10 overflow-hidden">
                <div className="flex gap-4 whitespace-nowrap animate-marquee">
                    {[...niches, ...niches, ...niches].map((niche, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />{niche}
                        </span>
                    ))}
                </div>
            </div>

            {/* ===== CÓMO FUNCIONA ===== */}
            <section id="como-funciona" className="py-28 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">Proceso simple</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">3 pasos para monetizar</h2>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                            Desde que te registras hasta tu primer pago, así de rápido.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector line desktop */}
                        <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-success/30" />

                        {comoFunciona.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15, duration: 0.5 }}
                                className="relative"
                            >
                                <div className="glass-card p-8 h-full flex flex-col hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                                    {/* Step number bubble */}
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 border border-primary/10`}>
                                        <item.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="text-5xl font-bold text-primary/10 mb-2">{item.step}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="container mx-auto max-w-6xl relative">
                    <div className="text-center mb-14 space-y-3">
                        <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">Creadores reales</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">Lo que dicen los creadores</h2>
                        <p className="text-lg text-muted-foreground">Historias reales de quienes ya monetizan con RELA Collab</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, index) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.12, duration: 0.5 }}
                                className="glass-card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
                            >
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed italic flex-1">"{t.quote}"</p>
                                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{t.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Instagram className="w-3 h-3" /> {t.followers} · {t.niche}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== BENEFICIOS ===== */}
            <section className="py-28 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">Por qué elegirnos</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">Todo lo que necesitas para triunfar</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Construimos la plataforma definitiva para creadores que quieren monetizar sin complicaciones
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {beneficios.map((b, index) => (
                            <motion.div
                                key={b.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.07, duration: 0.5 }}
                                className="glass-card p-6 group hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                    <b.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== REQUISITOS ===== */}
            <section className="py-24 px-4 bg-muted/30">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">¿Califico?</Badge>
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                                ¿Qué necesitas para unirte?
                            </h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                Buscamos creadores auténticos de cualquier nicho: food, lifestyle, belleza, tecnología, fitness y más. Si tienes audiencia y pasión, tienes un lugar aquí.
                            </p>
                            <ul className="space-y-3.5">
                                {requisitos.map((req, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.07 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium">{req}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <Link to="/login" className="inline-block mt-8">
                                <Button size="lg" className="h-13 px-8 gap-2 group rounded-2xl">
                                    Aplicar ahora — Es gratis
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            {/* Large feature card */}
                            <div className="glass-card p-8 border-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-bold">Tu perfil de creador</div>
                                            <div className="text-xs text-muted-foreground">Así verán tu perfil las marcas</div>
                                        </div>
                                    </div>
                                    {/* Mock profile stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {[
                                            { label: "Alcance", value: "45K" },
                                            { label: "Engagement", value: "7.2%" },
                                            { label: "Nicho match", value: "98%" },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
                                                <div className="text-xl font-bold gradient-text">{stat.value}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Match badge */}
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold">3 marcas te buscan ahora</div>
                                            <div className="text-xs text-muted-foreground">Coinciden con tu perfil de creatividad</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                                    </div>
                                </div>
                            </div>

                            {/* Floating badge */}
                            <div className="absolute -bottom-4 -left-4 bg-card border border-border shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                                <span className="text-sm font-medium">Aprobación en &lt;24h</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== MARCAS ===== */}
            <TrustedBrands />

            {/* ===== FAQ ===== */}
            <FaqSection />

            {/* ===== FINAL CTA ===== */}
            <section className="py-28 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-dark opacity-[0.97]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-accent/15 rounded-full blur-[100px]" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="container mx-auto max-w-4xl text-center space-y-8 relative z-10"
                >
                    <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 tracking-wider">
                            <Users className="w-3.5 h-3.5" />
                            Comunidad de creadores dominicanos
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05]">
                        ¿Listo para que tu{" "}
                        <span className="gradient-text">contenido trabaje</span>{" "}
                        por ti?
                    </h2>

                    <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        Únete a creadores que ya monetizan su contenido con marcas que los valoran. Es gratis y toma menos de 3 minutos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-12 gap-2 group rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]">
                                Crear mi cuenta gratis
                                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-white/40">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Sin tarjeta de crédito
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Aprobación en 24h
                        </span>
                        <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" /> 100% seguro
                        </span>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border bg-muted/20">
                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2025 RELA Collab. Todos los derechos reservados.</p>
                    <div className="flex gap-4">
                        <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link to="/terminos-y-condiciones" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
