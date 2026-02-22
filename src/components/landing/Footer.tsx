import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-sidebar text-sidebar-foreground">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://relabrands.com/wp-content/uploads/2026/02/Favicon-1.jpg"
              alt="RELA Collab Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-xl text-sidebar-foreground">RELA Collab</span>
          </Link>

          <div className="flex flex-wrap items-center gap-6 text-sm text-sidebar-foreground/70">
            <Link to="/" className="hover:text-sidebar-foreground transition-colors">
              Home
            </Link>
            <Link to="/brand" className="hover:text-sidebar-foreground transition-colors">
              For Brands
            </Link>
            <Link to="/creator" className="hover:text-sidebar-foreground transition-colors">
              For Creators
            </Link>
            <Link to="/politica-de-privacidad" className="hover:text-sidebar-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terminos-y-condiciones" className="hover:text-sidebar-foreground transition-colors">
              Terms & Conditions
            </Link>
          </div>

          <div className="text-sm text-sidebar-foreground/50">
            © 2026 RELA Collab. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}