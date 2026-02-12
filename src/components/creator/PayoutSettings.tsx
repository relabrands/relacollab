
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Building2, CreditCard, UserSquare2, FileText } from "lucide-react";

interface PayoutSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function PayoutSettings({ open, onOpenChange, onSuccess }: PayoutSettingsProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isServing, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        bankName: "",
        accountType: "",
        accountNumber: "",
        identityDocument: "", // RNC or Cedula
        accountHolder: ""
    });

    const BANKS = [
        "Banco Popular",
        "Banreservas",
        "BHD León",
        "Scotiabank",
        "Asociación Popular de Ahorros y Préstamos",
        "Asociación Cibao",
        "Asociación La Nacional",
        "Banesco",
        "Santa Cruz",
        "Promerica",
        "Vimenca",
        "Ademi",
        "Banco Caribe"
    ];

    useEffect(() => {
        if (open && user) {
            fetchBankDetails();
        }
    }, [open, user]);

    const fetchBankDetails = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.bankAccount) {
                    setFormData({
                        bankName: data.bankAccount.bankName || "",
                        accountType: data.bankAccount.accountType || "",
                        accountNumber: data.bankAccount.accountNumber || "",
                        identityDocument: data.bankAccount.identityDocument || "",
                        accountHolder: data.bankAccount.accountHolder || data.displayName || ""
                    });
                } else {
                    // Pre-fill holder name
                    setFormData(prev => ({ ...prev, accountHolder: data.displayName || "" }));
                }
            }
        } catch (error) {
            console.error("Error fetching bank details:", error);
            toast.error("Failed to load bank details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.bankName || !formData.accountType || !formData.accountNumber || !formData.identityDocument || !formData.accountHolder) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                bankAccount: {
                    ...formData,
                    updatedAt: new Date().toISOString()
                }
            });
            toast.success("Bank details saved successfully.");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving bank details:", error);
            toast.error("Failed to save bank details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configure Payout Method</DialogTitle>
                    <DialogDescription>
                        Enter your local bank details to receive payments.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankName" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Bank Name
                            </Label>
                            <Select
                                value={formData.bankName}
                                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BANKS.map(bank => (
                                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accountType" className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Account Type
                            </Label>
                            <Select
                                value={formData.accountType}
                                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="savings">Savings (Ahorros)</SelectItem>
                                    <SelectItem value="checking">Checking (Corriente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accountNumber" className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Account Number
                            </Label>
                            <Input
                                id="accountNumber"
                                placeholder="0000000000"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="identityDocument" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Identity Document (RNC/Cedula)
                            </Label>
                            <Input
                                id="identityDocument"
                                placeholder="001-0000000-0"
                                value={formData.identityDocument}
                                onChange={(e) => setFormData({ ...formData, identityDocument: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accountHolder" className="flex items-center gap-2">
                                <UserSquare2 className="w-4 h-4" /> Account Holder Name
                            </Label>
                            <Input
                                id="accountHolder"
                                placeholder="Full Name"
                                value={formData.accountHolder}
                                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isServing}>
                                {isServing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Details
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
