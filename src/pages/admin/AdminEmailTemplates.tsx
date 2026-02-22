import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, Save, Eye, Code, Send, RefreshCw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

const TEMPLATE_LABELS: Record<string, { name: string; description: string; badge: string }> = {
    welcome_creator: { name: "Bienvenida — Creador", description: "Al registrarse un nuevo creador", badge: "Creador" },
    welcome_brand: { name: "Bienvenida — Marca", description: "Al registrarse una nueva marca", badge: "Marca" },
    application_received: { name: "Nueva Aplicación", description: "La marca recibe una aplicación", badge: "Marca" },
    invitation_received: { name: "Invitación de Campaña", description: "El creador es invitado a colaborar", badge: "Creador" },
    application_approved: { name: "Aplicación Aprobada", description: "El creador es aprobado en campaña", badge: "Creador" },
    application_rejected: { name: "Aplicación Rechazada", description: "El creador no fue seleccionado", badge: "Creador" },
    content_submitted: { name: "Contenido Enviado", description: "La marca recibe contenido para revisar", badge: "Marca" },
    content_revision: { name: "Revisión Solicitada", description: "El creador recibe feedback de la marca", badge: "Creador" },
    content_approved: { name: "Contenido Aprobado", description: "El creador sabe que su contenido fue aprobado", badge: "Creador" },
    new_message: { name: "Nuevo Mensaje", description: "Notificación de mensaje entrante", badge: "Todos" },
    visit_scheduled: { name: "Visita Programada", description: "Al confirmar una visita presencial", badge: "Creador" },
};

export default function AdminEmailTemplates() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [editSubject, setEditSubject] = useState("");
    const [editHtml, setEditHtml] = useState("");
    const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState(user?.email || "");
    const [sending, setSending] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "emailTemplates"));
            const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTemplates(loaded);
        } catch (err) {
            toast.error("Error al cargar plantillas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const openEditor = (template: any) => {
        setSelectedTemplate(template);
        setEditSubject(template.subject || "");
        setEditHtml(template.html || "");
        setActiveTab("editor");
        setIsOpen(true);
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "emailTemplates", selectedTemplate.id), {
                ...selectedTemplate,
                subject: editSubject,
                html: editHtml,
                updatedAt: new Date().toISOString(),
            });
            toast.success("Plantilla guardada exitosamente");
            setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? { ...t, subject: editSubject, html: editHtml } : t));
        } catch {
            toast.error("Error al guardar la plantilla");
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!testEmail || !selectedTemplate) return;
        setSending(true);
        try {
            const res = await fetch("https://us-central1-rela-collab.cloudfunctions.net/sendTestEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate.id,
                    toEmail: testEmail,
                    vars: {
                        name: "Admin Test",
                        creatorName: "Carlos Test",
                        brandName: "Marca Prueba",
                        campaignTitle: "Campaña de Prueba",
                        budget: "$500",
                        feedback: "El contenido necesita ajustes de iluminación.",
                        messagePreview: "Este es un mensaje de prueba desde el sistema.",
                    },
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Email de prueba enviado a ${testEmail}`);
            } else {
                toast.error("Error al enviar email de prueba");
            }
        } catch {
            toast.error("Error de conexión al enviar email");
        } finally {
            setSending(false);
        }
    };

    const handleSeedTemplates = async () => {
        setSeeding(true);
        try {
            const res = await fetch("https://us-central1-rela-collab.cloudfunctions.net/seedEmailTemplates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${data.templatesSeeded} plantillas creadas en Firestore`);
                await fetchTemplates();
            } else {
                toast.error("Error al crear las plantillas");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setSeeding(false);
        }
    };

    const badgeColor: Record<string, string> = {
        Creador: "bg-accent/10 text-accent",
        Marca: "bg-primary/10 text-primary",
        Todos: "bg-muted text-muted-foreground",
    };

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <MobileNav type="admin" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <DashboardHeader
                        title="Plantillas de Email"
                        subtitle="Edita el asunto y HTML de cada notificación enviada por la plataforma"
                    />
                    <Button onClick={handleSeedTemplates} variant="outline" size="sm" disabled={seeding}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${seeding ? "animate-spin" : ""}`} />
                        {seeding ? "Creando..." : "Seed / Reset Plantillas"}
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl bg-white/5">
                        <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No hay plantillas. Haz clic en "Seed Plantillas" para crearlas.</p>
                        <Button onClick={handleSeedTemplates} disabled={seeding}>
                            {seeding ? "Creando..." : "Crear Plantillas por Defecto"}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template, i) => {
                            const meta = TEMPLATE_LABELS[template.id] || { name: template.id, description: "", badge: "Todos" };
                            return (
                                <motion.div
                                    key={template.id}
                                    className="glass-card p-5 hover-lift cursor-pointer group"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => openEditor(template)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm">{meta.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor[meta.badge] || badgeColor["Todos"]}`}>
                                                    {meta.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">{meta.description}</p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">
                                                {template.subject || "Sin asunto"}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-1" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Editor Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col gap-0 p-0 overflow-hidden">
                    <SheetHeader className="px-6 py-4 border-b bg-sidebar flex-shrink-0">
                        <SheetTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            {TEMPLATE_LABELS[selectedTemplate?.id]?.name || selectedTemplate?.id}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Subject */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asunto del Email</Label>
                            <Input
                                value={editSubject}
                                onChange={e => setEditSubject(e.target.value)}
                                placeholder="Asunto del email..."
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Variables hint */}
                        {selectedTemplate?.variables && (
                            <div className="p-3 bg-muted/50 rounded-lg border border-border/60">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Variables disponibles:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate.variables.map((v: string) => (
                                        <code key={v} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            {`{{${v}}}`}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-2">
                            <Button
                                variant={activeTab === "editor" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveTab("editor")}
                            >
                                <Code className="w-4 h-4 mr-1.5" /> Editor HTML
                            </Button>
                            <Button
                                variant={activeTab === "preview" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveTab("preview")}
                            >
                                <Eye className="w-4 h-4 mr-1.5" /> Vista Previa
                            </Button>
                        </div>

                        {activeTab === "editor" ? (
                            <textarea
                                value={editHtml}
                                onChange={e => setEditHtml(e.target.value)}
                                className="w-full h-96 font-mono text-xs bg-sidebar text-sidebar-foreground p-4 rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="border rounded-lg overflow-hidden h-96">
                                <iframe
                                    srcDoc={editHtml}
                                    className="w-full h-full bg-white"
                                    title="Email Preview"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        )}

                        {/* Test Send */}
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/60 space-y-3">
                            <p className="text-sm font-semibold">Enviar Email de Prueba</p>
                            <div className="flex gap-2">
                                <Input
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    placeholder="email@ejemplo.com"
                                    type="email"
                                    className="text-sm flex-1"
                                />
                                <Button onClick={handleTestSend} disabled={sending} size="sm" variant="outline">
                                    <Send className="w-4 h-4 mr-2" />
                                    {sending ? "Enviando..." : "Enviar"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Se enviará con variables de ejemplo para verificar el diseño.</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-background/50 flex-shrink-0">
                        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
