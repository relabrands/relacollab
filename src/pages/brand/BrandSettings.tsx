import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Loader2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useRef } from "react";

export default function BrandSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        brandName: "",
        contactPerson: "",
        phone: "",
        website: "",
        industry: "",
        location: "",
        description: "",
        instagram: "",
        photoURL: ""
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        brandName: data.brandName || data.displayName || "",
                        contactPerson: data.contactPerson || "",
                        phone: data.phone || "",
                        website: data.website || "",
                        industry: data.industry || "",
                        location: data.location || "",
                        description: data.description || "",
                        instagram: data.instagram || "",
                        photoURL: data.photoURL || user.photoURL || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleUpdate = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        const toastId = toast.loading("Uploading logo...");

        try {
            const storageRef = ref(storage, `brand_logos/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // 1. Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                photoURL: downloadURL,
                logo: downloadURL // Also save as logo for clarity
            });

            // 2. Update Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: downloadURL });
            }

            // 3. Update Local State
            setFormData(prev => ({ ...prev, photoURL: downloadURL }));

            toast.success("Brand logo updated!", { id: toastId });
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error("Failed to upload logo", { id: toastId });
        }
    };

    const handleChangePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                ...formData,
                displayName: formData.brandName, // Sync display name
                updatedAt: new Date().toISOString()
            });
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Settings" subtitle="Manage your brand profile and preferences" />

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Brand Profile</CardTitle>
                        <CardDescription>This information will be visible to creators matching with your campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-6 mb-6">
                            <img
                                src={formData.photoURL || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop"}
                                alt="Brand Logo"
                                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border"
                            />
                            <div>
                                <h3 className="font-medium mb-1">Brand Logo</h3>
                                <p className="text-sm text-muted-foreground mb-3">This will be displayed on your campaigns.</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                                        Change Logo
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="brandName">Brand Name</Label>
                                <Input
                                    id="brandName"
                                    value={formData.brandName}
                                    onChange={(e) => handleUpdate("brandName", e.target.value)}
                                    placeholder="Acme Inc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => handleUpdate("contactPerson", e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleUpdate("phone", e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleUpdate("website", e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram Username</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <Input
                                        id="instagram"
                                        value={(formData as any).instagram || ""}
                                        onChange={(e) => handleUpdate("instagram", e.target.value)}
                                        placeholder="brandname"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select value={formData.industry} onValueChange={(val) => handleUpdate("industry", val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fashion">Fashion</SelectItem>
                                        <SelectItem value="beauty">Beauty</SelectItem>
                                        <SelectItem value="tech">Technology</SelectItem>
                                        <SelectItem value="food">Food & Beverage</SelectItem>
                                        <SelectItem value="fitness">Fitness</SelectItem>
                                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                                        <SelectItem value="travel">Travel</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleUpdate("location", e.target.value)}
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Brand Bio / Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleUpdate("description", e.target.value)}
                                placeholder="Tell creators about your brand mission..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
