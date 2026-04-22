import { CtaSection } from "@/components/MktLayout";
import { SectionLabel } from "@/components/MktUI";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Studies — Real Results from Real Teams | Infin8Content",
  description: "See how agencies and marketers are growing organic traffic from 0 to 20,000+ monthly visitors using Infin8Content.",
};

const featuredCase = {
  stat: "0 → 1,600/mo",
  title: "From ZERO to 1,600/mo Traffic with AI Content",
  body: "Patrick Walsh, founder of PublishingPush, used Infin8Content to grow his site's search traffic from 0 to 1,600 monthly visitors — in under 60 days, without any backlinks.",
  name: "Patrick Walsh",
  role: "Founder @ PublishingPush",
  slug: "zero-to-1600",
  tags: ["Agency", "WordPress"],
};

const cases = [
  { stat: "26,000/mo", title: "26,000/mo in Traffic with AI Content", body: "SelfEmployed.com drove massive organic traffic growth using Infin8Content's AutoPublish feature.", name: "SelfEmployed", role: "Media Site", slug: "selfemployed-26k", tags: ["Media", "AutoPublish"] },
  { stat: "5,400/mo", title: "5,400/mo Traffic Converting Videos to Blog Posts", body: "French agency owner Thibault converted English YouTube content into French blog posts using Infin8Content.", name: "Thibault M.", role: "Agency Owner @ Millennium Digital", slug: "video-to-blog-5400", tags: ["Agency", "Video to Blog"] },
  { stat: "300%", title: "300% Traffic Increase with AI SEO", body: "SmarterGlass, an independent display panel distributor, increased search traffic for high-buying-intent keywords.", name: "SmarterGlass", role: "12+ year old company", slug: "smarterglass-300", tags: ["E-Commerce", "SEO Agent"] },
  { stat: "6,000/mo", title: "6,000 Monthly Visitors in the Competitive Health Niche", body: "Dr. Jeffrey Mark used Infin8Content to drive more organic search traffic and customers to his practice.", name: "Dr. Jeffrey Mark", role: "Doctor of Medicine", slug: "real-gut-doctor", tags: ["Local", "Health"] },
  { stat: "4,000/mo", title: "4,000 Monthly Visitors in a Non-English Market", body: "Helseforskning, a Norwegian business, grew local search traffic by 4,000 in just a few weeks.", name: "Helseforskning", role: "Norwegian Business", slug: "helseforskning", tags: ["Local", "Multilingual"] },
  { stat: "1,200 clicks", title: "1,200 Clicks per Month with AI SEO", body: "Rauva, a fintech startup in Portugal, improved their SEO performance dramatically with Infin8Content.", name: "Rauva", role: "Fintech Company", slug: "rauva-fintech", tags: ["SaaS", "Fintech"] },
  { stat: "14,000/mo", title: "From 0 to 14,000/mo in 60 Days", body: "Under30CEO used Infin8Content to scale content and drove from zero to 14,000 monthly visitors in 60 days.", name: "Under30CEO", role: "Media Platform", slug: "under30ceo", tags: ["Media", "AutoPublish"] },
  { stat: "#1 in 24hrs", title: "Ranking #1 in 24 Hours (and outranking the competition)", body: "Using Infin8Content's own product, the founder ranked a page at the top of Google in under 24 hours.", name: "Vasco M.", role: "Founder @ Infin8Content", slug: "rank-1-24hrs", tags: ["SaaS", "Case Study"] },
];

const allTags = ["All", "Agency", "SaaS", "E-Commerce", "Local", "Media", "AutoPublish", "SEO Agent"];

interface CaseItem {
  stat: string;
  title: string;
  body: string;
  name: string;
  role: string;
  slug: string;
  tags: string[];
}

function CaseCard({ stat, title, body, name, role, slug, tags }: CaseItem) {
  return (
    <Link
      href={`/resources/case-studies/${slug}`}
      className="group bg-mkt-surface border border-white/7 rounded-[14px] overflow-hidden hover:border-mkt-accent-border hover:-translate-y-1 transition-all flex flex-col"
    >
      <div
        className="w-full h-44 bg-linear-to-br from-mkt-surface2 to-mkt-surface3 flex items-center justify-center relative overflow-hidden"
      >
        <span className="font-display text-[40px] font-extrabold text-mkt-accent opacity-80">
          {stat}
        </span>
        <div className="absolute inset-0 bg-linear-to-b from-mkt-accent/10 via-transparent to-transparent" />
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-bold uppercase tracking-[0.06em] bg-mkt-accent-lite border border-mkt-accent-border text-mkt-accent rounded px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-display text-body font-bold text-white leading-[1.3] group-hover:text-mkt-accent transition-colors">
          {title}
        </h3>
        <p className="text-[13.5px] text-mkt-muted leading-[1.6] flex-1">{body}</p>
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/7">
          <div className="w-8 h-8 rounded-full bg-mkt-surface2 border border-white/7 flex items-center justify-center text-[11px] font-bold text-mkt-accent">
            {name.split(" ")[0][0]}
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-mkt-text">{name}</p>
            <p className="text-[11px] text-mkt-muted">{role}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CaseStudiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-mkt-accent/20 via-transparent to-transparent" />
        <div className="container mx-auto px-7 relative">
          <SectionLabel>📊 Case Studies</SectionLabel>
          <h1
            className="font-display text-[clamp(36px,5.5vw,62px)] font-extrabold tracking-[-1.5px] leading-[1.06] text-white max-w-150 mx-auto mb-5"
          >
            It just <em className="not-italic text-mkt-accent">works.</em>
          </h1>
          <p className="text-large text-mkt-muted max-w-115 mx-auto mb-8 leading-[1.65]">
            Real results, from real people. See how teams are growing organic traffic with Infin8Content.
          </p>
          <div className="flex items-center justify-center gap-2.5 text-[13.5px] text-mkt-muted">
            <div className="flex">
              {["JL","MR","AK","SB","TD"].map((i,idx)=>(
                <div key={idx} className={`w-7.5 h-7.5 rounded-full border-2 border-mkt-bg bg-mkt-surface2 flex items-center justify-center text-[10px] font-bold text-mkt-accent ${idx === 0 ? "" : "-ml-2"}`}>{i}</div>
              ))}
            </div>
            Trusted by <strong className="text-white ml-1">10,000+</strong>&nbsp;Marketers & Agencies
          </div>
        </div>
      </section>

      {/* Tag filter */}
      <div className="container mx-auto px-7 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                tag === "All"
                  ? "bg-mkt-accent-lite border-mkt-accent-border text-mkt-accent-lite"
                  : "bg-transparent border-white/7 text-mkt-muted hover:border-mkt-accent-border hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured case */}
      <section className="pb-6">
        <div className="container mx-auto px-7">
          <Link
            href={`/resources/case-studies/${featuredCase.slug}`}
            className="group block bg-mkt-surface border border-white/7 rounded-xl overflow-hidden hover:border-mkt-accent-border transition-all"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-auto bg-linear-to-br from-mkt-surface to-mkt-surface2 flex items-center justify-center relative overflow-hidden">
                <span className="font-display text-[56px] font-extrabold text-mkt-accent">
                  {featuredCase.stat}
                </span>
                <div className="absolute inset-0 bg-linear-to-b from-mkt-accent/15 via-transparent to-transparent" />
              </div>
              <div className="p-10 flex flex-col justify-center gap-4">
                <div className="flex gap-1.5">
                  {featuredCase.tags.map((t) => (
                    <span key={t} className="text-[10px] font-bold uppercase tracking-[0.06em] bg-mkt-accent-lite border border-mkt-accent-border text-mkt-accent-lite rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
                <h2 className="font-display text-[24px] font-bold text-white leading-tight group-hover:text-mkt-accent-hover transition-colors">
                  {featuredCase.title}
                </h2>
                <p className="text-[15px] text-mkt-muted leading-[1.65]">{featuredCase.body}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-9 h-9 rounded-full bg-mkt-surface2 border-2 border-white/7 flex items-center justify-center text-[12px] font-bold text-mkt-accent">PW</div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{featuredCase.name}</p>
                    <p className="text-[11.5px] text-mkt-muted">{featuredCase.role}</p>
                  </div>
                </div>
                <span className="text-small font-semibold text-mkt-accent group-hover:gap-3 transition-all">Read full case study →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Case study grid */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cases.map((c) => <CaseCard key={c.slug} {...c} />)}
          </div>
        </div>
      </section>

      <CtaSection
        heading={"Start writing your\nown success story."}
        sub="Join 10,000+ marketers growing organic traffic with Infin8Content."
        btnLabel="Get Started Free"
      />
    </>
  );
}
