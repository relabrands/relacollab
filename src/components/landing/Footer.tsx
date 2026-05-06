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
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/3840px-Meta_Platforms_Inc._logo.svg.png"
                  alt="Meta"
                  className="h-5 w-auto object-contain opacity-85 brightness-0 invert"
                />
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