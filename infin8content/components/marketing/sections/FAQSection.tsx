"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import SectionWrapper from "../layout/SectionWrapper";
import SectionHeader from "../layout/SectionHeader";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  title?: string;
  items: FAQItem[];
  variant?: "default" | "gradient" | "surface" | "dark";
}

export default function FAQSection({
  title = "Frequently Asked Questions",
  items,
  variant = "default",
}: FAQSectionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SectionWrapper variant={variant}>
      <SectionHeader title={title} align="center" />
      <div className="mt-10 max-w-2xl mx-auto divide-y divide-(--neutral-200)">
        {items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-5 text-left gap-4 focus:outline-none"
              aria-expanded={open === i}
            >
              <span className="font-poppins font-semibold text-neutral-900 text-base">
                {item.q}
              </span>
              <ChevronDown
                size={20}
                className={clsx(
                  "shrink-0 text-(--brand-electric-blue) transition-transform duration-300",
                  open === i && "rotate-180"
                )}
              />
            </button>
            <div
              className={clsx(
                "overflow-hidden transition-all duration-300",
                open === i ? "max-h-96 pb-5" : "max-h-0"
              )}
            >
              <p className="font-lato text-neutral-600 text-sm leading-relaxed">
                {item.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
