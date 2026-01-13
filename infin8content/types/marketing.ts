export interface HeroSectionProps {
  headline: string;
  subtext: string;
  primaryCta: {
    text: string;
    href: string;
    ariaLabel?: string;
  };
  secondaryCta: {
    text: string;
    href: string;
    ariaLabel?: string;
  };
  visualSrc: string;
  visualAlt: string;
  webpSrc?: string; // Optional WebP version for UX spec compliance
}

export interface CTAButtonProps {
  variant?: "brand" | "ghost";
  size?: "default" | "lg" | "xl";
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export interface MarketingLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export interface ValuePropositionProps {
  title: string;
  description: string;
  benefits: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export interface ProblemSolutionCardProps {
  problem: string;
  solution: string;
  benefit: string;
  className?: string;
}

export interface ProductCapabilityCardProps {
  iconName: string;
  title: string;
  description: string;
  learnMoreLink?: string;
  className?: string;
}

export interface ProblemSolutionSectionProps {
  cards: ProblemSolutionCardProps[];
  className?: string;
}

export interface ProductCapabilitiesSectionProps {
  capabilities: ProductCapabilityCardProps[];
  className?: string;
}
