import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Login = () => {
    const [role, setRole] = useState<UserRole>("brand");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { loginWithEmail, registerWithEmail, updateRole, logout, user, role: userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && userRole) {
            navigate(`/${userRole}`);
        }
    }, [user, userRole, navigate]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const finalRole = await loginWithEmail(email, password);
            if (finalRole) {
                navigate(`/${finalRole}`);
            } else {
                toast.error("Tu cuenta no tiene un rol asignado. Contacta a soporte.");
            }
        } catch (error) {
            toast.error("Credenciales inválidas");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            toast.error("Selecciona un rol");
            return;
        }
        setIsLoggingIn(true);
        try {
            const finalRole = await registerWithEmail(email, password, name, role);
            if (finalRole) {
                navigate(`/${finalRole}`);
            } else {
                navigate("/");
            }
        } catch (error) {
            toast.error("Error al registrarse. El correo podría estar en uso.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRoleUpdate = async () => {
        if (!role) {
            toast.error("Selecciona un rol para continuar");
            return;
        }
        setIsLoggingIn(true);
        try {
            const updatedRole = await updateRole(role);
            if (updatedRole) {
                toast.success("Perfil actualizado correctamente");
                navigate(`/${updatedRole}`);
            }
        } catch (error) {
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // ── Role assignment screen ────────────────────────────────────────────────
    if (user && !userRole && !isLoggingIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                {/* Subtle orb */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm relative z-10"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Link to="/" className="flex items-center justify-center mb-8">
                        <img
                            src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
                            alt="RELA Collab"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>
                    </div>

                    <div className="bg-background border border-border rounded-2xl p-8 shadow-sm space-y-5">
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold">Completa tu perfil</h1>
                            <p className="text-sm text-muted-foreground">
                                Selecciona tu rol para continuar.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Soy un...</label>
                            <Select value={role || ""} onValueChange={(val) => setRole(val as UserRole)}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Selecciona tu rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Marca (Brand)</SelectItem>
                                    <SelectItem value="creator">Creador (Creator)</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleRoleUpdate} className="w-full h-11" disabled={isLoggingIn}>
                            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar y Continuar
                        </Button>
                        <Button variant="ghost" onClick={() => logout()} className="w-full h-11 text-muted-foreground">
                            Cerrar Sesión
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main login / register screen ──────────────────────────────────────────
    return (
        <div className="min-h-screen flex bg-background">

            {/* ── LEFT PANEL — branding (hidden on mobile) ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col bg-foreground text-background p-12 relative overflow-hidden">
                {/* Subtle texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/90" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent" />
                <div className="absolute top-1/3 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                    {/* Logo + back link */}
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center">
                            <img
                                src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
                                alt="RELA Collab"
                                className="h-8 w-auto object-contain brightness-0 invert"
                            />
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center gap-1.5 text-sm text-background/50 hover:text-background/80 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver al inicio
                        </Link>
                    </div>

                    {/* Main copy */}
                    <div className="space-y-6 max-w-sm">
                        <p className="text-3xl xl:text-4xl font-bold leading-tight text-background/95">
                            El marketplace de UGC más inteligente de República Dominicana.
                        </p>
                        <ul className="space-y-3">
                            {[
                                "Matching con IA en segundos",
                                "Pagos garantizados por contrato",
                                "Miles de creadores verificados",
                                "Analíticas en tiempo real",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-background/70">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bottom quote */}
                    <div className="border-t border-background/10 pt-6">
                        <p className="text-sm italic text-background/50 leading-relaxed">
                            "Lanzamos tres campañas y vimos una mejora de 3× en engagement. La calidad de los creadores es impresionante."
                        </p>
                        <p className="text-xs text-background/40 mt-2 font-medium">Carlos Reyes — Director de Marketing</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — form ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative">
                {/* Subtle orb */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Mobile header */}
                <div className="flex lg:hidden flex-col items-center text-center px-6 pt-6 pb-8 w-full">
                    <Link to="/" className="flex items-center gap-2 mb-3">
                        <img
                            src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
                            alt="RELA Collab"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>
                    <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
                        El marketplace de UGC más inteligente de República Dominicana.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm relative z-10"
                >
                    <Tabs defaultValue="login" className="w-full">
                        {/* Header changes with tab */}
                        <TabsContent value="login" className="mt-0">
                            <div className="mb-6 space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</h1>
                                <p className="text-sm text-muted-foreground">Entra con tu cuenta de RELA Collab</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="register" className="mt-0">
                            <div className="mb-6 space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
                                <p className="text-sm text-muted-foreground">Únete gratis en menos de 3 minutos</p>
                            </div>
                        </TabsContent>

                        {/* Tab switcher */}
                        <TabsList className="grid w-full grid-cols-2 mb-6 h-10 bg-muted/60 rounded-xl p-0.5">
                            <TabsTrigger value="login" className="rounded-[10px] text-sm font-medium">Iniciar sesión</TabsTrigger>
                            <TabsTrigger value="register" className="rounded-[10px] text-sm font-medium">Registrarse</TabsTrigger>
                        </TabsList>

                        {/* LOGIN */}
                        <TabsContent value="login">
                            <form onSubmit={handleEmailLogin} className="space-y-3">
                                <Input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <Button type="submit" className="w-full h-11 mt-1" disabled={isLoggingIn}>
                                    {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Entrar
                                </Button>
                            </form>
                        </TabsContent>

                        {/* REGISTER */}
                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-3">
                                <Input
                                    placeholder="Nombre completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <Input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Soy un...</label>
                                    <Select value={role || ""} onValueChange={(val) => setRole(val as UserRole)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Selecciona tu rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="brand">Marca (Brand)</SelectItem>
                                            <SelectItem value="creator">Creador (Creator)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full h-11 mt-1" disabled={isLoggingIn}>
                                    {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear cuenta gratis
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Footer */}
                    <p className="text-xs text-center text-muted-foreground/60 mt-8 leading-relaxed">
                        Al continuar, aceptas los{" "}
                        <Link to="/terminos-y-condiciones" className="underline underline-offset-2 hover:text-foreground transition-colors">
                            Términos de Uso
                        </Link>{" "}
                        y la{" "}
                        <Link to="/politica-de-privacidad" className="underline underline-offset-2 hover:text-foreground transition-colors">
                            Política de Privacidad
                        </Link>
                        .
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
