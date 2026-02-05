import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const [role, setRole] = useState<UserRole>("brand");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { signInWithGoogle, loginWithEmail, registerWithEmail, user, role: userRole } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && userRole) {
            navigate(`/${userRole}`);
        }
    }, [user, userRole, navigate]);

    const handleGoogleLogin = async () => {
        if (!role) return;
        setIsLoggingIn(true);
        try {
            const finalRole = await signInWithGoogle(role);
            if (finalRole) {
                navigate(`/${finalRole}`);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Error al iniciar sesión con Google");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const finalRole = await loginWithEmail(email, password);
            if (finalRole) {
                navigate(`/${finalRole}`);
            } else {
                navigate('/');
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
                navigate('/');
            }
        } catch (error) {
            toast.error("Error al registrarse. El correo podría estar en uso.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
                    <CardDescription>Accede a tu cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                            <TabsTrigger value="register">Registrarse</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                                    {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Entrar
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Nombre completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                    <Input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Soy un...</label>
                                        <Select value={role || ""} onValueChange={(val) => setRole(val as UserRole)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona tu rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="brand">Marca (Brand)</SelectItem>
                                                <SelectItem value="creator">Creador (Creator)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                                    {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Registrarse
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            type="button"
                            className="w-full mt-4"
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                        >
                            Google
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
