'use client';

/**
 * /resources/blog — rebuilt to exactly match /ai-content-writer style
 *
 * Layout system : MarketingShell (provided by (marketing-pages)/layout.tsx)
 * Body renderer : MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 * Interactivity : tag filter + "load more" handled in MarketingPageBody's useEffect
 *
 * Placement: app/(marketing-pages)/resources/blog/page.tsx
 */

import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
/* ── SECTION SCAFFOLD ── */
.section-label {
  display: inline-block;
  font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--accent); margin-bottom: 10px;
}

/* ── HERO ── */
.blog-hero {
  padding: 80px 0 56px;
  text-align: center;
  position: relative; overflow: hidden;
}
.blog-hero::before {
  content: '';
  position: absolute; top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 500px;
  background: radial-gradient(circle, rgba(79,110,247,.13) 0%, transparent 70%);
  pointer-events: none;
}
.blog-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(36px, 5.5vw, 60px);
  font-weight: 800; line-height: 1.06; letter-spacing: -1.5px;
  color: var(--white); max-width: 680px; margin: 14px auto 20px;
}
.blog-hero h1 .accent { color: var(--accent); }
.blog-hero-sub {
  font-size: 18px; color: var(--muted);
  max-width: 480px; margin: 0 auto; line-height: 1.65;
}

/* ── TAG FILTER ── */
.tag-filter {
  display: flex; flex-wrap: wrap;
  gap: 8px; justify-content: center;
  padding: 0 28px; margin-bottom: 40px;
}
.tag-btn {
  padding: 6px 14px; border-radius: 99px;
  font-size: 12.5px; font-weight: 500;
  border: 1px solid rgba(255,255,255,.07);
  background: transparent; color: var(--muted);
  cursor: pointer; transition: all .2s;
  font-family: var(--font-body);
}
.tag-btn:hover { border-color: rgba(79,110,247,.25); color: var(--white); }
.tag-btn.active {
  background: rgba(79,110,247,.12);
  border-color: rgba(79,110,247,.25);
  color: var(--accent);
}

/* ── FEATURED POST ── */
.featured-wrap { padding: 0 0 32px; }
.featured-card {
  display: grid; grid-template-columns: 480px 1fr;
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 16px; overflow: hidden;
  text-decoration: none; transition: border-color .2s, transform .2s;
}
.featured-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-2px); }
.featured-visual {
  background: linear-gradient(135deg, var(--surface2), var(--surface));
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; min-height: 280px;
}
.featured-visual-icon { font-size: 44px; opacity: .2; }
.featured-visual::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(79,110,247,.1), transparent);
  pointer-events: none;
}
.featured-tags {
  position: absolute; top: 12px; left: 12px;
  display: flex; gap: 6px; flex-wrap: wrap; z-index: 1;
}
.post-tag {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  background: rgba(8,9,13,.75); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.1);
  color: #a5b4fc; border-radius: 4px; padding: 2px 8px;
}
.featured-content {
  padding: 40px 36px;
  display: flex; flex-direction: column; justify-content: center; gap: 14px;
}
.featured-content h2 {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 700; color: var(--white); line-height: 1.3;
  transition: color .2s;
}
.featured-card:hover .featured-content h2 { color: var(--accent); }
.featured-content p { font-size: 15px; color: var(--muted); line-height: 1.65; }
.post-meta {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 14px; border-top: 1px solid rgba(255,255,255,.07);
  margin-top: auto;
}
.post-author { display: flex; align-items: center; gap: 8px; }
.post-av {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--surface2); border: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--accent); flex-shrink: 0;
}
.post-author-name { font-size: 12px; color: var(--muted); }
.post-date-read { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
.post-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }
.featured-read-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13.5px; font-weight: 600; color: var(--accent);
  transition: gap .2s; margin-top: 4px;
}
.featured-card:hover .featured-read-link { gap: 8px; }

/* ── POST GRID ── */
.post-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px; margin-bottom: 48px;
}
.post-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column;
  text-decoration: none;
  transition: border-color .2s, transform .2s;
}
.post-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-4px); }
.post-card-visual {
  width: 100%; height: 160px;
  background: linear-gradient(135deg, var(--surface2), var(--surface));
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.post-card-visual .visual-icon { font-size: 44px; opacity: .2; }
.post-card-visual::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(79,110,247,.1), transparent);
  pointer-events: none;
}
.post-card-visual .post-tags {
  position: absolute; top: 10px; left: 10px;
  display: flex; gap: 5px; flex-wrap: wrap; z-index: 1;
}
.post-card-body { padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.post-card h3 {
  font-family: var(--font-display);
  font-size: 15.5px; font-weight: 700;
  color: var(--white); line-height: 1.3;
  transition: color .2s;
}
.post-card:hover h3 { color: var(--accent); }
.post-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; flex: 1; }

/* hidden by tag filter */
.post-card[data-hidden="true"] { display: none; }

/* load more */
.load-more-wrap { text-align: center; margin-bottom: 96px; }
.load-more-btn {
  border: 1px solid rgba(255,255,255,.07); color: var(--muted);
  font-family: var(--font-display); font-weight: 600;
  font-size: 14px; padding: 14px 32px; border-radius: 10px;
  background: transparent; cursor: pointer; transition: all .2s;
}
.load-more-btn:hover { border-color: rgba(79,110,247,.25); color: var(--white); }

/* ── NEWSLETTER STRIP ── */
.newsletter-strip {
  padding: 64px 0;
  background: linear-gradient(to bottom, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent);
  text-align: center; margin-bottom: 0;
}
.newsletter-icon { font-size: 32px; margin-bottom: 16px; }
.newsletter-strip h2 {
  font-family: var(--font-display);
  font-size: 28px; font-weight: 800;
  color: var(--white); letter-spacing: -.5px; margin-bottom: 12px;
}
.newsletter-strip p { font-size: 15px; color: var(--muted); margin-bottom: 28px; }
.newsletter-form {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; flex-wrap: wrap; max-width: 480px; margin: 0 auto;
}
.newsletter-input {
  flex: 1; min-width: 220px;
  background: var(--surface); border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px; padding: 12px 16px;
  font-size: 14px; color: var(--text);
  font-family: var(--font-body); outline: none;
  transition: border-color .2s;
}
.newsletter-input::placeholder { color: var(--muted2); }
.newsletter-input:focus { border-color: rgba(79,110,247,.4); }
.newsletter-submit {
  background: var(--accent); color: var(--white);
  font-family: var(--font-display); font-weight: 600;
  font-size: 14px; padding: 12px 24px;
  border-radius: 10px; border: none; cursor: pointer;
  box-shadow: 0 0 20px rgba(79,110,247,.3);
  transition: all .2s; white-space: nowrap;
}
.newsletter-submit:hover {
  background: #3d5df5;
  box-shadow: 0 0 30px rgba(79,110,247,.5);
  transform: translateY(-1px);
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
@media (max-width: 1280px) { .post-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1024px) {
  .post-grid { grid-template-columns: repeat(2, 1fr); }
  .featured-card { grid-template-columns: 1fr; }
  .featured-visual { min-height: 200px; }
}
@media (max-width: 600px)  { .post-grid { grid-template-columns: 1fr; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="blog-hero">
    <div class="container">
      <p class="section-label">📝 Blog</p>
      <h1>AI Content &amp; <span class="accent">SEO Insights</span></h1>
      <p class="blog-hero-sub">Practical guides, real strategies, and case studies on AI-powered content marketing. Updated weekly.</p>
    </div>
  </section>

  <!-- ═══════════════════════════ TAG FILTER ════════════════════════════ -->
  <div class="tag-filter" id="tag-filter">
    <button class="tag-btn active" data-filter="All">All</button>
    <button class="tag-btn" data-filter="AI SEO">AI SEO</button>
    <button class="tag-btn" data-filter="Local SEO">Local SEO</button>
    <button class="tag-btn" data-filter="LLM SEO">LLM SEO</button>
    <button class="tag-btn" data-filter="SaaS">SaaS</button>
    <button class="tag-btn" data-filter="E-Commerce">E-Commerce</button>
    <button class="tag-btn" data-filter="AutoPublish">AutoPublish</button>
    <button class="tag-btn" data-filter="Content Strategy">Content Strategy</button>
    <button class="tag-btn" data-filter="Technical SEO">Technical SEO</button>
    <button class="tag-btn" data-filter="Tutorial">Tutorial</button>
  </div>

  <!-- ══════════════════════ FEATURED POST ══════════════════════════════ -->
  <section class="featured-wrap">
    <div class="container">
      <a href="/resources/blog/5-local-seo-tips-google-maps" class="featured-card" data-tags="Local SEO,Google Maps">
        <div class="featured-visual">
          <span class="visual-icon">✍️</span>
          <div class="featured-tags">
            <span class="post-tag">Local SEO</span>
            <span class="post-tag">Google Maps</span>
          </div>
        </div>
        <div class="featured-content">
          <h2>5 Local SEO Tips to Rank #1 on Google Maps ($5,729 Value)</h2>
          <p>If you run a local business — or manage local clients — ranking in the Google Maps local pack is one of the highest-ROI moves you can make. Here's exactly how to do it.</p>
          <div class="post-meta">
            <div class="post-author">
              <div class="post-av">IT</div>
              <span class="post-author-name">Infin8 Team</span>
            </div>
            <div class="post-date-read">
              <span>Apr 21, 2026</span>
              <span class="post-dot"></span>
              <span>10 min read</span>
            </div>
          </div>
          <span class="featured-read-link">Read article →</span>
        </div>
      </a>
    </div>
  </section>

  <!-- ══════════════════════ POST GRID ══════════════════════════════════ -->
  <section>
    <div class="container">
      <div class="post-grid" id="post-grid">

        <a href="/resources/blog/65200-traffic-ai-seo" class="post-card" data-tags="AI SEO,Traffic">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">AI SEO</span><span class="post-tag">Traffic</span></div>
          </div>
          <div class="post-card-body">
            <h3>How to Get 65,200/mo Traffic to Your Site with AI ($11,000 Value)</h3>
            <p>A step-by-step playbook for using AI-generated content to drive tens of thousands of monthly organic visitors — without backlinks or ads.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">VM</div><span class="post-author-name">Vasco M.</span></div>
              <div class="post-date-read"><span>Apr 21, 2026</span><span class="post-dot"></span><span>9 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/framer-seo-tips-rank-llms" class="post-card" data-tags="Framer,LLM SEO">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">Framer</span><span class="post-tag">LLM SEO</span></div>
          </div>
          <div class="post-card-body">
            <h3>5 Framer SEO Tips to Rank #1 on Google (and Get Cited by LLMs)</h3>
            <p>Framer sites can rank incredibly well with the right structure. Here's how to optimise your Framer site for both Google and AI search engines.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">VM</div><span class="post-author-name">Vasco M.</span></div>
              <div class="post-date-read"><span>Apr 20, 2026</span><span class="post-dot"></span><span>11 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/best-ai-seo-plugin-framer" class="post-card" data-tags="Framer,Automation">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">Framer</span><span class="post-tag">Automation</span></div>
          </div>
          <div class="post-card-body">
            <h3>The Best AI SEO Plugin for Framer: Write, Audit, and Publish Automatically</h3>
            <p>Discover how to connect Infin8Content to your Framer site and auto-publish fully SEO-optimised blog posts without leaving your workflow.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">VM</div><span class="post-author-name">Vasco M.</span></div>
              <div class="post-date-read"><span>Apr 20, 2026</span><span class="post-dot"></span><span>9 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/llm-brand-visibility-guide" class="post-card" data-tags="LLM SEO,Brand Visibility">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">LLM SEO</span><span class="post-tag">Brand Visibility</span></div>
          </div>
          <div class="post-card-body">
            <h3>How to Get ChatGPT to Recommend Your Brand (Complete Guide)</h3>
            <p>Most brands are invisible to AI search engines. Here's the exact content strategy to get cited by ChatGPT, Perplexity, and Gemini.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">IT</div><span class="post-author-name">Infin8 Team</span></div>
              <div class="post-date-read"><span>Apr 18, 2026</span><span class="post-dot"></span><span>12 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/ecommerce-seo-content-strategy" class="post-card" data-tags="E-Commerce,Content Strategy">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">E-Commerce</span><span class="post-tag">Content Strategy</span></div>
          </div>
          <div class="post-card-body">
            <h3>The eCommerce Content Strategy That Drives 300% More Organic Sales</h3>
            <p>Stop relying on paid ads. This content strategy uses AI to create product-focused articles that rank for buying-intent keywords and convert.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">IT</div><span class="post-author-name">Infin8 Team</span></div>
              <div class="post-date-read"><span>Apr 17, 2026</span><span class="post-dot"></span><span>8 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/autopublish-guide-2026" class="post-card" data-tags="AutoPublish,Tutorial">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">AutoPublish</span><span class="post-tag">Tutorial</span></div>
          </div>
          <div class="post-card-body">
            <h3>AutoPublish Guide 2026: Set Up a Blog That Runs Itself</h3>
            <p>How to configure Infin8Content's AutoPublish to generate, schedule, and publish SEO articles to your site 24/7 — completely hands-free.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">IT</div><span class="post-author-name">Infin8 Team</span></div>
              <div class="post-date-read"><span>Apr 15, 2026</span><span class="post-dot"></span><span>7 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/saas-comparison-pages-seo" class="post-card" data-tags="SaaS,Content Strategy">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">SaaS</span><span class="post-tag">Content Strategy</span></div>
          </div>
          <div class="post-card-body">
            <h3>How SaaS Companies Are Using Comparison Pages to Steal Competitor Traffic</h3>
            <p>Comparison and alternative pages are the highest-converting content type for SaaS. Here's how to build them at scale with AI.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">VM</div><span class="post-author-name">Vasco M.</span></div>
              <div class="post-date-read"><span>Apr 14, 2026</span><span class="post-dot"></span><span>10 min read</span></div>
            </div>
          </div>
        </a>

        <a href="/resources/blog/ai-seo-agent-technical-fixes" class="post-card" data-tags="AI SEO Agent,Technical SEO">
          <div class="post-card-visual">
            <span class="visual-icon">✍️</span>
            <div class="post-tags"><span class="post-tag">AI SEO Agent</span><span class="post-tag">Technical SEO</span></div>
          </div>
          <div class="post-card-body">
            <h3>7 Technical SEO Fixes Your AI Agent Can Deploy Automatically</h3>
            <p>Schema markup, canonical tags, broken links, image alt texts — your AI SEO Agent can handle all of these on autopilot. Here's how.</p>
            <div class="post-meta">
              <div class="post-author"><div class="post-av">IT</div><span class="post-author-name">Infin8 Team</span></div>
              <div class="post-date-read"><span>Apr 12, 2026</span><span class="post-dot"></span><span>6 min read</span></div>
            </div>
          </div>
        </a>

      </div><!-- /post-grid -->

      <div class="load-more-wrap">
        <button class="load-more-btn" id="load-more-btn">Load more posts</button>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ NEWSLETTER STRIP ══════════════════════════ -->
  <section class="newsletter-strip">
    <div class="container" style="max-width:660px;">
      <div class="newsletter-icon">📬</div>
      <h2>Get the best posts in your inbox</h2>
      <p>Weekly roundup of the best AI content and SEO strategies. No spam, unsubscribe anytime.</p>
      <form class="newsletter-form" onsubmit="return false;">
        <input class="newsletter-input" type="email" placeholder="Enter your email address" />
        <button class="newsletter-submit" type="submit">Subscribe</button>
      </form>
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Read less.<br>Create more.</h2>
      <p>Put the strategies to work — start publishing AI content today.</p>
      <a href="#" class="btn btn-primary btn-lg">Get Started Free</a>
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
export default function BlogPage() {
  return <MarketingPageBody html={html} css={css} />;
}
