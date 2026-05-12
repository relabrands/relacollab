import { Polar } from "@polar-sh/sdk";

// ─── Cliente Polar ────────────────────────────────────────────────────────────
// El access token viene de las variables de entorno (VITE_ = disponible en cliente)
const isSandbox = import.meta.env.VITE_POLAR_ENV === "sandbox";

export const polar = new Polar({
  accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN as string,
  server: isSandbox ? "sandbox" : "production",
});

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type PlanKey = "starter" | "growth" | "pro";

export interface Plan {
  productId: string;
  name: string;
  price: number;
  /** Monthly price (same as price) */
  priceMonthly: number;
  /** Annual price per month (10% off) */
  priceAnnual: number;
  /** Annual billing total */
  annualTotal: number;
  priceLabel: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

// ─── Definición de planes ─────────────────────────────────────────────────────
export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    productId: import.meta.env.VITE_POLAR_PRODUCT_ID_STARTER as string,
    name: "Starter",
    price: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    annualTotal: 0,
    priceLabel: "Gratis",
    description: "Para marcas que están empezando a explorar el UGC.",
    features: [
      "1 marca",
      "1 campaña activa",
      "3 matches por IA",
      "Dashboard básico",
      "Soporte por email",
    ],
    cta: "Comenzar gratis",
    highlighted: false,
  },
  growth: {
    productId: import.meta.env.VITE_POLAR_PRODUCT_ID_GROWTH as string,
    name: "Growth",
    price: 89,
    priceMonthly: 89,
    priceAnnual: 80.10,
    annualTotal: 961.20,
    priceLabel: "$89/mes",
    description: "Para marcas con campañas recurrentes y equipos en crecimiento.",
    features: [
      "Hasta 5 marcas",
      "3 campañas activas",
      "10 matches por campaña",
      "Dashboard + reportes",
      "Soporte prioritario",
      "Biblioteca de contenido",
    ],
    cta: "Suscribirse",
    highlighted: true,
  },
  pro: {
    productId: import.meta.env.VITE_POLAR_PRODUCT_ID_PRO as string,
    name: "Pro",
    price: 249,
    priceMonthly: 249,
    priceAnnual: 224.10,
    annualTotal: 2689.20,
    priceLabel: "$249/mes",
    description: "Para agencias y marcas con alto volumen de campañas.",
    features: [
      "Marcas ilimitadas",
      "Campañas ilimitadas",
      "Matches ilimitados por IA",
      "Acceso API",
      "White label",
      "Account manager dedicado",
    ],
    cta: "Suscribirse",
    highlighted: false,
  },
};
