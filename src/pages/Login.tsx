
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const Login = () => {
    const [role, setRole] = useState<UserRole>("brand");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
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
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Redirect if already logged in (optional check, but good for UX)
    // if (user) {
    //   const currentRole = // ... getting role from context or local state if needed for redirect
    //   // For simplicity, we trust the flow or let the user choose again if they are on /login explicitly
    // }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">I am a...</label>
                        <Select value={role || ""} onValueChange={(val) => setRole(val as UserRole)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brand">Brand</SelectItem>
                                <SelectItem value="creator">Creator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign in with Google"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
