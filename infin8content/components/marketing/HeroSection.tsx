import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "./MarketingLayout";

interface HeroSectionProps {
  headline: string;
  subtext: string;
  primaryCta: {
    text: string;
    href: string;
    ariaLabel?: string;
  };
  secondaryCta: {
    text: string;
    href: string;
    ariaLabel?: string;
  };
  visualSrc: string;
  visualAlt: string;
  webpSrc?: string; // Optional WebP version for UX spec compliance
}

const StructuredData = ({ headline, subtext }: { headline: string; subtext: string }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Infin8Content - AI Content Creation Platform",
        "description": subtext,
        "headline": headline,
        "mainEntity": {
          "@type": "Organization",
          "name": "Infin8Content",
          "url": "https://infin8content.com",
          "description": "AI-powered content creation platform for marketers and content creators"
        }
      })
    }}
  />
);

export function HeroSection({
  headline,
  subtext,
  primaryCta,
  secondaryCta,
  visualSrc,
  visualAlt,
  webpSrc,
}: HeroSectionProps) {
  return (
    <>
      <StructuredData headline={headline} subtext={subtext} />
      <section className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background-primary)' }}>
        <MarketingLayout>
          <div className="grid lg:grid-cols-2 gap-12 items-center" style={{ gap: 'var(--spacing-3xl)' }}>
            {/* Content Column */}
            <div className="text-center lg:text-left space-y-8" style={{ paddingTop: 'var(--spacing-4xl)', paddingBottom: 'var(--spacing-4xl)' }}>
              <div className="space-y-6">
                <h1 className="font-semibold tracking-tight leading-tight" style={{ 
                  fontSize: 'var(--font-h1)', 
                  color: 'var(--color-text-primary)'
                }}>
                  {headline}
                </h1>
                <h2 className="font-medium leading-relaxed" style={{ 
                  fontSize: 'var(--font-h2)', 
                  color: 'var(--color-text-muted)'
                }}>
                  {subtext}
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" style={{ gap: 'var(--spacing-md)' }}>
                <Button
                  asChild
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ 
                    background: 'var(--gradient-brand)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  aria-label={primaryCta.ariaLabel}
                >
                  <Link href={primaryCta.href}>
                    {primaryCta.text}
                  </Link>
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="font-semibold transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ 
                    color: 'var(--color-text-primary)',
                    border: '2px solid',
                    borderColor: 'var(--color-border)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  aria-label={secondaryCta.ariaLabel}
                >
                  <Link href={secondaryCta.href}>
                    {secondaryCta.text}
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Visual Column */}
            <div className="relative lg:order-last order-first">
              <div className="relative">
                <Image
                  src={visualSrc}
                  alt={visualAlt}
                  width={600}
                  height={400}
                  priority
                  className="object-cover w-full h-auto"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
                {/* Decorative elements */}
                <div 
                  className="absolute -top-4 -left-4 rounded-2xl opacity-20 blur-xl"
                  style={{
                    width: 'var(--spacing-4xl)',
                    height: 'var(--spacing-4xl)',
                    background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-purple))'
                  }}
                ></div>
                <div 
                  className="absolute -bottom-4 -right-4 rounded-2xl opacity-20 blur-xl"
                  style={{
                    width: 'calc(var(--spacing-4xl) + var(--spacing-md))',
                    height: 'calc(var(--spacing-4xl) + var(--spacing-md))',
                    background: 'linear-gradient(135deg, var(--color-primary-purple), var(--color-error))'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </MarketingLayout>
        
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" style={{ 
          background: 'linear-gradient(to bottom, transparent, transparent, rgba(255, 255, 255, 0.1))'
        }}></div>
      </section>
    </>
  );
}
