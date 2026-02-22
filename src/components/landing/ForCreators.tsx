import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, DollarSign, Star, TrendingUp, Inbox, Award } from "lucide-react";

const creatorBenefits = [
    {
        icon: Inbox,
        title: "Opportunities Come to You",
        description: "No more cold pitching or chasing brands. Get matched with campaigns that fit your content style and audience naturally.",
    },
    {
        icon: DollarSign,
        title: "Real, Transparent Pay",
        description: "Know exactly what you'll earn before you apply. Paid campaigns, product exchanges, or both — you get to choose what works for you.",
    },
    {
        icon: Zap,
        title: "AI-Matched, Not Randomly Assigned",
        description: "Our AI scores your profile against each campaign. Only high-fit opportunities land in your feed, so every application counts.",
    },
    {
        icon: TrendingUp,
        title: "Grow Your Creator Business",
        description: "Build a track record with verified campaign wins, accumulate reviews, and unlock higher-paying brand deals over time.",
    },
    {
        icon: Star,
        title: "Showcase Your Best Work",
        description: "Your content library lives on your creator profile, making it easy for brands to discover and fall in love with your style.",
    },
    {
        icon: Award,
        title: "Protected Payments — Always",
        description: "Brands fund campaigns before you even start creating. No chasing invoices. No ghosting. Your earnings are always secured.",
    },
];

export function ForCreators() {
    return (
        <section className="py-24 bg-gradient-to-br from-accent/5 via-background to-background" id="for-creators">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            For Creators
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Turn Your Content Into{" "}
                            <span className="gradient-text">Consistent Income</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Stop struggling to find brand deals. RELA Collab connects you with companies that actually match your niche, audience, and creative style.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {creatorBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="glass-card p-6 hover-lift group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <benefit.icon className="w-6 h-6 text-accent-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Banner */}
                    <motion.div
                        className="glass-card p-8 md:p-12 bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Ready to Work with Your Dream Brands?
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Apply in minutes. Get matched instantly. Start creating for brands that value your audience.
                        </p>
                        <Link to="/login">
                            <Button variant="glass" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                Join as a Creator
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
