import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
    { value: "+200%", label: "Vistas orgánicas" },
    { value: "-55%", label: "Costo de contenido" },
    { value: "82%", label: "Decisiones de compra desde redes" },
];

export function ContentExamples() {
    const video1Ref = useRef<HTMLVideoElement>(null);
    const video2Ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (video1Ref.current) video1Ref.current.play().catch(() => { });
        if (video2Ref.current) video2Ref.current.play().catch(() => { });
    }, []);

    return (
        <section className="py-20 md:py-28 bg-muted/20">
            <div className="container px-4 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Text column — first on mobile */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                        className="space-y-6 order-1 lg:order-none"
                    >
                        <span className="section-eyebrow">Contenido que convierte</span>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                            El 82% de personas prueban un lugar porque
                            {" "}<span className="gradient-text">lo vieron en redes.</span>
                        </h2>

                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                            TikTok y Reels ya son motores de búsqueda. Tu próximo cliente te está buscando ahí antes de abrir Google.
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {stats.map((s) => (
                                <div key={s.label} className="p-3 md:p-4 rounded-xl border border-border/60 bg-background text-center">
                                    <div className="text-xl md:text-2xl font-bold text-primary">{s.value}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Phones column */}
                    <div className="relative h-[320px] sm:h-[400px] md:h-[480px] flex justify-center items-end order-2 lg:order-none">
                        {/* Subtle glow */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/10 rounded-full blur-2xl" />

                        {/* Phone 1 — left */}
                        <div className="absolute left-[5%] sm:left-[8%] bottom-0 -rotate-[5deg] z-10">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="relative w-[130px] sm:w-[155px] md:w-[180px] h-[230px] sm:h-[275px] md:h-[320px] rounded-[1.75rem] overflow-hidden border border-black/10 shadow-2xl bg-black"
                            >
                                <video
                                    ref={video1Ref}
                                    src="https://relabrands.com/wp-content/uploads/2026/02/video2.mp4"
                                    className="w-full h-full object-cover"
                                    autoPlay loop muted playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload nofullscreen noremoteplayback"
                                />
                                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                                    ❤️ 14.2K
                                </div>
                            </motion.div>
                        </div>

                        {/* Phone 2 — center / right */}
                        <div className="absolute right-[5%] sm:right-[8%] top-0 rotate-[5deg] z-0">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="relative w-[130px] sm:w-[155px] md:w-[180px] h-[230px] sm:h-[275px] md:h-[320px] rounded-[1.75rem] overflow-hidden border border-black/10 shadow-2xl bg-black"
                            >
                                <video
                                    ref={video2Ref}
                                    src="https://relabrands.com/wp-content/uploads/2026/02/video1.mp4"
                                    className="w-full h-full object-cover"
                                    autoPlay loop muted playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload nofullscreen noremoteplayback"
                                />
                                <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                                    ❤️ 18.5K
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
