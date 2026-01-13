import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrustTestimonials } from '@/components/marketing/TrustTestimonials';
import { TestimonialCardProps } from '@/types/marketing';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock MarketingLayout
vi.mock('@/components/marketing/MarketingLayout', () => ({
  MarketingLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TrustTestimonials', () => {
  const mockTestimonials: TestimonialCardProps[] = [
    {
      name: "Sarah Chen",
      company: "TechCorp",
      role: "Content Director",
      headshot: "/images/testimonials/sarah-chen.jpg",
      quote: "Infin8Content transformed our content strategy.",
      outcome: "10x faster content creation"
    },
    {
      name: "Marcus Johnson",
      company: "Digital Minds", 
      role: "Marketing Manager",
      headshot: "/images/testimonials/marcus-johnson.jpg",
      quote: "The AI-powered SEO optimization is incredible.",
      outcome: "300% organic traffic growth"
    }
  ];

  it('renders testimonials section with correct heading', () => {
    render(<TrustTestimonials testimonials={mockTestimonials} />);
    
    expect(screen.getByRole('heading', { name: /trusted by industry leaders/i })).toBeInTheDocument();
    expect(screen.getByText(/see what content leaders and marketing professionals are saying/i)).toBeInTheDocument();
  });

  it('renders all testimonial cards', () => {
    render(<TrustTestimonials testimonials={mockTestimonials} />);
    
    // Check that all testimonials are rendered
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
    expect(screen.getByText(/TechCorp/)).toBeInTheDocument();
    expect(screen.getByText(/Digital Minds/)).toBeInTheDocument();
  });

  it('displays testimonial quotes and outcomes', () => {
    render(<TrustTestimonials testimonials={mockTestimonials} />);
    
    expect(screen.getByText(/infin8content transformed our content strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/the ai-powered seo optimization is incredible/i)).toBeInTheDocument();
    expect(screen.getByText('10x faster content creation')).toBeInTheDocument();
    expect(screen.getByText('300% organic traffic growth')).toBeInTheDocument();
  });

  it('renders images with correct alt text', () => {
    render(<TrustTestimonials testimonials={mockTestimonials} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', 'Sarah Chen, Content Director at TechCorp');
    expect(images[1]).toHaveAttribute('alt', 'Marcus Johnson, Marketing Manager at Digital Minds');
  });

  it('applies correct accessibility roles', () => {
    render(<TrustTestimonials testimonials={mockTestimonials} />);
    
    // Check for list role on grid container
    const grid = screen.getByRole('list');
    expect(grid).toBeInTheDocument();
    
    // Check for listitem roles on individual cards
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <TrustTestimonials testimonials={mockTestimonials} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles empty testimonials array', () => {
    render(<TrustTestimonials testimonials={[]} />);
    
    expect(screen.getByRole('heading', { name: /trusted by industry leaders/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
