import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink, Play } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface TikTokMedia {
    id: string;
    caption: string;
    media_type: "VIDEO";
    media_url: string;
    thumbnail_url: string;
    permalink: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    view_count: number;
    share_count: number;
}

interface TikTokMediaPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (media: TikTokMedia) => void;
    userId: string;
}

export function TikTokMediaPicker({
    open,
    onClose,
    onSelect,
    userId,
}: TikTokMediaPickerProps) {
    const [media, setMedia] = useState<TikTokMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<TikTokMedia | null>(null);

    useEffect(() => {
        if (open) {
            fetchTikTokMedia();
        }
    }, [open, userId]);

    const fetchTikTokMedia = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                "https://us-central1-rella-collab.cloudfunctions.net/getTikTokMedia",
                { userId }
            );

            if (response.data.success) {
                setMedia(response.data.data);
            } else {
                toast.error(response.data.error || "Failed to load TikTok media");
            }
        } catch (error) {
            console.error("Error fetching TikTok media:", error);
            toast.error("Could not load TikTok videos. Token might be expired.");
        } finally {
            setLoading(false);
        }
    };

    const filteredMedia = media.filter(
        (m) =>
            !searchTerm ||
            m.caption?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = () => {
        if (selectedMedia) {
            onSelect(selectedMedia);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] sm:max-h-[85vh] flex flex-col gap-0">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        Select from TikTok
                    </DialogTitle>
                    <DialogDescription>
                        Choose a video from your connected TikTok account
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2 pr-2">
                    {/* Search */}
                    <div className="relative sticky top-0 z-10 bg-background pb-2">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search captions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Media Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                            <p className="text-muted-foreground">
                                No videos found associated with this account.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {filteredMedia.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedMedia(item)}
                                    className={`relative group rounded-lg overflow-hidden aspect-[9/16] border-2 transition-all ${selectedMedia?.id === item.id
                                        ? "border-primary ring-2 ring-primary"
                                        : "border-transparent hover:border-primary/50"
                                        }`}
                                >
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.caption || "TikTok video"}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://placehold.co/400x700?text=No+Preview";
                                        }}
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all" />

                                    {/* Metrics */}
                                    <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                                        <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {item.view_count.toLocaleString()}</span>
                                        <span>❤️ {item.like_count.toLocaleString()}</span>
                                    </div>

                                    {/* Selected Check */}
                                    {selectedMedia?.id === item.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-white text-2xl">✓</span>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected Preview */}
                    {selectedMedia && (
                        <div className="p-4 border rounded-lg sticky bottom-0 bg-background shadow-lg z-10 mt-auto">
                            <div className="flex gap-4">
                                <img
                                    src={selectedMedia.thumbnail_url}
                                    alt="Selected"
                                    className="w-16 h-28 rounded-lg object-cover bg-black"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge>TikTok Video</Badge>
                                        <a
                                            href={selectedMedia.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                        >
                                            View on TikTok
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {selectedMedia.caption || "No caption"}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>👀 {selectedMedia.view_count.toLocaleString()} views</span>
                                        <span>❤️ {selectedMedia.like_count.toLocaleString()} likes</span>
                                        <span>💬 {selectedMedia.comments_count.toLocaleString()} comments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="hero"
                        onClick={handleSelect}
                        disabled={!selectedMedia}
                    >
                        Select Video
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
