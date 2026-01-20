export default function MobileStickyUpgradeBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            Most teams choose <span className="text-blue-600">Pro</span>
          </p>
          <p className="text-xs text-neutral-500">Scale with confidence</p>
        </div>
        <a
          href="/register"
          className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
          style={{
            background: "linear-gradient(to right,#217CEB,#4A42CC)",
          }}
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
