import { CtaSection } from "@/components/MktLayout";
import { MktHero, SectionLabel, SectionTitle, FeatureRow, FeatCard, BeforeAfter } from "@/components/MktUI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI eCommerce SEO Content Service — Drive More Sales | Infin8Content",
  description:
    "Create killer content that ranks. SEO-optimized articles driving targeted traffic to your product pages, converting like crazy.",
};

const benefits = [
  { icon: "📈", title: "Boost Traffic", body: "Infin8Content creates beautiful SEO-optimized articles that rank higher in search engines, bringing in more visitors without paid ads." },
  { icon: "⏱️", title: "Save Time", body: "Automatically generate tailored product content that links directly to your store, with no manual effort required from your team." },
  { icon: "💰", title: "Increase Sales", body: "Each article is packed with product links and CTAs designed to convert readers into customers." },
  { icon: "🌍", title: "Scale Globally", body: "Create content in 150+ languages to reach global audiences, driving more traffic and sales effortlessly." },
];

const quickBenefits = [
  { icon: "🎯", title: "Targeted Traffic, Every Time", body: "Pick a keyword and watch the AI deliver content that ranks for high-buying-intent searches." },
  { icon: "🔗", title: "Effortless Product Links", body: "The AI auto-links your products in every article, driving readers directly to your store." },
  { icon: "🛍️", title: "Simple Shopify Integration", body: "Connect your Shopify store in just a few clicks and start publishing directly to your blog." },
  { icon: "🌐", title: "Global Reach", body: "150+ languages, geo-targeted by country — reach any market without a translation team." },
];

export default function EcommercePage() {
  return (
    <>
      <MktHero
        eyebrow="🛍️ For E-Commerce"
        heading="Get More Sales with our AI eCommerce"
        headingAccent="SEO Content Service"
        sub="Create killer content that ranks. SEO-optimized articles driving targeted traffic to your product pages, converting like crazy."
        cta="Get Started Free"
        perks={["Auto product linking", "Shopify integration", "150+ languages"]}
      />

      {/* Why you need it */}
      <section className="py-20" style={{ background: "linear-gradient(180deg,transparent,#13151e 20%,#13151e 80%,transparent)" }}>
        <div className="container mx-auto px-7">
          <div className="text-center mb-12">
            <SectionLabel>💡 Why Infin8Content</SectionLabel>
            <SectionTitle center>Why do you need Infin8Content to grow your store?</SectionTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="bg-[#0f1117] border border-white/7 rounded-[14px] p-7 hover:border-[rgba(79,110,247,0.3)] transition-all text-center">
                <div className="text-[36px] mb-4">{b.icon}</div>
                <h4 className="font-display text-[15px] font-semibold text-white mb-2" style={{ fontFamily: "Sora,sans-serif" }}>{b.title}</h4>
                <p className="text-[13.5px] text-[#7b8098] leading-[1.6]">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick benefits strip */}
      <section className="py-20">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>⚡ Key Benefits</SectionLabel>
            <SectionTitle center>Benefits for Online Stores</SectionTitle>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/7 border border-white/7 rounded-[14px] overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {quickBenefits.map((f) => <FeatCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Feature rows */}
      <section className="py-10">
        <div className="container mx-auto px-7">
          <FeatureRow
            tag="📣 Social Sharing"
            title="Automatic Social Sharing"
            body="Let your articles reach more people effortlessly. Every piece of content is instantly shared across your social media platforms, automatically driving traffic and boosting engagement."
            bullets={[
              "Auto-share articles on publish across social channels",
              "Instantly drive traffic back to your product pages",
              "Boost engagement without manual social media work",
            ]}
            icon="📣"
          />
          <FeatureRow
            tag="🛍️ Shopify"
            title="Easy Shopify Integration"
            body="Effortlessly sync your Shopify store with Infin8Content. Automatically publish articles to your blog with product links embedded, and watch organic traffic turn into sales."
            bullets={[
              "Connect your Shopify store in seconds",
              "Auto-publish content directly to your blog",
              "Product links inserted contextually in every article",
              "Drive organic buyers straight to product pages",
            ]}
            reverse
            icon="🛍️"
            linkLabel="Learn about Shopify integration"
          />
          <FeatureRow
            tag="🌍 Global"
            title="Reach Global Markets in 150+ Languages"
            body="Expand into any market by generating and publishing SEO-optimized content in 150+ languages. Geo-targeted by country, each article is written for the local search audience."
            bullets={[
              "150+ languages supported out of the box",
              "Geo-targeted content per country",
              "Local SEO optimization built in",
              "Reach international buyers without a translation team",
            ]}
            icon="🌍"
          />
        </div>
      </section>

      {/* Before/After */}
      <section className="py-20" style={{ background: "linear-gradient(180deg,transparent,#13151e 20%,#13151e 80%,transparent)" }}>
        <div className="container mx-auto px-7 max-w-215">
          <div className="text-center mb-4">
            <SectionLabel>⚡ The Difference</SectionLabel>
            <SectionTitle center>From manual content to automated sales machine</SectionTitle>
          </div>
          <BeforeAfter
            beforeTitle="Without Infin8Content"
            afterTitle="With Infin8Content"
            beforeItems={[
              "Spend hours writing product content manually",
              "Pay $600+/mo for a copywriter per client",
              "Missed product link opportunities",
              "No social sharing or automation",
            ]}
            afterItems={[
              "Auto-generate SEO content for every product",
              "All-in-one solution — no copywriter needed",
              "Product links automatically inserted",
              "Auto-share to social on every publish",
            ]}
          />
        </div>
      </section>

      <CtaSection
        heading={"More traffic.\nMore sales. Less work."}
        sub="Get started and see why e-commerce teams trust Infin8Content."
        btnLabel="Start Free Trial"
        perks={["Cancel anytime", "Auto Shopify sync", "150+ languages"]}
      />
    </>
  );
}
