import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export function ContentExamples() {
    const video1Ref = useRef<HTMLVideoElement>(null);
    const video2Ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (video1Ref.current) video1Ref.current.play().catch(() => { });
        if (video2Ref.current) video2Ref.current.play().catch(() => { });
    }, []);

    return (
        <section className="py-24 bg-muted/30 relative overflow-hidden">
            <div className="container px-4 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                    {/* Images / Mockups Column */}
                    <div className="relative h-[450px] sm:h-[600px] flex justify-center lg:justify-start items-center scale-90 sm:scale-100 origin-center lg:origin-left mt-8 lg:mt-0">
                        {/* Background blob for style */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] lg:w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-3xl -z-10" />

                        {/* Phone 1 - static div handles rotation, motion.div is the clipping container */}
                        <div className="absolute left-[-10%] sm:left-[5%] lg:left-[10%] z-10 -rotate-[5deg]">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7 }}
                                className="relative w-[220px] sm:w-64 h-[380px] sm:h-[450px] rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                            >
                                <video
                                    ref={video1Ref}
                                    src="https://relabrands.com/wp-content/uploads/2026/02/video2.mp4"
                                    className="w-full h-full object-cover opacity-90"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload nofullscreen noremoteplayback"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm z-10">
                                    <span className="text-red-500">❤️</span> 14.2K Alcance
                                </div>
                                <div className="absolute top-12 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm z-10">
                                    <span className="text-gray-500">💬</span> 45 comentarios
                                </div>
                            </motion.div>
                        </div>

                        {/* Phone 2 - static div handles rotation, motion.div is the clipping container */}
                        <div className="absolute right-[-10%] sm:right-[5%] lg:right-[10%] top-12 lg:top-20 z-0 rotate-[5deg]">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="relative w-[220px] sm:w-64 h-[380px] sm:h-[450px] rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                            >
                                <video
                                    ref={video2Ref}
                                    src="https://relabrands.com/wp-content/uploads/2026/02/video1.mp4"
                                    className="w-full h-full object-cover opacity-90"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload nofullscreen noremoteplayback"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm z-10">
                                    <span className="text-red-500">❤️</span> 18.5K Alcance
                                </div>
                                <div className="absolute top-12 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm z-10">
                                    <span className="text-gray-500">💬</span> 34 comentarios
                                </div>
                            </motion.div>
                        </div>

                    </div>

                    {/* Text Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Creadores reales, resultados reales
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                            El 82% de las personas prueban un lugar nuevo porque lo vieron en redes sociales.
                        </h2>

                        <p className="text-xl text-muted-foreground">
                            Con TikTok y Reels convirtiéndose en motores de búsqueda, tu próximo cliente
                            te está buscando mucho antes de abrir Google.
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <div className="p-4 rounded-xl border border-border bg-background shadow-sm text-center">
                                <div className="text-3xl font-bold text-primary mb-1">+200%</div>
                                <div className="text-sm font-medium text-muted-foreground">Vistas orgánicas</div>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-background shadow-sm text-center">
                                <div className="text-3xl font-bold text-success mb-1">-55%</div>
                                <div className="text-sm font-medium text-muted-foreground">Costo de contenido</div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
