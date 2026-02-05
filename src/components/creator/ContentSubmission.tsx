 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { 
   Link2, 
   Instagram, 
   Play, 
   Upload, 
   CheckCircle, 
   Clock, 
   ExternalLink,
   RefreshCw
 } from "lucide-react";
 import { toast } from "sonner";
 
 interface Campaign {
   id: string;
   name: string;
   brand: string;
 }
 
 interface SubmittedContent {
   id: string;
   campaignName: string;
   platform: "instagram" | "tiktok";
   postUrl: string;
   status: "pending" | "approved" | "live";
   submittedAt: string;
 }
 
 const mockCampaigns: Campaign[] = [
   { id: "1", name: "Summer Wellness Launch", brand: "Sunrise Cafe" },
   { id: "2", name: "New Year Fitness Push", brand: "FitLife Gym" },
 ];
 
 const mockSubmittedContent: SubmittedContent[] = [
   {
     id: "1",
     campaignName: "Summer Wellness Launch",
     platform: "instagram",
     postUrl: "https://instagram.com/p/example1",
     status: "live",
     submittedAt: "Feb 12, 2024"
   },
   {
     id: "2",
     campaignName: "New Year Fitness Push",
     platform: "tiktok",
     postUrl: "https://tiktok.com/@example/video/123",
     status: "pending",
     submittedAt: "Feb 18, 2024"
   }
 ];
 
 // Mock connected accounts
 const connectedAccounts = {
   instagram: { connected: true, username: "@maria_creates" },
   tiktok: { connected: true, username: "@mariacreates" }
 };
 
 // Mock recent posts from connected accounts
 const recentPosts = [
   {
     id: "post1",
     platform: "instagram" as const,
     thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
     caption: "Morning wellness routine ✨",
     date: "2 hours ago",
     url: "https://instagram.com/p/recent1"
   },
   {
     id: "post2",
     platform: "instagram" as const,
     thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
     caption: "Healthy breakfast ideas 🥗",
     date: "1 day ago",
     url: "https://instagram.com/p/recent2"
   },
   {
     id: "post3",
     platform: "tiktok" as const,
     thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
     caption: "Quick workout at home 💪",
     date: "3 days ago",
     url: "https://tiktok.com/@example/video/456"
   }
 ];
 
 export function ContentSubmission() {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [submissionType, setSubmissionType] = useState<"link" | "select">("link");
   const [selectedCampaign, setSelectedCampaign] = useState("");
   const [postUrl, setPostUrl] = useState("");
   const [selectedPost, setSelectedPost] = useState<string | null>(null);
   const [submittedContent, setSubmittedContent] = useState(mockSubmittedContent);
 
   const handleSubmitLink = () => {
     if (!selectedCampaign || !postUrl) {
       toast.error("Please fill in all fields");
       return;
     }
 
     const campaign = mockCampaigns.find(c => c.id === selectedCampaign);
     const platform = postUrl.includes("instagram") ? "instagram" : "tiktok";
 
     const newContent: SubmittedContent = {
       id: Date.now().toString(),
       campaignName: campaign?.name || "",
       platform,
       postUrl,
       status: "pending",
       submittedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
     };
 
     setSubmittedContent([newContent, ...submittedContent]);
     toast.success("Content submitted successfully!");
     setIsDialogOpen(false);
     setPostUrl("");
     setSelectedCampaign("");
   };
 
   const handleSelectPost = () => {
     if (!selectedCampaign || !selectedPost) {
       toast.error("Please select a campaign and post");
       return;
     }
 
     const campaign = mockCampaigns.find(c => c.id === selectedCampaign);
     const post = recentPosts.find(p => p.id === selectedPost);
 
     if (!post) return;
 
     const newContent: SubmittedContent = {
       id: Date.now().toString(),
       campaignName: campaign?.name || "",
       platform: post.platform,
       postUrl: post.url,
       status: "pending",
       submittedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
     };
 
     setSubmittedContent([newContent, ...submittedContent]);
     toast.success("Content submitted successfully!");
     setIsDialogOpen(false);
     setSelectedPost(null);
     setSelectedCampaign("");
   };
 
   const handleRefreshMetrics = (contentId: string) => {
     toast.success("Metrics updated from connected account");
   };
 
   const statusColors = {
     pending: "bg-warning/20 text-warning border-warning/30",
     approved: "bg-primary/20 text-primary border-primary/30",
     live: "bg-success/20 text-success border-success/30"
   };
 
   const statusIcons = {
     pending: Clock,
     approved: CheckCircle,
     live: CheckCircle
   };
 
   return (
     <div className="space-y-6">
       {/* Connected Accounts */}
       <Card className="glass-card">
         <CardHeader>
           <CardTitle className="text-lg">Connected Accounts</CardTitle>
           <CardDescription>
             Connect your social accounts to easily submit content
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex flex-wrap gap-3">
             <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
               connectedAccounts.instagram.connected 
                 ? "bg-success/10 border-success/30" 
                 : "bg-muted border-border"
             }`}>
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                 <Instagram className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-medium">Instagram</p>
                 {connectedAccounts.instagram.connected ? (
                   <p className="text-xs text-muted-foreground">{connectedAccounts.instagram.username}</p>
                 ) : (
                   <p className="text-xs text-muted-foreground">Not connected</p>
                 )}
               </div>
               {connectedAccounts.instagram.connected && (
                 <CheckCircle className="w-4 h-4 text-success ml-2" />
               )}
             </div>
 
             <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
               connectedAccounts.tiktok.connected 
                 ? "bg-success/10 border-success/30" 
                 : "bg-muted border-border"
             }`}>
               <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                 <Play className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-medium">TikTok</p>
                 {connectedAccounts.tiktok.connected ? (
                   <p className="text-xs text-muted-foreground">{connectedAccounts.tiktok.username}</p>
                 ) : (
                   <p className="text-xs text-muted-foreground">Not connected</p>
                 )}
               </div>
               {connectedAccounts.tiktok.connected && (
                 <CheckCircle className="w-4 h-4 text-success ml-2" />
               )}
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Submit Content */}
       <Card className="glass-card">
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
             <CardTitle className="text-lg">Submit Content</CardTitle>
             <CardDescription>
               Upload your publication link or select from your recent posts
             </CardDescription>
           </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button variant="hero">
                 <Upload className="w-4 h-4" />
                 Submit Content
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-lg">
               <DialogHeader>
                 <DialogTitle>Submit Campaign Content</DialogTitle>
                 <DialogDescription>
                   Choose how you want to submit your content
                 </DialogDescription>
               </DialogHeader>
 
               <div className="space-y-6 py-4">
                 {/* Campaign Selection */}
                 <div className="space-y-2">
                   <Label>Select Campaign</Label>
                   <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                     <SelectTrigger>
                       <SelectValue placeholder="Choose a campaign" />
                     </SelectTrigger>
                     <SelectContent>
                       {mockCampaigns.map((campaign) => (
                         <SelectItem key={campaign.id} value={campaign.id}>
                           {campaign.name} - {campaign.brand}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 {/* Submission Type Toggle */}
                 <div className="flex gap-2">
                   <Button
                     type="button"
                     variant={submissionType === "link" ? "default" : "outline"}
                     className="flex-1"
                     onClick={() => setSubmissionType("link")}
                   >
                     <Link2 className="w-4 h-4" />
                     Paste Link
                   </Button>
                   <Button
                     type="button"
                     variant={submissionType === "select" ? "default" : "outline"}
                     className="flex-1"
                     onClick={() => setSubmissionType("select")}
                   >
                     <Instagram className="w-4 h-4" />
                     Select Post
                   </Button>
                 </div>
 
                 {submissionType === "link" ? (
                   <div className="space-y-2">
                     <Label>Post URL</Label>
                     <Input
                       placeholder="https://instagram.com/p/... or https://tiktok.com/..."
                       value={postUrl}
                       onChange={(e) => setPostUrl(e.target.value)}
                     />
                     <p className="text-xs text-muted-foreground">
                       Paste the URL of your Instagram or TikTok post
                     </p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <Label>Select from Recent Posts</Label>
                     <div className="grid grid-cols-3 gap-3">
                       {recentPosts.map((post) => (
                         <button
                           key={post.id}
                           type="button"
                           onClick={() => setSelectedPost(post.id)}
                           className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                             selectedPost === post.id 
                               ? "border-primary ring-2 ring-primary/30" 
                               : "border-border hover:border-primary/50"
                           }`}
                         >
                           <img 
                             src={post.thumbnail} 
                             alt={post.caption}
                             className="w-full h-full object-cover"
                           />
                           <div className="absolute top-1 right-1">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                               post.platform === "instagram" 
                                 ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" 
                                 : "bg-black"
                             }`}>
                               {post.platform === "instagram" ? (
                                 <Instagram className="w-3 h-3 text-white" />
                               ) : (
                                 <Play className="w-3 h-3 text-white" />
                               )}
                             </div>
                           </div>
                           {selectedPost === post.id && (
                             <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                               <CheckCircle className="w-8 h-8 text-primary" />
                             </div>
                           )}
                         </button>
                       ))}
                     </div>
                     {selectedPost && (
                       <p className="text-xs text-muted-foreground">
                         {recentPosts.find(p => p.id === selectedPost)?.caption}
                       </p>
                     )}
                   </div>
                 )}
 
                 <Button 
                   className="w-full" 
                   variant="hero"
                   onClick={submissionType === "link" ? handleSubmitLink : handleSelectPost}
                 >
                   Submit Content
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </CardHeader>
       </Card>
 
       {/* Submitted Content List */}
       <Card className="glass-card">
         <CardHeader>
           <CardTitle className="text-lg">Your Submitted Content</CardTitle>
           <CardDescription>
             Track the status of your campaign submissions
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {submittedContent.map((content) => {
               const StatusIcon = statusIcons[content.status];
               return (
                 <div 
                   key={content.id}
                   className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50"
                 >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                     content.platform === "instagram" 
                       ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" 
                       : "bg-black"
                   }`}>
                     {content.platform === "instagram" ? (
                       <Instagram className="w-5 h-5 text-white" />
                     ) : (
                       <Play className="w-5 h-5 text-white" />
                     )}
                   </div>
 
                   <div className="flex-1 min-w-0">
                     <p className="font-medium truncate">{content.campaignName}</p>
                     <p className="text-sm text-muted-foreground">Submitted {content.submittedAt}</p>
                   </div>
 
                   <Badge className={statusColors[content.status]}>
                     <StatusIcon className="w-3 h-3 mr-1" />
                     {content.status}
                   </Badge>
 
                   <div className="flex gap-2">
                     <Button 
                       size="icon" 
                       variant="ghost"
                       onClick={() => handleRefreshMetrics(content.id)}
                       title="Refresh metrics"
                     >
                       <RefreshCw className="w-4 h-4" />
                     </Button>
                     <Button size="icon" variant="ghost" asChild>
                       <a href={content.postUrl} target="_blank" rel="noopener noreferrer">
                         <ExternalLink className="w-4 h-4" />
                       </a>
                     </Button>
                   </div>
                 </div>
               );
             })}
 
             {submittedContent.length === 0 && (
               <div className="text-center py-8">
                 <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                 <p className="text-muted-foreground">No content submitted yet</p>
               </div>
             )}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }