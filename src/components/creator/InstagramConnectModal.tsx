
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Instagram, ShieldCheck, CheckCircle2, Layout, Lock } from "lucide-react";

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
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="text-center flex flex-col items-center gap-4 pt-6">
                    <div className="bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#2458f2] p-3 rounded-2xl shadow-lg">
                        <Instagram className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-bold">Conectar con Instagram</DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                            Conecta tu cuenta de Instagram con RELA Collab en unos pocos pasos para desbloquear tu AI Profile Analysis.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit">
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
                            <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit">
                                <Layout className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-sm">Paso 2: Selecciona tu Negocio</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    La API de Meta requiere vincular la Fan Page de Facebook conectada a tu Instagram.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg h-fit">
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

                    <div className="flex items-center gap-2 justify-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <Lock className="h-3 w-3" />
                        <span>Asegúrate de tener tu nombre de usuario y contraseña de Instagram a mano.</span>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <Button
                        onClick={onConfirm}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                        Empezar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
