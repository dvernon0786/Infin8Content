"use client";

import HeroSection from "@/components/marketing/HeroSection";
import ProblemSection from "@/components/marketing/ProblemSection";
import SolutionReframeSection from "@/components/marketing/SolutionReframeSection";
import ProductVisualSection from "@/components/marketing/ProductVisualSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import DifferentiationSection from "@/components/marketing/DifferentiationSection";
import AudienceSection from "@/components/marketing/AudienceSection";
import FinalCTASection from "@/components/marketing/FinalCTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <SolutionReframeSection />
      <ProductVisualSection />
      <HowItWorksSection />
      <DifferentiationSection />
      <AudienceSection />
      <FinalCTASection />
    </>
  );
}
