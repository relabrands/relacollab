import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSubscription } from "@/hooks/useSubscription";

export interface PlanLimits {
  maxBrands: number;
  maxActiveCampaigns: number;   // -1 = ilimitado
  maxTotalCampaigns: number;
  maxMatchesPerCampaign: number;
  maxMonthlyApplications: number;
  aiMatchEnabled: boolean;
  analyticsEnabled: boolean;
  contentLibraryEnabled: boolean;
  exportEnabled: boolean;
  prioritySupportEnabled: boolean;
  teamMembersEnabled: boolean;
}

// Límites por defecto en caso de que Firestore no tenga el doc aún
export const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  starter: {
    maxBrands: 1,
    maxActiveCampaigns: 1,
    maxTotalCampaigns: 3,
    maxMatchesPerCampaign: 5,
    maxMonthlyApplications: 10,
    aiMatchEnabled: false,
    analyticsEnabled: false,
    contentLibraryEnabled: false,
    exportEnabled: false,
    prioritySupportEnabled: false,
    teamMembersEnabled: false,
  },
  growth: {
    maxBrands: 5,
    maxActiveCampaigns: 5,
    maxTotalCampaigns: 20,
    maxMatchesPerCampaign: 25,
    maxMonthlyApplications: 100,
    aiMatchEnabled: true,
    analyticsEnabled: true,
    contentLibraryEnabled: true,
    exportEnabled: false,
    prioritySupportEnabled: false,
    teamMembersEnabled: false,
  },
  pro: {
    maxBrands: -1,
    maxActiveCampaigns: -1,
    maxTotalCampaigns: -1,
    maxMatchesPerCampaign: -1,
    maxMonthlyApplications: -1,
    aiMatchEnabled: true,
    analyticsEnabled: true,
    contentLibraryEnabled: true,
    exportEnabled: true,
    prioritySupportEnabled: true,
    teamMembersEnabled: true,
  },
};

/** Siembra los límites por defecto en Firestore si no existen */
export async function seedDefaultLimits() {
  for (const [planKey, limits] of Object.entries(DEFAULT_LIMITS)) {
    const ref = doc(db, "planLimits", planKey);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, limits);
    }
  }
}

export function usePlanLimits() {
  const { plan } = useSubscription();
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.starter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "planLimits", plan);
    setLoading(true);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLimits(snap.data() as PlanLimits);
      } else {
        // Sin doc en Firestore → usa defaults
        setLimits(DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.starter);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [plan]);

  /** true si el valor está dentro del límite (o el límite es -1 = ilimitado) */
  const isWithinLimit = (current: number, max: number) =>
    max === -1 || current < max;

  /** Devuelve el plan recomendado para superar un límite */
  const recommendedUpgrade = (): "growth" | "pro" => {
    if (plan === "starter") return "growth";
    return "pro";
  };

  return {
    limits,
    loading,
    isWithinLimit,
    recommendedUpgrade,
  };
}
