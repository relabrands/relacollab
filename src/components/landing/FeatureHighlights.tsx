import { motion } from "framer-motion";
import { Sparkles, BarChart3, Shield, Zap, MessageSquare, Clock } from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "AI Match Intelligence",
        description: "Our matching engine trains on thousands of campaign performance signals to surface the right creator for every brief — instantly.",
        gradient: "from-primary/20 to-primary/5",
        iconGradient: "bg-gradient-primary",
    },
    {
        icon: BarChart3,
        title: "Live Campaign Analytics",
        description: "Track every metric that matters — reach, impressions, engagement rate, link clicks — in real time across all your active campaigns.",
        gradient: "from-accent/20 to-accent/5",
        iconGradient: "bg-gradient-accent",
    },
    {
        icon: Shield,
        title: "Escrow-Protected Payments",
        description: "Brands fund campaigns upfront. Creators get paid automatically the moment their content is approved. Zero disputes, zero delays.",
        gradient: "from-success/20 to-success/5",
        iconGradient: "bg-gradient-success",
    },
    {
        icon: Zap,
        title: "Instant Creator Discovery",
        description: "Filter by niche, follower count, location, engagement rate, and platform. Identify your ideal creator in under 60 seconds.",
        gradient: "from-warning/20 to-warning/5",
        iconGradient: "bg-gradient-to-br from-warning to-orange-500",
    },
    {
        icon: MessageSquare,
        title: "Built-in Collaboration Hub",
        description: "Brief sharing, content submission, revision requests, and approvals — everything happens in-platform. No more email chaos.",
        gradient: "from-primary/15 to-accent/10",
        iconGradient: "bg-gradient-primary",
    },
    {
        icon: Clock,
        title: "Campaign Timeline Management",
        description: "Set deadlines, send automated reminders, and track deliverable status from brief to final approval with a visual campaign timeline.",
        gradient: "from-accent/15 to-success/10",
        iconGradient: "bg-gradient-accent",
    },
];

export function FeatureHighlights() {
    return (
        <section className="py-24 bg-sidebar text-sidebar-foreground" id="features">
            <div className="container px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Platform Features
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Everything You Need to{" "}
                            <span className="gradient-text">Run Great UGC</span>
                        </h2>
                        <p className="text-xl text-sidebar-foreground/70 max-w-2xl mx-auto">
                            A complete toolkit for modern creator-brand collaborations — from discovery to payment, all in one place.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-sidebar-border hover-lift group cursor-default`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.iconGradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-3 text-sidebar-foreground">{feature.title}</h3>
                                <p className="text-sidebar-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
