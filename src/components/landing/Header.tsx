import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Cómo funciona", href: "/#how-it-works" },
  { label: "Para marcas", href: "/#brands" },
  { label: "Para creadores", href: "/apply" },
];

export function Header() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!role) return "/";
    return `/${role}`;
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/60"
          : "bg-background/70 backdrop-blur-md border-b border-transparent"
          }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container px-4 h-16 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="https://relabrands.com/wp-content/uploads/2026/02/Favicon-1.jpg"
              alt="RELA Collab Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-xl tracking-tight">RELA Collab</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-md ${location.pathname === link.href
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {user && role === "admin" && (
              <Link
                to="/admin"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            {user && role && role !== "admin" && (
              <Link
                to={`/${role}`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button size="sm" asChild className="gap-1.5">
                  <Link to="/apply">
                    <Sparkles className="w-3.5 h-3.5" />
                    Únete como creador
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <Button size="sm" asChild className="text-xs h-8 px-3">
                <Link to="/apply">Únete</Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              className="fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border shadow-xl md:hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <img
                    src="https://relabrands.com/wp-content/uploads/2026/02/Favicon-1.jpg"
                    alt="RELA"
                    className="w-7 h-7 rounded-md object-cover"
                  />
                  <span className="font-bold">RELA Collab</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link
                      to={link.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                        }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  </motion.div>
                ))}
                {user && role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                {user && role && role !== "admin" && (
                  <Link
                    to={`/${role}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                )}
              </nav>

              {/* Drawer Footer */}
              <div className="px-4 pb-8 space-y-3 border-t border-border pt-4">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button className="w-full gap-2" asChild>
                      <Link to="/apply" onClick={() => setMobileOpen(false)}>
                        <Sparkles className="w-4 h-4" />
                        Únete como creador
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}