 import { motion } from "framer-motion";
 import { FileText, Sparkles, Users, CheckCircle } from "lucide-react";
 
 const steps = [
   {
     icon: FileText,
     title: "Create Your Brief",
     description: "Define your campaign goals, target audience, and brand vibe.",
     color: "primary",
   },
   {
     icon: Sparkles,
     title: "AI Finds Matches",
     description: "Our AI analyzes creator profiles and recommends the best fits.",
     color: "accent",
   },
   {
     icon: Users,
     title: "Review & Connect",
     description: "Browse match scores, approve creators, and start collaborating.",
     color: "success",
   },
   {
     icon: CheckCircle,
     title: "Approve & Pay",
     description: "Review UGC, approve content, and release secure payments.",
     color: "primary",
   },
 ];
 
 export function HowItWorks() {
   return (
     <section className="py-24 bg-background">
       <div className="container px-4">
         <motion.div
           className="text-center mb-16"
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
         >
           <h2 className="text-4xl font-bold mb-4">How It Works</h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             From brief to content in four simple steps
           </p>
         </motion.div>
 
         <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
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
                 <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
               )}
 
               <div className="text-center">
                 <div
                   className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                     step.color === "primary"
                       ? "bg-gradient-primary"
                       : step.color === "accent"
                       ? "bg-gradient-accent"
                       : "bg-gradient-success"
                   }`}
                 >
                   <step.icon className="w-7 h-7 text-primary-foreground" />
                 </div>
                 <div className="text-sm font-medium text-muted-foreground mb-2">Step {index + 1}</div>
                 <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                 <p className="text-muted-foreground text-sm">{step.description}</p>
               </div>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 }