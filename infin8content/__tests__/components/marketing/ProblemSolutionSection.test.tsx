import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProblemSolutionSection } from '@/components/marketing/ProblemSolutionSection';
import { ProblemSolutionCardProps } from '@/types/marketing';

// Mock data for testing
const mockCards: ProblemSolutionCardProps[] = [
  {
    problem: "Creating quality content takes hours",
    solution: "AI generates articles in minutes",
    benefit: "10x faster content creation"
  },
  {
    problem: "Inconsistent brand voice across content",
    solution: "AI maintains your brand guidelines",
    benefit: "Perfect brand consistency"
  },
  {
    problem: "Team collaboration chaos",
    solution: "Real-time progress tracking",
    benefit: "Seamless teamwork"
  },
  {
    problem: "SEO optimization complexity",
    solution: "Built-in SEO best practices",
    benefit: "Higher rankings automatically"
  }
];

describe('ProblemSolutionSection', () => {
  it('renders section header with correct title and description', () => {
    render(<ProblemSolutionSection cards={mockCards} />);
    
    expect(screen.getByText('How Infin8Content Solves Your Biggest Content Challenges')).toBeInTheDocument();
    expect(screen.getByText(/Stop struggling with content creation bottlenecks/)).toBeInTheDocument();
  });

  it('renders all problem-solution cards', () => {
    render(<ProblemSolutionSection cards={mockCards} />);
    
    // Check that all problems are rendered
    mockCards.forEach(card => {
      expect(screen.getByText(card.problem)).toBeInTheDocument();
      expect(screen.getByText(card.solution)).toBeInTheDocument();
      expect(screen.getByText(card.benefit)).toBeInTheDocument();
    });
  });

  it('renders correct card structure with Problem, Solution, and Benefit sections', () => {
    render(<ProblemSolutionSection cards={mockCards} />);
    
    // Check for section headers
    expect(screen.getAllByText('Problem')).toHaveLength(mockCards.length);
    expect(screen.getAllByText('Solution')).toHaveLength(mockCards.length);
    expect(screen.getAllByText('Benefit')).toHaveLength(mockCards.length);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProblemSolutionSection cards={mockCards} className="custom-class" />
    );
    
    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('renders mobile scroll hint on smaller screens', () => {
    render(<ProblemSolutionSection cards={mockCards} />);
    
    expect(screen.getByText('← Swipe to see more solutions →')).toBeInTheDocument();
  });

  it('uses correct design system tokens', () => {
    const { container } = render(<ProblemSolutionSection cards={mockCards} />);
    
    const section = container.querySelector('section');
    expect(section).toHaveStyle({
      paddingTop: 'var(--spacing-4xl)',
      paddingBottom: 'var(--spacing-4xl)',
      backgroundColor: 'var(--color-bg-primary)'
    });
  });

  it('renders semantic HTML structure', () => {
    const { container } = render(<ProblemSolutionSection cards={mockCards} />);
    
    // Check for semantic elements
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(container.querySelectorAll('article')).toHaveLength(mockCards.length);
    expect(container.querySelectorAll('h3')).toHaveLength(mockCards.length * 3); // 3 headings per card
  });

  it('handles empty cards array gracefully', () => {
    render(<ProblemSolutionSection cards={[]} />);
    
    expect(screen.getByText('How Infin8Content Solves Your Biggest Content Challenges')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
});
