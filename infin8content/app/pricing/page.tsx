"use client";

import { useState } from "react";
import Navigation from "@/components/marketing/Navigation";
import PricingHero from "@/components/marketing/pricing/PricingHero";
import PricingPlans from "@/components/marketing/pricing/PricingPlans";
import PricingComparisonRow from "@/components/marketing/pricing/PricingComparisonRow";
import BespokeAIContentService from "@/components/marketing/pricing/BespokeAIContentService";
import PricingComparison from "@/components/marketing/pricing/PricingComparison";
import Testimonials from "@/components/marketing/Testimonials";
import PricingFAQ from "@/components/marketing/pricing/PricingFAQ";
import FinalCTA from "@/components/marketing/FinalCTA";
import StickyUpgradeBar from "@/components/marketing/pricing/StickyUpgradeBar";
import MobileStickyUpgradeBar from "@/components/marketing/pricing/MobileStickyUpgradeBar";
import Footer from "@/components/marketing/Footer";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div style={{ backgroundColor: "#F4F4F6", minHeight: "100vh" }}>
      <Navigation />
      <PricingHero billing={billing} setBilling={setBilling} />
      <PricingPlans billing={billing} />
      <PricingComparisonRow />
      <BespokeAIContentService />
      <PricingComparison />
      <Testimonials />
      <PricingFAQ />
      <FinalCTA />
      <StickyUpgradeBar />
      <MobileStickyUpgradeBar />
      <Footer />
    </div>
  );
}
