import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function OnboardingLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 border-b bg-white flex items-center justify-center px-4">
                <div className="flex items-center">
                    <img
                        src="https://relabrands.com/wp-content/uploads/2026/03/R_V2_colormorado-scaled.png"
                        alt="RELA Collab"
                        className="h-8 w-auto object-contain"
                    />
                </div>
            </header>
            <main className="flex-1 container max-w-2xl mx-auto py-12 px-4">
                <Outlet />
            </main>
        </div>
    );
}
