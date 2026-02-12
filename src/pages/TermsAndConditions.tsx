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
                    <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Uso - RELA Collab</h1>
                    <p className="text-muted-foreground mb-8">Última actualización: 12 de febrero de 2026</p>

                    <p className="mb-6">
                        Bienvenido a RELA Collab. Al acceder o utilizar nuestra plataforma, usted acepta estar sujeto a los siguientes términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Descripción del Servicio</h2>
                    <p className="mb-4">
                        RELA Collab es un marketplace que conecta a creadores de contenido con marcas para la gestión de campañas de contenido generado por el usuario (UGC). La plataforma facilita la visualización de métricas, la selección de entregables y la gestión de pagos.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Integraciones de Terceros (TikTok e Instagram)</h2>
                    <p className="mb-4">
                        Para proporcionar nuestras funciones principales, RELA Collab utiliza las API oficiales de TikTok e Instagram. Al utilizar estas integraciones, usted acepta lo siguiente:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>TikTok:</strong> Al conectar su cuenta, usted acepta cumplir con los <a href="https://www.tiktok.com/legal/page/row/terms-of-service/es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Términos de Servicio de TikTok</a> y reconoce que RELA Collab utiliza el TikTok Login Kit para acceder a su perfil básico y lista de videos.</li>
                        <li><strong>Instagram:</strong> Al conectar su cuenta de Instagram, usted acepta cumplir con las <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Condiciones de uso de Instagram</a> y las políticas de Meta.</li>
                        <li><strong>Uso de Datos:</strong> Usted otorga permiso a RELA Collab para leer y mostrar sus métricas públicas (seguidores, likes, engagement) y su contenido multimedia con el único fin de gestionar campañas dentro de la plataforma.</li>
                        <li><strong>Revocación:</strong> Usted puede desconectar sus cuentas en cualquier momento desde la sección "My Profile" o directamente desde los ajustes de seguridad de TikTok o Instagram.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Propiedad Intelectual y Licencias</h2>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>Contenido del Creador:</strong> El creador mantiene la propiedad de su contenido. Al enviar un video a una campaña, el creador otorga a RELA Collab y a la Marca contratante una licencia para visualizar, analizar y verificar dicho contenido.</li>
                        <li><strong>Derechos de Marca:</strong> Las marcas conservan todos los derechos sobre sus materiales de campaña compartidos en la plataforma.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Pagos y Comisiones</h2>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li><strong>Comisión de Plataforma:</strong> RELA Collab retiene una comisión de servicio del 10% (o el porcentaje vigente configurado por la administración) sobre el monto bruto acordado entre la marca y el creador.</li>
                        <li><strong>Flujo de Pago:</strong> Los pagos se procesan de forma manual. El creador podrá solicitar el retiro de sus fondos una vez que el contenido sea aprobado por la marca y el balance esté marcado como "Disponible".</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Conducta del Usuario</h2>
                    <p className="mb-4">Está estrictamente prohibido:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Utilizar las integraciones de TikTok o Instagram para actividades fraudulentas o spam.</li>
                        <li>Proporcionar datos bancarios falsos para el retiro de fondos.</li>
                        <li>Incumplir con los entregables acordados en las campañas aceptadas.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitación de Responsabilidad</h2>
                    <p className="mb-4">
                        RELA Collab no se hace responsable de las decisiones tomadas por TikTok o Instagram respecto a la suspensión de cuentas de usuario, ni de fallos técnicos en las API de dichos terceros.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">7. Contacto</h2>
                    <p className="mb-4">
                        Si tiene preguntas sobre estos términos, puede contactarnos en:
                    </p>
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
