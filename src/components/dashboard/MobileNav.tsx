import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    CreditCard,
    BarChart3,
    Inbox,
    Zap,
    Image,
    User,
    Menu,
    MessageSquare,
    Calendar,
    Sparkles,
    LogOut,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
    type: "brand" | "creator";
}

const brandMainItems = [
    { icon: LayoutDashboard, label: "Home", path: "/brand" },
    { icon: FileText, label: "Campaigns", path: "/brand/campaigns" },
    { icon: Users, label: "Matches", path: "/brand/matches" },
    { icon: CreditCard, label: "Payments", path: "/brand/payments" },
];

const brandMoreItems = [
    { icon: Image, label: "Content", path: "/brand/content" },
    { icon: MessageSquare, label: "Messages", path: "/brand/messages" },
    { icon: Calendar, label: "Schedule", path: "/brand/schedule" },
    { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
    { icon: Settings, label: "Settings", path: "/brand/settings" },
];

const creatorMainItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/creator" },
    { icon: Inbox, label: "Opportunities", path: "/creator/opportunities" },
    { icon: Image, label: "Content", path: "/creator/content" },
    { icon: CreditCard, label: "Earnings", path: "/creator/earnings" },
];

const creatorMoreItems = [
    { icon: User, label: "My Profile", path: "/creator/profile" },
    { icon: MessageSquare, label: "Messages", path: "/creator/messages" },
    { icon: Calendar, label: "Schedule", path: "/creator/schedule" },
    { icon: Sparkles, label: "AI Insights", path: "/creator/analytics" },
    { icon: Zap, label: "Active Campaigns", path: "/creator/active" },
    { icon: Settings, label: "Settings", path: "/creator/settings" },
];

export function MobileNav({ type }: MobileNavProps) {
    const location = useLocation();
    const { logout } = useAuth();
    const navItems = type === "brand" ? brandMainItems : creatorMainItems;
    const moreItems = type === "brand" ? brandMoreItems : creatorMoreItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border z-50 md:hidden pb-safe">
            <div className="flex items-center justify-between h-full px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors",
                                isActive
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                            <span className="text-[10px]">{item.label}</span>
                        </Link>
                    );
                })}

                {/* "More" Sheet for Both Roles */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <Menu className="w-5 h-5" />
                            <span className="text-[10px]">More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                        <SheetHeader className="mb-4">
                            <SheetTitle>More Options</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-3 gap-4">
                            {moreItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors gap-2"
                                >
                                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-center">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-8 pt-4 border-t border-border">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => logout()}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
