import { Header } from "@/components/landing/Header";
import { BusinessHero } from "@/components/landing/BusinessHero";
import { TrustedBrands } from "@/components/landing/TrustedBrands";
import { ForBrands } from "@/components/landing/ForBrands";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

const Business = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <BusinessHero />
      <TrustedBrands />
      <ForBrands />
      <HowItWorks initialView="brand" hideToggle={true} />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Business;
