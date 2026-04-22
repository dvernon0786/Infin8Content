import { CtaSection } from "@/components/MktLayout";
import { MktHero, SectionLabel, SectionTitle, FeatureRow, StepCard, QuoteCard, FeatCard } from "@/components/MktUI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Content Software for Agencies — Client-Ready SEO Content | Infin8Content",
  description:
    "Infin8Content produces content so compelling you'll want to present it to your client immediately. Scale your agency without hiring more writers.",
};

const steps = [
  { num: 1, icon: "🔑", title: "Generate Client-Specific Articles from Keywords", body: "Start content creation by inputting the keywords your clients aim to rank for. The AI handles research, structure, and writing." },
  { num: 2, icon: "🎨", title: "Customize Formatting, Tone & Content Structure", body: "Select formatting options, adjust the tone to match each client's brand voice, and structure content for their specific audience." },
  { num: 3, icon: "✏️", title: "Optimize with the AI SEO Editor", body: "Easily edit content, incorporate internal and external links, and fine-tune keyword placement for maximum ranking potential." },
  { num: 4, icon: "📤", title: "Deliver Exceptional Results to Clients", body: "Add multiple client projects, set tailored outputs for each, and scale your agency fast without adding headcount." },
];

const quotes = [
  {
    quote: `"It comes down to how easy it is to create content, and the <strong class='text-white'>impressive rankings</strong> we see with it."`,
    name: "Timo S.",
    role: "CEO @ SpechtGmbH",
  },
  {
    quote: `"We're now able to <strong class='text-white'>rank our clients very quickly</strong> in just 1 or 2 months."`,
    name: "Abhinav S.",
    role: "CEO @ Interconnections",
  },
  {
    quote: `"We've heavily <strong class='text-white'>reduced our reliance on external copywriters</strong>. It's been a game-changer for our agency."`,
    name: "Brian E.",
    role: "Agency Founder",
  },
];

export default function AgencyPage() {
  return (
    <>
      <MktHero
        eyebrow="🏢 For Agencies"
        heading="The AI Content Software for Agencies That Delivers"
        headingAccent="Client-Ready Content"
        sub="Infin8Content produces content so compelling, you'll want to present it to your client immediately — without any editing."
        cta="Get Started Free"
        perks={["Unlimited clients", "White-label reports", "Cancel anytime"]}
      />

      {/* Testimonial case studies hero */}
      <section className="py-20 bg-linear-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-12">
            <SectionLabel>⭐ Real Stories</SectionLabel>
            <SectionTitle center>Why agencies trust Infin8Content</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {quotes.map((q) => <QuoteCard key={q.name} {...q} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-7">
          <div className="text-center mb-12">
            <SectionLabel>🔧 How It Works</SectionLabel>
            <SectionTitle center>How it works for SEO teams</SectionTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => <StepCard key={s.num} {...s} />)}
          </div>
        </div>
      </section>

      {/* Feature rows */}
      <section className="py-10">
        <div className="container mx-auto px-7">
          <FeatureRow
            tag="✏️ AI SEO Editor"
            title="Edit Content Exactly How You Want"
            body="Use Infin8Content's AI SEO editing suite to edit your articles exactly as needed. Add highly relevant external and internal links with just one click."
            bullets={[
              "Rewrite sections with custom prompts",
              "Add internal and external links automatically",
              "Adjust tone to match each client's brand voice",
              "Regenerate images with custom prompts",
            ]}
            linkLabel="Discover AI SEO Editor"
            icon="✏️"
          />
          <FeatureRow
            tag="📚 Client Knowledge Base"
            title="AI That Learns Your Clients' Businesses"
            body="Our AI learns from your clients' websites, documents, and assets — producing tailored articles with in-depth knowledge specific to their business."
            bullets={[
              "Upload websites, docs, or any business assets",
              "AI enters a learning phase to understand brand context",
              "Generate articles that reflect each client's unique expertise",
              "Every piece of content reflects brand voice, not generic AI",
            ]}
            linkLabel="Learn about Knowledge Base"
            reverse
            icon="📚"
          />
          <FeatureRow
            tag="📊 White-Label Reports"
            title="Impress Clients with Branded SEO Reports"
            body="Deliver professional white-label SEO reports with your agency's branding. Show clients exactly what's working and why — without exposing the tool you use."
            bullets={[
              "Custom logo, brand colors, and domain",
              "Share AI visibility dashboards with clients",
              "Automated monthly reporting",
              "PDF and shareable link exports",
            ]}
            linkLabel="Learn about SEO Reports"
            icon="📊"
          />
        </div>
      </section>

      {/* Agency features grid */}
      <section className="py-20 bg-linear-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>⚙️ Agency Features</SectionLabel>
            <SectionTitle center>Everything agencies need to scale</SectionTitle>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/7 border border-white/7 rounded-[14px] overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "👥", title: "Multi-Client Management", body: "Manage unlimited client projects from a single account — each with custom settings, tone, and knowledge bases." },
              { icon: "🏷️", title: "White-Label Everything", body: "Brand the entire platform experience. Reports, dashboards, and exports carry your agency's identity." },
              { icon: "🔌", title: "CMS Integrations", body: "Publish directly to WordPress, Shopify, Webflow, Ghost, Wix and more — for every client, at once." },
              { icon: "⚡", title: "Bulk Generation", body: "Generate and publish dozens of articles across multiple clients in a single run. Agencies use this to save 40+ hours per week." },
            ].map((f) => <FeatCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      <CtaSection
        heading={"Rank more clients.\nDo less work."}
        sub="Get started and see why agencies trust Infin8Content."
        btnLabel="Start Free Trial"
        perks={["Cancel anytime", "Unlimited clients", "White-label reports"]}
      />
    </>
  );
}
