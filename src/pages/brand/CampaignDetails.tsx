import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, DollarSign, ArrowLeft, Target, Sparkles, Loader2, MapPin, Briefcase, FileCheck, UserCheck, Send } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function CampaignDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);

    // Real-time stats
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [collaboratingCount, setCollaboratingCount] = useState(0);

    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!id || !user) return;
            try {
                // Fetch campaign
                const docRef = doc(db, "campaigns", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const campaignData = { id: docSnap.id, ...docSnap.data() };
                    setCampaign(campaignData);

                    // Fetch applications for this campaign
                    const appsQuery = query(
                        collection(db, "applications"),
                        where("campaignId", "==", id)
                    );
                    const appsSnapshot = await getDocs(appsQuery);

                    const allApps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Count by status
                    const total = allApps.length;
                    const approved = allApps.filter((app: any) => app.status === "approved").length;
                    const collaborating = allApps.filter((app: any) =>
                        app.status === "approved" || app.status === "active" || app.status === "collaborating"
                    ).length;

                    setApplicationsCount(total);
                    setApprovedCount(approved);
                    setCollaboratingCount(collaborating);
                }
            } catch (error) {
                console.error("Error fetching campaign data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignData();
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

    const neededCount = campaign.creatorCount || 1;
    const progress = (approvedCount / neededCount) * 100;

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
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
                        {/* Stats Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-card p-6 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 border-blue-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Applications</p>
                                        <p className="text-2xl font-bold">{applicationsCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 border-green-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <UserCheck className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold">{approvedCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/10 border-purple-200/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Collaborating</p>
                                        <p className="text-2xl font-bold">{collaboratingCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">About this Campaign</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                        </div>

                        {/* Content Types & Compensation */}
                        {(campaign.contentTypes || campaign.compensationType) && (
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold mb-4">Content & Compensation</h3>
                                <div className="space-y-4">
                                    {campaign.contentTypes && campaign.contentTypes.length > 0 && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Content Types Needed</p>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.contentTypes.map((type: string) => (
                                                    <Badge key={type} variant="secondary" className="capitalize">
                                                        {type}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {campaign.compensationType && (
                                        <div className="bg-muted/30 p-4 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Compensation Type</p>
                                            <p className="font-medium capitalize">{campaign.compensationType === "monetary" ? "💰 Pago Monetario" : "🎁 Intercambio"}</p>
                                            {campaign.compensationType === "exchange" && campaign.exchangeDetails && (
                                                <p className="text-sm text-muted-foreground mt-2">{campaign.exchangeDetails}</p>
                                            )}
                                            {campaign.compensationType === "monetary" && campaign.creatorPayment && (
                                                <p className="text-sm mt-2">
                                                    <span className="text-muted-foreground">Creator Payment:</span>
                                                    <span className="font-medium text-green-600 ml-2">${campaign.creatorPayment}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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

                            {campaign.vibes && campaign.vibes.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-3">Vibe Keywords</p>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.vibes.map((vibe: string) => (
                                            <Badge key={vibe} variant="secondary" className="px-3 py-1 capitalize">
                                                {vibe}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                <span className="font-medium">{approvedCount} / {neededCount}</span>
                            </div>
                            <Progress value={progress} className="h-2 mb-4" />
                            <p className="text-xs text-muted-foreground mb-4">
                                {approvedCount >= neededCount
                                    ? "🎉 Goal reached! You've hired all needed creators."
                                    : `You need ${neededCount - approvedCount} more creator${neededCount - approvedCount !== 1 ? 's' : ''} to reach your goal.`
                                }
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
