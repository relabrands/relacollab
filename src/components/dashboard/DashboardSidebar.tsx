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
  Sparkles,
  LogOut,
  Zap,
  Inbox,
  User,
  Image,
  MessageSquare,
  Calendar,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardSidebarProps {
  type: "brand" | "creator";
}

// Main visible items for Brand
const brandMainItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
  { icon: FileText, label: "Campaigns", path: "/brand/campaigns" },
  { icon: Users, label: "Matches", path: "/brand/matches" },
  { icon: CreditCard, label: "Payments", path: "/brand/payments" },
];

// Secondary items for Brand (in "More" dropdown)
const brandMoreItems = [
  { icon: Image, label: "Content Library", path: "/brand/content" },
  { icon: MessageSquare, label: "Messages", path: "/brand/messages" },
  { icon: Calendar, label: "Schedule", path: "/brand/schedule" },
  { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
  { icon: Settings, label: "Settings", path: "/brand/settings" },
];

// Main visible items for Creator
const creatorMainItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/creator" },
  { icon: Inbox, label: "Opportunities", path: "/creator/opportunities" },
  { icon: Image, label: "My Content", path: "/creator/content" },
  { icon: CreditCard, label: "Earnings", path: "/creator/earnings" },
];

// Secondary items for Creator (in "More" dropdown)
const creatorMoreItems = [
  { icon: User, label: "My Profile", path: "/creator/profile" },
  { icon: MessageSquare, label: "Messages", path: "/creator/messages" },
  { icon: Calendar, label: "Schedule", path: "/creator/schedule" },
  { icon: Sparkles, label: "AI Insights", path: "/creator/analytics" },
  { icon: Zap, label: "Active Campaigns", path: "/creator/active" }, // Kept for safety
  { icon: Settings, label: "Settings", path: "/creator/settings" },
];

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = type === "brand" ? brandMainItems : creatorMainItems;
  const moreItems = type === "brand" ? brandMoreItems : creatorMoreItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6">
        <img
          src="https://relabrands.com/wp-content/uploads/2026/02/Favicon-1.jpg"
          alt="RELA Collab Logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <span className="font-bold text-lg">RELA Collab</span>
      </Link>

      {/* Type badge */}
      <div className="px-6 mb-6">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          type === "brand" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
        )}>
          {type === "brand" ? "Brand Dashboard" : "Creator Dashboard"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("sidebar-item", isActive && "active")}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* "More" Dropdown for Both Roles */}
        <DropdownMenu>
          <DropdownMenuTrigger className="sidebar-item w-full justify-start group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground outline-none">
            <Menu className="w-5 h-5" />
            <span>More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56 ml-2">
            <DropdownMenuLabel>More Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moreItems.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link to={item.path} className="cursor-pointer flex items-center gap-2 w-full">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}