import { polar } from "./polar";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CheckoutResult {
  url: string;
}

// ─── Función principal de checkout ───────────────────────────────────────────
/**
 * Crea una sesión de checkout en Polar.sh y retorna la URL de pago.
 * @param productId   ID del producto en Polar (desde PLANS)
 * @param customerEmail  Email del usuario autenticado
 */
export async function createCheckout(
  productId: string,
  customerEmail: string
): Promise<CheckoutResult> {
  if (!productId) {
    throw new Error("Product ID no configurado. Verifica las variables de entorno.");
  }

  const successUrl = `${window.location.origin}/success?checkout_id={CHECKOUT_ID}`;
  const cancelUrl = `${window.location.origin}/pricing`;

  try {
    const checkout = await polar.checkouts.create({
      productId,
      customerEmail,
      successUrl,
      // cancelUrl no está en el schema estándar, se maneja via metadata
    });

    if (!checkout.url) {
      throw new Error("Polar no retornó una URL de checkout.");
    }

    return { url: checkout.url };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error al crear el checkout: ${error.message}`);
    }
    throw new Error("Error desconocido al crear el checkout.");
  }
}
