import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";

const goalOptions = [
  { id: "awareness", label: "Awareness", description: "Increase brand visibility" },
  { id: "conversion", label: "Conversion", description: "Drive sales or bookings" },
  { id: "content", label: "Content Production", description: "UGC for ads" },
];

const vibeOptions = [
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "premium", label: "Premium", emoji: "✨" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
];

const contentTypeOptions = [
  { id: "post", label: "Post", emoji: "📸" },
  { id: "reels", label: "Reels", emoji: "🎬" },
  { id: "stories", label: "Historias", emoji: "📱" },
  { id: "carousel", label: "Carretes", emoji: "🎠" },
];

const compensationOptions = [
  { id: "exchange", label: "Intercambio", description: "Producto, comida, servicios, etc." },
  { id: "monetary", label: "Pago Monetario", description: "Compensación en efectivo (cuesta créditos)" },
];



export default function CreateCampaign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credits, setCredits] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    vibes: [] as string[],
    contentTypes: [] as string[], // NEW: Post, Reels, Stories, Carousel
    location: "",
    ageRange: "18-35",
    compensationType: "", // NEW: exchange or monetary
    exchangeDetails: "", // NEW: What they're offering (food, product, etc.)
    creatorPayment: "", // NEW: Admin-set payment for creator (if monetary)
    creditCost: "1", // NEW: Credits cost for brand (if monetary)
    budget: "",
    startDate: "",
    endDate: "",
    creatorCount: "1",
  });

  const handleContentTypeToggle = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter((t) => t !== typeId)
        : [...prev.contentTypes, typeId],
    }));
  };

  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(prev => ({
            ...prev,
            location: userData.location || "",
            description: userData.description || "",
            brandName: userData.displayName || userData.name || ""
          }));
          setCredits(userData.credits || 0);
        }
      } catch (error) {
        console.error("Error fetching brand profile:", error);
      }
    };

    fetchBrandProfile();
  }, [user]);

  const handleVibeToggle = (vibeId: string) => {
    setFormData((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(vibeId)
        ? prev.vibes.filter((v) => v !== vibeId)
        : [...prev.vibes, vibeId],
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to create a campaign.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch brand name for consistency
      let brandName = formData.name || "";
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          brandName = userDoc.data().displayName || userDoc.data().name || brandName;
        }
      } catch (e) {
        console.warn("Could not fetch brand name:", e);
      }

      const campaignData = {
        ...formData,
        brandId: user.uid,
        brandName: brandName, // Add brand name for creator opportunity display
        status: "active",
        createdAt: new Date().toISOString(),
        budget: parseFloat(formData.budget) || 0,
        creatorCount: parseInt(formData.creatorCount) || 1,
        approvedCount: 0,
        applicationCount: 0,
      };

      await addDoc(collection(db, "campaigns"), campaignData);
      toast.success("Campaign created successfully!");
      navigate("/brand/matches");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />
      <MobileNav type="brand" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <div className="mb-6">
          <Link
            to="/brand"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <DashboardHeader
          title="Create Campaign"
          subtitle="Let's find your perfect creators"
        />

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${step >= s
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-20 md:w-32 h-1 mx-2 rounded-full transition-all ${step > s ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>Basics</span>
            <span>Goals</span>
            <span>Audience</span>
            <span>Budget</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Campaign Basics</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer Wellness Launch"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell creators about your brand and what you're looking for..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Campaign Goals</h2>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">What's your main goal?</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, goal: goal.id }))
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.goal === goal.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="font-medium mb-1">{goal.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {goal.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-4 block">Brand Vibe (select multiple)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {vibeOptions.map((vibe) => (
                        <button
                          key={vibe.id}
                          onClick={() => handleVibeToggle(vibe.id)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${formData.vibes.includes(vibe.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="text-2xl mb-1">{vibe.emoji}</div>
                          <div className="font-medium text-sm">{vibe.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Target Audience</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Los Angeles, CA"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="mb-4 block">Age Range</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {["18-24", "25-34", "35-44", "45+"].map((age) => (
                        <button
                          key={age}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, ageRange: age }))
                          }
                          className={`p-3 rounded-xl border-2 text-center font-medium transition-all ${formData.ageRange === age
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Tipo de Contenido & Compensación</h2>

                <div className="space-y-6">
                  {/* Content Types */}
                  <div>
                    <Label className="mb-4 block">¿Qué tipo de contenido necesitas? *</Label>
                    <p className="text-sm text-muted-foreground mb-3">Selecciona todos los que apliquen</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {contentTypeOptions.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleContentTypeToggle(type.id)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${formData.contentTypes.includes(type.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="text-2xl mb-1">{type.emoji}</div>
                          <div className="font-medium text-sm">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compensation Type */}
                  <div>
                    <Label className="mb-4 block">¿Qué ofreces a cambio? *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {compensationOptions.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, compensationType: comp.id }))
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.compensationType === comp.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="font-medium mb-1">{comp.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {comp.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exchange Details (if exchange selected) */}
                  {formData.compensationType === "exchange" && (
                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                      <Label htmlFor="exchangeDetails">¿Qué ofreces específicamente?</Label>
                      <Input
                        id="exchangeDetails"
                        placeholder="Ej: Comida gratis, producto valorado en $50, experiencia spa, etc."
                        value={formData.exchangeDetails}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            exchangeDetails: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Sé específico para que los creators sepan exactamente qué recibirán.
                      </p>
                    </div>
                  )}

                  {/* Monetary Details (if monetary selected) */}
                  {formData.compensationType === "monetary" && (
                    <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                      <div>
                        <Label htmlFor="creatorPayment">Pago al Creator</Label>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="creatorPayment"
                            type="number"
                            placeholder="500"
                            value={formData.creatorPayment}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                creatorPayment: e.target.value,
                              }))
                            }
                            className="pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cantidad que recibirá cada creator aprobado.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="creditCost">Costo en Créditos</Label>
                        <Input
                          id="creditCost"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.creditCost}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              creditCost: e.target.value,
                            }))
                          }
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Créditos que te costará esta campaña por creator.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Creator Count */}
                  <div>
                    <Label htmlFor="creatorCount">¿Cuántos creators necesitas?</Label>
                    <Input
                      id="creatorCount"
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={formData.creatorCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          creatorCount: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                    {formData.compensationType === "monetary" && (
                      <p className={`text-xs mt-2 ${credits < (parseInt(formData.creditCost) || 1) * (parseInt(formData.creatorCount) || 1)
                        ? "text-destructive"
                        : "text-muted-foreground"
                        }`}>
                        Créditos disponibles: {credits} |
                        Costo total: {(parseInt(formData.creditCost) || 1) * (parseInt(formData.creatorCount) || 1)} créditos
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {step < totalSteps ? (
              <Button variant="hero" onClick={() => setStep((s) => s + 1)}>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}