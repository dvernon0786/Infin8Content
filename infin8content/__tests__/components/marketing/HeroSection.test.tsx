import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { HeroSection } from "@/components/marketing/HeroSection";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("HeroSection", () => {
  const defaultProps = {
    headline: "Transform Content Creation with AI",
    subtext: "Generate high-quality, SEO-optimized articles in minutes, not hours.",
    primaryCta: {
      text: "Start Free Trial",
      href: "/register",
      ariaLabel: "Start your free trial with Infin8Content",
    },
    secondaryCta: {
      text: "Watch Demo",
      href: "#demo",
      ariaLabel: "Watch a demo of Infin8Content",
    },
    visualSrc: "/images/product-mockup.png",
    visualAlt: "Infin8Content dashboard showing article generation interface",
  };

  beforeEach(() => {
    render(<HeroSection {...defaultProps} />);
  });

  it("renders the headline in an h1 tag", () => {
    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline).toBeInTheDocument();
    expect(headline).toHaveTextContent(defaultProps.headline);
  });

  it("renders the subtext in an h2 tag", () => {
    const subtext = screen.getByRole("heading", { level: 2 });
    expect(subtext).toBeInTheDocument();
    expect(subtext).toHaveTextContent(defaultProps.subtext);
  });

  it("renders primary CTA button with correct text and link", () => {
    const primaryButton = screen.getByText(defaultProps.primaryCta.text);
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).toHaveAttribute("href", defaultProps.primaryCta.href);
    expect(primaryButton).toHaveAttribute("aria-label", defaultProps.primaryCta.ariaLabel);
  });

  it("renders secondary CTA button with correct text and link", () => {
    const secondaryButton = screen.getByText(defaultProps.secondaryCta.text);
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton).toHaveAttribute("href", defaultProps.secondaryCta.href);
    expect(secondaryButton).toHaveAttribute("aria-label", defaultProps.secondaryCta.ariaLabel);
  });

  it("renders product image with correct alt text", () => {
    const productImage = screen.getByAltText(defaultProps.visualAlt);
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute("src", defaultProps.visualSrc);
  });

  it("includes structured data JSON-LD script", () => {
    const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    expect(structuredDataScript).toBeInTheDocument();
    
    const structuredData = JSON.parse(structuredDataScript?.textContent || "{}");
    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@type"]).toBe("WebPage");
    expect(structuredData.headline).toBe(defaultProps.headline);
    expect(structuredData.description).toBe(defaultProps.subtext);
  });

  it("applies proper CSS classes for responsive design", () => {
    const section = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(section).toHaveClass("min-h-screen", "flex", "items-center", "justify-center");
    
    const container = section?.querySelector(".container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("mx-auto", "px-4", "sm:px-6", "lg:px-8");
  });

  it("has proper accessibility attributes", () => {
    const primaryButton = screen.getByText(defaultProps.primaryCta.text);
    const secondaryButton = screen.getByText(defaultProps.secondaryCta.text);
    
    expect(primaryButton).toHaveAttribute("aria-label");
    expect(secondaryButton).toHaveAttribute("aria-label");
  });

  it("uses semantic HTML structure", () => {
    // Check for proper heading hierarchy
    const h1 = screen.getByRole("heading", { level: 1 });
    const h2 = screen.getByRole("heading", { level: 2 });
    
    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    
    // Check for section element
    const section = h1.closest("section");
    expect(section).toBeInTheDocument();
    expect(section?.tagName).toBe("SECTION");
  });
});
