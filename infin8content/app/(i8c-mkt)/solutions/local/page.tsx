import { CtaSection } from "@/components/MktLayout";
import { MktHero, SectionLabel, SectionTitle, FeatureRow, FeatCard } from "@/components/MktUI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local SEO Content Software for Local Businesses | Infin8Content",
  description:
    "Rank your local business higher in search engines and get more clients with AI-powered local SEO content tailored for your area.",
};

const reasons = [
  { icon: "📍", title: "Rank Higher", body: "Capture high-intent local customers by ranking at the top of search results for your area and service keywords." },
  { icon: "🧲", title: "Attract More Clients", body: "Through high-quality, SEO-optimized articles, Infin8Content builds organic search rankings, consistently bringing in new clients." },
  { icon: "⏱️", title: "Save Time and Focus", body: "Infin8Content automates content creation so you can focus on your business while your website acquires new clients 24/7." },
];

const keyBenefits = [
  { icon: "📍", title: "Capture Local Leads", body: "Infin8Content creates content that targets locally relevant keywords, driving clients searching for services in your area." },
  { icon: "🏆", title: "Outpace Competitors", body: "Position your business as the top choice locally with consistent, high-quality content that outranks the competition." },
  { icon: "📣", title: "Boost Word-of-Mouth", body: "As clients find value in your articles, they recommend your services — increasing local referrals and brand recognition." },
  { icon: "🎓", title: "Be the Expert", body: "Consistently publish valuable articles that address common questions and position your business as the go-to local authority." },
];

const features = [
  {
    tag: "🤖 AutoPublish",
    title: "Effortless Marketing on Autopilot",
    body: "With Infin8Content's AutoPublish, articles are created, published to your site, and automatically shared across your social media channels — without any manual work from you.",
    bullets: [
      "Set your schedule and forget it — runs 24/7",
      "Auto-share to social media on every publish",
      "Target local keywords automatically",
      "Google fast-indexing to rank pages sooner",
    ],
    icon: "🤖",
    reverse: false,
  },
  {
    tag: "📞 Custom CTAs",
    title: "Custom CTA Integration for Client Conversion",
    body: "Each article includes customized calls-to-action that lead readers to your contact forms, booking pages, or service inquiry pages — converting content readers into paying clients.",
    bullets: [
      "Book a call, contact form, or inquiry page CTAs",
      "Customized per service type and location",
      "Embedded naturally within content flow",
      "Track conversions from organic traffic",
    ],
    reverse: true,
    icon: "📞",
  },
  {
    tag: "🌍 Local Targeting",
    title: "Hyper-Local Geo-Targeting",
    body: "Generate content that targets your specific city, neighborhood, or service area. Infin8Content writes for local search intent — not generic national keywords.",
    bullets: [
      "City and neighborhood-level targeting",
      "Service area keyword optimization",
      "150+ languages for multicultural markets",
      "Google Maps citation building support",
    ],
    icon: "🌍",
    reverse: false,
  },
];

export default function LocalPage() {
  return (
    <>
      <MktHero
        eyebrow="📍 For Local Businesses"
        heading="Get More Clients with our"
        headingAccent="Local SEO-Tailored Software"
        sub="Rank your local business higher in search engines and get more clients with AI-powered content tailored for local SEO."
        cta="Get Started Free"
        perks={["Hyper-local targeting", "Auto social sharing", "Cancel anytime"]}
      />

      {/* Why local businesses need it */}
      <section className="py-20 bg-linear-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-12">
            <SectionLabel>💡 Why It Matters</SectionLabel>
            <SectionTitle center>Why Local Businesses Need Infin8Content</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-225 mx-auto">
            {reasons.map((r) => (
              <div key={r.title} className="bg-mkt-surface border border-white/7 rounded-[14px] p-7 text-center hover:border-mkt-accent-border transition-all">
                <div className="text-[36px] mb-4">{r.icon}</div>
                <h4 className="font-display text-[15px] font-semibold text-white mb-2">{r.title}</h4>
                <p className="text-[13.5px] text-mkt-muted leading-[1.6]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key benefits grid */}
      <section className="py-20">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>⚡ Key Benefits</SectionLabel>
            <SectionTitle center>Built for rapid local growth</SectionTitle>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/7 border border-white/7 rounded-[14px] overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {keyBenefits.map((f) => <FeatCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Feature rows */}
      <section className="py-10">
        <div className="container mx-auto px-7">
          {features.map((f) => (
            <FeatureRow
              key={f.title}
              tag={f.tag}
              title={f.title}
              body={f.body}
              bullets={f.bullets}
              reverse={f.reverse}
              icon={f.icon}
              linkLabel={`Learn about ${f.title.split(" ").slice(0, 2).join(" ")}`}
            />
          ))}
        </div>
      </section>

      <CtaSection
        heading={"Dominate local search.\nGet more clients."}
        sub="Get started and see why local businesses trust Infin8Content."
        btnLabel="Start Free Trial"
        perks={["Cancel anytime", "Hyper-local targeting", "Auto publishing"]}
      />
    </>
  );
}
