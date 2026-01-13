import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductCapabilitiesSection } from '@/components/marketing/ProductCapabilitiesSection';
import { ProductCapabilityCardProps } from '@/types/marketing';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock data for testing
const mockCapabilities: ProductCapabilityCardProps[] = [
  {
    iconName: "Zap",
    title: "AI-Powered Article Generation",
    description: "Generate high-quality, SEO-optimized articles in minutes using advanced AI technology.",
    learnMoreLink: "#ai-generation"
  },
  {
    iconName: "Users",
    title: "Team Collaboration Tools",
    description: "Work seamlessly with your team through real-time collaboration and progress tracking.",
    learnMoreLink: "#collaboration"
  },
  {
    iconName: "Search",
    title: "SEO Optimization Engine",
    description: "Built-in SEO best practices ensure your content ranks higher in search results.",
    learnMoreLink: "#seo"
  },
  {
    iconName: "BarChart3",
    title: "Performance Analytics",
    description: "Track content performance and gain insights to improve your content strategy.",
    learnMoreLink: "#analytics"
  }
];

describe('ProductCapabilitiesSection', () => {
  beforeEach(() => {
    render(<ProductCapabilitiesSection capabilities={mockCapabilities} />);
  });

  it('renders section header with correct title and description', () => {
    expect(screen.getByText('Everything You Need to Create Amazing Content')).toBeInTheDocument();
    expect(screen.getByText(/Powerful features designed to help content creators/)).toBeInTheDocument();
  });

  it('renders all capability cards', () => {
    mockCapabilities.forEach(capability => {
      expect(screen.getByText(capability.title)).toBeInTheDocument();
      expect(screen.getByText(capability.description)).toBeInTheDocument();
    });
  });

  it('renders learn more links when provided', () => {
    const learnMoreLinks = screen.getAllByText('Learn more');
    expect(learnMoreLinks).toHaveLength(mockCapabilities.length);
    
    learnMoreLinks.forEach((link, index) => {
      expect(link).toHaveAttribute('href', mockCapabilities[index].learnMoreLink);
    });
  });

  it('renders icons for each capability', () => {
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(mockCapabilities.length);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProductCapabilitiesSection capabilities={mockCapabilities} className="custom-class" />
    );
    
    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('uses correct design system tokens', () => {
    const { container } = render(<ProductCapabilitiesSection capabilities={mockCapabilities} />);
    
    const section = container.querySelector('section');
    expect(section).toHaveStyle({
      paddingTop: 'var(--spacing-4xl)',
      paddingBottom: 'var(--spacing-4xl)',
      backgroundColor: 'var(--color-bg-surface)'
    });
  });

  it('renders semantic HTML structure', () => {
    const { container } = render(<ProductCapabilitiesSection capabilities={mockCapabilities} />);
    
    // Check for semantic elements
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(container.querySelectorAll('article')).toHaveLength(mockCapabilities.length);
    expect(container.querySelectorAll('h3')).toHaveLength(mockCapabilities.length);
  });

  it('handles empty capabilities array gracefully', () => {
    cleanup(); // Clean up previous render
    
    render(<ProductCapabilitiesSection capabilities={[]} />);
    
    expect(screen.getByText('Everything You Need to Create Amazing Content')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('renders capability cards without learn more links when not provided', () => {
    cleanup(); // Clean up previous render
    
    const capabilitiesWithoutLinks = mockCapabilities.map(cap => ({
      ...cap,
      learnMoreLink: undefined
    }));
    
    render(<ProductCapabilitiesSection capabilities={capabilitiesWithoutLinks} />);
    
    expect(screen.queryAllByText('Learn more')).toHaveLength(0);
  });

  it('has proper accessibility attributes', () => {
    cleanup(); // Clean up previous render
    
    render(<ProductCapabilitiesSection capabilities={mockCapabilities} />);
    
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(mockCapabilities.length);
    
    // Check that articles have proper semantic structure
    articles.forEach((article) => {
      expect(article).toBeInTheDocument();
      expect(article.querySelector('h3')).toBeInTheDocument();
    });
  });
});
