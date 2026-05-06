import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Instagram, ShieldCheck, CheckCircle2, Layout, Lock, BookOpen } from "lucide-react";

interface InstagramConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const InstagramConnectModal: React.FC<InstagramConnectModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/*
              * max-h-[95dvh]  → never taller than 95% of the visible viewport (dvh = dynamic viewport height, safe on mobile with browser chrome)
              * flex flex-col  → header/content/footer stack vertically
              * overflow-hidden → clip the outer box so only the inner content scrolls
              * p-0 gap-0      → we handle all padding ourselves
            */}
            <DialogContent className="sm:max-w-md w-full max-h-[95dvh] flex flex-col p-0 gap-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-2xl">

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-8 pb-2">

                    <DialogHeader className="text-center flex flex-col items-center gap-4 mb-6">
                        <div className="bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#2458f2] p-3 rounded-2xl shadow-lg">
                            <Instagram className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2 w-full">
                            <DialogTitle className="text-2xl font-bold text-center">
                                Conectar con Instagram
                            </DialogTitle>
                            <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                                Conecta tu cuenta de Instagram con RELA Collab en unos pocos pasos para desbloquear tu AI Profile Analysis.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 pb-2">

                        {/* Steps */}
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">Paso 1: Inicia sesión en Instagram</h4>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Asegúrate de que sea una cuenta de Creador o Empresa.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit shrink-0">
                                    <Layout className="h-5 w-5 text-purple-500" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">Paso 2: Selecciona tu Negocio y Página de Facebook</h4>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        La API de Meta requiere vincular la Fan Page de Facebook conectada a tu Instagram para obtener métricas profesionales.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">Paso 3: Concede permisos</h4>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Esto nos permitirá recuperar tus estadísticas para las marcas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Facebook notice */}
                        <div className="flex items-center gap-2 justify-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>Es posible que debas iniciar sesión en Facebook para continuar.</span>
                        </div>

                        {/* API Trust Badge */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-3">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/3840px-Meta_Platforms_Inc._logo.svg.png"
                                    alt="Meta"
                                    className="h-4 w-auto object-contain opacity-40 brightness-0"
                                />
                                <span className="text-zinc-300">·</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Official Meta API</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 text-center">
                                Conexión segura — RELA Collab nunca almacena tus contraseñas.
                            </p>
                        </div>

                    </div>
                </div>

                {/* ── Fixed footer — always visible, never scrolls away ── */}
                <div className="shrink-0 px-6 pb-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col gap-2">
                    <Button
                        onClick={onConfirm}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                        Empezar
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 gap-2"
                        onClick={() => window.open('/como-conectar-mi-cuenta-de-instagram', '_blank')}
                    >
                        <BookOpen className="h-4 w-4" />
                        Ver tutorial paso a paso
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};
