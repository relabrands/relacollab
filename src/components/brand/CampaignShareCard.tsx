import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

interface CampaignShareCardProps {
    campaign: {
        title: string;
        brandName: string;
        brandLogo?: string;
        category?: string;
        id?: string;
    };
    /** Optional custom campaign link, falls back to the app url */
    campaignUrl?: string;
}

export function CampaignShareCard({ campaign, campaignUrl }: CampaignShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const shareUrl =
        campaignUrl ||
        `https://relacollab.com/creator/opportunities?highlight=${campaign.id ?? ""}`;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 3, // High-DPI so text is crisp
                cacheBust: true,
                // Force cross-origin images through a proxy to avoid taint errors
                fetchRequestInit: { mode: "cors" },
            });

            const link = document.createElement("a");
            link.download = `${campaign.title.replace(/\s+/g, "_")}_story.png`;
            link.href = dataUrl;
            link.click();
            toast.success("¡Story descargada exitosamente!");
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Error al descargar. Intenta de nuevo.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* ─── Actual Story Card (9:16) ─────────────────────────────── */}
            <div
                ref={cardRef}
                style={{
                    width: 390,
                    height: 693, // 9:16 ratio
                    background: "linear-gradient(160deg, #120724 0%, #1a0533 40%, #0d0d1a 100%)",
                    borderRadius: 32,
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    boxShadow: "0 32px 80px rgba(120,80,255,0.35)",
                }}
            >
                {/* ── Ambient glow blobs ───────────────────────────────── */}
                <div
                    style={{
                        position: "absolute",
                        top: -80,
                        left: -80,
                        width: 300,
                        height: 300,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(140,80,255,0.28) 0%, transparent 70%)",
                        filter: "blur(40px)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: 60,
                        right: -60,
                        width: 260,
                        height: 260,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(80,120,255,0.22) 0%, transparent 70%)",
                        filter: "blur(40px)",
                        pointerEvents: "none",
                    }}
                />

                {/* ── Top decorative line ──────────────────────────────── */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: "linear-gradient(90deg, transparent, #a855f7, #6366f1, transparent)",
                    }}
                />

                {/* ── Brand Logo ───────────────────────────────────────── */}
                <div
                    style={{
                        marginTop: 52,
                        width: 80,
                        height: 80,
                        borderRadius: 24,
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(120,80,255,0.25)",
                    }}
                >
                    {campaign.brandLogo ? (
                        <img
                            src={campaign.brandLogo}
                            alt={campaign.brandName}
                            crossOrigin="anonymous"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: "white",
                                letterSpacing: -1,
                            }}
                        >
                            {campaign.brandName?.charAt(0)?.toUpperCase() ?? "B"}
                        </span>
                    )}
                </div>

                {/* ── Brand name ───────────────────────────────────────── */}
                <p
                    style={{
                        marginTop: 14,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(200,180,255,0.75)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                    }}
                >
                    {campaign.brandName}
                </p>

                {/* ── Divider ──────────────────────────────────────────── */}
                <div
                    style={{
                        marginTop: 22,
                        width: 48,
                        height: 1.5,
                        background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
                    }}
                />

                {/* ── Tagline (above campaign title) ───────────────────── */}
                <p
                    style={{
                        marginTop: 22,
                        width: 300,
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(200,180,255,0.6)",
                        lineHeight: 1.5,
                        letterSpacing: 0.2,
                    }}
                >
                    We're looking for creators to
                    <br />collaborate with us.
                </p>

                {/* ── Campaign title ───────────────────────────────────── */}
                <h1
                    style={{
                        marginTop: 10,
                        width: 300,
                        textAlign: "center",
                        fontSize: 30,
                        fontWeight: 800,
                        color: "#ffffff",
                        lineHeight: 1.25,
                        letterSpacing: -0.5,
                    }}
                >
                    {campaign.title}
                </h1>

                {/* ── CTA below title ──────────────────────────────────── */}
                <div
                    style={{
                        marginTop: 14,
                        paddingLeft: 20,
                        paddingRight: 20,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderRadius: 999,
                        background: "linear-gradient(90deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))",
                        border: "1px solid rgba(168,85,247,0.45)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e9d5ff",
                        letterSpacing: 0.3,
                    }}
                >
                    Colabora con esta campaña 🚀
                </div>

                {/* ── QR Code area ─────────────────────────────────────── */}
                <div
                    style={{
                        marginTop: 36,
                        width: 170,
                        height: 170,
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.06)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: 16,
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <QRCodeSVG
                        value={shareUrl}
                        size={120}
                        bgColor="transparent"
                        fgColor="#ffffff"
                        level="M"
                    />
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "rgba(200,180,255,0.65)",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            margin: 0,
                        }}
                    >
                        Scan to Join
                    </p>
                </div>



                {/* ── RELA Collab watermark ────────────────────────────── */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 28,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: "linear-gradient(135deg, #a855f7, #6366f1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>R</span>
                    </div>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "rgba(200,180,255,0.5)",
                            letterSpacing: 0.5,
                        }}
                    >
                        RELA Collab
                    </span>
                </div>
            </div>

            {/* ─── Download button ──────────────────────────────────────── */}
            <div className="flex gap-3">
                <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg shadow-purple-500/30"
                >
                    {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    Download for Story
                </Button>
            </div>
        </div>
    );
}
