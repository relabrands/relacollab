import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    CheckCircle2,
    Instagram,
    Plus,
    Minus,
    MessageSquare,
    TrendingUp,
    FileText,
    Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { TrustedBrands } from "@/components/landing/TrustedBrands";
import { useRef, useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const niches = [
    "Lifestyle", "Belleza", "Food & Restaurantes", "Tecnología", "Fitness",
    "Moda", "Viajes", "Gaming", "Educación", "Mascotas", "Maternidad", "Salud"
];

const steps = [
    {
        num: "1",
        icon: Instagram,
        title: "Crea tu perfil",
        body: "Regístrate en minutos. Conecta tu Instagram o TikTok y describe tu nicho. Sin CV, sin entrevista.",
        aside: "Solo necesitas tu celular y tus redes."
    },
    {
        num: "2",
        icon: TrendingUp,
        title: "Recibe campañas a tu medida",
        body: "Nuestro sistema analiza tu contenido y te muestra marcas dominicanas que encajan con lo que ya haces. Sin buscar, sin llamar.",
        aside: "Las marcas te llegan a ti."
    },
    {
        num: "3",
        icon: FileText,
        title: "Lee el contrato, crea el contenido",
        body: "Cada colaboración viene con un contrato digital claro: qué entregar, cuándo y cuánto recibes. Sin letra pequeña sorpresa.",
        aside: "Tú decides si aceptas o no."
    },
    {
        num: "4",
        icon: Banknote,
        title: "Cobra cuando se aprueba",
        body: "La marca revisa tu contenido y al aprobarlo, el pago se gestiona dentro de la plataforma. Sin perseguir a nadie.",
        aside: "Sin facturas, sin CoDi, sin incomodidad."
    }
];

const testimonials = [
    {
        quote: "Llevaba meses queriendo colaborar con marcas pero no sabía cómo acercarme. Con RELA Collab me mandaron una invitación de una marca de skincare dominicana a los 2 días de registrarme. Hice el contenido, lo aprobaron y listo. Sin drama.",
        name: "Valentina Mota",
        handle: "@valentina.crea",
        detail: "42K · Santo Domingo · Lifestyle",
        initials: "VM",
        color: "from-violet-500 to-indigo-500"
    },
    {
        quote: "Soy creador de tech y en RD las marcas de ese nicho casi no buscan creadores. RELA Collab me conectó con una empresa de telecomunicaciones para un review pagado. El contrato fue claro, los plazos también. Eso es lo que más valoro.",
        name: "Carlos Rodríguez",
        handle: "@carlostech.do",
        detail: "19K · Santiago · Tech",
        initials: "CR",
        color: "from-sky-500 to-violet-500"
    },
    {
        quote: "Pensé que con mis seguidores no iba a calificar. Tengo 4K en TikTok y la primera semana ya tenía una campaña activa con una marca de suplementos. El pago fue exactamente lo que acordamos. Sin sorpresas.",
        name: "Mariela Jiménez",
        handle: "@marielajfit",
        detail: "4.2K · Higüey · Fitness & Salud",
        initials: "MJ",
        color: "from-emerald-500 to-sky-500"
    }
];

const faqs = [
    {
        q: "¿Cuántos seguidores necesito para aplicar?",
        a: "Con 1,000 seguidores en Instagram o TikTok ya puedes aplicar. Valoramos más que tengas contenido auténtico y audiencia real que una cuenta grande con poco engagement. Si publicas con consistencia y tu nicho es claro, tienes buenas posibilidades."
    },
    {
        q: "¿Me cobran algo por estar en la plataforma?",
        a: "No. Para los creadores es completamente gratis: registrarte, explorar campañas, aplicar, comunicarte con marcas y cobrar. RELA Collab cobra una comisión a las marcas al momento de publicar una campaña, no a ti."
    },
    {
        q: "¿Cómo funciona el contrato digital?",
        a: "Cada vez que aplicas o aceptas una invitación, la plataforma genera automáticamente un contrato con los detalles: qué contenido debes entregar, en qué fechas, cuánto recibes y bajo qué condiciones. Lo lees, lo aceptas y queda firmado digitalmente. Sin papel, sin notaría."
    },
    {
        q: "¿Qué tipo de contenido me piden hacer?",
        a: "Depende de cada campaña: puede ser un Reel, una foto con el producto, un video de TikTok mostrando una experiencia en local, un unboxing, una review honesta, etc. Cada marca especifica lo que necesita. Nunca te pedimos alterar tu estilo."
    },
    {
        q: "¿Cuánto tarda la revisión de mi perfil?",
        a: "En menos de 24 horas hábiles. Cuando tu perfil esté activo, recibirás un correo de confirmación y ya puedes explorar todas las campañas disponibles."
    },
    {
        q: "¿Puedo colaborar con varias marcas al mismo tiempo?",
        a: "Sí. Puedes tener múltiples campañas activas simultáneamente, siempre que las marcas no sean competencia directa entre sí. Tú manejas tu agenda y aceptas solo lo que puedes cumplir con calidad."
    },
    {
        q: "¿Están en toda la República Dominicana?",
        a: "Sí. Trabajamos con marcas y creadores en Santo Domingo, Santiago, San Pedro de Macorís, La Romana, Higüey y más. Si la campaña es para un local específico, se indica en la descripción. Muchas campañas son digitales y no requieren visitar ningún lugar."
    }
];

// ─── Components ────────────────────────────────────────────────────────────────

function FaqItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }) {
    return (
        <div className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${isOpen ? "border-primary/30 bg-primary/[0.03]" : "border-border/60 hover:border-primary/20"}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
            >
                <span className="font-semibold text-[15px] leading-snug">{faq.q}</span>
                <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                        <p className="px-6 pb-5 text-[14px] text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                            {faq.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Apply() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Header />

            {/* ═══════════════════════════════════════════════════════
                HERO — Directo, sin rodeos, lenguaje real
            ═══════════════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative min-h-[95vh] flex flex-col items-center justify-center pt-24 pb-16 px-5 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-dark opacity-[0.97]" />
                <div className="absolute top-[-8%] left-[18%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[130px] pointer-events-none" />
                <div className="absolute bottom-[5%] right-[8%] w-[380px] h-[380px] rounded-full bg-accent/15 blur-[110px] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)", backgroundSize: "55px 55px" }} />

                <div className="relative z-10 container mx-auto max-w-4xl text-center">
                    {/* Status pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 tracking-wide"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                        Creadores fundadores · Cupos abiertos
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.08 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-bold tracking-tight leading-[1.03] text-white mb-6"
                    >
                        Tu contenido ya vale.{" "}
                        <br className="hidden sm:block" />
                        <span className="gradient-text">¿Lo estás cobrando?</span>
                    </motion.h1>

                    {/* Subhead — específico para RD */}
                    <motion.p
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.18 }}
                        className="text-lg sm:text-xl md:text-[22px] text-white/55 max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        RELA Collab conecta creadores dominicanos con marcas locales que realmente pagan por contenido auténtico. Sin intermediarios, sin barreras, sin esperar a ser descubierto.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.28 }}
                        className="flex flex-col sm:flex-row gap-3.5 justify-center"
                    >
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto h-14 text-[17px] px-10 gap-2 group rounded-2xl shadow-[0_0_32px_rgba(99,102,241,0.35)] hover:shadow-[0_0_52px_rgba(99,102,241,0.5)]">
                                Quiero aplicar — Es gratis
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <a href="#como-funciona">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-[17px] px-10 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm">
                                Ver cómo funciona
                            </Button>
                        </a>
                    </motion.div>

                    {/* Social proof text — real, no inventado */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-7 text-sm text-white/35"
                    >
                        Gratis para creadores · Sin tarjeta de crédito · Revisión en menos de 24h
                    </motion.p>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                NICHES strip
            ═══════════════════════════════════════════════════════ */}
            <div className="py-4 bg-primary/5 border-y border-primary/10 overflow-hidden">
                <div className="flex gap-3.5 whitespace-nowrap animate-marquee">
                    {[...niches, ...niches, ...niches].map((n, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block opacity-70" />{n}
                        </span>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                PROBLEM / CONTEXT — Lo que el creador siente
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 px-5">
                <div className="container mx-auto max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">El problema</p>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                                Posteas todos los días.<br />
                                Las marcas te ven.<br />
                                <span className="text-muted-foreground">Pero nadie te escribe.</span>
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                En RD hay cientos de creadores con contenido bueno y audiencias reales que no logran llegar a las marcas correctas. No porque no valgan, sino porque no existe un puente. Hasta ahora.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {[
                                "Mandas DMs a marcas y nadie responde",
                                "No sabes cuánto cobrar ni cómo acordar los términos",
                                "Haces el contenido y el pago se complica",
                                "Nadie te dice si tu perfil es lo que las marcas buscan"
                            ].map((pain, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.07 }}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50"
                                >
                                    <span className="text-lg mt-0.5">
                                        {["😤", "😕", "😮‍💨", "🤷"][i]}
                                    </span>
                                    <p className="text-sm leading-relaxed">{pain}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                CÓMO FUNCIONA — Pasos con detalle real
            ═══════════════════════════════════════════════════════ */}
            <section id="como-funciona" className="py-24 px-5 bg-muted/25">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-14">
                        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Proceso</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-3">Así funciona en la práctica</h2>
                        <p className="text-muted-foreground text-lg max-w-xl">Desde que te registras hasta que cobras, todo pasa dentro de RELA Collab.</p>
                    </div>

                    <div className="space-y-5">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.45 }}
                                className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start hover:border-primary/25 transition-colors duration-300"
                            >
                                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                                    <span className="text-5xl font-black text-primary/15 select-none w-10 text-center leading-none">{step.num}</span>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <step.icon className="w-5 h-5 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold mb-1.5">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                                </div>
                                <div className="shrink-0 hidden sm:block">
                                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium text-right whitespace-nowrap">
                                        {step.aside}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                TESTIMONIALS — Con historia real, no pitch
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 px-5">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-14">
                        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Creadores en la plataforma</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-3">Lo que le pasó a gente real</h2>
                        <p className="text-muted-foreground text-lg">Nada de promesas genéricas. Esto es lo que nos cuentan.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.handle}
                                initial={{ opacity: 0, y: 22 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.45 }}
                                className="glass-card p-6 flex flex-col gap-5 hover:-translate-y-1 transition-transform duration-300"
                            >
                                {/* Quote mark */}
                                <span className="text-4xl leading-none text-primary/30 font-serif select-none">"</span>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.quote}</p>
                                <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{t.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Instagram className="w-3 h-3" /> {t.detail}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                REQUISITOS — Sin lista genérica de bullets mágicos
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 px-5 bg-muted/25">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">¿Califico?</p>
                            <h2 className="text-4xl font-bold mb-5 leading-tight">
                                No tienes que ser<br /> un influencer famoso.
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-8">
                                Buscamos creadores con contenido auténtico, audiencia real y disposición para comprometerse con los acuerdos. Eso lo logra alguien con 2K seguidores igual que con 200K.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    ["✓", "Instagram o TikTok activo"],
                                    ["✓", "Mínimo 1,000 seguidores reales"],
                                    ["✓", "Contenido propio (no reposts)"],
                                    ["✓", "Engagement genuino, aunque sea pequeño"],
                                    ["✓", "Honradez y seriedad para cumplir plazos"],
                                ].map(([mark, text], i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{mark}</span>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/login">
                                <Button size="lg" className="h-13 px-8 gap-2 group rounded-2xl">
                                    Aplicar gratis
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>

                        {/* Feature card */}
                        <div className="glass-card p-7 border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-5">Tu contrato digital</p>

                            {/* Mock contract UI */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <span className="text-xs text-muted-foreground">Campaña</span>
                                    <span className="text-xs font-medium">Lanzamiento Verano 2025</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <span className="text-xs text-muted-foreground">Entregable</span>
                                    <span className="text-xs font-medium">1 Reel + 3 Stories</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <span className="text-xs text-muted-foreground">Plazo de entrega</span>
                                    <span className="text-xs font-medium">7 días hábiles</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/8 border border-primary/20">
                                    <span className="text-xs font-semibold text-primary">Compensación</span>
                                    <span className="text-xs font-bold text-primary">$75 USD</span>
                                </div>
                                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-xs text-muted-foreground">Firmado digitalmente · 4 abr 2025, 3:41 PM</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-5">Todos los acuerdos quedan registrados así. No hay nada que no hayas leído y aceptado.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                BRANDS
            ═══════════════════════════════════════════════════════ */}
            <TrustedBrands />

            {/* ═══════════════════════════════════════════════════════
                FAQ — Preguntas que la gente realmente hace
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 px-5">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-[1fr_1.7fr] gap-14 items-start">
                        <div className="md:sticky md:top-28">
                            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Preguntas frecuentes</p>
                            <h2 className="text-4xl font-bold leading-tight mb-4">¿Dudas antes de aplicar?</h2>
                            <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                                Aquí están las preguntas que más nos hacen. Si la tuya no está, escríbenos por el chat.
                            </p>
                            <a
                                href="https://wa.me/18297404861?text=Hola%20quiero%20más%20información"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                                    <MessageSquare className="w-4 h-4" />
                                    Hablar con el equipo
                                </Button>
                            </a>
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <FaqItem
                                        faq={faq}
                                        isOpen={openFaq === i}
                                        onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FINAL CTA — Sin exagerar, directo
            ═══════════════════════════════════════════════════════ */}
            <section className="py-28 px-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-dark opacity-[0.97]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-[350px] h-[250px] bg-accent/12 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="container mx-auto max-w-3xl text-center space-y-7 relative z-10"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-[1.05]">
                        Ya tienes el contenido.<br />
                        <span className="gradient-text">Ahora consigue las marcas.</span>
                    </h2>

                    <p className="text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
                        Únete a los creadores dominicanos que ya están colaborando con marcas reales. El registro toma menos de 3 minutos y es completamente gratis.
                    </p>

                    <div>
                        <Link to="/login">
                            <Button size="lg" className="h-14 text-[17px] px-12 gap-2 group rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]">
                                Crear mi cuenta ahora
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-white/35">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Gratis para creadores
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Contrato digital en cada campaña
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Aprobación en 24h
                        </span>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-5 border-t border-border bg-muted/20">
                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2025 RELA Collab · Hecho en República Dominicana</p>
                    <div className="flex gap-5">
                        <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link to="/terminos-y-condiciones" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
