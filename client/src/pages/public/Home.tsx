import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesCarousel } from "@/components/home/CategoriesCarousel";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HomeSegmentsCarousel } from "@/components/home/HomeSegmentsCarousel";

import { HowItWorks } from "@/components/home/HowItWorks";
import { PrePrintChecklist } from "@/components/home/PrePrintChecklist";
import { FAQSupport } from "@/components/home/FAQSupport";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Carousel */}
      <CategoriesCarousel />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Segment carousel — substitui a seção Por que escolher a Maria Imprime? */}
      <HomeSegmentsCarousel />

      {/* How It Works */}
      <HowItWorks />

      {/* Pre-Print Checklist */}
      <PrePrintChecklist />

      {/* FAQ/Support */}
      <FAQSupport />

      {/* Footer */}
      <Footer />
    </div>
  );
}
