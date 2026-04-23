'use client';

/**
 * /pricing — rebuilt to exactly match /ai-content-writer
 *
 * Layout system : MarketingShell (provided by (marketing-pages)/layout.tsx)
 * Body renderer : MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc. (same as ai-content-writer)
 * Interactivity : billing toggle + FAQ accordion wired in MarketingPageBody/useEffect
 *
 * Placement: app/(marketing-pages)/pricing/page.tsx
 */

import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — identical token names to /ai-content-writer
// ─────────────────────────────────────────────────────────────────────────────
const css = `
/* ── SECTION SCAFFOLD ── */
.section        { padding: 80px 0; }
.section-alt    { background: linear-gradient(to bottom, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent); }
.section-header { text-align: center; margin-bottom: 50px; }

.section-label {
  display: inline-block;
  font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--accent); margin-bottom: 10px;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 3.5vw, 40px);
  font-weight: 700; letter-spacing: -.6px;
  color: var(--white); margin-bottom: 14px; line-height: 1.15;
}
.section-sub {
  font-size: 16px; color: var(--muted);
  line-height: 1.65; max-width: 600px; margin: 0 auto;
}

/* ── HERO ── */
.pricing-hero {
  padding: 80px 28px 48px;
  max-width: 1160px; margin: 0 auto;
}
.pricing-hero-inner {
  display: flex; flex-wrap: wrap;
  align-items: flex-end; justify-content: space-between; gap: 32px;
}
.pricing-hero-left {}
.pricing-hero-left .eyebrow-label {
  font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em; color: var(--accent);
}
.pricing-hero-left h1 {
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 700; letter-spacing: -1px; line-height: 1.1;
  color: var(--white); margin: 12px 0 16px;
}
.pricing-hero-left p {
  font-size: 16px; color: var(--muted); line-height: 1.65; max-width: 480px;
}
.launch-badge {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid rgba(79,110,247,.25);
  background: rgba(79,110,247,.12);
  border-radius: 12px; padding: 8px 16px;
  font-size: 13px; font-weight: 500; color: #a5b4fc;
  margin-top: 24px;
}
.pricing-hero-right {}
.billing-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted); margin-bottom: 8px;
  text-align: right;
}
.billing-toggle {
  display: inline-flex; align-items: center;
  border: 1px solid rgba(255,255,255,.07);
  background: var(--surface); border-radius: 12px; padding: 4px;
}
.billing-btn {
  position: relative; padding: 8px 24px;
  font-family: var(--font-display); font-size: 14px; font-weight: 600;
  border-radius: 9px; border: none; cursor: pointer;
  transition: all .2s; color: var(--muted); background: transparent;
}
.billing-btn.active {
  color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  box-shadow: 0 2px 8px rgba(79,110,247,.4);
}
.billing-btn .save-badge {
  display: inline-block;
  font-size: 9px; font-weight: 700;
  background: rgba(34,197,94,.15); color: var(--green);
  border-radius: 99px; padding: 2px 6px; margin-left: 6px;
}
.billing-btn.active .save-badge {
  background: rgba(255,255,255,.2); color: var(--white);
}
.billing-savings {
  font-size: 12px; color: var(--green); font-weight: 500;
  margin-top: 8px; text-align: right; min-height: 18px;
}

/* ── PLAN CARDS ── */
.plans-section { padding: 0 28px 64px; max-width: 1160px; margin: 0 auto; }
.plans-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 24px; align-items: start;
}
.plan-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px; overflow: hidden;
  transition: box-shadow .2s;
}
.plan-card.popular {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(79,110,247,.3), 0 20px 60px rgba(79,110,247,.15);
  transform: scale(1.025);
}
.popular-badge {
  display: block; text-align: center;
  font-size: 12px; font-weight: 700; color: var(--white);
  padding: 8px 0;
  background: linear-gradient(to right, #217CEB, #4A42CC);
}
.plan-header {
  padding: 28px 28px 24px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.plan-card.popular .plan-header {
  border-bottom-color: rgba(79,110,247,.25);
}
.plan-name {
  font-family: var(--font-display); font-size: 20px;
  font-weight: 600; color: var(--white);
}
.plan-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
.plan-tagline { font-size: 14px; color: var(--muted); margin-top: 8px; line-height: 1.5; }
.plan-price-row { margin-top: 24px; display: flex; align-items: flex-end; gap: 4px; }
.plan-price {
  font-family: var(--font-display);
  font-size: 48px; font-weight: 500;
  letter-spacing: -2px; color: var(--white);
  line-height: 1;
}
.plan-price-unit { font-size: 14px; color: var(--muted); margin-bottom: 4px; }
.plan-billed { font-size: 12px; color: var(--muted2); margin-top: 4px; }
.plan-cost-per { font-size: 12px; color: var(--muted); margin-top: 8px; }
.plan-cost-per strong { color: var(--white); }
.plan-savings { font-size: 12px; color: var(--green); font-weight: 600; margin-top: 4px; }
.plan-cta {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 14px;
  font-family: var(--font-display); font-size: 14px; font-weight: 600;
  color: var(--white); border-radius: 12px; border: none; cursor: pointer;
  background: linear-gradient(to right, #217CEB, #4A42CC);
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(79,110,247,.3);
  transition: opacity .2s, box-shadow .2s;
  margin-top: 20px;
}
.plan-cta:hover { opacity: .9; box-shadow: 0 4px 20px rgba(79,110,247,.5); }
.plan-trial {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted2); text-align: center; margin-top: 8px;
}
.best-value-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--accent);
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  border-radius: 8px; padding: 4px 8px;
  margin-top: 8px;
}

/* ── PLAN FEATURES ── */
.plan-features { padding: 24px 28px 28px; }
.plan-feat-sep {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted2); padding: 8px 0 4px;
}
.plan-feat-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 5px 0; font-size: 13.5px; color: var(--muted); line-height: 1.45;
}
.plan-feat-item .chk { color: #3b82f6; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.plan-feat-item .note { font-size: 11px; color: var(--muted2); margin-left: 4px; }
.plan-feat-item .badge-new {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: var(--white); border-radius: 99px; padding: 2px 6px; margin-left: 6px;
}
.plan-not-incl { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.07); }
.plan-not-incl-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted2); margin-bottom: 10px;
}
.plan-feat-item.excl .chk { color: var(--muted2); }

/* ── TRIAL REMINDER ── */
.trial-reminder {
  text-align: center; margin-top: 40px;
}
.trial-pill {
  display: inline-block;
  font-size: 13px; font-weight: 500; color: var(--muted);
  background: var(--surface); border: 1px solid rgba(255,255,255,.07);
  border-radius: 99px; padding: 10px 24px;
}

/* ── TRAFFIC PROOF STRIP ── */
.strip-section {
  border-top: 1px solid rgba(255,255,255,.07);
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: var(--surface);
  padding: 48px 0; overflow: hidden;
}
.strip-label {
  text-align: center;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted2); margin-bottom: 20px;
}
.strip-track-wrapper {
  position: relative; overflow: hidden;
}
.strip-fade-l {
  position: absolute; left: 0; top: 0; bottom: 0; width: 96px;
  background: linear-gradient(to right, var(--surface), transparent);
  z-index: 1; pointer-events: none;
}
.strip-fade-r {
  position: absolute; right: 0; top: 0; bottom: 0; width: 96px;
  background: linear-gradient(to left, var(--surface), transparent);
  z-index: 1; pointer-events: none;
}
.strip-track {
  display: flex; gap: 16px; width: max-content;
  animation: marquee 28s linear infinite;
}
.strip-item {
  flex-shrink: 0; display: flex; align-items: center; gap: 12px;
  background: var(--surface2); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: 12px 20px;
}
.strip-item-stat { font-size: 14px; font-weight: 700; color: var(--white); font-family: var(--font-display); }
.strip-item-sub  { font-size: 12px; color: var(--muted); }
.strip-item-arr  { font-size: 12px; font-weight: 700; color: var(--green); }
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ── FEATURE VALUE SECTION ── */
.fv-section { background: var(--surface); padding: 96px 0; border-top: 1px solid rgba(255,255,255,.07); }
.fv-cats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
}
.fv-cat {
  background: var(--surface2);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px; padding: 24px;
  transition: border-color .2s;
}
.fv-cat:hover { border-color: rgba(79,110,247,.25); }
.fv-cat-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 20px;
}
.fv-cat-dot { width: 8px; height: 8px; border-radius: 50%; }
.fv-cat-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
}
.fv-feat-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 5px 0;
}
.fv-feat-chk {
  flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
  font-size: 9px; font-weight: 700;
}
.fv-feat-text { font-size: 13px; color: var(--muted); line-height: 1.45; }
.fv-bottom { text-align: center; margin-top: 40px; font-size: 14px; color: var(--muted); }
.fv-bottom a { color: var(--accent); font-weight: 500; }
.fv-bottom a:hover { text-decoration: underline; }

/* ── COMPARISON TABLE ── */
.compare-section { padding: 0 28px 80px; max-width: 1160px; margin: 0 auto; }
.compare-header {
  display: flex; align-items: flex-end;
  justify-content: space-between; margin-bottom: 24px;
}
.compare-header h2 {
  font-family: var(--font-display);
  font-size: 24px; font-weight: 600; color: var(--white);
}
.compare-header p { font-size: 14px; color: var(--muted); }
.compare-wrap { overflow-x: auto; border-radius: 20px; border: 1px solid rgba(255,255,255,.07); box-shadow: 0 4px 24px rgba(0,0,0,.3); }
.compare-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.compare-table thead tr { background: var(--surface2); border-bottom: 1px solid rgba(255,255,255,.07); }
.compare-table th {
  padding: 16px; font-weight: 600; color: var(--muted);
  white-space: nowrap;
}
.compare-table th:first-child { text-align: left; width: 40%; }
.compare-table th.th-pro { color: var(--accent); background: rgba(79,110,247,.08); }
.compare-table th .th-sub { display: block; font-size: 10px; font-weight: 400; color: var(--accent); margin-top: 2px; }
.compare-table tbody tr { background: var(--surface); border-bottom: 1px solid rgba(255,255,255,.04); transition: background .15s; }
.compare-table tbody tr:hover { background: var(--surface2); }
.compare-table tbody tr.cat-row { background: var(--surface2); }
.compare-table tbody tr.hl-row { background: rgba(79,110,247,.06); }
.compare-table td { padding: 12px 16px; color: var(--muted); text-align: center; }
.compare-table td:first-child { text-align: left; }
.compare-table td.pro-col { background: rgba(79,110,247,.04); }
.compare-table .cat-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--muted2);
}
.compare-table .hl-feat { font-weight: 600; color: var(--white); }
.compare-table .chk-y { color: #3b82f6; font-size: 16px; }
.compare-table .chk-n { color: var(--muted2); font-size: 16px; }
.compare-table .badge-new-sm {
  font-size: 9px; font-weight: 700;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: var(--white); border-radius: 99px; padding: 2px 6px; margin-left: 6px;
}

/* ── QUICK COMPARISON ── */
.qc-section { padding: 0 28px 80px; max-width: 1160px; margin: 0 auto; }
.qc-section h2 {
  font-family: var(--font-display);
  font-size: 24px; font-weight: 600; color: var(--white); margin-bottom: 24px;
}
.qc-wrap { overflow-x: auto; background: var(--surface); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,.2); }
.qc-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.qc-table thead tr { background: var(--surface2); border-bottom: 1px solid rgba(255,255,255,.07); }
.qc-table th { padding: 16px; font-weight: 600; color: var(--muted); text-align: center; }
.qc-table th:first-child { text-align: left; }
.qc-table th.th-pro { color: var(--accent); background: rgba(79,110,247,.08); }
.qc-table tbody tr { border-bottom: 1px solid rgba(255,255,255,.04); transition: background .15s; }
.qc-table tbody tr:hover { background: var(--surface2); }
.qc-table td { padding: 12px 16px; color: var(--muted); text-align: center; }
.qc-table td:first-child { text-align: left; }
.qc-table td.pro-col { background: rgba(79,110,247,.04); }
.qc-table .chk-y { color: #3b82f6; }
.qc-table .chk-n { color: var(--muted2); }

/* ── BESPOKE SERVICE ── */
.bespoke-section {
  padding: 96px 28px;
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
  border-top: 1px solid rgba(255,255,255,.07);
}
.bespoke-inner { max-width: 1000px; margin: 0 auto; }
.bespoke-card {
  border-radius: 28px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.07);
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
.bespoke-banner {
  background: linear-gradient(to right, #4A42CC, #217CEB);
  padding: 12px 24px; text-align: center;
  font-size: 14px; font-weight: 600; color: var(--white);
}
.bespoke-body { background: var(--surface); display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 48px; }
.bespoke-tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--accent);
  background: rgba(79,110,247,.12); border: 1px solid rgba(79,110,247,.25);
  border-radius: 99px; padding: 6px 14px; margin-bottom: 20px;
}
.bespoke-heading {
  font-family: var(--font-display);
  font-size: clamp(28px, 3.5vw, 38px);
  font-weight: 700; line-height: 1.15; margin-bottom: 16px;
}
.bespoke-heading .grad {
  background: linear-gradient(to right, #4A42CC, #217CEB);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.bespoke-p { font-size: 15px; color: var(--muted); line-height: 1.65; margin-bottom: 28px; }
.bespoke-price-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 8px;
}
.bespoke-price-row { display: flex; align-items: flex-end; gap: 6px; }
.bespoke-price {
  font-family: var(--font-display);
  font-size: 48px; font-weight: 500;
  letter-spacing: -2px; color: var(--white); line-height: 1;
}
.bespoke-price-unit { font-size: 18px; color: var(--muted); margin-bottom: 4px; }
.bespoke-guarantee {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.25);
  color: #4ade80; font-size: 12px; font-weight: 600;
  border-radius: 99px; padding: 8px 16px; margin: 20px 0 28px;
}
.bespoke-cta {
  display: block; text-align: center;
  background: linear-gradient(to right, #4A42CC, #217CEB);
  color: var(--white); font-family: var(--font-display);
  font-weight: 600; font-size: 15px; padding: 16px;
  border-radius: 14px; text-decoration: none; border: none; cursor: pointer;
  width: 100%; transition: opacity .2s;
}
.bespoke-cta:hover { opacity: .9; }
.bespoke-learn {
  display: block; text-align: center;
  font-size: 14px; font-weight: 600; color: #4A42CC;
  margin-top: 12px; text-decoration: none;
}
.bespoke-learn:hover { text-decoration: underline; }
.bespoke-feats { display: flex; flex-direction: column; gap: 16px; }
.bespoke-feat { display: flex; align-items: flex-start; gap: 12px; }
.bespoke-feat-chk { color: #217CEB; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
.bespoke-feat-text { font-size: 14px; color: var(--muted); line-height: 1.55; }

/* ── TESTIMONIALS ── */
.testi-section { background: rgba(19,21,30,.6); padding: 80px 0; }
.testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
.testi-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 16px; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 16px;
  transition: border-color .2s;
  position: relative;
}
.testi-card:hover { border-color: rgba(79,110,247,.25); }
.testi-quote-mark {
  position: absolute; top: 20px; left: 20px;
  font-size: 56px; line-height: 1; color: rgba(79,110,247,.2);
  font-family: Georgia, serif; pointer-events: none;
}
.testi-stars { display: flex; gap: 3px; }
.testi-star { color: #facc15; font-size: 16px; }
.testi-quote { font-size: 14px; color: var(--text); line-height: 1.65; flex: 1; }
.testi-quote strong { color: var(--white); }
.testi-meta { display: flex; align-items: center; gap: 12px; }
.testi-av {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #217CEB, #4A42CC);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; color: var(--white); flex-shrink: 0;
}
.testi-name { font-weight: 600; font-size: 13px; color: var(--white); }
.testi-role { font-size: 12px; color: var(--muted); }
.testi-metric {
  position: absolute; top: 20px; right: 20px;
  font-size: 11px; font-weight: 700; color: #3b82f6;
  background: rgba(59,130,246,.1); border-radius: 8px; padding: 4px 10px;
}

/* ── FAQ ── */
.faq-section { background: var(--surface); padding: 96px 0; border-top: 1px solid rgba(255,255,255,.07); }
.faq-list { max-width: 760px; margin: 40px auto 0; }
.faq-item { border: 1px solid rgba(255,255,255,.07); border-radius: 16px; overflow: hidden; margin-bottom: 12px; transition: border-color .2s; }
.faq-item:hover, .faq-item.open { border-color: rgba(79,110,247,.25); }
.faq-q {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; cursor: pointer;
  font-size: 14px; font-weight: 600; color: var(--white);
  background: var(--surface); transition: background .15s, color .15s;
  gap: 20px;
}
.faq-q:hover { background: var(--surface2); color: var(--accent); }
.faq-icon {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--muted); flex-shrink: 0;
  transition: all .3s;
}
.faq-item.open .faq-icon {
  background: rgba(79,110,247,.12); color: var(--accent); transform: rotate(45deg);
}
.faq-a {
  display: none; padding: 0 24px 20px;
  font-size: 14px; color: var(--muted); line-height: 1.7;
  background: var(--surface2); border-top: 1px solid rgba(255,255,255,.07);
}
.faq-item.open .faq-a { display: block; }

/* ── FAQ STILL HAVE QUESTIONS ── */
.faq-contact {
  max-width: 760px; margin: 48px auto 0; text-align: center;
  background: var(--surface2); border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px; padding: 32px;
}
.faq-contact h3 { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--white); margin-bottom: 6px; }
.faq-contact p { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
.faq-btns { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.faq-btn-primary {
  font-size: 14px; font-weight: 600; color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  padding: 10px 20px; border-radius: 12px; text-decoration: none;
  transition: opacity .2s;
}
.faq-btn-primary:hover { opacity: .9; }
.faq-btn-ghost {
  font-size: 14px; font-weight: 600; color: var(--accent);
  border: 1px solid rgba(79,110,247,.25);
  background: var(--surface); padding: 10px 20px; border-radius: 12px; text-decoration: none;
  transition: border-color .2s;
}
.faq-btn-ghost:hover { border-color: var(--accent); }

/* ── FINAL CTA ── */
.final-cta {
  padding: 100px 0; text-align: center;
  position: relative; overflow: hidden;
}
.final-cta::before {
  content: '';
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(79,110,247,.12) 0%, transparent 70%);
  pointer-events: none;
}
.final-cta h2 {
  font-family: var(--font-display);
  font-size: clamp(28px, 5vw, 50px);
  font-weight: 800; letter-spacing: -1px;
  color: var(--white); margin-bottom: 14px;
}
.final-cta p { font-size: 17px; color: var(--muted); margin-bottom: 34px; }
.cta-perks {
  display: flex; align-items: center;
  justify-content: center; gap: 24px;
  margin-top: 20px; flex-wrap: wrap;
}
.cta-perk {
  font-size: 13px; color: var(--muted);
  display: flex; align-items: center; gap: 6px;
}
.cta-perk::before { content: '✓'; color: var(--green); font-weight: 700; }

/* ── STICKY BARS ── */
.sticky-bar-desktop {
  display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  align-items: center; gap: 16px;
  background: var(--surface); border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px; padding: 14px 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,.4); z-index: 50;
  backdrop-filter: blur(8px);
}
@media (min-width: 768px) { .sticky-bar-desktop { display: flex; } }
.sticky-avatars { display: flex; }
.sticky-av {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  border: 2px solid var(--surface);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: var(--white);
}
.sticky-av + .sticky-av { margin-left: -8px; }
.sticky-text { font-size: 14px; color: var(--muted); }
.sticky-text strong { color: var(--white); }
.sticky-divider { width: 1px; height: 20px; background: rgba(255,255,255,.07); }
.sticky-cta {
  font-size: 14px; font-weight: 600; color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  padding: 8px 20px; border-radius: 12px; text-decoration: none;
  box-shadow: 0 2px 10px rgba(79,110,247,.3); transition: opacity .2s;
}
.sticky-cta:hover { opacity: .9; }
.sticky-close {
  background: none; border: none; cursor: pointer;
  font-size: 18px; color: var(--muted); line-height: 1; padding: 0;
  transition: color .2s;
}
.sticky-close:hover { color: var(--white); }

.sticky-bar-mobile {
  display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: var(--surface); border-top: 1px solid rgba(255,255,255,.07);
  box-shadow: 0 -4px 24px rgba(0,0,0,.3);
  padding: 12px 16px; align-items: center; justify-content: space-between; gap: 12px;
}
@media (min-width: 768px) { .sticky-bar-mobile { display: none; } }
.sticky-mobile-text {}
.sticky-mobile-text p:first-child { font-size: 12px; font-weight: 600; color: var(--white); }
.sticky-mobile-text p:last-child  { font-size: 10px; color: var(--muted); }
.sticky-mobile-cta {
  flex-shrink: 0; font-size: 14px; font-weight: 600; color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  padding: 10px 20px; border-radius: 12px; text-decoration: none;
  white-space: nowrap; transition: opacity .2s;
}
.sticky-mobile-cta:hover { opacity: .9; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .fv-cats     { grid-template-columns: repeat(2, 1fr); }
  .testi-grid  { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .plans-grid  { grid-template-columns: 1fr; }
  .plan-card.popular { transform: none; }
  .bespoke-body { grid-template-columns: 1fr; }
  .testi-grid  { grid-template-columns: 1fr; }
  .pricing-hero-inner { flex-direction: column; align-items: flex-start; }
  .billing-label, .billing-savings { text-align: left; }
}
@media (max-width: 600px) {
  .fv-cats { grid-template-columns: 1fr; }
}

/* ── PRICING JS STATE ── */
.price-monthly { display: inline; }
.price-annual  { display: none; }
body.billing-monthly .price-monthly { display: inline; }
body.billing-monthly .price-annual  { display: none; }
body.billing-annual  .price-monthly { display: none; }
body.billing-annual  .price-annual  { display: inline; }
body.billing-monthly .annual-only { display: none; }
body.billing-annual  .annual-only { display: inline; }
body.billing-monthly .savings-text { display: none; }
body.billing-annual  .savings-text { display: block; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

<!-- ════════════════════════════════ HERO ════════════════════════════════ -->
<div class="pricing-hero">
  <div class="pricing-hero-inner">
    <div class="pricing-hero-left">
      <p class="eyebrow-label">Pricing</p>
      <h1>Simple pricing<br>that grows with you</h1>
      <p>Choose a plan that fits today. Upgrade anytime as you scale — all plans include every core feature.</p>
      <div class="launch-badge">
        <span>✨</span>
        <span>Launch Offer — First 100 users lock lifetime pricing</span>
      </div>
    </div>
    <div class="pricing-hero-right">
      <p class="billing-label">Billing cycle</p>
      <div class="billing-toggle">
        <button class="billing-btn" id="btn-monthly" onclick="window._setPricing('monthly')">Monthly</button>
        <button class="billing-btn active" id="btn-annual" onclick="window._setPricing('annual')">
          Annually<span class="save-badge">Save 40%</span>
        </button>
      </div>
      <p class="billing-savings" id="billing-savings">🎉 You save up to $1,200/year on Agency</p>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ PLAN CARDS ═══════════════════════════════ -->
<div class="plans-section">
  <div class="plans-grid">

    <!-- STARTER -->
    <div class="plan-card">
      <div class="plan-header">
        <div>
          <p class="plan-name">Starter</p>
          <p class="plan-sub">Best for solo creators &amp; small blogs</p>
        </div>
        <p class="plan-tagline">Launch fast, learn faster.</p>
        <div class="plan-price-row">
          <span class="plan-price">$<span class="price-monthly">29</span><span class="price-annual">17</span></span>
          <span class="plan-price-unit">/mo</span>
        </div>
        <p class="plan-billed annual-only">billed annually</p>
        <p class="plan-cost-per">Only <strong>$2.90</strong> per article</p>
        <p class="plan-savings savings-text">You save $144/year</p>
        <a href="/register" class="plan-cta">Get Started</a>
        <p class="plan-trial">$1 trial · Cancel anytime</p>
      </div>
      <div class="plan-features">
        <div class="plan-feat-item"><span class="chk">✓</span><span>1,000 credits / month <span class="note">(≈ 10 AI articles)</span></span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>1 AutoPublish campaign</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>50 keyword researches / mo</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>1 CMS connection</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>1 project</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>1 team member</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>5 GB image storage</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>AI article writer (150+ languages)</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Featured &amp; in-article images</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Internal &amp; external linking</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Auto keyword research</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>All CMS integrations</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>100 API calls / month</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>48h support response</span></div>
        <div class="plan-not-incl">
          <p class="plan-not-incl-label">Not included</p>
          <div class="plan-feat-item excl"><span class="chk">✕</span><span>LLM Brand Visibility Tracker</span></div>
          <div class="plan-feat-item excl"><span class="chk">✕</span><span>AI SEO Editor</span></div>
          <div class="plan-feat-item excl"><span class="chk">✕</span><span>Knowledge Bases</span></div>
          <div class="plan-feat-item excl"><span class="chk">✕</span><span>White-label SEO reports</span></div>
          <div class="plan-feat-item excl"><span class="chk">✕</span><span>Sub-accounts</span></div>
        </div>
      </div>
    </div>

    <!-- PRO (popular) -->
    <div class="plan-card popular">
      <span class="popular-badge">⚡ Most Popular</span>
      <div class="plan-header">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;">
          <div>
            <p class="plan-name">Pro</p>
            <p class="plan-sub">Best for growing SEO teams</p>
          </div>
          <div class="best-value-tag">⚡ Best value</div>
        </div>
        <p class="plan-tagline">Grow with confidence.</p>
        <div class="plan-price-row">
          <span class="plan-price">$<span class="price-monthly">79</span><span class="price-annual">47</span></span>
          <span class="plan-price-unit">/mo</span>
        </div>
        <p class="plan-billed annual-only">billed annually</p>
        <p class="plan-cost-per">Only <strong>$1.58</strong> per article</p>
        <p class="plan-savings savings-text">You save $384/year</p>
        <p class="plan-savings" style="margin-top:2px;">Best value for growing teams</p>
        <a href="/register" class="plan-cta">Get Started</a>
        <p class="plan-trial">$1 trial · Cancel anytime</p>
      </div>
      <div class="plan-features">
        <div class="plan-feat-item"><span class="chk">✓</span><span>2,000 credits / month <span class="note">(≈ 50 AI articles)</span></span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>5 AutoPublish campaigns</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>200 keyword researches / mo</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>3 CMS connections</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>5 projects</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>3 team members</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>25 GB image storage</span></div>
        <div class="plan-feat-sep">Everything in Starter, plus:</div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>LLM Brand Visibility Tracker <span class="badge-new">NEW</span></span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>AI SEO Editor</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Custom content templates</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>3 knowledge bases</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>White-label SEO reports</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Up to 1 sub-account</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Auto-translate (150+ languages)</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Custom AI-generated images</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Webhooks</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>1,000 API calls / month</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>25 LLM prompts tracked / mo</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>24h support response</span></div>
      </div>
    </div>

    <!-- AGENCY -->
    <div class="plan-card">
      <div class="plan-header">
        <p class="plan-name">Agency</p>
        <p class="plan-sub">Best for agencies &amp; enterprise sites</p>
        <p class="plan-tagline">Built for scale &amp; serious ROI.</p>
        <div class="plan-price-row">
          <span class="plan-price">$<span class="price-monthly">199</span><span class="price-annual">119</span></span>
          <span class="plan-price-unit">/mo</span>
        </div>
        <p class="plan-billed annual-only">billed annually</p>
        <p class="plan-cost-per">Only <strong>$1.33</strong> per article</p>
        <p class="plan-savings savings-text">You save $960/year</p>
        <a href="/call" class="plan-cta">Talk to Sales</a>
        <p class="plan-trial">Custom pricing · No lock-in</p>
      </div>
      <div class="plan-features">
        <div class="plan-feat-item"><span class="chk">✓</span><span>8,000 credits / month <span class="note">(≈ 150 AI articles)</span></span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited AutoPublish campaigns</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited keyword research</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited CMS connections</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited projects</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited team members</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>100 GB image storage</span></div>
        <div class="plan-feat-sep">Everything in Pro, plus:</div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited workspaces</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited sub-accounts</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited LLM prompts tracked</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Unlimited knowledge bases</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Public API access</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>White-label &amp; custom domain</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Client portal</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Live chat support on Slack</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>Strategy support</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>4h support response</span></div>
        <div class="plan-feat-item"><span class="chk">✓</span><span>99.9% uptime SLA</span></div>
      </div>
    </div>

  </div><!-- /plans-grid -->

  <div class="trial-reminder">
    <p class="trial-pill">🔒 $1 trial for 3 days on Starter &amp; Pro · Cancel anytime · No questions asked</p>
  </div>
</div><!-- /plans-section -->

<!-- ═══════════════════════ TRAFFIC PROOF STRIP ══════════════════════════ -->
<section class="strip-section">
  <p class="strip-label">Real results from real teams</p>
  <div class="strip-track-wrapper">
    <div class="strip-fade-l"></div>
    <div class="strip-fade-r"></div>
    <div class="strip-track" id="strip-track">
      <div class="strip-item"><span class="strip-item-stat">0 → 2,600/mo</span><span class="strip-item-sub">in 120 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">100 → 4,500/mo</span><span class="strip-item-sub">in 150 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 5,800/mo</span><span class="strip-item-sub">in 30 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 8,000/mo</span><span class="strip-item-sub">in 8 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 6,000/mo</span><span class="strip-item-sub">in 5 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">1k → 24,000/mo</span><span class="strip-item-sub">in 12 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 14,000/mo</span><span class="strip-item-sub">in 60 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">600 → 6,000/mo</span><span class="strip-item-sub">in 9 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 1,600/mo</span><span class="strip-item-sub">in 60 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">4k → 14,000/mo</span><span class="strip-item-sub">in 90 days</span><span class="strip-item-arr">↑</span></div>
      <!-- duplicated for seamless loop -->
      <div class="strip-item"><span class="strip-item-stat">0 → 2,600/mo</span><span class="strip-item-sub">in 120 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">100 → 4,500/mo</span><span class="strip-item-sub">in 150 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 5,800/mo</span><span class="strip-item-sub">in 30 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 8,000/mo</span><span class="strip-item-sub">in 8 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 6,000/mo</span><span class="strip-item-sub">in 5 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">1k → 24,000/mo</span><span class="strip-item-sub">in 12 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 14,000/mo</span><span class="strip-item-sub">in 60 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">600 → 6,000/mo</span><span class="strip-item-sub">in 9 months</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">0 → 1,600/mo</span><span class="strip-item-sub">in 60 days</span><span class="strip-item-arr">↑</span></div>
      <div class="strip-item"><span class="strip-item-stat">4k → 14,000/mo</span><span class="strip-item-sub">in 90 days</span><span class="strip-item-arr">↑</span></div>
    </div>
  </div>
</section>

<!-- ═════════════════════ FEATURE VALUE SECTION ══════════════════════════ -->
<section class="fv-section">
  <div class="container">
    <div class="section-header">
      <p class="section-label">Everything included</p>
      <h2 class="section-title">The most complete AI content platform</h2>
      <p class="section-sub">Every plan includes the full writing stack. Higher plans unlock LLM tracking, white-labelling, and agency-scale automation.</p>
    </div>
    <div class="fv-cats">

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#3b82f6;"></div><p class="fv-cat-label" style="color:#60a5fa;">AI Writing</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">AI Content Writer (150+ languages)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">AI SEO Editor with custom prompts</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">News Writer</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">Video to Blog Post</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">Custom content templates</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">Brand voice training</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">Featured &amp; in-article image generation</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">YouTube video embeds</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(59,130,246,.15);color:#3b82f6;">✓</div><span class="fv-feat-text">Table of contents generation</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#8b5cf6;"></div><p class="fv-cat-label" style="color:#a78bfa;">Automation</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">AutoPublish (set-and-forget campaigns)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">RSS / keyword / news feed ingestion</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">Auto-social posting on publish</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">AI SEO Agent (autopilot fixes)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">Schema markup injection</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">Internal linking automation</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">Broken link detection &amp; repair</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(139,92,246,.15);color:#8b5cf6;">✓</div><span class="fv-feat-text">Google fast-indexing on publish</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#6366f1;"></div><p class="fv-cat-label" style="color:#818cf8;">LLM &amp; AI Visibility</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">LLM Brand Visibility Tracker</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">ChatGPT mention monitoring</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Perplexity citation tracking</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Gemini, Claude &amp; Grok coverage</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Google AI Overviews tracking</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Share-of-voice vs competitors</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Sentiment analysis</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(99,102,241,.15);color:#6366f1;">✓</div><span class="fv-feat-text">Competitor benchmarking</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#06b6d4;"></div><p class="fv-cat-label" style="color:#22d3ee;">SEO &amp; Research</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">Keyword research &amp; clustering</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">Auto keyword research on publish</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">Internal &amp; external link suggestions</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">SEO score per article</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">White-label SEO reports</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">Structured data (FAQ, How-To schema)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(6,182,212,.15);color:#06b6d4;">✓</div><span class="fv-feat-text">Duplicate content prevention</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#10b981;"></div><p class="fv-cat-label" style="color:#34d399;">Knowledge Base</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(16,185,129,.15);color:#10b981;">✓</div><span class="fv-feat-text">Upload websites, docs, PDFs</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(16,185,129,.15);color:#10b981;">✓</div><span class="fv-feat-text">Brand voice learning phase</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(16,185,129,.15);color:#10b981;">✓</div><span class="fv-feat-text">Context-aware article generation</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(16,185,129,.15);color.#10b981;">✓</div><span class="fv-feat-text">Per-client knowledge isolation</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(16,185,129,.15);color:#10b981;">✓</div><span class="fv-feat-text">Auto-apply to new content</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#f97316;"></div><p class="fv-cat-label" style="color:#fb923c;">Publishing</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">WordPress one-click publish</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Shopify blog integration</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Ghost, Webflow, Wix, Squarespace</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Zapier integration</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Public API access (Agency)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Bulk article generation &amp; export</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(249,115,22,.15);color:#f97316;">✓</div><span class="fv-feat-text">Auto-translate (150+ languages)</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#f43f5e;"></div><p class="fv-cat-label" style="color:#fb7185;">Teams &amp; Agency</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">Multi-project management</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">Team member roles</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">Sub-accounts per client</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">Client portal (Agency)</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">White-label &amp; custom domain</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(244,63,94,.15);color:#f43f5e;">✓</div><span class="fv-feat-text">Unlimited workspaces</span></div>
      </div>

      <div class="fv-cat">
        <div class="fv-cat-header"><div class="fv-cat-dot" style="background:#f59e0b;"></div><p class="fv-cat-label" style="color:#fbbf24;">Analytics</p></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">Content performance dashboard</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">Organic traffic tracking</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">Keyword ranking insights</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">AI citation &amp; mention reports</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">White-label client reports</span></div>
        <div class="fv-feat-item"><div class="fv-feat-chk" style="background:rgba(245,158,11,.15);color:#f59e0b;">✓</div><span class="fv-feat-text">Scheduled report delivery</span></div>
      </div>

    </div>
    <p class="fv-bottom">New features ship weekly. <a href="/resources/learn">See what's new →</a></p>
  </div>
</section>

<!-- ══════════════════════ FULL COMPARISON TABLE ══════════════════════════ -->
<div class="compare-section" style="padding-top:80px;">
  <div class="compare-header">
    <h2>Compare plans in full</h2>
    <p>Every feature, side by side</p>
  </div>
  <div class="compare-wrap">
    <table class="compare-table">
      <thead>
        <tr>
          <th style="text-align:left;">Feature</th>
          <th>Starter</th>
          <th class="th-pro">Pro<span class="th-sub">Most Popular</span></th>
          <th>Agency</th>
        </tr>
      </thead>
      <tbody>
        <tr class="cat-row"><td colspan="4" class="cat-label">AI Writing</td></tr>
        <tr><td>AI article writer</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr class="hl-row"><td class="hl-feat">Credits / month</td><td>1,000</td><td class="pro-col">2,000</td><td>8,000</td></tr>
        <tr><td>Articles / month (est.)</td><td>~10</td><td class="pro-col">~50</td><td>~150</td></tr>
        <tr><td>150+ languages</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>AI SEO Editor</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>News Writer</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Custom content templates</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Auto-translate</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">Knowledge Base</td></tr>
        <tr><td>Knowledge bases</td><td class="chk-n">✕</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>Upload websites, PDFs, docs</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">Automation</td></tr>
        <tr class="hl-row"><td class="hl-feat">AutoPublish campaigns</td><td>1</td><td class="pro-col">5</td><td>Unlimited</td></tr>
        <tr><td>Google fast-indexing</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>AI SEO Agent (autopilot)</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Schema markup injection</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Internal link automation</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">LLM Brand Visibility</td></tr>
        <tr class="hl-row"><td class="hl-feat">LLM Brand Visibility Tracker<span class="badge-new-sm">NEW</span></td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>LLM prompts tracked / mo</td><td>—</td><td class="pro-col">25</td><td>Unlimited</td></tr>
        <tr><td>Platforms tracked</td><td>—</td><td class="pro-col">6 platforms</td><td>6 platforms</td></tr>
        <tr><td>Competitor tracking</td><td class="chk-n">✕</td><td class="pro-col">3 competitors</td><td>Unlimited</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">Publishing &amp; Integrations</td></tr>
        <tr><td>CMS connections</td><td>1</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>WordPress, Shopify, Webflow…</td><td>✓</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Webhooks</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Public API access</td><td class="chk-n">✕</td><td class="pro-col chk-n">✕</td><td>✓</td></tr>
        <tr><td>API calls / month</td><td>100</td><td class="pro-col">1,000</td><td>Unlimited</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">Team &amp; Agency</td></tr>
        <tr><td>Projects</td><td>1</td><td class="pro-col">5</td><td>Unlimited</td></tr>
        <tr><td>Team members</td><td>1</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>Sub-accounts / clients</td><td>—</td><td class="pro-col">1</td><td>Unlimited</td></tr>
        <tr><td>White-label &amp; custom domain</td><td class="chk-n">✕</td><td class="pro-col chk-n">✕</td><td>✓</td></tr>
        <tr><td>Client portal</td><td class="chk-n">✕</td><td class="pro-col chk-n">✕</td><td>✓</td></tr>
        <tr><td>White-label SEO reports</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>

        <tr class="cat-row"><td colspan="4" class="cat-label">Storage &amp; Support</td></tr>
        <tr><td>Image storage</td><td>5 GB</td><td class="pro-col">25 GB</td><td>100 GB</td></tr>
        <tr><td>Support response time</td><td>48h</td><td class="pro-col">24h</td><td>4h</td></tr>
        <tr><td>Live chat on Slack</td><td class="chk-n">✕</td><td class="pro-col chk-n">✕</td><td>✓</td></tr>
        <tr><td>99.9% uptime SLA</td><td class="chk-n">✕</td><td class="pro-col chk-n">✕</td><td>✓</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════ QUICK COMPARISON ══════════════════════════════ -->
<div class="qc-section">
  <h2>Quick comparison</h2>
  <div class="qc-wrap">
    <table class="qc-table">
      <thead>
        <tr>
          <th style="text-align:left;">Feature</th>
          <th>Starter</th>
          <th class="th-pro">Pro</th>
          <th>Agency</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Articles / month</td><td>~10</td><td class="pro-col">~50</td><td>~150</td></tr>
        <tr><td>AutoPublish campaigns</td><td>1</td><td class="pro-col">5</td><td>Unlimited</td></tr>
        <tr><td>Team members</td><td>1</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>Projects</td><td>1</td><td class="pro-col">5</td><td>Unlimited</td></tr>
        <tr><td>CMS connections</td><td>1</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>LLM Visibility Tracker</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>AI SEO Editor</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>Knowledge Bases</td><td class="chk-n">✕</td><td class="pro-col">3</td><td>Unlimited</td></tr>
        <tr><td>White-label reports</td><td class="chk-n">✕</td><td class="pro-col chk-y">✓</td><td>✓</td></tr>
        <tr><td>API access</td><td>100 calls</td><td class="pro-col">1,000 calls</td><td>Unlimited</td></tr>
        <tr><td>Sub-accounts</td><td class="chk-n">✕</td><td class="pro-col">1</td><td>Unlimited</td></tr>
        <tr><td>Image storage</td><td>5 GB</td><td class="pro-col">25 GB</td><td>100 GB</td></tr>
        <tr><td>Support response</td><td>48h</td><td class="pro-col">24h</td><td>4h</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════ BESPOKE SERVICE ══════════════════════════════ -->
<section class="bespoke-section">
  <div class="bespoke-inner">
    <div class="bespoke-card">
      <div class="bespoke-banner">✨ Limited Cohort — Only 10 Companies Accepted per Month</div>
      <div class="bespoke-body">
        <div>
          <div class="bespoke-tag">Done-for-you service</div>
          <h2 class="bespoke-heading">
            <span class="grad">Bespoke AI Content</span><br>
            <span style="color:var(--white);">Service</span>
          </h2>
          <p class="bespoke-p">We run your entire content operation for you — research, writing, publishing, and LLM visibility — managed by human strategists on top of our AI platform.</p>
          <p class="bespoke-price-label">Starting from</p>
          <div class="bespoke-price-row">
            <span class="bespoke-price">$2,000</span>
            <span class="bespoke-price-unit">/mo</span>
          </div>
          <div class="bespoke-guarantee">✓ 25% traffic growth in 90 days — guaranteed or you don't pay</div>
          <a href="/call" class="bespoke-cta">Schedule Strategy Call</a>
          <a href="/bespoke" class="bespoke-learn">Learn more about the service →</a>
        </div>
        <div class="bespoke-feats">
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Guaranteed 25% increase in organic traffic in 90 days — or you don't pay</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">10–20 ready-to-publish, human-edited articles every month</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">AI Search Optimisation (ChatGPT, Perplexity, Claude, Gemini, Grok)</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">1 in-depth topic cluster per month (30-day content sprints)</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Full LLM Brand Visibility monitoring &amp; reporting</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Internal linking &amp; on-page SEO handled for you</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Monthly strategy call with a dedicated content strategist</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">White-label SEO &amp; LLM reports (Agency add-on)</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Backlink building available as add-on</span></div>
          <div class="bespoke-feat"><span class="bespoke-feat-chk">✓</span><span class="bespoke-feat-text">Agency plan access included during engagement</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════ TESTIMONIALS ═════════════════════════════════ -->
<section class="testi-section">
  <div class="container">
    <div class="section-header">
      <p class="section-label">💬 What customers say</p>
      <h2 class="section-title">Loved by content teams worldwide</h2>
      <p class="section-sub">Join 10,000+ content creators who trust Infin8Content</p>
    </div>
    <div class="testi-grid">

      <div class="testi-card">
        <div class="testi-quote-mark">"</div>
        <div class="testi-stars"><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span></div>
        <p class="testi-quote">Infin8Content helped us increase our content output by 400% while maintaining quality. Our SEO rankings have never been better.</p>
        <span class="testi-metric">+400% Output</span>
        <div class="testi-meta">
          <div class="testi-av">SC</div>
          <div><p class="testi-name">Sarah Chen</p><p class="testi-role">Head of Content @ TechFlow</p></div>
        </div>
      </div>

      <div class="testi-card">
        <div class="testi-quote-mark">"</div>
        <div class="testi-stars"><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span></div>
        <p class="testi-quote">The brand voice feature is a game-changer. Every article sounds like us, no matter who writes it.</p>
        <span class="testi-metric">100% Brand Consistency</span>
        <div class="testi-meta">
          <div class="testi-av">MR</div>
          <div><p class="testi-name">Marcus Rodriguez</p><p class="testi-role">Marketing Director @ GrowthLabs</p></div>
        </div>
      </div>

      <div class="testi-card">
        <div class="testi-quote-mark">"</div>
        <div class="testi-stars"><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span><span class="testi-star">★</span></div>
        <p class="testi-quote">We went from 2 articles per week to 2 per day. Same team. Better results.</p>
        <span class="testi-metric">10x Faster</span>
        <div class="testi-meta">
          <div class="testi-av">ET</div>
          <div><p class="testi-name">Emma Thompson</p><p class="testi-role">Founder @ ContentCo Agency</p></div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ═══════════════════════════ FAQ ═══════════════════════════════════════ -->
<section class="faq-section">
  <div class="container">
    <div class="section-header">
      <p class="section-label">FAQ</p>
      <h2 class="section-title">Questions? We've got answers.</h2>
      <p class="section-sub">Everything you need to know about Infin8Content pricing and features.</p>
    </div>
    <div class="faq-list">

      <div class="faq-item">
        <div class="faq-q">Will AI-generated content rank on Google?<div class="faq-icon">+</div></div>
        <div class="faq-a">Yes. Google rewards high-quality, helpful content regardless of how it's produced. Infin8Content creates structured, factual, and SEO-optimized articles that follow Google's E-E-A-T guidelines. Every plan includes brand voice training so your content sounds authentically human — not generic AI.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">What is the LLM Brand Visibility Tracker and which plans include it?<div class="faq-icon">+</div></div>
        <div class="faq-a">The LLM Brand Visibility Tracker monitors how ChatGPT, Perplexity, Gemini, Claude, Grok, and Google AI Overviews mention and recommend your brand. It tracks share-of-voice, sentiment, citations, and competitor mentions. It's included in the Pro and Agency plans — and unlike other tools that charge $99–199 per AI platform, all 6 platforms are included in one price.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">What are credits and how do they work?<div class="faq-icon">+</div></div>
        <div class="faq-a">Credits are consumed each time you generate content, run the AI SEO Agent, or use other AI-powered features. Starter gets 1,000 credits/month (~10 full articles), Pro gets 2,000 (~50 articles), and Agency gets 8,000 (~150 articles). Unused credits do not roll over, but you can upgrade at any time to unlock more.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">How does AutoPublish work?<div class="faq-icon">+</div></div>
        <div class="faq-a">AutoPublish lets you set up a campaign that automatically generates and publishes SEO-optimized content to your CMS on a schedule you define. You connect a feed source (RSS, keywords, YouTube videos, news events), set your publishing frequency, and Infin8Content handles the rest — writing, image generation, linking, and publishing.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">Can I use this for multiple clients?<div class="faq-icon">+</div></div>
        <div class="faq-a">Yes. Pro includes 1 sub-account and 5 projects. Agency includes unlimited sub-accounts, unlimited workspaces, a client portal, and white-label reports — built specifically for agencies managing multiple clients from one dashboard.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">What CMS platforms do you integrate with?<div class="faq-icon">+</div></div>
        <div class="faq-a">We integrate natively with WordPress, Shopify, Ghost, Webflow, Wix, Squarespace, and Blogger. We also support Zapier (connects to 5,000+ tools), webhooks, and a public API (Agency plan) for fully custom integrations.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">How does the brand voice feature work?<div class="faq-icon">+</div></div>
        <div class="faq-a">Upload your style guide, sample articles, website URL, or brand documents. Our AI enters a learning phase to understand your tone, vocabulary, and content patterns — then applies them automatically to every piece of content generated for that project.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">How is Infin8Content different from ChatGPT or other AI writers?<div class="faq-icon">+</div></div>
        <div class="faq-a">Infin8Content is a complete, end-to-end content operations system — not a text generator. ChatGPT gives you text. Infin8Content automates the full workflow: keyword research, brief generation, writing in your brand voice, adding images and links, CMS publishing, scheduling, LLM visibility tracking, SEO fixes via the AI Agent, and white-label client reporting.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">Do you offer a free trial?<div class="faq-icon">+</div></div>
        <div class="faq-a">We offer a $1 trial for 3 days on Starter and Pro plans. This gives you full access to every feature in your plan — enough to publish your first articles and see results. Cancel any time with no questions asked.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">What kind of support do you provide?<div class="faq-icon">+</div></div>
        <div class="faq-a">Starter plans receive email support with a 48h response time. Pro plans get 24h response. Agency plans get a 4h response time plus live chat on Slack and access to strategy support from our team.</div>
      </div>

      <div class="faq-item">
        <div class="faq-q">What is the Bespoke AI Content Service?<div class="faq-icon">+</div></div>
        <div class="faq-a">It's a done-for-you service starting at $2,000/month where our human strategists manage your entire content operation using Infin8Content. You get 10–20 published articles per month, an in-depth topic cluster, LLM visibility reporting, and a 25% traffic growth guarantee in 90 days — or you don't pay. Only 10 companies are accepted per cohort.</div>
      </div>

    </div>

    <div class="faq-contact">
      <h3>Still have questions?</h3>
      <p>Our team typically responds within a few hours.</p>
      <div class="faq-btns">
        <a href="mailto:hello@infin8content.com" class="faq-btn-primary">Email us</a>
        <a href="/call" class="faq-btn-ghost">Book a demo</a>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════════════════ FINAL CTA ══════════════════════════════ -->
<section class="final-cta">
  <div class="container" style="position:relative;">
    <h2>Start building content<br>that earns authority</h2>
    <p>One trial article included. No credit card required.</p>
    <a href="/register" class="btn btn-primary btn-lg">Start Free Trial</a>
    <div class="cta-perks">
      <span class="cta-perk">$1 trial · 3 days full access</span>
      <span class="cta-perk">Cancel anytime</span>
      <span class="cta-perk">No credit card required</span>
    </div>
  </div>
</section>

</main>

<!-- ══════════════════════════ STICKY BARS ═══════════════════════════════ -->
<div class="sticky-bar-desktop" id="sticky-desktop">
  <div class="sticky-avatars">
    <div class="sticky-av">JL</div>
    <div class="sticky-av">MR</div>
    <div class="sticky-av">AK</div>
  </div>
  <span class="sticky-text">Most teams choose <strong>Pro</strong></span>
  <div class="sticky-divider"></div>
  <a href="/register" class="sticky-cta">Upgrade to Pro</a>
  <button class="sticky-close" onclick="document.getElementById('sticky-desktop').style.display='none'">✕</button>
  </div>

<div class="sticky-bar-mobile">
  <div class="sticky-mobile-text">
    <p>Most teams choose <span style="color:var(--accent);">Pro</span></p>
    <p>$1 trial · Cancel anytime</p>
  </div>
  <a href="/register" class="sticky-mobile-cta">Try Pro →</a>
</div>

<script>
// Billing toggle — sets body class and syncs button state
window._setPricing = function(mode) {
  document.body.classList.remove('billing-monthly', 'billing-annual');
  document.body.classList.add('billing-' + mode);
  document.getElementById('btn-monthly').classList.toggle('active', mode === 'monthly');
  document.getElementById('btn-annual').classList.toggle('active', mode === 'annual');
  var savingsEl = document.getElementById('billing-savings');
  if (savingsEl) savingsEl.style.display = mode === 'annual' ? 'block' : 'none';
};
// Default: annual
window._setPricing('annual');
</script>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  return <MarketingPageBody html={html} css={css} />;
}
