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
        <div>
          <p className="text-sm text-neutral-600">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-neutral-900 mt-2 font-poppins">
            Simple pricing<br />that grows with you
          </h1>
          <p className="text-neutral-600 mt-4 max-w-2xl font-lato">
            Choose a plan that fits today. Upgrade anytime as you scale.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1">
          {["monthly", "annual"].map((mode) => (
            <button
              key={mode}
              onClick={() => setBilling(mode as any)}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition ${
                billing === mode
                  ? "text-white shadow"
                  : "text-neutral-600"
              }`}
              style={{
                background:
                  billing === mode
                    ? "linear-gradient(to right,#217CEB,#4A42CC)"
                    : "transparent",
              }}
            >
              {mode === "monthly" ? "Monthly" : "Annually"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
