import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function BrandSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.displayName || "");

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                displayName: name
            });
            toast.success("Profile updated");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Settings" subtitle="Manage your account preferences" />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Update your brand information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled className="bg-muted" />
                        </div>
                        <Button onClick={handleUpdate} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
