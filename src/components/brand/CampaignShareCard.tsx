import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CampaignShareCardProps {
    campaign: {
        title: string;
        brandName: string;
        brandLogo?: string;
        id?: string;
    };
    /** Optional custom campaign link, falls back to the app url */
    campaignUrl?: string;
}

// Fixed card dimensions (used for PNG export — always full res)
const CARD_W = 390;
const CARD_H = 693;

export function CampaignShareCard({ campaign, campaignUrl }: CampaignShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [scale, setScale] = useState(1);

    const shareUrl =
        campaignUrl ||
        `https://relacollab.com/creator/opportunities?highlight=${campaign.id ?? ""}`;

    // Compute a CSS scale factor so the card preview fits any viewport width
    useEffect(() => {
        const computeScale = () => {
            // 64px total horizontal padding inside the dialog
            const maxW = Math.min(window.innerWidth - 64, 500);
            setScale(Math.min(1, maxW / CARD_W));
        };
        computeScale();
        window.addEventListener("resize", computeScale);
        return () => window.removeEventListener("resize", computeScale);
    }, []);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 3, // High-DPI so text is crisp
                cacheBust: true,
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
            {/*
             * Scaling wrapper — reserves exactly the visual space the scaled card
             * occupies, so the parent never overflows on small screens. The inner
             * card stays at full resolution so the PNG export is crisp.
             */}
            <div
                style={{
                    width: CARD_W * scale,
                    height: CARD_H * scale,
                    overflow: "hidden",
                    flexShrink: 0,
                    borderRadius: 32 * scale, // mirrors the inner card's border-radius
                    boxShadow: "0 32px 80px rgba(120,80,255,0.35)",
                }}
            >
                {/* ─── Story card (fixed 9:16, captured for export) ─────── */}
                <div
                    ref={cardRef}
                    style={{
                        width: CARD_W,
                        height: CARD_H,
                        transformOrigin: "top left",
                        transform: `scale(${scale})`,
                        background: "linear-gradient(160deg, #120724 0%, #1a0533 40%, #0d0d1a 100%)",
                        borderRadius: 32,
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    }}
                >
                    {/* ── Ambient glow blobs ──────────────────────────────── */}
                    <div style={{
                        position: "absolute", top: -80, left: -80,
                        width: 300, height: 300, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(140,80,255,0.28) 0%, transparent 70%)",
                        filter: "blur(40px)", pointerEvents: "none",
                    }} />
                    <div style={{
                        position: "absolute", bottom: 60, right: -60,
                        width: 260, height: 260, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(80,120,255,0.22) 0%, transparent 70%)",
                        filter: "blur(40px)", pointerEvents: "none",
                    }} />

                    {/* ── Top gradient stripe ─────────────────────────────── */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                        background: "linear-gradient(90deg, transparent, #a855f7, #6366f1, transparent)",
                    }} />

                    {/* ── Brand Logo ──────────────────────────────────────── */}
                    <div style={{
                        marginTop: 52, width: 80, height: 80, borderRadius: 24,
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(12px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(120,80,255,0.25)",
                    }}>
                        {campaign.brandLogo ? (
                            <img
                                src={campaign.brandLogo}
                                alt={campaign.brandName}
                                crossOrigin="anonymous"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <span style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: -1 }}>
                                {campaign.brandName?.charAt(0)?.toUpperCase() ?? "B"}
                            </span>
                        )}
                    </div>

                    {/* ── Brand name ──────────────────────────────────────── */}
                    <p style={{
                        marginTop: 14, fontSize: 13, fontWeight: 500,
                        color: "rgba(200,180,255,0.75)", letterSpacing: 2,
                        textTransform: "uppercase",
                    }}>
                        {campaign.brandName}
                    </p>

                    {/* ── Divider ─────────────────────────────────────────── */}
                    <div style={{
                        marginTop: 18, width: 48, height: 1.5,
                        background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
                    }} />

                    {/* ── Main headline (tagline) ─────────────────────────── */}
                    <h2 style={{
                        marginTop: 18, width: 310, textAlign: "center",
                        fontSize: 22, fontWeight: 800, color: "#ffffff",
                        lineHeight: 1.3, letterSpacing: -0.3,
                    }}>
                        ¡Buscamos creadores para<br />colaborar con nosotros!
                    </h2>

                    {/* ── Campaign name ───────────────────────────────────── */}
                    <h1 style={{
                        marginTop: 10, width: 300, textAlign: "center",
                        fontSize: 28, fontWeight: 800, color: "#ffffff",
                        lineHeight: 1.25, letterSpacing: -0.5,
                    }}>
                        {campaign.title}
                    </h1>

                    {/* ── CTA pill ────────────────────────────────────────── */}
                    <div style={{
                        marginTop: 14, paddingLeft: 20, paddingRight: 20,
                        paddingTop: 8, paddingBottom: 8, borderRadius: 999,
                        background: "linear-gradient(90deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))",
                        border: "1px solid rgba(168,85,247,0.45)",
                        fontSize: 13, fontWeight: 600, color: "#e9d5ff", letterSpacing: 0.3,
                    }}>
                        Colabora con esta campaña 🚀
                    </div>

                    {/* ── QR Code ─────────────────────────────────────────── */}
                    <div style={{
                        marginTop: 32, width: 160, height: 160, borderRadius: 20,
                        background: "rgba(255,255,255,0.06)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 10, padding: 16, backdropFilter: "blur(10px)",
                    }}>
                        <QRCodeSVG
                            value={shareUrl}
                            size={110}
                            bgColor="transparent"
                            fgColor="#ffffff"
                            level="M"
                        />
                        <p style={{
                            fontSize: 10, fontWeight: 600,
                            color: "rgba(200,180,255,0.65)",
                            letterSpacing: 1.5, textTransform: "uppercase", margin: 0,
                        }}>
                            Scan to Join
                        </p>
                    </div>

                    {/* ── RELA Collab watermark ───────────────────────────── */}
                    <div style={{
                        position: "absolute", bottom: 28,
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: "linear-gradient(135deg, #a855f7, #6366f1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>R</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,180,255,0.5)", letterSpacing: 0.5 }}>
                            RELA Collab
                        </span>
                    </div>
                </div>
                {/* ── /inner card ─── */}
            </div>
            {/* ── /scale wrapper ─── */}

            {/* ─── Download button ──────────────────────────────────────── */}
            <Button
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-purple-500/30"
            >
                {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                Descargar Story
            </Button>
        </div>
    );
}
