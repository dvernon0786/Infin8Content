'use client';

/**
 * /features/ai-news-writer — cloned from arvow.com/ai-news-article-generator
 *
 * Layout system : MarketingShell (wrapper) + MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 *
 * Drop-in usage:
 *   Place at /app/(marketing-pages)/features/ai-news-writer/page.tsx
 */

import MarketingShell    from '@/components/marketing/MarketingShell';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS
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
  line-height: 1.65; max-width: 560px; margin: 0 auto;
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
  margin-top: 16px;
}
.hero-perks span::before { content: '✓'; color: var(--green); font-weight: 700; margin-right: 5px; }

/* ── HERO MOCKUP IMAGE ── */
.hero-mockup {
  max-width: 860px; margin: 48px auto 0;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.07);
  box-shadow: 0 40px 100px rgba(0,0,0,.6);
}
.hero-mockup-inner {
  width: 100%; background: linear-gradient(135deg, var(--surface), var(--surface2));
  aspect-ratio: 16/7;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
}
.hero-mockup-icon { font-size: 48px; opacity: .3; }
.hero-mockup-label {
  font-size: 13px; color: var(--muted2);
  font-family: var(--font-display);
}

/* ── HOW IT WORKS — NUMBERED STEPS ── */
.steps-numbered {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.step-n-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 24px;
  transition: all .2s;
}
.step-n-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-3px); }
.step-n-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 14px; font-weight: 700;
  color: var(--accent); margin-bottom: 16px;
}
.step-n-card h4 {
  font-family: var(--font-display); font-size: 15px;
  font-weight: 600; color: var(--white); margin-bottom: 8px; line-height: 1.3;
}
.step-n-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

/* ── ADVANCED FEATURES (3-col prose cards) ── */
.adv-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.adv-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; padding: 28px 24px;
  transition: all .2s;
}
.adv-card:hover { border-color: rgba(79,110,247,.25); }
.adv-card .adv-icon { font-size: 26px; margin-bottom: 14px; }
.adv-card h4 {
  font-family: var(--font-display); font-size: 15px;
  font-weight: 600; color: var(--white); margin-bottom: 10px; line-height: 1.3;
}
.adv-card p { font-size: 13.5px; color: var(--muted); line-height: 1.65; }

/* ── FAQ ── */
.faq-list { max-width: 760px; margin: 40px auto 0; }
.faq-item {
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.faq-q {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 20px 0; cursor: pointer;
  font-size: 15px; font-weight: 500; color: var(--text);
  transition: color .2s; gap: 20px; list-style: none;
}
.faq-q:hover { color: var(--white); }
.faq-icon {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
  transition: all .3s; color: var(--muted);
}
.faq-item.open .faq-icon {
  background: rgba(79,110,247,.12); color: var(--accent); transform: rotate(45deg);
}
.faq-a {
  display: none; padding: 0 0 20px;
  font-size: 14.5px; color: var(--muted); line-height: 1.7;
}
.faq-item.open .faq-a { display: block; }

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
  .adv-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .steps-numbered { grid-template-columns: 1fr; }
  .adv-grid        { grid-template-columns: 1fr; }
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
      <div class="eyebrow">📰 AI News Writer</div>
      <h1>The AI News Article Generator <span class="accent">on Autopilot.</span></h1>
      <p class="hero-sub">Generate AI news articles based on current events and post them to your site automatically.</p>
      <div class="hero-actions">
        <a href="/register" class="btn btn-primary btn-lg">Start today</a>
        <a href="/pricing"  class="btn btn-ghost"  style="padding:14px 30px;font-size:16px;border-radius:10px;">View Pricing</a>
      </div>
      <!-- Social proof -->
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:13.5px;color:var(--muted);margin-bottom:4px;">
        <div style="display:flex;">
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);">JL</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">MR</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">AK</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">SB</div>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);margin-left:-8px;">TD</div>
        </div>
        Trusted by <strong style="color:var(--white);margin-left:4px;">10,000+</strong>&nbsp;Marketers &amp; Agencies
      </div>
      <div class="hero-perks">
        <span>No card required</span>
        <span>Articles in 30 secs</span>
        <span>Plagiarism free</span>
      </div>
      <!-- Hero mockup -->
      <div class="hero-mockup">
        <div class="hero-mockup-inner">
          <div class="hero-mockup-icon">📰</div>
          <p class="hero-mockup-label">News Writer Preview — Replace with screenshot</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ HOW IT WORKS ════════════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">⚙️ How It Works</p>
        <h2 class="section-title">How does the AI News Article Generator work?</h2>
        <p class="section-sub">It takes a news topic, browses the internet for relevant news, and writes a brand-new article based on that information.</p>
      </div>
      <div class="steps-numbered">
        <div class="step-n-card fade-up">
          <div class="step-n-num">1</div>
          <h4>Topic Input</h4>
          <p>Provide a brief topic or subject for the news article you want to generate, along with the target country for geo-targeted results.</p>
        </div>
        <div class="step-n-card fade-up">
          <div class="step-n-num">2</div>
          <h4>Analysis</h4>
          <p>Our AI analyses the topic and finds the latest news about it available anywhere online — gathering key facts, figures, and details to write the best possible article.</p>
        </div>
        <div class="step-n-card fade-up">
          <div class="step-n-num">3</div>
          <h4>Article Structuring</h4>
          <p>After analysing all available information, the AI organises it into a well-structured, easily digestible news article ready to publish.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ ADVANCED FEATURES ═══════════════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <p class="section-label">🚀 Advanced Features</p>
        <h2 class="section-title">Everything that powers the News Writer</h2>
      </div>
      <div class="adv-grid">
        <div class="adv-card">
          <div class="adv-icon">🧠</div>
          <h4>Advanced AI Engine</h4>
          <p>Our AI News Article Generator is powered by a state-of-the-art engine that scans and synthesises the latest news. This advanced technology ensures your content is generated with accuracy and creativity.</p>
        </div>
        <div class="adv-card">
          <div class="adv-icon">🎯</div>
          <h4>Customisable &amp; Context-Aware</h4>
          <p>Tailor each news article to your niche with context-aware content generation. Articles adapt to current events while reinforcing your brand messaging and editorial voice.</p>
        </div>
        <div class="adv-card">
          <div class="adv-icon">📎</div>
          <h4>Automated Citations</h4>
          <p>Every article includes a fully automated citation list, crediting all sources with publication names and direct links. This enhances credibility and solidifies your site's trustworthiness.</p>
        </div>
        <div class="adv-card">
          <div class="adv-icon">⚡</div>
          <h4>AutoPublish on Any Schedule</h4>
          <p>Connect your CMS and set a publishing frequency. Infin8Content will automatically generate and publish news articles to your site 24/7 — completely hands-free.</p>
        </div>
        <div class="adv-card">
          <div class="adv-icon">🌍</div>
          <h4>150+ Languages &amp; Geo-Targeting</h4>
          <p>Generate news articles in over 150 languages with geo-targeted results per country. Reach international audiences without a translation team.</p>
        </div>
        <div class="adv-card">
          <div class="adv-icon">🔌</div>
          <h4>CMS Integrations</h4>
          <p>Publish directly to WordPress, Shopify, Ghost, Webflow, and more with one click. Full automation from topic input to live blog post — zero manual work.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════ FAQ ═════════════════════════════ -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">
        <p class="section-label">❓ FAQ</p>
        <h2 class="section-title">Your questions answered</h2>
      </div>
      <div class="faq-list">

        <div class="faq-item">
          <div class="faq-q">Does the AI News Writer cite sources?<div class="faq-icon">+</div></div>
          <div class="faq-a">Yes. Every news article generated comes with a proper citation list referencing where the information was obtained from. This includes the name of the publication and a link to the exact article the information was gathered from.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">How does the AI news article generator work?<div class="faq-icon">+</div></div>
          <div class="faq-a">It takes a topic input from you, searches the internet for all the most relevant and up-to-date news about that topic, reads all the existing news articles about it, and then writes a brand-new news article. It's like having your own AI journalist on demand.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Is the AI News Generator legal?<div class="faq-icon">+</div></div>
          <div class="faq-a">Absolutely. Our AI news article generator works like a journalist — it looks for the latest news on a topic, reads through existing articles, and writes a completely new article about that topic. All sources are cited automatically.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">What use-cases does the AI News Article Generator have?<div class="faq-icon">+</div></div>
          <div class="faq-a">Say you have a site about Digital Nomads and want to keep users aware of the latest news in that space. By having a dedicated news section with auto-generated articles, you provide your readers with fresh, relevant content — all on autopilot.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Can I automatically post news articles to my website?<div class="faq-icon">+</div></div>
          <div class="faq-a">Yes. Connect Infin8Content with your CMS and have it automatically write and publish news articles on a schedule you define. Set the frequency once and let it run in the background indefinitely.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Can I use the news article generator for any niche?<div class="faq-icon">+</div></div>
          <div class="faq-a">Yes. The news article generator can be customised for any niche. Whether you run a tech blog, a health website, or a sports news site, the tool generates tailored articles suited to your audience and topic.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">What makes Infin8Content's AI News Writer different?<div class="faq-icon">+</div></div>
          <div class="faq-a">Our news writer understands context and generates articles that are factually accurate, engaging, and readable — while automatically citing all sources. It integrates directly with your CMS for end-to-end automation, not just content generation.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Can I customise the output of the AI News Article Generator?<div class="faq-icon">+</div></div>
          <div class="faq-a">Yes. You can tailor article tone, structure, keyword integration, and language. With brand voice training, every article can sound like it was written by your team — not a generic AI.</div>
        </div>

        <div class="faq-item">
          <div class="faq-q">How do I integrate the AI News Article Generator with my CMS?<div class="faq-icon">+</div></div>
          <div class="faq-a">Integration is seamless. Infin8Content supports WordPress, Shopify, Ghost, Webflow, Wix, and more. Connect your site in a few clicks and start auto-publishing news articles immediately. Full guides are available in the Help Docs.</div>
        </div>

      </div>
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ═════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Rank more clients.<br>Do less work.</h2>
      <p>Get started and see why teams trust Infin8Content for AI news content.</p>
      <a href="/register" class="btn btn-primary btn-lg">Start today</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Articles in 30 secs</span>
        <span class="cta-perk">Plagiarism free</span>
      </div>
    </div>
  </section>

</main>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function AINewsWriterPage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={html} css={css} />
    </MarketingShell>
  );
}
