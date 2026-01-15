import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { ProductCapabilityCard } from "./ProductCapabilityCard";
import { ProductCapabilitiesSectionProps } from "@/types/marketing";

export function ProductCapabilitiesSection({
  capabilities,
  className
}: ProductCapabilitiesSectionProps) {
  return (
    <section 
      className={cn("py-20", className)}
      style={{
        paddingTop: 'var(--spacing-4xl)',
        paddingBottom: 'var(--spacing-4xl)',
        backgroundColor: 'var(--color-bg-surface)'
      }}
    >
      <MarketingLayout>
        {/* Section Header */}
        <div className="text-center mb-16" style={{ marginBottom: 'var(--spacing-3xl)' }}>
          <h2 
            className="font-bold text-gray-900 mb-4"
            style={{
              fontSize: 'var(--font-h2)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              marginBottom: 'var(--spacing-md)'
            }}
          >
            Everything You Need to Create Amazing Content
          </h2>
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <p 
              className="text-gray-600"
              style={{
                fontSize: 'var(--font-body)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6
              }}
            >
              Powerful features designed to help content creators, marketers, and teams produce high-quality content at scale.
            </p>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => (
            <ProductCapabilityCard
              key={index}
              iconName={capability.iconName}
              title={capability.title}
              description={capability.description}
              learnMoreLink={capability.learnMoreLink}
            />
          ))}
        </div>
      </MarketingLayout>
    </section>
  );
}
