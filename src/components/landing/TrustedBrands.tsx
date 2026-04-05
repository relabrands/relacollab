import { motion } from "framer-motion";

const brands = [
    { name: "Ontol", logo: "https://relabrands.com/wp-content/uploads/2026/02/ontol.png" },
    { name: "Pilexil", logo: "https://relabrands.com/wp-content/uploads/2026/02/pilexil.png" },
    { name: "Secalia", logo: "https://relabrands.com/wp-content/uploads/2026/02/secalia.png" },
    { name: "Thrombocid", logo: "https://relabrands.com/wp-content/uploads/2026/02/thrombocid.png" },
];

export function TrustedBrands() {
    return (
        <section className="py-12 bg-background border-y border-border/40 overflow-hidden">
            <div className="container px-4">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground/60 mb-8"
                >
                    Marcas que confían en nosotros
                </motion.p>

                {/* Infinite marquee */}
                <div className="relative flex overflow-hidden group">
                    <div className="animate-marquee flex gap-12 md:gap-20 items-center shrink-0 pr-12 md:pr-20 group-hover:[animation-play-state:paused]">
                        {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
                            <img
                                key={i}
                                src={brand.logo}
                                alt={brand.name}
                                className="h-7 md:h-9 w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all duration-300 shrink-0"
                            />
                        ))}
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="animate-marquee flex gap-12 md:gap-20 items-center shrink-0 pr-12 md:pr-20 group-hover:[animation-play-state:paused]">
                        {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
                            <img
                                key={`dup-${i}`}
                                src={brand.logo}
                                alt={brand.name}
                                className="h-7 md:h-9 w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all duration-300 shrink-0"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
