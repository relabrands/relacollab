import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InstagramCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState("Connecting with Instagram...");

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            setStatus("Error: No authorization code received.");
            toast.error("No authorization code received.");
            return;
        }

        if (!user) {
            // Ideally prompt login, but for now just show error
            setStatus("Error: You must be logged in to connect Instagram.");
            return;
        }

        const exchangeCode = async () => {
            try {
                console.log("Exchanging code for token...");
                const response = await axios.post("/api/auth/instagram/exchange", {
                    code: code,
                    userId: user.uid // Pass userId to backend to save it securely
                });

                if (response.data.success) {
                    // Backend saved the data.
                    // Or if backend returns data, save it here. 
                    // Based on user request "Si el backend responde OK (token guardado)", backend saves it.
                    // However, to be safe and consistent with previous frontend logic, 
                    // I'll assume backend simply returns the token/data and WE save it, OR backend saves it.
                    // Let's implement robustly: assume backend returns data, we verify/update UI.

                    // If backend saved it:
                    setStatus("Success! Redirecting...");
                    toast.success("Instagram connected successfully!");
                    navigate("/creator/profile");
                } else {
                    console.error("Backend error:", response.data);
                    setStatus("Failed to connect: " + (response.data.error || "Unknown error"));
                    toast.error("Failed to connect Instagram.");
                }
            } catch (error: any) {
                console.error("Exchange error:", error);
                setStatus("Error connecting to Instagram.");
                toast.error("Failed to exchange token: " + (error.response?.data?.error || error.message));
            }
        };

        // Prevent double-firing in Strict Mode if possible, or just let it handle idempotency
        exchangeCode();

    }, [searchParams, navigate, user]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-semibold text-foreground">{status}</h2>
            <p className="text-muted-foreground">Please do not close this window.</p>
        </div>
    );
}
