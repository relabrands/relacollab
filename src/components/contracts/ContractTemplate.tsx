import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContractTemplateProps {
    contract: {
        contractId?: string;
        campaign: {
            title: string;
            description?: string;
            deliverables?: { type: string; quantity: number; platform?: string; required?: boolean }[];
            compensationType: string;
            creatorPayment?: number;
            exchangeDetails?: string;
            deadline?: string;
            location?: string;
        };
        brand: {
            displayName: string;
            email?: string;
            logo?: string;
        };
        creator: {
            displayName: string;
            email?: string;
            instagram?: string;
            avatar?: string;
        };
        status?: string;
        signedByCreatorAt?: string;
        createdAt?: string;
    };
    showDownload?: boolean;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return new Date().toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" });
    return new Date(dateStr).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" });
}

function getCompensationLabel(type: string) {
    if (type === "monetary") return "Pago Monetario";
    if (type === "exchange") return "Intercambio de Producto";
    if (type === "hybrid") return "Pago Mixto (Monetario + Producto)";
    return type;
}

export function ContractTemplate({ contract, showDownload = false }: ContractTemplateProps) {
    const { campaign, brand, creator } = contract;
    const signedDate = contract.signedByCreatorAt || contract.createdAt || new Date().toISOString();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="font-sans">
            {showDownload && (
                <div className="flex justify-end mb-4 print:hidden">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </Button>
                </div>
            )}

            {/* Contract Document */}
            <div
                id="contract-document"
                className="bg-white text-gray-900 rounded-xl border border-border p-8 space-y-6 print:shadow-none print:border-none print:p-4"
                style={{ fontFamily: "Georgia, serif" }}
            >
                {/* Header */}
                <div className="text-center space-y-2 pb-6 border-b-2 border-gray-900">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <FileText className="w-6 h-6 text-gray-700" />
                        <span className="text-xs font-sans font-semibold tracking-widest uppercase text-gray-500">RELA Collab — Plataforma de Colaboración Digital</span>
                    </div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Acuerdo de Colaboración</h1>
                    <h2 className="text-lg font-semibold">para Contenido Digital UGC</h2>
                    <p className="text-sm text-gray-500 font-sans">Fecha del acuerdo: {formatDate(signedDate)}</p>
                </div>

                {/* Parties */}
                <section className="space-y-4">
                    <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">I. Las Partes</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs font-sans font-bold uppercase text-gray-500 tracking-widest">Marca (Contratante)</p>
                            <p className="font-bold text-lg">{brand.displayName}</p>
                            {brand.email && <p className="text-sm text-gray-600 font-sans">{brand.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-sans font-bold uppercase text-gray-500 tracking-widest">Creador de Contenido</p>
                            <p className="font-bold text-lg">{creator.displayName}</p>
                            {creator.email && <p className="text-sm text-gray-600 font-sans">{creator.email}</p>}
                            {creator.instagram && <p className="text-sm text-gray-600 font-sans">@{creator.instagram.replace("@", "")}</p>}
                        </div>
                    </div>
                </section>

                {/* Campaign */}
                <section className="space-y-3">
                    <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">II. La Campaña</h3>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <span className="font-semibold w-28 shrink-0 font-sans text-sm">Campaña:</span>
                            <span className="font-bold">{campaign.title}</span>
                        </div>
                        {campaign.location && (
                            <div className="flex gap-2">
                                <span className="font-semibold w-28 shrink-0 font-sans text-sm">Ubicación:</span>
                                <span>{campaign.location}</span>
                            </div>
                        )}
                        {campaign.deadline && (
                            <div className="flex gap-2">
                                <span className="font-semibold w-28 shrink-0 font-sans text-sm">Fecha límite:</span>
                                <span>{formatDate(campaign.deadline)}</span>
                            </div>
                        )}
                    </div>
                    {campaign.description && (
                        <p className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-3 rounded-lg font-sans border border-gray-200">
                            {campaign.description}
                        </p>
                    )}
                </section>

                {/* Deliverables */}
                {campaign.deliverables && campaign.deliverables.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">III. Entregables</h3>
                        <table className="w-full text-sm font-sans border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="text-left p-2 border border-gray-200 font-semibold">#</th>
                                    <th className="text-left p-2 border border-gray-200 font-semibold">Tipo de Contenido</th>
                                    <th className="text-left p-2 border border-gray-200 font-semibold">Cantidad</th>
                                    <th className="text-left p-2 border border-gray-200 font-semibold">Plataforma</th>
                                    <th className="text-left p-2 border border-gray-200 font-semibold">Requerido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaign.deliverables.map((d, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="p-2 border border-gray-200">{i + 1}</td>
                                        <td className="p-2 border border-gray-200 font-medium">{d.type}</td>
                                        <td className="p-2 border border-gray-200">{d.quantity}</td>
                                        <td className="p-2 border border-gray-200">{d.platform || "—"}</td>
                                        <td className="p-2 border border-gray-200">{d.required !== false ? "Sí" : "No"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Compensation */}
                <section className="space-y-3">
                    <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">IV. Compensación</h3>
                    <div className="space-y-2 font-sans text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-dotted border-gray-300">
                            <span className="font-semibold">Tipo:</span>
                            <span>{getCompensationLabel(campaign.compensationType)}</span>
                        </div>
                        {(campaign.compensationType === "monetary" || campaign.compensationType === "hybrid") && campaign.creatorPayment != null && (
                            <div className="flex justify-between items-center py-1 border-b border-dotted border-gray-300">
                                <span className="font-semibold">Monto acordado:</span>
                                <span className="font-bold text-base">${campaign.creatorPayment.toLocaleString()} USD</span>
                            </div>
                        )}
                        {campaign.exchangeDetails && (
                            <div className="flex justify-between items-start py-1 border-b border-dotted border-gray-300 gap-4">
                                <span className="font-semibold shrink-0">Producto/Intercambio:</span>
                                <span className="text-right">{campaign.exchangeDetails}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-start py-1 gap-4">
                            <span className="font-semibold shrink-0">Momento de compensación:</span>
                            <span className="text-right flex flex-col gap-1">
                                {campaign.compensationType === 'monetary' && (
                                    <span>Pago: Al culminar la campaña y aprobarse el contenido final.</span>
                                )}
                                {campaign.compensationType === 'exchange' && (
                                    <span>Producto: Envío/retiro dentro de los 5 días tras ser aprobado en la campaña.</span>
                                )}
                                {campaign.compensationType === 'hybrid' && (
                                    <>
                                        <span>Producto: Envío/retiro dentro de los 5 días tras ser aprobado en la campaña.</span>
                                        <span>Pago: Al culminar la campaña y aprobarse el contenido final.</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Clauses */}
                <section className="space-y-3">
                    <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">V. Términos y Condiciones</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm font-sans text-gray-700 leading-relaxed">
                        <li>El Creador se compromete a entregar el contenido acordado antes de la fecha límite establecida y a cumplir con las especificaciones creativas indicadas por la Marca.</li>
                        <li>En caso de incluir intercambio de producto, la Marca se compromete a enviar o coordinar la entrega del mismo al Creador dentro de los 5 días hábiles posteriores a su aprobación en la campaña, para que pueda realizar el contenido.</li>
                        <li>En caso de incluir compensación monetaria, la Marca se compromete a realizar el pago acordado dentro de los 5 días hábiles siguientes a la culminación de la campaña y la aprobación del contenido entregado por el Creador.</li>
                        <li>El contenido creado otorga a la Marca una licencia de uso no exclusiva para fines de marketing y publicidad por un período de 12 meses a partir de la entrega.</li>
                        <li>El Creador retiene los derechos morales sobre su contenido y podrá mostrarlo en su portafolio personal.</li>
                        <li>Cualquier modificación a los entregables debe acordarse mutuamente y por escrito a través de la plataforma RELA Collab.</li>
                        <li>En caso de incumplimiento por parte del Creador, la Marca podrá cancelar el acuerdo sin obligación de pago. En caso de incumplimiento por parte de la Marca, RELA Collab mediará la disputa.</li>
                        <li>Ambas partes acuerdan mantener confidencialidad sobre los términos comerciales específicos de esta colaboración.</li>
                        <li>RELA Collab actúa únicamente como intermediario que facilita la conexión entre las partes y no asume responsabilidad directa por el cumplimiento del acuerdo.</li>
                    </ol>
                </section>

                {/* Signature */}
                <section className="space-y-4">
                    <h3 className="text-base font-bold uppercase tracking-wide border-b border-gray-300 pb-1">VI. Firma Digital</h3>
                    <div className="grid grid-cols-2 gap-6 font-sans text-sm">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Creador de Contenido</p>
                            <div className="border-t-2 border-gray-400 pt-2">
                                <p className="font-bold">{creator.displayName}</p>
                                {creator.email && <p className="text-gray-600">{creator.email}</p>}
                                <p className="text-xs text-gray-400 mt-1">
                                    ✓ Firmado digitalmente el {formatDate(signedDate)} a través de RELA Collab
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Marca (Contratante)</p>
                            <div className="border-t-2 border-gray-400 pt-2">
                                <p className="font-bold">{brand.displayName}</p>
                                {brand.email && <p className="text-gray-600">{brand.email}</p>}
                                <p className="text-xs text-gray-400 mt-1">
                                    ✓ Campaña publicada y condiciones acordadas a través de RELA Collab
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-4 border-t border-dashed border-gray-300">
                        <p className="text-xs text-gray-400 font-sans">
                            Este contrato fue generado y firmado electrónicamente a través de RELA Collab.<br />
                            ID de Contrato: <span className="font-mono">{contract.contractId || "—"}</span>  ·  Plataforma: relacollab.com
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
