import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Loader2, Plus, Edit, Trash2, ArrowLeft, Image as ImageIcon, MapPin, ShieldCheck, Mail, User, Building2, Globe } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePrompt } from "@/components/brand/UpgradePrompt";
import { CREATOR_NICHES } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface BrandProfile {
    id?: string;
    ownerId: string;
    brandName: string;
    contactPerson: string;
    phone: string;
    website: string;
    industry: string;
    location: string;
    description: string;
    instagram: string;
    photoURL: string;
    createdAt?: string;
    updatedAt?: string;
}

const emptyBrandProfile = (ownerId: string): BrandProfile => ({
    ownerId,
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

export default function BrandSettings() {
    const { user } = useAuth();
    const { limits, isWithinLimit, recommendedUpgrade } = usePlanLimits();
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [brands, setBrands] = useState<BrandProfile[]>([]);
    
    // UI State
    const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [userDoc, setUserDoc] = useState<any>(null);
    const [savingUser, setSavingUser] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchUserDoc = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserDoc(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching user doc:", error);
        }
    };

    const fetchBrands = async () => {
        if (!user) return;
        setFetching(true);
        try {
            const brandsRef = collection(db, "brand_profiles");
            const q = query(brandsRef, where("ownerId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            const fetchedBrands: BrandProfile[] = [];
            querySnapshot.forEach((doc) => {
                fetchedBrands.push({ id: doc.id, ...doc.data() } as BrandProfile);
            });

            // Automatic Migration Check
            if (fetchedBrands.length === 0) {
                const userDocSnap = await getDoc(doc(db, "users", user.uid));
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    if (data.brandName || data.displayName || data.industry) { // Indicates legacy user has brand data
                        const migratedBrand: BrandProfile = {
                            ownerId: user.uid,
                            brandName: data.brandName || data.displayName || "",
                            contactPerson: data.contactPerson || "",
                            phone: data.phone || "",
                            website: data.website || "",
                            industry: data.industry || "",
                            location: data.location || "",
                            description: data.description || "",
                            instagram: data.socialLinks?.instagram || data.instagram || "",
                            photoURL: data.photoURL || user.photoURL || "",
                            createdAt: new Date().toISOString()
                        };
                        const docRef = await addDoc(collection(db, "brand_profiles"), migratedBrand);
                        fetchedBrands.push({ id: docRef.id, ...migratedBrand });
                    }
                }
            }
            
            setBrands(fetchedBrands);
        } catch (error) {
            console.error("Error fetching brands:", error);
            toast.error("Error al cargar las marcas");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchBrands();
        fetchUserDoc();
    }, [user]);

    const handleUpdate = (key: keyof BrandProfile, value: string) => {
        if (selectedBrand) {
            setSelectedBrand({ ...selectedBrand, [key]: value });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !selectedBrand) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor, sube un archivo de imagen");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("El tamaño del archivo debe ser menor a 5MB");
            return;
        }

        const toastId = toast.loading("Subiendo logo...");

        try {
            const brandIdFolder = selectedBrand.id || "new_brand";
            const storageRef = ref(storage, `brand_logos/${user.uid}/${brandIdFolder}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setSelectedBrand(prev => prev ? ({ ...prev, photoURL: downloadURL }) : null);

            toast.success("¡Logo de la marca actualizado!", { id: toastId });
        } catch (error) {
            toast.error("Error al subir el logo", { id: toastId });
        }
    };

    const handleChangePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!user || !selectedBrand) return;
        if (!selectedBrand.brandName.trim()) {
            toast.error("El nombre de la marca es requerido");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...selectedBrand,
                updatedAt: new Date().toISOString()
            };

            if (isCreating) {
                payload.createdAt = new Date().toISOString();
                await addDoc(collection(db, "brand_profiles"), payload);
                toast.success("Marca creada exitosamente");
            } else if (selectedBrand.id) {
                await updateDoc(doc(db, "brand_profiles", selectedBrand.id), payload);
                toast.success("Marca actualizada exitosamente");
            }
            
            setSelectedBrand(null);
            setIsCreating(false);
            fetchBrands();
        } catch (error) {
            console.error("Error saving brand:", error);
            toast.error("Error al guardar la marca");
        } finally {
            setLoading(false);
        }
    };

    const handleNewBrand = () => {
        if (!isWithinLimit(brands.length, limits.maxBrands)) {
            setUpgradeOpen(true);
            return;
        }
        setSelectedBrand(emptyBrandProfile(user!.uid));
        setIsCreating(true);
    };

    const handleDeleteBrand = async (brandId: string) => {
        if (!brandId) return;
        try {
            await deleteDoc(doc(db, "brand_profiles", brandId));
            toast.success("Marca eliminada exitosamente");
            fetchBrands();
        } catch (error) {
            console.error("Error deleting brand:", error);
            toast.error("Error al eliminar la marca");
        }
    };

    const handleSaveUserDoc = async () => {
        if (!user || !userDoc) return;
        setSavingUser(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                ...userDoc,
                updatedAt: new Date().toISOString()
            });
            toast.success("Configuración guardada correctamente");
        } catch (error) {
            console.error("Error updating user doc:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSavingUser(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        try {
            const requestReset = httpsCallable(functions, "requestPasswordReset");
            await requestReset({ email: user.email });
            toast.success("Se ha enviado un correo para restablecer tu contraseña");
        } catch (error) {
            console.error("Error sending reset email:", error);
            toast.error("Error al enviar el correo de restablecimiento");
        }
    };

    const handleUpdateUserField = (key: string, value: any) => {
        setUserDoc(prev => prev ? ({ ...prev, [key]: value }) : null);
    };

    if (fetching) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader 
                    title="Configuración" 
                    subtitle="Gestiona tu cuenta, información corporativa y perfiles de marca" 
                />

                <Tabs defaultValue="perfil" className="w-full space-y-6">
                    <TabsList className="flex w-full md:w-fit overflow-x-auto bg-muted/50 p-1 no-scrollbar">
                        <TabsTrigger value="perfil" className="flex-1 md:px-6">Mi Perfil</TabsTrigger>
                        <TabsTrigger value="empresa" className="flex-1 md:px-6">Empresa</TabsTrigger>
                        <TabsTrigger value="marcas" className="flex-1 md:px-6 whitespace-nowrap">Mis Marcas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="perfil" className="space-y-6 animate-in fade-in-50 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <Card className="glass-card overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Datos Personales</CardTitle>
                                            <CardDescription>Información básica de tu cuenta</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Nombre Completo</Label>
                                        <Input
                                            id="displayName"
                                            value={userDoc?.displayName || ""}
                                            onChange={(e) => handleUpdateUserField("displayName", e.target.value)}
                                            placeholder="Tu nombre"
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="pl-10 bg-muted/50 border-border/50 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">El correo no puede ser modificado por seguridad.</p>
                                    </div>
                                    <Button 
                                        onClick={handleSaveUserDoc} 
                                        disabled={savingUser}
                                        className="w-full mt-4"
                                    >
                                        {savingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Guardar Perfil
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Security */}
                            <Card className="glass-card overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/10">
                                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Seguridad</CardTitle>
                                            <CardDescription>Protege el acceso a tu cuenta</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                <ShieldCheck className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-medium text-amber-900 dark:text-amber-200">Restablecer Contraseña</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Te enviaremos un correo electrónico con un enlace seguro para que puedas crear una nueva contraseña.
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={handleResetPassword}
                                            className="w-full border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                                        >
                                            Enviar correo de restablecimiento
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="empresa" className="space-y-6 animate-in fade-in-50 duration-300">
                        <Card className="glass-card max-w-4xl mx-auto">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Información Corporativa</CardTitle>
                                        <CardDescription>Datos de la marca o empresa principal que representa esta cuenta</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="mainBrandName">Nombre de la Empresa / Marca Principal</Label>
                                        <Input
                                            id="mainBrandName"
                                            value={userDoc?.brandName || ""}
                                            onChange={(e) => handleUpdateUserField("brandName", e.target.value)}
                                            placeholder="Nombre corporativo"
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mainIndustry">Industria Principal</Label>
                                        <Select 
                                            value={userDoc?.industry || ""} 
                                            onValueChange={(val) => handleUpdateUserField("industry", val)}
                                        >
                                            <SelectTrigger className="bg-background/50 border-border/50">
                                                <SelectValue placeholder="Seleccionar industria" />
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
                                    <div className="space-y-2">
                                        <Label htmlFor="mainWebsite">Sitio Web Corporativo</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="mainWebsite"
                                                type="url"
                                                value={userDoc?.website || ""}
                                                onChange={(e) => handleUpdateUserField("website", e.target.value)}
                                                placeholder="https://empresa.com"
                                                className="pl-10 bg-background/50 border-border/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mainLocation">Sede / Ubicación</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="mainLocation"
                                                value={userDoc?.location || ""}
                                                onChange={(e) => handleUpdateUserField("location", e.target.value)}
                                                placeholder="Ciudad, País"
                                                className="pl-10 bg-background/50 border-border/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mainContactPerson">Persona de Contacto</Label>
                                        <Input
                                            id="mainContactPerson"
                                            value={userDoc?.contactPerson || ""}
                                            onChange={(e) => handleUpdateUserField("contactPerson", e.target.value)}
                                            placeholder="Nombre del responsable"
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mainPhone">WhatsApp / Teléfono Corporativo</Label>
                                        <Input
                                            id="mainPhone"
                                            type="tel"
                                            value={userDoc?.phone || ""}
                                            onChange={(e) => handleUpdateUserField("phone", e.target.value)}
                                            placeholder="+1 ..."
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mainDescription">Descripción de la Empresa</Label>
                                    <Textarea
                                        id="mainDescription"
                                        value={userDoc?.description || ""}
                                        onChange={(e) => handleUpdateUserField("description", e.target.value)}
                                        placeholder="Breve descripción de la compañía..."
                                        className="min-h-[120px] bg-background/50 border-border/50"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button 
                                        onClick={handleSaveUserDoc} 
                                        disabled={savingUser}
                                        className="w-full md:w-auto"
                                    >
                                        {savingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Guardar Información Corporativa
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="marcas" className="space-y-6 animate-in fade-in-50 duration-300">
                        {!selectedBrand && !isCreating ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">Mis Marcas / Perfiles</h2>
                                        <p className="text-muted-foreground mt-1">Gestiona los diferentes perfiles de marca para tus campañas.</p>
                                    </div>
                                    <Button onClick={handleNewBrand} className="shadow-lg shadow-primary/20">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar Perfil
                                    </Button>
                                </div>

                                {brands.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-card/30 backdrop-blur-sm">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold">No hay perfiles de marca</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto mb-8">
                                            Crea tu primer perfil de marca para empezar a colaborar con creadores.
                                        </p>
                                        <Button onClick={handleNewBrand} size="lg">
                                            Crear mi primera marca
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {brands.map((brand) => (
                                            <Card key={brand.id} className="glass-card hover-glow group transition-all duration-300">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                            {brand.photoURL ? (
                                                                <img src={brand.photoURL} alt={brand.brandName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <CardTitle className="text-lg truncate">{brand.brandName || "Sin Nombre"}</CardTitle>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                                <span className="capitalize">{brand.industry || "Sin industria"}</span>
                                                                {brand.location && (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                                        <span className="truncate">{brand.location}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <div className="px-6 pb-6 flex gap-2">
                                                    <Button variant="secondary" className="flex-1 bg-muted/50 hover:bg-muted" onClick={() => {
                                                        setSelectedBrand(brand);
                                                        setIsCreating(false);
                                                    }}>
                                                        <Edit className="w-4 h-4 mr-2" /> Editar
                                                    </Button>
                                                    
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="glass-card border-none ring-1 ring-border/50">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Eliminar {brand.brandName}?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de esta marca.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-muted hover:bg-muted/80">Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteBrand(brand.id!)} className="bg-destructive hover:bg-destructive/90">
                                                                    Eliminar
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                <Button variant="ghost" onClick={() => {
                                    setSelectedBrand(null);
                                    setIsCreating(false);
                                }} className="mb-2 -ml-3 text-muted-foreground hover:bg-muted">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis marcas
                                </Button>

                                <Card className="glass-card max-w-3xl border border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-2xl">{isCreating ? `Agregar Nuevo Perfil de Marca` : "Editar Perfil de Marca"}</CardTitle>
                                        <CardDescription>
                                            {isCreating 
                                                ? "Ingresa los datos para este nuevo perfil de marca. Útil para gestionar diferentes líneas de productos."
                                                : "Actualiza los detalles que verán los creadores sobre esta marca específica."
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8 pt-4">
                                        {/* Avatar Upload */}
                                        <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl bg-muted/30 border border-border/50">
                                            <div className="relative group">
                                                <img
                                                    src={selectedBrand?.photoURL || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop"}
                                                    alt="Brand Logo"
                                                    className="w-32 h-32 rounded-3xl object-cover ring-4 ring-primary/20 group-hover:scale-105 transition-all duration-500"
                                                />
                                                <button 
                                                    onClick={handleChangePhoto}
                                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
                                                >
                                                    <ImageIcon className="w-8 h-8 text-white" />
                                                </button>
                                            </div>
                                            <div className="text-center sm:text-left space-y-2">
                                                <h3 className="text-lg font-semibold">Logotipo de la Marca</h3>
                                                <p className="text-sm text-muted-foreground max-w-xs">
                                                    Este logo se mostrará a los creadores cuando invites a participar en campañas.
                                                </p>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                                                    <Button variant="outline" size="sm" onClick={handleChangePhoto} className="border-border/50 bg-background hover:bg-muted">
                                                        Subir nueva imagen
                                                    </Button>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <Label htmlFor="brandName">Nombre Comercial de la Marca <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="brandName"
                                                    value={selectedBrand?.brandName || ""}
                                                    onChange={(e) => handleUpdate("brandName", e.target.value)}
                                                    placeholder="Ej: Secalia Polvo"
                                                    className="bg-background/50 border-border/50 h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="industry">Categoría / Industria</Label>
                                                <Select value={selectedBrand?.industry || ""} onValueChange={(val) => handleUpdate("industry", val)}>
                                                    <SelectTrigger className="bg-background/50 border-border/50 h-11">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fashion">Moda</SelectItem>
                                                        <SelectItem value="beauty">Belleza</SelectItem>
                                                        <SelectItem value="tech">Tecnología</SelectItem>
                                                        <SelectItem value="food">Alimentos & Bebidas</SelectItem>
                                                        <SelectItem value="fitness">Fitness</SelectItem>
                                                        <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
                                                        <SelectItem value="travel">Viajes</SelectItem>
                                                        <SelectItem value="hospitality">Hospitalidad</SelectItem>
                                                        <SelectItem value="retail">Retail</SelectItem>
                                                        <SelectItem value="health">Salud</SelectItem>
                                                        <SelectItem value="entertainment">Entretenimiento</SelectItem>
                                                        <SelectItem value="other">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="website">Sitio Web Específico</Label>
                                                <Input
                                                    id="website"
                                                    type="url"
                                                    value={selectedBrand?.website || ""}
                                                    onChange={(e) => handleUpdate("website", e.target.value)}
                                                    placeholder="www.larca.com"
                                                    className="bg-background/50 border-border/50 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="instagram">Perfil de Instagram</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground italic">@</span>
                                                    <Input
                                                        id="instagram"
                                                        value={selectedBrand?.instagram || ""}
                                                        onChange={(e) => handleUpdate("instagram", e.target.value)}
                                                        placeholder="marca_official"
                                                        className="pl-8 bg-background/50 border-border/50 h-11"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="contactPerson">Persona de Contacto</Label>
                                                <Input
                                                    id="contactPerson"
                                                    value={selectedBrand?.contactPerson || ""}
                                                    onChange={(e) => handleUpdate("contactPerson", e.target.value)}
                                                    placeholder="Nombre del responsable"
                                                    className="bg-background/50 border-border/50 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">WhatsApp / Teléfono</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={selectedBrand?.phone || ""}
                                                    onChange={(e) => handleUpdate("phone", e.target.value)}
                                                    placeholder="+1 ..."
                                                    className="bg-background/50 border-border/50 h-11"
                                                />
                                            </div>
                                            
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="location">Ubicación / Ciudad</Label>
                                                <Input
                                                    id="location"
                                                    value={selectedBrand?.location || ""}
                                                    onChange={(e) => handleUpdate("location", e.target.value)}
                                                    placeholder="Santo Domingo, RD"
                                                    className="bg-background/50 border-border/50 h-11"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Biografía / Propuesta de Valor</Label>
                                            <Textarea
                                                id="description"
                                                value={selectedBrand?.description || ""}
                                                onChange={(e) => handleUpdate("description", e.target.value)}
                                                placeholder="Describe brevemente qué hace a esta marca única..."
                                                className="min-h-[140px] bg-background/50 border-border/50 resize-none"
                                            />
                                        </div>

                                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-end">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setSelectedBrand(null)} 
                                                className="border-border/50 order-2 sm:order-1 hover:bg-muted"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button 
                                                onClick={handleSave} 
                                                disabled={loading} 
                                                className="min-w-[180px] order-1 sm:order-2 shadow-lg shadow-primary/25"
                                            >
                                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isCreating ? "Crear Perfil" : "Guardar Cambios"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
            
            <UpgradePrompt
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                reason={`Tu plan actual permite máximo ${limits.maxBrands === 1 ? "1 marca" : `${limits.maxBrands} marcas`}. Actualiza tu plan para registrar más marcas.`}
                recommendedPlan={recommendedUpgrade()}
            />
        </div>
    );
}

