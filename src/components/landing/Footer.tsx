 import { Link } from "react-router-dom";
 import { Sparkles } from "lucide-react";
 
 export function Footer() {
   return (
     <footer className="py-12 bg-sidebar text-sidebar-foreground">
       <div className="container px-4">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <Link to="/" className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
               <Sparkles className="w-5 h-5 text-primary-foreground" />
             </div>
             <span className="font-bold text-xl text-sidebar-foreground">RELA Collab</span>
           </Link>
 
           <div className="flex items-center gap-8 text-sm text-sidebar-foreground/70">
             <Link to="/" className="hover:text-sidebar-foreground transition-colors">
               Home
             </Link>
             <Link to="/brand" className="hover:text-sidebar-foreground transition-colors">
               For Brands
             </Link>
             <Link to="/creator" className="hover:text-sidebar-foreground transition-colors">
               For Creators
             </Link>
           </div>
 
           <div className="text-sm text-sidebar-foreground/50">
             © 2024 RELA Collab. All rights reserved.
           </div>
         </div>
       </div>
     </footer>
   );
 }