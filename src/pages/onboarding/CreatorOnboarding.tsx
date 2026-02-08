import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONTENT_TYPES = [
    "Estilo de vida",
    "Belleza y moda",
    "Recetas",
    "Humor",
    "Fitness",
    "Edición",
    "Tecnología"
];

const WHO_APPEARS = [
    "Solo yo",
    "Mi pareja",
    "Mis amigos",
    "No aparecen personas"
];

const EXPERIENCE_TIME = [
    "Menos de 5 meses",
    "De 5 a 8 meses",
    "De 8 meses a 1 año",
    "Más de 1 año",
    "Más de 3 años"
];

const COLLABORATION_TYPES = [
    { value: "Con remuneración", label: "Con remuneración", description: "Solo colaboraciones pagadas" },
    { value: "Intercambios", label: "Intercambios", description: "Solo productos o servicios" },
    { value: "Ambos", label: "Ambos", description: "Acepto cualquier tipo" }
];

export default function CreatorOnboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        bio: "",
        contentTypes: [] as string[],
        customContentTypes: [] as string[],
        whoAppearsInContent: [] as string[],
        experienceTime: "",
        collaborationPreference: "",
        hasBrandExperience: "",
        instagramUsername: "",
        tiktokUsername: ""
    });

    const [customContentType, setCustomContentType] = useState("");

    const totalSteps = 4;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    useEffect(() => {
        const fetchUserName = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserName(data.displayName || data.email?.split("@")[0] || "");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserName();
    }, [user]);

    const handleContentTypeToggle = (type: string) => {
        setFormData(prev => ({
            ...prev,
            contentTypes: prev.contentTypes.includes(type)
                ? prev.contentTypes.filter(t => t !== type)
                : [...prev.contentTypes, type]
        }));
    };

    const handleWhoAppearsToggle = (option: string) => {
        setFormData(prev => ({
            ...prev,
            whoAppearsInContent: prev.whoAppearsInContent.includes(option)
                ? prev.whoAppearsInContent.filter(o => o !== option)
                : [...prev.whoAppearsInContent, option]
        }));
    };

    const addCustomContentType = () => {
        if (customContentType.trim() && !formData.customContentTypes.includes(customContentType.trim())) {
            setFormData(prev => ({
                ...prev,
                customContentTypes: [...prev.customContentTypes, customContentType.trim()]
            }));
            setCustomContentType("");
        }
    };

    const removeCustomContentType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            customContentTypes: prev.customContentTypes.filter(t => t !== type)
        }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0: // Bio (optional, can skip)
                return true;
            case 1: // Content types
                if (formData.contentTypes.length === 0 && formData.customContentTypes.length === 0) {
                    toast.error("Por favor selecciona al menos un tipo de contenido");
                    return false;
                }
                return true;
            case 2: // Who appears, experience, collaboration
                if (formData.whoAppearsInContent.length === 0) {
                    toast.error("Por favor selecciona quién aparece en tu contenido");
                    return false;
                }
                if (!formData.experienceTime) {
                    toast.error("Por favor indica tu tiempo de experiencia");
                    return false;
                }
                if (!formData.collaborationPreference) {
                    toast.error("Por favor indica tu preferencia de colaboración");
                    return false;
                }
                if (!formData.hasBrandExperience) {
                    toast.error("Por favor indica si tienes experiencia con marcas");
                    return false;
                }
                return true;
            case 3: // Social handles (optional)
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleComplete = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                bio: formData.bio,
                contentTypes: [...formData.contentTypes, ...formData.customContentTypes],
                whoAppearsInContent: formData.whoAppearsInContent,
                experienceTime: formData.experienceTime,
                collaborationPreference: formData.collaborationPreference,
                hasBrandExperience: formData.hasBrandExperience === "Si",
                socialHandles: {
                    instagram: formData.instagramUsername,
                    tiktok: formData.tiktokUsername
                },
                status: "pending", // Set to pending for admin approval
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            });

            toast.success("¡Perfil enviado para revisión!");
            toast.info("Serás notificado una vez que tu perfil sea aprobado");

            // Redirect to a "pending approval" page or login
            window.location.href = "/login";
        } catch (error) {
            console.error(error);
            toast.error("Algo salió mal");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <motion.div
                        key="step-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h2 className="text-3xl font-bold">
                                ¡Hola, {userName}! 👋
                            </h2>
                            <p className="text-muted-foreground">
                                Bienvenido a RELA Collab. Completa tu perfil para empezar a recibir oportunidades de marcas increíbles.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="bio">Cuéntanos sobre ti</Label>
                            <Textarea
                                id="bio"
                                placeholder="Soy un creador de contenido apasionado por... Me especializo en..."
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                rows={5}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Esta biografía será visible para las marcas. Destaca tus fortalezas y estilo único.
                            </p>
                        </div>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">¿Qué tipo de contenido creas?</h3>
                            <p className="text-muted-foreground">
                                Selecciona todas las categorías que apliquen a tu contenido.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CONTENT_TYPES.map((type) => (
                                <div
                                    key={type}
                                    onClick={() => handleContentTypeToggle(type)}
                                    className={`
                                        p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${formData.contentTypes.includes(type)
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={formData.contentTypes.includes(type)}
                                            onCheckedChange={() => handleContentTypeToggle(type)}
                                        />
                                        <label className="text-sm font-medium cursor-pointer">
                                            {type}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <Label>¿Otros tipos de contenido?</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Viajes, Gaming, Educativo..."
                                    value={customContentType}
                                    onChange={(e) => setCustomContentType(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomContentType())}
                                />
                                <Button type="button" variant="outline" onClick={addCustomContentType}>
                                    Agregar
                                </Button>
                            </div>
                            {formData.customContentTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.customContentTypes.map((type) => (
                                        <Badge key={type} variant="secondary" className="gap-1 py-1.5 px-3">
                                            {type}
                                            <X
                                                className="w-3 h-3 cursor-pointer"
                                                onClick={() => removeCustomContentType(type)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Detalles de tu contenido</h3>
                            <p className="text-muted-foreground">
                                Ayúdanos a encontrar las mejores oportunidades para ti.
                            </p>
                        </div>

                        {/* Who Appears */}
                        <div className="space-y-3">
                            <Label>¿Quiénes suelen aparecer en tu contenido?</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {WHO_APPEARS.map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => handleWhoAppearsToggle(option)}
                                        className={`
                                            p-3 rounded-lg border-2 cursor-pointer transition-all
                                            ${formData.whoAppearsInContent.includes(option)
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={formData.whoAppearsInContent.includes(option)}
                                                onCheckedChange={() => handleWhoAppearsToggle(option)}
                                            />
                                            <label className="text-sm font-medium cursor-pointer">
                                                {option}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Experience Time */}
                        <div className="space-y-3">
                            <Label>¿Cuánto tiempo llevas creando contenido UGC?</Label>
                            <RadioGroup
                                value={formData.experienceTime}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, experienceTime: value }))}
                                className="space-y-2"
                            >
                                {EXPERIENCE_TIME.map((time) => (
                                    <div
                                        key={time}
                                        className={`
                                            flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                            ${formData.experienceTime === time
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <RadioGroupItem value={time} id={`time-${time}`} />
                                        <label htmlFor={`time-${time}`} className="cursor-pointer flex-1 text-sm font-medium">
                                            {time}
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Collaboration Preference */}
                        <div className="space-y-3">
                            <Label>¿Con qué tipo de acuerdos te interesa colaborar?</Label>
                            <p className="text-sm text-muted-foreground">
                                Esta preferencia afectará las oportunidades que recibirás.
                            </p>
                            <RadioGroup
                                value={formData.collaborationPreference}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, collaborationPreference: value }))}
                                className="space-y-2"
                            >
                                {COLLABORATION_TYPES.map((type) => (
                                    <div
                                        key={type.value}
                                        className={`
                                            flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                            ${formData.collaborationPreference === type.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <RadioGroupItem value={type.value} id={`collab-${type.value}`} className="mt-1" />
                                        <label htmlFor={`collab-${type.value}`} className="cursor-pointer flex-1">
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-sm text-muted-foreground">{type.description}</div>
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Brand Experience */}
                        <div className="space-y-3">
                            <Label>¿Has trabajado con marcas anteriormente?</Label>
                            <RadioGroup
                                value={formData.hasBrandExperience}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, hasBrandExperience: value }))}
                                className="flex gap-4"
                            >
                                <div
                                    className={`
                                        flex-1 flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                        ${formData.hasBrandExperience === "Si"
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <RadioGroupItem value="Si" id="brand-yes" />
                                    <label htmlFor="brand-yes" className="cursor-pointer font-medium">
                                        Sí
                                    </label>
                                </div>
                                <div
                                    className={`
                                        flex-1 flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                        ${formData.hasBrandExperience === "No"
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <RadioGroupItem value="No" id="brand-no" />
                                    <label htmlFor="brand-no" className="cursor-pointer font-medium">
                                        No
                                    </label>
                                </div>
                            </RadioGroup>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Información de redes sociales</h3>
                            <p className="text-muted-foreground">
                                Opcional - Solo para fines de aprobación. Una vez aprobado, podrás conectar tus cuentas oficialmente en tu perfil.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Usuario de Instagram (opcional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                    <Input
                                        id="instagram"
                                        className="pl-7"
                                        placeholder="tunombre"
                                        value={formData.instagramUsername}
                                        onChange={(e) => setFormData(prev => ({ ...prev, instagramUsername: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tiktok">Usuario de TikTok (opcional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                    <Input
                                        id="tiktok"
                                        className="pl-7"
                                        placeholder="tunombre"
                                        value={formData.tiktokUsername}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tiktokUsername: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                ¿Qué sigue?
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                                <li>• Tu perfil será revisado por nuestro equipo</li>
                                <li>• Te notificaremos por email cuando sea aprobado</li>
                                <li>• Una vez aprobado, podrás conectar Instagram oficialmente</li>
                                <li>• ¡Empezarás a recibir oportunidades de marcas!</li>
                            </ul>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Paso {currentStep + 1} de {totalSteps}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Main Card */}
                <Card className="glass-card">
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            {renderStep()}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-8">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Atrás
                                </Button>
                            )}

                            <div className="flex-1" />

                            {currentStep < totalSteps - 1 ? (
                                <Button
                                    variant="hero"
                                    onClick={handleNext}
                                    className="gap-2"
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="hero"
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Enviar para Aprobación
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
