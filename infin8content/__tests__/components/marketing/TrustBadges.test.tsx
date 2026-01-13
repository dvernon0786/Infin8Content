import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrustBadges } from '@/components/marketing/TrustBadges';
import { TrustBadgeProps } from '@/types/marketing';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock MarketingLayout
vi.mock('@/components/marketing/MarketingLayout', () => ({
  MarketingLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TrustBadges', () => {
  const mockBadges: TrustBadgeProps[] = [
    {
      name: "SSL Certificate",
      imageUrl: "/images/badges/ssl.svg",
      altText: "SSL Security Certificate",
      certification: "256-bit Encryption"
    },
    {
      name: "PCI DSS",
      imageUrl: "/images/badges/pci-dss.svg",
      altText: "PCI DSS Compliant",
      certification: "Level 1 Certified"
    },
    {
      name: "GDPR",
      imageUrl: "/images/badges/gdpr.svg",
      altText: "GDPR Compliant",
      certification: "EU Data Protection"
    }
  ];

  it('renders trust badges section with correct heading', () => {
    render(<TrustBadges badges={mockBadges} />);
    
    expect(screen.getByRole('heading', { name: /security & compliance you can trust/i })).toBeInTheDocument();
    expect(screen.getByText(/your data security is our top priority/i)).toBeInTheDocument();
  });

  it('renders all badge images with correct alt text', () => {
    render(<TrustBadges badges={mockBadges} />);
    
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(3);
    
    // Check that our specific badge images are present
    expect(screen.getByAltText('SSL Security Certificate')).toBeInTheDocument();
    expect(screen.getByAltText('PCI DSS Compliant')).toBeInTheDocument();
    expect(screen.getByAltText('GDPR Compliant')).toBeInTheDocument();
  });

  it('renders badge names and certifications', () => {
    render(<TrustBadges badges={mockBadges} />);
    
    expect(screen.getByText('SSL Certificate')).toBeInTheDocument();
    expect(screen.getByText('256-bit Encryption')).toBeInTheDocument();
    expect(screen.getByText('PCI DSS')).toBeInTheDocument();
    expect(screen.getByText('Level 1 Certified')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
    expect(screen.getByText('EU Data Protection')).toBeInTheDocument();
  });

  it('applies correct accessibility roles', () => {
    render(<TrustBadges badges={mockBadges} />);
    
    // Check for list role on grid container
    const grid = screen.getByRole('list');
    expect(grid).toBeInTheDocument();
    
    // Check for listitem roles on individual badges
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <TrustBadges badges={mockBadges} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles empty badges array', () => {
    render(<TrustBadges badges={[]} />);
    
    expect(screen.getByRole('heading', { name: /security & compliance you can trust/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('handles badges without certification', () => {
    const badgesWithoutCert: TrustBadgeProps[] = [
      {
        name: "Basic Badge",
        imageUrl: "/images/badges/basic.svg",
        altText: "Basic security badge"
      }
    ];

    render(<TrustBadges badges={badgesWithoutCert} />);
    
    expect(screen.getByText('Basic Badge')).toBeInTheDocument();
    expect(screen.queryByText(/certification/i)).not.toBeInTheDocument();
  });
});
