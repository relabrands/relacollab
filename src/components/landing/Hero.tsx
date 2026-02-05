 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { ArrowRight, Sparkles, Zap } from "lucide-react";
 import { Link } from "react-router-dom";
 
 export function Hero() {
   return (
     <section className="relative min-h-screen bg-mesh overflow-hidden">
       {/* Floating elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <motion.div
           className="absolute top-20 left-[15%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
           animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         />
         <motion.div
           className="absolute bottom-20 right-[10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"
           animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
         />
       </div>
 
       <div className="container relative z-10 px-4 pt-32 pb-20">
         <div className="max-w-4xl mx-auto text-center">
           {/* Badge */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
               <Sparkles className="w-4 h-4" />
               AI-Powered Creator Matching
             </span>
           </motion.div>
 
           {/* Main headline */}
           <motion.h1
             className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
           >
             <span className="block">The Curated</span>
             <span className="gradient-text">UGC Marketplace</span>
           </motion.h1>
 
           {/* Subheadline */}
           <motion.p
             className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
           >
             Connect with perfect content creators through intelligent AI matching. 
             We sell the match, not the search.
           </motion.p>
 
           {/* CTA Buttons */}
           <motion.div
             className="flex flex-col sm:flex-row gap-4 justify-center items-center"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
           >
             <Link to="/brand">
               <Button variant="hero" size="xl">
                 I'm a Brand
                 <ArrowRight className="w-5 h-5" />
               </Button>
             </Link>
             <Link to="/creator">
               <Button variant="glass" size="xl">
                 I'm a Creator
                 <Zap className="w-5 h-5" />
               </Button>
             </Link>
           </motion.div>
 
           {/* Stats */}
           <motion.div
             className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.4 }}
           >
             <div className="text-center">
               <div className="text-4xl font-bold text-primary mb-2">2.5K+</div>
               <div className="text-muted-foreground text-sm">Verified Creators</div>
             </div>
             <div className="text-center">
               <div className="text-4xl font-bold text-primary mb-2">94%</div>
               <div className="text-muted-foreground text-sm">Match Accuracy</div>
             </div>
             <div className="text-center">
               <div className="text-4xl font-bold text-primary mb-2">500+</div>
               <div className="text-muted-foreground text-sm">Brands Served</div>
             </div>
           </motion.div>
         </div>
 
         {/* Feature Cards Preview */}
         <motion.div
           className="mt-20 max-w-5xl mx-auto"
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.7, delay: 0.5 }}
         >
           <div className="glass-card p-8">
             <div className="grid md:grid-cols-3 gap-6">
               <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover-lift">
                 <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                   <Sparkles className="w-6 h-6 text-primary-foreground" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">AI Matching</h3>
                 <p className="text-muted-foreground text-sm">
                   Our AI analyzes campaign goals, creator profiles, and audience data to find perfect matches.
                 </p>
               </div>
 
               <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 hover-lift">
                 <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4">
                   <Zap className="w-6 h-6 text-accent-foreground" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">Curated Network</h3>
                 <p className="text-muted-foreground text-sm">
                   Quality over quantity. Every creator is vetted for engagement quality and content excellence.
                 </p>
               </div>
 
               <div className="p-6 rounded-xl bg-gradient-to-br from-success/5 to-success/10 hover-lift">
                 <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
                 <p className="text-muted-foreground text-sm">
                   Escrow-style payments ensure funds are released only when content is approved.
                 </p>
               </div>
             </div>
           </div>
         </motion.div>
       </div>
     </section>
   );
 }