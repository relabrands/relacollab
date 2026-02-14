import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Clock, ShieldCheck } from "lucide-react";

export default function PendingApproval() {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-amber-400">
                <CardHeader className="space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Cuenta en Revisión</CardTitle>
                    <CardDescription className="text-base">
                        Gracias por completar tu perfil, {user?.displayName || "usuario"}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-muted-foreground space-y-4">
                        <p>
                            Tu cuenta está actualmente pendiente de aprobación por parte de nuestro equipo.
                            Revisamos cada perfil cuidadosamente para asegurar la mejor experiencia para marcas y creadores.
                        </p>
                        <div className="bg-amber-50 p-4 rounded-lg text-sm text-left flex gap-3 text-amber-800">
                            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">¿Qué sucede ahora?</p>
                                <p className="mt-1 opacity-90">Te notificaremos por correo electrónico tan pronto como tu cuenta sea activada. Este proceso suele tomar 24-48 horas.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => logout()}
                        variant="outline"
                        className="w-full gap-2 border-dashed"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
