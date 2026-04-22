// StickyUpgradeBar.tsx — desktop floating bar
"use client";

export default function StickyUpgradeBar() {
  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-white border border-neutral-200 rounded-2xl px-6 py-3.5 shadow-xl shadow-neutral-200/60 z-50 backdrop-blur-sm">
      {/* Social proof */}
      <div className="flex -space-x-2">
        {["JL", "MR", "AK"].map((i, idx) => (
          <div
            key={idx}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
          >
            {i}
          </div>
        ))}
      </div>
      <span className="text-sm text-neutral-600 font-lato">
        Most teams choose{" "}
        <strong className="text-neutral-900 font-semibold">Pro</strong>
      </span>
      <div className="w-px h-5 bg-neutral-200" />
      <a
        href="/register"
        className="text-sm font-semibold text-white px-5 py-2 rounded-xl shadow-sm hover:opacity-90 hover:shadow-md transition-all"
        style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
      >
        Upgrade to Pro
      </a>
      <button className="text-neutral-400 hover:text-neutral-600 transition-colors text-lg leading-none">
        ✕
      </button>
    </div>
  );
}
