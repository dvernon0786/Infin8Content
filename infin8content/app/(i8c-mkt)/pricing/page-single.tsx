"use client";

import { useState } from "react";
import { Check, Zap, ChevronDown, Minus, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LIMITS = {
  credits_per_month: { starter: 1000, pro: 2000, agency: 8000 },
  autoblogs: { starter: 1, pro: 5, agency: "Unlimited" },
  keyword_research: { starter: 50, pro: 200, agency: "Unlimited" },
  cms_connection: { starter: 1, pro: 3, agency: "Unlimited" },
  projects: { starter: 1, pro: 5, agency: "Unlimited" },
  team_members: { starter: 1, pro: 3, agency: "Unlimited" },
  image_storage_gb: { starter: 5, pro: 25, agency: 100 },
  api_calls: { starter: 100, pro: 1000, agency: "Unlimited" },
  knowledge_bases: { starter: 0, pro: 3, agency: "Unlimited" },
  sub_accounts: { starter: 0, pro: 1, agency: "Unlimited" },
  llm_prompts: { starter: 0, pro: 25, agency: "Unlimited" },
  article_generation: { starter: 10, pro: 50, agency: 150 },
};

const PRICING_PLANS = {
  starter: { monthly: 49, annual: 41.5 },
  pro: { monthly: 220, annual: 175 },
  agency: { monthly: 399, annual: 299 },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Pricing Hero
function PricingHero({ billing, setBilling }: { billing: "monthly" | "annual"; setBilling: (v: "monthly" | "annual") => void }) {
  return (
    <section className="sm:px-6 lg:px-8 max-w-7xl mx-auto pt-20 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-mkt-accent">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-mkt-white mt-3 font-poppins leading-tight">
            Simple pricing<br />that grows with you
          </h1>
          <p className="text-mkt-muted mt-4 max-w-xl font-lato text-base leading-relaxed">
            Choose a plan that fits today. Upgrade anytime as you scale — all plans include every core feature.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-mkt-accent-border bg-mkt-accent-lite px-4 py-2 text-sm text-mkt-accent font-medium">
            <span>✨</span>
            <span>Launch Offer — First 100 users lock lifetime pricing</span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <p className="text-xs text-mkt-muted font-semibold uppercase tracking-widest">Billing cycle</p>
          <div className="relative inline-flex rounded-xl border border-mkt-border bg-mkt-surface p-1 shadow-sm">
            {(["monthly", "annual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBilling(mode)}
                className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  billing === mode ? "text-white shadow-md" : "text-mkt-muted hover:text-mkt-white"
                }`}
                style={billing === mode ? { background: "linear-gradient(to right,#217CEB,#4A42CC)" } : {}}
              >
                {mode === "monthly" ? "Monthly" : "Annually"}
                {mode === "annual" && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === "annual" ? "bg-white/20 text-white" : "bg-mkt-green-lite text-mkt-green"}`}>
                    Save 40%
                  </span>
                )}
              </button>
            ))}
          </div>
          {billing === "annual" && (
            <p className="text-xs text-mkt-green font-medium animate-fade-up">🎉 You save up to $1,200/year on Agency</p>
          )}
        </div>
      </div>
    </section>
  );
}

// 2. Pricing Plans
function PricingPlans({ billing }: { billing: "monthly" | "annual" }) {
  const plans = [
    {
      key: "starter" as const,
      name: "Starter",
      tagline: "Launch fast, learn faster.",
      sub: "Best for solo creators & small blogs",
      cta: "Get Started",
      ctaHref: "/register",
      popular: false,
      features: [
        { label: `${PLAN_LIMITS.credits_per_month.starter.toLocaleString()} credits / month`, note: "≈ 10 AI articles" },
        { label: `${PLAN_LIMITS.autoblogs.starter} AutoPublish campaign` },
        { label: `${PLAN_LIMITS.keyword_research.starter} keyword researches / mo` },
        { label: `${PLAN_LIMITS.cms_connection.starter} CMS connection` },
        { label: `${PLAN_LIMITS.projects.starter} project` },
        { label: `${PLAN_LIMITS.team_members.starter} team member` },
        { label: `${PLAN_LIMITS.image_storage_gb.starter} GB image storage` },
        { label: "AI article writer (150+ languages)" },
        { label: "Featured & in-article images" },
        { label: "Internal & external linking" },
        { label: "Auto keyword research" },
        { label: "All CMS integrations" },
        { label: `${PLAN_LIMITS.api_calls.starter} API calls / month` },
        { label: "48h support response" },
      ],
      notIncluded: ["LLM Brand Visibility Tracker", "AI SEO Editor", "Knowledge Bases", "White-label SEO reports", "Sub-accounts"],
    },
    {
      key: "pro" as const,
      name: "Pro",
      tagline: "Grow with confidence.",
      sub: "Best for growing SEO teams",
      cta: "Get Started",
      ctaHref: "/register",
      popular: true,
      features: [
        { label: `${PLAN_LIMITS.credits_per_month.pro.toLocaleString()} credits / month`, note: "≈ 50 AI articles" },
        { label: `${PLAN_LIMITS.autoblogs.pro} AutoPublish campaigns` },
        { label: `${PLAN_LIMITS.keyword_research.pro} keyword researches / mo` },
        { label: `${PLAN_LIMITS.cms_connection.pro} CMS connections` },
        { label: `${PLAN_LIMITS.projects.pro} projects` },
        { label: `${PLAN_LIMITS.team_members.pro} team members` },
        { label: `${PLAN_LIMITS.image_storage_gb.pro} GB image storage` },
        { label: "Everything in Starter, plus:" },
        { label: "LLM Brand Visibility Tracker", badge: "NEW" },
        { label: "AI SEO Editor" },
        { label: "Custom content templates" },
        { label: `${PLAN_LIMITS.knowledge_bases.pro} knowledge bases` },
        { label: "White-label SEO reports" },
        { label: `Up to ${PLAN_LIMITS.sub_accounts.pro} sub-account` },
        { label: "Auto-translate (150+ languages)" },
        { label: "Custom AI-generated images" },
        { label: "Webhooks" },
        { label: `${PLAN_LIMITS.api_calls.pro.toLocaleString()} API calls / month` },
        { label: `${PLAN_LIMITS.llm_prompts.pro} LLM prompts tracked / mo` },
        { label: "24h support response" },
      ],
      notIncluded: [],
    },
    {
      key: "agency" as const,
      name: "Agency",
      tagline: "Built for scale & serious ROI.",
      sub: "Best for agencies & enterprise sites",
      cta: "Talk to Sales",
      ctaHref: "/call",
      popular: false,
      features: [
        { label: `${PLAN_LIMITS.credits_per_month.agency.toLocaleString()} credits / month`, note: "≈ 150 AI articles" },
        { label: "Unlimited AutoPublish campaigns" },
        { label: "Unlimited keyword research" },
        { label: "Unlimited CMS connections" },
        { label: "Unlimited projects" },
        { label: "Unlimited team members" },
        { label: `${PLAN_LIMITS.image_storage_gb.agency} GB image storage` },
        { label: "Everything in Pro, plus:" },
        { label: "Unlimited workspaces" },
        { label: "Unlimited sub-accounts" },
        { label: "Unlimited LLM prompts tracked" },
        { label: "Unlimited knowledge bases" },
        { label: "Public API access" },
        { label: "White-label & custom domain" },
        { label: "Client portal" },
        { label: "Live chat support on Slack" },
        { label: "Strategy support" },
        { label: "4h support response" },
        { label: "99.9% uptime SLA" },
      ],
      notIncluded: [],
    },
  ];

  function CheckRow({ label, note, badge }: { label: string; note?: string; badge?: string }) {
    const isSeparator = label.includes("Everything in") || label.includes("plus:");
    if (isSeparator) {
      return (
        <li className="pt-2 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
        </li>
      );
    }
    return (
      <li className="flex items-start gap-2.5">
        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <span className="text-sm text-neutral-700 font-lato leading-snug">
          {label}
          {note && <span className="ml-1 text-neutral-400 text-xs">({note})</span>}
          {badge && (
            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider bg-linear-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
      </li>
    );
  }

  return (
    <section id="pricing-cards" className="sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-start">
        {plans.map((plan) => {
          const price = billing === "monthly" ? PRICING_PLANS[plan.key].monthly : PRICING_PLANS[plan.key].annual;
          const monthlyPrice = PRICING_PLANS[plan.key].monthly;
          const annualSavings = billing === "annual" ? (monthlyPrice - price) * 12 : 0;
          const articleLimit = PLAN_LIMITS.article_generation[plan.key];
          const costPerArticle = typeof articleLimit === "number" ? (price / articleLimit).toFixed(2) : null;

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border bg-mkt-surface transition-all duration-300 ${
                plan.popular ? "border-mkt-accent shadow-xl md:scale-[1.03] z-10" : "border-mkt-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-4 py-1.5 rounded-full shadow-md whitespace-nowrap" style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}>
                  ⚡ Most Popular
                </div>
              )}
              <div className={`p-8 pb-6 ${plan.popular ? "border-b border-mkt-accent-border" : "border-b border-mkt-border"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-mkt-white font-poppins">{plan.name}</h3>
                    <p className="text-xs text-mkt-muted mt-1">{plan.sub}</p>
                  </div>
                  {plan.popular && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-mkt-accent bg-mkt-accent-lite border border-mkt-accent-border px-2 py-1 rounded-lg">
                      <Zap className="w-3 h-3" /> Best value
                    </div>
                  )}
                </div>
                <p className="text-sm text-mkt-muted mt-2 font-lato">{plan.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-medium tracking-tighter text-mkt-white font-poppins">${price}</span>
                  <span className="text-sm text-mkt-muted mb-1.5">{billing === "monthly" ? "/mo" : "/mo"}</span>
                </div>
                {billing === "annual" && <p className="text-xs text-mkt-muted2 mt-0.5">billed annually</p>}
                {costPerArticle && (
                  <p className="text-xs text-mkt-muted mt-2">
                    Only <strong className="text-mkt-white">${costPerArticle}</strong> per article
                  </p>
                )}
                {billing === "annual" && annualSavings > 0 && (
                  <p className="text-xs text-mkt-green font-semibold mt-1">You save ${annualSavings.toLocaleString()}/year</p>
                )}
                {plan.popular && <p className="text-xs text-mkt-green font-semibold mt-1">Best value for growing teams</p>}
                <div className="mt-6">
                  <a href={plan.ctaHref} className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all duration-200" style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}>
                    {plan.cta}
                  </a>
                  <p className="text-[10px] text-mkt-muted2 mt-2 text-center uppercase tracking-widest font-bold">
                    {plan.key === "agency" ? "Custom pricing · No lock-in" : "$1 trial · Cancel anytime"}
                  </p>
                </div>
              </div>
              <div className="p-8 pt-6">
                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <CheckRow key={i} {...f} />
                  ))}
                </ul>
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-mkt-border">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-mkt-muted2 mb-3">Not included</p>
                    <ul className="space-y-2">
                      {plan.notIncluded.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-mkt-muted2 font-lato">
                          <span className="text-mkt-muted">✕</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-12 text-center">
        <p className="text-sm text-mkt-muted font-medium bg-mkt-surface px-6 py-3 rounded-full inline-block border border-mkt-border shadow-sm">
          🔒 $1 trial for 3 days on Starter &amp; Pro · Cancel anytime · No questions asked
        </p>
      </div>
    </section>
  );
}

// 3. Traffic Proof Strip
function TrafficProofStrip() {
  const stats = [
    { label: "0 → 2,600/mo", sub: "in 120 days" },
    { label: "100 → 4,500/mo", sub: "in 150 days" },
    { label: "0 → 5,800/mo", sub: "in 30 days" },
    { label: "0 → 8,000/mo", sub: "in 8 months" },
    { label: "0 → 6,000/mo", sub: "in 5 months" },
    { label: "1k → 24,000/mo", sub: "in 12 months" },
    { label: "0 → 14,000/mo", sub: "in 60 days" },
    { label: "600 → 6,000/mo", sub: "in 9 months" },
    { label: "0 → 1,600/mo", sub: "in 60 days" },
    { label: "4k → 14,000/mo", sub: "in 90 days" },
  ];
  const doubled = [...stats, ...stats];

  return (
    <section className="py-12 overflow-hidden border-y border-mkt-border bg-mkt-surface">
      <div className="mb-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-mkt-muted2">Real results from real teams</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-mkt-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-mkt-surface to-transparent z-10 pointer-events-none" />
        <div className="flex gap-4" style={{ animation: "marquee 28s linear infinite", width: "max-content" }}>
          {doubled.map((s, i) => (
            <div key={i} className="shrink-0 flex items-center gap-3 bg-mkt-surface2 border border-mkt-border rounded-xl px-5 py-3">
              <span className="text-sm font-bold text-mkt-white font-poppins">{s.label}</span>
              <span className="text-xs text-mkt-muted">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. Feature Value Section
function FeatureValueSection() {
  const categories = [
    {
      label: "AI Writing",
      color: "text-blue-600",
      bg: "bg-blue-50",
      features: ["AI Content Writer (150+ languages)", "AI SEO Editor with custom prompts", "News Writer", "Video to Blog Post", "Custom content templates", "Brand voice training", "Extensive article formatting", "Featured & in-article image generation", "YouTube video embeds", "Table of contents generation"],
    },
    {
      label: "Automation",
      color: "text-purple-600",
      bg: "bg-purple-50",
      features: ["AutoPublish (set-and-forget campaigns)", "RSS / keyword / news feed ingestion", "Auto-social posting on publish", "AI SEO Agent (autopilot fixes)", "Schema markup injection", "Meta title & description optimization", "Image alt text automation", "Internal linking automation", "Broken link detection & repair", "Google fast-indexing on publish"],
    },
    {
      label: "LLM & AI Visibility",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      features: ["LLM Brand Visibility Tracker", "ChatGPT mention monitoring", "Perplexity citation tracking", "Gemini, Claude & Grok coverage", "Google AI Overviews tracking", "Share-of-voice vs competitors", "Sentiment analysis (pos/neg/neutral)", "Historical visibility trends", "Competitor benchmarking", "White-label LLM reports"],
    },
    {
      label: "SEO & Research",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      features: ["Keyword research & clustering", "Auto keyword research on publish", "Internal & external link suggestions", "SEO score per article", "White-label SEO reports", "Canonical tag management", "Structured data (FAQ, How-To schema)", "Heading structure optimization", "Smart 301/302 redirects", "Duplicate content prevention"],
    },
    {
      label: "Knowledge Base",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      features: ["Upload websites, docs, PDFs", "Brand voice learning phase", "Context-aware article generation", "Per-client knowledge isolation", "Auto-apply to new content"],
    },
    {
      label: "Publishing & Integrations",
      color: "text-orange-600",
      bg: "bg-orange-50",
      features: ["WordPress one-click publish", "Shopify blog integration", "Ghost, Webflow, Wix, Squarespace", "Blogger & custom webhooks", "Zapier integration", "Public API (Agency)", "Bulk article generation & export", "Draft-to-publish workflow", "Multi-site management"],
    },
  ];

  return (
    <section className="py-20 bg-mkt-surface2">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-mkt-accent mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-mkt-white font-poppins">Everything you need to scale content</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="bg-mkt-surface border border-mkt-border rounded-2xl p-6">
              <h3 className={`text-sm font-bold uppercase tracking-widest ${cat.color} mb-4`}>{cat.label}</h3>
              <ul className="space-y-2">
                {cat.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-mkt-muted font-lato">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 5. Pricing Comparison Row
function PricingComparisonRow() {
  const rows = [
    { feature: "AI Writing", category: "ai-writing", starter: "", pro: "", agency: "" },
    { feature: "AI article writer", starter: true, pro: true, agency: true },
    { feature: "Credits / month", starter: "1,000", pro: "2,000", agency: "8,000", highlight: true },
    { feature: "Articles / month (est.)", starter: "~10", pro: "~50", agency: "~150" },
    { feature: "150+ languages", starter: true, pro: true, agency: true },
    { feature: "AI SEO Editor", starter: false, pro: true, agency: true },
    { feature: "Knowledge Base", category: "knowledge", starter: "", pro: "", agency: "" },
    { feature: "Knowledge bases", starter: false, pro: "3", agency: "Unlimited" },
    { feature: "Upload websites, PDFs, docs", starter: false, pro: true, agency: true },
    { feature: "Automation", category: "automation", starter: "", pro: "", agency: "" },
    { feature: "AutoPublish campaigns", starter: "1", pro: "5", agency: "Unlimited", highlight: true },
    { feature: "AI SEO Agent (autopilot)", starter: false, pro: true, agency: true },
    { feature: "LLM Visibility", category: "llm", starter: "", pro: "", agency: "" },
    { feature: "LLM Brand Visibility Tracker", starter: false, pro: true, agency: true, highlight: true },
    { feature: "Publishing", category: "publishing", starter: "", pro: "", agency: "" },
    { feature: "CMS connections", starter: "1", pro: "3", agency: "Unlimited" },
    { feature: "Team & Agency", category: "team", starter: "", pro: "", agency: "" },
    { feature: "Projects", starter: "1", pro: "5", agency: "Unlimited" },
    { feature: "Team members", starter: "1", pro: "3", agency: "Unlimited" },
    { feature: "Storage & Support", category: "support", starter: "", pro: "", agency: "" },
    { feature: "Image storage", starter: "5 GB", pro: "25 GB", agency: "100 GB" },
    { feature: "Support response time", starter: "48h", pro: "24h", agency: "4h" },
  ];

  function Cell({ val }: { val: string | boolean }) {
    if (val === true) return <Check className="w-4 h-4 text-blue-500 mx-auto" />;
    if (val === false) return <Minus className="w-4 h-4 text-neutral-300 mx-auto" />;
    return <span className="text-sm text-neutral-700 font-lato">{String(val)}</span>;
  }

  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-semibold text-mkt-white font-poppins">Compare plans in full</h2>
        <p className="text-sm text-mkt-muted font-lato hidden md:block">Every feature, side by side</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-mkt-border shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mkt-surface2 border-b border-mkt-border">
              <th className="p-4 text-left font-semibold text-mkt-muted w-[40%]">Feature</th>
              {["Starter", "Pro", "Agency"].map((name) => (
                <th key={name} className={`p-4 text-center font-semibold ${name === "Pro" ? "text-mkt-accent bg-mkt-accent-lite" : "text-mkt-muted"}`}>
                  {name}
                  {name === "Pro" && <span className="block text-[10px] font-normal text-mkt-accent mt-0.5">Most Popular</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-mkt-surface divide-y divide-mkt-border">
            {rows.map((row, i) => {
              if (row.category) {
                return (
                  <tr key={`${row.category}-${i}`} className="bg-mkt-surface2">
                    <td colSpan={4} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-mkt-muted2">{row.feature}</td>
                  </tr>
                );
              }
              return (
                <tr key={row.feature} className={`transition-colors hover:bg-mkt-surface2 ${row.highlight ? "bg-mkt-accent-lite" : ""}`}>
                  <td className={`p-4 font-lato ${row.highlight ? "font-semibold text-mkt-white" : "text-mkt-muted"}`}>{row.feature}</td>
                  <td className="p-4 text-center"><Cell val={row.starter} /></td>
                  <td className={`p-4 text-center ${row.pro === true || (typeof row.pro === "string" && row.pro !== "—") ? "bg-blue-50/40" : ""}`}><Cell val={row.pro} /></td>
                  <td className="p-4 text-center"><Cell val={row.agency} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 6. Quick Comparison Summary
function PricingComparison() {
  const summary = [
    { feature: "Articles / month", starter: "~10", pro: "~50", agency: "~150" },
    { feature: "AutoPublish campaigns", starter: "1", pro: "5", agency: "Unlimited" },
    { feature: "Team members", starter: "1", pro: "3", agency: "Unlimited" },
    { feature: "Projects", starter: "1", pro: "5", agency: "Unlimited" },
    { feature: "CMS connections", starter: "1", pro: "3", agency: "Unlimited" },
    { feature: "LLM Visibility Tracker", starter: false, pro: true, agency: true },
    { feature: "AI SEO Editor", starter: false, pro: true, agency: true },
    { feature: "Knowledge Bases", starter: false, pro: "3", agency: "Unlimited" },
    { feature: "White-label reports", starter: false, pro: true, agency: true },
    { feature: "API access", starter: "100 calls", pro: "1,000 calls", agency: "Unlimited" },
    { feature: "Sub-accounts", starter: false, pro: "1", agency: "Unlimited" },
    { feature: "Image storage", starter: "5 GB", pro: "25 GB", agency: "100 GB" },
    { feature: "Support response", starter: "48h", pro: "24h", agency: "4h" },
  ];

  function Cell({ val }: { val: string | boolean }) {
    if (val === true) return <Check className="w-4 h-4 text-blue-500 mx-auto" />;
    if (val === false) return <Minus className="w-4 h-4 text-mkt-muted mx-auto" />;
    return <span className="text-sm text-mkt-muted font-lato">{val}</span>;
  }

  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <h2 className="text-2xl font-semibold text-mkt-white mb-6 font-poppins">Quick comparison</h2>
      <div className="overflow-x-auto bg-mkt-surface border border-mkt-border rounded-2xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-mkt-surface2 border-b border-mkt-border">
            <tr>
              <th className="p-4 text-left font-semibold text-mkt-muted">Feature</th>
              <th className="p-4 text-center font-semibold text-mkt-muted">Starter</th>
              <th className="p-4 text-center font-semibold text-mkt-accent bg-mkt-accent-lite">Pro</th>
              <th className="p-4 text-center font-semibold text-mkt-muted">Agency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mkt-border">
            {summary.map((row) => (
              <tr key={row.feature} className="hover:bg-mkt-surface2 transition-colors">
                <td className="p-4 text-mkt-muted font-lato">{row.feature}</td>
                <td className="p-4 text-center"><Cell val={row.starter} /></td>
                <td className="p-4 text-center bg-mkt-accent-lite"><Cell val={row.pro} /></td>
                <td className="p-4 text-center"><Cell val={row.agency} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 7. Bespoke AI Content Service
function BespokeAIContentService() {
  const [open, setOpen] = useState(false);
  const FEATURES = [
    "Guaranteed 25% increase in organic traffic in 90 days — or you don't pay",
    "10–20 ready-to-publish, human-edited articles every month",
    "AI Search Optimisation (ChatGPT, Perplexity, Claude, Gemini, Grok)",
    "1 in-depth topic cluster per month (30-day content sprints)",
    "Full LLM Brand Visibility monitoring & reporting",
    "Internal linking & on-page SEO handled for you",
    "Monthly strategy call with a dedicated content strategist",
    "White-label SEO & LLM reports (Agency add-on)",
    "Backlink building available as add-on",
    "Agency plan access included during engagement",
  ];

  return (
    <section className="py-24 border-t border-mkt-border" style={{ background: "linear-gradient(135deg,#0f1117 0%,#13151e 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="relative bg-mkt-surface rounded-3xl shadow-xl overflow-hidden border border-mkt-border">
          <div className="px-6 py-3 text-center" style={{ background: "linear-gradient(to right,#4A42CC,#217CEB)" }}>
            <p className="text-white text-sm font-semibold font-lato">✨ Limited Cohort — Only 10 Companies Accepted per Month</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 p-8 md:p-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-mkt-accent bg-mkt-accent-lite border border-mkt-accent-border px-3 py-1.5 rounded-full mb-5">Done-for-you service</div>
              <h2 className="text-3xl md:text-4xl font-semibold font-poppins mb-4 leading-tight">
                <span style={{ backgroundImage: "linear-gradient(to right,#4A42CC,#217CEB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Bespoke AI Content</span>
                <br />
                <span className="text-mkt-white">Service</span>
              </h2>
              <p className="text-base text-mkt-muted font-lato mb-8 leading-relaxed">We run your entire content operation for you — research, writing, publishing, and LLM visibility — managed by human strategists on top of our AI platform.</p>
              <div className="mb-6">
                <p className="text-xs text-mkt-muted font-semibold uppercase tracking-widest mb-2">Starting from</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-medium tracking-tighter text-mkt-white font-poppins">$2,000</span>
                  <span className="text-lg text-mkt-muted mb-1 font-lato">/mo</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-8">
                <Check size={14} strokeWidth={3} /> 25% traffic growth in 90 days — guaranteed or you don't pay
              </div>
              <button className="w-full text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-90" style={{ background: "linear-gradient(to right,#4A42CC,#217CEB)" }}>
                Schedule Strategy Call
              </button>
              <a href="/bespoke" className="block w-full mt-4 text-center text-sm font-semibold font-lato hover:underline" style={{ color: "#4A42CC" }}>Learn more about the service →</a>
            </div>
            <div>
              <div className="hidden md:block space-y-4">
                {FEATURES.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="shrink-0 mt-0.5" size={18} strokeWidth={2.5} style={{ color: "#217CEB" }} />
                    <p className="text-neutral-700 font-lato text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="md:hidden mt-4">
                <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-sm font-semibold text-mkt-white font-lato py-2 border-b border-mkt-border">
                  What's included
                  <ChevronDown size={18} className={`text-mkt-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="mt-4 space-y-3">
                    {FEATURES.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="shrink-0 mt-0.5" size={18} strokeWidth={2.5} style={{ color: "#217CEB" }} />
                        <p className="text-neutral-700 font-lato text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 8. Testimonials
function Testimonials() {
  const testimonials = [
    { quote: "Infin8Content helped us increase our content output by 400% while maintaining quality. Our SEO rankings have never been better.", name: "Sarah Chen", role: "Head of Content @ TechFlow", metric: "+400% Output", avatar: "SC" },
    { quote: "The brand voice feature is a game-changer. Every article sounds like us, no matter who writes it.", name: "Marcus Rodriguez", role: "Marketing Director @ GrowthLabs", metric: "100% Brand Consistency", avatar: "MR" },
    { quote: "We went from 2 articles per week to 2 per day. Same team. Better results.", name: "Emma Thompson", role: "Founder @ ContentCo Agency", metric: "10x Faster", avatar: "ET" },
  ];

  return (
    <section className="bg-neutral-50 py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">Loved by Content Teams Worldwide</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">Join 10,000+ content creators who trust Infin8Content</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg text-neutral-700 leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-purple-500 border-3 border-white flex items-center justify-center text-white font-bold shadow-md">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-neutral-900">{t.name}</div>
                    <div className="text-sm text-neutral-600">{t.role}</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">{t.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 9. Pricing FAQ
function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "Will AI-generated content rank on Google?", a: "Yes. Google rewards high-quality, helpful content regardless of how it's produced. Infin8Content creates structured, factual, and SEO-optimized articles that follow Google's E-E-A-T guidelines. Every plan includes brand voice training so your content sounds authentically human — not generic AI." },
    { q: "What is the LLM Brand Visibility Tracker and which plans include it?", a: "The LLM Brand Visibility Tracker monitors how ChatGPT, Perplexity, Gemini, Claude, Grok, and Google AI Overviews mention and recommend your brand. It tracks share-of-voice, sentiment, citations, and competitor mentions. It's included in the Pro and Agency plans." },
    { q: "What are credits and how do they work?", a: "Credits are consumed each time you generate content, run the AI SEO Agent, or use other AI-powered features. Starter gets 1,000 credits/month (~10 full articles), Pro gets 2,000 (~50 articles), and Agency gets 8,000 (~150 articles)." },
    { q: "How does AutoPublish work?", a: "AutoPublish lets you set up a campaign that automatically generates and publishes SEO-optimized content to your CMS on a schedule you define. You connect a feed source, set your publishing frequency, and Infin8Content handles the rest." },
    { q: "Can I use this for multiple clients?", a: "Yes. Pro includes 1 sub-account and 5 projects. Agency includes unlimited sub-accounts, unlimited workspaces, a client portal, and white-label reports — built specifically for agencies." },
    { q: "What CMS platforms do you integrate with?", a: "We integrate natively with WordPress, Shopify, Ghost, Webflow, Wix, Squarespace, and Blogger. We also support Zapier, webhooks, and a public API (Agency plan)." },
    { q: "How does the brand voice feature work?", a: "Upload your style guide, sample articles, website URL, or brand documents. Our AI enters a learning phase to understand your tone, vocabulary, and content patterns — then applies them automatically." },
    { q: "How is Infin8Content different from ChatGPT?", a: "Infin8Content is a complete, end-to-end content operations system — not a text generator. ChatGPT gives you text. Infin8Content automates the full workflow: keyword research, brief generation, writing, images, links, CMS publishing, scheduling, LLM visibility tracking, and SEO fixes." },
    { q: "Do you offer a free trial?", a: "We offer a $1 trial for 3 days on Starter and Pro plans. This gives you full access to every feature in your plan — enough to publish your first articles and see results. Cancel any time with no questions asked." },
    { q: "What kind of support do you provide?", a: "Starter plans receive email support with a 48h response time. Pro plans get 24h response. Agency plans get a 4h response time plus live chat on Slack and access to strategy support." },
  ];

  return (
    <section className="bg-mkt-surface py-24 border-t border-mkt-border">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-mkt-accent mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-mkt-white font-poppins">Questions? We've got answers.</h2>
          <p className="text-base text-mkt-muted max-w-xl mx-auto mt-4 font-lato">Everything you need to know about Infin8Content pricing and features.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-mkt-border rounded-2xl overflow-hidden group hover:border-mkt-accent-border transition-all duration-200">
              <button className="w-full p-6 text-left font-semibold text-mkt-white flex items-center justify-between hover:text-mkt-accent transition-colors duration-200 bg-mkt-surface hover:bg-mkt-surface2 focus:outline-none" onClick={() => setOpenIndex(openIndex === idx ? null : idx)}>
                <span className="pr-4 text-sm md:text-base">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-mkt-accent transition-transform duration-300 shrink-0 ${openIndex === idx ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? "max-h-96" : "max-h-0"}`}>
                <div className="p-6 pt-0 bg-mkt-surface2 text-sm text-mkt-muted leading-relaxed font-lato border-t border-mkt-border">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 10. Final CTA
function FinalCTA() {
  return (
    <section className="bg-gradient-vibrant py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-300 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Scale Your Content? Get Started Today.</h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">Join 10,000+ content teams creating better content, faster.</p>
        <a href="/register" className="inline-block bg-white text-neutral-900 hover:scale-105 focus-ring text-lg px-8 py-4 shadow-xl mb-12 md:mb-14 font-bold rounded-lg">Get Started Now</a>
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="flex items-center gap-2 text-white/60 text-sm"><span className="text-base">💳</span><span>Secure payment via Stripe</span></div>
          <div className="flex items-center gap-2 text-white/60 text-sm"><span className="text-base">🔒</span><span>Cancel anytime</span></div>
          <div className="flex items-center gap-2 text-white/60 text-sm"><span className="text-base">⚡</span><span>Instant access</span></div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-400/30">
          <span className="text-base">🎁</span>
          <span className="text-sm font-medium">Annual plans save up to 33% • Switch or cancel anytime</span>
        </div>
      </div>
    </section>
  );
}

// 11. CTA Section
function CTASection() {
  return (
    <section className="bg-blue-600 py-16 text-center">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-poppins text-4xl font-bold text-white mb-4">Start building content that earns authority</h2>
        <p className="font-lato text-white/80 mb-8 text-lg max-w-xl mx-auto">One trial article included. No credit card required.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-lg font-bold font-lato text-base shadow-lg hover:shadow-xl transition-shadow">
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-6 py-3 rounded-lg font-bold font-lato text-base hover:bg-white/10 transition-colors">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

// 12. Sticky Upgrade Bar
function StickyUpgradeBar() {
  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-mkt-surface border border-mkt-border rounded-2xl px-6 py-3.5 shadow-xl z-50 backdrop-blur-sm">
      <div className="flex -space-x-2">
        {["JL", "MR", "AK"].map((i, idx) => (
          <div key={idx} className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-purple-500 border-2 border-mkt-surface flex items-center justify-center text-[9px] font-bold text-white">{i}</div>
        ))}
      </div>
      <span className="text-sm text-mkt-muted font-lato">Most teams choose <strong className="text-mkt-white font-semibold">Pro</strong></span>
      <div className="w-px h-5 bg-mkt-border" />
      <a href="/register" className="text-sm font-semibold text-white px-5 py-2 rounded-xl shadow-sm hover:opacity-90 hover:shadow-md transition-all" style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}>Upgrade to Pro</a>
      <button className="text-mkt-muted hover:text-mkt-text transition-colors text-lg leading-none">✕</button>
    </div>
  );
}

// 13. Mobile Sticky Upgrade Bar
function MobileStickyUpgradeBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-mkt-surface border-t border-mkt-border shadow-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1">
        <p className="text-xs font-semibold text-mkt-white">Most teams choose <span className="text-mkt-accent">Pro</span></p>
        <p className="text-[10px] text-mkt-muted font-lato">$1 trial · Cancel anytime</p>
      </div>
      <a href="/register" className="shrink-0 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}>Try Pro →</a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="bg-mkt-bg min-h-screen">
      <PricingHero billing={billing} setBilling={setBilling} />
      <PricingPlans billing={billing} />
      <TrafficProofStrip />
      <FeatureValueSection />
      <PricingComparisonRow />
      <PricingComparison />
      <BespokeAIContentService />
      <Testimonials />
      <PricingFAQ />
      <FinalCTA />
      <CTASection />
      <StickyUpgradeBar />
      <MobileStickyUpgradeBar />
    </div>
  );
}