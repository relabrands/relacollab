import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PlatformConfig {
    serviceFeePercent: number;
    adminEmail?: string;
}

export function usePlatformConfig() {
    const [config, setConfig] = useState<PlatformConfig>({
        serviceFeePercent: 10, // Default fallback
        adminEmail: "admin@relacollab.com"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "platform_config"), (docSnapshot) => {
            if (docSnapshot.exists()) {
                setConfig(docSnapshot.data() as PlatformConfig);
            } else {
                // Initialize if not exists
                setDoc(doc(db, "settings", "platform_config"), {
                    serviceFeePercent: 10,
                    adminEmail: "admin@relacollab.com"
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching platform config:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { config, loading };
}
