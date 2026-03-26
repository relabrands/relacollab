import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

export function Hero() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video1Ref.current) video1Ref.current.play().catch(() => {});
    if (video2Ref.current) video2Ref.current.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      {/* Subtle gradient orb — top right only */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

      <div className="container relative z-10 px-4 pt-28 pb-0 md:pt-32">
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-background text-xs font-medium text-muted-foreground tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Marketplace de UGC · Powered by AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <span className="block text-foreground">Donde marcas</span>
            <span className="block gradient-text">encuentran creadores</span>
            <span className="block text-foreground">perfectos.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground text-center max-w-xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            IA que analiza objetivos, audiencias y engagement para conectar marcas con el creador ideal. Sin suposiciones.
          </motion.p>

          {/* Value props — simple inline list */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.22 }}
          >
            {["Creadores verificados", "Pagos seguros", "Analíticas en tiempo real"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
          >
            <Link to="/login">
              <Button size="lg" className="h-12 px-8 text-base font-medium rounded-xl w-full sm:w-auto">
                Soy una Marca
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/apply">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl w-full sm:w-auto">
                Soy Creador de Contenido
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Video phones — hero visual */}
        <motion.div
          className="relative max-w-3xl mx-auto h-[340px] sm:h-[440px] md:h-[520px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
        >
          {/* Glow under phones */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-primary/10 rounded-full blur-2xl" />

          {/* Phone 1 — left, tilted left */}
          <div className="absolute left-1/2 -translate-x-[130%] md:-translate-x-[145%] bottom-0 -rotate-[6deg] z-10">
            <div className="relative w-[140px] sm:w-[170px] md:w-[200px] h-[245px] sm:h-[300px] md:h-[350px] rounded-[1.75rem] overflow-hidden border border-black/10 shadow-2xl bg-black">
              <video
                ref={video1Ref}
                src="https://relabrands.com/wp-content/uploads/2026/02/video2.mp4"
                className="w-full h-full object-cover opacity-95"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              />
              {/* Overlay badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                <span className="text-red-500">❤️</span> 14.2K
              </div>
            </div>
          </div>

          {/* Phone 2 — center, upright */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-20">
            <div className="relative w-[160px] sm:w-[195px] md:w-[230px] h-[285px] sm:h-[345px] md:h-[405px] rounded-[2rem] overflow-hidden border border-black/10 shadow-2xl bg-black ring-1 ring-primary/20">
              <video
                ref={video2Ref}
                src="https://relabrands.com/wp-content/uploads/2026/02/video1.mp4"
                className="w-full h-full object-cover opacity-95"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              />
              {/* Overlay badge */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                <span className="text-red-500">❤️</span> 18.5K
              </div>
            </div>
          </div>

          {/* Phone 3 — right, tilted right */}
          <div className="absolute left-1/2 translate-x-[30%] md:translate-x-[45%] bottom-0 rotate-[6deg] z-10">
            <div className="relative w-[140px] sm:w-[170px] md:w-[200px] h-[245px] sm:h-[300px] md:h-[350px] rounded-[1.75rem] overflow-hidden border border-black/10 shadow-2xl bg-black">
              <video
                src="https://relabrands.com/wp-content/uploads/2026/02/video2.mp4"
                className="w-full h-full object-cover opacity-95 scale-x-[-1]"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                💬 45
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}