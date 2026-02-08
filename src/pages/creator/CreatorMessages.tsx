import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { toast } from "sonner";

interface Collaboration {
    id: string;
    campaignId: string;
    campaignTitle: string;
    brandId: string;
    brandName: string;
    brandAvatar: string;
    status: string;
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

export default function CreatorMessages() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch collaborations
    useEffect(() => {
        const fetchCollaborations = async () => {
            if (!user) return;
            try {
                const appsQuery = query(
                    collection(db, "applications"),
                    where("creatorId", "==", user.uid),
                    where("status", "==", "approved")
                );
                const appsSnapshot = await getDocs(appsQuery);

                const collabs: Collaboration[] = [];

                for (const appDoc of appsSnapshot.docs) {
                    const appData = appDoc.data();

                    // Fetch campaign info
                    const campaignDoc = await getDoc(doc(db, "campaigns", appData.campaignId));
                    if (!campaignDoc.exists()) continue;
                    const campaignData = campaignDoc.data();

                    // Fetch brand info
                    const brandDoc = await getDoc(doc(db, "users", campaignData.brandId));
                    const brandData = brandDoc.exists() ? brandDoc.data() : {};

                    collabs.push({
                        id: appDoc.id,
                        campaignId: appData.campaignId,
                        campaignTitle: campaignData.name,
                        brandId: campaignData.brandId,
                        brandName: brandData.displayName || "Brand",
                        brandAvatar: brandData.photoURL || "",
                        status: appData.status,
                        unreadCount: 0
                    });
                }

                setCollaborations(collabs);
                if (collabs.length > 0 && !selectedCollab) {
                    setSelectedCollab(collabs[0]);
                }
            } catch (error) {
                console.error("Error fetching collaborations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborations();
    }, [user]);

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

            // Mark messages as read
            snapshot.docs.forEach(async (msgDoc) => {
                if (!msgDoc.data().read && msgDoc.data().senderId !== user?.uid) {
                    await updateDoc(doc(db, "messages", msgDoc.id), { read: true });
                }
            });
        });

        return () => unsubscribe();
    }, [selectedCollab, user]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedCollab || !user) return;

        try {
            await addDoc(collection(db, "messages"), {
                collaborationId: selectedCollab.id,
                senderId: user.uid,
                senderName: user.displayName || "Creator",
                senderRole: "creator",
                text: newMessage.trim(),
                type: "text",
                read: false,
                createdAt: new Date().toISOString()
            });

            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        }
    };

    const filteredCollabs = collaborations.filter(c =>
        c.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Messages"
                    subtitle="Chat with brands you're collaborating with"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Collaborations List */}
                    <div className="lg:col-span-1 glass-card p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <ScrollArea className="h-[600px]">
                            <div className="space-y-2">
                                {filteredCollabs.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No active collaborations</p>
                                    </div>
                                ) : (
                                    filteredCollabs.map((collab) => (
                                        <button
                                            key={collab.id}
                                            onClick={() => setSelectedCollab(collab)}
                                            className={`w-full p-3 rounded-lg text-left transition-all ${selectedCollab?.id === collab.id
                                                    ? "bg-primary/10 border-2 border-primary"
                                                    : "hover:bg-muted/50 border-2 border-transparent"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={collab.brandAvatar} />
                                                    <AvatarFallback>{collab.brandName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{collab.brandName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{collab.campaignTitle}</p>
                                                </div>
                                                {collab.unreadCount && collab.unreadCount > 0 && (
                                                    <Badge variant="default" className="ml-auto">{collab.unreadCount}</Badge>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-2 glass-card flex flex-col h-[680px]">
                        {selectedCollab ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b flex items-center gap-4">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={selectedCollab.brandAvatar} />
                                        <AvatarFallback>{selectedCollab.brandName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{selectedCollab.brandName}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedCollab.campaignTitle}</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.type === "system"
                                                            ? "bg-muted/50 text-muted-foreground text-sm italic"
                                                            : msg.senderId === user?.uid
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                    <p className="text-xs mt-1 opacity-70">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Message Input */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                        />
                                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
