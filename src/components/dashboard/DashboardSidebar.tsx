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
  Calendar,
  ClipboardList,
} from "lucide-react";

interface DashboardSidebarProps {
  type: "brand" | "creator";
}

// All nav items for Brand (desktop shows them all)
const brandNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
  { icon: FileText, label: "Campaigns", path: "/brand/campaigns" },
  { icon: Users, label: "Matches", path: "/brand/matches" },
  { icon: CreditCard, label: "Payments", path: "/brand/payments" },
  { icon: Image, label: "Content Library", path: "/brand/content" },
  { icon: Calendar, label: "Schedule", path: "/brand/schedule" },
  { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
  { icon: ClipboardList, label: "Reportes", path: "/brand/reports" },
  { icon: Settings, label: "Settings", path: "/brand/settings" },
];

// All nav items for Creator (desktop shows them all)
const creatorNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/creator" },
  { icon: Inbox, label: "Opportunities", path: "/creator/opportunities" },
  { icon: Image, label: "My Content", path: "/creator/content" },
  { icon: CreditCard, label: "Earnings", path: "/creator/earnings" },
  { icon: User, label: "My Profile", path: "/creator/profile" },
  { icon: Calendar, label: "Schedule", path: "/creator/schedule" },
  { icon: Sparkles, label: "AI Insights", path: "/creator/analytics" },
  { icon: Zap, label: "Active Campaigns", path: "/creator/active" },
  { icon: Settings, label: "Settings", path: "/creator/settings" },
];

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = type === "brand" ? brandNavItems : creatorNavItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center px-6 py-6">
        <img
          src="https://relabrands.com/wp-content/uploads/2026/03/Logo-Blanco-icono-color.png"
          alt="RELA Collab"
          className="h-8 w-auto object-contain"
        />
      </Link>

      {/* Type badge */}
      <div className="px-6 mb-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          type === "brand" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
        )}>
          {type === "brand" ? "Brand Dashboard" : "Creator Dashboard"}
        </div>
      </div>

      {/* Navigation — all items visible, scrollable if needed */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
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
      </nav>

      {/* Footer: Sign Out */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <button
          onClick={() => logout()}
          className="sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}