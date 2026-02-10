import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink, Instagram } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface InstagramMedia {
    id: string;
    caption: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
}

interface InstagramMediaPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (media: InstagramMedia) => void;
    userId: string;
    filterType?: "Post" | "Reel" | "Story" | "Carousel" | "Video";
}

export function InstagramMediaPicker({
    open,
    onClose,
    onSelect,
    userId,
    filterType,
}: InstagramMediaPickerProps) {
    const [media, setMedia] = useState<InstagramMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<InstagramMedia | null>(null);

    useEffect(() => {
        if (open) {
            fetchInstagramMedia();
        }
    }, [open, userId]);

    const fetchInstagramMedia = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                "https://us-central1-rella-collab.cloudfunctions.net/getInstagramMedia",
                { userId }
            );

            if (response.data.success) {
                let mediaData = response.data.data;

                // Filter by type if specified
                if (filterType) {
                    mediaData = mediaData.filter((m: InstagramMedia) => {
                        if (filterType === "Post") {
                            // Include Images and Carousels in "Posts"
                            return m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM";
                        }
                        if (filterType === "Reel") {
                            return m.media_type === "REELS" || m.media_type === "VIDEO";
                        }
                        if (filterType === "Carousel") {
                            return m.media_type === "CAROUSEL_ALBUM";
                        }
                        if (filterType === "Video") {
                            return m.media_type === "VIDEO" || m.media_type === "REELS";
                        }
                        if (filterType === "Story") {
                            // API typically doesn't return stories, so return empty to show "No stories found"
                            // unless we specifically support STORY type in future
                            return m.media_type === ("STORY" as any);
                        }
                        return true;
                    });
                }

                setMedia(mediaData);
            } else {
                toast.error(response.data.error || "Failed to load Instagram media");
            }
        } catch (error) {
            console.error("Error fetching Instagram media:", error);
            toast.error("Could not load Instagram posts. Token might be expired.");
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
                        <Instagram className="w-5 h-5 text-[#E1306C]" />
                        Select from Instagram
                        {filterType && (
                            <Badge variant="secondary">
                                {filterType === "Post" && "📸"}
                                {filterType === "Reel" && "🎬"}
                                {filterType === "Carousel" && "🖼️"}
                                {filterType === "Video" && "🎥"}
                                {filterType === "Story" && "📱"}
                                {" "}{filterType}s Only
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a post from your connected Instagram account
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
                            <Instagram className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {filterType
                                    ? `No ${filterType.toLowerCase()}s found associated with this account.`
                                    : "No posts found"}
                            </p>
                            {filterType === 'Story' && (
                                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                                    Note: Instagram Stories disappear after 24 hours and may not be retrievable via the API.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {filteredMedia.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedMedia(item)}
                                    className={`relative group rounded-lg overflow-hidden aspect-square border-2 transition-all ${selectedMedia?.id === item.id
                                        ? "border-primary ring-2 ring-primary"
                                        : "border-transparent hover:border-primary/50"
                                        }`}
                                >
                                    {(item.media_type === 'VIDEO' || item.media_type === 'REELS') && !item.thumbnail_url ? (
                                        <video
                                            src={item.media_url}
                                            className="w-full h-full object-cover"
                                            muted
                                            playsInline
                                            onMouseOver={(e) => e.currentTarget.play()}
                                            onMouseOut={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={item.thumbnail_url || item.media_url}
                                            alt={item.caption || "Instagram post"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback if image fails (e.g. expired URL)
                                                e.currentTarget.src = "https://placehold.co/400x400?text=No+Image";
                                            }}
                                        />
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all" />

                                    {/* Type Badge */}
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {item.media_type === "IMAGE" && "Photo"}
                                            {item.media_type === "VIDEO" && "Video"}
                                            {item.media_type === "REELS" && "Reel"}
                                            {item.media_type === "CAROUSEL_ALBUM" && "Carousel"}
                                        </Badge>
                                    </div>

                                    {/* Metrics */}
                                    {(item.like_count || item.comments_count) && (
                                        <div className="absolute bottom-2 left-2 flex gap-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.like_count && (
                                                <span>❤️ {item.like_count.toLocaleString()}</span>
                                            )}
                                            {item.comments_count && (
                                                <span>💬 {item.comments_count}</span>
                                            )}
                                        </div>
                                    )}

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
                        <div className="p-4 border rounded-lg bg-muted/30 sticky bottom-0 bg-background/95 backdrop-blur shadow-sm">
                            <div className="flex gap-4">
                                <img
                                    src={selectedMedia.thumbnail_url || selectedMedia.media_url}
                                    alt="Selected"
                                    className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge>{selectedMedia.media_type}</Badge>
                                        <a
                                            href={selectedMedia.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                        >
                                            View on Instagram
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {selectedMedia.caption || "No caption"}
                                    </p>
                                    {(selectedMedia.like_count || selectedMedia.comments_count) && (
                                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                            {selectedMedia.like_count && (
                                                <span>❤️ {selectedMedia.like_count.toLocaleString()} likes</span>
                                            )}
                                            {selectedMedia.comments_count && (
                                                <span>💬 {selectedMedia.comments_count} comments</span>
                                            )}
                                        </div>
                                    )}
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
                        Select Post
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
