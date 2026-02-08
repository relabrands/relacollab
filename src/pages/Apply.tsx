import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    TrendingUp,
    Users,
    Zap,
    Shield,
    Award,
    DollarSign,
    Camera,
    Target,
    CheckCircle2,
    ArrowRight,
    Instagram,
    Star
} from "lucide-react";
import { motion } from "framer-motion";

export default function Apply() {
    const benefits = [
        {
            icon: DollarSign,
            title: "Get Paid for Your Content",
            description: "Earn competitive rates for authentic content that brands love. You set your worth, we help you get it."
        },
        {
            icon: Target,
            title: "AI-Powered Matching",
            description: "Our smart algorithm connects you with brands that perfectly align with your style and audience."
        },
        {
            icon: Zap,
            title: "Instant Opportunities",
            description: "Access hundreds of campaigns daily. Apply with one click and start creating within hours."
        },
        {
            icon: Shield,
            title: "Secure & Protected",
            description: "Guaranteed payments, contract protection, and dedicated support. Focus on creating, we handle the rest."
        },
        {
            icon: Award,
            title: "Build Your Portfolio",
            description: "Showcase your best work and build lasting relationships with world-class brands."
        },
        {
            icon: TrendingUp,
            title: "Grow Your Influence",
            description: "Access exclusive training, analytics, and resources to level up your creator game."
        }
    ];

    const stats = [
        { value: "10K+", label: "Active Creators" },
        { value: "500+", label: "Brand Partners" },
        { value: "$2M+", label: "Paid to Creators" },
        { value: "98%", label: "Satisfaction Rate" }
    ];

    const howItWorks = [
        {
            step: "01",
            title: "Create Your Profile",
            description: "Sign up in minutes. Connect your social accounts and showcase your unique style.",
            icon: Camera
        },
        {
            step: "02",
            title: "Get Matched",
            description: "Our AI finds campaigns that fit your vibe, audience, and content style perfectly.",
            icon: Sparkles
        },
        {
            step: "03",
            title: "Create & Earn",
            description: "Submit your content, get approved, and receive payment. It's that simple.",
            icon: CheckCircle2
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">RELA Collab</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Sign In</Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="hero" size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />

                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center space-y-6"
                    >
                        <Badge className="px-4 py-1.5 text-sm font-medium">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Join 10,000+ Creators Earning Daily
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            Turn Your Content Into
                            <br />
                            <span className="text-gradient">Consistent Income</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            The smartest UGC marketplace powered by AI. Connect with top brands, create authentic content, and get paid for what you love doing.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/login">
                                <Button variant="hero" size="lg" className="text-lg px-8 h-14 group">
                                    Start Earning Today
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                                See How It Works
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-4xl mx-auto">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Simple Process</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            From signup to your first payment in three simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {howItWorks.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                            >
                                <Card className="relative overflow-hidden h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="p-8">
                                        <div className="absolute top-0 right-0 text-9xl font-bold text-primary/5">
                                            {item.step}
                                        </div>
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                                                <item.icon className="w-7 h-7 text-primary-foreground" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Why Choose Us</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We've built the ultimate platform for creators who want to monetize their content without the hassle
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                            <benefit.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl text-center">
                    <Badge className="mb-6">Trusted by Creators Worldwide</Badge>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Join the Creator Economy Revolution
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                        From micro-influencers to established content creators, thousands trust RELA Collab to grow their business and secure consistent income through authentic brand partnerships.
                    </p>

                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>

                    <p className="text-sm text-muted-foreground mb-12">
                        Rated 4.9/5 from 2,500+ creator reviews
                    </p>

                    <div className="glass-card p-8 md:p-12">
                        <Instagram className="w-12 h-12 text-primary mx-auto mb-6" />
                        <p className="text-lg md:text-xl italic mb-6 text-muted-foreground leading-relaxed">
                            "RELA Collab changed my life. I went from struggling to find brand deals to having a consistent stream of opportunities that actually match my content style. The AI matching is scary accurate!"
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-primary" />
                            <div className="text-left">
                                <div className="font-bold">Sarah Martinez</div>
                                <div className="text-sm text-muted-foreground">Content Creator, 125K followers</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <Card className="glass-card border-primary/20 overflow-hidden">
                        <CardContent className="p-12 text-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent -z-10" />

                            <Users className="w-16 h-16 text-primary mx-auto mb-6" />
                            <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                Ready to Start Earning?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join thousands of creators who are already making money doing what they love. It's free to join and takes less than 3 minutes.
                            </p>

                            <Link to="/login">
                                <Button variant="hero" size="lg" className="text-lg px-12 h-14 group">
                                    Create Your Free Account
                                    <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                                </Button>
                            </Link>

                            <p className="text-sm text-muted-foreground mt-6">
                                No credit card required • Start earning in 24 hours • Cancel anytime
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border">
                <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
                    <p>&copy; 2024 RELA Collab. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
