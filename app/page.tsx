import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeaturesBento } from "@/components/landing/LandingFeaturesBento";
import { LandingVendorSection } from "@/components/landing/LandingVendorSection";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingCtaBanner } from "@/components/landing/LandingCtaBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary selection:text-black">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeaturesBento />
        <LandingVendorSection />
        <LandingTestimonials />
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
