import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, DollarSign, ArrowLeft, Target, Sparkles, Loader2, MapPin, Briefcase } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function CampaignDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, "campaigns", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCampaign({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching campaign:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [id, user]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex min-h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">Campaign not found</h2>
                <Link to="/brand">
                    <Button>Go Back</Button>
                </Link>
            </div>
        );
    }

    // Calculate Progress (Placeholder logic for now, assumes 'hiredCount' might exist later)
    const hiredCount = campaign.hiredCount || 0;
    const neededCount = campaign.creatorCount || 1;
    const progress = (hiredCount / neededCount) * 100;

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />

            <main className="flex-1 ml-64 p-8">
                <div className="mb-6">
                    <Link to="/brand" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <DashboardHeader
                            title={campaign.name}
                            subtitle="Campaign Details & Progress"
                        />
                    </div>
                    <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                        <Button variant="hero" size="lg">
                            <Sparkles className="w-4 h-4 mr-2" />
                            View Matches
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">About this Campaign</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                        </div>

                        {/* Requirements */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">Targeting & Vibe</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <MapPin className="w-4 h-4" />
                                        Location
                                    </div>
                                    <div className="font-medium">{campaign.location || "Anywhere"}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Users className="w-4 h-4" />
                                        Age Range
                                    </div>
                                    <div className="font-medium">{campaign.ageRange}</div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Target className="w-4 h-4" />
                                        Goal
                                    </div>
                                    <div className="font-medium capitalize">{campaign.goal}</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <p className="text-sm text-muted-foreground mb-3">Vibe Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                    {campaign.vibes?.map((vibe: string) => (
                                        <Badge key={vibe} variant="secondary" className="px-3 py-1 capitalize">
                                            {vibe}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Progress Card */}
                        <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Hiring Progress
                            </h3>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">Creators Hired</span>
                                <span className="font-medium">{hiredCount} / {neededCount}</span>
                            </div>
                            <Progress value={progress} className="h-2 mb-4" />
                            <p className="text-xs text-muted-foreground mb-4">
                                You need {neededCount - hiredCount} more creator{neededCount - hiredCount !== 1 ? 's' : ''} to reach your goal.
                            </p>
                            <Link to={`/brand/matches?campaignId=${campaign.id}`}>
                                <Button className="w-full" variant="outline">Find Creators</Button>
                            </Link>
                        </div>

                        {/* Details Card */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Start Date</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>End Date</span>
                                </div>
                                <span className="font-medium">
                                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Budget</span>
                                </div>
                                <span className="font-medium text-success">
                                    ${campaign.budget?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
