export default function ProductVisualSection() {
  return (
    <section className="relative bg-lightGray pt-20 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="relative max-w-4xl mx-auto">
          <div className="rounded-xl bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <img
              src="/placeholder-dashboard.svg"
              alt="Product dashboard"
              width={1200}
              height={700}
              className="rounded-lg w-full h-auto"
            />
          </div>
        </div>

        <p className="text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
          A unified workspace for generating, reviewing, and managing
          SEO-ready content.
        </p>
      </div>
    </section>
  );
}
