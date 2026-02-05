import { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Instagram,
  Smartphone,
  Users,
  TrendingUp,
  MapPin,
  CheckCircle,
  Link as LinkIcon,
  Plus,
  Loader2,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CreatorProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    bio: "",
  });

  const [socialHandles, setSocialHandles] = useState({
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...profile,
        categories: selectedCategories,
        socialHandles,
        displayName: profile.name, // Ensure displayName is kept in sync
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

    // Optional: Auto-save when connecting (or user can hit Save Changes)
    // For now we'll let the user hit Save Changes to persist everything together, 
    // but give a visual cue inside the dialog or toast.
    toast.success(`${connectDialog.platform === 'instagram' ? 'Instagram' : 'TikTok'} connected! Remember to save changes.`);
  };

  const handleDisconnect = (platform: 'instagram' | 'tiktok') => {
    const newHandles = { ...socialHandles, [platform]: "" };
    setSocialHandles(newHandles);
    toast.info(`${platform === 'instagram' ? 'Instagram' : 'TikTok'} disconnected. Remember to save changes.`);
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleChangePhoto = () => {
    toast.info("Photo upload coming soon!");
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
                  src={user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover"
                />
                <div>
                  <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                    Change Photo
                  </Button>
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
                    disabled // Email usually shouldn't be actionable freely without re-auth
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
            {/* Connected Accounts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>

              <div className="space-y-4">
                {/* Instagram */}
                <div className={`p-4 rounded-xl border ${socialHandles.instagram ? 'border-border' : 'border-dashed border-border'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${socialHandles.instagram ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-muted"
                        }`}>
                        <Instagram className={`w-5 h-5 ${socialHandles.instagram ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="font-medium">Instagram</div>
                        <div className="text-sm text-muted-foreground">
                          {socialHandles.instagram ? `@${socialHandles.instagram}` : "Not connected"}
                        </div>
                      </div>
                    </div>
                    {socialHandles.instagram ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect('instagram')}>
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openConnectDialog('instagram')}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                  {socialHandles.instagram && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold">--</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold text-success">--</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TikTok */}
                <div className={`p-4 rounded-xl border ${socialHandles.tiktok ? 'border-border' : 'border-dashed border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${socialHandles.tiktok ? "bg-black" : "bg-muted"
                        }`}>
                        <Smartphone className={`w-5 h-5 ${socialHandles.tiktok ? "text-white" : "text-muted-foreground"
                          }`} />
                      </div>
                      <div>
                        <div className="font-medium">TikTok</div>
                        <div className="text-sm text-muted-foreground">
                          {socialHandles.tiktok ? `@${socialHandles.tiktok}` : "Not connected"}
                        </div>
                      </div>
                    </div>
                    {socialHandles.tiktok ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect('tiktok')}>
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openConnectDialog('tiktok')}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                  {socialHandles.tiktok && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold">--</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold text-success">--</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
            >
              <h2 className="text-lg font-semibold mb-4">AI Profile Analysis</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">High Potential</div>
                    <div className="text-sm text-muted-foreground">
                      Complete your profile to see more stats
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Audience Insights</div>
                    <div className="text-sm text-muted-foreground">
                      Connect socials to unlock insights
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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