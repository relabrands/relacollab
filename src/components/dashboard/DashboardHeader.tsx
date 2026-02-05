import { useState } from "react";
import { Bell, Search, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
import { toast } from "sonner";
 
 interface DashboardHeaderProps {
   title: string;
   subtitle?: string;
 }
 
 export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: "New campaign match found!", time: "2 min ago" },
    { id: 2, message: "Content approved by Sunrise Cafe", time: "1 hour ago" },
    { id: 3, message: "Payment of $350 received", time: "3 hours ago" },
  ];

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleDismissNotification = (id: number) => {
    toast.success("Notification dismissed");
  };

   return (
     <header className="flex items-center justify-between mb-8">
       <div>
         <h1 className="text-2xl font-bold">{title}</h1>
         {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
       </div>
 
       <div className="flex items-center gap-4">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input
             placeholder="Search..."
             className="pl-10 w-64 bg-card border-border/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toast.info("Search functionality coming soon!");
              }
            }}
           />
         </div>
 
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 glass-card p-4 z-50 shadow-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleDismissNotification(notif.id)}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
         <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
           JD
         </div>
       </div>
     </header>
   );
 }