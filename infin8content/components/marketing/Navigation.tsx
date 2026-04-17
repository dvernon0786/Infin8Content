"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import MegaMenu, { type MegaMenuItem } from "./navigation/MegaMenu";
import clsx from "clsx";

const FEATURES: MegaMenuItem[] = [
  { label: "AI Article Generator", description: "Research-backed, E-E-A-T optimised long-form articles", href: "/features/ai-article-generator" },
  { label: "Brand Voice Engine", description: "Capture your tone and apply it consistently at scale", href: "/features/brand-voice-engine" },
  { label: "Research Assistant", description: "Live web research grounded in real citations", href: "/features/research-assistant" },
  { label: "SEO Optimisation", description: "Schema, keyword density, and E-E-A-T engineered in", href: "/features/seo-optimization" },
];

const SOLUTIONS: MegaMenuItem[] = [
  { label: "Content Marketing", description: "Scale content production without scaling headcount", href: "/solutions/content-marketing" },
  { label: "SEO Teams", description: "Keyword-to-cluster-to-article pipeline, fully automated", href: "/solutions/seo-teams" },
  { label: "Agencies", description: "Deliver client content at agency speed", href: "/solutions/agencies" },
  { label: "Enterprise", description: "Brand-safe, audit-ready content for large teams", href: "/solutions/enterprise" },
];

const RESOURCES: MegaMenuItem[] = [
  { label: "Documentation", description: "API references, guides, and integration docs", href: "/resources/documentation" },
  { label: "Blog", description: "Guides on AI content, SEO, and scaling", href: "/resources/blog" },
  { label: "Support", description: "Get help from the Infin8Content team", href: "/resources/support" },
  { label: "Community", description: "Connect with other content teams", href: "/resources/community" },
];

type DropdownKey = "features" | "solutions" | "resources" | null;

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: MegaMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const id = useId();
  const menuId = `nav-dropdown-${id}`;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const handleEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 150);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className="flex items-center gap-1 font-lato text-neutral-900 font-medium text-base bg-transparent border-0 cursor-pointer py-2 focus:outline-none"
        aria-expanded={open}
        aria-controls={menuId}
      >
        {label}
        <ChevronDown
          size={16}
          className={clsx("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-hidden={!open} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          <MegaMenu items={items} />
        </div>
      )}
    </div>
  );
}

function MobileAccordion({
  label,
  items,
  open,
  onToggle,
  onLinkClick,
}: {
  label: string;
  items: MegaMenuItem[];
  open: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full font-lato font-medium text-neutral-900 py-3 focus:outline-none"
      >
        {label}
        <ChevronDown
          size={16}
          className={clsx("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <div style={{ maxHeight: open ? "400px" : "0px" }} className="overflow-hidden transition-all duration-300 pl-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onLinkClick && onLinkClick()}
            className="block py-2 font-lato text-sm text-neutral-600 hover:text-(--brand-electric-blue) transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState<DropdownKey>(null);

  const toggleMobile = (key: DropdownKey) =>
    setMobileOpen((prev) => (prev === key ? null : key));

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-(--neutral-200)">
      <div className="max-w-300 mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="Go to homepage">
            <img
              src="/infin8content-logo.png"
              alt="Infin8Content"
              width={192}
              height={41}
              className="object-contain rounded-md"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavDropdown label="Features" items={FEATURES} />
            <NavDropdown label="Solutions" items={SOLUTIONS} />
            <NavDropdown label="Resources" items={RESOURCES} />
            <Link
              href="/pricing"
              className="font-lato font-medium text-neutral-900 text-base hover:text-(--brand-electric-blue) transition-colors"
            >
              Pricing
            </Link>
            <Link href="/register" className="btn-primary inline-block">
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: mobileMenuOpen ? "600px" : "0px" }}>
          <div className="flex flex-col divide-y divide-(--neutral-200) pt-4 pb-6">
            <MobileAccordion
              label="Features"
              items={FEATURES}
              open={mobileOpen === "features"}
              onToggle={() => toggleMobile("features")}
              onLinkClick={() => setMobileMenuOpen(false)}
            />
            <MobileAccordion
              label="Solutions"
              items={SOLUTIONS}
              open={mobileOpen === "solutions"}
              onToggle={() => toggleMobile("solutions")}
              onLinkClick={() => setMobileMenuOpen(false)}
            />
            <MobileAccordion
              label="Resources"
              items={RESOURCES}
              open={mobileOpen === "resources"}
              onToggle={() => toggleMobile("resources")}
              onLinkClick={() => setMobileMenuOpen(false)}
            />
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="font-lato font-medium text-neutral-900 py-3 block"
            >
              Pricing
            </Link>
            <div className="pt-4">
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary block text-center w-full">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
