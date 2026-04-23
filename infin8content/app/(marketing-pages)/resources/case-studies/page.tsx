'use client';

/**
 * /resources/case-studies — rebuilt to exactly match /ai-content-writer
 *
 * Layout system : MarketingShell (provided by (marketing-pages)/layout.tsx)
 * Body renderer : MarketingPageBody (HTML+CSS injection)
 * Token source  : --bg / --accent / --surface / etc.  (same as ai-content-writer)
 * Interactivity : tag filter wired in MarketingPageBody's useEffect via data-tag attrs
 *
 * Placement: app/(marketing-pages)/resources/case-studies/page.tsx
 */

import MarketingPageBody from '@/components/marketing/MarketingPageBody';

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
/* ── SECTION SCAFFOLD ── */
.section        { padding: 80px 0; }
.section-header { text-align: center; margin-bottom: 50px; }

.section-label {
  display: inline-block;
  font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--accent); margin-bottom: 10px;
}

/* ── HERO ── */
.cs-hero {
  padding: 80px 0 64px;
  text-align: center;
  position: relative; overflow: hidden;
}
.cs-hero::before {
  content: '';
  position: absolute; top: -80px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 600px;
  background: radial-gradient(circle, rgba(79,110,247,.2) 0%, transparent 70%);
  pointer-events: none;
}
.cs-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(36px, 5.5vw, 62px);
  font-weight: 800; line-height: 1.06; letter-spacing: -1.5px;
  color: var(--white); max-width: 600px; margin: 14px auto 20px;
}
.cs-hero h1 .accent { color: var(--accent); }
.cs-hero-sub {
  font-size: 18px; color: var(--muted);
  max-width: 460px; margin: 0 auto 32px; line-height: 1.65;
}
.cs-social-proof {
  display: flex; align-items: center;
  justify-content: center; gap: 10px;
  font-size: 13.5px; color: var(--muted);
}
.cs-avatars { display: flex; }
.cs-av {
  width: 30px; height: 30px; border-radius: 50%;
  border: 2px solid var(--bg); background: var(--surface2);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--accent);
}
.cs-av + .cs-av { margin-left: -8px; }

/* ── TAG FILTER ── */
.tag-filter {
  display: flex; flex-wrap: wrap;
  gap: 8px; justify-content: center;
  padding: 0 28px; margin-bottom: 40px;
}
.tag-btn {
  padding: 6px 16px; border-radius: 99px;
  font-size: 13px; font-weight: 500;
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

/* ── FEATURED CASE STUDY ── */
.featured-wrap { padding: 0 0 24px; }
.featured-card {
  display: grid; grid-template-columns: 1fr 1fr;
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 16px; overflow: hidden;
  transition: border-color .2s; text-decoration: none;
}
.featured-card:hover { border-color: rgba(79,110,247,.25); }
.featured-visual {
  min-height: 260px;
  background: linear-gradient(135deg, var(--surface), var(--surface2));
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.featured-stat {
  font-family: var(--font-display);
  font-size: 56px; font-weight: 800;
  color: var(--accent); position: relative; z-index: 1;
}
.featured-visual::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(79,110,247,.15), transparent);
  pointer-events: none;
}
.featured-content {
  padding: 40px; display: flex;
  flex-direction: column; justify-content: center; gap: 16px;
}
.featured-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.feat-tag {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  color: var(--accent); border-radius: 4px; padding: 2px 8px;
}
.featured-content h2 {
  font-family: var(--font-display);
  font-size: 24px; font-weight: 700;
  color: var(--white); line-height: 1.3;
  transition: color .2s;
}
.featured-card:hover .featured-content h2 { color: #3d5df5; }
.featured-content p { font-size: 15px; color: var(--muted); line-height: 1.65; }
.featured-author { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.featured-av {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--surface2); border: 2px solid rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--accent); flex-shrink: 0;
}
.featured-name { font-size: 13px; font-weight: 600; color: var(--white); }
.featured-role { font-size: 11.5px; color: var(--muted); }
.featured-cta {
  font-size: 13.5px; font-weight: 600; color: var(--accent);
  display: inline-flex; align-items: center; gap: 4px;
  transition: gap .2s;
}
.featured-card:hover .featured-cta { gap: 8px; }

/* ── CASE STUDY GRID ── */
.cs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px; padding-bottom: 96px;
}
.cs-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column;
  text-decoration: none;
  transition: border-color .2s, transform .2s;
}
.cs-card:hover { border-color: rgba(79,110,247,.25); transform: translateY(-4px); }
.cs-card-visual {
  width: 100%; height: 160px;
  background: linear-gradient(135deg, var(--surface2), var(--surface));
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.cs-card-stat {
  font-family: var(--font-display);
  font-size: 36px; font-weight: 800;
  color: var(--accent); opacity: .85;
  position: relative; z-index: 1;
}
.cs-card-visual::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(79,110,247,.1), transparent);
  pointer-events: none;
}
.cs-card-body { padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.cs-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.cs-tag {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  background: rgba(79,110,247,.12);
  border: 1px solid rgba(79,110,247,.25);
  color: var(--accent); border-radius: 4px; padding: 2px 7px;
}
.cs-card h3 {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 700;
  color: var(--white); line-height: 1.3;
  transition: color .2s;
}
.cs-card:hover h3 { color: var(--accent); }
.cs-card p { font-size: 13px; color: var(--muted); line-height: 1.6; flex: 1; }
.cs-card-footer {
  display: flex; align-items: center; gap: 10px;
  padding-top: 12px; border-top: 1px solid rgba(255,255,255,.07);
  margin-top: auto;
}
.cs-card-av {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--surface2); border: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0;
}
.cs-card-name { font-size: 12.5px; font-weight: 600; color: var(--text); }
.cs-card-role { font-size: 11px; color: var(--muted); }

/* hidden by tag filter */
.cs-card[data-hidden="true"] { display: none; }

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
@media (max-width: 1280px) { .cs-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1024px) { .cs-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px)  {
  .featured-card { grid-template-columns: 1fr; }
  .featured-visual { min-height: 180px; }
}
@media (max-width: 600px)  { .cs-grid { grid-template-columns: 1fr; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────────────────────
const html = `
<main>

  <!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
  <section class="cs-hero">
    <div class="container">
      <p class="section-label">📊 Case Studies</p>
      <h1>It just <span class="accent">works.</span></h1>
      <p class="cs-hero-sub">Real results, from real people. See how teams are growing organic traffic with Infin8Content.</p>
      <div class="cs-social-proof">
        <div class="cs-avatars">
          <div class="cs-av">JL</div>
          <div class="cs-av">MR</div>
          <div class="cs-av">AK</div>
          <div class="cs-av">SB</div>
          <div class="cs-av">TD</div>
        </div>
        Trusted by <strong style="color:var(--white);margin-left:4px;">10,000+</strong>&nbsp;Marketers &amp; Agencies
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════ TAG FILTER ════════════════════════════ -->
  <div class="tag-filter" id="tag-filter">
    <button class="tag-btn active" data-filter="All">All</button>
    <button class="tag-btn" data-filter="Agency">Agency</button>
    <button class="tag-btn" data-filter="SaaS">SaaS</button>
    <button class="tag-btn" data-filter="E-Commerce">E-Commerce</button>
    <button class="tag-btn" data-filter="Local">Local</button>
    <button class="tag-btn" data-filter="Media">Media</button>
    <button class="tag-btn" data-filter="AutoPublish">AutoPublish</button>
    <button class="tag-btn" data-filter="SEO Agent">SEO Agent</button>
  </div>

  <!-- ══════════════════════ FEATURED CASE STUDY ════════════════════════ -->
  <section class="featured-wrap">
    <div class="container">
      <a href="/resources/case-studies/zero-to-1600" class="featured-card" data-tags="Agency,WordPress">
        <div class="featured-visual">
          <span class="featured-stat">0 → 1,600/mo</span>
        </div>
        <div class="featured-content">
          <div class="featured-tags">
            <span class="feat-tag">Agency</span>
            <span class="feat-tag">WordPress</span>
          </div>
          <h2>From ZERO to 1,600/mo Traffic with AI Content</h2>
          <p>Patrick Walsh, founder of PublishingPush, used Infin8Content to grow his site's search traffic from 0 to 1,600 monthly visitors — in under 60 days, without any backlinks.</p>
          <div class="featured-author">
            <div class="featured-av">PW</div>
            <div>
              <p class="featured-name">Patrick Walsh</p>
              <p class="featured-role">Founder @ PublishingPush</p>
            </div>
          </div>
          <span class="featured-cta">Read full case study →</span>
        </div>
      </a>
    </div>
  </section>

  <!-- ══════════════════════ CASE STUDY GRID ════════════════════════════ -->
  <section>
    <div class="container">
      <div class="cs-grid" id="cs-grid">

        <a href="/resources/case-studies/selfemployed-26k" class="cs-card" data-tags="Media,AutoPublish">
          <div class="cs-card-visual"><span class="cs-card-stat">26,000/mo</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">Media</span><span class="cs-tag">AutoPublish</span></div>
            <h3>26,000/mo in Traffic with AI Content</h3>
            <p>SelfEmployed.com drove massive organic traffic growth using Infin8Content's AutoPublish feature.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">S</div>
              <div><p class="cs-card-name">SelfEmployed</p><p class="cs-card-role">Media Site</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/video-to-blog-5400" class="cs-card" data-tags="Agency,Video to Blog">
          <div class="cs-card-visual"><span class="cs-card-stat">5,400/mo</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">Agency</span><span class="cs-tag">Video to Blog</span></div>
            <h3>5,400/mo Traffic Converting Videos to Blog Posts</h3>
            <p>French agency owner Thibault converted English YouTube content into French blog posts using Infin8Content.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">T</div>
              <div><p class="cs-card-name">Thibault M.</p><p class="cs-card-role">Agency Owner @ Millennium Digital</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/smarterglass-300" class="cs-card" data-tags="E-Commerce,SEO Agent">
          <div class="cs-card-visual"><span class="cs-card-stat">300%</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">E-Commerce</span><span class="cs-tag">SEO Agent</span></div>
            <h3>300% Traffic Increase with AI SEO</h3>
            <p>SmarterGlass, an independent display panel distributor, increased search traffic for high-buying-intent keywords.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">S</div>
              <div><p class="cs-card-name">SmarterGlass</p><p class="cs-card-role">12+ year old company</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/real-gut-doctor" class="cs-card" data-tags="Local,Health">
          <div class="cs-card-visual"><span class="cs-card-stat">6,000/mo</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">Local</span><span class="cs-tag">Health</span></div>
            <h3>6,000 Monthly Visitors in the Competitive Health Niche</h3>
            <p>Dr. Jeffrey Mark used Infin8Content to drive more organic search traffic and customers to his practice.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">D</div>
              <div><p class="cs-card-name">Dr. Jeffrey Mark</p><p class="cs-card-role">Doctor of Medicine</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/helseforskning" class="cs-card" data-tags="Local,Multilingual">
          <div class="cs-card-visual"><span class="cs-card-stat">4,000/mo</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">Local</span><span class="cs-tag">Multilingual</span></div>
            <h3>4,000 Monthly Visitors in a Non-English Market</h3>
            <p>Helseforskning, a Norwegian business, grew local search traffic by 4,000 in just a few weeks.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">H</div>
              <div><p class="cs-card-name">Helseforskning</p><p class="cs-card-role">Norwegian Business</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/rauva-fintech" class="cs-card" data-tags="SaaS,Fintech">
          <div class="cs-card-visual"><span class="cs-card-stat">1,200 clicks</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">SaaS</span><span class="cs-tag">Fintech</span></div>
            <h3>1,200 Clicks per Month with AI SEO</h3>
            <p>Rauva, a fintech startup in Portugal, improved their SEO performance dramatically with Infin8Content.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">R</div>
              <div><p class="cs-card-name">Rauva</p><p class="cs-card-role">Fintech Company</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/under30ceo" class="cs-card" data-tags="Media,AutoPublish">
          <div class="cs-card-visual"><span class="cs-card-stat">14,000/mo</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">Media</span><span class="cs-tag">AutoPublish</span></div>
            <h3>From 0 to 14,000/mo in 60 Days</h3>
            <p>Under30CEO used Infin8Content to scale content and drove from zero to 14,000 monthly visitors in 60 days.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">U</div>
              <div><p class="cs-card-name">Under30CEO</p><p class="cs-card-role">Media Platform</p></div>
            </div>
          </div>
        </a>

        <a href="/resources/case-studies/rank-1-24hrs" class="cs-card" data-tags="SaaS,Case Study">
          <div class="cs-card-visual"><span class="cs-card-stat">#1 in 24hrs</span></div>
          <div class="cs-card-body">
            <div class="cs-card-tags"><span class="cs-tag">SaaS</span><span class="cs-tag">Case Study</span></div>
            <h3>Ranking #1 in 24 Hours (and outranking the competition)</h3>
            <p>Using Infin8Content's own product, the founder ranked a page at the top of Google in under 24 hours.</p>
            <div class="cs-card-footer">
              <div class="cs-card-av">V</div>
              <div><p class="cs-card-name">Vasco M.</p><p class="cs-card-role">Founder @ Infin8Content</p></div>
            </div>
          </div>
        </a>

      </div><!-- /cs-grid -->
    </div>
  </section>

  <!-- ═════════════════════════════ FINAL CTA ══════════════════════════ -->
  <section class="final-cta">
    <div class="container" style="position:relative;">
      <h2>Start writing your<br>own success story.</h2>
      <p>Join 10,000+ marketers growing organic traffic with Infin8Content.</p>
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
export default function CaseStudiesPage() {
  return <MarketingPageBody html={html} css={css} />;
}
