 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { Link } from "react-router-dom";
import { Sparkles, Shield } from "lucide-react";
 
 export function Header() {
   return (
     <motion.header
       className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
     >
       <div className="container px-4 h-16 flex items-center justify-between">
         {/* Logo */}
         <Link to="/" className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
             <Sparkles className="w-5 h-5 text-primary-foreground" />
           </div>
           <span className="font-bold text-xl">RELA Collab</span>
         </Link>
 
         {/* Navigation */}
         <nav className="hidden md:flex items-center gap-8">
           <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
             Home
           </Link>
           <Link to="/brand" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
             For Brands
           </Link>
           <Link to="/creator" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
             For Creators
           </Link>
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Link>
         </nav>
 
         {/* Actions */}
         <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" asChild>
             <Link to="/brand">Sign In</Link>
           </Button>
           <Button variant="default" size="sm" asChild>
             <Link to="/brand">Get Started</Link>
           </Button>
         </div>
       </div>
     </motion.header>
   );
 }