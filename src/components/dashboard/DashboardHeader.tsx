import { useState, ReactNode } from "react";
import { Bell, Search, X, LogOut, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(user?.displayName);

  const getSearchLinks = () => {
    const links = [];
    if (role === "creator") {
      links.push({ title: "Mi Perfil (TikTok/Instagram)", path: "/creator/profile", keywords: ["perfil", "profile", "tiktok", "instagram", "social", "redes"] });
      links.push({ title: "Oportunidades", path: "/creator/opportunities", keywords: ["oportunidades", "campaigns", "campañas", "opportunities", "buscar"] });
      links.push({ title: "Mi Contenido", path: "/creator/content", keywords: ["contenido", "content", "mis videos", "posts", "entregables"] });
      links.push({ title: "Ganancias", path: "/creator/earnings", keywords: ["ganancias", "earnings", "dinero", "pagos", "payments", "facturacion"] });
      links.push({ title: "Configuración", path: "/creator/settings", keywords: ["configuracion", "ajustes", "settings"] });
      links.push({ title: "Análisis IA", path: "/creator/analytics", keywords: ["ia", "analytics", "analiticas", "ai", "stats", "estadisticas"] });
    } else if (role === "brand") {
      links.push({ title: "Mi Perfil", path: "/brand/settings", keywords: ["perfil", "profile", "empresa", "brand"] });
      links.push({ title: "Campañas", path: "/brand/campaigns", keywords: ["campañas", "campaigns", "mis campañas"] });
      links.push({ title: "Creadores (Matches)", path: "/brand/matches", keywords: ["creadores", "matches", "buscar", "find", "influencers"] });
      links.push({ title: "Librería de Contenido", path: "/brand/content", keywords: ["contenido", "library", "videos", "posts", "entregables"] });
      links.push({ title: "Analíticas", path: "/brand/analytics", keywords: ["analiticas", "analytics", "stats", "ia", "ai", "estadisticas"] });
      links.push({ title: "Pagos y Facturación", path: "/brand/payments", keywords: ["pagos", "facturacion", "billing", "payments", "suscripcion", "subscription"] });
      links.push({ title: "Configuración", path: "/brand/settings", keywords: ["configuracion", "ajustes", "settings"] });
    } else if (role === "admin") {
      links.push({ title: "Marcas", path: "/admin/brands", keywords: ["marcas", "brands", "empresas"] });
      links.push({ title: "Creadores", path: "/admin/creators", keywords: ["creadores", "creators", "influencers"] });
      links.push({ title: "Campañas", path: "/admin/campaigns", keywords: ["campañas", "campaigns"] });
      links.push({ title: "Finanzas", path: "/admin/finance", keywords: ["finanzas", "finance", "pagos", "facturacion"] });
    }

    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return links.filter(link =>
      link.title.toLowerCase().includes(query) ||
      link.keywords.some(k => k.toLowerCase().includes(query))
    );
  };

  const searchResults = getSearchLinks();

  const notifications = [
    { id: 1, message: "New campaign match found!", time: "2 min ago" },
    { id: 2, message: "Content approved by Sunrise Cafe", time: "1 hour ago" },
    { id: 3, message: "Payment of $350 received", time: "3 hours ago" },
  ];

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleDismissNotification = (id: number) => {
    toast.success("Notification dismissed");
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="w-full md:w-auto flex items-center justify-end gap-2 order-2 md:order-1">
          {children}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto order-1 md:order-2">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar (ej. tiktok, pagos)..."
              className="pl-10 w-full md:w-64 bg-card border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-elevated z-50 overflow-hidden glass-card">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors text-sm flex items-center justify-between group"
                        onClick={() => navigate(result.path)}
                      >
                        <span>{result.title}</span>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Ir ↗</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleNotificationClick}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 glass-card p-4 z-50 shadow-elevated">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => handleDismissNotification(notif.id)}
                    >
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 mt-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || "Usuario"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={async () => { await logout(); navigate("/login"); }}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}