"use client";
import { useState, useEffect } from "react";

// ─── Shell CSS (layout shell only — component styles live in globals.css) ──
const shellCss = `
/* PROMO BAR */
.mkt-promo-bar { background: linear-gradient(90deg, var(--mkt-surface3), var(--mkt-surface) 50%, var(--mkt-surface3)); border-bottom: 1px solid var(--mkt-accent-border); text-align: center; padding: 10px 20px; font-size: 13px; font-family: var(--mkt-font-display); font-weight: 500; color: var(--mkt-text); position: relative; z-index: 50; }
.mkt-time-unit { background: var(--mkt-accent-lite); border: 1px solid var(--mkt-accent-border); border-radius: 4px; padding: 2px 6px; font-weight: 700; color: var(--mkt-accent-hover); font-variant-numeric: tabular-nums; min-width: 28px; display: inline-block; text-align: center; }
.mkt-deal-link { background: var(--mkt-accent); color: var(--mkt-white); border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600; margin-left: 10px; text-decoration: none; }
/* HEADER */
.mkt-site-header { position: sticky; top: 0; z-index: 40; background: var(--mkt-bg-88); backdrop-filter: blur(12px); border-bottom: 1px solid var(--mkt-border); }
.mkt-header-inner { display: flex; align-items: center; justify-content: space-between; height: 62px; gap: 16px; max-width: 1160px; margin: 0 auto; padding: 0 28px; }
.mkt-brand { font-family: var(--mkt-font-display); font-weight: 800; font-size: 20px; letter-spacing: -.5px; color: var(--mkt-white); flex-shrink: 0; text-decoration: none; }
.mkt-brand span { color: var(--mkt-accent); }
.mkt-brand img { height: 32px; width: auto; display: block; }
.mkt-main-nav { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
.mkt-nav-item { position: relative; }
.mkt-nav-link { display: flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: var(--mkt-radius-sm); font-size: 14px; font-weight: 500; color: var(--mkt-muted); transition: all .2s; cursor: pointer; white-space: nowrap; text-decoration: none; background: none; border: none; font-family: inherit; }
.mkt-nav-link:hover { color: var(--mkt-white); background: rgba(255,255,255,.05); }
.mkt-chevron { font-size: 10px; transition: transform .2s; display: inline-block; }
.mkt-nav-item:hover .mkt-chevron { transform: rotate(180deg); }
.mkt-dropdown { display: none; position: absolute; top: 100%; left: 0; background: var(--mkt-surface2); border: 1px solid var(--mkt-border); border-radius: var(--mkt-radius); padding: 16px 8px 8px; min-width: 230px; box-shadow: 0 20px 60px rgba(0,0,0,.5); z-index: 100; }
.mkt-nav-item:hover .mkt-dropdown { display: block; }
.mkt-dropdown-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--mkt-muted2); padding: 4px 10px; margin-bottom: 2px; }
.mkt-dropdown-link { display: block; padding: 8px 10px; border-radius: var(--mkt-radius-sm); font-size: 13.5px; color: var(--mkt-muted); transition: all .15s; text-decoration: none; }
.mkt-dropdown-link:hover { color: var(--mkt-white); background: rgba(255,255,255,.05); }
.mkt-dropdown-link strong { display: block; color: var(--mkt-text); font-size: 13.5px; margin-bottom: 1px; }
.mkt-dropdown-link small { font-size: 12px; color: var(--mkt-muted); }
.mkt-dropdown hr { border: none; border-top: 1px solid var(--mkt-border); margin: 6px 0; }
.mkt-header-cta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.mkt-nav-toggle { display: none; background: transparent; border: 1px solid var(--mkt-border); border-radius: var(--mkt-radius-sm); color: var(--mkt-text); padding: 7px 10px; font-size: 18px; cursor: pointer; }
@media(max-width:860px){ .mkt-main-nav{display:none;} .mkt-nav-toggle{display:flex;} }
.mkt-main-nav.open { display:flex!important; flex-direction:column; position:fixed; top:62px; left:0; right:0; background:var(--mkt-bg-97); backdrop-filter:blur(12px); padding:20px; border-bottom:1px solid var(--mkt-border); gap:4px; z-index:39; }
.mkt-main-nav.open .mkt-dropdown{display:none!important;}
/* FOOTER */
.mkt-site-footer { border-top: 1px solid var(--mkt-border); padding: 60px 0 40px; }
.mkt-footer-top { display: grid; grid-template-columns: 220px repeat(5,1fr); gap: 40px; margin-bottom: 48px; }
.mkt-footer-brand .mkt-brand { display: block; margin-bottom: 12px; }
.mkt-footer-brand p { font-size: 13.5px; color: var(--mkt-muted); line-height: 1.6; }
.mkt-footer-col h4 { font-family: var(--mkt-font-display); font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--mkt-muted2); margin-bottom: 14px; }
.mkt-footer-col a { display: block; font-size: 13.5px; color: var(--mkt-muted); margin-bottom: 10px; transition: color .2s; text-decoration: none; }
.mkt-footer-col a:hover { color: var(--mkt-white); }
.mkt-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--mkt-border); flex-wrap: wrap; gap: 12px; }
.mkt-footer-bottom small { font-size: 12.5px; color: var(--mkt-muted2); }
.mkt-footer-legal { display: flex; gap: 16px; }
.mkt-footer-legal a { font-size: 12.5px; color: var(--mkt-muted2); text-decoration: none; }
.mkt-footer-legal a:hover { color: var(--mkt-muted); }
@media(max-width:1024px){ .mkt-footer-top{grid-template-columns:1fr 1fr 1fr;} .mkt-footer-brand{grid-column:1/-1;} }
@media(max-width:860px){ .mkt-footer-top{grid-template-columns:1fr 1fr;} .mkt-footer-brand{grid-column:1/-1;} }
`;

// ─── SocialProof ─────────────────────────────────────────────
export function SocialProof({ label = "Trusted by marketers & agencies worldwide" }: { label?: string }) {
  const avatars = [
    { name: "Avatar 1", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { name: "Avatar 2", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { name: "Avatar 3", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  ];
  return (
    <div className="flex items-center justify-center gap-2.5 text-[13.5px] text-mkt-muted">
      <div className="flex">
        {avatars.map((avatar, idx) => (
          <img
            key={idx}
            src={avatar.src}
            alt={avatar.name}
            className={`w-7.5 h-7.5 min-w-7.5 rounded-full border-2 border-mkt-bg object-cover shrink-0${idx === 0 ? "" : " -ml-2"}`}
            loading="lazy"
          />
        ))}
      </div>
      Trusted by <strong className="text-white ml-1">{label}</strong>
    </div>
  );
}

// ─── CtaSection ──────────────────────────────────────────────
export function CtaSection({
  heading = "Scale more content.\nDo less work.",
  sub = "Get started and see why agencies trust Infin8Content.",
  btnLabel = "Start today",
  perks = ["Cancel anytime", "Articles in 30 secs", "Plagiarism free"],
}: {
  heading?: string;
  sub?: string;
  btnLabel?: string;
  perks?: string[];
}) {
  return (
    <section className="py-24 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none bg-linear-to-b from-mkt-accent/12 via-transparent to-transparent"
      />
      <div className="container mx-auto px-7 relative">
        <h2 className="font-display text-[clamp(28px,5vw,50px)] font-extrabold tracking-tight text-white mb-4 whitespace-pre-line">
          {heading}
        </h2>
        <p className="text-[17px] text-mkt-muted mb-9">{sub}</p>
        <a
          href="/register"
          className="inline-flex items-center justify-center font-display font-semibold bg-mkt-accent text-white px-8 py-4 rounded-[10px] text-body shadow-[0_0_20px_var(--mkt-accent-glow)] hover:bg-mkt-accent-hover hover:shadow-[0_0_30px_var(--mkt-accent-glow-heavy)] hover:-translate-y-0.5 transition-all"
        >
          {btnLabel}
        </a>
        <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
          {perks.map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-[13px] text-mkt-muted">
              <span className="text-mkt-green font-bold">✓</span> {p}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2.5 mt-7">
          <SocialProof />
        </div>
      </div>
    </section>
  );
}

// ─── MktLayout (default export) ──────────────────────────────
export default function MktLayout({ children }: { children: React.ReactNode }) {
  const [ph, setPh] = useState("08");
  const [pm, setPm] = useState("34");
  const [ps, setPs] = useState("12");

  useEffect(() => {
    let total = 8 * 3600 + 34 * 60 + 12;
    function tick() {
      if (total <= 0) return;
      total--;
      setPh(String(Math.floor(total / 3600)).padStart(2, "0"));
      setPm(String(Math.floor((total % 3600) / 60)).padStart(2, "0"));
      setPs(String(total % 60).padStart(2, "0"));
    }
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const navToggle = document.getElementById("mkt-nav-toggle");
    const mainNav = document.getElementById("mkt-main-nav");
    if (navToggle && mainNav) {
      const handler = () => {
        mainNav.classList.toggle("open");
        navToggle.textContent = mainNav.classList.contains("open") ? "✕" : "☰";
      };
      navToggle.addEventListener("click", handler);
      return () => navToggle.removeEventListener("click", handler);
    }
  }, []);

  return (
    <div className="mkt-layout bg-mkt-bg text-mkt-text min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: shellCss }} />

      {/* Promo Bar */}
      <div className="mkt-promo-bar">
        ✨&nbsp; New Year Offer:{" "}
        <strong className="text-mkt-accent mx-1.5">40% Off</strong> on Yearly Plans
        &nbsp;
        <span className="mkt-time-unit">{ph}</span>hrs{" "}
        <span className="mkt-time-unit">{pm}</span>min{" "}
        <span className="mkt-time-unit">{ps}</span>sec
        <a className="mkt-deal-link" href="/register">Get Deal</a>
      </div>

      {/* Header */}
      <header className="mkt-site-header">
        <div className="mkt-header-inner">
          <a className="mkt-brand" href="/">
            <img src="/infin8content_logo.png" alt="Infin8Content" />
          </a>
          <nav className="mkt-main-nav" id="mkt-main-nav">
            <div className="mkt-nav-item">
              <span className="mkt-nav-link">Features <span className="mkt-chevron">▾</span></span>
              <div className="mkt-dropdown">
                <div className="mkt-dropdown-label">AI Writing</div>
                <a className="mkt-dropdown-link" href="/ai-content-writer">AI Content Writer</a>
                <a className="mkt-dropdown-link" href="/ai-seo-editor">AI SEO Editor</a>
                <a className="mkt-dropdown-link" href="#">News Writer</a>
                <hr />
                <div className="mkt-dropdown-label">Automation</div>
                <a className="mkt-dropdown-link" href="/ai-seo-agent">AI SEO Agent</a>
                <a className="mkt-dropdown-link" href="/autopublish">AutoPublish</a>
                <a className="mkt-dropdown-link" href="/llm-tracker">LLM Tracker</a>
              </div>
            </div>
            <div className="mkt-nav-item">
              <span className="mkt-nav-link">Solutions <span className="mkt-chevron">▾</span></span>
              <div className="mkt-dropdown">
                <a className="mkt-dropdown-link" href="/solutions/saas"><strong>SaaS</strong><small>Scale organic traffic for your product</small></a>
                <a className="mkt-dropdown-link" href="/solutions/agency"><strong>Agencies</strong><small>Manage multiple clients at scale</small></a>
                <a className="mkt-dropdown-link" href="/solutions/ecommerce"><strong>E-Commerce</strong><small>Upgrade your store&apos;s content</small></a>
                <a className="mkt-dropdown-link" href="/solutions/local"><strong>Local Business</strong><small>Dominate local search</small></a>
              </div>
            </div>
            <a className="mkt-nav-link" href="/pricing">Pricing</a>
            <div className="mkt-nav-item">
              <span className="mkt-nav-link">Resources <span className="mkt-chevron">▾</span></span>
              <div className="mkt-dropdown">
                <a className="mkt-dropdown-link" href="/resources/case-studies">Case Studies</a>
                <a className="mkt-dropdown-link" href="/resources/learn">Learning &amp; Training</a>
                <a className="mkt-dropdown-link" href="#">Help Docs</a>
                <a className="mkt-dropdown-link" href="/resources/blog">Blog</a>
              </div>
            </div>
          </nav>
          <div className="mkt-header-cta">
            <a className="mkt-btn-primary" href="/register">Start today</a>
          </div>
          <button className="mkt-nav-toggle" id="mkt-nav-toggle">☰</button>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mkt-site-footer">
        <div className="mkt-container">
          <div className="mkt-footer-top">
            <div className="mkt-footer-brand">
              <a className="mkt-brand" href="/">
                <img src="/infin8content_logo.png" alt="Infin8Content" />
              </a>
              <p>AI content workflows for modern teams and agencies.</p>
            </div>
            <div className="mkt-footer-col">
              <h4>AI Writing</h4>
              <a href="/ai-content-writer">AI Content Writer</a>
              <a href="/ai-seo-editor">AI SEO Editor</a>
              <a href="#">News Writer</a>
              <a href="#">Video to Blog</a>
            </div>
            <div className="mkt-footer-col">
              <h4>Automation</h4>
              <a href="/ai-seo-agent">AI SEO Agent</a>
              <a href="/autopublish">AutoPublish</a>
              <a href="#">SEO Reports</a>
              <a href="/llm-tracker">LLM Tracker</a>
            </div>
            <div className="mkt-footer-col">
              <h4>Resources</h4>
              <a href="/pricing">Pricing</a>
              <a href="/resources/blog">Blog</a>
              <a href="#">Help Docs</a>
              <a href="/resources/case-studies">Case Studies</a>
            </div>
            <div className="mkt-footer-col">
              <h4>Integrations</h4>
              <a href="#">WordPress</a>
              <a href="#">Shopify</a>
              <a href="#">Ghost</a>
              <a href="#">Webflow</a>
              <a href="#">Zapier</a>
            </div>
            <div className="mkt-footer-col">
              <h4>Solutions</h4>
              <a href="/solutions/saas">SaaS</a>
              <a href="/solutions/agency">Agencies</a>
              <a href="/solutions/ecommerce">E-Commerce</a>
              <a href="/solutions/local">Local Business</a>
            </div>
          </div>
          <div className="mkt-footer-bottom">
            <small>© {new Date().getFullYear()} Infin8Content. All rights reserved.</small>
            <div className="mkt-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">contact@infin8content.com</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
