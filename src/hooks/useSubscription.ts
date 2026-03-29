import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { PlanKey } from "@/lib/polar";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface SubscriptionState {
  plan: PlanKey;
  isActive: boolean;
  loading: boolean;
  error: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Observa el estado de suscripción del usuario actual en Firestore.
 * El campo `subscription` es actualizado por el webhook de Polar.
 */
export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "starter",
    isActive: false,
    loading: true,
    error: null,
    subscriptionId: null,
    currentPeriodEnd: null,
  });

  useEffect(() => {
    if (!user) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // Escucha en tiempo real el documento del usuario en Firestore
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setState({
            plan: "starter",
            isActive: false,
            loading: false,
            error: null,
            subscriptionId: null,
            currentPeriodEnd: null,
          });
          return;
        }

        const data = snapshot.data();
        const subscription = data?.subscription;

        if (!subscription || subscription.status !== "active") {
          // Sin suscripción activa en Polar → el usuario está en Starter (gratis)
          // Starter siempre se considera "activo" porque no requiere pago.
          // El gate se mostrará solo si el campo `hasChosenPlan` es false/ausente.
          const hasChosenPlan = data?.hasChosenPlan === true;
          setState({
            plan: "starter",
            isActive: hasChosenPlan,   // true si ya eligió su plan (aunque sea Starter)
            loading: false,
            error: null,
            subscriptionId: subscription?.id ?? null,
            currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
          });
          return;
        }

        // Normaliza el plan desde el metadata guardado por el webhook
        const planKey = (subscription.planKey ?? "starter") as PlanKey;

        setState({
          plan: planKey,
          isActive: true,
          loading: false,
          error: null,
          subscriptionId: subscription.id ?? null,
          currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: `Error al cargar suscripción: ${err.message}`,
        }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  return state;
}
