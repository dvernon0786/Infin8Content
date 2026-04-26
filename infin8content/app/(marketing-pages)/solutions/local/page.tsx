'use client';

/**
 * app/(marketing-pages)/solutions/local/page.tsx
 *
 * Layout system : MarketingShell (wrapper) + MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 *
 * Drop-in usage:
 *   Place at /app/(marketing-pages)/solutions/local/page.tsx
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

/* ── REASONS GRID (3-up centered cards) ── */
.reasons-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 20px; max-width: 900px; margin: 0 auto;
}
.reason-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 22px;
  text-align: center; transition: all .2s;
}
.reason-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-3px); }
.reason-icon { font-size: 36px; margin-bottom: 16px; }
.reason-card h4 {
  font-family: var(--font-display); font-size: 15px;
  font-weight: 600; color: var(--white); margin-bottom: 8px;
}
.reason-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

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
  transition: all .2s; text-decoration: none; display: inline-block;
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
  .feat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .reasons-grid    { grid-template-columns: 1fr; }
  .feature-row     { grid-template-columns: 1fr; gap: 36px; }
  .feature-row.rev { direction: ltr; }
}
@media (max-width: 600px) {
  .feat-grid { grid-template-columns: 1fr; }
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
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="hero">
    <div class="container">
      <div class="eyebrow">📍 For Local Businesses</div>
      <h1>Get More Clients with our <span class="accent">Local SEO-Tailored Software</span></h1>
      <p class="hero-sub">Rank your local business higher in search engines and get more clients with AI-powered content tailored for local SEO.</p>
      <div class="hero-actions">
        <a href="/register" class="btn btn-primary btn-lg">Start today</a>
        <a href="/pricing" class="btn btn-ghost" style="padding:14px 30px;font-size:16px;border-radius:10px;">View Pricing</a>
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
        <span>Hyper-local targeting</span>
        <span>Auto social sharing</span>
        <span>Cancel anytime</span>
      </div>
    </div>
  </section>

  <!-- ════════════════════ WHY LOCAL BUSINESSES NEED IT ════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">💡 Why It Matters</p>
        <h2 class="section-title">Why Local Businesses Need Infin8Content</h2>
      </div>
      <div class="reasons-grid">
        <div class="reason-card fade-up">
          <div class="reason-icon">📍</div>
          <h4>Rank Higher</h4>
          <p>Capture high-intent local customers by ranking at the top of search results for your area and service keywords.</p>
        </div>
        <div class="reason-card fade-up">
          <div class="reason-icon">🧲</div>
          <h4>Attract More Clients</h4>
          <p>Through high-quality, SEO-optimized articles, Infin8Content builds organic search rankings, consistently bringing in new clients.</p>
        </div>
        <div class="reason-card fade-up">
          <div class="reason-icon">⏱️</div>
          <h4>Save Time and Focus</h4>
          <p>Infin8Content automates content creation so you can focus on your business while your website acquires new clients 24/7.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ KEY BENEFITS STRIP ═══════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚡ Key Benefits</p>
        <h2 class="section-title">Built for rapid local growth</h2>
      </div>
      <div class="feat-grid">
        <div class="feat-cell">
          <div class="fc-icon">📍</div>
          <h4>Capture Local Leads</h4>
          <p>Infin8Content creates content that targets locally relevant keywords, driving clients searching for services in your area.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🏆</div>
          <h4>Outpace Competitors</h4>
          <p>Position your business as the top choice locally with consistent, high-quality content that outranks the competition.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">📣</div>
          <h4>Boost Word-of-Mouth</h4>
          <p>As clients find value in your articles, they recommend your services — increasing local referrals and brand recognition.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🎓</div>
          <h4>Be the Expert</h4>
          <p>Consistently publish valuable articles that address common questions and position your business as the go-to local authority.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════ FEATURE ROWS ═══════════════════════════ -->
  <section class="section section-alt">
    <div class="container">

      <!-- Row 1: AutoPublish -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">🤖 AutoPublish</p>
          <h2>Effortless Marketing on Autopilot</h2>
          <p>With Infin8Content's AutoPublish, articles are created, published to your site, and automatically shared across your social media channels — without any manual work from you.</p>
          <ul class="feature-list">
            <li>Set your schedule and forget it — runs 24/7</li>
            <li>Auto-share to social media on every publish</li>
            <li>Target local keywords automatically</li>
            <li>Google fast-indexing to rank pages sooner</li>
          </ul>
          <a href="/features/autopublish" class="learn-link">Learn about AutoPublish →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">🤖</div>
            <p class="feat-img-label">AutoPublish Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 2: Custom CTAs (reversed) -->
      <div class="feature-row rev">
        <div>
          <p class="feature-tag">📞 Custom CTAs</p>
          <h2>Custom CTA Integration for Client Conversion</h2>
          <p>Each article includes customized calls-to-action that lead readers to your contact forms, booking pages, or service inquiry pages — converting content readers into paying clients.</p>
          <ul class="feature-list">
            <li>Book a call, contact form, or inquiry page CTAs</li>
            <li>Customized per service type and location</li>
            <li>Embedded naturally within content flow</li>
            <li>Track conversions from organic traffic</li>
          </ul>
          <a href="/features/ai-content-writer" class="learn-link">Learn about Custom CTAs →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">📞</div>
            <p class="feat-img-label">Custom CTA Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 3: Local Targeting -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">🌍 Local Targeting</p>
          <h2>Hyper-Local Geo-Targeting</h2>
          <p>Generate content that targets your specific city, neighborhood, or service area. Infin8Content writes for local search intent — not generic national keywords.</p>
          <ul class="feature-list">
            <li>City and neighborhood-level targeting</li>
            <li>Service area keyword optimization</li>
            <li>150+ languages for multicultural markets</li>
            <li>Google Maps citation building support</li>
          </ul>
          <a href="/resources/blog/5-local-seo-tips-google-maps" class="learn-link">Read our Local SEO guide →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">🌍</div>
            <p class="feat-img-label">Geo-Targeting Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Dominate local search.<br>Get more clients.</h2>
      <p>Get started and see why local businesses trust Infin8Content.</p>
      <a href="/register" class="btn btn-primary btn-lg">Start today</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Hyper-local targeting</span>
        <span class="cta-perk">Auto publishing</span>
      </div>
    </div>
  </section>

</main>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function LocalPage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={html} css={css} />
    </MarketingShell>
  );
}
