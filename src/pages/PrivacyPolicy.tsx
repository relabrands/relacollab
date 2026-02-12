import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <div className="font-bold text-xl">RELA Collab</div>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold mb-6">Política de Privacidad - RELA Collab</h1>
                    <p className="text-muted-foreground mb-8">Última actualización: 12 de febrero de 2026</p>

                    <p className="mb-6">
                        En RELA Collab, la privacidad de nuestros creadores y marcas es una prioridad. Esta política detalla cómo recopilamos, usamos y protegemos su información al utilizar nuestra plataforma y nuestras integraciones con terceros.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Información que Recopilamos</h2>
                    <p className="mb-4">
                        Recopilamos información para proporcionar un mejor servicio a todos nuestros usuarios:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>Información de Registro:</strong> Nombre, correo electrónico, ubicación y datos de perfil profesional.</li>
                        <li><strong>Integración con TikTok (Login Kit):</strong> Al conectar su cuenta, accedemos a su nombre de usuario, foto de perfil, estadísticas de rendimiento (seguidores, likes, engagement) y su lista de videos públicos para facilitar la entrega de campañas.</li>
                        <li><strong>Integración con Instagram (Graph API):</strong> Accedemos a métricas de perfil y contenido multimedia seleccionado por el usuario para fines de reporte de campaña.</li>
                        <li><strong>Datos de Pago:</strong> Para procesar retiros, recopilamos información bancaria necesaria para realizar transferencias manuales en la República Dominicana.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Uso de la Información</h2>
                    <p className="mb-4">Los datos obtenidos a través de las API de TikTok e Instagram se utilizan exclusivamente para:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Visualizar el rendimiento de la cuenta del creador mediante nuestro AI Profile Analysis.</li>
                        <li>Permitir al creador seleccionar y enviar contenido específico como entregable de una campaña activa.</li>
                        <li>Proporcionar a las marcas métricas verificadas sobre el impacto de su inversión.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Protección y Almacenamiento</h2>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>No Venta de Datos:</strong> RELA Collab no vende, alquila ni distribuye su información personal o datos obtenidos de redes sociales a terceros con fines publicitarios ajenos a la plataforma.</li>
                        <li><strong>Seguridad:</strong> Implementamos medidas de seguridad técnicas para proteger sus datos contra el acceso no autorizado.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Control del Usuario y Borrado de Datos</h2>
                    <p className="mb-4">Usted tiene control total sobre sus datos:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>Desconexión:</strong> Puede revocar el acceso de RELA Collab a sus cuentas de redes sociales en cualquier momento desde la sección "Social Connections" en su perfil o desde los ajustes de seguridad de TikTok/Instagram.</li>
                        <li><strong>Solicitud de Borrado:</strong> Si desea eliminar permanentemente su cuenta y todos los datos asociados de nuestros servidores, puede enviar una solicitud formal al correo collab@relabrands.com. Procesaremos su solicitud en un plazo máximo de 30 días hábiles.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cumplimiento con Terceros</h2>
                    <p className="mb-4">
                        RELA Collab cumple estrictamente con las políticas para desarrolladores de TikTok y las políticas de datos de Meta (Instagram). Al usar nuestra app, usted también está sujeto a las políticas de privacidad de dichas plataformas.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contacto</h2>
                    <p className="mb-4">
                        Para cualquier duda sobre esta política, puede contactarnos en:
                    </p>
                    <div className="p-4 bg-muted rounded-lg border inline-block">
                        <p>📧 collab@relacollab.com</p>
                    </div>

                    <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-8">
                        &copy; 2026 RELA Collab. Todos los derechos reservados.
                    </div>
                </div>
            </main>
        </div>
    );
}
