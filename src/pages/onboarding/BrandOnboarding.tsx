import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Loader2, LogOut, Instagram, Globe, Facebook, Linkedin } from "lucide-react";
import { CREATOR_NICHES } from "@/lib/constants";

const TOTAL_STEPS = 2;

export default function BrandOnboarding() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1 – Company Information
        companyName: "",
        contactPerson: user?.displayName || "",
        website: "",
        industry: "",
        location: "",
        phone: "",
        description: "",
        // Step 2 – Social Links
        instagram: "",
        tiktok: "",
        facebook: "",
        linkedin: "",
    });

    // Pre-fill contact person from Auth displayName once user loads
    useEffect(() => {
        if (user?.displayName && !formData.contactPerson) {
            setFormData(prev => ({ ...prev, contactPerson: user.displayName ?? "" }));
        }
    }, [user?.displayName]);

    const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

    const validateStep = (): boolean => {
        if (step === 1) {
            if (!formData.companyName.trim()) { toast.error("El nombre de la empresa es requerido"); return false; }
            if (!formData.contactPerson.trim()) { toast.error("La persona de contacto es requerida"); return false; }
            if (!formData.phone.trim()) { toast.error("El número de teléfono es requerido"); return false; }
            if (!formData.industry) { toast.error("Selecciona una industria"); return false; }
            return true;
        }
        if (step === 2) return true; // Social links are optional
        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;
        
        if (user) {
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    brandName: formData.companyName,
                    contactPerson: formData.contactPerson,
                    phone: formData.phone,
                    industry: formData.industry,
                    location: formData.location,
                    website: formData.website,
                    description: formData.description,
                    socialLinks: {
                        instagram: formData.instagram,
                        tiktok: formData.tiktok,
                        facebook: formData.facebook,
                        linkedin: formData.linkedin,
                    },
                    onboardingStep: step + 1,
                    onboardingCompleted: false,
                    updatedAt: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error saving step progress", error);
            }
        }
        
        setStep(s => s + 1);
    };

    const handleComplete = async () => {
        if (!validateStep()) return;
        setLoading(true);
        try {
            if (!user) return;
            // Removed plan selection requirement from onboarding
            await updateDoc(doc(db, "users", user.uid), {
                brandName: formData.companyName,
                contactPerson: formData.contactPerson,
                phone: formData.phone,
                website: formData.website,
                industry: formData.industry,
                location: formData.location,
                description: formData.description,
                socialLinks: {
                    instagram: formData.instagram,
                    tiktok: formData.tiktok,
                    facebook: formData.facebook,
                    linkedin: formData.linkedin,
                },
                plan: "Trial Gratis", // Default initial plan
                planId: "trial",
                status: "pending",
                onboardingCompleted: true,
                updatedAt: new Date().toISOString(),
            });
            toast.success("¡Perfil completado! Tu cuenta está siendo revisada.");
            window.location.href = "/pending-approval";
        } catch (error) {
            toast.error("Algo salió mal. Inténtalo de nuevo.");
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

    // ─── Step labels ──────────────────────────────────────────────────────────
    const stepLabels = ["Información de la Empresa", "Redes Sociales"];

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Configura tu Perfil de Marca</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Paso {step} de {TOTAL_STEPS}: {stepLabels[step - 1]}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                </Button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-2">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
                ))}
            </div>

            {/* ── Step 1: Company Information ───────────────────────────────── */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Empresa</CardTitle>
                        <CardDescription>Cuéntanos sobre tu marca para que los creadores puedan encontrarte.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                                <Input id="companyName" placeholder="Ej. ACME Corp" value={formData.companyName} onChange={e => update("companyName", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Persona de Contacto *</Label>
                                <Input id="contactPerson" placeholder="Nombre completo" value={formData.contactPerson} onChange={e => update("contactPerson", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industria *</Label>
                                <Select value={formData.industry} onValueChange={val => update("industry", val)}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona industria" /></SelectTrigger>
                                    <SelectContent>
                                        {CREATOR_NICHES.map(niche => (
                                            <SelectItem key={niche.id} value={niche.id}>
                                                <span>{niche.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Ubicación</Label>
                                <Input id="location" placeholder="Ciudad, País (ej. Santo Domingo, RD)" value={formData.location} onChange={e => update("location", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono de Contacto *</Label>
                                <Input id="phone" type="tel" placeholder="+1 (829) 000-0000" value={formData.phone} onChange={e => update("phone", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Sitio Web</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input id="website" className="pl-9" placeholder="https://tuempresa.com" value={formData.website} onChange={e => update("website", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción de la Marca</Label>
                            <textarea
                                id="description"
                                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                rows={3}
                                placeholder="Breve descripción de tu marca, misión o propuesta de valor..."
                                value={formData.description}
                                onChange={e => update("description", e.target.value)}
                            />
                        </div>

                        <Button onClick={handleNext} className="w-full">
                            Siguiente: Redes Sociales →
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Step 2: Social Links ──────────────────────────────────────── */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Redes Sociales de la Marca</CardTitle>
                        <CardDescription>Agrega los perfiles de tu marca. Los creadores los verán al revisar tu campaña. (Opcional)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input id="instagram" className="pl-9" placeholder="@tumarca o URL completa" value={formData.instagram} onChange={e => update("instagram", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tiktok">TikTok</Label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 4.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.78a4.85 4.85 0 0 1-2.03-.09z" />
                                </svg>
                                <Input id="tiktok" className="pl-9" placeholder="@tumarca o URL completa" value={formData.tiktok} onChange={e => update("tiktok", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input id="facebook" className="pl-9" placeholder="@tumarca o URL completa" value={formData.facebook} onChange={e => update("facebook", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input id="linkedin" className="pl-9" placeholder="URL de la página de empresa" value={formData.linkedin} onChange={e => update("linkedin", e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">← Atrás</Button>
                            <Button onClick={handleComplete} className="flex-1" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Completar Configuración
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
