/**
 * /solutions/saas — rebuilt to exactly match /ai-content-writer
 *
 * Layout system : MarketingShell (wrapper) + MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 * Classes       : same .btn, .btn-primary, .promo-bar, .nav-link, .section-title, etc.
 *
 * Drop-in usage:
 *   import MarketingShell    from '@/components/MarketingShell';
 *   import MarketingPageBody from '@/components/MarketingPageBody';
 *   export default SaaSPage;
 */

import MarketingShell    from '@/components/marketing/MarketingShell';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — identical token names to /ai-content-writer.
// No --mkt-* tokens; no Tailwind classes; pure vanilla CSS on top of :root.
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
  color: var(--accent);
  margin-bottom: 10px;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 3.5vw, 40px);
  font-weight: 700; letter-spacing: -.6px;
  color: var(--white);
  margin-bottom: 14px; line-height: 1.15;
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

/* ── STEP CARDS (2-up) ── */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px; max-width: 720px; margin: 0 auto;
}
.step-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 24px;
  transition: all .2s;
}
.step-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-4px); }
.step-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 14px; font-weight: 700;
  color: var(--accent); margin-bottom: 16px;
}
.step-icon { font-size: 26px; margin-bottom: 12px; }
.step-card h4 {
  font-family: var(--font-display); font-size: 15px;
  font-weight: 600; color: var(--white);
  margin-bottom: 8px; line-height: 1.3;
}
.step-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

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
.learn-link:hover { color: #3d5df5; gap: 8px; }

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

/* ── SUMMARY CARDS (3-up) ── */
.summary-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.summary-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 24px;
  transition: all .2s;
}
.summary-card:hover { border-color: rgba(79,110,247,.25); }
.summary-card .sc-icon { font-size: 24px; margin-bottom: 16px; }
.summary-card h4 {
  font-family: var(--font-display); font-size: 14px;
  font-weight: 600; color: var(--white); margin-bottom: 8px;
}
.summary-card p { font-size: 13px; color: var(--muted); line-height: 1.6; }

/* ── FEATURE GRID (4-up) ── */
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

/* ── TESTIMONIAL GRID ── */
.t-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 16px; margin-top: 40px;
}
.t-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 22px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s;
}
.t-card:hover { border-color: rgba(79,110,247,.25); }
.t-quote {
  font-size: 14px; color: var(--text);
  line-height: 1.65; flex: 1;
}
.t-quote strong { color: var(--white); }
.t-author { display: flex; align-items: center; gap: 10px; }
.t-av {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--surface2); border: 2px solid rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px; color: var(--accent); flex-shrink: 0;
}
.t-name  { font-weight: 600; font-size: 13px; color: var(--white); }
.t-role  { font-size: 11.5px; color: var(--muted); }

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
  .feat-grid       { grid-template-columns: repeat(2, 1fr); }
  .t-grid          { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .feature-row     { grid-template-columns: 1fr; gap: 36px; }
  .feature-row.rev { direction: ltr; }
  .summary-grid    { grid-template-columns: 1fr; }
  .steps-grid      { grid-template-columns: 1fr; }
  .t-grid          { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .feat-grid       { grid-template-columns: 1fr; }
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
// HTML — same class vocabulary as /ai-content-writer
//         .container / .btn .btn-primary .btn-lg .btn-ghost / section pattern
// ─────────────────────────────────────────────────────────────────────────────
const html = `

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="hero">
    <div class="container">
      <div class="eyebrow">🚀 For SaaS Companies</div>
      <h1>The Content Tool That Ranks Your SaaS on Google and Gets It <span class="accent">Cited by ChatGPT</span></h1>
      <p class="hero-sub">Automatically publish pages on your site that target high-buying-intent keywords — ranking on Google and getting cited by LLMs.</p>
      <div class="hero-actions">
        <a href="/register" class="btn btn-primary btn-lg">Start today</a>
        <a href="#" class="btn-ghost btn" style="padding:14px 30px;font-size:16px;border-radius:10px;">See It In Action</a>
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
        <span>"Ready to rank"</span>
        <span>Articles in 30 secs</span>
        <span>Plagiarism free</span>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════ 2-STEP PROCESS ═══════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚡ The Simple 2-Step Process</p>
        <h2 class="section-title">Rank higher, attract buyers,<br>turn visitors into subscribers</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card fade-up">
          <div class="step-num">1</div>
          <div class="step-icon">🎯</div>
          <h4>Dominate Google Rankings</h4>
          <p>Rank your site #1 on Google for high buying-intent keywords — comparison pages, alternative pages, informational pages.</p>
        </div>
        <div class="step-card fade-up">
          <div class="step-num">2</div>
          <div class="step-icon">💰</div>
          <h4>Turn Traffic into Subscribers</h4>
          <p>Convert the organic traffic into paying SaaS subscribers with bottom-of-funnel content and embedded CTAs.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════ PAGE TYPE ROWS ═════════════════════════ -->
  <section class="section">
    <div class="container">

      <!-- Row 1: Informational -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">📄 Page Type 1</p>
          <h2>Informational Pages</h2>
          <p>Create content that's better than what competitors provide for their own products. Produce more valuable and insightful content than what your competitor offers for their own brand.</p>
          <ul class="feature-list">
            <li>Outrank competitor brand searches with your own content</li>
            <li>Higher authority signals from comprehensive coverage</li>
            <li>Auto-generated from your product keywords</li>
          </ul>
          <a href="#" class="learn-link">Learn about Informational Pages →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">📰</div>
            <p class="feat-img-label">Informational Page Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 2: Comparison (reversed) -->
      <div class="feature-row rev">
        <div>
          <p class="feature-tag">⚖️ Page Type 2</p>
          <h2>Comparison Pages</h2>
          <p>Optimize for competitor names and product details. Cover what each competitor offers, then provide a direct comparison to highlight your strengths and differences.</p>
          <ul class="feature-list">
            <li>Target "X vs Y" keywords with high buying intent</li>
            <li>Auto-structured to follow proven ranking patterns</li>
            <li>Embedded CTAs convert comparison readers instantly</li>
          </ul>
          <a href="#" class="learn-link">Learn about Comparison Pages →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">⚖️</div>
            <p class="feat-img-label">Comparison Page Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

      <!-- Row 3: Alternative -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">🔄 Page Type 3</p>
          <h2>Alternative Pages</h2>
          <p>Go beyond a simple alternatives list. Explain what the competitor's product is in depth, then showcase your solution as the top alternative with a clear value narrative.</p>
          <ul class="feature-list">
            <li>Capture "alternatives to X" traffic at scale</li>
            <li>Deep competitor product descriptions build trust</li>
            <li>Position your product as the obvious next step</li>
          </ul>
          <a href="#" class="learn-link">Learn about Alternative Pages →</a>
        </div>
        <div>
          <div class="feat-img">
            <div class="feat-img-icon">🔄</div>
            <p class="feat-img-label">Alternative Page Preview<br><span style="font-size:11px;">Replace with screenshot</span></p>
            <div class="glow"></div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═════════════════════════════ SUMMARY ════════════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">✦ To Sum Up</p>
        <h2 class="section-title">Infin8Content for SaaS</h2>
      </div>
      <div class="summary-grid">
        <div class="summary-card fade-up">
          <div class="sc-icon">📄</div>
          <h4>Creates SaaS-SEO tailored pages</h4>
          <p>Informational, comparison, and alternative pages targeting high-buying-intent keywords.</p>
        </div>
        <div class="summary-card fade-up">
          <div class="sc-icon">📈</div>
          <h4>Ranks them on Google</h4>
          <p>These pages rank by themselves due to low keyword competition and high topical relevance.</p>
        </div>
        <div class="summary-card fade-up">
          <div class="sc-icon">💎</div>
          <h4>Converts traffic into customers</h4>
          <p>Higher conversion rates because of bottom-of-funnel content and smart keyword selection.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════ ADVANCED FEATURES ═════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚙️ Advanced Features</p>
        <h2 class="section-title">Advanced SaaS SEO Tool Features</h2>
        <p class="section-sub">Allowing you to do SEO better and faster for your SaaS.</p>
      </div>
      <div class="feat-grid">
        <div class="feat-cell">
          <div class="fc-icon">🔍</div>
          <h4>Advanced Keyword Analysis</h4>
          <p>Uncover and prioritize high-value keywords using robust data methodologies to target proven, traffic-driving terms.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🏆</div>
          <h4>Competitor Benchmarking</h4>
          <p>Compare your metrics with market leaders and get insights that help you outperform competitors and scale subscriptions.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">📊</div>
          <h4>Intuitive Dashboard</h4>
          <p>Real-time analytics and forecast trends give you actionable insights to improve rankings and convert traffic.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🤖</div>
          <h4>Automated Content Optimization</h4>
          <p>On-page optimization for structure, readability, and keyword alignment — every article follows SEO best practices automatically.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════ TESTIMONIALS ══════════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">💬 What Our Customers Say</p>
        <h2 class="section-title">Trusted by marketers &amp; agencies worldwide</h2>
      </div>
      <div class="t-grid">
        <div class="t-card">
          <p class="t-quote">"It comes down to how easy it is to create content, and the <strong>impressive rankings</strong> we see with it."</p>
          <div class="t-author">
            <div class="t-av">TS</div>
            <div>
              <p class="t-name">Timo S.</p>
              <p class="t-role">Agency Owner @ SpechtGmbH</p>
            </div>
          </div>
        </div>
        <div class="t-card">
          <p class="t-quote">"We're now able to <strong>rank our clients very quickly</strong> in just 1 or 2 months using Infin8Content."</p>
          <div class="t-author">
            <div class="t-av">AS</div>
            <div>
              <p class="t-name">Abhinav S.</p>
              <p class="t-role">Agency Owner @ Interconnections</p>
            </div>
          </div>
        </div>
        <div class="t-card">
          <p class="t-quote">"The platform helps me quickly <strong>write draft articles from keywords</strong> and publishes them automatically."</p>
          <div class="t-author">
            <div class="t-av">AB</div>
            <div>
              <p class="t-name">Andrew B.</p>
              <p class="t-role">Content Marketer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Scale your SaaS.<br>Do less content work.</h2>
      <p>Get started and see why thousands of SaaS teams trust Infin8Content.</p>
      <a href="/register" class="btn btn-primary btn-lg">Start today</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Articles in 30 secs</span>
        <span class="cta-perk">Plagiarism free</span>
      </div>
    </div>
  </section>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component — wrapped in MarketingShell, body via MarketingPageBody
// ─────────────────────────────────────────────────────────────────────────────
export default function SaaSPage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={html} css={css} />
    </MarketingShell>
  );
}
