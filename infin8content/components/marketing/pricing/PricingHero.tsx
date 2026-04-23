"use client";

import { Dispatch, SetStateAction } from "react";

type Props = {
  billing: "monthly" | "annual";
  setBilling: Dispatch<SetStateAction<"monthly" | "annual">>;
};

export default function PricingHero({ billing, setBilling }: Props) {
  return (
    <section className="sm:px-6 lg:px-8 max-w-7xl mx-auto pt-20 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">

        {/* Left — heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-mkt-accent">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-mkt-white mt-3 font-poppins leading-tight">
            Simple pricing<br />that grows with you
          </h1>
          <p className="text-mkt-muted mt-4 max-w-xl font-lato text-base leading-relaxed">
            Choose a plan that fits today. Upgrade anytime as you scale — all
            plans include every core feature.
          </p>

          {/* Launch badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-mkt-accent-border bg-mkt-accent-lite px-4 py-2 text-sm text-mkt-accent font-medium">
            <span>✨</span>
            <span>
              Launch Offer — First 100 users lock lifetime pricing
            </span>
          </div>
        </div>

        {/* Right — billing toggle */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <p className="text-xs text-mkt-muted font-semibold uppercase tracking-widest">
            Billing cycle
          </p>
          <div className="relative inline-flex rounded-xl border border-mkt-border bg-mkt-surface p-1 shadow-sm">
            {(["monthly", "annual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBilling(mode)}
                className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  billing === mode
                    ? "text-white shadow-md"
                    : "text-mkt-muted hover:text-mkt-white"
                }`}
                style={
                  billing === mode
                    ? { background: "linear-gradient(to right,#217CEB,#4A42CC)" }
                    : {}
                }
              >
                {mode === "monthly" ? "Monthly" : "Annually"}
                {mode === "annual" && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      billing === "annual"
                        ? "bg-white/20 text-white"
                        : "bg-mkt-green-lite text-mkt-green"
                    }`}
                  >
                    Save 40%
                  </span>
                )}
              </button>
            ))}
          </div>
          {billing === "annual" && (
            <p className="text-xs text-mkt-green font-medium animate-fade-up">
              🎉 You save up to $1,200/year on Agency
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
