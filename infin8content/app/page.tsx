import { HeroSection } from "@/components/marketing/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection
        headline="Transform Content Creation with AI"
        subtext="Generate high-quality, SEO-optimized articles in minutes, not hours. Perfect for marketers, content creators, and agencies."
        primaryCta={{
          text: "Start Free Trial",
          href: "/register",
          ariaLabel: "Start your free trial with Infin8Content"
        }}
        secondaryCta={{
          text: "Watch Demo",
          href: "#demo",
          ariaLabel: "Watch a demo of Infin8Content"
        }}
        visualSrc="/images/product-mockup.png"
        visualAlt="Infin8Content dashboard showing article generation interface with real-time progress tracking"
        webpSrc="/images/product-mockup.webp"
      />
    </div>
  );
}
