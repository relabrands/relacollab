import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { Loader2, Mail, Bell, Lock, Eye, Shield, ShieldCheck } from "lucide-react";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CreatorSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [accountData, setAccountData] = useState({
        email: "",
        displayName: ""
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        campaignMatches: true,
        campaignUpdates: true,
        deliverableReminders: true,
        paymentNotifications: true,
        pushNotifications: false,
    });

    const [privacySettings, setPrivacySettings] = useState({
        publicProfile: true,
        showMetrics: false,
        allowBrandMessages: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();

                    setAccountData({
                        email: data.email || user.email || "",
                        displayName: data.displayName || ""
                    });

                    // Notification settings
                    if (data.notificationSettings) {
                        setNotificationSettings({ ...notificationSettings, ...data.notificationSettings });
                    }

                    // Privacy settings
                    if (data.privacySettings) {
                        setPrivacySettings({ ...privacySettings, ...data.privacySettings });
                    }
                }
            } catch (error) {
                toast.error("Error al cargar la configuración");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSaveSettings = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                displayName: accountData.displayName,
                notificationSettings,
                privacySettings,
                updatedAt: new Date().toISOString()
            });
            toast.success("Configuración guardada exitosamente");
        } catch (error) {
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast.success("Se ha enviado un correo para restablecer tu contraseña");
        } catch (error) {
            console.error("Error sending reset email:", error);
            toast.error("Error al enviar el correo de restablecimiento");
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Configuración"
                    subtitle="Administra las preferencias de tu cuenta y notificaciones"
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl">
                        {/* Account Information */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" />
                                    <CardTitle>Información de la Cuenta</CardTitle>
                                </div>
                                <CardDescription>Tus datos básicos de cuenta</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Nombre a Mostrar</Label>
                                    <Input
                                        id="displayName"
                                        value={accountData.displayName}
                                        onChange={(e) => setAccountData(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="Tu nombre"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={accountData.email}
                                        disabled
                                        className="bg-muted cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        El correo electrónico no puede ser cambiado. Contacta a soporte si es necesario.
                                    </p>
                                </div>

                                <Separator className="my-4" />

                                <div className="pt-2">
                                    <p className="text-sm font-medium mb-2">Información Profesional</p>
                                    <p className="text-sm text-muted-foreground">
                                        Para editar tu biografía, formatos de contenido, estilo y otros detalles profesionales,
                                        ve a{" "}
                                        <a href="/creator/profile" className="text-primary hover:underline font-medium">
                                            Mi Perfil
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security */}
                        <Card className="glass-card overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10">
                                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Seguridad</CardTitle>
                                        <CardDescription>Protege el acceso a tu cuenta</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-amber-900 dark:text-amber-200">Restablecer Contraseña</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Te enviaremos un correo electrónico con un enlace seguro para que puedas crear una nueva contraseña.
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleResetPassword}
                                        className="w-full border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                                    >
                                        Enviar correo de restablecimiento
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Notifications */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <CardTitle>Notificaciones por Correo</CardTitle>
                                </div>
                                <CardDescription>Elige qué actualizaciones recibes por correo electrónico</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="emailNotifications">Notificaciones por Correo</Label>
                                        <p className="text-sm text-muted-foreground">Recibir todas las notificaciones por correo</p>
                                    </div>
                                    <Switch
                                        id="emailNotifications"
                                        checked={notificationSettings.emailNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4 opacity-100">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="campaignMatches">Coincidencias de Campañas</Label>
                                            <p className="text-sm text-muted-foreground">Nuevas campañas que coinciden con tu perfil</p>
                                        </div>
                                        <Switch
                                            id="campaignMatches"
                                            checked={notificationSettings.campaignMatches}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, campaignMatches: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="campaignUpdates">Actualizaciones de Campañas</Label>
                                            <p className="text-sm text-muted-foreground">Cambios de estado en tus aplicaciones</p>
                                        </div>
                                        <Switch
                                            id="campaignUpdates"
                                            checked={notificationSettings.campaignUpdates}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, campaignUpdates: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="deliverableReminders">Recordatorios de Entregables</Label>
                                            <p className="text-sm text-muted-foreground">Recordatorios para envíos pendientes</p>
                                        </div>
                                        <Switch
                                            id="deliverableReminders"
                                            checked={notificationSettings.deliverableReminders}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, deliverableReminders: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="paymentNotifications">Notificaciones de Pago</Label>
                                            <p className="text-sm text-muted-foreground">Confirmaciones y actualizaciones de pago</p>
                                        </div>
                                        <Switch
                                            id="paymentNotifications"
                                            checked={notificationSettings.paymentNotifications}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, paymentNotifications: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Push Notifications */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    <CardTitle>Notificaciones Push</CardTitle>
                                </div>
                                <CardDescription>Notificaciones del navegador para actualizaciones en tiempo real</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="pushNotifications">Habilitar Notificaciones Push</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Obtén actualizaciones instantáneas en tu navegador
                                        </p>
                                    </div>
                                    <Switch
                                        id="pushNotifications"
                                        checked={notificationSettings.pushNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy Settings */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <CardTitle>Privacidad y Visibilidad</CardTitle>
                                </div>
                                <CardDescription>Controla quién puede ver tu información</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="publicProfile">Perfil Público</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Permitir que las marcas descubran y vean tu perfil
                                        </p>
                                    </div>
                                    <Switch
                                        id="publicProfile"
                                        checked={privacySettings.publicProfile}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, publicProfile: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="showMetrics">
                                            <div className="flex items-center gap-2">
                                                <span>Mostrar Métricas</span>
                                                <Eye className="w-4 h-4" />
                                            </div>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Mostrar recuento de seguidores y tasa de interacción a las marcas
                                        </p>
                                    </div>
                                    <Switch
                                        id="showMetrics"
                                        checked={privacySettings.showMetrics}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, showMetrics: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="allowBrandMessages">Permitir Mensajes de Marcas</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Las marcas pueden enviarte mensajes directos para colaboraciones
                                        </p>
                                    </div>
                                    <Switch
                                        id="allowBrandMessages"
                                        checked={privacySettings.allowBrandMessages}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, allowBrandMessages: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                variant="hero"
                                className="min-w-[150px]"
                            >
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
