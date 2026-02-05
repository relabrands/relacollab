 import { useState } from "react";
 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { motion } from "framer-motion";
import { toast } from "sonner";
 import {
   Instagram,
   Smartphone,
   Users,
   TrendingUp,
   MapPin,
   CheckCircle,
   Link as LinkIcon,
   Plus,
 } from "lucide-react";
 
 export default function CreatorProfile() {
  const [profile, setProfile] = useState({
    name: "Maria Santos",
    email: "maria@example.com",
    location: "Los Angeles, CA",
    phone: "+1 (555) 123-4567",
    bio: "Wellness enthusiast, fitness lover, and breakfast connoisseur. I create authentic content about healthy living and morning routines.",
  });

  const [connections, setConnections] = useState({
     instagram: true,
     tiktok: false,
   });
 
  const [selectedCategories, setSelectedCategories] = useState([
    "Wellness",
    "Fitness",
    "Food",
    "Lifestyle",
  ]);

  const handleSaveProfile = () => {
    toast.success("Profile saved successfully!");
  };

  const handleConnectTikTok = () => {
    setConnections({ ...connections, tiktok: true });
    toast.success("TikTok connected successfully!");
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleChangePhoto = () => {
    toast.info("Photo upload coming soon!");
  };

   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="creator" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="My Profile"
           subtitle="Manage your creator profile and connected accounts"
         />
 
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column - Profile Info */}
           <div className="lg:col-span-2 space-y-6">
             {/* Basic Info */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-card p-6"
             >
               <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
 
               <div className="flex items-center gap-6 mb-6">
                 <img
                   src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                   alt="Profile"
                   className="w-24 h-24 rounded-2xl object-cover"
                 />
                 <div>
                  <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                     Change Photo
                   </Button>
                 </div>
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="name">Full Name</Label>
                   <Input
                     id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="email">Email</Label>
                   <Input
                     id="email"
                     type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="location">Location</Label>
                   <Input
                     id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label htmlFor="phone">Phone</Label>
                   <Input
                     id="phone"
                     type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                     className="mt-2"
                   />
                 </div>
               </div>
 
               <div className="mt-4">
                 <Label htmlFor="bio">Bio</Label>
                 <Textarea
                   id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                   className="mt-2 min-h-[100px]"
                 />
               </div>
 
              <Button variant="hero" className="mt-6" onClick={handleSaveProfile}>
                 Save Changes
               </Button>
             </motion.div>
 
             {/* Content Categories */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="glass-card p-6"
             >
               <h2 className="text-lg font-semibold mb-4">Content Categories</h2>
               <p className="text-muted-foreground text-sm mb-4">
                 Select the topics you create content about
               </p>
 
               <div className="flex flex-wrap gap-2">
                 {["Wellness", "Fitness", "Food", "Lifestyle", "Travel", "Beauty", "Fashion", "Tech", "Family", "Pets"].map(
                   (category) => (
                     <Badge
                       key={category}
                       variant="secondary"
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedCategories.includes(category)
                           ? "bg-primary/10 text-primary border-primary/20"
                           : "hover:bg-primary/5"
                       }`}
                      onClick={() => handleCategoryToggle(category)}
                     >
                       {category}
                     </Badge>
                   )
                 )}
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toast.info("Add custom category coming soon!")}
                >
                   <Plus className="w-3 h-3 mr-1" />
                   Add
                 </Badge>
               </div>
             </motion.div>
           </div>
 
           {/* Right Column - Connected Accounts & Stats */}
           <div className="space-y-6">
             {/* Connected Accounts */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="glass-card p-6"
             >
               <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
 
               <div className="space-y-4">
                 {/* Instagram */}
                 <div className="p-4 rounded-xl border border-border">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                         <Instagram className="w-5 h-5 text-primary-foreground" />
                       </div>
                       <div>
                         <div className="font-medium">Instagram</div>
                         <div className="text-sm text-muted-foreground">@maria.wellness</div>
                       </div>
                     </div>
                     <CheckCircle className="w-5 h-5 text-success" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="p-2 rounded-lg bg-muted/50 text-center">
                       <div className="text-lg font-semibold">125K</div>
                       <div className="text-xs text-muted-foreground">Followers</div>
                     </div>
                     <div className="p-2 rounded-lg bg-muted/50 text-center">
                       <div className="text-lg font-semibold text-success">4.8%</div>
                       <div className="text-xs text-muted-foreground">Engagement</div>
                     </div>
                   </div>
                 </div>
 
                 {/* TikTok */}
                 <div className="p-4 rounded-xl border border-dashed border-border">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        connections.tiktok ? "bg-foreground" : "bg-muted"
                      }`}>
                        <Smartphone className={`w-5 h-5 ${
                          connections.tiktok ? "text-background" : "text-muted-foreground"
                        }`} />
                       </div>
                       <div>
                         <div className="font-medium">TikTok</div>
                        <div className="text-sm text-muted-foreground">
                          {connections.tiktok ? "@maria.wellness" : "Not connected"}
                        </div>
                       </div>
                     </div>
                    {connections.tiktok ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleConnectTikTok}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                   </div>
                  {connections.tiktok && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold">45K</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-semibold text-success">7.2%</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  )}
                 </div>
               </div>
             </motion.div>
 
             {/* AI Analysis */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
             >
               <h2 className="text-lg font-semibold mb-4">AI Profile Analysis</h2>
 
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                     <TrendingUp className="w-5 h-5 text-success" />
                   </div>
                   <div>
                     <div className="font-medium">High Engagement</div>
                     <div className="text-sm text-muted-foreground">
                       Your 4.8% rate beats 85% of creators
                     </div>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                     <Users className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <div className="font-medium">Local Audience</div>
                     <div className="text-sm text-muted-foreground">
                       78% of followers in Los Angeles area
                     </div>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                     <MapPin className="w-5 h-5 text-accent" />
                   </div>
                   <div>
                     <div className="font-medium">Wellness Niche</div>
                     <div className="text-sm text-muted-foreground">
                       Strong alignment with health brands
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
           </div>
         </div>
       </main>
     </div>
   );
 }