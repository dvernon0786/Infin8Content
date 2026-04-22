"use client";

export default function NewsletterForm() {
  return (
    <form
      className="flex gap-3 max-w-105 mx-auto"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 bg-[#0f1117] border border-white/7 rounded-md px-4 py-3 text-small text-[#e8eaf2] placeholder:text-[#4a4f68] outline-none focus:border-[rgba(79,110,247,0.5)] transition-colors"
      />
      <button
        type="submit"
        className="shrink-0 bg-[#4f6ef7] text-white font-semibold px-5 py-3 rounded-md text-small hover:bg-[#3d5df5] transition-all"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Subscribe
      </button>
    </form>
  );
}
