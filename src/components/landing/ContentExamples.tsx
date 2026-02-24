import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="container px-4 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                {/* Images / Mockups Column */}
                <div className="relative h-[450px] sm:h-[600px] flex justify-center lg:justify-start items-center scale-90 sm:scale-100 origin-center lg:origin-left mt-8 lg:mt-0">
                    {/* Background blob for style */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] lg:w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-3xl -z-10" />

                    <motion.div
                        initial={{ opacity: 0, x: -30, rotate: -5 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -5 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="absolute left-[-10%] sm:left-[5%] lg:left-[10%] z-10 w-[220px] sm:w-64 rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                    >
                        {/* Replace placeholder with actual Reel/TikTok Image/Video */}
                        <video
                            ref={video1Ref}
                            src="https://relabrands.com/wp-content/uploads/2026/02/video2.mp4"
                            className="w-full h-[380px] sm:h-[450px] object-cover opacity-90"
                            autoPlay
                            loop
                            muted
                            playsInline
                            disablePictureInPicture
                            controlsList="nodownload nofullscreen noremoteplayback"
                        />
                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
                            <span className="text-red-500">❤️</span> 14.2K Reach
                        </div>
                        <div className="absolute top-12 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
                            <span className="text-gray-500">💬</span> 45 comments
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30, rotate: 5 }}
                        whileInView={{ opacity: 1, x: 0, rotate: 5 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="absolute right-[-10%] sm:right-[5%] lg:right-[10%] top-12 lg:top-20 z-0 w-[220px] sm:w-64 rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl bg-black"
                    >
                        <video
                            ref={video2Ref}
                            src="https://relabrands.com/wp-content/uploads/2026/02/video1.mp4"
                            className="w-full h-[380px] sm:h-[450px] object-cover opacity-90"
                            autoPlay
                            loop
                            muted
                            playsInline
                            disablePictureInPicture
                            controlsList="nodownload nofullscreen noremoteplayback"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
                            <span className="text-red-500">❤️</span> 18.5K Reach
                        </div>
                        <div className="absolute top-12 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
                            <span className="text-gray-500">💬</span> 34 comments
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
                        Real creators, real results
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                        82% of people try a new place because they saw it on social media.
                    </h2>

                    <p className="text-xl text-muted-foreground">
                        With TikTok and Reels becoming search engines, your next customer
                        is looking for you long before they open Google.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-6">
                        <div className="p-4 rounded-xl border border-border bg-background shadow-sm text-center">
                            <div className="text-3xl font-bold text-primary mb-1">+200%</div>
                            <div className="text-sm font-medium text-muted-foreground">Organic views</div>
                        </div>
                        <div className="p-4 rounded-xl border border-border bg-background shadow-sm text-center">
                            <div className="text-3xl font-bold text-success mb-1">-55%</div>
                            <div className="text-sm font-medium text-muted-foreground">Content costs</div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    </section>
);
}
