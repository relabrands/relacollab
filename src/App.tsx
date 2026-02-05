import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Brand pages
import BrandDashboard from "./pages/brand/BrandDashboard";
import CreateCampaign from "./pages/brand/CreateCampaign";
import BrandMatches from "./pages/brand/BrandMatches";
 import ContentLibrary from "./pages/brand/ContentLibrary";

// Creator pages
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import Opportunities from "./pages/creator/Opportunities";
import CreatorProfile from "./pages/creator/CreatorProfile";
 import MyContent from "./pages/creator/MyContent";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Brand Routes */}
          <Route path="/brand" element={<BrandDashboard />} />
          <Route path="/brand/campaigns" element={<BrandDashboard />} />
          <Route path="/brand/campaigns/new" element={<CreateCampaign />} />
          <Route path="/brand/matches" element={<BrandMatches />} />
           <Route path="/brand/content" element={<ContentLibrary />} />
           <Route path="/brand/analytics" element={<ContentLibrary />} />
          <Route path="/brand/payments" element={<BrandDashboard />} />
          <Route path="/brand/settings" element={<BrandDashboard />} />
          
          {/* Creator Routes */}
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/creator/opportunities" element={<Opportunities />} />
          <Route path="/creator/active" element={<CreatorDashboard />} />
           <Route path="/creator/content" element={<MyContent />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          <Route path="/creator/earnings" element={<CreatorDashboard />} />
          <Route path="/creator/settings" element={<CreatorDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/brands" element={<AdminBrands />} />
          <Route path="/admin/creators" element={<AdminCreators />} />
          <Route path="/admin/campaigns" element={<AdminDashboard />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
