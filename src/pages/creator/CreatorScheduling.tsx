import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Clock, AlertCircle, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";
import { format, isSameDay, parseISO } from "date-fns";

interface ScheduleEvent {
    id: string;
    type: "visit" | "deadline";
    title: string;
    brandName: string;
    date: Date;
    status: string;
    location?: string;
    time?: string;
    duration?: number;
    campaignId: string;
}

export default function CreatorScheduling() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [visitsCount, setVisitsCount] = useState(0);
    const [deadlinesCount, setDeadlinesCount] = useState(0);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user) return;
            try {
                const newEvents: ScheduleEvent[] = [];
                let vCount = 0;
                let dCount = 0;

                // 1. Fetch Visits
                const visitsQuery = query(
                    collection(db, "visitSchedules"),
                    where("creatorId", "==", user.uid)
                );
                const visitsSnapshot = await getDocs(visitsQuery);

                for (const visitDoc of visitsSnapshot.docs) {
                    const visitData = visitDoc.data();

                    // Fetch campaign & brand info if needed (or just use stored fields if they exist)
                    // Assuming visitData has campaignId/brandId
                    let campaignTitle = "Campaign Visit";
                    let brandName = "Brand";

                    if (visitData.campaignId) {
                        const cDoc = await getDoc(doc(db, "campaigns", visitData.campaignId));
                        if (cDoc.exists()) campaignTitle = cDoc.data().name;
                    }
                    if (visitData.brandId) {
                        const bDoc = await getDoc(doc(db, "users", visitData.brandId));
                        if (bDoc.exists()) brandName = bDoc.data().displayName || bDoc.data().brandName || "Brand";
                    }

                    newEvents.push({
                        id: visitDoc.id,
                        type: "visit",
                        title: `${campaignTitle} (Visit)`,
                        brandName: brandName,
                        date: new Date(visitData.scheduledDate),
                        status: visitData.status,
                        location: visitData.location?.city || "Location",
                        time: visitData.scheduledTime,
                        duration: visitData.duration,
                        campaignId: visitData.campaignId
                    });
                    vCount++;
                }

                // 2. Fetch Active Campaigns for Deadlines
                // First get approved applications
                const appsQuery = query(
                    collection(db, "applications"),
                    where("creatorId", "==", user.uid),
                    where("status", "==", "approved")
                );
                const appsSnapshot = await getDocs(appsQuery);

                for (const appDoc of appsSnapshot.docs) {
                    const appData = appDoc.data();
                    const campaignId = appData.campaignId;

                    if (campaignId) {
                        const campaignDoc = await getDoc(doc(db, "campaigns", campaignId));
                        if (campaignDoc.exists()) {
                            const campaignData = campaignDoc.data();

                            // Check for deadline
                            if (campaignData.deadline) {
                                let deadlineDate: Date;
                                // Handle Timestamp or string
                                if (campaignData.deadline instanceof Timestamp) {
                                    deadlineDate = campaignData.deadline.toDate();
                                } else {
                                    deadlineDate = new Date(campaignData.deadline);
                                }

                                // Fetch brand name
                                let brandName = campaignData.brandName || "Brand";
                                if (!brandName && campaignData.brandId) {
                                    const bDoc = await getDoc(doc(db, "users", campaignData.brandId));
                                    if (bDoc.exists()) brandName = bDoc.data().displayName || bDoc.data().brandName;
                                }

                                newEvents.push({
                                    id: `deadline_${campaignId}`,
                                    type: "deadline",
                                    title: `${campaignData.name} (Deadline)`,
                                    brandName: brandName,
                                    date: deadlineDate,
                                    status: "active",
                                    campaignId: campaignId
                                });
                                dCount++;
                            }
                        }
                    }
                }

                setEvents(newEvents);
                setVisitsCount(vCount);
                setDeadlinesCount(dCount);

            } catch (error) {
                console.error("Error fetching schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user]);

    // Filter events for selected date
    const selectedDateEvents = events.filter(event =>
        selectedDate && isSameDay(event.date, selectedDate)
    );

    const upcomingEvents = events
        .filter(e => e.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5);

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
                    subtitle="Manage visits and track campaign deadlines"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Calendar & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Calendar Card */}
                        <Card className="border-border/50 shadow-sm">
                            <CardContent className="p-4 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border shadow-none"
                                    modifiers={{
                                        hasEvent: (date) => events.some(e => isSameDay(e.date, date)),
                                        hasVisit: (date) => events.some(e => e.type === 'visit' && isSameDay(e.date, date)),
                                        hasDeadline: (date) => events.some(e => e.type === 'deadline' && isSameDay(e.date, date))
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: "font-bold",
                                        hasVisit: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
                                        hasDeadline: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <MapPin className="w-6 h-6 text-blue-500 mb-2" />
                                    <span className="text-2xl font-bold">{visitsCount}</span>
                                    <span className="text-xs text-muted-foreground">Total Visits</span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Clock className="w-6 h-6 text-orange-500 mb-2" />
                                    <span className="text-2xl font-bold">{deadlinesCount}</span>
                                    <span className="text-xs text-muted-foreground">Active Deadlines</span>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Events List */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Selected Date Events */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                            </h2>

                            {selectedDateEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDateEvents.map(event => (
                                        <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                            <div className={`h-full w-1.5 absolute left-0 top-0 bottom-0 ${event.type === 'visit' ? 'bg-blue-500' : 'bg-orange-500'
                                                }`} />
                                            <CardContent className="p-5 pl-7">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant={event.type === 'visit' ? "default" : "secondary"}
                                                                className={event.type === 'visit' ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600 text-white"}>
                                                                {event.type === 'visit' ? "Visit" : "Deadline"}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">{event.brandName}</span>
                                                        </div>
                                                        <h3 className="font-semibold text-lg">{event.title}</h3>

                                                        {event.type === 'visit' && (
                                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4" />
                                                                    {event.time} ({event.duration} mins)
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4" />
                                                                    {event.location}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Link to={`/creator/campaigns`}>
                                                        <Button variant="ghost" size="icon">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                    <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No events scheduled for this day</p>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events List */}
                        <div className="pt-6 border-t">
                            <h2 className="text-lg font-semibold mb-3">All Upcoming</h2>
                            <div className="space-y-3">
                                {upcomingEvents.length > 0 ? (
                                    upcomingEvents.map(event => (
                                        <div key={`upcoming_${event.id}`} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${event.type === 'visit' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                {event.type === 'visit' ? <MapPin className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">{event.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(event.date, "MMM d")} • {event.brandName}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                                {event.type === 'visit' ? 'Visit' : 'Deadline'}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
