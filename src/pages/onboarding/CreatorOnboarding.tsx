import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
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
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const NICHE_OPTIONS = [
    "Estilo de vida",
    "Belleza y moda",
    "Recetas",
    "Humor",
    "Fitness",
    "Edición",
    "Tecnología"
];

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
    "Con remuneración",
    "Intercambios",
    "Ambos"
];

export default function CreatorOnboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bio: "",
        niche: [] as string[],
        contentTypes: [] as string[],
        customContentTypes: [] as string[],
        whoAppearsInContent: [] as string[],
        experienceTime: "",
        collaborationPreference: "",
        hasBrandExperience: ""
    });

    const [customContentType, setCustomContentType] = useState("");

    const handleNicheToggle = (niche: string) => {
        setFormData(prev => ({
            ...prev,
            niche: prev.niche.includes(niche)
                ? prev.niche.filter(n => n !== niche)
                : [...prev.niche, niche]
        }));
    };

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

    const handleComplete = async () => {
        // Validation
        if (formData.niche.length === 0) {
            toast.error("Por favor selecciona al menos un nicho");
            return;
        }
        if (formData.contentTypes.length === 0 && formData.customContentTypes.length === 0) {
            toast.error("Por favor selecciona al menos un tipo de contenido");
            return;
        }
        if (formData.whoAppearsInContent.length === 0) {
            toast.error("Por favor selecciona quién aparece en tu contenido");
            return;
        }
        if (!formData.experienceTime) {
            toast.error("Por favor indica tu tiempo de experiencia");
            return;
        }
        if (!formData.collaborationPreference) {
            toast.error("Por favor indica tu preferencia de colaboración");
            return;
        }
        if (!formData.hasBrandExperience) {
            toast.error("Por favor indica si tienes experiencia con marcas");
            return;
        }

        setLoading(true);
        try {
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                bio: formData.bio,
                niche: formData.niche,
                contentTypes: [...formData.contentTypes, ...formData.customContentTypes],
                whoAppearsInContent: formData.whoAppearsInContent,
                experienceTime: formData.experienceTime,
                collaborationPreference: formData.collaborationPreference,
                hasBrandExperience: formData.hasBrandExperience === "Si",
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            });

            toast.success("¡Perfil completado!");
            window.location.href = "/creator";
        } catch (error) {
            console.error(error);
            toast.error("Algo salió mal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Completa tu Perfil de Creator</h1>
                <p className="text-muted-foreground">Ayuda a las marcas a descubrirte agregando tus detalles.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Perfil</CardTitle>
                    <CardDescription>Esta información será visible para las marcas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Biografía Corta</Label>
                        <Textarea
                            id="bio"
                            placeholder="Cuéntanos un poco sobre ti..."
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    {/* Primary Niche - Multi-select */}
                    <div className="space-y-3">
                        <Label>Nicho Principal *</Label>
                        <p className="text-sm text-muted-foreground">Puedes seleccionar más de una opción.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {NICHE_OPTIONS.map((niche) => (
                                <div key={niche} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`niche-${niche}`}
                                        checked={formData.niche.includes(niche)}
                                        onCheckedChange={() => handleNicheToggle(niche)}
                                    />
                                    <label
                                        htmlFor={`niche-${niche}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {niche}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Types */}
                    <div className="space-y-3">
                        <Label>¿Qué tipo de contenido UGC creas? *</Label>
                        <p className="text-sm text-muted-foreground">Puedes seleccionar más de una opción.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CONTENT_TYPES.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`content-${type}`}
                                        checked={formData.contentTypes.includes(type)}
                                        onCheckedChange={() => handleContentTypeToggle(type)}
                                    />
                                    <label
                                        htmlFor={`content-${type}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* Custom Content Type */}
                        <div className="flex gap-2 mt-3">
                            <Input
                                placeholder="Otros (especifica)"
                                value={customContentType}
                                onChange={(e) => setCustomContentType(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomContentType())}
                            />
                            <Button type="button" variant="outline" onClick={addCustomContentType}>
                                Agregar
                            </Button>
                        </div>
                        {formData.customContentTypes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.customContentTypes.map((type) => (
                                    <Badge key={type} variant="secondary" className="gap-1">
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

                    {/* Who Appears in Content */}
                    <div className="space-y-3">
                        <Label>¿Quiénes suelen aparecer en tu contenido UGC? *</Label>
                        <p className="text-sm text-muted-foreground">Puedes seleccionar más de una opción.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {WHO_APPEARS.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`who-${option}`}
                                        checked={formData.whoAppearsInContent.includes(option)}
                                        onCheckedChange={() => handleWhoAppearsToggle(option)}
                                    />
                                    <label
                                        htmlFor={`who-${option}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Experience Time */}
                    <div className="space-y-3">
                        <Label>¿Cuánto tiempo tienes creando contenido UGC? *</Label>
                        <RadioGroup value={formData.experienceTime} onValueChange={(value) => setFormData(prev => ({ ...prev, experienceTime: value }))}>
                            {EXPERIENCE_TIME.map((time) => (
                                <div key={time} className="flex items-center space-x-2">
                                    <RadioGroupItem value={time} id={`time-${time}`} />
                                    <label
                                        htmlFor={`time-${time}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {time}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Collaboration Preference */}
                    <div className="space-y-3">
                        <Label>Colaboraciones y disponibilidad. ¿Con qué tipo de acuerdos te interesa colaborar? *</Label>
                        <p className="text-sm text-muted-foreground">Esta preferencia es definitiva para el matching con marcas.</p>
                        <RadioGroup value={formData.collaborationPreference} onValueChange={(value) => setFormData(prev => ({ ...prev, collaborationPreference: value }))}>
                            {COLLABORATION_TYPES.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <RadioGroupItem value={type} id={`collab-${type}`} />
                                    <label
                                        htmlFor={`collab-${type}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Brand Experience */}
                    <div className="space-y-3">
                        <Label>¿Tienes experiencia trabajando con marcas? *</Label>
                        <RadioGroup value={formData.hasBrandExperience} onValueChange={(value) => setFormData(prev => ({ ...prev, hasBrandExperience: value }))}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Si" id="brand-yes" />
                                <label htmlFor="brand-yes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    Sí
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="No" id="brand-no" />
                                <label htmlFor="brand-no" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    No
                                </label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button onClick={handleComplete} className="w-full mt-4" variant="hero" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Completar Perfil
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
