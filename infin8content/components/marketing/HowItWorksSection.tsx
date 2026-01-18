export default function HowItWorksSection() {
  return (
    <section className="relative bg-lightGray pt-20 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Start with a keyword",
              text: "Define the search intent you want to capture.",
            },
            {
              step: "02",
              title: "Generate in real time",
              text: "Structured, SEO-aligned content is created automatically.",
            },
            {
              step: "03",
              title: "Publish or export",
              text: "Review, edit, and deploy content where you need it.",
            },
          ].map((item) => (
            <div key={item.step} className="space-y-4">
              <div className="text-xl font-semibold bg-brandGradient bg-clip-text text-transparent">
                {item.step}
              </div>
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="text-[var(--text-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
