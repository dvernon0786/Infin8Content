import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrustMetrics } from '@/components/marketing/TrustMetrics';
import { TrustMetricProps } from '@/types/marketing';

// Mock MarketingLayout
vi.mock('@/components/marketing/MarketingLayout', () => ({
  MarketingLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TrustMetrics', () => {
  const mockMetrics: TrustMetricProps[] = [
    {
      number: "500+",
      context: "Enterprise Clients",
      description: "Fortune 500 companies trust our platform"
    },
    {
      number: "10M+",
      context: "Words Generated",
      description: "AI-powered content creation at scale"
    },
    {
      number: "99.9%",
      context: "Uptime",
      description: "Reliable service you can count on"
    },
    {
      number: "4.9/5",
      context: "Customer Rating"
    }
  ];

  it('renders trust metrics section with correct heading', () => {
    render(<TrustMetrics metrics={mockMetrics} />);
    
    expect(screen.getByRole('heading', { name: /proven results at scale/i })).toBeInTheDocument();
    expect(screen.getByText(/join thousands of content teams who trust infin8content/i)).toBeInTheDocument();
  });

  it('renders all metric numbers and contexts', () => {
    render(<TrustMetrics metrics={mockMetrics} />);
    
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Clients')).toBeInTheDocument();
    expect(screen.getByText('10M+')).toBeInTheDocument();
    expect(screen.getByText('Words Generated')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('4.9/5')).toBeInTheDocument();
    expect(screen.getByText('Customer Rating')).toBeInTheDocument();
  });

  it('renders metric descriptions when provided', () => {
    render(<TrustMetrics metrics={mockMetrics} />);
    
    expect(screen.getByText('Fortune 500 companies trust our platform')).toBeInTheDocument();
    expect(screen.getByText('AI-powered content creation at scale')).toBeInTheDocument();
    expect(screen.getByText('Reliable service you can count on')).toBeInTheDocument();
  });

  it('applies correct accessibility roles', () => {
    render(<TrustMetrics metrics={mockMetrics} />);
    
    // Check for list role on grid container
    const grid = screen.getByRole('list');
    expect(grid).toBeInTheDocument();
    
    // Check for listitem roles on individual metrics
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <TrustMetrics metrics={mockMetrics} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles empty metrics array', () => {
    render(<TrustMetrics metrics={[]} />);
    
    expect(screen.getByRole('heading', { name: /proven results at scale/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('handles metrics without descriptions', () => {
    const metricsWithoutDesc: TrustMetricProps[] = [
      {
        number: "100%",
        context: "Satisfaction"
      }
    ];

    render(<TrustMetrics metrics={metricsWithoutDesc} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });
});
