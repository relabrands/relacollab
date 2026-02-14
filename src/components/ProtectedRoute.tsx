
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    // Check onboarding status
    // Skip this check if we are already on an onboarding page (to avoid infinite loop)
    // We'll rely on the path not being checked here, or pass a prop 'isOnboarding' logic

    // Actually, simplifying: 
    // ProtectedRoute is wrapping Dashboard routes. 
    // So if user tries to access Dashboard and onboarding is NOT complete, redirect to onboarding.

    const { user, role, loading, onboardingCompleted, status } = useAuth();
    // ... loading check ...

    // We assume ProtectedRoute is ONLY used for post-login content (Dashboards)
    // We need to make sure we don't block the Onboarding routes themselves if we were to wrap them (but we won't wrap them with the same strictness or we'll allow an exception)


    if (loading) {
        // ... existing loader ...
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If onboarding is not completed, and the user is allowed (meaning they are logged in), redirect to onboarding
    // IMPORTANT: This component should NOT wrap the Onboarding routes themselves, or it will loop.
    if (!onboardingCompleted && role !== 'admin') {
        // Admin might skip onboarding or have different flow, for now let's assume brand/creator need it
        if (role === 'brand') return <Navigate to="/onboarding/brand" replace />;
        if (role === 'creator') return <Navigate to="/onboarding/creator" replace />;
    }

    // Check for pending approval status
    // Redirect to pending approval page if status is pending AND we are not already there (handled by route itself usually, but good to be safe)
    if (status === 'pending' && role !== 'admin') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (allowedRoles) {
        if (!role || !allowedRoles.includes(role)) {
            // User authorized but wrong role or no role assigned yet
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
