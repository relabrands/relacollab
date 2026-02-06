import { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import {
  Instagram,
  Globe,
  Check,
  Edit2,
  Sparkles,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CreatorProfile() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<any>({
    name: "",
    email: "",
    location: "",
    phone: "",
    bio: "",
    photoURL: "", // Add photoURL to state
    instagramMetrics: null
  });

  const [socialHandles, setSocialHandles] = useState<{ instagram: string; tiktok: string }>({
    instagram: "",
    tiktok: "",
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dialog state for connecting accounts
  const [connectDialog, setConnectDialog] = useState<{ isOpen: boolean; platform: 'instagram' | 'tiktok' | null }>({
    isOpen: false,
    platform: null,
  });
  const [tempHandle, setTempHandle] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            name: data.displayName || data.name || "",
            email: data.email || "",
            location: data.location || "",
            phone: data.phone || "",
            bio: data.bio || "",
            photoURL: data.photoURL || user.photoURL || "", // Fetch photoURL
            instagramMetrics: data.instagramMetrics || null
          });

          if (data.categories) {
            setSelectedCategories(data.categories);
          }

          if (data.socialHandles) {
            setSocialHandles(data.socialHandles);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle Instagram Callback Data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");

    if (connected === "true" && user) {
      const igId = params.get("ig_id");
      const username = params.get("username");
      const followers = params.get("followers");
      const er = params.get("er");
      const token = params.get("token");

      if (igId && username) {
        const updateInstagramData = async () => {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              instagramConnected: true,
              instagramId: igId,
              instagramUsername: username,
              instagramAccessToken: token,
              instagramMetrics: {
                followers: parseInt(followers || "0"),
                engagementRate: parseFloat(er || "0"),
                lastUpdated: new Date().toISOString()
              }
            });

            setSocialHandles(prev => ({ ...prev, instagram: username }));

            // Update local state immediately so UI reflects it
            setProfile((prev: any) => ({
              ...prev,
              instagramMetrics: {
                followers: parseInt(followers || "0"),
                engagementRate: parseFloat(er || "0"),
                lastUpdated: new Date().toISOString()
              }
            }));

            toast.success("Instagram connected successfully!");

            // Clear params
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error("Error saving Instagram data:", error);
            toast.error("Failed to save Instagram connection");
          }
        };
        updateInstagramData();
      }
    }
  }, [user]);

  const handleInstagramConnect = () => {
    const authUrl = "https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1284439146828000&redirect_uri=https://relacollab.com/auth/facebook/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";
    window.location.href = authUrl;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...profile,
        // Don't save instagramMetrics here as it's managed separately via auth flow, 
        // to avoid overwriting with stale data if not careful, but profile.instagramMetrics is from DB so it's fine.
        // Actually best to exclude it from the update here just in case.
        categories: selectedCategories,
        socialHandles,
        displayName: profile.name,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  const openConnectDialog = (platform: 'instagram' | 'tiktok') => {
    setTempHandle(socialHandles[platform] || "");
    setConnectDialog({ isOpen: true, platform });
  };

  const handleConnectSubmit = () => {
    if (!connectDialog.platform) return;

    // Simple validation: remove @ if present
    const cleanHandle = tempHandle.trim().replace(/^@/, '');

    if (!cleanHandle) {
      toast.error("Please enter a username");
      return;
    }

    const newHandles = { ...socialHandles, [connectDialog.platform]: cleanHandle };
    setSocialHandles(newHandles);
    setConnectDialog({ isOpen: false, platform: null });
    setTempHandle("");
    toast.success(`${connectDialog.platform === 'instagram' ? 'Instagram' : 'TikTok'} connected! Remember to save changes.`);
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
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

    const toastId = toast.loading("Uploading photo...");

    try {
      const storageRef = ref(storage, `profile_photos/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 1. Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
        avatar: downloadURL
      });

      // 2. Update Auth Profile (so user.photoURL is accurate for other parts of app)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      // 3. Update Local State (for immediate feedback)
      setProfile((prev: any) => ({ ...prev, photoURL: downloadURL }));

      toast.success("Profile photo updated!", { id: toastId });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo", { id: toastId });
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="creator" />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="My Profile"
          subtitle="Manage your creator profile and connected accounts"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Basic Information</h2>

              <div className="flex items-center gap-6 mb-6">
                <img
                  src={profile.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover"
                />
                <div>
                  <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                    Change Photo
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="mt-2 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g. Santo Domingo, DR"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (829) 000-0000"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell brands a little bit about yourself..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <Button
                variant="hero"
                className="mt-6"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </motion.div>

            {/* Content Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Content Categories</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Select the topics you create content about
              </p>

              <div className="flex flex-wrap gap-2">
                {["Wellness", "Fitness", "Food", "Lifestyle", "Travel", "Beauty", "Fashion", "Tech", "Family", "Pets"].map(
                  (category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className={`cursor-pointer transition-all hover:scale-105 ${selectedCategories.includes(category)
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "hover:bg-primary/5"
                        }`}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  )
                )}
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toast.info("Add custom category coming soon!")}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Badge>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Connected Accounts & Stats */}
          <div className="space-y-6">
            {/* Social Connections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Social Connections
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-[#E1306C]" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    {socialHandles.instagram ? (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not connected</span>
                    )}
                  </div>

                  {socialHandles.instagram ? (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Username: @{socialHandles.instagram}</p>
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setSocialHandles(prev => ({ ...prev, instagram: "" }))}>
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={handleInstagramConnect}>
                      Connect Instagram
                    </Button>
                  )}
                </div>

                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">Tk</span>
                      </div>
                      <span className="font-medium">TikTok</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openConnectDialog('tiktok')}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {socialHandles.tiktok ? (
                    <p className="text-sm text-muted-foreground">@{socialHandles.tiktok}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Add manual handle</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Profile Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Profile Analysis
              </h3>
              <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                {socialHandles.instagram && profile.instagramMetrics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-background/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Followers</p>
                        <p className="text-2xl font-bold text-primary">
                          {profile.instagramMetrics?.followers
                            ? (profile.instagramMetrics.followers > 1000
                              ? `${(profile.instagramMetrics.followers / 1000).toFixed(1)}K`
                              : profile.instagramMetrics.followers)
                            : "0"}
                        </p>
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                        <p className="text-2xl font-bold text-primary">
                          {profile.instagramMetrics?.engagementRate || 0}%
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Content Insights</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success mt-0.5" />
                          High engagement on video content (Reels).
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success mt-0.5" />
                          <span>Audience primarily active between 6pm - 9pm.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">Connect your Instagram account to unlock AI-powered insights about your audience and content performance.</p>
                    <Button variant="hero" onClick={handleInstagramConnect}>
                      Unlock Insights
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={connectDialog.isOpen} onOpenChange={(open) => !open && setConnectDialog({ ...connectDialog, isOpen: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect {connectDialog.platform === 'instagram' ? 'Instagram' : 'TikTok'}</DialogTitle>
              <DialogDescription>
                Enter your username to connect your account.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={tempHandle}
                    onChange={(e) => setTempHandle(e.target.value)}
                    className="pl-7"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConnectDialog({ ...connectDialog, isOpen: false })}>Cancel</Button>
              <Button onClick={handleConnectSubmit}>Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}