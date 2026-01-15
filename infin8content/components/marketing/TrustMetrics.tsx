import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { TrustMetricsProps, TrustMetricProps } from "@/types/marketing";

export function TrustMetrics({
  metrics,
  className
}: TrustMetricsProps) {
  return (
    <section 
      className={cn("py-20", className)}
      style={{
        paddingTop: 'var(--spacing-4xl)',
        paddingBottom: 'var(--spacing-4xl)',
        backgroundColor: 'var(--color-bg-secondary)'
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
            Proven Results at Scale
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
              Join thousands of content teams who trust Infin8Content to deliver exceptional results.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
          {metrics.map((metric, index) => (
            <div key={index} role="listitem">
              <TrustMetric {...metric} />
            </div>
          ))}
        </div>
      </MarketingLayout>
    </section>
  );
}

function TrustMetric({
  number,
  context,
  description,
  className
}: TrustMetricProps) {
  return (
    <div 
      className={cn(
        "text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-bg-primary)'
      }}
    >
      {/* Number */}
      <div 
        className="font-bold mb-2"
        style={{
          fontSize: 'var(--font-h2)',
          color: 'var(--color-primary-blue)',
          fontWeight: 700,
          marginBottom: 'var(--spacing-sm)',
          lineHeight: 1
        }}
      >
        {number}
      </div>

      {/* Context */}
      <div 
        className="font-medium mb-3"
        style={{
          fontSize: 'var(--font-body)',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          marginBottom: 'var(--spacing-sm)'
        }}
      >
        {context}
      </div>

      {/* Description */}
      {description && (
        <div 
          className="text-sm"
          style={{
            fontSize: 'var(--font-body-small)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
