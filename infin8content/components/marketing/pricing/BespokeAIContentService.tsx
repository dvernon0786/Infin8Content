"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

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

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <Check
        className="shrink-0 mt-0.5"
        size={18}
        strokeWidth={2.5}
        style={{ color: "#217CEB" }}
      />
      <p className="text-neutral-700 font-lato text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}

export default function BespokeAIContentService() {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="py-24 border-t border-neutral-100"
      style={{ background: "linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100">
          {/* Top Banner */}
          <div
            className="px-6 py-3 text-center"
            style={{
              background: "linear-gradient(to right,#4A42CC,#217CEB)",
            }}
          >
            <p className="text-white text-sm font-semibold font-lato">
              ✨ Limited Cohort — Only 10 Companies Accepted per Month
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 p-8 md:p-12">
            {/* LEFT — CTA */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
                Done-for-you service
              </div>

              <h2 className="text-3xl md:text-4xl font-semibold font-poppins mb-4 leading-tight">
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(to right,#4A42CC,#217CEB)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Bespoke AI Content
                </span>
                <br />
                <span className="text-neutral-900">Service</span>
              </h2>

              <p className="text-base text-neutral-600 font-lato mb-8 leading-relaxed">
                We run your entire content operation for you — research,
                writing, publishing, and LLM visibility — managed by human
                strategists on top of our AI platform.
              </p>

              {/* Price */}
              <div className="mb-6">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-widest mb-2">
                  Starting from
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-medium tracking-tighter text-neutral-900 font-poppins">
                    $2,000
                  </span>
                  <span className="text-lg text-neutral-500 mb-1 font-lato">
                    /mo
                  </span>
                </div>
              </div>

              {/* Guarantee pill */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-8">
                <Check size={14} strokeWidth={3} /> 25% traffic growth in 90
                days — guaranteed or you don&apos;t pay
              </div>

              {/* Primary CTA */}
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("open-calendly"))
                }
                className="w-full text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-90"
                style={{
                  background: "linear-gradient(to right,#4A42CC,#217CEB)",
                }}
              >
                Schedule Strategy Call
              </button>

              <a
                href="/bespoke"
                className="block w-full mt-4 text-center text-sm font-semibold font-lato hover:underline"
                style={{ color: "#4A42CC" }}
              >
                Learn more about the service →
              </a>
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
              <div className="md:hidden mt-4">
                <button
                  onClick={() => setOpen(!open)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-neutral-700 font-lato py-2 border-b border-neutral-100"
                >
                  What&apos;s included
                  <ChevronDown
                    size={18}
                    className={`text-neutral-400 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
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
