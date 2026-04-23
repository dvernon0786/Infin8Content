"use client";

// TrafficProofStrip — animated horizontal scroll of social proof stats
// Insert between PricingPlans and FeatureValueSection

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

// Duplicate for seamless loop
const doubled = [...stats, ...stats];

export default function TrafficProofStrip() {
  return (
    <section className="py-12 overflow-hidden border-y border-mkt-border bg-mkt-surface">
      <div className="mb-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-mkt-muted2">
          Real results from real teams
        </p>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-mkt-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-mkt-surface to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-4"
          style={{
            animation: "marquee 28s linear infinite",
            width: "max-content",
          }}
        >
          {doubled.map((s, i) => (
            <div
              key={i}
              className="shrink-0 flex items-center gap-3 bg-mkt-surface2 border border-mkt-border rounded-xl px-5 py-3"
            >
              <span className="text-sm font-bold text-mkt-white font-poppins">
                {s.label}
              </span>
              <span className="text-xs text-mkt-muted font-lato">{s.sub}</span>
              <span className="text-mkt-green text-xs font-bold">↑</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
