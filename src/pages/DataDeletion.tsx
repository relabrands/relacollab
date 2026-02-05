import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function DataDeletion() {
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
                    <h1 className="text-3xl font-bold mb-6">Eliminación de datos de usuario</h1>

                    <p className="mb-6">
                        Los usuarios de RELA Collab pueden solicitar la eliminación de sus datos personales y de la información asociada a sus cuentas conectadas (incluyendo datos de Instagram) en cualquier momento.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">Para solicitar la eliminación de datos, el usuario puede:</h2>
                    <ul className="list-disc pl-6 mb-6 space-y-2">
                        <li>
                            Desconectar su cuenta de Instagram desde la configuración de su cuenta en RELA Collab, lo que detendrá inmediatamente el acceso a sus datos.
                        </li>
                        <li>
                            Enviar una solicitud de eliminación de datos al correo electrónico de contacto indicado abajo.
                        </li>
                    </ul>

                    <p className="mb-6">
                        Una vez recibida la solicitud, eliminaremos de forma segura los datos asociados en un plazo razonable, salvo aquellos que debamos conservar por obligaciones legales.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">Correo de contacto:</h2>
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
