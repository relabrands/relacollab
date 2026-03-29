import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ─── Firebase Admin ───────────────────────────────────────────────────────────
// Inicializa solo una vez (Vercel puede reutilizar el proceso entre invocaciones)
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "{}"
  ) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// ─── Helper: detectar planKey desde los metadatos del producto ────────────────
function resolvePlanKey(productId: string): "starter" | "growth" | "pro" {
  if (productId === process.env.VITE_POLAR_PRODUCT_ID_GROWTH) return "growth";
  if (productId === process.env.VITE_POLAR_PRODUCT_ID_PRO) return "pro";
  return "starter";
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "Webhook secret no configurado." });
  }

  // El body debe leerse como texto raw para validar la firma
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // Normaliza headers a Record<string,string> (Vercel puede pasar string[])
  const normalizedHeaders: Record<string, string> = Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.join(",") : (v ?? ""),
    ])
  );

  let event: ReturnType<typeof validateEvent>;

  try {
    event = validateEvent(rawBody, normalizedHeaders, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return res.status(403).json({ error: "Firma inválida." });
    }
    return res.status(400).json({ error: "Error al procesar el webhook." });
  }

  try {
    switch (event.type) {
      // ── Checkout completado ──────────────────────────────────────────────
      case "checkout.updated": {
        const checkout = event.data;
        if (checkout.status === "succeeded" && checkout.customerId && checkout.productId) {
          const planKey = resolvePlanKey(checkout.productId);
          // Busca usuario por email de checkout
          if (checkout.customerEmail) {
            const snap = await db
              .collection("users")
              .where("email", "==", checkout.customerEmail)
              .limit(1)
              .get();

            if (!snap.empty) {
              await snap.docs[0].ref.update({
                "subscription.status": "active",
                "subscription.planKey": planKey,
                "subscription.checkoutId": checkout.id,
                "subscription.updatedAt": new Date().toISOString(),
              });
            }
          }
        }
        break;
      }

      // ── Suscripción creada ───────────────────────────────────────────────
      case "subscription.created": {
        const sub = event.data;
        const planKey = resolvePlanKey(sub.productId);

        if (sub.customer?.email) {
          const snap = await db
            .collection("users")
            .where("email", "==", sub.customer.email)
            .limit(1)
            .get();

          if (!snap.empty) {
            await snap.docs[0].ref.update({
              "subscription.id": sub.id,
              "subscription.status": sub.status,
              "subscription.planKey": planKey,
              "subscription.currentPeriodEnd": sub.currentPeriodEnd ?? null,
              "subscription.updatedAt": new Date().toISOString(),
            });
          }
        }
        break;
      }

      // ── Suscripción actualizada (upgrade/downgrade) ──────────────────────
      case "subscription.updated": {
        const sub = event.data;
        const planKey = resolvePlanKey(sub.productId);

        if (sub.customer?.email) {
          const snap = await db
            .collection("users")
            .where("email", "==", sub.customer.email)
            .limit(1)
            .get();

          if (!snap.empty) {
            await snap.docs[0].ref.update({
              "subscription.id": sub.id,
              "subscription.status": sub.status,
              "subscription.planKey": planKey,
              "subscription.currentPeriodEnd": sub.currentPeriodEnd ?? null,
              "subscription.updatedAt": new Date().toISOString(),
            });
          }
        }
        break;
      }

      // ── Suscripción cancelada → regresa a Starter ────────────────────────
      case "subscription.canceled": {
        const sub = event.data;

        if (sub.customer?.email) {
          const snap = await db
            .collection("users")
            .where("email", "==", sub.customer.email)
            .limit(1)
            .get();

          if (!snap.empty) {
            await snap.docs[0].ref.update({
              "subscription.id": sub.id,
              "subscription.status": "canceled",
              "subscription.planKey": "starter",
              "subscription.currentPeriodEnd": sub.currentPeriodEnd ?? null,
              "subscription.updatedAt": new Date().toISOString(),
            });
          }
        }
        break;
      }

      default:
        // Evento no manejado — respondemos 200 igual para no generar reintentos
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: "Error interno al procesar el evento." });
  }
}
