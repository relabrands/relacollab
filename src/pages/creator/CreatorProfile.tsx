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
import { MobileNav } from "@/components/dashboard/MobileNav";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const CONTENT_FORMATS = [
  { id: "posts", label: "Posts", emoji: "📸" },
  { id: "reels", label: "Reels", emoji: "🎬" },
  { id: "stories", label: "Stories", emoji: "📱" },
  { id: "carousels", label: "Carousels", emoji: "🖼️" },
  { id: "videos", label: "Videos", emoji: "🎥" },
];

const CREATOR_VIBES = [
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "premium", label: "Premium", emoji: "👑" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "minimal", label: "Minimal", emoji: "⚪" },
  { id: "vibrant", label: "Vibrant", emoji: "🌈" },
];

const CONTENT_CATEGORIES = [
  "Estilo de vida",
  "Belleza y moda",
  "Recetas",
  "Humor",
  "Fitness",
  "Edición",
  "Tecnología"
];

const WHO_APPEARS = [
  "Solo yo",
  "Mi pareja",
  "Mis amigos",
  "Mi familia",
  "No aparecen personas"
];

const EXPERIENCE_TIME = [
  "Menos de 6 meses",
  "6-12 meses",
  "1-2 años",
  "3+ años"
];

const COLLABORATION_TYPES = [
  { value: "Con remuneración", label: "Con remuneración" },
  { value: "Intercambios", label: "Intercambios" },
  { value: "Ambos", label: "Ambos" }
];

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
    instagramMetrics: null,
    instagramConnected: false,
    instagramTokenExpiresAt: 0,
    tiktokMetrics: null,
    tiktokConnected: false,
    tiktokTokenExpiresAt: 0
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

  // Professional fields
  const [professionalData, setProfessionalData] = useState({
    contentFormats: [] as string[],
    vibes: [] as string[],
    categories: [] as string[],
    whoAppearsInContent: [] as string[],
    experienceTime: "",
    collaborationPreference: "",
    hasBrandExperience: false
  });

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
            instagramMetrics: data.instagramMetrics || null,
            instagramConnected: data.instagramConnected || false,
            instagramTokenExpiresAt: data.instagramTokenExpiresAt || 0,
            tiktokMetrics: data.tiktokMetrics || null,
            tiktokConnected: data.tiktokConnected || false,
            tiktokTokenExpiresAt: data.tiktokTokenExpiresAt || 0
          });

          if (data.categories) {
            setSelectedCategories(data.categories);
          }

          if (data.socialHandles) {
            setSocialHandles(data.socialHandles);
          }

          // Load professional data
          setProfessionalData({
            contentFormats: data.contentFormats || [],
            vibes: data.vibes || [],
            categories: data.categories || [],
            whoAppearsInContent: data.whoAppearsInContent || [],
            experienceTime: data.experienceTime || "",
            collaborationPreference: data.collaborationPreference || "",
            hasBrandExperience: data.hasBrandExperience || false
          });
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
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      toast.error(`Instagram Connection Failed: ${errorDescription || error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

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
    const authUrl = "https://www.facebook.com/v19.0/dialog/oauth?client_id=1253246110020541&redirect_uri=https://relacollab.com/auth/facebook/callback&response_type=code&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management";
    window.location.href = authUrl;
  };

  const handleTikTokConnect = () => {
    // Generar state aleatorio
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem("tiktok_auth_state", state);

    const clientKey = "sbawc7z0a481hx7bx1";
    const redirectUri = "https://www.relacollab.com/auth/tiktok/callback";
    const scopes = "user.info.basic,user.info.stats,video.list";

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    window.location.href = authUrl;
  };

  const handleTikTokDisconnect = async () => {
    if (!user) return;

    if (!confirm("Are you sure you want to disconnect TikTok?")) {
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        tiktokConnected: false,
        tiktokAccessToken: deleteField(),
        tiktokMetrics: deleteField(),
        tiktokOpenId: deleteField(),
        tiktokTokenExpiresAt: deleteField(),
        "socialHandles.tiktok": deleteField()
      });

      setProfile((prev: any) => ({
        ...prev,
        tiktokConnected: false,
        tiktokMetrics: null
      }));
      setSocialHandles(prev => ({ ...prev, tiktok: "" }));

      toast.success("TikTok disconnected.");
    } catch (error) {
      console.error("Error disconnecting TikTok:", error);
      toast.error("Failed to disconnect TikTok.");
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!user) return;

    // Add confirmation
    if (!confirm("Are you sure you want to disconnect Instagram? You'll lose access to your metrics and won't appear in brand matches.")) {
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        instagramConnected: false,
        instagramAccessToken: deleteField(),
        instagramMetrics: deleteField(),
        instagramId: deleteField(),
        instagramUsername: deleteField(),
        instagramTokenExpiresAt: deleteField(),
        "socialHandles.instagram": deleteField()
      });

      setProfile((prev: any) => ({
        ...prev,
        instagramConnected: false,
        instagramMetrics: null
      }));
      setSocialHandles(prev => ({ ...prev, instagram: "" }));

      toast.success("Instagram disconnected.");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect. Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        categories: selectedCategories,
        socialHandles: {
          instagram: socialHandles.instagram || "",
          tiktok: socialHandles.tiktok || "",
        },
        // Professional fields
        contentFormats: professionalData.contentFormats,
        vibes: professionalData.vibes,
        whoAppearsInContent: professionalData.whoAppearsInContent,
        experienceTime: professionalData.experienceTime,
        collaborationPreference: professionalData.collaborationPreference,
        hasBrandExperience: professionalData.hasBrandExperience,
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
      <MobileNav type="creator" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Content Formats */}
              <div className="mt-6">
                <Label>Content Formats</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  What type of content do you create?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CONTENT_FORMATS.map((format) => (
                    <div
                      key={format.id}
                      onClick={() => {
                        const isSelected = professionalData.contentFormats.includes(format.id);
                        setProfessionalData(prev => ({
                          ...prev,
                          contentFormats: isSelected
                            ? prev.contentFormats.filter(f => f !== format.id)
                            : [...prev.contentFormats, format.id]
                        }));
                      }}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${professionalData.contentFormats.includes(format.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{format.emoji}</span>
                        <span className="font-medium text-sm">{format.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vibes */}
              <div className="mt-6">
                <Label>Content Vibes</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  What's your content style? (Optional)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CREATOR_VIBES.map((vibe) => (
                    <div
                      key={vibe.id}
                      onClick={() => {
                        const isSelected = professionalData.vibes.includes(vibe.id);
                        setProfessionalData(prev => ({
                          ...prev,
                          vibes: isSelected
                            ? prev.vibes.filter(v => v !== vibe.id)
                            : [...prev.vibes, vibe.id]
                        }));
                      }}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                        ${professionalData.vibes.includes(vibe.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="text-2xl mb-1">{vibe.emoji}</div>
                      <div className="text-xs font-medium">{vibe.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who Appears */}
              <div className="mt-6">
                <Label>Who Appears in Your Content</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select all that apply
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {WHO_APPEARS.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        const isSelected = professionalData.whoAppearsInContent.includes(option);
                        setProfessionalData(prev => ({
                          ...prev,
                          whoAppearsInContent: isSelected
                            ? prev.whoAppearsInContent.filter(o => o !== option)
                            : [...prev.whoAppearsInContent, option]
                        }));
                      }}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${professionalData.whoAppearsInContent.includes(option)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={professionalData.whoAppearsInContent.includes(option)}
                          onCheckedChange={() => { }}
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience & Collaboration */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Experience Time */}
                <div>
                  <Label>Content Creation Experience</Label>
                  <RadioGroup
                    value={professionalData.experienceTime}
                    onValueChange={(value) => setProfessionalData(prev => ({ ...prev, experienceTime: value }))}
                    className="mt-3 space-y-2"
                  >
                    {EXPERIENCE_TIME.map((time) => (
                      <div
                        key={time}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer
                          ${professionalData.experienceTime === time
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <RadioGroupItem value={time} id={time} />
                        <Label htmlFor={time} className="cursor-pointer flex-1 font-normal">
                          {time}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Collaboration Preference */}
                <div>
                  <Label>Collaboration Preference</Label>
                  <RadioGroup
                    value={professionalData.collaborationPreference}
                    onValueChange={(value) => setProfessionalData(prev => ({ ...prev, collaborationPreference: value }))}
                    className="mt-3 space-y-2"
                  >
                    {COLLABORATION_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer
                          ${professionalData.collaborationPreference === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <RadioGroupItem value={type.value} id={type.value} />
                        <Label htmlFor={type.value} className="cursor-pointer flex-1 font-normal">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Brand Experience */}
              <div className="mt-6">
                <Label>Brand Experience</Label>
                <div className="flex items-center gap-4 mt-3">
                  <div
                    onClick={() => setProfessionalData(prev => ({ ...prev, hasBrandExperience: true }))}
                    className={`
                      flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all
                      ${professionalData.hasBrandExperience
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">Yes, I have experience</span>
                  </div>
                  <div
                    onClick={() => setProfessionalData(prev => ({ ...prev, hasBrandExperience: false }))}
                    className={`
                      flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all
                      ${!professionalData.hasBrandExperience
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">No, I'm new to this</span>
                  </div>
                </div>
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
                    {profile.instagramConnected && !(Date.now() > (profile.instagramTokenExpiresAt || 0)) ? (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not connected</span>
                    )}
                  </div>

                  {/* Instagram Connection Logic */}
                  {(() => {
                    const isConnected = profile.instagramConnected;
                    const isExpired = isConnected && (Date.now() > (profile.instagramTokenExpiresAt || 0));

                    if (isConnected && !isExpired) {
                      return (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Username: @{socialHandles.instagram}</p>
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleInstagramDisconnect}>
                            Disconnect
                          </Button>
                        </div>
                      );
                    } else if (isExpired) {
                      return (
                        <div className="text-sm">
                          <p className="text-warning font-medium mb-2">Session Expired</p>
                          <Button variant="outline" size="sm" className="w-full border-warning text-warning hover:bg-warning/10" onClick={handleInstagramConnect}>
                            Reconnect Instagram
                          </Button>
                        </div>
                      );
                    } else {
                      return (
                        <Button variant="outline" size="sm" className="w-full" onClick={handleInstagramConnect}>
                          Connect Instagram
                        </Button>
                      );
                    }
                  })()}
                </div>

                {/* TikTok Connection */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Simple TikTok Icon or text */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                      <span className="font-medium">TikTok</span>
                    </div>
                    {profile.tiktokConnected ? (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not connected</span>
                    )}
                  </div>

                  {(() => {
                    if (profile.tiktokConnected) {
                      return (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Username: @{socialHandles.tiktok}</p>
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleTikTokDisconnect}>
                            Disconnect
                          </Button>
                        </div>
                      );
                    } else {
                      return (
                        <Button variant="outline" size="sm" className="w-full" onClick={handleTikTokConnect}>
                          Connect TikTok
                        </Button>
                      );
                    }
                  })()}
                </div>


              </div>
            </div>

            {/* AI Profile Analysis Link */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Profile Analysis
              </h3>
              <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">View your AI Insights</h4>
                  <p className="text-sm text-muted-foreground">Deep dive into your performance, content analysis, and audience metrics.</p>
                </div>
                <Button asChild>
                  <a href="/creator/analytics">View Analytics</a>
                </Button>
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