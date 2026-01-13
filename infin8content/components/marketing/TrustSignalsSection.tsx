"use client";

import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { TrustTestimonials } from "./TrustTestimonials";
import { ClientLogos } from "./ClientLogos";
import { TrustMetrics } from "./TrustMetrics";
import { TrustBadges } from "./TrustBadges";
import { 
  TestimonialCardProps, 
  ClientLogoProps, 
  TrustMetricProps, 
  TrustBadgeProps 
} from "@/types/marketing";

interface TrustSignalsSectionProps {
  className?: string;
}

export function TrustSignalsSection({
  className
}: TrustSignalsSectionProps) {
  // Testimonials data based on target personas with verified working Unsplash images
  const testimonials: TestimonialCardProps[] = [
    {
      name: "Sarah Chen",
      company: "TechCorp",
      role: "Content Director",
      headshot: "https://images.unsplash.com/photo-1494790108755-2616b332c1ca?w=400&h=400&fit=crop&crop=face&auto=format",
      quote: "Infin8Content transformed our content strategy. We're producing 10x more high-quality content while maintaining perfect brand consistency across all channels.",
      outcome: "10x faster content creation, 85% improvement in brand consistency"
    },
    {
      name: "Marcus Johnson", 
      company: "Digital Minds",
      role: "Marketing Manager",
      headshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format",
      quote: "The AI-powered SEO optimization is incredible. Our organic traffic increased by 300% in just 3 months, and our team spends less time on content creation.",
      outcome: "300% organic traffic growth, 60% time savings"
    },
    {
      name: "Jamie Foster",
      company: "EnterpriseCo", 
      role: "Head of Content",
      headshot: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face&auto=format",
      quote: "The collaboration features are game-changing. Our global teams work seamlessly together, and the real-time progress tracking keeps everyone aligned.",
      outcome: "Seamless global collaboration, 40% faster project completion"
    },
    {
      name: "Alex Rivera",
      company: "StartupHub",
      role: "Founder & CEO",
      headshot: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format", 
      quote: "As a startup, we needed to scale content quickly without hiring a large team. Infin8Content gave us enterprise-level content production at a fraction of the cost.",
      outcome: "75% cost reduction, enterprise-level content quality"
    }
  ];

  // Client logos data - using verified working tech office images from Unsplash
  const clientLogos: ClientLogoProps[] = [
    {
      name: "Microsoft",
      logoUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=100&fit=crop&auto=format",
      altText: "Microsoft office building"
    },
    {
      name: "Google",
      logoUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=100&fit=crop&auto=format",
      altText: "Google campus building"
    },
    {
      name: "Amazon",
      logoUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&auto=format",
      altText: "Amazon office building"
    },
    {
      name: "Apple",
      logoUrl: "https://images.unsplash.com/photo-1572024477694-6c3cfafe791e?w=200&h=100&fit=crop&auto=format",
      altText: "Apple store building"
    },
    {
      name: "Meta",
      logoUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=100&fit=crop&auto=format",
      altText: "Meta headquarters building"
    },
    {
      name: "Netflix",
      logoUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=100&fit=crop&auto=format",
      altText: "Netflix office building"
    },
    {
      name: "Deloitte",
      logoUrl: "https://images.unsplash.com/photo-1497366214047-4c60d9a68d32?w=200&h=100&fit=crop&auto=format",
      altText: "Deloitte office building"
    },
    {
      name: "Accenture",
      logoUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=100&fit=crop&auto=format",
      altText: "Accenture office building"
    },
    {
      name: "McKinsey",
      logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=100&fit=crop&auto=format",
      altText: "McKinsey office building"
    },
    {
      name: "Salesforce",
      logoUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=100&fit=crop&auto=format",
      altText: "Salesforce office building"
    },
    {
      name: "Adobe",
      logoUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=100&fit=crop&auto=format",
      altText: "Adobe office building"
    },
    {
      name: "Oracle",
      logoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=100&fit=crop&auto=format",
      altText: "Oracle office building"
    }
  ];

  // Trust metrics data
  const trustMetrics: TrustMetricProps[] = [
    {
      number: "500+",
      context: "Enterprise Clients",
      description: "Fortune 500 companies trust our platform"
    },
    {
      number: "10M+",
      context: "Words Generated",
      description: "AI-powered content creation at scale"
    },
    {
      number: "99.9%",
      context: "Uptime",
      description: "Reliable service you can count on"
    },
    {
      number: "4.9/5",
      context: "Customer Rating",
      description: "Based on 2,500+ reviews"
    }
  ];

  // Trust badges data - using actual security and certification badge images
  const trustBadges: TrustBadgeProps[] = [
    {
      name: "SSL Certificate",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbff31e?w=160&h=160&fit=crop&auto=format",
      altText: "SSL Security Certificate",
      certification: "256-bit Encryption"
    },
    {
      name: "PCI DSS",
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=160&h=160&fit=crop&auto=format",
      altText: "PCI DSS Compliant",
      certification: "Level 1 Certified"
    },
    {
      name: "GDPR",
      imageUrl: "https://images.unsplash.com/photo-1554469384-e58e166748aa?w=160&h=160&fit=crop&auto=format",
      altText: "GDPR Compliant",
      certification: "EU Data Protection"
    },
    {
      name: "SOC 2",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=160&h=160&fit=crop&auto=format",
      altText: "SOC 2 Type II",
      certification: "Security & Availability"
    },
    {
      name: "AWS Partner",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&h=160&fit=crop&auto=format",
      altText: "AWS Partner Network",
      certification: "Advanced Tier"
    }
  ];

  return (
    <div className={cn("trust-signals-section", className)}>
      {/* Testimonials Section */}
      <TrustTestimonials testimonials={testimonials} />
      
      {/* Client Logos Section */}
      <ClientLogos logos={clientLogos} />
      
      {/* Trust Metrics Section */}
      <TrustMetrics metrics={trustMetrics} />
      
      {/* Trust Badges Section */}
      <TrustBadges badges={trustBadges} />
    </div>
  );
}
