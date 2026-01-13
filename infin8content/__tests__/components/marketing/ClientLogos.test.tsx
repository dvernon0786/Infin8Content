import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientLogos } from '@/components/marketing/ClientLogos';
import { ClientLogoProps } from '@/types/marketing';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock MarketingLayout
vi.mock('@/components/marketing/MarketingLayout', () => ({
  MarketingLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ClientLogos', () => {
  const mockLogos: ClientLogoProps[] = [
    {
      name: "Microsoft",
      logoUrl: "/images/clients/microsoft.svg",
      altText: "Microsoft logo"
    },
    {
      name: "Google",
      logoUrl: "/images/clients/google.svg",
      altText: "Google logo"
    },
    {
      name: "Amazon",
      logoUrl: "/images/clients/amazon.svg",
      altText: "Amazon logo"
    }
  ];

  it('renders client logos section with correct heading', () => {
    render(<ClientLogos logos={mockLogos} />);
    
    expect(screen.getByRole('heading', { name: /trusted by leading companies/i })).toBeInTheDocument();
  });

  it('renders all client logos', () => {
    render(<ClientLogos logos={mockLogos} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', 'Microsoft logo');
    expect(images[1]).toHaveAttribute('alt', 'Google logo');
    expect(images[2]).toHaveAttribute('alt', 'Amazon logo');
  });

  it('applies correct accessibility roles', () => {
    render(<ClientLogos logos={mockLogos} />);
    
    // Check for list role on grid container
    const grid = screen.getByRole('list');
    expect(grid).toBeInTheDocument();
    
    // Check for listitem roles on individual logos
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('shows mobile scroll hint', () => {
    render(<ClientLogos logos={mockLogos} />);
    
    expect(screen.getByText(/swipe to see more companies/i)).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <ClientLogos logos={mockLogos} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles empty logos array', () => {
    render(<ClientLogos logos={[]} />);
    
    expect(screen.getByRole('heading', { name: /trusted by leading companies/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
