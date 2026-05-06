import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">

      {/* ── API Partners Trust Band ── */}
      <div className="border-t border-sidebar-foreground/10 py-6">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50 uppercase tracking-widest font-semibold">
              <ShieldCheck className="w-4 h-4 text-sidebar-foreground/40" />
              Conexiones seguras a través de APIs oficiales
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8">

              {/* Meta */}
              <div className="flex items-center gap-3 bg-sidebar-foreground/5 border border-sidebar-foreground/10 rounded-xl px-5 py-3 hover:bg-sidebar-foreground/10 transition-colors">
                {/* Meta wordmark SVG */}
                <svg viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto opacity-80">
                  <path d="M7.2 5.6C3.22 5.6 0 9.52 0 14.8c0 4.16 1.96 7.2 4.96 7.2 1.68 0 2.92-.72 4.44-2.76l.2.28c1.44 2.08 2.56 2.48 3.88 2.48 1.6 0 2.76-.92 3.56-2.24l.4.6c1.12 1.64 2.36 1.64 3.16 1.64 3.72 0 6.4-3.44 6.4-8.56 0-4.72-2.44-7.84-6.04-7.84-2.08 0-3.64.96-5.12 3.28-.88-2.04-2.2-3.28-4.64-3.28zm.24 2.72c1.64 0 2.6 1.2 3.48 3.92-.92 1.6-1.6 2.24-2.56 2.24-1.44 0-2.32-1.48-2.32-3.84 0-1.52.6-2.32 1.4-2.32zm12.12.24c1.72 0 2.72 1.68 2.72 4.64 0 3.12-.96 4.88-2.6 4.88-.84 0-1.56-.56-2.44-1.96.72-1.56 1.04-3.04 1.04-4.76 0-1.04-.12-1.96-.32-2.52.4-.16.8-.28 1.6-.28zm-6.36 2c.12.72.2 1.48.2 2.28 0 1.24-.2 2.36-.56 3.32-.56-1.32-.96-2.76-.96-4.32 0-.52.04-1 .12-1.44.44.04.84.08 1.2.16z" fill="white" fillOpacity="0.85"/>
                  <text x="26" y="17" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="700" fill="white" fillOpacity="0.85">Meta</text>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-sidebar-foreground/70 leading-none">Official API</div>
                  <div className="text-[9px] text-sidebar-foreground/40 leading-none mt-0.5">Instagram · Facebook</div>
                </div>
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-3 bg-sidebar-foreground/5 border border-sidebar-foreground/10 rounded-xl px-5 py-3 hover:bg-sidebar-foreground/10 transition-colors">
                {/* TikTok logo */}
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" fill="white" fillOpacity="0.85"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-sidebar-foreground/70 leading-none">Official API</div>
                  <div className="text-[9px] text-sidebar-foreground/40 leading-none mt-0.5">TikTok for Business</div>
                </div>
              </div>

            </div>

            <p className="text-[10px] text-sidebar-foreground/35 text-center max-w-md leading-relaxed">
              Las conexiones de cuentas de Instagram y TikTok se realizan únicamente a través de las APIs oficiales de Meta y TikTok for Business, garantizando la seguridad y privacidad de tus datos.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="border-t border-sidebar-foreground/10 py-10">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center">
              <img
                src="https://relabrands.com/wp-content/uploads/2026/03/Logo-Blanco-icono-color.png"
                alt="RELA Collab"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <div className="flex flex-wrap items-center gap-6 text-sm text-sidebar-foreground/70">
              <Link to="/" className="hover:text-sidebar-foreground transition-colors">
                Inicio
              </Link>
              <Link to="/business" className="hover:text-sidebar-foreground transition-colors">
                Para Marcas
              </Link>
              <Link to="/apply" className="hover:text-sidebar-foreground transition-colors">
                Para Creadores
              </Link>
              <Link to="/politica-de-privacidad" className="hover:text-sidebar-foreground transition-colors">
                Política de Privacidad
              </Link>
              <Link to="/terminos-y-condiciones" className="hover:text-sidebar-foreground transition-colors">
                Términos y Condiciones
              </Link>
            </div>

            <div className="text-sm text-sidebar-foreground/50">
              © 2026 RELA Collab. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}