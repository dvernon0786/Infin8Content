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
        className="flex-1 bg-mkt-surface border border-white/7 rounded-md px-4 py-3 text-small text-mkt-text placeholder:text-mkt-muted2 outline-none focus:border-mkt-accent transition-colors"
      />
      <button
        type="submit"
        className="shrink-0 bg-mkt-accent text-white font-semibold px-5 py-3 rounded-md text-small hover:bg-mkt-accent-hover transition-all font-display"
      >
        Subscribe
      </button>
    </form>
  );
}
