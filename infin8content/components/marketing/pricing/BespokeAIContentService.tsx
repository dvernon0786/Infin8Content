"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function BespokeAIContentService() {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-gradient-mesh py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#4A42CC] to-[#217CEB] px-6 py-3 text-center">
            <p className="text-white text-sm font-semibold font-lato">
              ✨ Limited Launch Offer — Only Accepting 10 Companies
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 p-8 md:p-12">

            {/* LEFT — CTA FIRST */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-4 bg-gradient-to-r from-[#4A42CC] to-[#217CEB] bg-clip-text text-transparent">
                Bespoke AI Content Service
              </h2>

              <p className="text-lg text-neutral-600 font-lato mb-8">
                Premium AI content execution, managed by human strategists.
              </p>

              <div className="mb-8">
                <p className="text-sm text-neutral-500 font-semibold mb-2">
                  Starting from
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-bold text-neutral-900 font-poppins">
                    $2,000
                  </span>
                  <span className="text-xl text-neutral-500 mb-2 font-lato">
                    /mo
                  </span>
                </div>
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => {
                  // replace with your Calendly modal trigger
                  window.dispatchEvent(new Event("open-calendly"));
                }}
                className="w-full bg-gradient-to-r from-[#4A42CC] to-[#217CEB] text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition"
              >
                Schedule Strategy Call
              </button>

              <button
                className="w-full mt-4 text-[#4A42CC] font-semibold font-lato hover:underline"
              >
                Learn more →
              </button>
            </div>

            {/* RIGHT — FEATURES */}
            <div>
              {/* Desktop */}
              <div className="hidden md:block space-y-4">
                {FEATURES.map((item, i) => (
                  <Feature key={i} text={item} />
                ))}
              </div>

              {/* Mobile — Collapsible */}
              <div className="md:hidden mt-8">
                <button
                  onClick={() => setOpen(!open)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-neutral-700 font-lato"
                >
                  What's included
                  <ChevronDown
                    className={`transition ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="mt-4 space-y-3">
                    {FEATURES.map((item, i) => (
                      <Feature key={i} text={item} />
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

const FEATURES = [
  "Guaranteed 25% increase in traffic in 90 days (or you don't pay)",
  "AI Search Optimization (ChatGPT, Perplexity, Claude, Gemini)",
  "Enterprise plan access included",
  "10–20 ready-to-publish articles every month",
  "1 in-depth topic cluster per month (30-day sprints)",
  "Human editors for tone, brand & accuracy",
  "Backlink building available as an add-on"
];

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <Check className="text-[#217CEB] mt-1" size={20} strokeWidth={2.5} />
      <p className="text-neutral-700 font-lato leading-relaxed">{text}</p>
    </div>
  );
}
