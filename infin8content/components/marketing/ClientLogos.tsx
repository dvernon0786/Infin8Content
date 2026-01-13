"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { ClientLogosProps, ClientLogoProps } from "@/types/marketing";

export function ClientLogos({
  logos,
  className
}: ClientLogosProps) {
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
            className="font-bold text-gray-900"
            style={{
              fontSize: 'var(--font-h3)',
              color: 'var(--color-text-primary)',
              fontWeight: 700
            }}
          >
            Trusted by leading companies
          </h2>
        </div>

        {/* Logos Grid */}
        <div className="relative">
          {/* Mobile scroll hint */}
          <div className="lg:hidden block text-center text-sm text-gray-500 mb-4" role="status" aria-live="polite">
            ← Swipe to see more companies →
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory" role="list">
            {logos.map((logo, index) => (
              <div key={index} role="listitem" className="snap-start flex items-center justify-center min-w-[120px] lg:min-w-0">
                <ClientLogo {...logo} />
              </div>
            ))}
          </div>
        </div>
      </MarketingLayout>
    </section>
  );
}

function ClientLogo({
  name,
  logoUrl,
  altText,
  className
}: ClientLogoProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div 
      className={cn(
        "flex items-center justify-center p-4 rounded-lg transition-all duration-300 hover:shadow-md focus-within:shadow-md",
        className
      )}
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        filter: isFocused ? 'grayscale(0%) opacity(1)' : 'grayscale(100%) opacity(0.6)',
        transform: isFocused ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'grayscale(0%) opacity(1)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        if (!isFocused) {
          e.currentTarget.style.filter = 'grayscale(100%) opacity(0.6)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <Image
        src={logoUrl}
        alt={altText}
        width={120}
        height={60}
        className="object-contain transition-all duration-300"
        style={{
          maxWidth: '120px',
          maxHeight: '60px',
          width: 'auto',
          height: 'auto'
        }}
        sizes="(max-width: 768px) 100px, 120px"
        tabIndex={0}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
      />
    </div>
  );
}
