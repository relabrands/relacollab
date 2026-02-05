import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsAndConditions() {
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

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Servicio</h1>
                    <p className="text-muted-foreground mb-8">Última actualización: 05 de febrero 2026</p>

                    <p className="mb-6">
                        Al utilizar RELA Collab, aceptas los presentes Términos y Condiciones. Si no estás de acuerdo con ellos, debes abstenerte de usar la plataforma.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Uso de la plataforma</h2>
                    <p className="mb-4">
                        RELA Collab ofrece herramientas que permiten a los usuarios conectar sus cuentas de Instagram para visualizar métricas y publicaciones asociadas a cuentas Business o Creator, conforme a los permisos otorgados por el usuario.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Responsabilidad del usuario</h2>
                    <p className="mb-4">
                        El usuario es responsable de la información que decide conectar y autorizar a través de los servicios de Meta. RELA Collab no accede a contraseñas ni a información privada no autorizada.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Limitaciones</h2>
                    <p className="mb-4">
                        La plataforma se ofrece “tal cual”, y RELA Collab no garantiza la disponibilidad continua de los servicios ni la exactitud absoluta de las métricas proporcionadas por plataformas de terceros.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Propiedad intelectual</h2>
                    <p className="mb-4">
                        Todos los derechos sobre la plataforma, su diseño y funcionalidades pertenecen a RELA Collab.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Modificaciones</h2>
                    <p className="mb-4">
                        RELA Collab puede modificar estos términos en cualquier momento. Las actualizaciones se publicarán en esta misma página.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Contacto</h2>
                    <div className="p-4 bg-muted rounded-lg border inline-block">
                        <p>📧 collab@relabrands.com</p>
                    </div>

                    <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-8">
                        &copy; 2026 RELA Collab. Todos los derechos reservados.
                    </div>
                </div>
            </main>
        </div>
    );
}
