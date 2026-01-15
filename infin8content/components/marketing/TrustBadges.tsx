import Image from "next/image";
import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { TrustBadgesProps, TrustBadgeProps } from "@/types/marketing";

export function TrustBadges({
  badges,
  className
}: TrustBadgesProps) {
  return (
    <section 
      className={cn("py-16", className)}
      style={{
        paddingTop: 'var(--spacing-3xl)',
        paddingBottom: 'var(--spacing-3xl)',
        backgroundColor: 'var(--color-bg-primary)'
      }}
    >
      <MarketingLayout>
        {/* Section Header */}
        <div className="text-center mb-12" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h2 
            className="font-bold text-gray-900 mb-4"
            style={{
              fontSize: 'var(--font-h3)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              marginBottom: 'var(--spacing-md)'
            }}
          >
            Security & Compliance You Can Trust
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
              Your data security is our top priority. We maintain the highest standards of security and compliance.
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8" role="list">
          {badges.map((badge, index) => (
            <div key={index} role="listitem">
              <TrustBadge {...badge} />
            </div>
          ))}
        </div>
      </MarketingLayout>
    </section>
  );
}

function TrustBadge({
  name,
  imageUrl,
  altText,
  certification,
  className
}: TrustBadgeProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300",
        className
      )}
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-primary)'
      }}
      role="img"
      aria-label={altText}
    >
      <Image
        src={imageUrl}
        alt={altText}
        width={80}
        height={80}
        className="object-contain mb-3"
        style={{
          maxWidth: '80px',
          maxHeight: '80px',
          marginBottom: 'var(--spacing-sm)'
        }}
        sizes="(max-width: 768px) 60px, 80px"
      />
      
      {certification && (
        <div 
          className="text-xs text-center font-medium"
          style={{
            fontSize: 'var(--font-body-small)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500
          }}
        >
          {certification}
        </div>
      )}
      
      <div 
        className="text-xs text-center mt-1"
        style={{
          fontSize: 'var(--font-body-small)',
          color: 'var(--color-text-muted)'
        }}
      >
        {name}
      </div>
    </div>
  );
}
