import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Users, CheckCircle, Inbox, DollarSign, Star, Phone } from "lucide-react";

const brandSteps = [
  {
    icon: FileText,
    title: "Create Your Campaign Brief",
    description: "Define your goals, target audience, budget, and brand vibe. Our smart form guides you through every detail.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "AI Finds Your Best Matches",
    description: "Our AI cross-references your brief against thousands of creator profiles. You receive a curated shortlist ranked by match score.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Invite & Collaborate",
    description: "Review match scores and creator portfolios, send proposals, and start the collaboration right inside the platform.",
    color: "success",
  },
  {
    icon: CheckCircle,
    title: "Approve Content & Pay",
    description: "Review submitted UGC, request revisions if needed, approve content, and release payment — all in one click.",
    color: "primary",
  },
];

const creatorSteps = [
  {
    icon: Phone,
    title: "Build Your Creator Profile",
    description: "Connect your TikTok or Instagram, select your content categories, and let your audience data speak for itself.",
    color: "accent",
  },
  {
    icon: Inbox,
    title: "Discover Matched Opportunities",
    description: "Browse campaigns ranked by how well they align with your niche, style, and audience. Every opportunity is scored for you.",
    color: "primary",
  },
  {
    icon: Star,
    title: "Apply or Get Invited",
    description: "Apply to campaigns you love, or receive direct invitations from brands that have already chosen you as their ideal match.",
    color: "success",
  },
  {
    icon: DollarSign,
    title: "Create, Submit & Get Paid",
    description: "Submit your content link, wait for brand approval, and receive your payment securely — no invoices, no chasing.",
    color: "primary",
  },
];

export function HowItWorks() {
  const [activeView, setActiveView] = useState<"brand" | "creator">("brand");
  const steps = activeView === "brand" ? brandSteps : creatorSteps;

  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A simple, powerful flow — whether you're a brand or a creator.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-muted border border-border">
            <Button
              variant={activeView === "brand" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("brand")}
              className="px-6"
            >
              I'm a Brand
            </Button>
            <Button
              variant={activeView === "creator" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("creator")}
              className="px-6"
            >
              I'm a Creator
            </Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="text-center p-4">
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${step.color === "primary"
                      ? "bg-gradient-primary"
                      : step.color === "accent"
                        ? "bg-gradient-accent"
                        : "bg-gradient-success"
                    }`}
                >
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Step {index + 1}</div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}