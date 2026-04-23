// StickyUpgradeBar.tsx — desktop floating bar
"use client";

export default function StickyUpgradeBar() {
  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-mkt-surface border border-mkt-border rounded-2xl px-6 py-3.5 shadow-xl z-50 backdrop-blur-sm">
      {/* Social proof */}
      <div className="flex -space-x-2">
        {["JL", "MR", "AK"].map((i, idx) => (
          <div
            key={idx}
            className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-purple-500 border-2 border-mkt-surface flex items-center justify-center text-[9px] font-bold text-white"
          >
            {i}
          </div>
        ))}
      </div>
      <span className="text-sm text-mkt-muted font-lato">
        Most teams choose{" "}
        <strong className="text-mkt-white font-semibold">Pro</strong>
      </span>
      <div className="w-px h-5 bg-mkt-border" />
      <a
        href="/register"
        className="text-sm font-semibold text-white px-5 py-2 rounded-xl shadow-sm hover:opacity-90 hover:shadow-md transition-all"
        style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
      >
        Upgrade to Pro
      </a>
      <button className="text-mkt-muted hover:text-mkt-text transition-colors text-lg leading-none">
        ✕
      </button>
    </div>
  );
}
