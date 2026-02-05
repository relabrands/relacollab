import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Video,
  ExternalLink,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Filter,
  Search,
  Calendar,
  Instagram,
  Play,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ContentItem {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  campaignName: string;
  type: "image" | "video" | "reel" | "story";
  platform: "instagram" | "tiktok";
  thumbnail: string;
  postUrl: string;
  status: "pending" | "approved" | "live";
  submittedAt: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

function ContentCard({ content }: { content: ContentItem }) {
  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    approved: "bg-primary/20 text-primary border-primary/30",
    live: "bg-success/20 text-success border-success/30"
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <Card className="glass-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={content.thumbnail}
          alt={content.campaignName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50">
            {content.type === "video" || content.type === "reel" ? (
              <Video className="w-3 h-3 mr-1" />
            ) : (
              <Image className="w-3 h-3 mr-1" />
            )}
            {content.type}
          </Badge>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${content.platform === "instagram"
              ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
              : "bg-black"
            }`}>
            {content.platform === "instagram" ? (
              <Instagram className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Play button for videos */}
        {(content.type === "video" || content.type === "reel") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {content.postUrl && (
            <Button size="sm" variant="glass" className="flex-1" asChild>
              <a href={content.postUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                View Post
              </a>
            </Button>
          )}
          <Button size="sm" variant="glass">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={content.creatorAvatar}
            alt={content.creatorName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{content.creatorName}</p>
            <p className="text-xs text-muted-foreground truncate">{content.campaignName}</p>
          </div>
          <Badge className={statusColors[content.status]}>
            {content.status}
          </Badge>
        </div>

        {/* Metrics */}
        {content.metrics && (
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
            <div className="text-center">
              <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.views)}</p>
            </div>
            <div className="text-center">
              <Heart className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.likes)}</p>
            </div>
            <div className="text-center">
              <MessageCircle className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.comments)}</p>
            </div>
            <div className="text-center">
              <Share2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">{formatNumber(content.metrics.shares)}</p>
            </div>
          </div>
        )}

        {/* Submitted Date */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Submitted {content.submittedAt}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContentLibrary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;
      try {
        // NOTE: 'submissions' collection does not exist yet in this context, 
        // but we are implementing the read logic for when it does.
        // For now, this will likely return empty, which is better than fake data.
        const q = query(collection(db, "submissions"), where("brandId", "==", user.uid));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
        setContentList(items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [user]);

  const filteredContent = contentList.filter(content => {
    const matchesSearch =
      content.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.campaignName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && content.status === activeTab;
  });

  const stats = {
    total: contentList.length,
    live: contentList.filter(c => c.status === "live").length,
    approved: contentList.filter(c => c.status === "approved").length,
    pending: contentList.filter(c => c.status === "pending").length,
    totalViews: contentList.reduce((acc, c) => acc + (c.metrics?.views || 0), 0),
    totalEngagement: contentList.reduce((acc, c) =>
      acc + (c.metrics?.likes || 0) + (c.metrics?.comments || 0) + (c.metrics?.shares || 0), 0
    )
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          title="Content Library"
          subtitle="All creator content from your campaigns"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Content</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Live Posts</p>
              <p className="text-2xl font-bold text-success">{stats.live}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Engagement</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalEngagement)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by creator or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="live">Live ({stats.live})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground">
              {contentList.length === 0 ? "You haven't received any content submissions yet." : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}