"use client";

import clsx from "clsx";

type SectionVariant = "default" | "gradient" | "surface" | "dark" | "brand";

const variantClasses: Record<SectionVariant, string> = {
  default: "bg-white",
  gradient: "bg-gradient-light",
  surface: "bg-surface",
  dark: "bg-neutral-900 text-white",
  brand: "bg-gradient-brand text-white",
};

interface SectionWrapperProps {
  children: React.ReactNode;
  variant?: SectionVariant;
  className?: string;
  id?: string;
}

export default function SectionWrapper({
  children,
  variant = "default",
  className,
  id,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={clsx("relative py-24", variantClasses[variant], className)}
    >
      <div className="max-w-300 mx-auto px-6">{children}</div>
    </section>
  );
}
