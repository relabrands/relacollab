import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function ContentExamples() {
    return (
        <section className="py-24 bg-muted/30 relative overflow-hidden">
            <div className="container px-4 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Images / Mockups Column */}
                    <div className="relative h-[600px] flex justify-center lg:justify-start items-center">
                        {/* Background blob for style */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-3xl -z-10" />

                        <motion.div
                            initial={{ opacity: 0, x: -50, rotate: -5 }}
                            whileInView={{ opacity: 1, x: 0, rotate: -5 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="absolute left-[10%] z-10 w-64 rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                        >
                            {/* Replace placeholder with actual Reel/TikTok Image */}
                            <img
                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"
                                alt="Food Example 1"
                                className="w-full h-[450px] object-cover opacity-80"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm">
                                <span className="text-red-500">❤️</span> 8.2K likes
                            </div>
                            <div className="absolute top-12 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm">
                                <span className="text-gray-500">💬</span> 78 comments
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50, rotate: 5 }}
                            whileInView={{ opacity: 1, x: 0, rotate: 5 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="absolute right-[10%] top-20 z-0 w-64 rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop"
                                alt="Food Example 2"
                                className="w-full h-[450px] object-cover opacity-80"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm">
                                <span className="text-red-500">❤️</span> 12.5K likes
                            </div>
                            <div className="absolute top-12 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm">
                                <span className="text-gray-500">💬</span> 103 comments
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </motion.div>

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
                            El 82% de las personas prueban un nuevo lugar porque lo vieron en redes sociales.
                        </h2>

                        <p className="text-xl text-muted-foreground">
                            Con TikTok y los Reels convirtiéndose en motores de búsqueda, tu próximo cliente
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
