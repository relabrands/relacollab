import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";

interface VisitSchedule {
    id: string;
    campaignTitle: string;
    brandName: string;
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    location: {
        address: string;
        city: string;
    };
    status: "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled";
    contentDeadline: string;
}

export default function CreatorScheduling() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [visits, setVisits] = useState<VisitSchedule[]>([]);

    useEffect(() => {
        const fetchVisits = async () => {
            if (!user) return;
            try {
                const visitsQuery = query(
                    collection(db, "visitSchedules"),
                    where("creatorId", "==", user.uid)
                );
                const visitsSnapshot = await getDocs(visitsQuery);

                const visitsList: VisitSchedule[] = [];

                for (const visitDoc of visitsSnapshot.docs) {
                    const visitData = visitDoc.data();

                    // Fetch campaign info
                    const campaignDoc = await getDoc(doc(db, "campaigns", visitData.campaignId));
                    const campaignData = campaignDoc.exists() ? campaignDoc.data() : {};

                    // Fetch brand info
                    const brandDoc = await getDoc(doc(db, "users", visitData.brandId));
                    const brandData = brandDoc.exists() ? brandDoc.data() : {};

                    visitsList.push({
                        id: visitDoc.id,
                        campaignTitle: campaignData.name || "Campaign",
                        brandName: brandData.displayName || "Brand",
                        ...visitData
                    } as VisitSchedule);
                }

                // Sort by date
                visitsList.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

                setVisits(visitsList);
            } catch (error) {
                console.error("Error fetching visits:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, [user]);

    const upcomingVisits = visits.filter(v =>
        new Date(v.scheduledDate) >= new Date() && v.status !== "cancelled" && v.status !== "completed"
    );

    const pastVisits = visits.filter(v =>
        new Date(v.scheduledDate) < new Date() || v.status === "completed"
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-500/10 text-green-600 border-green-500/20";
            case "scheduled": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "completed": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
            case "rescheduled": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
            default: return "bg-muted text-muted-foreground";
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="creator" />
            <MobileNav type="creator" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="My Schedule"
                    subtitle="Manage your upcoming visits and content deadlines"
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-card p-6 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Upcoming Visits</p>
                                <p className="text-2xl font-bold">{upcomingVisits.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">{pastVisits.filter(v => v.status === "completed").length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/20 dark:to-orange-950/10">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Content</p>
                                <p className="text-2xl font-bold">
                                    {pastVisits.filter(v =>
                                        v.status === "completed" && new Date(v.contentDeadline) >= new Date()
                                    ).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Visits */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Visits</h2>
                    {upcomingVisits.length === 0 ? (
                        <div className="glass-card p-12 text-center text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming visits scheduled</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingVisits.map((visit) => (
                                <div key={visit.id} className="glass-card p-6 hover-lift">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{visit.campaignTitle}</h3>
                                            <p className="text-sm text-muted-foreground">{visit.brandName}</p>
                                        </div>
                                        <Badge className={`border ${getStatusColor(visit.status)}`}>
                                            {visit.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            <span>{new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{visit.duration} minutes</span>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p>{visit.location.address}</p>
                                                <p className="text-muted-foreground">{visit.location.city}</p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t">
                                            <p className="text-xs text-muted-foreground">Content deadline</p>
                                            <p className="text-sm font-medium">
                                                {new Date(visit.contentDeadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" size="sm" className="flex-1">
                                            Get Directions
                                        </Button>
                                        <Link to="/creator/messages" className="flex-1">
                                            <Button variant="default" size="sm" className="w-full">
                                                Message Brand
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Visits */}
                {pastVisits.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Past Visits</h2>
                        <div className="glass-card p-4">
                            <div className="space-y-2">
                                {pastVisits.map((visit) => (
                                    <div key={visit.id} className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{visit.campaignTitle}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(visit.scheduledDate).toLocaleDateString()} - {visit.location.city}
                                            </p>
                                        </div>
                                        <Badge className={`border ${getStatusColor(visit.status)}`}>
                                            {visit.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
