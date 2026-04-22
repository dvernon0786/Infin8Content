"use client";
import Link from "next/link";
import { useState } from "react";

// ─── Nav data ────────────────────────────────────────────────
const featuresMenu = {
  writing: [
    { label: "AI Content Writer", href: "/features/ai-content-writer" },
    { label: "AI SEO Editor", href: "/features/ai-seo-editor" },
    { label: "News Writer", href: "/features/news-writer" },
    { label: "Video to Blog Post", href: "/features/video-to-blog" },
  ],
  automation: [
    { label: "AI SEO Agent", href: "/features/ai-seo-agent" },
    { label: "AutoPublish", href: "/features/autopublish" },
    { label: "SEO Reports", href: "/features/seo-reports" },
    { label: "LLM Tracker", href: "/features/llm-tracker" },
  ],
};

const solutionsMenu = [
  { label: "SaaS", sub: "Scale organic traffic for your product", href: "/solutions/saas" },
  { label: "Agencies", sub: "Manage multiple clients at scale", href: "/solutions/agency" },
  { label: "E-Commerce", sub: "Upgrade your store's content", href: "/solutions/ecommerce" },
  { label: "Local Business", sub: "Dominate local search", href: "/solutions/local" },
];

const resourcesMenu = [
  { label: "Case Studies", href: "/resources/case-studies" },
  { label: "Learning & Training", href: "/resources/learn" },
  { label: "Blog", href: "/resources/blog" },
  { label: "Help Docs", href: "#" },
];

const footerCols = [
  {
    title: "AI Writing",
    links: [
      { label: "AI Content Writer", href: "/features/ai-content-writer" },
      { label: "AI SEO Editor", href: "/features/ai-seo-editor" },
      { label: "News Writer", href: "#" },
      { label: "Video to Blog", href: "#" },
    ],
  },
  {
    title: "Automation",
    links: [
      { label: "AI SEO Agent", href: "/features/ai-seo-agent" },
      { label: "AutoPublish", href: "/features/autopublish" },
      { label: "SEO Reports", href: "#" },
      { label: "LLM Tracker", href: "/features/llm-tracker" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "#" },
      { label: "Blog", href: "/resources/blog" },
      { label: "Case Studies", href: "/resources/case-studies" },
      { label: "Help Docs", href: "#" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { label: "WordPress", href: "#" },
      { label: "Shopify", href: "#" },
      { label: "Ghost", href: "#" },
      { label: "Webflow", href: "#" },
      { label: "Zapier", href: "#" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "SaaS", href: "/solutions/saas" },
      { label: "Agencies", href: "/solutions/agency" },
      { label: "E-Commerce", href: "/solutions/ecommerce" },
      { label: "Enterprise", href: "#" },
    ],
  },
];

// ─── Countdown hook ───────────────────────────────────────────
function useCountdown(initialSeconds: number) {
  const [secs] = useState(initialSeconds);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { h, m, s };
}

// ─── Sub-components ───────────────────────────────────────────
function DropdownItem({ label, sub, href }: { label: string; sub?: string; href: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-[13.5px] text-[#7b8098] hover:text-white hover:bg-white/5 transition-all"
    >
      {sub ? (
        <>
          <span className="block text-[#e8eaf2] font-medium">{label}</span>
          <span className="block text-[12px] text-[#7b8098]">{sub}</span>
        </>
      ) : label}
    </Link>
  );
}

function NavDropdown({ trigger, children }: { trigger: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-3 py-1.75 rounded-lg text-small font-medium text-[#7b8098] hover:text-white hover:bg-white/5 transition-all">
        {trigger}
        <span className="text-[10px] transition-transform group-hover:rotate-180">▾</span>
      </button>
      <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-[#12141f] border border-white/7 rounded-[14px] p-2 min-w-55 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50">
        {children}
      </div>
    </div>
  );
}

// ─── SocialProof ─────────────────────────────────────────────
export function SocialProof({ label = "10,000+ Marketers & Agencies" }: { label?: string }) {
  const initials = ["JL", "MR", "AK", "SB", "TD"];
  return (
    <div className="flex items-center justify-center gap-2.5 text-[13.5px] text-[#7b8098]">
      <div className="flex">
        {initials.map((i, idx) => (
          <div
            key={idx}
            className="w-7.5 h-7.5 rounded-full border-2 border-[#08090d] bg-[#13151e] flex items-center justify-center text-[10px] font-bold text-[#4f6ef7]"
            style={{ marginLeft: idx === 0 ? 0 : -8 }}
          >
            {i}
          </div>
        ))}
      </div>
      Trusted by <strong className="text-white ml-1">{label}</strong>
    </div>
  );
}

// ─── CtaSection ──────────────────────────────────────────────
export function CtaSection({
  heading = "Scale more content.\nDo less work.",
  sub = "Get started and see why agencies trust Infin8Content.",
  btnLabel = "Get Started Free",
  perks = ["Cancel anytime", "Articles in 30 secs", "Plagiarism free"],
}: {
  heading?: string;
  sub?: string;
  btnLabel?: string;
  perks?: string[];
}) {
  return (
    <section className="py-24 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(79,110,247,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="container mx-auto px-7 relative">
        <h2 className="font-display text-[clamp(28px,5vw,50px)] font-extrabold tracking-tight text-white mb-4 whitespace-pre-line">
          {heading}
        </h2>
        <p className="text-[17px] text-[#7b8098] mb-9">{sub}</p>
        <Link
          href="#"
          className="inline-flex items-center justify-center font-display font-semibold bg-[#4f6ef7] text-white px-8 py-4 rounded-[10px] text-body shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:bg-[#3d5df5] hover:shadow-[0_0_30px_rgba(79,110,247,0.5)] hover:-translate-y-0.5 transition-all"
        >
          {btnLabel}
        </Link>
        <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
          {perks.map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-[13px] text-[#7b8098]">
              <span className="text-[#22c55e] font-bold">✓</span> {p}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2.5 mt-7">
          <SocialProof />
        </div>
      </div>
    </section>
  );
}

// ─── MktLayout (default export) ──────────────────────────────
export default function MktLayout({ children }: { children: React.ReactNode }) {
  const { h, m, s } = useCountdown(8 * 3600 + 34 * 60 + 12);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#08090d", color: "#e8eaf2" }}>
      {/* Promo bar */}
      <div
        className="text-center py-2.5 px-5 text-[13px] font-semibold relative z-50 border-b"
        style={{
          background: "linear-gradient(90deg,#1a1060,#0f1340 50%,#1a1060)",
          borderColor: "rgba(79,110,247,0.2)",
          fontFamily: "Sora, sans-serif",
        }}
      >
        ✨&nbsp; New Year Offer:{" "}
        <strong className="text-[#a5b4fc] mx-1.5">40% Off</strong> on Yearly Plans &nbsp;
        {[h, m, s].map((v, i) => (
          <span
            key={i}
            className="inline-block min-w-7 text-center bg-[rgba(79,110,247,0.2)] border border-[rgba(79,110,247,0.3)] rounded text-[#a5b4fc] font-bold px-1.5 py-0.5 mx-0.5 tabular-nums"
          >
            {v}
          </span>
        ))}
        <span className="text-[#7b8098] mx-1">hrs min sec</span>
        <Link href="#" className="ml-2.5 bg-[#4f6ef7] text-white rounded-full px-3 py-0.5 text-[12px] font-semibold">
          Get Deal
        </Link>
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(8,9,13,0.88)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="container mx-auto px-7 flex items-center justify-between h-15.5 gap-4">
          <Link href="/" className="font-display font-extrabold text-[20px] tracking-tight text-white shrink-0">
            infin8<span className="text-[#4f6ef7]">content</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <NavDropdown trigger="Features">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4a4f68] px-2.5 py-1 mb-1">
                AI Writing
              </div>
              {featuresMenu.writing.map((l) => <DropdownItem key={l.href} {...l} />)}
              <hr className="border-white/7 my-1.5" />
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4a4f68] px-2.5 py-1 mb-1">
                Automation
              </div>
              {featuresMenu.automation.map((l) => <DropdownItem key={l.href} {...l} />)}
            </NavDropdown>

            <NavDropdown trigger="Solutions">
              {solutionsMenu.map((l) => <DropdownItem key={l.href} {...l} />)}
            </NavDropdown>

            <Link href="#" className="px-3 py-1.75 rounded-lg text-small font-medium text-[#7b8098] hover:text-white hover:bg-white/5 transition-all">
              Pricing
            </Link>

            <NavDropdown trigger="Resources">
              {resourcesMenu.map((l) => <DropdownItem key={l.href} {...l} />)}
            </NavDropdown>
          </nav>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <Link href="#" className="text-small font-medium text-[#7b8098] px-3 py-1.75 rounded-lg hover:text-white hover:bg-white/5 transition-all">
              Login
            </Link>
            <Link
              href="#"
              className="font-display font-semibold bg-[#4f6ef7] text-white px-4.5 py-2.25 text-small rounded-lg shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:bg-[#3d5df5] hover:-translate-y-px transition-all"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden border border-white/7 rounded-lg p-2 text-[#e8eaf2]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/7 px-7 py-4 flex flex-col gap-1" style={{ background: "rgba(8,9,13,0.97)" }}>
            {[...featuresMenu.writing, ...featuresMenu.automation, ...solutionsMenu, ...resourcesMenu].map((l) => (
              <Link key={l.href} href={l.href} className="py-2 text-small text-[#7b8098] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="#" className="mt-3 bg-[#4f6ef7] text-white text-center py-2.5 rounded-lg font-semibold" onClick={() => setMobileOpen(false)}>
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/7 pt-14 pb-10">
        <div className="container mx-auto px-7">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-12">
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <Link href="/" className="font-display font-extrabold text-[20px] tracking-tight text-white block mb-3">
                infin8<span className="text-[#4f6ef7]">content</span>
              </Link>
              <p className="text-[13.5px] text-[#7b8098] leading-relaxed">
                AI content workflows for modern teams and agencies.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#4a4f68] mb-3.5">
                  {col.title}
                </h4>
                {col.links.map((l) => (
                  <Link key={l.href} href={l.href} className="block text-[13.5px] text-[#7b8098] mb-2.5 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-white/7">
            <p className="text-[12.5px] text-[#4a4f68]">
              © {new Date().getFullYear()} Infin8Content. All rights reserved.
            </p>
            <div className="flex gap-4">
              {["Privacy Policy", "Terms of Service", "contact@infin8content.com"].map((l) => (
                <Link key={l} href="#" className="text-[12.5px] text-[#4a4f68] hover:text-[#7b8098] transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
