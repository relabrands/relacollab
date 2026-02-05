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
                    <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
                    <p className="text-muted-foreground mb-8">Última actualización: 04 de febrero 2026</p>

                    <p className="mb-6">
                        En RELA Collab (en adelante, “la Plataforma”), valoramos y respetamos la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información cuando los usuarios conectan sus cuentas de redes sociales, incluyendo Instagram, a nuestra plataforma.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Información que recopilamos</h2>
                    <p className="mb-4">
                        Cuando un usuario utiliza nuestra plataforma y decide conectar su cuenta de Instagram a través de los servicios de autenticación de Meta, podemos recopilar la siguiente información únicamente con su autorización explícita:
                    </p>

                    <h3 className="text-xl font-medium mt-6 mb-2">a) Información básica del perfil</h3>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Identificador de usuario</li>
                        <li>Nombre público</li>
                        <li>Foto de perfil</li>
                        <li>Dirección de correo electrónico (si el usuario la autoriza)</li>
                    </ul>

                    <h3 className="text-xl font-medium mt-6 mb-2">b) Información de Instagram (cuentas Business o Creator)</h3>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Identificador de la cuenta de Instagram</li>
                        <li>Publicaciones (posts y reels)</li>
                        <li>Fechas de publicación</li>
                        <li>Métricas e insights asociados a las publicaciones, tales como:
                            <ul className="list-circle pl-6 mt-1 space-y-1">
                                <li>Alcance</li>
                                <li>Impresiones</li>
                                <li>Interacciones</li>
                                <li>Engagement</li>
                                <li>Métricas de rendimiento de contenido</li>
                            </ul>
                        </li>
                    </ul>
                    <p className="font-medium mt-4 p-4 bg-muted rounded-lg border">
                        📌 No accedemos a contraseñas, mensajes privados ni información personal sensible.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cómo utilizamos la información</h2>
                    <p className="mb-4">La información recopilada se utiliza exclusivamente para:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Permitir al usuario visualizar y analizar sus métricas de Instagram dentro de la plataforma.</li>
                        <li>Mostrar publicaciones y datos de rendimiento seleccionados por el propio usuario.</li>
                        <li>Mejorar la experiencia del usuario mediante análisis de contenido y desempeño.</li>
                        <li>Proveer funcionalidades relacionadas con análisis, visualización y gestión de contenido.</li>
                    </ul>
                    <p className="mb-4">
                        La información no se utiliza para publicidad, no se vende, no se comparte con terceros sin el consentimiento del usuario.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Base legal y consentimiento</h2>
                    <p className="mb-4">El acceso a la información se realiza únicamente cuando:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>El usuario conecta voluntariamente su cuenta de Instagram.</li>
                        <li>El usuario otorga los permisos correspondientes a través del sistema de autenticación de Meta.</li>
                        <li>El usuario puede revocar estos permisos en cualquier momento desde la configuración de su cuenta de Meta o Instagram.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Almacenamiento y seguridad de los datos</h2>
                    <p className="mb-4">Implementamos medidas técnicas y organizativas razonables para proteger la información, incluyendo:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Almacenamiento seguro de tokens de acceso.</li>
                        <li>Acceso restringido a la información.</li>
                        <li>Uso de conexiones cifradas (HTTPS).</li>
                    </ul>
                    <p className="mb-4">
                        Los datos se conservan únicamente mientras el usuario mantenga su cuenta conectada a la plataforma o según sea necesario para prestar el servicio.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Eliminación de datos</h2>
                    <p className="mb-4">El usuario puede solicitar la eliminación de sus datos en cualquier momento:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Desconectando su cuenta de Instagram desde la plataforma.</li>
                        <li>Contactándonos directamente a través del correo indicado abajo.</li>
                    </ul>
                    <p className="mb-4">
                        Una vez solicitada la eliminación, los datos asociados serán eliminados de forma segura en un plazo razonable.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Compartición de información</h2>
                    <p className="mb-4">
                        No compartimos información del usuario con terceros, salvo cuando sea requerido por ley o para cumplir con obligaciones legales aplicables.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cumplimiento con las políticas de Meta</h2>
                    <p className="mb-4">El uso de datos obtenidos desde Instagram y Facebook cumple con:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Las Políticas de la Plataforma de Meta</li>
                        <li>Las Políticas de Datos de Instagram</li>
                    </ul>
                    <p className="mb-4">
                        La información obtenida se utiliza únicamente para los fines aprobados y descritos en esta política.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cambios a esta política</h2>
                    <p className="mb-4">
                        Nos reservamos el derecho de actualizar esta Política de Privacidad cuando sea necesario. Cualquier cambio será publicado en esta misma página con la fecha de actualización correspondiente.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contacto</h2>
                    <p className="mb-4">
                        Si tienes preguntas sobre esta Política de Privacidad o el tratamiento de tus datos, puedes contactarnos en:
                    </p>
                    <div className="p-4 bg-muted rounded-lg border">
                        <p>📧 Correo: collab@relabrands.com</p>
                        <p>🌐 Sitio web: https://www.relacollab.com</p>
                    </div>

                    <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-8">
                        &copy; 2026 RELA Collab. Todos los derechos reservados.
                    </div>
                </div>
            </main>
        </div>
    );
}
