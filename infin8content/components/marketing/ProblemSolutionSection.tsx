import { cn } from "@/lib/utils";
import { MarketingLayout } from "./MarketingLayout";
import { ProblemSolutionCard } from "./ProblemSolutionCard";
import { ProblemSolutionSectionProps } from "@/types/marketing";

export function ProblemSolutionSection({
  cards,
  className
}: ProblemSolutionSectionProps) {
  return (
    <section 
      className={cn("py-20", className)}
      style={{
        paddingTop: 'var(--spacing-4xl)',
        paddingBottom: 'var(--spacing-4xl)',
        backgroundColor: 'var(--color-bg-primary)'
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
            How Infin8Content Solves Your Biggest Content Challenges
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
              Stop struggling with content creation bottlenecks. Our AI-powered platform transforms how you produce, manage, and optimize content at scale.
            </p>
          </div>
        </div>

        {/* Problem-Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory" role="list">
          {/* Mobile scroll hint */}
          <div className="lg:hidden block text-center text-sm text-gray-500 mb-4" role="status" aria-live="polite">
            ← Swipe to see more solutions →
          </div>
          
          {cards.map((card, index) => (
            <div key={index} role="listitem" className="snap-start">
              <ProblemSolutionCard
                problem={card.problem}
                solution={card.solution}
                benefit={card.benefit}
                className="min-w-[280px] lg:min-w-0 max-w-[320px]"
              />
            </div>
          ))}
        </div>
      </MarketingLayout>
    </section>
  );
}
