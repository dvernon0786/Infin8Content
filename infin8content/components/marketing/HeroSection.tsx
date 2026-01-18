import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative py-32 px-6 text-white"
      style={{ backgroundColor: "var(--ui-charcoal)" }}
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">
          Publish search-ready content{" "}
          <span className="bg-brandGradient bg-clip-text text-transparent">
            at infinite scale
          </span>
        </h1>

        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          Infin8Content generates SEO-first articles that are ready to review,
          publish, or export — without fragmented workflows.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/register"
            className="px-6 py-3 rounded-md font-medium text-white bg-brandGradient"
          >
            Generate your first article
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 rounded-md font-medium border border-white/30 text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
