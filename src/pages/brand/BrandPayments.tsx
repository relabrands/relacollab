import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, History, Loader2, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside component
// Use a placeholder key if usage of env vars is not configured yet
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder_replace_me");

interface Plan {
    id: string;
    name: string;
    price: number;
    credits: number;
    stripePriceId: string;
    features: string[];
    interval: "month" | "year";
    isFree?: boolean;
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    invoiceId?: string;
}

export default function BrandPayments() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchPlans();
            fetchPayments();
            fetchUserPlan();
        }
    }, [user]);

    const fetchUserPlan = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setCurrentPlan(userDoc.data().plan || null);
            }
        } catch (error) {
            console.error("Error fetching user plan:", error);
        }
    };

    const fetchPlans = async () => {
        try {
            const q = query(collection(db, "plans"), where("active", "==", true), orderBy("price", "asc"));
            const snapshot = await getDocs(q);
            const fetchedPlans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Plan[];
            setPlans(fetchedPlans);
        } catch (error: any) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to load plans: " + (error.message || "Unknown error"));
        } finally {
            setLoadingPlans(false);
        }
    };

    const fetchPayments = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, "users", user.uid, "payments"), orderBy("created", "desc"));
            const snapshot = await getDocs(q);
            const fetchedPayments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Payment[];
            setPayments(fetchedPayments);
        } catch (error) {
            console.error("Error fetching payments history:", error);
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!user) return;
        // Check if this is a free/trial plan
        if (plan.price === 0 || plan.isFree) {
            setProcessingId(plan.id);
            try {
                // For free plans, we just update the user profile directly without Stripe
                await fetch("/api/update-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.uid, plan: plan.name })
                });

                // Usually this is done via backend, but as a fallback/mock for now if API missing:
                // Note: Real implementation should rely on the API call above.

                toast.success(`Subscribed to ${plan.name} successfully!`);
                setCurrentPlan(plan.name);
            } catch (error) {
                console.error("Error subscribing to free plan", error);
                toast.error("Failed to subscribe");
            } finally {
                setProcessingId(null);
            }
            return;
        }

        setProcessingId(plan.id);

        try {
            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe failed to load");

            // Build the absolute success/cancel URLs
            const successUrl = `${window.location.origin}/brand/payments?success=true`;
            const cancelUrl = `${window.location.origin}/brand/payments?canceled=true`;

            // Call your Cloud Function
            // Note: Replace with your actual deployed function URL or use relative path if using rewrites
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId: plan.stripePriceId,
                    userId: user.uid,
                    successUrl,
                    cancelUrl,
                    mode: "subscription" // or payment depending on logic
                }),
            });

            const session = await response.json();

            if (session.error) {
                throw new Error(session.error);
            }

            const result = await stripe.redirectToCheckout({
                sessionId: session.sessionId,
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error: any) {
            console.error("Subscription error:", error);
            toast.error(error.message || "Failed to start checkout");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Payments" subtitle="Manage your subscription and billing" />

                {/* Plans Section */}
                <div className="mb-10">
                    <h3 className="text-xl font-semibold mb-4">Subscription Plans</h3>
                    {loadingPlans ? (
                        <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>
                    ) : plans.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground border-dashed">
                            No plans available at the moment.
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map(plan => {
                                const isCurrentPlan = currentPlan === plan.name;

                                return (
                                    <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all ${isCurrentPlan ? 'border-primary shadow-md bg-primary/5' : 'hover:shadow-lg hover:border-primary/50'}`}>
                                        {isCurrentPlan && (
                                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                                CURRENT PLAN
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <CardDescription>{plan.interval === "year" ? "Yearly" : "Monthly"} billing</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="mb-4">
                                                <span className="text-4xl font-bold">${plan.price}</span>
                                                <span className="text-muted-foreground">/{plan.interval === "year" ? "yr" : "mo"}</span>
                                            </div>
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-primary text-xs">⚡</span>
                                                    </div>
                                                    {plan.credits} Credits / month
                                                </div>
                                                {plan.features?.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button
                                                className="w-full"
                                                variant={isCurrentPlan ? "outline" : (processingId === plan.id ? "secondary" : "default")}
                                                onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                                                disabled={!!processingId || isCurrentPlan}
                                            >
                                                {processingId === plan.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : isCurrentPlan ? (
                                                    "Current Plan"
                                                ) : plan.isFree || plan.price === 0 ? (
                                                    "Start for Free"
                                                ) : (
                                                    "Subscribe"
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Payment History */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Payment History</h3>
                    <Card>
                        <CardContent className="p-0">
                            {loadingPayments ? (
                                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : payments.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No payment history found.</div>
                            ) : (
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                                                            {payment.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {(payment.amount).toLocaleString('en-US', { style: 'currency', currency: payment.currency.toUpperCase() })}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {new Date(payment.created).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}
