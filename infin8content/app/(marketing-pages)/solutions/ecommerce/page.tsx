'use client';

/**
 * /solutions/ecommerce — rebuilt to exactly match /ai-content-writer
 *
 * Layout system : MarketingShell (wrapper) + MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 *
 * Drop-in usage:
 *   Place at /app/(marketing-pages)/solutions/ecommerce/page.tsx
 */

import MarketingShell    from '@/components/marketing/MarketingShell';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — identical token names to /ai-content-writer & /solutions/saas
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
  line-height: 1.65; max-width: 520px; margin: 0 auto;
}

/* ── HERO ── */
.hero {
  padding: 80px 0 64px;
  text-align: center;
  position: relative; overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute; top: -80px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 600px;
  background: radial-gradient(circle, rgba(79,110,247,.13) 0%, transparent 70%);
  pointer-events: none;
}
.eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  border-radius: 20px; padding: 5px 14px;
  font-size: 13px; font-weight: 500; color: #a5b4fc;
  margin-bottom: 22px;
}
.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(32px, 5.2vw, 58px);
  font-weight: 800; line-height: 1.07; letter-spacing: -1.5px;
  color: var(--white); max-width: 820px; margin: 0 auto 18px;
}
.hero h1 .accent { color: var(--accent); font-style: italic; }
.hero-sub {
  font-size: 18px; color: var(--muted);
  max-width: 560px; margin: 0 auto 30px; line-height: 1.65;
}
.hero-actions {
  display: flex; align-items: center;
  justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 28px;
}
.hero-perks {
  display: flex; align-items: center;
  justify-content: center; gap: 20px;
  font-size: 13px; color: var(--muted); flex-wrap: wrap;
}
.hero-perks span::before { content: '✓'; color: var(--green); font-weight: 700; margin-right: 5px; }

/* ── BENEFITS GRID (4-up centered cards) ── */
.benefits-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
}
.benefit-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 22px;
  text-align: center; transition: all .2s;
}
.benefit-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-3px); }
.benefit-icon { font-size: 36px; margin-bottom: 16px; }
.benefit-card h4 {
  font-family: var(--font-display); font-size: 15px;
  font-weight: 600; color: var(--white); margin-bottom: 8px;
}
.benefit-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

/* ── FEATURE GRID (4-up strip) ── */
.feat-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; overflow: hidden;
}
.feat-cell {
  background: var(--surface); padding: 26px 22px;
  transition: background .2s;
}
.feat-cell:hover { background: var(--surface2); }
.feat-cell .fc-icon { font-size: 22px; margin-bottom: 12px; }
.feat-cell h4 {
  font-family: var(--font-display); font-size: 14px;
  font-weight: 600; color: var(--white); margin-bottom: 7px;
}
.feat-cell p { font-size: 13px; color: var(--muted); line-height: 1.55; }

/* ── FEATURE ROWS ── */
.feature-row {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 64px; align-items: center;
  padding: 60px 0;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.feature-row:last-child { border-bottom: none; }
.feature-row.rev { direction: rtl; }
.feature-row.rev > * { direction: ltr; }
.feature-tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--accent); margin-bottom: 12px;
}
.feature-row h2 {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.8vw, 30px);
  font-weight: 700; letter-spacing: -.4px;
  color: var(--white); margin-bottom: 16px; line-height: 1.2;
}
.feature-row p { font-size: 15px; color: var(--muted); line-height: 1.65; margin-bottom: 20px; }
.feature-list li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 15px; color: var(--muted); padding: 5px 0; line-height: 1.5;
}
.feature-list li::before {
  content: '✓'; color: var(--accent);
  font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.learn-link {
  font-size: 13.5px; font-weight: 600; color: var(--accent);
  border-bottom: 1px solid rgba(79,110,247,.25); padding-bottom: 2px;
  transition: all .2s;
}
.learn-link:hover { color: #3d5df5; }

/* Feature image placeholder */
.feat-img {
  border-radius: 14px; border: 1px solid rgba(255,255,255,.07);
  background: var(--surface); aspect-ratio: 4/3;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
  overflow: hidden; position: relative;
}
.feat-img-icon { font-size: 36px; opacity: .35; }
.feat-img-label {
  font-size: 12px; color: var(--muted2);
  text-align: center; padding: 0 20px;
  font-family: var(--font-display);
}
.feat-img .glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 60% 30%, rgba(79,110,247,.08) 0%, transparent 60%);
}

/* ── BEFORE / AFTER ── */
.ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
.ba-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; overflow: hidden;
}
.ba-header {
  padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-size: 13px; font-weight: 700;
}
.ba-header.before { color: var(--muted); }
.ba-header.after  { color: var(--green); }
.ba-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  border-radius: 4px; padding: 2px 7px;
}
.ba-header.before .ba-label { background: rgba(255,255,255,.06); color: var(--muted); }
.ba-header.after  .ba-label { background: rgba(34,197,94,.1); color: var(--green); }
.ba-body { padding: 20px; }
.ba-img {
  width: 100%; height: 140px;
  background: linear-gradient(135deg, var(--surface2), var(--surface3, #0b0d14));
  border-radius: 8px; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; opacity: .4;
  border: 1px solid rgba(255,255,255,.07);
}
.ba-list li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 13.5px; color: var(--muted); padding: 5px 0;
}
.ba-list.before li::before { content: '✗'; color: var(--red, #ef4444); font-weight: 700; flex-shrink: 0; }
.ba-list.after  li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; }

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

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .benefits-grid { grid-template-columns: repeat(2, 1fr); }
  .feat-grid     { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .feature-row     { grid-template-columns: 1fr; gap: 36px; }
  .feature-row.rev { direction: ltr; }
  .ba-grid         { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .benefits-grid { grid-template-columns: 1fr; }
  .feat-grid     { grid-template-columns: 1fr; }
}

/* ── ANIMATION ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { opacity: 0; animation: fadeUp .6s ease forwards; }
.fade-up:nth-child(1) { animation-delay: .05s; }
.fade-up:nth-child(2) { animation-delay: .15s; }
.fade-up:nth-child(3) { animation-delay: .25s; }
.fade-up:nth-child(4) { animation-delay: .35s; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="hero">
    <div class="container">
      <div class="eyebrow">🛍️ For E-Commerce</div>
      <h1>Get More Sales with our AI eCommerce <span class="accent">SEO Content Service</span></h1>
      <p class="hero-sub">Create killer content that ranks. SEO-optimized articles driving targeted traffic to your product pages, converting like crazy.</p>
      <div class="hero-actions">
        <a href="/register" class="btn btn-primary btn-lg">Start today</a>
        <a href="#" class="btn btn-ghost" style="padding:14px 30px;font-size:16px;border-radius:10px;">See It In Action</a>
      </div>
      <!-- Social proof -->
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:13.5px;color:var(--muted);margin-bottom:12px;">
        <div style="display:flex;">
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);">JL</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">MR</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">AK</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">SB</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">TD</div>
        </div>
        Trusted by marketers &amp; agencies worldwide
      </div>
      <div class="hero-perks">
        <span>Auto product linking</span>
        <span>Shopify integration</span>
        <span>150+ languages</span>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════ WHY YOU NEED IT ═══════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">💡 Why Infin8Content</p>
        <h2 class="section-title">Why do you need Infin8Content to grow your store?</h2>
      </div>
      <div class="benefits-grid">
        <div class="benefit-card fade-up">
          <div class="benefit-icon">📈</div>
          <h4>Boost Traffic</h4>
          <p>Infin8Content creates beautiful SEO-optimized articles that rank higher in search engines, bringing in more visitors without paid ads.</p>
        </div>
        <div class="benefit-card fade-up">
          <div class="benefit-icon">⏱️</div>
          <h4>Save Time</h4>
          <p>Automatically generate tailored product content that links directly to your store, with no manual effort required from your team.</p>
        </div>
        <div class="benefit-card fade-up">
          <div class="benefit-icon">💰</div>
          <h4>Increase Sales</h4>
          <p>Each article is packed with product links and CTAs designed to convert readers into customers.</p>
        </div>
        <div class="benefit-card fade-up">
          <div class="benefit-icon">🌍</div>
          <h4>Scale Globally</h4>
          <p>Create content in 150+ languages to reach global audiences, driving more traffic and sales effortlessly.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ════════════════════════ KEY BENEFITS STRIP ═══════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚡ Key Benefits</p>
        <h2 class="section-title">Benefits for Online Stores</h2>
      </div>
      <div class="feat-grid">
        <div class="feat-cell">
          <div class="fc-icon">🎯</div>
          <h4>Targeted Traffic, Every Time</h4>
          <p>Pick a keyword and watch the AI deliver content that ranks for high-buying-intent searches.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🔗</div>
          <h4>Effortless Product Links</h4>
          <p>The AI auto-links your products in every article, driving readers directly to your store.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🛍️</div>
          <h4>Simple Shopify Integration</h4>
          <p>Connect your Shopify store in just a few clicks and start publishing directly to your blog.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🌐</div>
          <h4>Global Reach</h4>
          <p>150+ languages, geo-targeted by country — reach any market without a translation team.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════ FEATURE ROWS ═══════════════════════════ -->
  <section class="section section-alt">
    <div class="container">

      <!-- Row 1: Social Sharing -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">📣 Social Sharing</p>
          <h2>Automatic Social Sharing</h2>
          <p>Let your articles reach more people effortlessly. Every piece of content is instantly shared across your social media platforms, automatically driving traffic and boosting engagement.</p>
          <ul class="feature-list">
            <li>Auto-share articles on publish across social channels</li>
            <li>Instantly drive traffic back to your product pages</li>
            <li>Boost engagement without manual social media work</li>
          </ul>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">📣</div>
            <p class="feat-img-label">Social Sharing Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 2: Shopify (reversed) -->
      <div class="feature-row rev">
        <div>
          <p class="feature-tag">🛍️ Shopify</p>
          <h2>Easy Shopify Integration</h2>
          <p>Effortlessly sync your Shopify store with Infin8Content. Automatically publish articles to your blog with product links embedded, and watch organic traffic turn into sales.</p>
          <ul class="feature-list">
            <li>Connect your Shopify store in seconds</li>
            <li>Auto-publish content directly to your blog</li>
            <li>Product links inserted contextually in every article</li>
            <li>Drive organic buyers straight to product pages</li>
          </ul>
          <a href="#" class="learn-link">Learn about Shopify integration →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">🛍️</div>
            <p class="feat-img-label">Shopify Integration Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 3: Global Markets -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">🌍 Global</p>
          <h2>Reach Global Markets in 150+ Languages</h2>
          <p>Expand into any market by generating and publishing SEO-optimized content in 150+ languages. Geo-targeted by country, each article is written for the local search audience.</p>
          <ul class="feature-list">
            <li>150+ languages supported out of the box</li>
            <li>Geo-targeted content per country</li>
            <li>Local SEO optimization built in</li>
            <li>Reach international buyers without a translation team</li>
          </ul>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">🌍</div>
            <p class="feat-img-label">Global Reach Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═══════════════════════════ BEFORE / AFTER ════════════════════════ -->
  <section class="section">
    <div class="container" style="max-width:860px;">
      <div class="section-header">
        <p class="section-label">⚡ The Difference</p>
        <h2 class="section-title">From manual content to automated sales machine</h2>
      </div>
      <div class="ba-grid">

        <div class="ba-card">
          <div class="ba-header before">
            <span class="ba-label">Before</span>
            Without Infin8Content
          </div>
          <div class="ba-body">
            <div class="ba-img">😩</div>
            <ul class="ba-list before">
              <li>Spend hours writing product content manually</li>
              <li>Pay $600+/mo for a copywriter per client</li>
              <li>Missed product link opportunities</li>
              <li>No social sharing or automation</li>
            </ul>
          </div>
        </div>

        <div class="ba-card">
          <div class="ba-header after">
            <span class="ba-label">After</span>
            With Infin8Content
          </div>
          <div class="ba-body">
            <div class="ba-img">🚀</div>
            <ul class="ba-list after">
              <li>Auto-generate SEO content for every product</li>
              <li>All-in-one solution — no copywriter needed</li>
              <li>Product links automatically inserted</li>
              <li>Auto-share to social on every publish</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>More traffic.<br>More sales. Less work.</h2>
      <p>Get started and see why e-commerce teams trust Infin8Content.</p>
      <a href="/register" class="btn btn-primary btn-lg">Start today</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Auto Shopify sync</span>
        <span class="cta-perk">150+ languages</span>
      </div>
    </div>
  </section>

</main>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function EcommercePage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={html} css={css} />
    </MarketingShell>
  );
}
