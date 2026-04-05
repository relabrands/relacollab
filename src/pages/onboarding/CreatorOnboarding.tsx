import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, X, ChevronLeft, ChevronRight, Sparkles, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATOR_NICHES, CREATOR_VIBES } from "@/lib/constants";



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

const CONTENT_FORMATS = [
    { id: "posts", label: "Posts", emoji: "📸", description: "Single images" },
    { id: "reels", label: "Reels", emoji: "🎬", description: "Short videos" },
    { id: "stories", label: "Stories", emoji: "📱", description: "24h content" },
    { id: "carousels", label: "Carousels", emoji: "🖼️", description: "Multiple images" },
    { id: "videos", label: "Videos", emoji: "🎥", description: "Long-form videos" },
];



const COLLABORATION_TYPES = [
    { value: "Con remuneración", label: "Con remuneración", description: "Solo colaboraciones pagadas" },
    { value: "Intercambios", label: "Intercambios", description: "Solo productos o servicios" },
    { value: "Ambos", label: "Ambos", description: "Acepto cualquier tipo" }
];

export default function CreatorOnboarding() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        bio: "",
        niche: "", // NEW
        customContentTypes: [] as string[],
        contentFormats: [] as string[],
        vibes: [] as string[],
        whoAppearsInContent: [] as string[],
        experienceTime: "",
        collaborationPreference: "",
        hasBrandExperience: "",
        instagramUsername: "",
        tiktokUsername: ""
    });

    const [customContentType, setCustomContentType] = useState("");

    const totalSteps = 6; // Updated from 4 to 6
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
            }
        };
        fetchUserName();
    }, [user]);

    const handleWhoAppearsToggle = (option: string) => {
        setFormData(prev => ({
            ...prev,
            whoAppearsInContent: prev.whoAppearsInContent.includes(option)
                ? prev.whoAppearsInContent.filter(o => o !== option)
                : [...prev.whoAppearsInContent, option]
        }));
    };

    const handleContentFormatToggle = (formatId: string) => {
        setFormData(prev => ({
            ...prev,
            contentFormats: prev.contentFormats.includes(formatId)
                ? prev.contentFormats.filter(f => f !== formatId)
                : [...prev.contentFormats, formatId]
        }));
    };

    const handleVibeToggle = (vibeId: string) => {
        setFormData(prev => ({
            ...prev,
            vibes: prev.vibes.includes(vibeId)
                ? prev.vibes.filter(v => v !== vibeId)
                : [...prev.vibes, vibeId]
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
            case 1: // Niche
                if (!formData.niche) {
                    toast.error("Por favor selecciona tu nicho principal");
                    return false;
                }
                return true;
            case 2: // Secundarias
                return true; // Optional
            case 3: // Content formats
                if (formData.contentFormats.length === 0) {
                    toast.error("Por favor selecciona al menos un formato de contenido");
                    return false;
                }
                return true;
            case 4: // Who appears, experience, collaboration
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
            case 5: // Social handles (optional)
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
                niche: formData.niche,
                categories: formData.customContentTypes,
                contentFormats: formData.contentFormats,
                vibes: formData.vibes,
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

            // Redirect to a "pending approval" page
            window.location.href = "/pending-approval";
        } catch (error) {
            toast.error("Algo salió mal");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            toast.error("Error al cerrar sesión");
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
                            <img
                                src="https://relabrands.com/wp-content/uploads/2026/03/Icono-rela-collab.png"
                                alt="RELA Collab Logo"
                                className="w-20 h-20 mx-auto rounded-2xl object-cover"
                            />
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
                            <h3 className="text-2xl font-bold">¿Cuál es tu nicho principal?</h3>
                            <p className="text-muted-foreground">
                                Selecciona la categoría principal de tu contenido.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Label>Nicho Principal</Label>
                            <Select
                                value={formData.niche}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona tu nicho" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CREATOR_NICHES.map((niche) => (
                                        <SelectItem key={niche.id} value={niche.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{niche.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Categorías Secundarias (Opcional)</h3>
                            <p className="text-muted-foreground">
                                Temas adicionales que aparecen en tu contenido.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CREATOR_VIBES.map((vibe) => (
                                <div
                                    key={vibe.id}
                                    onClick={() => handleVibeToggle(vibe.id)}
                                    className={`
                                        p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                                        ${formData.vibes.includes(vibe.id)
                                            ? 'border-primary bg-primary/10 shadow-sm scale-105'
                                            : 'border-border hover:border-primary/50 hover:scale-105'
                                        }
                                    `}
                                >
                                    <div className="font-medium text-sm">{vibe.label}</div>
                                    {formData.vibes.includes(vibe.id) && (
                                        <div className="text-primary text-xs mt-1">✓</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <Label>¿Etiquetas Personalizadas?</Label>
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
                            <h3 className="text-2xl font-bold">¿Qué formatos de contenido creas?</h3>
                            <p className="text-muted-foreground">
                                Selecciona los tipos de contenido que produces.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CONTENT_FORMATS.map((format) => (
                                <div
                                    key={format.id}
                                    onClick={() => handleContentFormatToggle(format.id)}
                                    className={`
                                        p-5 rounded-xl border-2 cursor-pointer transition-all
                                        ${formData.contentFormats.includes(format.id)
                                            ? 'border-primary bg-primary/10 shadow-sm'
                                            : 'border-border hover:border-primary/50 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">{format.emoji}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Checkbox
                                                    checked={formData.contentFormats.includes(format.id)}
                                                    onCheckedChange={() => handleContentFormatToggle(format.id)}
                                                />
                                                <label className="text-base font-semibold cursor-pointer">
                                                    {format.label}
                                                </label>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{format.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {formData.contentFormats.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium mb-2">Formatos seleccionados:</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.contentFormats.map((formatId) => {
                                        const format = CONTENT_FORMATS.find(f => f.id === formatId);
                                        return (
                                            <Badge key={formatId} variant="secondary">
                                                {format?.emoji} {format?.label}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                );

            case 4:
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

            case 5:
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
                {/* Logout Button */}
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar sesión
                    </Button>
                </div>

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
