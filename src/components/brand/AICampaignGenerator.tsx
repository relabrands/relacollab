import { useState } from "react";
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AIGeneratedCampaign {
    title: string;
    description: string;
    goal: "awareness" | "conversion" | "content";
    brandVibe: string[];
    audience: string;
    goals: string[];
}

interface AICampaignGeneratorProps {
    brandName?: string;
    onGenerated: (data: AIGeneratedCampaign) => void;
}

const CLOUD_FN_URL = "https://us-central1-rella-collab.cloudfunctions.net/generateCampaign";

// Rotating messages shown during generation
const LOADING_MESSAGES = [
    "La IA está diseñando tu campaña...",
    "Analizando el mejor enfoque para tu marca...",
    "Seleccionando el tono y estilo perfecto...",
    "Definiendo objetivos y público ideal...",
    "Casi listo, puliendo los detalles...",
];

export function AICampaignGenerator({ brandName, onGenerated }: AICampaignGeneratorProps) {
    const [open, setOpen] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);

    const handleGenerate = async () => {
        if (prompt.trim().length < 10) {
            toast.error("Describe tu campaña con un poco más de detalle");
            return;
        }

        setLoading(true);
        setMsgIndex(0);

        // Cycle through loading messages
        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        }, 2200);

        try {
            const response = await fetch(CLOUD_FN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim(), brandName: brandName || "" }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Error desconocido");
            }

            onGenerated(data.campaign as AIGeneratedCampaign);
            toast.success("✨ Campaña generada — revisa los campos y ajusta lo que necesites");
            setOpen(false); // Collapse after success
        } catch (err: any) {
            console.error("AI Campaign error:", err);
            toast.error(err.message || "No se pudo generar la campaña. Intenta de nuevo.");
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    return (
        <div className="mb-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#1a0533]/80 to-[#0d0d1a]/80 backdrop-blur-sm overflow-hidden shadow-lg shadow-purple-900/20">
            {/* ── Header / toggle ─────────────────────────────────────── */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-700/40">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Asistente IA de Campañas</p>
                        <p className="text-xs text-purple-300/70">Describe tu idea y Gemini generará todo por ti</p>
                    </div>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-purple-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                )}
            </button>

            {/* ── Body ────────────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 space-y-4">
                            {/* Top gradient separator */}
                            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ej: Somos una cafetería en Caracas que quiere colaborar con creadores para mostrar nuestra nueva colección de bebidas de temporada. Buscamos contenido auténtico y lifestyle para redes sociales..."
                                rows={4}
                                disabled={loading}
                                className="bg-white/5 border-purple-500/25 text-white placeholder:text-purple-300/40 resize-none focus:border-purple-500/60 focus:ring-purple-500/20 text-sm"
                            />

                            {/* Loading shimmer */}
                            <AnimatePresence mode="wait">
                                {loading && (
                                    <motion.div
                                        key="shimmer"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="space-y-3"
                                    >
                                        {/* Animated message */}
                                        <motion.p
                                            key={msgIndex}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="text-sm text-purple-300 font-medium flex items-center gap-2"
                                        >
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                                            {LOADING_MESSAGES[msgIndex]}
                                        </motion.p>

                                        {/* Shimmer bars */}
                                        {[80, 60, 90, 45].map((w, i) => (
                                            <div
                                                key={i}
                                                style={{ width: `${w}%` }}
                                                className="h-3 rounded-full bg-gradient-to-r from-purple-800/40 via-purple-600/30 to-purple-800/40 animate-pulse"
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Generate button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || prompt.trim().length < 10}
                                className="w-full gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-700/30 transition-all duration-200 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Wand2 className="w-4 h-4" />
                                )}
                                {loading ? "Generando campaña..." : "Generar con IA"}
                            </Button>

                            <p className="text-[11px] text-center text-purple-400/50">
                                Powered by Gemini 2.5 Flash · Los campos del formulario se llenarán automáticamente
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
