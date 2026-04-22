import { SectionLabel, SectionTitle } from "@/components/MktUI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo — See Infin8Content in Action | Infin8Content",
  description: "Book a 30-minute demo with our team. See how Infin8Content can 10x your content output and rank your site on Google in weeks.",
};

const benefits = [
  { icon: "🎯", text: "Live walkthrough of all core features" },
  { icon: "📊", text: "See real ranking results from our customers" },
  { icon: "🔧", text: "Custom setup advice for your use case" },
  { icon: "💰", text: "Find the right plan for your budget" },
  { icon: "⚡", text: "Get onboarded same day if you're ready" },
  { icon: "❓", text: "Ask any questions — no pressure, no sales pitch" },
];

const faqs = [
  { q: "How long is the demo?", a: "About 30 minutes. We cover the platform, show real examples, and answer your specific questions." },
  { q: "Is this a sales call?", a: "We'll show you the product and answer your questions. If it's a fit, great — if not, that's fine too." },
  { q: "Can I bring my team?", a: "Absolutely. Feel free to invite anyone who'd be involved in your content workflow." },
  { q: "What should I prepare?", a: "Nothing required. If you have your website URL handy, we can show you a live example tailored to your niche." },
];

export default function CallPage() {
  return (
    <section className="pt-20 pb-24 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-mkt-accent/12 via-transparent to-transparent"
      />
      <div className="container mx-auto px-7 relative">
        <div className="max-w-250 mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 bg-mkt-accent-lite border border-mkt-accent-border rounded-full px-3.5 py-1.5 text-[13px] font-medium text-mkt-accent-hover mb-6">
              📞 Book a Demo
            </div>
            <h1
              className="text-[clamp(32px,5vw,56px)] font-extrabold tracking-[-1.5px] leading-[1.07] text-white mb-5 max-w-170 mx-auto"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              See <em className="not-italic text-mkt-accent">Infin8Content</em> in action — live
            </h1>
            <p className="text-large text-mkt-muted max-w-125 mx-auto leading-[1.65]">
              Book a 30-minute demo with our team. We&apos;ll show you how to 10x your content output and rank on Google in weeks.
            </p>
          </div>

          {/* 2-col layout: benefits + calendar embed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Benefits */}
            <div>
              <div className="mb-8">
                <SectionLabel>✦ What You&apos;ll Get</SectionLabel>
                <SectionTitle>What happens on the call</SectionTitle>
              </div>
              <ul className="flex flex-col gap-4 mb-10">
                {benefits.map((b) => (
                  <li key={b.text} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[10px] bg-[rgba(79,110,247,0.12)] border border-[rgba(79,110,247,0.25)] flex items-center justify-center text-large shrink-0">
                      {b.icon}
                    </div>
                    <span className="text-[15px] text-[#e8eaf2]">{b.text}</span>
                  </li>
                ))}
              </ul>

              {/* Testimonial pull-quote */}
              <div className="bg-[#0f1117] border border-white/7 rounded-[14px] p-6">
                <p className="text-[15px] text-[#e8eaf2] leading-[1.65] mb-4 italic">
                  &ldquo;After the demo I was onboarded same day. Within 2 weeks we had 12 articles ranking on page 1.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#13151e] border-2 border-white/7 flex items-center justify-center text-[12px] font-bold text-[#4f6ef7]">TS</div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">Timo S.</p>
                    <p className="text-[11.5px] text-[#7b8098]">Agency Owner @ SpechtGmbH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking form */}
            <div className="bg-[#0f1117] border border-white/7 rounded-xl p-8">
              <h3
                className="text-[20px] font-bold text-white mb-2"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Book your 30-min demo
              </h3>
              <p className="text-[13.5px] text-[#7b8098] mb-7">Pick a time that works for you. Spots fill up fast.</p>

              {/* Form fields */}
              <div className="flex flex-col gap-4">
                {[
                  { label: "First name", placeholder: "Your first name", type: "text" },
                  { label: "Last name", placeholder: "Your last name", type: "text" },
                  { label: "Work email", placeholder: "you@company.com", type: "email" },
                  { label: "Company / website", placeholder: "yoursite.com", type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[12.5px] font-semibold text-[#7b8098] mb-1.5 uppercase tracking-[0.06em]">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full bg-[#13151e] border border-white/7 rounded-md px-4 py-3 text-small text-[#e8eaf2] placeholder:text-[#4a4f68] outline-none focus:border-[rgba(79,110,247,0.5)] transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-[12.5px] font-semibold text-[#7b8098] mb-1.5 uppercase tracking-[0.06em]">
                    What&apos;s your main goal?
                  </label>
                  <select className="w-full bg-[#13151e] border border-white/7 rounded-md px-4 py-3 text-small text-[#e8eaf2] outline-none focus:border-[rgba(79,110,247,0.5)] transition-colors">
                    <option value="">Select your use case...</option>
                    <option>Scale content for my SaaS</option>
                    <option>Manage multiple agency clients</option>
                    <option>Grow my e-commerce store</option>
                    <option>Rank my local business</option>
                    <option>Other</option>
                  </select>
                </div>

                <button
                  className="w-full bg-[#4f6ef7] text-white font-semibold py-4 rounded-[10px] text-[15px] shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:bg-[#3d5df5] hover:shadow-[0_0_30px_rgba(79,110,247,0.5)] transition-all mt-2"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  Book My Demo →
                </button>
                <p className="text-center text-[12px] text-[#4a4f68]">No credit card required • Cancel anytime</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 text-center">
            <SectionLabel>❓ FAQ</SectionLabel>
            <SectionTitle center>Common questions</SectionTitle>
            <div className="max-w-150 mx-auto mt-8">
              {faqs.map(({ q, a }) => (
                <details key={q} className="border-b border-white/7 group text-left">
                  <summary className="flex items-center justify-between py-5 cursor-pointer text-[15px] font-medium text-[#e8eaf2] hover:text-white transition-colors gap-5 list-none">
                    {q}
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-body text-[#7b8098] shrink-0 group-open:bg-[rgba(79,110,247,0.15)] group-open:text-[#4f6ef7] group-open:rotate-45 transition-all">+</span>
                  </summary>
                  <div className="pb-5 text-[14.5px] text-[#7b8098] leading-[1.7]">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
