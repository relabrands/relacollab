import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Sparkles,
  LogOut,
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Building2, label: "Brands", path: "/admin/brands" },
  { icon: Users, label: "Creators", path: "/admin/creators" },
  { icon: FileText, label: "Campaigns", path: "/admin/campaigns" },
  { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: DollarSign, label: "Finance", path: "/admin/finance" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6">
        <img
          src="https://relabrands.com/wp-content/uploads/2026/02/Favicon-1.jpg"
          alt="RELA Brands Logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <span className="font-bold text-lg">RELA Brands</span>
      </Link>

      {/* Admin badge */}
      <div className="px-6 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/20 text-destructive">
          <Shield className="w-3 h-3" />
          Admin Panel
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {adminNavItems.map((item) => {
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

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => logout()}
          className="sidebar-item w-full text-sidebar-foreground/50 hover:text-sidebar-foreground text-left"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}