"use client";

import { cn } from "@/lib/utils";
import { ProblemSolutionCardProps } from "@/types/marketing";

export function ProblemSolutionCard({
  problem,
  solution,
  benefit,
  className
}: ProblemSolutionCardProps) {
  return (
    <article 
      className={cn(
        "bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100",
        className
      )}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-border)'
      }}
    >
      <div className="space-y-4" style={{ gap: 'var(--spacing-md)' }}>
        {/* Problem Statement */}
        <div className="space-y-2">
          <h3 
            className="font-semibold text-red-600 text-sm uppercase tracking-wide"
            style={{
              fontSize: 'var(--font-label, 14px)',
              color: 'var(--color-error, #DC2626)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Problem
          </h3>
          <p 
            className="text-gray-700 leading-relaxed"
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.6
            }}
          >
            {problem}
          </p>
        </div>

        {/* Solution Description */}
        <div className="space-y-2">
          <h3 
            className="font-semibold text-green-600 text-sm uppercase tracking-wide"
            style={{
              fontSize: 'var(--font-label, 14px)',
              color: 'var(--color-success, #059669)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Solution
          </h3>
          <p 
            className="text-gray-700 leading-relaxed"
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.6
            }}
          >
            {solution}
          </p>
        </div>

        {/* Benefit/Outcome */}
        <div className="space-y-2 pt-2 border-t border-gray-100" 
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <h3 
            className="font-semibold text-blue-600 text-sm uppercase tracking-wide"
            style={{
              fontSize: 'var(--font-label)',
              color: 'var(--color-primary-blue)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Benefit
          </h3>
          <p 
            className="font-medium text-gray-900 leading-relaxed"
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              lineHeight: 1.6
            }}
          >
            {benefit}
          </p>
        </div>
      </div>
    </article>
  );
}
