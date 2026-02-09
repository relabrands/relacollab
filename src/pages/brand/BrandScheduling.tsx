import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Clock, Filter, Search, User, ChevronRight } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Link } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScheduleEvent {
    id: string;
    type: "visit" | "deadline";
    title: string;
    creatorName: string;
    creatorAvatar?: string;
    date: Date;
    status: string;
    location?: string;
    time?: string;
    duration?: number;
    campaignId: string;
}

export default function BrandScheduling() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [filterCampaign, setFilterCampaign] = useState<string>("all");
    const [searchCreator, setSearchCreator] = useState("");
    const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user) return;
            try {
                const newEvents: ScheduleEvent[] = [];
                const campaignsList: { id: string, name: string }[] = [];

                // 1. Fetch Brand's Campaigns
                const campaignsQuery = query(
                    collection(db, "campaigns"),
                    where("brandId", "==", user.uid)
                );
                const campaignsSnapshot = await getDocs(campaignsQuery);
                const campaignIds: string[] = [];

                campaignsSnapshot.docs.forEach(doc => {
                    campaignIds.push(doc.id);
                    campaignsList.push({ id: doc.id, name: doc.data().name });

                    // Add Deadline Event
                    const data = doc.data();
                    const deadlineField = data.deadline || data.endDate;

                    if (deadlineField) {
                        let deadlineDate: Date;
                        if (deadlineField instanceof Timestamp) {
                            deadlineDate = deadlineField.toDate();
                        } else {
                            deadlineDate = new Date(deadlineField);
                        }

                        // Only add if future or recent past
                        // newEvents.push({ ... }) -> We might want to see all deadlines?
                        // Let's add them.
                        newEvents.push({
                            id: `deadline_${doc.id}`,
                            type: "deadline",
                            title: `${data.name} (Deadline)`,
                            creatorName: "All Creators",
                            date: deadlineDate,
                            status: "active",
                            campaignId: doc.id
                        });
                    }
                });

                setCampaigns(campaignsList);

                if (campaignIds.length > 0) {
                    // 2. Fetch Visits for these campaigns
                    // Firestore 'in' query limit is 10. If > 10, we might need multiple queries or fetch all and filter.
                    // For now, let's fetch by campaignId if small, or maybe just fetch all visitSchedules where brandId == user.uid (if added to visitSchedule)

                    // In CreatorScheduling.tsx reading logic, I saw `visitData.brandId`. 
                    // Let's check if I can query by brandId directly.
                    const visitsQuery = query(
                        collection(db, "visitSchedules"),
                        where("brandId", "==", user.uid)
                    );
                    const visitsSnapshot = await getDocs(visitsQuery);

                    for (const visitDoc of visitsSnapshot.docs) {
                        const visitData = visitDoc.data();

                        // Fetch creator info
                        let creatorName = "Unknown Creator";
                        let creatorAvatar = "";
                        if (visitData.creatorId) {
                            const cDoc = await getDoc(doc(db, "users", visitData.creatorId));
                            if (cDoc.exists()) {
                                const cData = cDoc.data();
                                creatorName = cData.displayName || cData.fullName || "Creator";
                                creatorAvatar = cData.photoURL || cData.avatar;
                            }
                        }

                        // Find campaign name
                        const campaign = campaignsList.find(c => c.id === visitData.campaignId);
                        const campaignName = campaign ? campaign.name : "Campaign";

                        newEvents.push({
                            id: visitDoc.id,
                            type: "visit",
                            title: `${campaignName} - Visit`,
                            creatorName: creatorName,
                            creatorAvatar: creatorAvatar,
                            date: new Date(visitData.scheduledDate),
                            status: visitData.status,
                            location: visitData.location?.city || "Location",
                            time: visitData.scheduledTime,
                            duration: visitData.duration,
                            campaignId: visitData.campaignId
                        });
                    }
                }

                setEvents(newEvents);
            } catch (error) {
                console.error("Error fetching schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user]);

    // Filter events
    const filteredEvents = events.filter(event => {
        const matchDate = selectedDate ? isSameDay(event.date, selectedDate) : true;
        const matchCampaign = filterCampaign === "all" || event.campaignId === filterCampaign;
        const matchCreator = !searchCreator || event.creatorName.toLowerCase().includes(searchCreator.toLowerCase());

        return matchCampaign && matchCreator;
    });

    const selectedDateEvents = filteredEvents.filter(event =>
        selectedDate && isSameDay(event.date, selectedDate)
    );

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader
                    title="Campaign Schedule"
                    subtitle="Track creator visits and campaign deadlines"
                />

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search creator..."
                            value={searchCreator}
                            onChange={(e) => setSearchCreator(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                        <SelectTrigger className="w-full md:w-[250px]">
                            <SelectValue placeholder="Filter by Campaign" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            {campaigns.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Calendar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardContent className="p-4 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border shadow-none"
                                    modifiers={{
                                        hasVisit: (date) => events.some(e => e.type === 'visit' && isSameDay(e.date, date)),
                                        hasDeadline: (date) => events.some(e => e.type === 'deadline' && isSameDay(e.date, date))
                                    }}
                                    modifiersClassNames={{
                                        hasVisit: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
                                        hasDeadline: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                    }}
                                />
                            </CardContent>
                        </Card>

                        <div className="glass-card p-4 space-y-3">
                            <h3 className="font-semibold text-sm">Legend</h3>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span>Creator Visit</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                <span>Content Deadline</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Events List */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                        </h2>

                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateEvents.map(event => (
                                    <div key={event.id} className="glass-card p-5 hover-lift relative overflow-hidden group">
                                        <div className={`h-full w-1.5 absolute left-0 top-0 bottom-0 ${event.type === 'visit' ? 'bg-blue-500' : 'bg-orange-500'
                                            }`} />

                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                {event.creatorAvatar ? (
                                                    <Avatar className="w-10 h-10 border-2 border-background">
                                                        <AvatarImage src={event.creatorAvatar} />
                                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'visit' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                        {event.type === 'visit' ? <MapPin className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant={event.type === 'visit' ? "default" : "secondary"} className="text-xs">
                                                            {event.type === 'visit' ? "Visit" : "Deadline"}
                                                        </Badge>
                                                        {event.status === 'confirmed' && <Badge variant="success" className="text-xs">Confirmed</Badge>}
                                                    </div>
                                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{event.creatorName}</p>

                                                    {event.type === 'visit' && (
                                                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {event.time}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {event.location}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Link to={`/brand/campaigns/${event.campaignId}`}>
                                                <Button variant="ghost" size="icon">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">No events scheduled for this day</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
