import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { MobileNav } from "@/components/dashboard/MobileNav";

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

export default function CreatorSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profileData, setProfileData] = useState({
        bio: "",
        niche: [] as string[],
        contentTypes: [] as string[],
        customContentTypes: [] as string[],
        whoAppearsInContent: [] as string[],
        experienceTime: "",
        collaborationPreference: "",
        hasBrandExperience: false
    });

    const [customContentType, setCustomContentType] = useState("");

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        publicProfile: true,
        showEarnings: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();

                    // Profile data
                    setProfileData({
                        bio: data.bio || "",
                        niche: data.niche || [],
                        contentTypes: data.contentTypes?.filter((t: string) => CONTENT_TYPES.includes(t)) || [],
                        customContentTypes: data.contentTypes?.filter((t: string) => !CONTENT_TYPES.includes(t)) || [],
                        whoAppearsInContent: data.whoAppearsInContent || [],
                        experienceTime: data.experienceTime || "",
                        collaborationPreference: data.collaborationPreference || "",
                        hasBrandExperience: data.hasBrandExperience || false
                    });

                    // Notification settings
                    if (data.settings) {
                        setNotificationSettings({ ...notificationSettings, ...data.settings });
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleNicheToggle = (niche: string) => {
        setProfileData(prev => ({
            ...prev,
            niche: prev.niche.includes(niche)
                ? prev.niche.filter(n => n !== niche)
                : [...prev.niche, niche]
        }));
    };

    const handleContentTypeToggle = (type: string) => {
        setProfileData(prev => ({
            ...prev,
            contentTypes: prev.contentTypes.includes(type)
                ? prev.contentTypes.filter(t => t !== type)
                : [...prev.contentTypes, type]
        }));
    };

    const handleWhoAppearsToggle = (option: string) => {
        setProfileData(prev => ({
            ...prev,
            whoAppearsInContent: prev.whoAppearsInContent.includes(option)
                ? prev.whoAppearsInContent.filter(o => o !== option)
                : [...prev.whoAppearsInContent, option]
        }));
    };

    const addCustomContentType = () => {
        if (customContentType.trim() && !profileData.customContentTypes.includes(customContentType.trim())) {
            setProfileData(prev => ({
                ...prev,
                customContentTypes: [...prev.customContentTypes, customContentType.trim()]
            }));
            setCustomContentType("");
        }
    };

    const removeCustomContentType = (type: string) => {
        setProfileData(prev => ({
            ...prev,
            customContentTypes: prev.customContentTypes.filter(t => t !== type)
        }));
    };

    const handleToggle = (key: string) => {
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    const handleSave = async () => {
        if (!user) return;

        // Validation
        if (profileData.niche.length === 0) {
            toast.error("Por favor selecciona al menos un nicho");
            return;
        }
        if (profileData.contentTypes.length === 0 && profileData.customContentTypes.length === 0) {
            toast.error("Por favor selecciona al menos un tipo de contenido");
            return;
        }
        if (profileData.whoAppearsInContent.length === 0) {
            toast.error("Por favor selecciona quién aparece en tu contenido");
            return;
        }
        if (!profileData.experienceTime) {
            toast.error("Por favor indica tu tiempo de experiencia");
            return;
        }
        if (!profileData.collaborationPreference) {
            toast.error("Por favor indica tu preferencia de colaboración");
            return;
        }

        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                bio: profileData.bio,
                niche: profileData.niche,
                contentTypes: [...profileData.contentTypes, ...profileData.customContentTypes],
                whoAppearsInContent: profileData.whoAppearsInContent,
                experienceTime: profileData.experienceTime,
                collaborationPreference: profileData.collaborationPreference,
                hasBrandExperience: profileData.hasBrandExperience,
                settings: notificationSettings,
                updatedAt: new Date().toISOString()
            });
            toast.success("Configuración guardada exitosamente");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Configuración"
                    subtitle="Administra tus preferencias de cuenta y perfil"
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl">
                        {/* Profile Information */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Información del Perfil</CardTitle>
                                <CardDescription>Actualiza tu información visible para las marcas</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Biografía Corta</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Cuéntanos un poco sobre ti..."
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
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
                                                    checked={profileData.niche.includes(niche)}
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

                                <Separator />

                                {/* Content Types */}
                                <div className="space-y-3">
                                    <Label>¿Qué tipo de contenido UGC creas? *</Label>
                                    <p className="text-sm text-muted-foreground">Puedes seleccionar más de una opción.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {CONTENT_TYPES.map((type) => (
                                            <div key={type} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`content-${type}`}
                                                    checked={profileData.contentTypes.includes(type)}
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
                                    {profileData.customContentTypes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {profileData.customContentTypes.map((type) => (
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

                                <Separator />

                                {/* Who Appears in Content */}
                                <div className="space-y-3">
                                    <Label>¿Quiénes suelen aparecer en tu contenido UGC? *</Label>
                                    <p className="text-sm text-muted-foreground">Puedes seleccionar más de una opción.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {WHO_APPEARS.map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`who-${option}`}
                                                    checked={profileData.whoAppearsInContent.includes(option)}
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

                                <Separator />

                                {/* Experience Time */}
                                <div className="space-y-3">
                                    <Label>¿Cuánto tiempo tienes creando contenido UGC? *</Label>
                                    <RadioGroup
                                        value={profileData.experienceTime}
                                        onValueChange={(value) => setProfileData(prev => ({ ...prev, experienceTime: value }))}
                                    >
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

                                <Separator />

                                {/* Collaboration Preference */}
                                <div className="space-y-3">
                                    <Label>Colaboraciones y disponibilidad. ¿Con qué tipo de acuerdos te interesa colaborar? *</Label>
                                    <p className="text-sm text-muted-foreground">Esta preferencia es definitiva para el matching con marcas.</p>
                                    <RadioGroup
                                        value={profileData.collaborationPreference}
                                        onValueChange={(value) => setProfileData(prev => ({ ...prev, collaborationPreference: value }))}
                                    >
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

                                <Separator />

                                {/* Brand Experience */}
                                <div className="space-y-3">
                                    <Label>¿Tienes experiencia trabajando con marcas? *</Label>
                                    <RadioGroup
                                        value={profileData.hasBrandExperience ? "Si" : "No"}
                                        onValueChange={(value) => setProfileData(prev => ({ ...prev, hasBrandExperience: value === "Si" }))}
                                    >
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
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Notificaciones</CardTitle>
                                <CardDescription>Elige cómo quieres ser notificado</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Notificaciones por Email</Label>
                                        <p className="text-sm text-muted-foreground">Recibe actualizaciones sobre nuevas oportunidades</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.emailNotifications}
                                        onCheckedChange={() => handleToggle('emailNotifications')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Notificaciones Push</Label>
                                        <p className="text-sm text-muted-foreground">Obtén alertas instantáneas en tu dispositivo</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.pushNotifications}
                                        onCheckedChange={() => handleToggle('pushNotifications')}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Privacidad</CardTitle>
                                <CardDescription>Controla quién puede ver los detalles de tu perfil</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Perfil Público</Label>
                                        <p className="text-sm text-muted-foreground">Permite que las marcas descubran tu perfil</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.publicProfile}
                                        onCheckedChange={() => handleToggle('publicProfile')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Mostrar Insignia de Ganancias</Label>
                                        <p className="text-sm text-muted-foreground">Muestra una insignia si eres un top earner</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.showEarnings}
                                        onCheckedChange={() => handleToggle('showEarnings')}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={saving} variant="hero">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
