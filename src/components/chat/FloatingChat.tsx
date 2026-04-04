import { useEffect, useState, useRef } from "react";
import { MessageCircle, X, Send, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Collaboration {
    id: string;
    campaignId: string;
    campaignTitle: string;
    peerId: string; // ID of the brand or creator you are talking to
    peerName: string;
    peerAvatar: string;
    status: string;
    allowBrandMessages?: boolean;
    unreadCount?: number;
}

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: "brand" | "creator";
    text: string;
    type: "text" | "system";
    createdAt: any;
    read: boolean;
}

export function FloatingChat() {
    const { user, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [hasUnread, setHasUnread] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);


    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch collaborations
    useEffect(() => {
        if (!user || !isOpen) return;

        const fetchCollaborations = async () => {
            setLoading(true);
            try {
                let collabs: Collaboration[] = [];

                if (role === "creator") {
                    const appsQuery = query(
                        collection(db, "applications"),
                        where("creatorId", "==", user.uid),
                        where("status", "==", "approved")
                    );
                    const appsSnapshot = await getDocs(appsQuery);

                    for (const appDoc of appsSnapshot.docs) {
                        const appData = appDoc.data();
                        const campaignDoc = await getDoc(doc(db, "campaigns", appData.campaignId));
                        if (!campaignDoc.exists()) continue;
                        const campaignData = campaignDoc.data();

                        const brandDoc = await getDoc(doc(db, "users", campaignData.brandId));
                        const brandData = brandDoc.exists() ? brandDoc.data() : {};

                        collabs.push({
                            id: appDoc.id,
                            campaignId: appData.campaignId,
                            campaignTitle: campaignData.name,
                            peerId: campaignData.brandId,
                            peerName: brandData.brandName || brandData.displayName || "Marca",
                            peerAvatar: brandData.photoURL || "",
                            status: appData.status,
                            unreadCount: 0
                        });
                    }
                } else if (role === "brand") {
                    const appsQuery = query(
                        collection(db, "applications"),
                        where("status", "==", "approved")
                    );
                    const appsSnapshot = await getDocs(appsQuery);

                    for (const appDoc of appsSnapshot.docs) {
                        const appData = appDoc.data();
                        
                        // We must fetch the campaign to see if it belongs to this brand
                        const campaignDoc = await getDoc(doc(db, "campaigns", appData.campaignId));
                        if (!campaignDoc.exists() || campaignDoc.data().brandId !== user.uid) continue;

                        const creatorDoc = await getDoc(doc(db, "users", appData.creatorId));
                        const creatorData = creatorDoc.exists() ? creatorDoc.data() : {};

                        collabs.push({
                            id: appDoc.id,
                            campaignId: appData.campaignId,
                            campaignTitle: campaignDoc.data().name,
                            peerId: appData.creatorId,
                            peerName: creatorData.displayName || "Creador",
                            peerAvatar: creatorData.photoURL || "",
                            status: appData.status,
                            allowBrandMessages: creatorData.privacySettings?.allowBrandMessages !== false,
                            unreadCount: 0
                        });
                    }
                }

                setCollaborations(collabs);
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborations();
    }, [user, role, isOpen]);

    // Listen to messages for selected collaboration
    useEffect(() => {
        if (!selectedCollab) return;

        const messagesQuery = query(
            collection(db, "messages"),
            where("collaborationId", "==", selectedCollab.id),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));

            setMessages(msgs);

            // Mark messages as read if we are viewing them
            if (isOpen) {
                snapshot.docs.forEach(async (msgDoc) => {
                    const msgData = msgDoc.data() as Message;
                    if (!msgData.read && msgData.senderId !== user?.uid) {
                        await updateDoc(doc(db, "messages", msgDoc.id), { read: true });
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [selectedCollab, user, isOpen]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedCollab || !user) return;

        try {
            await addDoc(collection(db, "messages"), {
                collaborationId: selectedCollab.id,
                senderId: user.uid,
                senderName: user.displayName || (role === "brand" ? "Marca" : "Creador"),
                senderRole: role,
                text: newMessage.trim(),
                type: "text",
                read: false,
                createdAt: new Date().toISOString()
            });

            setNewMessage("");
        } catch (error) {
            toast.error("Error al enviar el mensaje");
        }
    };

    // Only render for brands and creators
    if (!user || (role !== "brand" && role !== "creator")) {
        return null; // hide for admins or unauthenticated users
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 sm:w-96 h-[500px] mb-4 bg-card border border-border/50 rounded-2xl shadow-elevated flex flex-col overflow-hidden glass-card transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
                    {selectedCollab ? (
                        // --- Chat Detail View ---
                        <>
                            <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-muted/20">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-8 h-8 rounded-full flex-shrink-0 hover:bg-muted/50" 
                                    onClick={() => setSelectedCollab(null)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Avatar className="w-10 h-10 border border-border/50">
                                    <AvatarImage src={selectedCollab.peerAvatar} />
                                    <AvatarFallback>{selectedCollab.peerName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{selectedCollab.peerName}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{selectedCollab.campaignTitle}</p>
                                </div>
                            </div>
                            
                            <ScrollArea className="flex-1 p-4 bg-background/50">
                                <div className="space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm py-4">
                                            Sin mensajes. ¡Empieza la conversación!
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                                                        msg.type === "system"
                                                            ? "bg-muted/50 text-muted-foreground text-xs italic"
                                                            : msg.senderId === user?.uid
                                                                ? "bg-primary text-primary-foreground text-sm rounded-tr-sm"
                                                                : "bg-muted text-foreground text-sm rounded-tl-sm"
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                            
                            <div className="p-3 border-t border-border/50 bg-card">
                                {role === "brand" && selectedCollab.allowBrandMessages === false ? (
                                    <div className="bg-muted/50 rounded-lg p-2 text-center text-xs text-muted-foreground italic">
                                        Este creador ha restringido los mensajes.
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            className="h-10 text-sm bg-background border-border/50"
                                            placeholder="Escribe un mensaje..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                        />
                                        <Button 
                                            onClick={handleSendMessage} 
                                            disabled={!newMessage.trim()}
                                            className="h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/90 rounded-xl"
                                        >
                                            <Send className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // --- Chat List View ---
                        <>
                            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                                <div>
                                    <h3 className="font-semibold text-lg">Mensajes</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Tus colaboraciones activas
                                    </p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-8 h-8 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 bg-background/50">
                                    {collaborations.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
                                            <MessageCircle className="w-8 h-8 mb-3 opacity-20" />
                                            No tienes colaboraciones aprobadas todavía.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/20">
                                            {collaborations.map((collab) => (
                                                <button
                                                    key={collab.id}
                                                    onClick={() => setSelectedCollab(collab)}
                                                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                                                >
                                                    <Avatar className="w-12 h-12 border border-border/50 flex-shrink-0">
                                                        <AvatarImage src={collab.peerAvatar} />
                                                        <AvatarFallback>{collab.peerName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="font-semibold text-sm truncate text-foreground">{collab.peerName}</p>
                                                        <p className="text-xs text-muted-foreground truncate font-medium">{collab.campaignTitle}</p>
                                                    </div>
                                                    {collab.unreadCount && collab.unreadCount > 0 ? (
                                                        <Badge variant="default" className="flex-shrink-0 px-2 min-w-[20px] justify-center">{collab.unreadCount}</Badge>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-elevated transition-transform hover:scale-105 group relative overflow-hidden ${
                    isOpen 
                        ? 'bg-muted border border-border/50 text-foreground' 
                        : 'bg-gradient-primary text-primary-foreground shadow-[0_0_20px_rgba(255,42,127,0.3)]'
                }`}
            >
                {/* Bubble inner overlay when closed to make it glossy */}
                {!isOpen && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>}
                
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                
                {/* Unread indicator */}
                {!isOpen && hasUnread && (
                    <span className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full border-2 border-[#FF2A7F] shadow-sm animate-pulse" />
                )}
            </button>
        </div>
    );
}
