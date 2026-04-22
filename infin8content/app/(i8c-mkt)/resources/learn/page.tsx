import { CtaSection } from "@/components/MktLayout";
import { SectionLabel, SectionTitle } from "@/components/MktUI";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning & Training — Master AI Content Marketing | Infin8Content",
  description:
    "Free training videos, SEO courses, and guides to help you master AI-powered content and search. Updated for 2026.",
};

const fullTraining = [
  { title: "Infin8Content Full Guide (Updated 2026)", duration: "13 mins", emoji: "🎬", href: "#", badge: "Start here" },
  { title: "LLM Visibility Tracking Tutorial", duration: "5 mins", emoji: "🔭", href: "#" },
  { title: "Content Optimizer Walkthrough", duration: "2 mins 40 secs", emoji: "✏️", href: "#" },
  { title: "AI SEO Agent Tutorial", duration: "2 mins 40 secs", emoji: "⚙️", href: "#" },
];

const freeCourses = [
  { title: "LLM SEO Course", duration: "Full course", emoji: "🤖", href: "#", badge: "Most popular" },
  { title: "Local SEO Course", duration: "Full course", emoji: "📍", href: "#" },
  { title: "ChatGPT SEO Course", duration: "Full course", emoji: "💬", href: "#" },
  { title: "Rank & Rent SEO Course", duration: "Full course", emoji: "🏠", href: "#" },
  { title: "How to Force LLMs to Mention Your Site", duration: "Deep dive", emoji: "🧲", href: "#" },
  { title: "AI Content Strategy for 2026", duration: "Full course", emoji: "📈", href: "#" },
];

const quickGuides = [
  { icon: "🚀", title: "Getting Started in 10 Minutes", body: "Set up your first campaign, connect your CMS, and publish your first AI article.", href: "#" },
  { icon: "🔑", title: "Keyword Research with AI", body: "Find low-competition, high-buying-intent keywords your competitors haven't targeted yet.", href: "#" },
  { icon: "📊", title: "Reading Your Analytics", body: "Understand your traffic data, ranking improvements, and conversion metrics inside the dashboard.", href: "#" },
  { icon: "🔌", title: "CMS Integration Setup", body: "Step-by-step guides for connecting WordPress, Shopify, Webflow, Ghost, and more.", href: "#" },
];

interface VideoCardProps {
  title: string;
  duration: string;
  emoji: string;
  href: string;
  badge?: string;
}

function VideoCard({ title, duration, emoji, href, badge }: VideoCardProps) {
  return (
    <Link
      href={href}
      className="group bg-mkt-surface border border-white/7 rounded-[14px] overflow-hidden hover:border-mkt-accent-border hover:-translate-y-1 transition-all flex flex-col"
    >
      <div className="w-full aspect-video bg-linear-to-br from-mkt-surface2 to-mkt-surface3 flex items-center justify-center relative overflow-hidden">
        <span className="text-[44px]">{emoji}</span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-mkt-accent/80 flex items-center justify-center text-white text-[20px] backdrop-blur-sm">
            ▶
          </div>
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-mkt-accent/8 via-transparent to-transparent" />
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {badge && (
          <span className="self-start text-[10px] font-bold uppercase tracking-[0.06em] bg-mkt-success-lite border border-mkt-success-border text-mkt-success rounded px-2 py-0.5">
            {badge}
          </span>
        )}
        <h3 className="font-display text-small font-semibold text-white leading-[1.35] group-hover:text-mkt-accent-lite transition-colors">
          {title}
        </h3>
        <p className="text-[12px] text-mkt-muted">⏱ {duration}</p>
      </div>
    </Link>
  );
}

export default function LearnPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-mkt-accent/13 via-transparent to-transparent" />
        <div className="container mx-auto px-7 relative">
          <SectionLabel>🎓 Learning & Training</SectionLabel>
          <h1
            className="text-[clamp(34px,5.2vw,58px)] font-extrabold tracking-[-1.5px] leading-[1.07] text-white max-w-180 mx-auto mb-5 font-display"
          >
            Master the art of <em className="not-italic text-mkt-accent">AI Search</em>
          </h1>
          <p className="text-large text-mkt-muted max-w-135 mx-auto mb-9 leading-[1.65]">
            We&apos;ve prepared instructional videos, free courses, and guides to support your learning journey — updated for 2026.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="#"
              className="inline-flex items-center font-display font-semibold bg-mkt-accent text-white px-7 py-3.5 rounded-[10px] text-body shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:bg-mkt-accent-hover hover:-translate-y-0.5 transition-all"
            >
              Try Infin8Content Free
            </Link>
            <Link
              href="#"
              className="inline-flex items-center font-display font-semibold border border-white/7 text-mkt-muted px-7 py-3.5 rounded-[10px] text-body hover:border-white/20 hover:text-white transition-all"
            >
              Visit YouTube Channel ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Full Training section */}
      <section className="py-16 bg-linear-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="mb-8">
            <SectionLabel>🎬 Full Training</SectionLabel>
            <SectionTitle>Platform walkthroughs</SectionTitle>
            <p className="text-[15px] text-mkt-muted mt-1">Step-by-step video guides for every feature inside Infin8Content.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {fullTraining.map((v) => <VideoCard key={v.title} {...v} />)}
          </div>
        </div>
      </section>

      {/* Free Courses section */}
      <section className="py-16">
        <div className="container mx-auto px-7">
          <div className="mb-8">
            <SectionLabel>📚 Free SEO Courses</SectionLabel>
            <SectionTitle>Free courses to grow your skills</SectionTitle>
            <p className="text-[15px] text-mkt-muted mt-1">Full-length courses covering AI SEO, LLM visibility, local SEO, and more. All free.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {freeCourses.map((v) => <VideoCard key={v.title} {...v} />)}
          </div>
        </div>
      </section>

      {/* Quick guides */}
      <section className="py-16 bg-linear-to-b from-transparent via-mkt-surface2 to-transparent">
        <div className="container mx-auto px-7">
          <div className="text-center mb-10">
            <SectionLabel>📖 Quick Guides</SectionLabel>
            <SectionTitle center>Quick-start guides</SectionTitle>
            <p className="text-[15px] text-mkt-muted mt-1 max-w-115 mx-auto">Written guides for common tasks — get up and running fast.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickGuides.map((g) => (
              <Link
                key={g.title}
                href={g.href}
                className="group bg-mkt-surface border border-white/7 rounded-[14px] p-6 hover:border-mkt-accent-border hover:-translate-y-1 transition-all"
              >
                <div className="text-[28px] mb-3">{g.icon}</div>
                <h4 className="font-display text-[14.5px] font-semibold text-white mb-2 group-hover:text-mkt-accent-lite transition-colors leading-[1.3]">
                  {g.title}
                </h4>
                <p className="text-[13px] text-mkt-muted leading-[1.6]">{g.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help docs CTA strip */}
      <section className="py-12">
        <div className="container mx-auto px-7">
          <div className="bg-mkt-surface border border-white/7 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">
                Need more help?
              </h3>
              <p className="text-[15px] text-mkt-muted">Browse our full help documentation or chat with our support team.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="#" className="bg-mkt-accent text-white font-semibold px-6 py-3 rounded-[10px] text-small hover:bg-mkt-accent-hover transition-all font-display">
                Help Docs →
              </Link>
              <Link href="/call" className="border border-white/7 text-mkt-muted font-semibold px-6 py-3 rounded-[10px] text-small hover:text-white hover:border-white/20 transition-all font-display">
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        heading={"Learn it. Use it.\nGrow faster."}
        sub="Start using Infin8Content today and put your learning into practice."
        btnLabel="Get Started Free"
      />
    </>
  );
}
