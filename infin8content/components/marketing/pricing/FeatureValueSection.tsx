"use client";

import { Check } from "lucide-react";

// Feature categories matching all Infin8Content product pages
const categories = [
  {
    label: "AI Writing",
    color: "text-blue-600",
    bg: "bg-blue-50",
    features: [
      "AI Content Writer (150+ languages)",
      "AI SEO Editor with custom prompts",
      "News Writer",
      "Video to Blog Post",
      "Custom content templates",
      "Brand voice training",
      "Extensive article formatting",
      "Featured & in-article image generation",
      "YouTube video embeds",
      "Table of contents generation",
    ],
  },
  {
    label: "Automation",
    color: "text-purple-600",
    bg: "bg-purple-50",
    features: [
      "AutoPublish (set-and-forget campaigns)",
      "RSS / keyword / news feed ingestion",
      "Auto-social posting on publish",
      "AI SEO Agent (autopilot fixes)",
      "Schema markup injection",
      "Meta title & description optimization",
      "Image alt text automation",
      "Internal linking automation",
      "Broken link detection & repair",
      "Google fast-indexing on publish",
    ],
  },
  {
    label: "LLM & AI Visibility",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    features: [
      "LLM Brand Visibility Tracker",
      "ChatGPT mention monitoring",
      "Perplexity citation tracking",
      "Gemini, Claude & Grok coverage",
      "Google AI Overviews tracking",
      "Share-of-voice vs competitors",
      "Sentiment analysis (pos/neg/neutral)",
      "Historical visibility trends",
      "Competitor benchmarking",
      "White-label LLM reports",
    ],
  },
  {
    label: "SEO & Research",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    features: [
      "Keyword research & clustering",
      "Auto keyword research on publish",
      "Internal & external link suggestions",
      "SEO score per article",
      "White-label SEO reports",
      "Canonical tag management",
      "Structured data (FAQ, How-To schema)",
      "Heading structure optimization",
      "Smart 301/302 redirects",
      "Duplicate content prevention",
    ],
  },
  {
    label: "Knowledge Base",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    features: [
      "Upload websites, docs, PDFs",
      "Brand voice learning phase",
      "Context-aware article generation",
      "Per-client knowledge isolation",
      "Auto-apply to new content",
    ],
  },
  {
    label: "Publishing & Integrations",
    color: "text-orange-600",
    bg: "bg-orange-50",
    features: [
      "WordPress one-click publish",
      "Shopify blog integration",
      "Ghost, Webflow, Wix, Squarespace",
      "Blogger & custom webhooks",
      "Zapier integration",
      "Public API (Agency)",
      "Bulk article generation & export",
      "Draft-to-publish workflow",
      "Multi-site management",
      "Auto-translate (150+ languages)",
    ],
  },
  {
    label: "Teams & Agency",
    color: "text-rose-600",
    bg: "bg-rose-50",
    features: [
      "Multi-project management",
      "Team member roles",
      "Sub-accounts per client",
      "Client portal (Agency)",
      "White-label & custom domain",
      "Unlimited workspaces",
      "Approval workflow stages",
      "Content versioning",
    ],
  },
  {
    label: "Analytics & Reporting",
    color: "text-amber-600",
    bg: "bg-amber-50",
    features: [
      "Content performance dashboard",
      "Organic traffic tracking",
      "Keyword ranking insights",
      "AI citation & mention reports",
      "White-label client reports",
      "Scheduled report delivery",
    ],
  },
] as const;

export default function FeatureValueSection() {
  return (
    <section className="bg-mkt-surface py-24 border-t border-mkt-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-mkt-accent mb-3">
            Everything included
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-mkt-white font-poppins">
            The most complete AI content platform
          </h2>
          <p className="mt-4 text-lg text-mkt-muted font-lato max-w-2xl mx-auto">
            Every plan includes the full writing stack. Higher plans unlock LLM
            tracking, white-labelling, and agency-scale automation.
          </p>
        </div>

        {/* Feature category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="rounded-2xl border border-mkt-border bg-mkt-surface2 p-6 hover:border-mkt-accent-border transition-all duration-200"
            >
              {/* Category label */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2 h-2 rounded-full ${cat.bg.replace("bg-", "bg-").replace("50", "500")}`} />
                <p className={`text-xs font-bold uppercase tracking-widest ${cat.color}`}>
                  {cat.label}
                </p>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5">
                {cat.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div
                      className={`shrink-0 w-4 h-4 rounded-full ${cat.bg} flex items-center justify-center mt-0.5`}
                    >
                      <Check className={`w-2.5 h-2.5 ${cat.color}`} />
                    </div>
                    <span className="text-sm text-mkt-muted font-lato leading-snug">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-mkt-muted font-lato">
            New features ship weekly.{" "}
            <a href="/resources/learn" className="text-mkt-accent font-medium hover:underline">
              See what&apos;s new →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
