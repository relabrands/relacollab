import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface ProfileCompletionResult {
  completion: number;       // 0–100
  missingFields: string[];  // campos que reducen el score (obligatorios)
  optionalFields: string[]; // nice-to-have, no reducen el score
  isLoading: boolean;
}

export function useCreatorProfileCompletion(): ProfileCompletionResult {
  const { user, role } = useAuth();
  const [completion, setCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [optionalFields, setOptionalFields] = useState<string[]>([]);
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

        // ── Scoring — debe ser idéntico a CreatorDashboard.tsx ──────────
        let pct = 0;
        if (d.displayName || d.name)       pct += 5;
        if (d.bio)                          pct += 10;
        if (d.location)                     pct += 5;
        if (d.phone)                        pct += 5;
        if (d.photoURL)                     pct += 15;
        if (d.categories?.length)           pct += 10;
        if (d.contentFormats?.length)       pct += 10;
        if (d.vibes?.length)                pct += 10;
        if (d.whoAppearsInContent?.length)  pct += 10;
        if (d.experienceTime)               pct += 10;
        if (d.collaborationPreference)      pct += 10;
        // TOTAL MAX = 100. niche NO suma — no incluir aquí.

        setCompletion(Math.min(pct, 100));

        // ── Campos requeridos faltantes (los que sí reducen el score) ───
        const missing: string[] = [];
        if (!d.bio)                         missing.push("📝 Biografía");
        if (!d.location)                    missing.push("📍 Ubicación");
        if (!d.phone)                       missing.push("📞 Teléfono");
        if (!d.photoURL)                    missing.push("🧑 Foto de perfil");
        if (!d.categories?.length)          missing.push("🏷️ Categorías de contenido");
        if (!d.contentFormats?.length)      missing.push("🎥 Formatos de contenido");
        if (!d.vibes?.length)               missing.push("✨ Estilo / Vibe");
        if (!d.whoAppearsInContent?.length) missing.push("👥 Quién aparece en el contenido");
        if (!d.experienceTime)              missing.push("📅 Tiempo de experiencia");
        if (!d.collaborationPreference)     missing.push("🤝 Preferencia de colaboración");
        if (!d.instagramConnected && !d.tiktokConnected)
                                            missing.push("📱 Red social conectada (Instagram o TikTok)");

        setMissingFields(missing);

        // ── Campos opcionales (no suman al score) ───────────────────────
        const optional: string[] = [];
        if (!d.shippingAddress?.street)     optional.push("📦 Dirección de envío (para intercambios)");
        if (!d.mediaKitUrl)                 optional.push("📄 Media Kit / Portafolio (aumenta 3x tus chances de ser elegido)");
        setOptionalFields(optional);

      } catch (_) {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, role]);

  return { completion, missingFields, optionalFields, isLoading };
}
