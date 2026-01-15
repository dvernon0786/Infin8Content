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
        "transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
        className
      )}
      style={{
        backgroundColor: 'var(--color-background-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div className="space-y-4" style={{ gap: 'var(--spacing-md)' }}>
        {/* Problem Statement */}
        <div className="space-y-2">
          <h3 
            style={{
              fontSize: 'var(--font-label)',
              color: 'var(--color-error)',
              fontWeight: 'var(--font-weight-semibold)',
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
            style={{
              fontSize: 'var(--font-label)',
              color: 'var(--color-success)',
              fontWeight: 'var(--font-weight-semibold)',
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
        <div className="pt-2" 
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <h3 
            style={{
              fontSize: 'var(--font-label)',
              color: 'var(--color-primary-blue)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Benefit
          </h3>
          <p 
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)',
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
