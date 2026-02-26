import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2, X, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Badge } from "@/components/ui/badge";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AICampaignGenerator } from "@/components/brand/AICampaignGenerator";

const goalOptions = [
  { id: "awareness", label: "Reconocimiento", description: "Aumentar la visibilidad de la marca" },
  { id: "conversion", label: "Conversión", description: "Impulsar ventas o reservas" },
  { id: "content", label: "Producción de Contenido", description: "UGC para anuncios" },
];

const vibeOptions = [
  { id: "romantic", label: "Romántico", emoji: "💕" },
  { id: "party", label: "Fiesta", emoji: "🎉" },
  { id: "family", label: "Familia", emoji: "👨‍👩‍👧‍👦" },
  { id: "healthy", label: "Saludable", emoji: "🥗" },
  { id: "premium", label: "Premium", emoji: "✨" },
  { id: "adventure", label: "Aventura", emoji: "🏔️" },
];

const contentTypeOptions = [
  { id: "post", label: "Publicación", emoji: "📸" },
  { id: "video", label: "Video", emoji: "🎥" },
  { id: "stories", label: "Historias", emoji: "📱" },
  { id: "carousel", label: "Carruseles", emoji: "🎠" },
];

const compensationOptions = [
  { id: "exchange", label: "Intercambio", description: "Producto, comida, servicios, etc." },
  { id: "monetary", label: "Pago Monetario", description: "Compensación en efectivo (cuesta créditos)" },
  { id: "hybrid", label: "Ambos (Híbrido)", description: "Pago monetario + Intercambio de producto/servicio" },
];



export default function CreateCampaign() {
  const { config } = usePlatformConfig();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credits, setCredits] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImage: "",
    goal: "",
    vibes: [] as string[],
    contentTypes: [] as string[],
    location: "",
    ageRange: "18-35",
    compensationType: "",
    exchangeDetails: "",
    minReward: "",
    maxReward: "",
    creditCost: "1",
    budget: "",
    startDate: "",
    endDate: "",
    creatorCount: "1",
    // Visit/Scheduling fields
    requiresVisit: false,
    visitLocation: "",
    visitCity: "",
    visitDays: [] as string[],
    visitStartTime: "09:00",
    visitEndTime: "17:00",
    visitDuration: "60", // minutes
    contentDeadlineDays: "3", // days after visit
    // Deliverables
    deliverables: [] as Array<{
      type: string;
      quantity: number;
      required: boolean;
      platform: "instagram" | "tiktok";
    }>,
  });

  const handleContentTypeToggle = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter((t) => t !== typeId)
        : [...prev.contentTypes, typeId],
    }));
  };

  const handleAddDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { type: "", quantity: 1, required: true, platform: "instagram" }]
    }));
  };

  const handleUpdateDeliverable = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleRemoveDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
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

  // ── AI Campaign Generator handler ──────────────────────────────
  const handleAIGenerated = (aiData: {
    title: string;
    description: string;
    goal: string;
    brandVibe: string[];
    audience: string;
    goals: string[];
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: aiData.title || prev.name,
      description: [
        aiData.description || "",
        aiData.audience ? `\n\nPúblico objetivo: ${aiData.audience}` : "",
        aiData.goals?.length
          ? `\n\nObjetivos:\n${aiData.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}`
          : "",
      ]
        .join("")
        .trim(),
      goal: aiData.goal || prev.goal,
      vibes: aiData.brandVibe?.length ? aiData.brandVibe : prev.vibes,
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          toast.error("El nombre de la campaña es requerido");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("La descripción de la campaña es requerida");
          return false;
        }
        if (!formData.startDate || !formData.endDate) {
          toast.error("Las fechas de inicio y fin son requeridas");
          return false;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
          toast.error("La fecha de fin debe ser después de la fecha de inicio");
          return false;
        }
        return true;

      case 2:
        if (formData.vibes.length === 0) {
          toast.error("Selecciona al menos un vibe para tu campaña");
          return false;
        }
        if (!formData.goal.trim()) {
          toast.error("El objetivo de la campaña es requerido");
          return false;
        }
        return true;

      case 3:
        if (!formData.location.trim()) {
          toast.error("La ubicación objetivo es requerida");
          return false;
        }
        if (!formData.ageRange) {
          toast.error("El rango de edad objetivo es requerido");
          return false;
        }
        return true;

      case 4:
        if (!formData.compensationType) {
          toast.error("Selecciona un tipo de compensación");
          return false;
        }
        if ((formData.compensationType === "exchange" || formData.compensationType === "hybrid") && !formData.exchangeDetails.trim()) {
          toast.error("Por favor describe qué ofreces a cambio");
          return false;
        }
        if (formData.compensationType === "monetary" || formData.compensationType === "hybrid") {
          const minVal = parseFloat(formData.minReward);
          const maxVal = parseFloat(formData.maxReward);
          if (!formData.minReward || minVal <= 0) {
            toast.error("El pago mínimo garantizado es requerido");
            return false;
          }
          if (!formData.maxReward || maxVal <= 0) {
            toast.error("El pago máximo es requerido");
            return false;
          }
          if (maxVal < minVal) {
            toast.error("El pago máximo debe ser mayor o igual al pago mínimo");
            return false;
          }
          // Credit cost fixed at 1 per creator
          const totalCost = 1 * (parseInt(formData.creatorCount) || 1);
          if (credits < totalCost) {
            toast.error(`Créditos insuficientes. Necesitas ${totalCost} créditos pero tienes ${credits}`);
            return false;
          }
        }
        if (!formData.creatorCount || parseInt(formData.creatorCount) < 1) {
          toast.error("El número de creadores debe ser al menos 1");
          return false;
        }
        return true;

      case 5:
        if (formData.requiresVisit) {
          if (!formData.visitLocation.trim() || !formData.visitCity.trim()) {
            toast.error("La dirección y ciudad de la visita son requeridas");
            return false;
          }
          if (formData.visitDays.length === 0) {
            toast.error("Selecciona al menos un día disponible para visitas");
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una campaña.");
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

      // Calculate final amounts using maxReward as Escrow base
      const minRewardVal = Number(formData.minReward) || 0;
      const maxRewardVal = Number(formData.maxReward) || 0;
      const creatorCount = parseInt(formData.creatorCount) || 1;
      const feePercent = config.serviceFeePercent || 10;
      // Invoice is always based on maxReward (Escrow)
      const perCreatorFee = maxRewardVal * (feePercent / 100);
      const perCreatorNet = maxRewardVal - perCreatorFee;

      const campaignData = {
        ...formData,
        brandId: user.uid,
        brandName: brandName,
        status: "active",
        createdAt: new Date().toISOString(),

        // Reward Range
        minReward: minRewardVal,
        maxReward: maxRewardVal,
        // Legacy / compat fields — use maxReward as base
        creatorPayment: perCreatorNet,       // Net creator receives (based on max, pre-approval)
        platformFeePercent: feePercent,
        platformFeeAmount: perCreatorFee,
        totalBudgetPerCreator: maxRewardVal, // Gross per creator (Escrow)

        budget: parseFloat(formData.budget) || 0,
        creatorCount: creatorCount,
        creditCost: 1,
        approvedCount: 0,
        applicationCount: 0,
        coverImage: formData.coverImage,
      };

      const campaignRef = await addDoc(collection(db, "campaigns"), campaignData);

      // ✅ Auto-generate brand invoice for monetary or hybrid campaigns (based on maxReward Escrow)
      if ((formData.compensationType === "monetary" || formData.compensationType === "hybrid") && maxRewardVal > 0) {
        const totalGross = maxRewardVal * creatorCount;
        const totalFee = perCreatorFee * creatorCount;
        const totalNet = perCreatorNet * creatorCount;

        try {
          await addDoc(collection(db, "invoices"), {
            type: "campaign_budget",
            brandId: user.uid,
            brandName: brandName,
            campaignId: campaignRef.id,
            campaignName: formData.name,
            creatorCount: creatorCount,
            minReward: minRewardVal,
            maxReward: maxRewardVal,
            perCreatorGross: maxRewardVal, // Escrow = max
            perCreatorFee: perCreatorFee,
            perCreatorNet: perCreatorNet,
            totalGross: totalGross,
            totalFee: totalFee,
            totalNet: totalNet,
            feePercent: feePercent,
            status: "pending",
            createdAt: new Date().toISOString(),
          });
          console.log("✅ Invoice created:", totalGross, "for", creatorCount, "creators (Escrow based on maxReward)");
        } catch (invoiceErr) {
          console.error("❌ Invoice creation failed:", invoiceErr);
          toast.error("Campaña creada, pero la factura no pudo generarse. Contacta soporte.");
        }
      }


      toast.success("¡Campaña creada exitosamente!");
      navigate("/brand/matches");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Error al crear la campaña.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const totalSteps = 5;

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
          title="Crear Campaña"
          subtitle="Encontremos a tus creadores perfectos"
        />

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${step >= s
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-all ${step > s ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center flex-wrap gap-4 sm:gap-8 md:gap-24 mt-4 text-xs md:text-sm text-muted-foreground">
            <span className={step === 1 ? "text-primary font-medium" : ""}>Básicos</span>
            <span className={step === 2 ? "text-primary font-medium" : ""}>Objetivos</span>
            <span className={step === 3 ? "text-primary font-medium" : ""}>Público</span>
            <span className={step === 4 ? "text-primary font-medium" : ""}>Presupuesto</span>
            <span className={step === 5 ? "text-primary font-medium" : ""}>Visita</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">

          {/* ── AI Campaign Generator (show only on step 1) ── */}
          {step === 1 && (
            <AICampaignGenerator
              brandName={(formData as any).brandName || ""}
              onGenerated={handleAIGenerated}
            />
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-5 sm:p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Información Básica</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Nombre de la Campaña</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Lanzamiento Bienestar Verano"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción de la Campaña *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu campaña, qué estás promoviendo y qué mostrarán los creadores..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Esto ayudará a los creadores a entender de qué trata tu campaña
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="coverImage">Imagen de Portada de la Campaña</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {formData.coverImage ? (
                        <div className="relative w-32 h-40 rounded-xl overflow-hidden border border-border">
                          <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            id="coverImage"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!user) return;

                              const toastId = toast.loading("Subiendo imagen...");
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `campaign-covers/${user.uid}_${Date.now()}.${fileExt}`;
                                const storageRef = ref(storage, fileName);

                                await uploadBytes(storageRef, file);
                                const downloadURL = await getDownloadURL(storageRef);

                                setFormData(prev => ({ ...prev, coverImage: downloadURL }));
                                toast.success("¡Imagen subida exitosamente!", { id: toastId });
                              } catch (error) {
                                console.error("Error uploading image:", error);
                                toast.error("Error al subir la imagen.", { id: toastId });
                              }
                            }}
                            className="hidden"
                          />
                          <Label
                            htmlFor="coverImage"
                            className="flex flex-col items-center justify-center w-32 h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                          >
                            <Plus className="w-6 h-6 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Subir Portada</span>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Fecha de Inicio</Label>
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
                      <Label htmlFor="endDate">Fecha de Fin</Label>
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
                className="glass-card p-5 sm:p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Objetivos de la Campaña</h2>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">¿Cuál es tu objetivo principal?</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <Label className="mb-4 block">Vibe de la Marca (selecciona varios)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                className="glass-card p-5 sm:p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Público Objetivo</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      placeholder="Ej: Santo Domingo, DN"
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
                    <Label className="mb-4 block">Rango de Edad</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className="glass-card p-5 sm:p-8"
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

                  {/* Deliverables Configuration */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="block">Entregables por Creador</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Especifica qué contenido debe entregar cada creador
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddDeliverable}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Entregable
                      </Button>
                    </div>

                    {formData.deliverables.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">
                          No se han establecido entregables. Haz clic en "Añadir Entregable" para especificar los requisitos de contenido.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.deliverables.map((deliverable, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 border rounded-xl bg-muted/30"
                          >
                            {/* Platform Selector */}
                            <div className="w-32">
                              <Select
                                value={deliverable.platform}
                                onValueChange={(value) =>
                                  handleUpdateDeliverable(index, "platform", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Plataforma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="instagram">Instagram</SelectItem>
                                  <SelectItem value="tiktok">TikTok</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Type Selector */}
                            <div className="flex-1">
                              <Select
                                value={deliverable.type}
                                onValueChange={(value) =>
                                  handleUpdateDeliverable(index, "type", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Post">📸 Publicación</SelectItem>
                                  <SelectItem value="Video">🎥 Video</SelectItem>
                                  <SelectItem value="Story">📱 Historia</SelectItem>
                                  <SelectItem value="Carousel">🖼️ Carrusel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Quantity */}
                            <div className="w-24">
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={deliverable.quantity}
                                onChange={(e) =>
                                  handleUpdateDeliverable(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                placeholder="Cant."
                              />
                            </div>

                            {/* Required Toggle */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={deliverable.required}
                                onCheckedChange={(checked) =>
                                  handleUpdateDeliverable(index, "required", checked)
                                }
                              />
                              <span className="text-sm whitespace-nowrap">
                                {deliverable.required ? "Requerido" : "Opcional"}
                              </span>
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDeliverable(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.deliverables.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 Los creadores enviarán cada entregable individualmente y podrán hacerlo de manera progresiva.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Compensation Type */}
                  <div>
                    <Label className="mb-4 block">¿Qué ofreces a cambio? *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  {/* Exchange Details (if exchange or hybrid selected) */}
                  {(formData.compensationType === "exchange" || formData.compensationType === "hybrid") && (
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

                  {/* Monetary Details (if monetary or hybrid selected) */}
                  {(formData.compensationType === "monetary" || formData.compensationType === "hybrid") && (
                    <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                      {/* Range info banner */}
                      <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg text-sm text-primary">
                        <strong>💡 Rango de Pago por Creador:</strong> Define un mínimo garantizado y un máximo.
                        Asignarás el pago final al aprobar el contenido, basado en calidad e impacto.
                      </div>

                      {/* Two-column: min / max */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minReward">Pago Mínimo Garantizado <span className="text-green-600 font-semibold">★</span></Label>
                          <div className="relative mt-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              id="minReward"
                              type="number"
                              min="0"
                              placeholder="75"
                              value={formData.minReward}
                              onChange={(e) => setFormData((prev) => ({ ...prev, minReward: e.target.value }))}
                              className="pl-8"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">El creador recibirá al menos este monto si su contenido es aprobado.</p>
                        </div>
                        <div>
                          <Label htmlFor="maxReward">Pago Máximo <span className="text-amber-500 font-semibold">🏆</span></Label>
                          <div className="relative mt-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              id="maxReward"
                              type="number"
                              min="0"
                              placeholder="150"
                              value={formData.maxReward}
                              onChange={(e) => setFormData((prev) => ({ ...prev, maxReward: e.target.value }))}
                              className="pl-8"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Pago máximo por contenido de alta calidad e impacto. También define el Escrow.</p>
                        </div>
                      </div>

                      {/* Validation warning */}
                      {formData.minReward && formData.maxReward && parseFloat(formData.maxReward) < parseFloat(formData.minReward) && (
                        <p className="text-xs text-destructive font-medium">⚠️ El pago máximo debe ser mayor o igual al mínimo.</p>
                      )}

                      {/* Fee Calculation Display — based on maxReward (Escrow) */}
                      {formData.maxReward && (() => {
                        const minVal = Number(formData.minReward) || 0;
                        const maxVal = Number(formData.maxReward);
                        if (maxVal <= 0) return null;
                        const count = parseInt(formData.creatorCount) || 1;
                        const fee = maxVal * (config.serviceFeePercent / 100);
                        const net = maxVal - fee;
                        const totalG = maxVal * count;
                        const totalF = fee * count;
                        const totalN = net * count;

                        return (
                          <div className="rounded-xl border border-border/60 overflow-hidden">
                            {/* Summary range */}
                            <div className="px-4 py-2 bg-muted/60 border-b border-border/50 flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Rango por creador</span>
                              <span className="font-semibold text-sm">
                                ${minVal > 0 ? minVal.toLocaleString() : "?"} – ${maxVal.toLocaleString()} USD
                              </span>
                            </div>
                            {/* Total invoice — Escrow based on max */}
                            <div className="px-4 py-3 bg-primary/10 border-b border-border/50 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-sm">Total Factura ({count} creador{count !== 1 ? "es" : ""})</span>
                                <p className="text-[10px] text-muted-foreground">Basado en pago máximo (Escrow garantizado)</p>
                              </div>
                              <span className="text-primary font-black text-xl">${totalG.toLocaleString()}</span>
                            </div>
                            <div className="px-4 py-3 bg-muted/40 space-y-1.5 text-sm">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Máx. por creador × {count}</span>
                                <span>${maxVal.toLocaleString()} × {count} = <strong className="text-foreground">${totalG.toLocaleString()}</strong></span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  Fee RELA ({config.serviceFeePercent}%)
                                  <span className="text-[9px] bg-destructive/10 text-destructive px-1 rounded">Deducido</span>
                                </span>
                                <span className="text-destructive">-${totalF.toLocaleString()} (${fee.toFixed(2)}/c.u.)</span>
                              </div>
                              <div className="flex justify-between font-semibold pt-1 border-t border-border/40">
                                <span>Creadores reciben (si asignan max)</span>
                                <span className="text-green-600">${totalN.toLocaleString()} (${net.toFixed(2)}/c.u.)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Creator Count (Moved Up) */}
                  <div className="mt-4">
                    <Label htmlFor="creatorCount">¿Cuántos creadores necesitas?</Label>
                    <Input
                      id="creatorCount"
                      type="number"
                      min="1"
                      placeholder="Ej: 5"
                      value={formData.creatorCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          creatorCount: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  {/* Credit Cost Display (Read Only) */}
                  <div className="mt-4 p-4 bg-secondary/20 rounded-xl border border-secondary/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-secondary-foreground font-semibold">Costo Total en Créditos</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculado basado en {formData.creatorCount || 0} creadores (1 crédito por creador)
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {(parseInt(formData.creatorCount) || 0) * 1} Créditos
                      </div>
                    </div>

                    {(formData.compensationType === "monetary" || formData.compensationType === "hybrid") && (
                      <div className={`text-xs mt-2 pt-2 border-t border-border/50 flex justify-between ${credits < ((parseInt(formData.creatorCount) || 0) * 1)
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        <span>Créditos disponibles: {credits}</span>
                        {credits < ((parseInt(formData.creatorCount) || 0) * 1) && (
                          <span>Insuficientes créditos</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-5 sm:p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Visita y Programación</h2>

                <div className="space-y-6">
                  {/* Requires Visit Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <Label className="text-base font-medium">¿Requiere visita del creador?</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Activa si el creador necesita ir a tu local o ubicación específica
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.requiresVisit ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, requiresVisit: !prev.requiresVisit }))}
                    >
                      {formData.requiresVisit ? "Sí" : "No"}
                    </Button>
                  </div>

                  {formData.requiresVisit && (
                    <div className="space-y-6 p-6 bg-primary/5 rounded-xl border border-primary/10">
                      {/* Visit Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="visitLocation">Dirección / Local</Label>
                          <Input
                            id="visitLocation"
                            placeholder="Ej: Calle Principal #123"
                            value={formData.visitLocation}
                            onChange={(e) => setFormData(prev => ({ ...prev, visitLocation: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="visitCity">Ciudad</Label>
                          <Input
                            id="visitCity"
                            placeholder="Ej: Santo Domingo"
                            value={formData.visitCity}
                            onChange={(e) => setFormData(prev => ({ ...prev, visitCity: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Visit Days */}
                      <div>
                        <Label className="mb-3 block">Días disponibles para visitas</Label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, idx) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const fullDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx];
                                setFormData(prev => ({
                                  ...prev,
                                  visitDays: prev.visitDays.includes(fullDay)
                                    ? prev.visitDays.filter(d => d !== fullDay)
                                    : [...prev.visitDays, fullDay]
                                }));
                              }}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${formData.visitDays.includes(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx])
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Windows */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="visitStartTime">Hora de inicio</Label>
                          <Input
                            id="visitStartTime"
                            type="time"
                            value={formData.visitStartTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, visitStartTime: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="visitEndTime">Hora de fin</Label>
                          <Input
                            id="visitEndTime"
                            type="time"
                            value={formData.visitEndTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, visitEndTime: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Visit Duration */}
                      <div>
                        <Label htmlFor="visitDuration">Duración de visita</Label>
                        <select
                          id="visitDuration"
                          value={formData.visitDuration}
                          onChange={(e) => setFormData(prev => ({ ...prev, visitDuration: e.target.value }))}
                          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="30">30 minutos</option>
                          <option value="60">1 hora</option>
                          <option value="90">1.5 horas</option>
                          <option value="120">2 horas</option>
                          <option value="180">3 horas</option>
                        </select>
                      </div>

                      {/* Content Deadline */}
                      <div>
                        <Label htmlFor="contentDeadlineDays">Plazo para entrega de contenido</Label>
                        <select
                          id="contentDeadlineDays"
                          value={formData.contentDeadlineDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, contentDeadlineDays: e.target.value }))}
                          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="1">1 día después de la visita</option>
                          <option value="2">2 días después de la visita</option>
                          <option value="3">3 días después de la visita</option>
                          <option value="5">5 días después de la visita</option>
                          <option value="7">1 semana después de la visita</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-2">
                          El creador debe entregar el contenido en este plazo tras completar la visita
                        </p>
                      </div>
                    </div>
                  )}

                  {!formData.requiresVisit && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Esta campaña no requiere visita física del creador</p>
                      <p className="text-sm mt-2">El creador puede crear el contenido remotamente</p>
                    </div>
                  )}
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
              Anterior
            </Button>

            {step < totalSteps ? (
              <Button
                variant="hero"
                onClick={() => {
                  if (validateStep(step)) {
                    setStep((s) => s + 1);
                  }
                }}
              >
                Siguiente Paso
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Encontrar Matches
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