"use client";

import { Check, Zap } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/config/plan-limits";
import { PRICING_PLANS } from "@/lib/config/pricing-plans";

type Billing = "monthly" | "annual";
type Props = { billing: Billing };

// ── Plan definitions ─────────────────────────────────────────
const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    tagline: "Launch fast, learn faster.",
    sub: "Best for solo creators & small blogs",
    cta: "Start today",
    ctaHref: "/register",
    popular: false,
    color: "border-neutral-200",
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
    notIncluded: [
      "LLM Brand Visibility Tracker",
      "AI SEO Editor",
      "Knowledge Bases",
      "White-label SEO reports",
      "Sub-accounts",
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    tagline: "Grow with confidence.",
    sub: "Best for growing SEO teams",
    cta: "Start today",
    ctaHref: "/register",
    popular: true,
    color: "border-blue-500",
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
    color: "border-neutral-200",
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
] as const;

// ── Helpers ──────────────────────────────────────────────────
function CheckRow({
  label,
  note,
  badge,
}: {
  label: string;
  note?: string;
  badge?: string;
}) {
  const isSeparator = label.includes("Everything in") || label.includes("plus:");
  if (isSeparator) {
    return (
      <li className="pt-2 pb-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          {label}
        </p>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2.5">
      <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
      <span className="text-sm text-neutral-700 font-lato leading-snug">
        {label}
        {note && (
          <span className="ml-1 text-neutral-400 text-xs">({note})</span>
        )}
        {badge && (
          <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider bg-linear-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </span>
    </li>
  );
}

export default function PricingPlans({ billing }: Props) {
  return (
    <section
      id="pricing-cards"
      className="sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-start">
        {plans.map((plan) => {
          const price =
            billing === "monthly"
              ? PRICING_PLANS[plan.key].monthly
              : PRICING_PLANS[plan.key].annual;
          const monthlyPrice = PRICING_PLANS[plan.key].monthly;
          const annualSavings =
            billing === "annual"
              ? (monthlyPrice - price) * 12
              : 0;
          const articleLimit = PLAN_LIMITS.article_generation[plan.key];
          const costPerArticle =
            typeof articleLimit === "number"
              ? (price / articleLimit).toFixed(2)
              : null;

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border bg-mkt-surface transition-all duration-300 ${
                plan.popular
                  ? "border-mkt-accent shadow-xl md:scale-[1.03] z-10"
                  : "border-mkt-border"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-4 py-1.5 rounded-full shadow-md whitespace-nowrap"
                  style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
                >
                  ⚡ Most Popular
                </div>
              )}

              {/* Card header */}
              <div
                className={`p-8 pb-6 ${
                  plan.popular
                    ? "border-b border-mkt-accent-border"
                    : "border-b border-mkt-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-mkt-white font-poppins">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-mkt-muted mt-1">{plan.sub}</p>
                  </div>
                  {plan.popular && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-mkt-accent bg-mkt-accent-lite border border-mkt-accent-border px-2 py-1 rounded-lg">
                      <Zap className="w-3 h-3" /> Best value
                    </div>
                  )}
                </div>

                <p className="text-sm text-mkt-muted mt-2 font-lato">
                  {plan.tagline}
                </p>

                {/* Price */}
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-medium tracking-tighter text-mkt-white font-poppins">
                    ${price}
                  </span>
                  <span className="text-sm text-mkt-muted mb-1.5">
                    {billing === "monthly" ? "/mo" : "/mo"}
                  </span>
                </div>

                {/* Billing clarifiers */}
                {billing === "annual" && (
                  <p className="text-xs text-mkt-muted2 mt-0.5">
                    billed annually
                  </p>
                )}
                {costPerArticle && (
                  <p className="text-xs text-mkt-muted mt-2">
                    Only{" "}
                    <strong className="text-mkt-white">
                      ${costPerArticle}
                    </strong>{" "}
                    per article
                  </p>
                )}
                {billing === "annual" && annualSavings > 0 && (
                  <p className="text-xs text-mkt-green font-semibold mt-1">
                    You save ${annualSavings.toLocaleString()}/year
                  </p>
                )}
                {plan.popular && (
                  <p className="text-xs text-mkt-green font-semibold mt-1">
                    Best value for growing teams
                  </p>
                )}

                {/* CTA */}
                <div className="mt-6">
                  <a
                    href={plan.ctaHref}
                    className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all duration-200"
                    style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
                  >
                    {plan.cta}
                  </a>
                  <p className="text-[10px] text-mkt-muted2 mt-2 text-center uppercase tracking-widest font-bold">
                    {plan.key === "agency"
                      ? "Custom pricing · No lock-in"
                      : "$1 trial · Cancel anytime"}
                  </p>
                </div>
              </div>

              {/* Feature list */}
              <div className="p-8 pt-6">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <CheckRow key={f.label} {...f} />
                  ))}
                </ul>

                {/* Not included (Starter only) */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-mkt-border">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-mkt-muted2 mb-3">
                      Not included
                    </p>
                    <ul className="space-y-2">
                      {plan.notIncluded.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-mkt-muted2 font-lato"
                        >
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

      {/* Trial reminder */}
      <div className="mt-12 text-center">
        <p className="text-sm text-mkt-muted font-medium bg-mkt-surface px-6 py-3 rounded-full inline-block border border-mkt-border shadow-sm">
          🔒 $1 trial for 3 days on Starter &amp; Pro · Cancel anytime · No questions asked
        </p>
      </div>
    </section>
  );
}
