import { motion } from "framer-motion";

const brands = [
    { name: "Brand 1", logo: "https://via.placeholder.com/150x60?text=Brand+1" },
    { name: "Brand 2", logo: "https://via.placeholder.com/150x60?text=Brand+2" },
    { name: "Brand 3", logo: "https://via.placeholder.com/150x60?text=Brand+3" },
    { name: "Brand 4", logo: "https://via.placeholder.com/150x60?text=Brand+4" },
    { name: "Brand 5", logo: "https://via.placeholder.com/150x60?text=Brand+5" },
    { name: "Brand 6", logo: "https://via.placeholder.com/150x60?text=Brand+6" },
    { name: "Brand 7", logo: "https://via.placeholder.com/150x60?text=Brand+7" },
    { name: "Brand 8", logo: "https://via.placeholder.com/150x60?text=Brand+8" },
];

export function TrustedBrands() {
    return (
        <section className="py-20 bg-background overflow-hidden border-y border-border/50">
            <div className="container px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        Las mejores marcas crecen con RELA Collab
                    </h2>
                </motion.div>

                {/* Infinite Carousel */}
                <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee flex space-x-12 min-w-full items-center justify-around group-hover:paused">
                        {brands.map((brand, i) => (
                            <img
                                key={i}
                                src={brand.logo}
                                alt={brand.name}
                                className="h-10 md:h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
                            />
                        ))}
                    </div>
                    {/* Duplicate for infinite effect */}
                    <div className="animate-marquee flex space-x-12 min-w-full items-center justify-around group-hover:paused absolute top-0 left-full">
                        {brands.map((brand, i) => (
                            <img
                                key={`dup-${i}`}
                                src={brand.logo}
                                alt={brand.name}
                                className="h-10 md:h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
