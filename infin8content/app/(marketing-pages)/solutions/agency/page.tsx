'use client';

/**
 * /solutions/agency — rebuilt to exactly match /ai-content-writer
 *
 * Layout system : MarketingShell (wrapper) + MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 * Classes       : same .btn, .btn-primary, .promo-bar, .nav-link, .section-title, etc.
 *
 * Drop-in usage:
 *   Place at /app/(marketing-pages)/solutions/agency/page.tsx
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

/* ── STEP CARDS (4-up grid) ── */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (min-width: 1024px) {
  .steps-grid { grid-template-columns: repeat(4, 1fr); }
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
.t-quote { font-size: 14px; color: var(--text); line-height: 1.65; flex: 1; }
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
  .t-grid    { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .feature-row     { grid-template-columns: 1fr; gap: 36px; }
  .feature-row.rev { direction: ltr; }
  .t-grid          { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .feat-grid  { grid-template-columns: 1fr; }
  .steps-grid { grid-template-columns: 1fr; }
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

/* ── HERO IMAGE ── */
.hero-image-section {
  position: relative;
  margin-top: -80px;
  padding-bottom: 0;
  z-index: 10;
}
.hero-image {
  width: 50%;
  height: auto;
  display: block;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.07);
  margin: 0 auto;
  mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML — same class vocabulary as /ai-content-writer & /solutions/saas
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="hero">
    <div class="container">
      <div class="eyebrow">🏢 For Agencies</div>
      <h1>The AI Content Software for Agencies That Delivers <span class="accent">Client-Ready Content</span></h1>
      <p class="hero-sub">Infin8Content produces content so compelling, you'll want to present it to your client immediately — without any editing.</p>
      <div class="hero-actions">
        <a href="/register" class="btn btn-primary btn-lg">Start today</a>
        <a href="#real-stories" class="btn btn-ghost" style="padding:14px 30px;font-size:16px;border-radius:10px;">See It In Action</a>
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
        <span>Unlimited clients</span>
        <span>White-label reports</span>
        <span>Cancel anytime</span>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════ AGENCY HERO IMAGE ════════════════════ -->
  <section class="hero-image-section">
    <div class="container">
      <img
        src="/images/agency-hero.png"
        alt="Agency Solution Hero"
        class="hero-image"
      />
    </div>
  </section>

  <!-- ═══════════════════════════ TESTIMONIALS ═════════════════════════ -->
  <section class="section section-alt" id="real-stories">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⭐ Real Stories</p>
        <h2 class="section-title">Why agencies trust Infin8Content</h2>
      </div>
      <div class="t-grid">
        <div class="t-card fade-up">
          <p class="t-quote">"It comes down to how easy it is to create content, and the <strong>impressive rankings</strong> we see with it."</p>
          <div class="t-author">
            <div class="t-av">TS</div>
            <div>
              <p class="t-name">Timo S.</p>
              <p class="t-role">CEO @ SpechtGmbH</p>
            </div>
          </div>
        </div>
        <div class="t-card fade-up">
          <p class="t-quote">"We're now able to <strong>rank our clients very quickly</strong> in just 1 or 2 months."</p>
          <div class="t-author">
            <div class="t-av">AS</div>
            <div>
              <p class="t-name">Abhinav S.</p>
              <p class="t-role">CEO @ Interconnections</p>
            </div>
          </div>
        </div>
        <div class="t-card fade-up">
          <p class="t-quote">"We've heavily <strong>reduced our reliance on external copywriters</strong>. It's been a game-changer for our agency."</p>
          <div class="t-author">
            <div class="t-av">BE</div>
            <div>
              <p class="t-name">Brian E.</p>
              <p class="t-role">Agency Founder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════ HOW IT WORKS ═════════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">🔧 How It Works</p>
        <h2 class="section-title">How it works for SEO teams</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card fade-up">
          <img src="/images/Generate-Client-Specific-Articles-Using-Keywords.webp" alt="Generate Client-Specific Articles" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <div class="step-num">1</div>
          <div class="step-icon">🔑</div>
          <h4>Generate Client-Specific Articles from Keywords</h4>
          <p>Start content creation by inputting the keywords your clients aim to rank for. The AI handles research, structure, and writing.</p>
        </div>
        <div class="step-card fade-up">
          <img src="/images/Customize-Formatting-Tone-Content-Structure.webp" alt="Customize Formatting, Tone & Content Structure" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <div class="step-num">2</div>
          <div class="step-icon">🎨</div>
          <h4>Customize Formatting, Tone &amp; Content Structure</h4>
          <p>Select formatting options, adjust the tone to match each client's brand voice, and structure content for their specific audience.</p>
        </div>
        <div class="step-card fade-up">
          <img src="/images/Optimize-with-the-AI-SEO-Editor.webp" alt="Optimize with the AI SEO Editor" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <div class="step-num">3</div>
          <div class="step-icon">✏️</div>
          <h4>Optimize with the AI SEO Editor</h4>
          <p>Easily edit content, incorporate internal and external links, and fine-tune keyword placement for maximum ranking potential.</p>
        </div>
        <div class="step-card fade-up">
          <img src="/images/Deliver-Exceptional-Results-Straight-to-Your-Clients.webp" alt="Deliver Exceptional Results" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <div class="step-num">4</div>
          <div class="step-icon">📤</div>
          <h4>Deliver Exceptional Results to Clients</h4>
          <p>Add multiple client projects, set tailored outputs for each, and scale your agency fast without adding headcount.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════ FEATURE ROWS ═══════════════════════════ -->
  <section class="section section-alt">
    <div class="container">

      <!-- Row 1: AI SEO Editor -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">✏️ AI SEO Editor</p>
          <h2>Edit Content Exactly How You Want</h2>
          <p>Use Infin8Content's AI SEO editing suite to edit your articles exactly as needed. Add highly relevant external and internal links with just one click.</p>
          <ul class="feature-list">
            <li>Rewrite sections with custom prompts</li>
            <li>Add internal and external links automatically</li>
            <li>Adjust tone to match each client's brand voice</li>
            <li>Regenerate images with custom prompts</li>
          </ul>
          <a href="/ai-seo-editor" class="learn-link">Discover AI SEO Editor →</a>
        </div>
        <div>
          <div class="feat-img">
            <img src="/images/AI-SEO-Editor.webp" alt="AI SEO Editor" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>
      </div>

      <!-- Row 2: Knowledge Base (reversed) -->
      <div class="feature-row rev">
        <div>
          <p class="feature-tag">📚 Client Knowledge Base</p>
          <h2>AI That Learns Your Clients' Businesses</h2>
          <p>Our AI learns from your clients' websites, documents, and assets — producing tailored articles with in-depth knowledge specific to their business.</p>
          <ul class="feature-list">
            <li>Upload websites, docs, or any business assets</li>
            <li>AI enters a learning phase to understand brand context</li>
            <li>Generate articles that reflect each client's unique expertise</li>
            <li>Every piece of content reflects brand voice, not generic AI</li>
          </ul>
          <a href="#" class="learn-link">Learn about Knowledge Base →</a>
        </div>
        <div>
          <div class="feat-img">
            <img src="/images/Client-Knowledge-Base.webp" alt="Client Knowledge Base" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>
      </div>

      <!-- Row 3: White-Label Reports -->
      <div class="feature-row">
        <div>
          <p class="feature-tag">📊 White-Label Reports</p>
          <h2>Impress Clients with Branded SEO Reports</h2>
          <p>Deliver professional white-label SEO reports with your agency's branding. Show clients exactly what's working and why — without exposing the tool you use.</p>
          <ul class="feature-list">
            <li>Custom logo, brand colors, and domain</li>
            <li>Share AI visibility dashboards with clients</li>
            <li>Automated monthly reporting</li>
            <li>PDF and shareable link exports</li>
          </ul>
          <a href="#" class="learn-link">Learn about SEO Reports →</a>
        </div>
        <div>
          <div class="feat-img">
            <img src="/images/Impress-Clients-with-Branded-SEO-Reports.png" alt="White-Label Reports" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ══════════════════════════ AGENCY FEATURES ════════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚙️ Agency Features</p>
        <h2 class="section-title">Everything agencies need to scale</h2>
      </div>
      <div class="feat-grid">
        <div class="feat-cell">
          <div class="fc-icon">👥</div>
          <h4>Multi-Client Management</h4>
          <p>Manage unlimited client projects from a single account — each with custom settings, tone, and knowledge bases.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🏷️</div>
          <h4>White-Label Everything</h4>
          <p>Brand the entire platform experience. Reports, dashboards, and exports carry your agency's identity.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">🔌</div>
          <h4>CMS Integrations</h4>
          <p>Publish directly to WordPress, Shopify, Webflow, Ghost, Wix and more — for every client, at once.</p>
        </div>
        <div class="feat-cell">
          <div class="fc-icon">⚡</div>
          <h4>Bulk Generation</h4>
          <p>Generate and publish dozens of articles across multiple clients in a single run. Agencies use this to save 40+ hours per week.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Rank more clients.<br>Do less work.</h2>
      <p>Get started and see why agencies trust Infin8Content.</p>
      <a href="/register" class="btn btn-primary btn-lg">Start today</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Unlimited clients</span>
        <span class="cta-perk">White-label reports</span>
      </div>
    </div>
  </section>

</main>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function AgencyPage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={html} css={css} />
    </MarketingShell>
  );
}
