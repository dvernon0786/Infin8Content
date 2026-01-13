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
      <section className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
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
                  className="text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                  className="text-gray-700 dark:text-gray-300 font-semibold transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ 
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
                  className="rounded-2xl shadow-2xl object-cover w-full h-auto"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
                {/* Decorative elements */}
                <div 
                  className="absolute -top-4 -left-4 rounded-2xl opacity-20 blur-xl"
                  style={{
                    width: '96px',
                    height: '96px',
                    background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-purple))'
                  }}
                ></div>
                <div 
                  className="absolute -bottom-4 -right-4 rounded-2xl opacity-20 blur-xl"
                  style={{
                    width: '128px',
                    height: '128px',
                    background: 'linear-gradient(135deg, var(--color-primary-purple), #ec4899)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </MarketingLayout>
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 dark:to-black/10 pointer-events-none"></div>
      </section>
    </>
  );
}
