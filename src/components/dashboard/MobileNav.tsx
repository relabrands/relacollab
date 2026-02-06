import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";

interface MobileNavProps {
    type: "brand" | "creator";
}

const brandNavItems = [
    { icon: LayoutDashboard, label: "Home", path: "/brand" },
    { icon: FileText, label: "Campaigns", path: "/brand/campaigns" },
    { icon: Users, label: "Matches", path: "/brand/matches" },
    { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
    { icon: Settings, label: "Settings", path: "/brand/settings" },
];

const creatorNavItems = [
    { icon: LayoutDashboard, label: "Home", path: "/creator" },
    { icon: Inbox, label: "Opportunities", path: "/creator/opportunities" },
    { icon: Zap, label: "Active", path: "/creator/active" },
    { icon: User, label: "Profile", path: "/creator/profile" },
    { icon: Settings, label: "Settings", path: "/creator/settings" },
];

export function MobileNav({ type }: MobileNavProps) {
    const location = useLocation();
    const navItems = type === "brand" ? brandNavItems : creatorNavItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border z-50 md:hidden pb-safe">
            <div className="flex items-center justify-around h-full px-2">
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
            </div>
        </nav>
    );
}
