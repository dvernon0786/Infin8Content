"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { TestimonialCardProps, TrustTestimonialsProps } from "@/types/marketing";

export function TrustTestimonials({
  testimonials,
  className
}: TrustTestimonialsProps) {
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
            Trusted by Industry Leaders
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
              See what content leaders and marketing professionals are saying about their experience with Infin8Content.
            </p>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
          {testimonials.map((testimonial, index) => (
            <div key={index} role="listitem">
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </MarketingLayout>
    </section>
  );
}

function TestimonialCard({
  name,
  company,
  role,
  headshot,
  quote,
  outcome,
  className
}: TestimonialCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100",
        className
      )}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        border: '1px solid var(--color-border)'
      }}
    >
      {/* Quote */}
      <blockquote className="mb-6" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <p 
          className="text-gray-900 font-medium leading-relaxed"
          style={{
            fontSize: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            fontWeight: 500
          }}
        >
          "{quote}"
        </p>
      </blockquote>

      {/* Outcome */}
      <div className="mb-6" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <p 
          className="text-sm font-medium"
          style={{
            fontSize: 'var(--font-body-small)',
            color: 'var(--color-primary-blue)',
            fontWeight: 600
          }}
        >
          {outcome}
        </p>
      </div>

      {/* Author Info */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          <Image
            src={headshot}
            alt={`${name}, ${role} at ${company}`}
            width={48}
            height={48}
            className="rounded-full object-cover"
            style={{ borderRadius: '50%' }}
            sizes="(max-width: 768px) 48px, 48px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p 
            className="font-semibold text-gray-900 truncate"
            style={{
              fontSize: 'var(--font-body-small)',
              color: 'var(--color-text-primary)',
              fontWeight: 600
            }}
          >
            {name}
          </p>
          <p 
            className="text-sm text-gray-600 truncate"
            style={{
              fontSize: 'var(--font-body-small)',
              color: 'var(--color-text-secondary)'
            }}
          >
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
}
