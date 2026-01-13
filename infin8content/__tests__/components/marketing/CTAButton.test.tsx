import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { CTAButton } from "@/components/marketing/CTAButton";

// Mock Next.js Link component
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CTAButton", () => {
  it("renders with brand variant by default", () => {
    render(<CTAButton>Click me</CTAButton>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("font-semibold", "shadow-lg");
  });

  it("renders with ghost variant when specified", () => {
    render(<CTAButton variant="ghost">Ghost Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Ghost Button" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("font-semibold");
  });

  it("renders with lg size by default", () => {
    render(<CTAButton>Large Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Large Button" });
    expect(button).toHaveClass("h-12", "px-8", "py-4");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<CTAButton size="default">Default</CTAButton>);
    let button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveClass("h-10", "px-6", "py-3");

    rerender(<CTAButton size="xl">Extra Large</CTAButton>);
    button = screen.getByRole("button", { name: "Extra Large" });
    expect(button).toHaveClass("h-14", "px-10", "py-5");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<CTAButton onClick={handleClick}>Click me</CTAButton>);
    const button = screen.getByRole("button", { name: "Click me" });
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(<CTAButton disabled>Disabled Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Disabled Button" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50", "disabled:pointer-events-none");
  });

  it("renders as link when asChild is true", () => {
    render(
      <CTAButton asChild>
        <a href="/test">Link Button</a>
      </CTAButton>
    );
    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("applies custom className", () => {
    render(<CTAButton className="custom-class">Custom Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Custom Button" });
    expect(button).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    render(<CTAButton aria-label="Custom aria label">Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Custom aria label" });
    expect(button).toHaveAttribute("aria-label", "Custom aria label");
  });

  it("supports different button types", () => {
    render(<CTAButton type="submit">Submit Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Submit Button" });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("has hover and focus states", () => {
    render(<CTAButton variant="brand">Brand Button</CTAButton>);
    const button = screen.getByRole("button", { name: "Brand Button" });
    expect(button).toHaveClass("hover:shadow-xl", "focus-visible:ring-[3px]");
  });
});
