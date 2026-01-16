"use client";

import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSolutionSection } from "@/components/marketing/ProblemSolutionSection";
import { ProductCapabilitiesSection } from "@/components/marketing/ProductCapabilitiesSection";
import { TrustSignalsSection } from "@/components/marketing/TrustSignalsSection";

export default function Home() {
  // Problem-Solution content based on user personas
  const problemSolutionCards = [
    {
      problem: "Creating quality content takes hours",
      solution: "AI generates articles in minutes",
      benefit: "10x faster content creation"
    },
    {
      problem: "Inconsistent brand voice across content",
      solution: "AI maintains your brand guidelines",
      benefit: "Perfect brand consistency"
    },
    {
      problem: "Team collaboration chaos",
      solution: "Real-time progress tracking",
      benefit: "Seamless teamwork"
    },
    {
      problem: "SEO optimization complexity",
      solution: "Built-in SEO best practices",
      benefit: "Higher rankings automatically"
    }
  ];

  // Product capabilities content
  const productCapabilities = [
    {
      iconName: "Zap",
      title: "AI-Powered Article Generation",
      description: "Generate high-quality, SEO-optimized articles in minutes using advanced AI technology.",
      learnMoreLink: "#ai-generation"
    },
    {
      iconName: "Users",
      title: "Team Collaboration Tools",
      description: "Work seamlessly with your team through real-time collaboration and progress tracking.",
      learnMoreLink: "#collaboration"
    },
    {
      iconName: "Search",
      title: "SEO Optimization Engine",
      description: "Built-in SEO best practices ensure your content ranks higher in search results.",
      learnMoreLink: "#seo"
    },
    {
      iconName: "BarChart3",
      title: "Performance Analytics",
      description: "Track content performance and gain insights to improve your content strategy.",
      learnMoreLink: "#analytics"
    },
    {
      iconName: "FileText",
      title: "Content Templates",
      description: "Professional templates for various content types to maintain consistency and save time.",
      learnMoreLink: "#templates"
    },
    {
      iconName: "TrendingUp",
      title: "Quality Scoring",
      description: "AI-powered quality assessment ensures your content meets the highest standards.",
      learnMoreLink: "#quality"
    },
    {
      iconName: "Shield",
      title: "Brand Voice Consistency",
      description: "Maintain perfect brand consistency across all your content automatically.",
      learnMoreLink: "#brand"
    },
    {
      iconName: "Clock",
      title: "Real-Time Progress Tracking",
      description: "Monitor content creation progress in real-time with detailed status updates.",
      learnMoreLink: "#progress"
    },
    {
      iconName: "Target",
      title: "Research Integration",
      description: "Integrated research capabilities provide accurate data and insights for your content.",
      learnMoreLink: "#research"
    },
    {
      iconName: "Sparkles",
      title: "Multi-Format Export",
      description: "Export your content in multiple formats for different platforms and use cases.",
      learnMoreLink: "#export"
    },
    {
      iconName: "Globe",
      title: "Publishing Automation",
      description: "Automate publishing to multiple platforms with one-click distribution.",
      learnMoreLink: "#publishing"
    },
    {
      iconName: "Award",
      title: "Mobile Experience",
      description: "Create and manage content on the go with our fully responsive mobile experience.",
      learnMoreLink: "#mobile"
    }
  ];

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
        visualSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format"
        visualAlt="Infin8Content dashboard showing article generation interface with real-time progress tracking"
        webpSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format"
      />
      
      <ProblemSolutionSection 
        cards={problemSolutionCards}
      />
      
      <ProductCapabilitiesSection 
        capabilities={productCapabilities}
      />
      
      <TrustSignalsSection />
    </div>
  );
}
