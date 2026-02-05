import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingLayout from "./pages/onboarding/OnboardingLayout";
import BrandOnboarding from "./pages/onboarding/BrandOnboarding";
import CreatorOnboarding from "./pages/onboarding/CreatorOnboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import TermsAndConditions from "./pages/TermsAndConditions";
import InstagramCallback from "./pages/auth/InstagramCallback";

// Brand pages
import BrandDashboard from "./pages/brand/BrandDashboard";
import CreateCampaign from "./pages/brand/CreateCampaign";
import BrandMatches from "./pages/brand/BrandMatches";
import ContentLibrary from "./pages/brand/ContentLibrary";
import BrandAnalytics from "./pages/brand/BrandAnalytics";
import BrandPayments from "./pages/brand/BrandPayments";
import BrandSettings from "./pages/brand/BrandSettings";

// Creator pages
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import Opportunities from "./pages/creator/Opportunities";
import CreatorProfile from "./pages/creator/CreatorProfile";
import MyContent from "./pages/creator/MyContent";
import ActiveCampaigns from "./pages/creator/ActiveCampaigns";
import CreatorEarnings from "./pages/creator/CreatorEarnings";
import CreatorSettings from "./pages/creator/CreatorSettings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/politica-de-privacidad" element={<PrivacyPolicy />} />
            <Route path="/eliminacion-de-datos" element={<DataDeletion />} />
            <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
            <Route path="/auth/facebook/callback" element={<InstagramCallback />} />

            {/* Onboarding Routes */}
            <Route path="/onboarding" element={<OnboardingLayout />}>
              <Route path="brand" element={<BrandOnboarding />} />
              <Route path="creator" element={<CreatorOnboarding />} />
            </Route>

            {/* Brand Routes */}
            <Route path="/brand" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandDashboard />
              </ProtectedRoute>
            } />
            <Route path="/brand/campaigns" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandDashboard />
              </ProtectedRoute>
            } />
            <Route path="/brand/campaigns/new" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <CreateCampaign />
              </ProtectedRoute>
            } />
            <Route path="/brand/matches" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandMatches />
              </ProtectedRoute>
            } />
            <Route path="/brand/content" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <ContentLibrary />
              </ProtectedRoute>
            } />
            <Route path="/brand/analytics" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/brand/payments" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandPayments />
              </ProtectedRoute>
            } />
            <Route path="/brand/settings" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandSettings />
              </ProtectedRoute>
            } />

            {/* Creator Routes */}
            <Route path="/creator" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <CreatorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/creator/opportunities" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <Opportunities />
              </ProtectedRoute>
            } />
            <Route path="/creator/active" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <ActiveCampaigns />
              </ProtectedRoute>
            } />
            <Route path="/creator/content" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <MyContent />
              </ProtectedRoute>
            } />
            <Route path="/creator/profile" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <CreatorProfile />
              </ProtectedRoute>
            } />
            <Route path="/creator/earnings" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <CreatorEarnings />
              </ProtectedRoute>
            } />
            <Route path="/creator/settings" element={
              <ProtectedRoute allowedRoles={['creator']}>
                <CreatorSettings />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/brands" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBrands />
              </ProtectedRoute>
            } />
            <Route path="/admin/creators" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCreators />
              </ProtectedRoute>
            } />
            <Route path="/admin/campaigns" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/subscriptions" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSubscriptions />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
