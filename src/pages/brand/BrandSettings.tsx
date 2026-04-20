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
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Loader2, Plus, Edit, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [brands, setBrands] = useState<BrandProfile[]>([]);
    
    // UI State
    const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (fetching) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Configuración de Marcas" subtitle="Gestiona los perfiles y preferencias de tus marcas" />

                {!selectedBrand && !isCreating ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">Mis Marcas</h2>
                                <p className="text-sm text-muted-foreground">Administra las marcas bajo tu cuenta corporativa.</p>
                            </div>
                            <Button onClick={() => {
                                setSelectedBrand(emptyBrandProfile(user!.uid));
                                setIsCreating(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Marca
                            </Button>
                        </div>

                        {brands.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg bg-card/50">
                                <h3 className="text-lg font-medium">No tienes marcas registradas</h3>
                                <p className="text-muted-foreground mt-1 mb-4">Comienza creando tu primer perfil de marca para lanzar campañas.</p>
                                <Button onClick={() => {
                                    setSelectedBrand(emptyBrandProfile(user!.uid));
                                    setIsCreating(true);
                                }}>
                                    Crear mi primera marca
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {brands.map((brand) => (
                                    <Card key={brand.id} className="relative group overflow-hidden">
                                        <CardHeader className="pb-4 flex flex-row items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                {brand.photoURL ? (
                                                    <img src={brand.photoURL} alt={brand.brandName} className="w-12 h-12 rounded-xl object-cover ring-1 ring-border" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground ring-1 ring-border">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">{brand.brandName || "Sin Nombre"}</CardTitle>
                                                    <CardDescription className="capitalize mt-0.5">{brand.industry || "Sin industria"}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <div className="px-6 pb-6 flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => {
                                                setSelectedBrand(brand);
                                                setIsCreating(false);
                                            }}>
                                                <Edit className="w-4 h-4 mr-2" /> Editar
                                            </Button>
                                            
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar {brand.brandName}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de esta marca.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBrand(brand.id!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                    <div className="space-y-6">
                        <Button variant="ghost" onClick={() => {
                            setSelectedBrand(null);
                            setIsCreating(false);
                        }} className="mb-2 -ml-3 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis marcas
                        </Button>

                        <Card className="max-w-3xl">
                            <CardHeader>
                                <CardTitle>{isCreating ? `Agregar ${brands.length > 0 ? "Nueva" : "Primera"} Marca` : "Editar Perfil de Marca"}</CardTitle>
                                <CardDescription>
                                    {isCreating && brands.length > 0
                                        ? "Ingresa los datos básicos de la nueva marca. La información de contacto de tu cuenta se hereda automáticamente."
                                        : "Esta información será visible para los creadores de esta marca."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar Upload */}
                                <div className="flex items-center gap-6 mb-6">
                                    <img
                                        src={selectedBrand?.photoURL || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop"}
                                        alt="Brand Logo"
                                        className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border"
                                    />
                                    <div>
                                        <h3 className="font-medium mb-1">Logo de la Marca</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Esto se mostrará en las campañas.</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                                                Cambiar Logo
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
                                        <Label htmlFor="brandName">Nombre de la Marca <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="brandName"
                                            value={selectedBrand?.brandName || ""}
                                            onChange={(e) => handleUpdate("brandName", e.target.value)}
                                            placeholder="Acme Inc."
                                        />
                                    </div>

                                    {/* Contact Person & Phone: only show for first brand or when editing */}
                                    {(!isCreating || brands.length === 0) && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="contactPerson">Persona de Contacto</Label>
                                                <Input
                                                    id="contactPerson"
                                                    value={selectedBrand?.contactPerson || ""}
                                                    onChange={(e) => handleUpdate("contactPerson", e.target.value)}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Número de Teléfono</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={selectedBrand?.phone || ""}
                                                    onChange={(e) => handleUpdate("phone", e.target.value)}
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="website">Sitio Web</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={selectedBrand?.website || ""}
                                            onChange={(e) => handleUpdate("website", e.target.value)}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Usuario de Instagram</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                            <Input
                                                id="instagram"
                                                value={selectedBrand?.instagram || ""}
                                                onChange={(e) => handleUpdate("instagram", e.target.value)}
                                                placeholder="brandname"
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industria</Label>
                                        <Select value={selectedBrand?.industry || ""} onValueChange={(val) => handleUpdate("industry", val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar industria" />
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
                                        <Label htmlFor="location">Ubicación</Label>
                                        <Input
                                            id="location"
                                            value={selectedBrand?.location || ""}
                                            onChange={(e) => handleUpdate("location", e.target.value)}
                                            placeholder="Ciudad, País"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Biografía / Descripción de la Marca</Label>
                                    <Textarea
                                        id="description"
                                        value={selectedBrand?.description || ""}
                                        onChange={(e) => handleUpdate("description", e.target.value)}
                                        placeholder="Cuéntale a los creadores sobre la misión de tu marca..."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isCreating ? "Crear Marca" : "Guardar Cambios"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}

