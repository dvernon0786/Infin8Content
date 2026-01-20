export default function StickyUpgradeBar() {
  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-xl px-6 py-3 shadow-lg z-50">
      <span className="text-sm text-neutral-700 mr-4">
        Most teams choose <strong>Pro</strong>
      </span>
      <a
        href="/register"
        className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
        style={{
          background: "linear-gradient(to right,#217CEB,#4A42CC)",
        }}
      >
        Upgrade to Pro
      </a>
    </div>
  );
}
