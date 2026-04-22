import { CtaSection } from "@/components/MktLayout";
import { MktHero, SectionLabel, SectionTitle, FeatureRow, StepCard, QuoteCard, FeatCard } from "@/components/MktUI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Content Tool for SaaS — Rank on Google & Get Cited by ChatGPT | Infin8Content",
  description:
    "Automatically publish pages targeting high-buying-intent keywords that rank on Google and get cited by LLMs. Built for SaaS teams.",
};

const steps = [
  {
    num: 1,
    icon: "🎯",
    title: "Dominate Google Rankings",
    body: "Rank your site #1 on Google for high buying-intent keywords — comparison pages, alternative pages, informational pages.",
  },
  {
    num: 2,
    icon: "💰",
    title: "Turn Traffic into Subscribers",
    body: "Convert the organic traffic into paying SaaS subscribers with bottom-of-funnel content and embedded CTAs.",
  },
];

const pageTypes = [
  {
    icon: "📰",
    title: "Informational Pages",
    body: "Create content that's better than what competitors provide for their own products. Produce more valuable and insightful content than what your competitor offers for their own brand.",
  },
  {
    icon: "⚖️",
    title: "Comparison Pages",
    body: "Optimize for competitor names and product details. Cover what each competitor offers, then provide a direct comparison to highlight strengths and differences.",
  },
  {
    icon: "🔄",
    title: "Alternative Pages",
    body: "Go beyond a simple alternatives list. Explain what the competitor's product is in depth, then showcase your solution as the top alternative.",
  },
];

const summaryPoints = [
  { icon: "📄", title: "Creates SaaS-SEO tailored pages", body: "Informational, comparison, and alternative pages targeting high-buying-intent keywords." },
  { icon: "📈", title: "Ranks them on Google", body: "These pages rank by themselves due to low keyword competition and high relevance." },
  { icon: "💎", title: "Converts traffic into customers", body: "Higher conversion rates because of bottom-of-funnel content and smart keyword selection." },
];

const quotes = [
  {
    quote: `"It comes down to how easy it is to create content, and the <strong class='text-white'>impressive rankings</strong> we see with it."`,
    name: "Timo S.",
    role: "Agency Owner @ SpechtGmbH",
  },
  {
    quote: `"We're now able to <strong class='text-white'>rank our clients very quickly</strong> in just 1 or 2 months using Infin8Content."`,
    name: "Abhinav S.",
    role: "Agency Owner @ Interconnections",
  },
  {
    quote: `"The platform helps me quickly <strong class='text-white'>write draft articles from keywords</strong> and publishes them automatically."`,
    name: "Andrew B.",
    role: "Content Marketer",
  },
];

export default function SaaSPage() {
  return (
    <>
      <MktHero
        eyebrow="🚀 For SaaS Companies"
        heading="The Content Tool That Ranks Your SaaS on Google and Gets It"
        headingAccent="Cited by ChatGPT"
        sub="Automatically publish pages on your site that target high-buying-intent keywords — ranking on Google and getting cited by LLMs."
        cta="Get Started Free"
        perks={['"Ready to rank"', "Articles in 30 secs", "Plagiarism free"]}
      />

      {/* 2-step process */}
      <section className="py-20 bg-gradient-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-12">
            <SectionLabel>⚡ The Simple 2-Step Process</SectionLabel>
            <SectionTitle center>Rank higher, attract buyers,<br />turn visitors into subscribers</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-175 mx-auto">
            {steps.map((s) => <StepCard key={s.num} {...s} />)}
          </div>
        </div>
      </section>

      {/* Page type rows */}
      <section className="py-10">
        <div className="container mx-auto px-7">
          {pageTypes.map((p, i) => (
            <FeatureRow
              key={p.title}
              tag={`📄 Page Type ${i + 1}`}
              title={p.title}
              body={p.body}
              reverse={i % 2 !== 0}
              icon={p.icon}
              linkLabel={`Learn about ${p.title}`}
            />
          ))}
        </div>
      </section>

      {/* Summary */}
      <section className="py-20 bg-gradient-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>✦ To Sum Up</SectionLabel>
            <SectionTitle center>Infin8Content for SaaS</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {summaryPoints.map((p) => (
              <div key={p.title} className="bg-[#0f1117] border border-white/7 rounded-[14px] p-7 hover:border-[rgba(79,110,247,0.3)] transition-all">
                <div className="text-[28px] mb-4">{p.icon}</div>
                <h4 className="font-display text-[15px] font-semibold text-white mb-2" style={{ fontFamily: "Sora,sans-serif" }}>{p.title}</h4>
                <p className="text-[13.5px] text-[#7b8098] leading-[1.6]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced features 4-up */}
      <section className="py-20">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>⚙️ Advanced Features</SectionLabel>
            <SectionTitle center>Advanced SaaS SEO Tool Features</SectionTitle>
            <p className="text-body text-[#7b8098] max-w-130 mx-auto mt-2">Allowing you to do SEO better and faster for your SaaS.</p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/7 border border-white/7 rounded-[14px] overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🔍", title: "Advanced Keyword Analysis", body: "Uncover and prioritize high-value keywords using robust data methodologies to target proven, traffic-driving terms." },
              { icon: "🏆", title: "Competitor Benchmarking", body: "Compare your metrics with market leaders and get insights that help you outperform competitors and scale subscriptions." },
              { icon: "📊", title: "Intuitive Dashboard", body: "Real-time analytics and forecast trends give you actionable insights to improve rankings and convert traffic." },
              { icon: "🤖", title: "Automated Content Optimization", body: "On-page optimization for structure, readability, and keyword alignment — every article follows SEO best practices automatically." },
            ].map((f) => <FeatCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" style={{ background: "linear-gradient(180deg,transparent,#13151e 20%,#13151e 80%,transparent)" }}>
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>💬 Testimonials</SectionLabel>
            <SectionTitle center>Join 10,000+ business owners</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {quotes.map((q) => <QuoteCard key={q.name} {...q} />)}
          </div>
        </div>
      </section>

      <CtaSection heading={"Scale your SaaS.\nDo less content work."} perks={["Cancel anytime", "Articles in 30 secs", "Plagiarism free"]} />
    </>
  );
}
