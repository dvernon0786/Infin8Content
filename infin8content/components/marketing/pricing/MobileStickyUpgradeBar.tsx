"use client";

export default function MobileStickyUpgradeBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-mkt-surface border-t border-mkt-border shadow-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1">
        <p className="text-xs font-semibold text-mkt-white">
          Most teams choose <span className="text-mkt-accent">Pro</span>
        </p>
        <p className="text-[10px] text-mkt-muted font-lato">
          $1 trial · Cancel anytime
        </p>
      </div>
      <a
        href="/register"
        className="shrink-0 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
      >
        Try Pro →
      </a>
    </div>
  );
}
