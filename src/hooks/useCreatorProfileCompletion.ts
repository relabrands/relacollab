import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface ProfileCompletionResult {
  completion: number;      // 0–100
  missingFields: string[]; // human-readable list of missing fields
  isLoading: boolean;
}

export function useCreatorProfileCompletion(): ProfileCompletionResult {
  const { user, role } = useAuth();
  const [completion, setCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "creator") {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const d = userDoc.data();

        // ── Scoring (mirrors CreatorDashboard.tsx) ────────────────────
        let pct = 0;
        if (d.displayName || d.name) pct += 5;
        if (d.bio)                   pct += 10;
        if (d.location)              pct += 5;
        if (d.phone)                 pct += 5;
        if (d.photoURL)              pct += 15;
        if (d.categories?.length)    pct += 10;
        if (d.contentFormats?.length) pct += 10;
        if (d.vibes?.length)         pct += 10;
        if (d.whoAppearsInContent?.length) pct += 10;
        if (d.experienceTime)        pct += 10;
        if (d.collaborationPreference) pct += 10;

        setCompletion(pct);

        // ── Missing fields list ────────────────────────────────────────
        const missing: string[] = [];
        if (!d.bio)                        missing.push("Biografía");
        if (!d.location)                   missing.push("Ubicación");
        if (!d.phone)                      missing.push("Teléfono");
        if (!d.photoURL)                   missing.push("Foto de perfil");
        if (!d.niche)                      missing.push("Nicho principal");
        if (!d.contentFormats?.length)     missing.push("Formatos de contenido");
        if (!d.experienceTime)             missing.push("Tiempo de experiencia");
        if (!d.collaborationPreference)    missing.push("Preferencia de colaboración");
        if (!d.instagramConnected && !d.tiktokConnected)
                                           missing.push("Red social conectada (Instagram o TikTok)");

        setMissingFields(missing);
      } catch (_) {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, role]);

  return { completion, missingFields, isLoading };
}
