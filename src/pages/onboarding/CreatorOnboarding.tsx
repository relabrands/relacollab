import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreatorOnboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bio: "",
        instagram: "",
        tiktok: "",
        youtube: "",
        niche: ""
    });

    const handleUpdate = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleComplete = async () => {
        if (!formData.niche) {
            toast.error("Please specify your niche");
            return;
        }

        setLoading(true);
        try {
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                bio: formData.bio,
                socialLinks: {
                    instagram: formData.instagram,
                    tiktok: formData.tiktok,
                    youtube: formData.youtube
                },
                niche: formData.niche,
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            });

            toast.success("Profile setup complete!");
            window.location.href = "/creator";
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Complete your Creator Profile</h1>
                <p className="text-muted-foreground">Help brands discover you by adding your details.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>This information will be visible to brands.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="niche">Primary Niche *</Label>
                        <Input
                            id="niche"
                            placeholder="e.g. Fitness, Beauty, TechReview"
                            value={formData.niche}
                            onChange={(e) => handleUpdate("niche", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Short Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell us a bit about yourself..."
                            value={formData.bio}
                            onChange={(e) => handleUpdate("bio", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram Username</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                <Input
                                    id="instagram"
                                    className="pl-7"
                                    placeholder="username"
                                    value={formData.instagram}
                                    onChange={(e) => handleUpdate("instagram", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tiktok">TikTok Username</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                <Input
                                    id="tiktok"
                                    className="pl-7"
                                    placeholder="username"
                                    value={formData.tiktok}
                                    onChange={(e) => handleUpdate("tiktok", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube Channel</Label>
                            <Input
                                id="youtube"
                                placeholder="Channel URL"
                                value={formData.youtube}
                                onChange={(e) => handleUpdate("youtube", e.target.value)}
                            />
                        </div>
                    </div>

                    <Button onClick={handleComplete} className="w-full mt-4" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Profile
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
