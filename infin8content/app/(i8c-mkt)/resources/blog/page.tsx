import { CtaSection } from "@/components/MktLayout";
import { SectionLabel } from "@/components/MktUI";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — AI Content & SEO Insights | Infin8Content",
  description:
    "Practical guides, strategies, and case studies on AI-powered content, SEO, and LLM visibility. Updated weekly.",
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  author: { name: string; initials: string };
  tags: string[];
  featured?: boolean;
}

const posts: Post[] = [
  {
    slug: "5-local-seo-tips-google-maps",
    title: "5 Local SEO Tips to Rank #1 on Google Maps ($5,729 Value)",
    excerpt:
      "If you run a local business — or manage local clients — ranking in the Google Maps local pack is one of the highest-ROI moves you can make. Here's exactly how to do it.",
    readTime: "10 min read",
    date: "Apr 21, 2026",
    author: { name: "Infin8 Team", initials: "IT" },
    tags: ["Local SEO", "Google Maps"],
    featured: true,
  },
  {
    slug: "65200-traffic-ai-seo",
    title: "How to Get 65,200/mo Traffic to Your Site with AI ($11,000 Value)",
    excerpt:
      "A step-by-step playbook for using AI-generated content to drive tens of thousands of monthly organic visitors — without backlinks or ads.",
    readTime: "9 min read",
    date: "Apr 21, 2026",
    author: { name: "Vasco M.", initials: "VM" },
    tags: ["AI SEO", "Traffic"],
  },
  {
    slug: "framer-seo-tips-rank-llms",
    title: "5 Framer SEO Tips to Rank #1 on Google (and Get Cited by LLMs)",
    excerpt:
      "Framer sites can rank incredibly well with the right structure. Here's how to optimise your Framer site for both Google and AI search engines.",
    readTime: "11 min read",
    date: "Apr 20, 2026",
    author: { name: "Vasco M.", initials: "VM" },
    tags: ["Framer", "LLM SEO"],
  },
  {
    slug: "best-ai-seo-plugin-framer",
    title: "The Best AI SEO Plugin for Framer: Write, Audit, and Publish Automatically",
    excerpt:
      "Discover how to connect Infin8Content to your Framer site and auto-publish fully SEO-optimised blog posts without leaving your workflow.",
    readTime: "9 min read",
    date: "Apr 20, 2026",
    author: { name: "Vasco M.", initials: "VM" },
    tags: ["Framer", "Automation"],
  },
  {
    slug: "llm-brand-visibility-guide",
    title: "How to Get ChatGPT to Recommend Your Brand (Complete Guide)",
    excerpt:
      "Most brands are invisible to AI search engines. Here's the exact content strategy to get cited by ChatGPT, Perplexity, and Gemini.",
    readTime: "12 min read",
    date: "Apr 18, 2026",
    author: { name: "Infin8 Team", initials: "IT" },
    tags: ["LLM SEO", "Brand Visibility"],
  },
  {
    slug: "ecommerce-seo-content-strategy",
    title: "The eCommerce Content Strategy That Drives 300% More Organic Sales",
    excerpt:
      "Stop relying on paid ads. This content strategy uses AI to create product-focused articles that rank for buying-intent keywords and convert.",
    readTime: "8 min read",
    date: "Apr 17, 2026",
    author: { name: "Infin8 Team", initials: "IT" },
    tags: ["E-Commerce", "Content Strategy"],
  },
  {
    slug: "autopublish-guide-2026",
    title: "AutoPublish Guide 2026: Set Up a Blog That Runs Itself",
    excerpt:
      "How to configure Infin8Content's AutoPublish to generate, schedule, and publish SEO articles to your site 24/7 — completely hands-free.",
    readTime: "7 min read",
    date: "Apr 15, 2026",
    author: { name: "Infin8 Team", initials: "IT" },
    tags: ["AutoPublish", "Tutorial"],
  },
  {
    slug: "saas-comparison-pages-seo",
    title: "How SaaS Companies Are Using Comparison Pages to Steal Competitor Traffic",
    excerpt:
      "Comparison and alternative pages are the highest-converting content type for SaaS. Here's how to build them at scale with AI.",
    readTime: "10 min read",
    date: "Apr 14, 2026",
    author: { name: "Vasco M.", initials: "VM" },
    tags: ["SaaS", "Content Strategy"],
  },
  {
    slug: "ai-seo-agent-technical-fixes",
    title: "7 Technical SEO Fixes Your AI Agent Can Deploy Automatically",
    excerpt:
      "Schema markup, canonical tags, broken links, image alt texts — your AI SEO Agent can handle all of these on autopilot. Here's how.",
    readTime: "6 min read",
    date: "Apr 12, 2026",
    author: { name: "Infin8 Team", initials: "IT" },
    tags: ["AI SEO Agent", "Technical SEO"],
  },
];

const allTags = [
  "All", "AI SEO", "Local SEO", "LLM SEO", "SaaS", "E-Commerce",
  "AutoPublish", "Content Strategy", "Technical SEO", "Tutorial",
];

function TagPill({ tag, active = false }: { tag: string; active?: boolean }) {
  return (
    <span
      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all cursor-pointer ${
        active
          ? "bg-mkt-accent-lite border-mkt-accent-border text-mkt-accent-hover"
          : "bg-transparent border-white/7 text-mkt-muted hover:border-mkt-accent-border hover:text-white"
      }`}
    >
      {tag}
    </span>
  );
}

function AuthorAvatar({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-mkt-surface2 border border-white/7 flex items-center justify-center text-[10px] font-bold text-mkt-accent shrink-0">
        {initials}
      </div>
      <span className="text-[12px] text-mkt-muted">{name}</span>
    </div>
  );
}

function PostCard({ post, size = "normal" }: { post: Post; size?: "normal" | "large" }) {
  const isLarge = size === "large";
  return (
    <Link
      href={`/resources/blog/${post.slug}`}
      className={`group bg-mkt-surface border border-white/7 rounded-[14px] overflow-hidden flex flex-col hover:border-mkt-accent-border hover:-translate-y-1 transition-all ${
        isLarge ? "md:flex-row" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden shrink-0 ${
          isLarge ? "w-full md:w-120 h-56 md:h-auto" : "w-full h-44"
        }`}
        className="bg-gradient-to-br from-mkt-surface2 to-mkt-surface3"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[44px] opacity-20">✍️</span>
        </div>
        <div
          className="absolute inset-0"
          className="bg-gradient-to-b from-mkt-accent/10 via-transparent to-transparent"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[10px] font-bold uppercase tracking-[0.06em] bg-mkt-bg/75 backdrop-blur-sm border border-white/10 text-mkt-accent-hover rounded px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className={`p-6 flex flex-col gap-3 flex-1 ${isLarge ? "md:p-9 md:justify-center" : ""}`}>
        <h3
          className={`font-display font-bold text-white leading-tight group-hover:text-mkt-accent-hover transition-colors ${
            isLarge ? "text-[22px] md:text-[26px]" : "text-[15.5px]"
          }`}
        >
          {post.title}
        </h3>
        <p className={`text-[#7b8098] leading-[1.65] ${isLarge ? "text-[15px]" : "text-[13.5px]"}`}>
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/7">
          <AuthorAvatar initials={post.author.initials} name={post.author.name} />
          <div className="flex items-center gap-3 text-[12px] text-[#4a4f68]">
            <span>{post.date}</span>
            <span className="w-1 h-1 rounded-full bg-[#4a4f68]" />
            <span>{post.readTime}</span>
          </div>
        </div>
        {isLarge && (
          <span className="inline-flex items-center gap-1.5 text-small font-semibold text-[#4f6ef7] group-hover:gap-3 transition-all mt-1">
            Read article →
          </span>
        )}
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const featured = posts.find((p) => p.featured)!;
  const rest = posts.filter((p) => !p.featured);

  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-14 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle 350px at 50% 0%, rgba(79,110,247,0.13) 0%, transparent 70%)",
          }}
        />
        <div className="container mx-auto px-7 relative">
          <SectionLabel>📝 Blog</SectionLabel>
          <h1
            className="font-display text-[clamp(36px,5.5vw,60px)] font-extrabold tracking-[-1.5px] leading-[1.06] text-white max-w-170 mx-auto mb-5"
          >
            AI Content &amp;{" "}
            <em className="not-italic text-mkt-accent">SEO Insights</em>
          </h1>
          <p className="text-large text-mkt-muted max-w-120 mx-auto leading-[1.65]">
            Practical guides, real strategies, and case studies on AI-powered
            content marketing. Updated weekly.
          </p>
        </div>
      </section>

      {/* Tag filter */}
      <div className="container mx-auto px-7 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {allTags.map((tag) => (
            <TagPill key={tag} tag={tag} active={tag === "All"} />
          ))}
        </div>
      </div>

      {/* Featured post */}
      <section className="pb-8">
        <div className="container mx-auto px-7">
          <PostCard post={featured} size="large" />
        </div>
      </section>

      {/* Post grid */}
      <section className="py-6 pb-24">
        <div className="container mx-auto px-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              className="border border-white/7 text-[#7b8098] font-semibold px-8 py-3.5 rounded-[10px] text-small hover:border-[rgba(79,110,247,0.3)] hover:text-white transition-all"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Load more posts
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter strip */}
      <section
        className="py-16"
        style={{
          background:
            "linear-gradient(180deg,transparent,#13151e 20%,#13151e 80%,transparent)",
        }}
      >
        <div className="container mx-auto px-7 max-w-165 text-center">
          <div className="text-[32px] mb-4">📬</div>
          <h2
            className="text-[28px] font-extrabold text-white tracking-tight mb-3"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Get the best posts in your inbox
          </h2>
          <p className="text-[15px] text-[#7b8098] mb-7">
            Weekly roundup of the best AI content and SEO strategies. No spam,
            unsubscribe anytime.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <CtaSection
        heading={"Read less.\nCreate more."}
        sub="Put the strategies to work — start publishing AI content today."
        btnLabel="Get Started Free"
      />
    </>
  );
}
