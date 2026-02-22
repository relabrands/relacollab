import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ForBrands } from "@/components/landing/ForBrands";
import { ForCreators } from "@/components/landing/ForCreators";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ForBrands />
      <ForCreators />
      <HowItWorks />
      <FeatureHighlights />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
