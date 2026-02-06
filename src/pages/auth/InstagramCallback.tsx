import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function InstagramCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [status, setStatus] = useState("Initializing session...");
    const hasCalled = useRef(false);

    useEffect(() => {
        // 1. Wait for Auth Loading to complete
        if (loading) {
            setStatus("Verifying session...");
            return;
        }

        // 2. Prevent Double Execution
        if (hasCalled.current) return;

        const code = searchParams.get("code");

        // 3. Validation
        if (!code) {
            hasCalled.current = true;
            setStatus("Error: No authorization code received.");
            toast.error("No authorization code received.");
            return;
        }

        if (!user) {
            hasCalled.current = true;
            setStatus("Error: You must be logged in to connect Instagram.");
            // Optional: Redirect to login with state?
            // For now, staying on page to show error as requested by error handling constraint
            return;
        }

        // 4. Execution
        const exchangeCode = async () => {
            hasCalled.current = true;
            try {
                setStatus("Linking Instagram account...");
                console.log("Exchanging code for token...");

                // Get fresh ID token
                const token = await user.getIdToken();

                const response = await axios.post(
                    "https://us-central1-rella-collab.cloudfunctions.net/auth",
                    {
                        code: code,
                        userId: user.uid
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setStatus("Success! Redirecting...");
                    toast.success("Instagram connected successfully!");
                    // Success redirect
                    navigate("/creator/profile");
                } else {
                    console.error("Backend error:", response.data);
                    const errorMsg = response.data.error || "Unknown error";
                    setStatus("Failed to connect: " + errorMsg);
                    // Error redirect with param
                    navigate(`/creator/profile?error=${encodeURIComponent(errorMsg)}`);
                }
            } catch (error: any) {
                console.error("Exchange error:", error);
                const errorMessage = error.response?.data?.error || error.message;
                setStatus(`Error connecting to Instagram: ${errorMessage}`);
                // Error redirect with param
                navigate(`/creator/profile?error=${encodeURIComponent(errorMessage)}`);
            }
        };

        exchangeCode();

    }, [searchParams, navigate, user, loading]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-semibold text-foreground">{status}</h2>
            <p className="text-muted-foreground">Please do not close this window.</p>
        </div>
    );
}
