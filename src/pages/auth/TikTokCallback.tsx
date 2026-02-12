import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TikTokCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const processCallback = async () => {
            if (!user) {
                // Wait for user to be loaded
                return;
            }

            const params = new URLSearchParams(location.search);
            const code = params.get("code");
            const state = params.get("state");
            const error = params.get("error");

            // 1. Check for errors
            if (error) {
                toast.error("TikTok connection failed or was cancelled.");
                navigate("/creator/profile");
                return;
            }

            if (!code) {
                toast.error("No authorization code received.");
                navigate("/creator/profile");
                return;
            }

            // 2. Validate State (Anti-CSRF)
            const storedState = localStorage.getItem("tiktok_auth_state");
            if (state !== storedState) {
                console.error("State mismatch", { received: state, stored: storedState });
                toast.error("Security verification failed. Please try again.");
                navigate("/creator/profile");
                return;
            }
            localStorage.removeItem("tiktok_auth_state");

            // 3. Exchange Code for Token (Call Backend)
            try {
                const response = await fetch("https://authTikTok-zociz77lsq-uc.a.run.app", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        code,
                        userId: user.uid
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to exchange code");
                }

                toast.success("TikTok connected successfully!");

                // 4. Redirect to Profile
                // Passing params to trigger update (optional, since backend saves it)
                // usage in CreatorProfile is watching Firestore mainly, but we can force refresh if needed.
                navigate("/creator/profile?tiktok_connected=true");

            } catch (err: any) {
                console.error("TikTok Auth Error:", err);
                toast.error(err.message || "Failed to connect TikTok");
                navigate("/creator/profile");
            }
        };

        processCallback();
    }, [user, location, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">Connecting to TikTok...</h2>
            <p className="text-muted-foreground">Please wait while we verify your account.</p>
        </div>
    );
}
