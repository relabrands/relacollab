
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const Login = () => {
    const [role, setRole] = useState<UserRole>("brand");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { signInWithGoogle, user, role: userRole } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && userRole) {
            navigate(`/${userRole}`);
        }
    }, [user, userRole, navigate]);

    const handleLogin = async () => {
        // ... existing handleLogin logic
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">I am a (Select only if new user)...</label>
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
