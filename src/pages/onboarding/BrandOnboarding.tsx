import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Loader2, LogOut } from "lucide-react";

const PLANS = [
    {
        name: "Basic",
        price: "$29",
        description: "Essential tools for small brands",
        features: ["Up to 3 active campaigns", "Basic creator search", "Email support"]
    },
    {
        name: "Starter",
        price: "$99",
        description: "Perfect for growing businesses",
        features: ["Up to 10 active campaigns", "Advanced filtering", "Priority support", "Analytics"]
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large scale operations",
        features: ["Unlimited campaigns", "Dedicated account manager", "API access", "White labelling"]
    }
];

export default function BrandOnboarding() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        website: "",
        industry: "",
        selectedPlan: "",
        location: "",
        description: ""
    });

    const handleUpdate = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.companyName || !formData.industry) {
                toast.error("Please fill in all required fields");
                return;
            }
            setStep(2);
        }
    };

    const handleComplete = async () => {
        if (!formData.selectedPlan) {
            toast.error("Please select a plan");
            return;
        }

        setLoading(true);
        try {
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                brandName: formData.companyName,
                website: formData.website,
                industry: formData.industry,
                location: formData.location,
                description: formData.description,
                plan: formData.selectedPlan,
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            });

            toast.success("Welcome aboard!");
            // Force a reload or update context to reflect onboarding status change if needed, 
            // but simpler to just navigate and let the protected route check handle it on next load 
            // or we update the local state in context (ideal).
            // For now, simple navigation:
            window.location.href = "/brand";
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Logout Button */}
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                </Button>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Set up your Brand Profile</h1>
                <p className="text-muted-foreground">Step {step} of 2: {step === 1 ? "Company Details" : "Select Plan"}</p>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>Tell us about your brand to help creators find you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                                id="companyName"
                                placeholder="Acme Inc."
                                value={formData.companyName}
                                onChange={(e) => handleUpdate("companyName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={(e) => handleUpdate("website", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry *</Label>
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
                                placeholder="City, Country (e.g. New York, USA)"
                                value={formData.location}
                                onChange={(e) => handleUpdate("location", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Brand Description</Label>
                            <Input
                                id="description"
                                placeholder="Short bio or mission statement..."
                                value={formData.description}
                                onChange={(e) => handleUpdate("description", e.target.value)}
                            />
                        </div>
                        <Button onClick={handleNext} className="w-full">Next: Select Plan</Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANS.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`cursor-pointer transition-all border-2 ${formData.selectedPlan === plan.name ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                                onClick={() => handleUpdate("selectedPlan", plan.name)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {plan.name}
                                        {formData.selectedPlan === plan.name && <Check className="w-5 h-5 text-primary" />}
                                    </CardTitle>
                                    <div className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-2">
                                        {plan.features.map(feat => (
                                            <li key={feat} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" /> {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
                        <Button onClick={handleComplete} className="w-2/3" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Setup
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
