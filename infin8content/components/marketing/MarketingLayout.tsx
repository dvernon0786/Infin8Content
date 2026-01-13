import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MarketingLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function MarketingLayout({
  children,
  className,
  maxWidth = "xl",
}: MarketingLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-7xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
