import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BarChart3, Clock, ShieldCheck, Target, Users } from "lucide-react";

const brandBenefits = [
    {
        icon: Sparkles,
        title: "AI-Powered Creator Matching",
        description: "Stop sifting through hundreds of profiles. Our AI instantly finds creators whose audience, vibe, and engagement perfectly match your campaign goals.",
    },
    {
        icon: Target,
        title: "Campaigns That Actually Convert",
        description: "Set your objectives, target demographics, and brand identity — we surface creators whose followers will genuinely resonate with your products.",
    },
    {
        icon: Clock,
        title: "Launch in Hours, Not Weeks",
        description: "From campaign brief to live content in record time. Manage every deliverable, deadline, and approval in one unified dashboard.",
    },
    {
        icon: BarChart3,
        title: "Real-Time Performance Analytics",
        description: "Track views, engagement, reach, and ROI across every creator's post. Know exactly what's working so you can optimize fast.",
    },
    {
        icon: ShieldCheck,
        title: "Secure, Risk-Free Payments",
        description: "Funds are only released when you approve the content. Zero risk, full control over your UGC investment.",
    },
    {
        icon: Users,
        title: "Curated Creator Network",
        description: "Every creator on RELA Collab is verified. We vet for real engagement, quality content, and professional reliability.",
    },
];

export function ForBrands() {
    return (
        <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-background" id="for-brands">
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
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Target className="w-4 h-4" />
                            For Brands
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Find the Perfect Creator.{" "}
                            <span className="gradient-text">Every Time.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Stop gambling on influencer partnerships. RELA Collab's AI ensures every creator you work with is a genuine fit for your brand.
                        </p>
                    </motion.div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {brandBenefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="glass-card p-6 hover-lift group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Banner */}
                    <motion.div
                        className="glass-card p-8 md:p-12 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Start Your First AI-Matched Campaign Today
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Join hundreds of brands that have replaced guesswork with data-driven creator partnerships.
                        </p>
                        <Link to="/login">
                            <Button variant="hero" size="lg">
                                Get Started as a Brand
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
