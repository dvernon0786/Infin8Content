"use client";

import { useState } from "react";
import PricingHero from "@/components/marketing/pricing/PricingHero";
import PricingPlans from "@/components/marketing/pricing/PricingPlans";
import TrafficProofStrip from "@/components/marketing/pricing/TrafficProofStrip";
import FeatureValueSection from "@/components/marketing/pricing/FeatureValueSection";
import PricingComparisonRow from "@/components/marketing/pricing/PricingComparisonRow";
import PricingComparison from "@/components/marketing/pricing/PricingComparison";
import BespokeAIContentService from "@/components/marketing/pricing/BespokeAIContentService";
import Testimonials from "@/components/marketing/Testimonials";
import PricingFAQ from "@/components/marketing/pricing/PricingFAQ";
import FinalCTA from "@/components/marketing/FinalCTA";
import CTASection from "@/components/marketing/sections/CTASection";
import StickyUpgradeBar from "@/components/marketing/pricing/StickyUpgradeBar";
import MobileStickyUpgradeBar from "@/components/marketing/pricing/MobileStickyUpgradeBar";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="bg-neutral-100 min-h-screen">
      {/* ── 1. Hero with billing toggle ── */}
      <PricingHero billing={billing} setBilling={setBilling} />

      {/* ── 2. Three plan cards ── */}
      <PricingPlans billing={billing} />

      {/* ── 3. Scrolling traffic proof strip ── */}
      <TrafficProofStrip />

      {/* ── 4. Full feature category grid ── */}
      <FeatureValueSection />

      {/* ── 5. Detailed row-by-row comparison table ── */}
      <PricingComparisonRow />

      {/* ── 6. Quick comparison summary ── */}
      <PricingComparison />

      {/* ── 7. Bespoke / done-for-you service ── */}
      <BespokeAIContentService />

      {/* ── 8. Customer testimonials ── */}
      <Testimonials />

      {/* ── 9. FAQ ── */}
      <PricingFAQ />

      {/* ── 10. Final CTA / newsletter ── */}
      <FinalCTA />
      <CTASection />

      {/* ── Sticky bars ── */}
      <StickyUpgradeBar />
      <MobileStickyUpgradeBar />
    </div>
  );
}
