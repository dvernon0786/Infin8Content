"use client";
import Link from "next/link";

// ── MktHero ─────────────────────────────────────────────────────
interface MktHeroProps {
  eyebrow?: string;
  heading: string;
  headingAccent?: string; // text that gets accent color
  sub: string;
  cta?: string;
  ctaHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  perks?: string[];
  children?: React.ReactNode; // for custom mockup below
}

export function MktHero({
  eyebrow,
  heading,
  headingAccent,
  sub,
  cta = "Get Started Free",
  ctaHref = "#",
  secondaryCta,
  secondaryHref = "#",
  perks,
  children,
}: MktHeroProps) {
  const displayHeading = headingAccent
    ? heading.replace(headingAccent, `|||${headingAccent}|||`)
    : heading;
  const parts = displayHeading.split("|||");

  return (
    <section className="pt-20 pb-16 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle 350px at 50% 0%, rgba(79,110,247,0.13) 0%, transparent 70%)",
        }}
      />
      <div className="container mx-auto px-7 relative">
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 bg-[rgba(79,110,247,0.1)] border border-[rgba(79,110,247,0.25)] rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#a5b4fc] mb-6">
            {eyebrow}
          </div>
        )}
        <h1
          className="font-display text-[clamp(32px,5.2vw,58px)] font-extrabold tracking-[-1.5px] leading-[1.07] text-white max-w-205 mx-auto mb-5"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          {parts.map((part, i) =>
            part === headingAccent ? (
              <em key={i} className="not-italic text-[#4f6ef7]">
                {part}
              </em>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </h1>
        <p className="text-large text-[#7b8098] max-w-140 mx-auto mb-8 leading-[1.65]">{sub}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-7">
          <Link
            href={ctaHref}
            className="inline-flex items-center font-display font-semibold bg-[#4f6ef7] text-white px-7 py-3.5 rounded-[10px] text-body shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:bg-[#3d5df5] hover:shadow-[0_0_30px_rgba(79,110,247,0.5)] hover:-translate-y-0.5 transition-all"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {cta}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center font-display font-semibold border border-white/7 text-[#7b8098] px-7 py-3.5 rounded-[10px] text-body hover:border-white/20 hover:text-white transition-all"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {secondaryCta}
            </Link>
          )}
        </div>
        {/* Social proof */}
        <div className="flex items-center justify-center gap-2.5 text-[13.5px] text-[#7b8098] mb-1.5">
          <div className="flex">
            {["JL", "MR", "AK", "SB", "TD"].map((i, idx) => (
              <div
                key={idx}
                className="w-7.5 h-7.5 rounded-full border-2 border-[#08090d] bg-[#13151e] flex items-center justify-center text-[10px] font-bold text-[#4f6ef7]"
                style={{ marginLeft: idx === 0 ? 0 : -8 }}
              >
                {i}
              </div>
            ))}
          </div>
          Trusted by <strong className="text-white ml-1">10,000+</strong>&nbsp;Marketers & Agencies
        </div>
        {perks && (
          <div className="flex items-center justify-center gap-5 flex-wrap text-[13px] text-[#7b8098] mt-2">
            {perks.map((p) => (
              <span key={p} className="flex items-center gap-1.5 before:content-['✓'] before:text-[#22c55e] before:font-bold">
                {p}
              </span>
            ))}
          </div>
        )}
        {children && <div className="mt-14">{children}</div>}
      </div>
    </section>
  );
}

// ── SectionLabel ─────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-widest text-[#4f6ef7] mb-3.5">
      {children}
    </p>
  );
}

// ── SectionTitle ─────────────────────────────────────────────
export function SectionTitle({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`text-[clamp(24px,3.5vw,40px)] font-extrabold tracking-[-0.6px] text-white leading-[1.15] mb-3.5 ${center ? "text-center" : ""}`}
      style={{ fontFamily: "Sora, sans-serif" }}
    >
      {children}
    </h2>
  );
}

// ── FeatureRow ───────────────────────────────────────────────
interface FeatureRowProps {
  tag?: string;
  title: string;
  body: string;
  bullets?: string[];
  linkLabel?: string;
  linkHref?: string;
  reverse?: boolean;
  icon?: string;
  children?: React.ReactNode;
}

export function FeatureRow({ tag, title, body, bullets, linkLabel, linkHref = "#", reverse, icon = "🖼️", children }: FeatureRowProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-16 border-b border-white/7 last:border-0 ${reverse ? "md:[direction:rtl]" : ""}`}
    >
      <div className={reverse ? "md:[direction:ltr]" : ""}>
        {tag && <SectionLabel>{tag}</SectionLabel>}
        <SectionTitle>{title}</SectionTitle>
        <p className="text-[15px] text-[#7b8098] leading-[1.65] mb-5">{body}</p>
        {bullets && (
          <ul className="flex flex-col gap-2.5 mb-7">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[15px] text-[#7b8098] leading-normal">
                <span className="text-[#4f6ef7] font-bold shrink-0 mt-0.5">✓</span>
                {b}
              </li>
            ))}
          </ul>
        )}
        {linkLabel && (
          <Link
            href={linkHref}
            className="inline-flex items-center gap-1.5 text-small font-semibold text-[#4f6ef7] border-b border-[rgba(79,110,247,0.3)] pb-0.5 hover:text-[#a5b4fc] hover:gap-2.5 transition-all"
          >
            {linkLabel} →
          </Link>
        )}
      </div>
      <div className={reverse ? "md:[direction:ltr]" : ""}>
        {children ?? (
          <div className="rounded-[14px] border border-white/7 bg-[#0f1117] aspect-4/3 flex flex-col items-center justify-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden relative">
            <div className="text-[36px] opacity-35">{icon}</div>
            <p className="text-[12px] text-[#4a4f68] text-center px-5" style={{ fontFamily: "Sora, sans-serif" }}>
              {title} Preview
              <br />
              <span className="text-[11px]">Replace with screenshot</span>
            </p>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 60% 30%, rgba(79,110,247,0.08) 0%, transparent 60%)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── StepCard ─────────────────────────────────────────────────
export function StepCard({ num, icon, title, body }: { num: number; icon: string; title: string; body: string }) {
  return (
    <div className="bg-[#0f1117] border border-white/7 rounded-[14px] p-7 transition-all hover:border-[rgba(79,110,247,0.3)] hover:-translate-y-1">
      <div className="w-8 h-8 rounded-full bg-[rgba(79,110,247,0.12)] border border-[rgba(79,110,247,0.25)] flex items-center justify-center font-display text-small font-bold text-[#4f6ef7] mb-4">
        {num}
      </div>
      <div className="text-[26px] mb-3">{icon}</div>
      <h4 className="font-display text-[15px] font-semibold text-white mb-2 leading-[1.3]" style={{ fontFamily: "Sora, sans-serif" }}>
        {title}
      </h4>
      <p className="text-[13.5px] text-[#7b8098] leading-[1.6]">{body}</p>
    </div>
  );
}

// ── FeatCard ─────────────────────────────────────────────────
export function FeatCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-[#0f1117] border border-white/7 p-6 transition-all hover:bg-[#13151e]">
      <div className="text-[22px] mb-3">{icon}</div>
      <h4 className="font-display text-small font-semibold text-white mb-1.5" style={{ fontFamily: "Sora, sans-serif" }}>
        {title}
      </h4>
      <p className="text-[13px] text-[#7b8098] leading-[1.55]">{body}</p>
    </div>
  );
}

// ── QuoteCard ────────────────────────────────────────────────
export function QuoteCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="bg-[#0f1117] border border-white/7 rounded-[14px] p-7 flex flex-col gap-4 hover:border-[rgba(79,110,247,0.3)] transition-all">
      <p className="text-[14.5px] text-[#e8eaf2] leading-[1.65] flex-1" dangerouslySetInnerHTML={{ __html: quote }} />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#13151e] border-2 border-white/7 flex items-center justify-center text-[12px] font-bold text-[#4f6ef7]">
          {name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">{name}</p>
          <p className="text-[11.5px] text-[#7b8098]">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── BeforeAfter ──────────────────────────────────────────────
export function BeforeAfter({
  beforeTitle,
  afterTitle,
  beforeItems,
  afterItems,
}: {
  beforeTitle: string;
  afterTitle: string;
  beforeItems: string[];
  afterItems: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
      {[
        { title: beforeTitle, items: beforeItems, type: "before" },
        { title: afterTitle, items: afterItems, type: "after" },
      ].map(({ title, items, type }) => (
        <div key={type} className="bg-[#0f1117] border border-white/7 rounded-[14px] overflow-hidden">
          <div
            className={`px-5 py-3 border-b border-white/7 flex items-center gap-2 text-[13px] font-bold ${type === "after" ? "text-[#22c55e]" : "text-[#7b8098]"}`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.08em] rounded px-1.5 py-0.5 ${
                type === "after"
                  ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]"
                  : "bg-white/5 text-[#7b8098]"
              }`}
            >
              {type === "after" ? "After" : "Before"}
            </span>
            {title}
          </div>
          <div className="p-5">
            <div className="w-full h-36 bg-linear-to-br from-[#13151e] to-[#0b0d14] rounded-lg mb-4 flex items-center justify-center text-[28px] opacity-40 border border-white/7">
              {type === "after" ? "🚀" : "😩"}
            </div>
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-[#7b8098] py-1">
                  <span className={`font-bold shrink-0 ${type === "after" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {type === "after" ? "✓" : "✗"}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FaqList ──────────────────────────────────────────────────
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="max-w-190 mx-auto mt-10">
      {items.map(({ q, a }) => (
        <details key={q} className="border-b border-white/7 group">
          <summary className="flex items-center justify-between py-5 cursor-pointer text-[15px] font-medium text-[#e8eaf2] hover:text-white transition-colors gap-5 list-none">
            {q}
            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-body text-[#7b8098] shrink-0 group-open:bg-[rgba(79,110,247,0.15)] group-open:text-[#4f6ef7] group-open:rotate-45 transition-all">
              +
            </span>
          </summary>
          <div className="pb-5 text-[14.5px] text-[#7b8098] leading-[1.7]">{a}</div>
        </details>
      ))}
    </div>
  );
}
