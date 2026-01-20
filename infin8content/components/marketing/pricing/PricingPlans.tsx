"use client";

import { Check } from "lucide-react";

type Props = {
  billing: "monthly" | "annual";
};

const plans = [
  {
    name: "Starter",
    monthly: 89,
    annual: 708,
    savings: "34%",
    tagline: "Launch fast, learn faster.",
    cta: "Get Started",
    popular: false,
    features: [
      "10 articles / month",
      "50 keyword researches",
      "1 CMS connection",
      "1 project",
      "1 team member",
      "5 GB image storage",
      "100 API calls / month",
      "48h support response",
    ],
  },
  {
    name: "Pro",
    monthly: 220,
    annual: 2100,
    savings: "20%",
    tagline: "Grow with confidence.",
    cta: "Get Started",
    popular: true,
    features: [
      "50 articles / month",
      "500 keyword researches",
      "3 CMS connections",
      "5 projects",
      "3 team members",
      "25 GB image storage",
      "1,000 API calls / month",
      "Revenue attribution",
      "Multi-store management",
      "24h support response",
    ],
  },
  {
    name: "Agency",
    monthly: 399,
    annual: 3588,
    savings: "25%",
    tagline: "Tailored for scale & security.",
    cta: "Talk to Sales",
    popular: false,
    features: [
      "150 articles / month",
      "Unlimited keyword research",
      "Unlimited CMS connections",
      "Unlimited projects",
      "Unlimited team members",
      "100 GB image storage",
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-white p-8 transition ${
              plan.popular
                ? "border-blue-500 shadow-lg"
                : "border-neutral-200"
            }`}
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

            <p className="text-sm text-neutral-600 mt-1 font-lato">
              {plan.tagline}
            </p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-medium tracking-tighter text-neutral-900">
                ${billing === "monthly" ? plan.monthly : plan.annual}
              </span>
              <span className="text-sm text-neutral-500 mb-1">
                /{billing === "monthly" ? "mo" : "year"}
              </span>
            </div>

            {billing === "annual" && (
              <p className="text-xs text-blue-600 mt-1">
                Save {plan.savings} annually
              </p>
            )}

            <ul className="mt-6 space-y-3 text-sm text-neutral-700">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-blue-500 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={plan.name === "Agency" ? "/contact" : "/register"}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{
                background:
                  "linear-gradient(to right,#217CEB,#4A42CC)",
              }}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
