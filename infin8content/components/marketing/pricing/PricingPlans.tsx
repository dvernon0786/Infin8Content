"use client";

import { Check } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/config/plan-limits";
import { PRICING_PLANS } from "@/lib/config/pricing-plans";

type Props = {
  billing: "monthly" | "annual";
};

const plans = [
  {
    name: "Starter",
    monthly: PRICING_PLANS.starter.monthly,
    annual: PRICING_PLANS.starter.annual,
    savings: "20%",
    tagline: "Launch fast, learn faster.",
    cta: "Get Started",
    popular: false,
    features: [
      `${PLAN_LIMITS.article_generation.starter} AI articles`,
      `${PLAN_LIMITS.keyword_research.starter} keyword researches`,
      `${PLAN_LIMITS.cms_connection.starter} CMS connection`,
      "1 project",
      "1 team member",
      `${PLAN_LIMITS.image_storage_gb.starter} GB image storage`,
      `${PLAN_LIMITS.api_calls.starter} API calls / month`,
      "48h support response",
    ],
  },
  {
    name: "Pro",
    monthly: PRICING_PLANS.pro.monthly,
    annual: PRICING_PLANS.pro.annual,
    savings: "19%",
    tagline: "Grow with confidence.",
    cta: "Get Started",
    popular: true,
    features: [
      `${PLAN_LIMITS.article_generation.pro} AI articles`,
      `${PLAN_LIMITS.keyword_research.pro} keyword researches`,
      `${PLAN_LIMITS.cms_connection.pro} CMS connections`,
      "5 projects",
      "3 team members",
      `${PLAN_LIMITS.image_storage_gb.pro} GB image storage`,
      `${PLAN_LIMITS.api_calls.pro} API calls / month`,
      "Revenue attribution",
      "Multi-store management",
      "24h support response",
    ],
  },
  {
    name: "Agency",
    monthly: PRICING_PLANS.agency.monthly,
    annual: PRICING_PLANS.agency.annual,
    savings: "25%",
    tagline: "Tailored for scale & security.",
    cta: "Talk to Sales",
    popular: false,
    features: [
      `${PLAN_LIMITS.article_generation.agency} AI articles`,
      "Unlimited keyword research",
      "Unlimited CMS connections",
      "Unlimited projects",
      "Unlimited team members",
      `${PLAN_LIMITS.image_storage_gb.agency} GB image storage`,
      "Unlimited API calls",
      "White-label & custom domain",
      "Client portal",
      "Public API access",
      "4h support response",
      "99.9% uptime SLA",
    ],
  },
];

export default function PricingPlans({ billing }: Props) {
  return (
    <section
      id="pricing-cards"
      className="sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">
        {plans.map((plan) => {
          const currentPrice = billing === "monthly" ? plan.monthly : plan.annual;
          const articleLimit = plan.name === "Starter" ? PLAN_LIMITS.article_generation.starter : PLAN_LIMITS.article_generation.pro;

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-8 transition-all duration-300 ${plan.popular ? "border-blue-500 shadow-xl scale-105 z-10" : "border-neutral-200"}`}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-6 text-xs font-semibold text-white px-3 py-1 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right,#217CEB,#4A42CC)",
                  }}
                >
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-medium text-neutral-900 font-poppins">
                {plan.name}
              </h3>

              {plan.name === "Starter" && (
                <p className="text-xs text-neutral-500 mt-2">
                  Best for testing AI SEO workflows
                </p>
              )}

              {plan.name === "Pro" && (
                <p className="text-xs text-neutral-500 mt-2">
                  Best for growing SEO teams
                </p>
              )}

              {plan.name === "Agency" && (
                <p className="text-xs text-neutral-500 mt-2">
                  Best for agencies & large sites
                </p>
              )}

              <p className="text-sm text-neutral-600 mt-2 font-lato">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-medium tracking-tighter text-neutral-900">
                  ${currentPrice}
                </span>
                <span className="text-sm text-neutral-500 mb-1">
                  {billing === "monthly" ? "/mo" : "/mo billed annually"}
                </span>
              </div>

              {/* Cost-Per-Article Value Anchor */}
              {plan.name !== "Agency" && (
                <p className="text-xs text-neutral-500 mt-2">
                  At only ${(currentPrice / articleLimit).toFixed(2)} per article
                </p>
              )}

              {/* Pro Plan Value Message */}
              {plan.popular && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  Best value for growing teams
                </p>
              )}

              {billing === "annual" && (
                <p className="text-xs text-blue-600 mt-1">
                  Save {plan.savings} annually
                </p>
              )}

              <ul className="mt-8 space-y-3 text-sm text-neutral-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <a
                  href={plan.name === "Agency" ? "/contact" : "/register"}
                  className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(to right,#217CEB,#4A42CC)",
                  }}
                >
                  {plan.cta}
                </a>
                <p className="text-[10px] text-neutral-500 mt-2 text-center uppercase tracking-widest font-bold">
                  $1 trial • Cancel anytime
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trial Message */}
      <div className="mt-16 text-center">
        <p className="text-sm text-neutral-600 font-medium bg-white px-6 py-3 rounded-full inline-block border border-neutral-200 shadow-sm">
          $1 trial for 3 days • Cancel anytime
        </p>
      </div>
    </section>
  );
}
