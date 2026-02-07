import { useEffect, useState, useRef } from "react";
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
                    setStatus("Calculating advanced analytics...");
                    const { access_token: accessToken } = response.data.data;

                    // --- CLIENT-SIDE METRIC CALCULATION ---
                    try {
                        // 1. Fetch Media
                        const mediaRes = await axios.get(
                            `https://graph.instagram.com/me/media?fields=id,like_count,comments_count,media_type,media_product_type,timestamp&limit=50&access_token=${accessToken}`
                        );
                        const mediaItems = mediaRes.data.data || [];

                        let totalLikes = 0;
                        let totalComments = 0;
                        mediaItems.forEach((item: any) => {
                            totalLikes += (item.like_count || 0);
                            totalComments += (item.comments_count || 0);
                        });

                        const avgLikes = mediaItems.length > 0 ? Math.round(totalLikes / mediaItems.length) : 0;
                        const avgComments = mediaItems.length > 0 ? Math.round(totalComments / mediaItems.length) : 0;

                        // 2. Fetch Video/Reel Views (Plays)
                        // Filter for videos/reels
                        const videoItems = mediaItems.filter((i: any) => i.media_type === 'VIDEO' || i.media_product_type === 'REELS').slice(0, 10);

                        let avgViews = 0;
                        if (videoItems.length > 0) {
                            const insightPromises = videoItems.map((item: any) =>
                                axios.get(`https://graph.instagram.com/${item.id}/insights?metric=plays&access_token=${accessToken}`)
                                    .then(res => res.data.data[0].values[0].value)
                                    .catch(err => 0)
                            );
                            const plays = await Promise.all(insightPromises);
                            const validPlays = plays.filter(p => p > 0);
                            if (validPlays.length > 0) {
                                const totalPlays = validPlays.reduce((a, b) => a + b, 0);
                                avgViews = Math.round(totalPlays / validPlays.length);
                            }
                        }

                        // 3. Update Firestore
                        await updateDoc(doc(db, "users", user.uid), {
                            "instagramMetrics.avgLikes": avgLikes,
                            "instagramMetrics.avgComments": avgComments,
                            "instagramMetrics.avgViews": avgViews,
                            "instagramMetrics.lastUpdated": new Date().toISOString()
                        });
                        console.log("Calculated metrics:", { avgLikes, avgComments, avgViews });

                    } catch (metricError) {
                        console.error("Error calculating metrics:", metricError);
                        // Continue even if metrics fail
                    }

                    setStatus("Success! Redirecting...");
                    toast.success("Instagram connected & analyzed!");
                    // Force refresh to ensure AuthContext updates with new Firestore data
                    window.location.href = "/creator/profile";
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
