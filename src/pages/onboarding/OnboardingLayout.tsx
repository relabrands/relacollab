import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function OnboardingLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 border-b bg-white flex items-center justify-center px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl">RELA Collab</span>
                </div>
            </header>
            <main className="flex-1 container max-w-2xl mx-auto py-12 px-4">
                <Outlet />
            </main>
        </div>
    );
}
