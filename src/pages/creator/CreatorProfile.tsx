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
  X,
  Upload,
  FileText,
  ExternalLink,
  Trash2,
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
import { InstagramConnectModal } from "@/components/creator/InstagramConnectModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CREATOR_NICHES, CREATOR_VIBES } from "@/lib/constants";

const CONTENT_FORMATS = [
  { id: "posts", label: "Posts", emoji: "📸" },
  { id: "reels", label: "Reels", emoji: "🎬" },
  { id: "stories", label: "Historias", emoji: "📱" },
  { id: "carousels", label: "Carruseles", emoji: "🖼️" },
  { id: "videos", label: "Videos", emoji: "🎥" },
];
const WHO_APPEARS = [
  "Solo yo",
  "Mi pareja",
  "Mis hijos",
  "Mis amigos",
  "Mascotas",
  "No aparecen personas"
];

const EXPERIENCE_TIME = [
  "Menos de 5 meses",
  "De 5 a 8 meses",
  "De 8 meses a 1 año",
  "Más de 1 año",
  "Más de 3 años"
];

const COLLABORATION_TYPES = [
  { value: "Con remuneración", label: "Con remuneración" },
  { value: "Intercambios", label: "Intercambios" },
  { value: "Ambos", label: "Ambos" }
];

export default function CreatorProfile() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaKitInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaKitUrl, setMediaKitUrl] = useState("");
  const [mediaKitFileName, setMediaKitFileName] = useState("");
  const [isUploadingMediaKit, setIsUploadingMediaKit] = useState(false);

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
    tiktokTokenExpiresAt: 0,
    averageRating: 0,
    reviewCount: 0
  });

  const [socialHandles, setSocialHandles] = useState<{ instagram: string; tiktok: string }>({
    instagram: "",
    tiktok: "",
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories([...selectedCategories, customCategory.trim()]);
      setCustomCategory("");
      setIsAddingCategory(false);
    }
  };

  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);

  // Dialog state for connecting accounts
  const [connectDialog, setConnectDialog] = useState<{ isOpen: boolean; platform: 'instagram' | 'tiktok' | null }>({
    isOpen: false,
    platform: null,
  });
  const [tempHandle, setTempHandle] = useState("");

  // Professional fields
  const [professionalData, setProfessionalData] = useState({
    niche: "",
    contentFormats: [] as string[],
    vibes: [] as string[],
    categories: [] as string[],
    whoAppearsInContent: [] as string[],
    experienceTime: "",
    collaborationPreference: "",
    hasBrandExperience: false
  });

  // Shipping address (private — only shared with matched brands)
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    sector: "",
    city: "",
    reference: ""
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
            tiktokTokenExpiresAt: data.tiktokTokenExpiresAt || 0,
            averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || 0
          });

          if (data.categories) {
            setSelectedCategories(data.categories);
          }

          if (data.socialHandles) {
            setSocialHandles(data.socialHandles);
          }

          // Load professional data
          setProfessionalData({
            niche: data.niche || "",
            contentFormats: data.contentFormats || [],
            vibes: data.vibes || [],
            categories: data.categories || [],
            whoAppearsInContent: data.whoAppearsInContent || [],
            experienceTime: data.experienceTime || "",
            collaborationPreference: data.collaborationPreference || "",
            hasBrandExperience: data.hasBrandExperience || false
          });

          // Load shipping address
          if (data.shippingAddress) {
            setShippingAddress({
              street: data.shippingAddress.street || "",
              sector: data.shippingAddress.sector || "",
              city: data.shippingAddress.city || "",
              reference: data.shippingAddress.reference || ""
            });
          }

          // Load media kit
          if (data.mediaKitUrl) {
            setMediaKitUrl(data.mediaKitUrl);
            setMediaKitFileName(data.mediaKitFileName || "Media Kit");
          }
        }
      } catch (error) {
        toast.error("Error al cargar los datos del perfil");
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
      toast.error(`La conexión de Instagram falló: ${errorDescription || error}`);
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

            toast.success("¡Instagram conectado exitosamente!");

            // Clear params
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            toast.error("Error al guardar la conexión de Instagram");
          }
        };
        updateInstagramData();
      }
    }
  }, [user]);

  const handleInstagramConnect = () => {
    setIsInstagramModalOpen(true);
  };

  const proceedWithInstagramConnect = () => {
    const authUrl = "https://www.facebook.com/v19.0/dialog/oauth?client_id=1253246110020541&redirect_uri=https://relacollab.com/auth/facebook/callback&response_type=code&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management";
    window.location.href = authUrl;
  };

  const handleTikTokConnect = () => {
    // Generar state aleatorio
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem("tiktok_auth_state", state);

    const clientKey = "awq1es91fwbixh6h";
    const redirectUri = "https://www.relacollab.com/auth/tiktok/callback";
    const scopes = "user.info.basic,user.info.stats,video.list";

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    window.location.href = authUrl;
  };

  const handleTikTokDisconnect = async () => {
    if (!user) return;

    if (!confirm("¿Estás seguro de que deseas desconectar TikTok?")) {
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

      toast.success("TikTok desconectado.");
    } catch (error) {
      toast.error("Error al desconectar TikTok.");
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!user) return;

    // Add confirmation
    if (!confirm("¿Estás seguro de que deseas desconectar Instagram? Perderás acceso a tus métricas y no aparecerás en las coincidencias de marcas.")) {
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

      toast.success("Instagram desconectado.");
    } catch (error) {
      toast.error("Error al desconectar. Por favor intenta de nuevo.");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!professionalData.niche) {
      toast.error("Selecciona tu nicho principal para continuar");
      return;
    }

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
        niche: professionalData.niche,
        contentFormats: professionalData.contentFormats,
        vibes: professionalData.vibes,
        whoAppearsInContent: professionalData.whoAppearsInContent,
        experienceTime: professionalData.experienceTime,
        collaborationPreference: professionalData.collaborationPreference,
        hasBrandExperience: professionalData.hasBrandExperience,
        // Shipping address (private field)
        shippingAddress: {
          street: shippingAddress.street,
          sector: shippingAddress.sector,
          city: shippingAddress.city,
          reference: shippingAddress.reference
        },
        updatedAt: new Date().toISOString(),
      });
      toast.success("¡Perfil guardado exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los cambios del perfil");
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
      toast.error("Por favor ingresa un nombre de usuario");
      return;
    }

    const newHandles = { ...socialHandles, [connectDialog.platform]: cleanHandle };
    setSocialHandles(newHandles);
    setConnectDialog({ isOpen: false, platform: null });
    setTempHandle("");
    toast.success(`¡${connectDialog.platform === 'instagram' ? 'Instagram' : 'TikTok'} conectado! Recuerda guardar los cambios.`);
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
      toast.error("Por favor sube un archivo de imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El tamaño del archivo debe ser menor a 5MB");
      return;
    }

    const toastId = toast.loading("Subiendo foto...");

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

      toast.success("¡Foto de perfil actualizada!", { id: toastId });
    } catch (error) {
      toast.error("Error al subir foto", { id: toastId });
    }
  };

  const handleMediaKitUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Accept PDFs and images
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato no soportado. Sube un PDF o imagen (JPG, PNG, WEBP).");
      return;
    }

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(
        `El archivo supera los ${MAX_MB} MB. Por favor comprime tu Media Kit antes de subirlo.`,
        { description: "Puedes usar herramientas gratuitas como Smallpdf, ILovePDF o TinyPNG para reducir el tamaño." }
      );
      return;
    }

    setIsUploadingMediaKit(true);
    const toastId = toast.loading("Subiendo Media Kit...");

    try {
      const storageRef = ref(storage, `media_kits/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.uid), {
        mediaKitUrl: downloadURL,
        mediaKitFileName: file.name,
        mediaKitUploadedAt: new Date().toISOString(),
      });

      setMediaKitUrl(downloadURL);
      setMediaKitFileName(file.name);
      toast.success("¡Media Kit subido exitosamente!", { id: toastId });
    } catch (error) {
      toast.error("Error al subir el Media Kit", { id: toastId });
    } finally {
      setIsUploadingMediaKit(false);
      // Reset input so same file can be re-uploaded
      if (mediaKitInputRef.current) mediaKitInputRef.current.value = "";
    }
  };

  const handleRemoveMediaKit = async () => {
    if (!user || !confirm("¿Estás seguro de que deseas eliminar tu Media Kit?")) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        mediaKitUrl: deleteField(),
        mediaKitFileName: deleteField(),
        mediaKitUploadedAt: deleteField(),
      });
      setMediaKitUrl("");
      setMediaKitFileName("");
      toast.success("Media Kit eliminado.");
    } catch {
      toast.error("Error al eliminar el Media Kit.");
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
          title="Mi Perfil"
          subtitle="Administra tu perfil de creador y cuentas conectadas"
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
              <h2 className="text-lg font-semibold mb-6">Información Básica</h2>

              <div className="flex items-center gap-6 mb-6">
                <img
                  src={profile.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover"
                />
                <div>
                  <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                    Cambiar Foto
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {profile.averageRating > 0 ? (
                    <div className="flex items-center gap-1 mt-3 bg-muted/50 px-3 py-1.5 rounded-full inline-flex w-fit">
                      <span className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                        {profile.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">({profile.reviewCount} reseñas)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-3 bg-muted/50 px-3 py-1.5 rounded-full inline-flex w-fit">
                      <span className="text-sm text-muted-foreground italic">Sin reseñas aún</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="mt-2 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="ej. Santo Domingo, RD"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
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
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Cuéntale a las marcas un poco sobre ti..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              {/* Niche */}
              <div className="mt-6 border-t pt-6">
                <Label>Nicho Principal <span className="text-red-500">*</span></Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona el nicho principal que mejor define tu contenido. (Obligatorio)
                </p>
                <Select
                  value={professionalData.niche}
                  onValueChange={(val) => setProfessionalData(prev => ({ ...prev, niche: val }))}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecciona tu nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_NICHES.map(niche => (
                      <SelectItem key={niche.id} value={niche.id}>
                        <span>{niche.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Formats */}
              <div className="mt-6">
                <Label>Formatos de Contenido</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  ¿Qué tipo de contenido creas?
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

              {/* Vibes / Secundarios (Antiguamente vibes, los mantenemos mapeando const) */}
              <div className="mt-6">
                <Label>Categorías Secundarias</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Temas adicionales que aparecen en tu contenido (opcional)
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
                      <div className="text-xs font-medium">{vibe.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who Appears */}
              <div className="mt-6">
                <Label>Quién Aparece en tu Contenido</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona todas las que apliquen
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
                  <Label>Experiencia en Creación de Contenido</Label>
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
                  <Label>Preferencia de Colaboración</Label>
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
                <Label>Experiencia con Marcas</Label>
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
                    <span className="text-sm font-medium">Sí, tengo experiencia</span>
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
                    <span className="text-sm font-medium">No, soy nuevo en esto</span>
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
                Guardar Cambios
              </Button>
            </motion.div>

            {/* Shipping Address Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold">📦 Logística de Envíos</h2>
                <span className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  🔒 Privado
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                ¿A dónde te enviamos los productos de intercambio? Tu dirección completa <strong>solo será compartida con las marcas</strong> con las que aceptes colaborar. Públicamente solo verán tu ciudad y sector.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingStreet">Calle y número</Label>
                  <Input
                    id="shippingStreet"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Ej: Calle Las Damas #12"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingSector">Sector / Barrio</Label>
                  <Input
                    id="shippingSector"
                    value={shippingAddress.sector}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="Ej: Piantini, Gazcue..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCity">Ciudad</Label>
                  <Input
                    id="shippingCity"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ej: Santo Domingo"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingReference">Referencia <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    id="shippingReference"
                    value={shippingAddress.reference}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Ej: Frente al Supermercado Nacional"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  🔒 <strong>Privacidad garantizada:</strong> Tu dirección completa estará oculta hasta que aceptes una colaboración con una marca. Solo se mostrará públicamente tu ciudad y sector.
                </p>
              </div>

              <Button
                variant="outline"
                className="mt-4"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Dirección
              </Button>
            </motion.div>

            {/* Media Kit / Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Media Kit / Portafolio
                  </h2>
                </div>
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  👁 Visible para marcas
                </span>
              </div>

              {/* Motivation banner */}
              <div className="mt-3 mb-5 p-4 rounded-xl bg-gradient-to-r from-primary/8 to-accent/8 border border-primary/15">
                <p className="text-sm font-medium text-foreground mb-1">🚀 ¡Aumenta tus posibilidades de ser seleccionado!</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Los creadores con Media Kit tienen <strong className="text-primary">3x más probabilidades</strong> de ser aprobados por una marca.
                  Incluye estadísticas, ejemplos de colaboraciones anteriores y tarifas para destacarte.
                </p>
              </div>

              {mediaKitUrl ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mediaKitFileName || "Media Kit"}</p>
                    <p className="text-xs text-muted-foreground">Subido · visible para marcas</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={mediaKitUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={handleRemoveMediaKit}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => mediaKitInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/3 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm mb-1">Sube tu Media Kit o Portafolio</p>
                  <p className="text-xs text-muted-foreground">
                    PDF o imagen · Máximo <strong>10 MB</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si supera ese límite, comprime con{" "}
                    <a href="https://smallpdf.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>Smallpdf</a>{" "}o{" "}
                    <a href="https://ilovepdf.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>ILovePDF</a>.
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={mediaKitInputRef}
                className="hidden"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleMediaKitUpload}
              />

              {!mediaKitUrl && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => mediaKitInputRef.current?.click()}
                  disabled={isUploadingMediaKit}
                >
                  {isUploadingMediaKit ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingMediaKit ? "Subiendo..." : "Seleccionar archivo"}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Right Column - Connected Accounts & Stats */}
          <div className="space-y-6">
            {/* Social Connections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Conexiones Sociales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {/* Instagram Connection */}
                <div className="group p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background transition-colors space-y-3 relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform -rotate-12">
                    <Instagram className="w-24 h-24 text-[#E1306C]" />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-[#E1306C]/10 text-[#E1306C]">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">Instagram</span>
                    </div>
                    {profile.instagramConnected && !(Date.now() > (profile.instagramTokenExpiresAt || 0)) ? (
                      <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">Not connected</span>
                    )}
                  </div>

                  {/* Instagram Connection Logic */}
                  <div className="relative z-10 pt-1">
                    {(() => {
                      const isConnected = profile.instagramConnected;
                      const isExpired = isConnected && (Date.now() > (profile.instagramTokenExpiresAt || 0));

                      if (isConnected && !isExpired) {
                        return (
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-3 text-xs">Usuario <span className="text-foreground font-medium">@{socialHandles.instagram}</span></p>
                            <Button variant="outline" size="sm" className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={handleInstagramDisconnect}>
                              Desconectar
                            </Button>
                          </div>
                        );
                      } else if (isExpired) {
                        return (
                          <div className="text-sm">
                            <p className="text-warning font-medium mb-2 text-xs">Sesión Expirada</p>
                            <Button variant="outline" size="sm" className="w-full border-warning text-warning hover:bg-warning/10" onClick={handleInstagramConnect}>
                              Reconectar Instagram
                            </Button>
                          </div>
                        );
                      } else {
                        return (
                          <Button variant="default" size="sm" className="w-full bg-[#E1306C] hover:bg-[#C13584] text-white border-0" onClick={handleInstagramConnect}>
                            Conectar Instagram
                          </Button>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* TikTok Connection */}
                {/* TikTok Connection */}
                <div className="group p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background transition-colors space-y-3 relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform -rotate-12">
                    <svg className="w-24 h-24 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white">
                        {/* Simple TikTok Icon or text */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                      </div>
                      <span className="font-semibold">TikTok</span>
                    </div>
                    {profile.tiktokConnected ? (
                      <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Conectado
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">No conectado</span>
                    )}
                  </div>

                  <div className="relative z-10 pt-1">
                    {(() => {
                      if (profile.tiktokConnected) {
                        return (
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-3 text-xs">Usuario <span className="text-foreground font-medium">@{socialHandles.tiktok}</span></p>
                            <Button variant="outline" size="sm" className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={handleTikTokDisconnect}>
                              Desconectar
                            </Button>
                          </div>
                        );
                      } else {
                        return (
                          <Button variant="default" size="sm" className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 border-0" onClick={handleTikTokConnect}>
                            Conectar TikTok
                          </Button>
                        );
                      }
                    })()}
                  </div>
                </div>


              </div>
            </div>

            {/* API Trust Badge */}
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Conexiones seguras · APIs oficiales
              </div>
              <div className="flex items-center gap-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/3840px-Meta_Platforms_Inc._logo.svg.png"
                  alt="Meta"
                  className="h-4 w-auto object-contain opacity-50 dark:brightness-0 dark:invert"
                />
                <span className="text-border">·</span>
                <div className="flex items-center gap-1.5 opacity-50">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                  <span className="text-xs font-bold">TikTok</span>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
                Tus credenciales nunca son almacenadas por RELA Collab.
                <a href="/como-conectar-mi-cuenta-de-instagram" className="underline ml-1 hover:text-foreground transition-colors">¿Cómo funciona?</a>
              </p>
            </div>

            {/* AI Profile Analysis Link */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Análisis de Perfil con IA
              </h3>
              <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ver tus Insights con IA</h4>
                  <p className="text-sm text-muted-foreground">Explora a fondo tu rendimiento, análisis de contenido y métricas de audiencia.</p>
                </div>
                <Button asChild>
                  <a href="/creator/analytics">Ver Analíticas</a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={connectDialog.isOpen} onOpenChange={(open) => !open && setConnectDialog({ ...connectDialog, isOpen: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar {connectDialog.platform === 'instagram' ? 'Instagram' : 'TikTok'}</DialogTitle>
              <DialogDescription>
                Ingresa tu usuario para conectar tu cuenta.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={tempHandle}
                    onChange={(e) => setTempHandle(e.target.value)}
                    className="pl-7"
                    placeholder="usuario"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConnectDialog({ ...connectDialog, isOpen: false })}>Cancelar</Button>
              <Button onClick={handleConnectSubmit}>Conectar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InstagramConnectModal
          isOpen={isInstagramModalOpen}
          onClose={() => setIsInstagramModalOpen(false)}
          onConfirm={proceedWithInstagramConnect}
        />
      </main>
    </div>
  );
}