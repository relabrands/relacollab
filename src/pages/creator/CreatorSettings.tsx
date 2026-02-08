import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Mail, Bell, Lock, Eye, Shield } from "lucide-react";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CreatorSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [accountData, setAccountData] = useState({
        email: "",
        displayName: ""
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        campaignMatches: true,
        campaignUpdates: true,
        deliverableReminders: true,
        paymentNotifications: true,
        pushNotifications: false,
    });

    const [privacySettings, setPrivacySettings] = useState({
        publicProfile: true,
        showMetrics: false,
        allowBrandMessages: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();

                    setAccountData({
                        email: data.email || user.email || "",
                        displayName: data.displayName || ""
                    });

                    // Notification settings
                    if (data.notificationSettings) {
                        setNotificationSettings({ ...notificationSettings, ...data.notificationSettings });
                    }

                    // Privacy settings
                    if (data.privacySettings) {
                        setPrivacySettings({ ...privacySettings, ...data.privacySettings });
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("Error loading settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSaveSettings = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                displayName: accountData.displayName,
                notificationSettings,
                privacySettings,
                updatedAt: new Date().toISOString()
            });
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Settings"
                    subtitle="Manage your account preferences and notifications"
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl">
                        {/* Account Information */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" />
                                    <CardTitle>Account Information</CardTitle>
                                </div>
                                <CardDescription>Your basic account details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        value={accountData.displayName}
                                        onChange={(e) => setAccountData(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="Your name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={accountData.email}
                                        disabled
                                        className="bg-muted cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed. Contact support if needed.
                                    </p>
                                </div>

                                <Separator className="my-4" />

                                <div className="pt-2">
                                    <p className="text-sm font-medium mb-2">Professional Information</p>
                                    <p className="text-sm text-muted-foreground">
                                        To edit your bio, content formats, vibes, and other professional details,
                                        go to{" "}
                                        <a href="/creator/profile" className="text-primary hover:underline font-medium">
                                            My Profile
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Notifications */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <CardTitle>Email Notifications</CardTitle>
                                </div>
                                <CardDescription>Choose what updates you receive via email</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive all email notifications</p>
                                    </div>
                                    <Switch
                                        id="emailNotifications"
                                        checked={notificationSettings.emailNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4 opacity-100">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="campaignMatches">Campaign Matches</Label>
                                            <p className="text-sm text-muted-foreground">New campaigns that match your profile</p>
                                        </div>
                                        <Switch
                                            id="campaignMatches"
                                            checked={notificationSettings.campaignMatches}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, campaignMatches: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="campaignUpdates">Campaign Updates</Label>
                                            <p className="text-sm text-muted-foreground">Status changes on your applications</p>
                                        </div>
                                        <Switch
                                            id="campaignUpdates"
                                            checked={notificationSettings.campaignUpdates}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, campaignUpdates: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="deliverableReminders">Deliverable Reminders</Label>
                                            <p className="text-sm text-muted-foreground">Reminders for pending submissions</p>
                                        </div>
                                        <Switch
                                            id="deliverableReminders"
                                            checked={notificationSettings.deliverableReminders}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, deliverableReminders: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                                            <p className="text-sm text-muted-foreground">Payment confirmations and updates</p>
                                        </div>
                                        <Switch
                                            id="paymentNotifications"
                                            checked={notificationSettings.paymentNotifications}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings(prev => ({ ...prev, paymentNotifications: checked }))
                                            }
                                            disabled={!notificationSettings.emailNotifications}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Push Notifications */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    <CardTitle>Push Notifications</CardTitle>
                                </div>
                                <CardDescription>Browser notifications for real-time updates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="pushNotifications">Enable Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get instant updates in your browser
                                        </p>
                                    </div>
                                    <Switch
                                        id="pushNotifications"
                                        checked={notificationSettings.pushNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy Settings */}
                        <Card className="glass-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <CardTitle>Privacy & Visibility</CardTitle>
                                </div>
                                <CardDescription>Control who can see your information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="publicProfile">Public Profile</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow brands to discover and view your profile
                                        </p>
                                    </div>
                                    <Switch
                                        id="publicProfile"
                                        checked={privacySettings.publicProfile}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, publicProfile: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="showMetrics">
                                            <div className="flex items-center gap-2">
                                                <span>Show Metrics</span>
                                                <Eye className="w-4 h-4" />
                                            </div>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Display follower count and engagement rate to brands
                                        </p>
                                    </div>
                                    <Switch
                                        id="showMetrics"
                                        checked={privacySettings.showMetrics}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, showMetrics: checked }))
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="allowBrandMessages">Allow Brand Messages</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Brands can send you direct messages for collaborations
                                        </p>
                                    </div>
                                    <Switch
                                        id="allowBrandMessages"
                                        checked={privacySettings.allowBrandMessages}
                                        onCheckedChange={(checked) =>
                                            setPrivacySettings(prev => ({ ...prev, allowBrandMessages: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                variant="hero"
                                className="min-w-[150px]"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
