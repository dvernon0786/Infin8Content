import MarketingShell from "../../../../components/marketing/MarketingShell";
import MarketingPageBody from "../../../../components/marketing/MarketingPageBody";

// ─── Data ────────────────────────────────────────────────────
const fullTraining = [
  { title: "Infin8Content Full Guide (Updated 2026)", duration: "13 mins", emoji: "🎬", href: "#", badge: "Start here" },
  { title: "LLM Visibility Tracking Tutorial", duration: "5 mins", emoji: "🔭", href: "#" },
  { title: "Content Optimizer Walkthrough", duration: "2 mins 40 secs", emoji: "✏️", href: "#" },
  { title: "AI SEO Agent Tutorial", duration: "2 mins 40 secs", emoji: "⚙️", href: "#" },
];

const freeCourses = [
  { title: "LLM SEO Course", duration: "Full course", emoji: "🤖", href: "#", badge: "Most popular" },
  { title: "Local SEO Course", duration: "Full course", emoji: "📍", href: "#" },
  { title: "ChatGPT SEO Course", duration: "Full course", emoji: "💬", href: "#" },
  { title: "Rank & Rent SEO Course", duration: "Full course", emoji: "🏠", href: "#" },
  { title: "How to Force LLMs to Mention Your Site", duration: "Deep dive", emoji: "🧲", href: "#" },
  { title: "AI Content Strategy for 2026", duration: "Full course", emoji: "📈", href: "#" },
];

const quickGuides = [
  { icon: "🚀", title: "Getting Started in 10 Minutes", body: "Set up your first campaign, connect your CMS, and publish your first AI article.", href: "#" },
  { icon: "🔑", title: "Keyword Research with AI", body: "Find low-competition, high-buying-intent keywords your competitors haven't targeted yet.", href: "#" },
  { icon: "📊", title: "Reading Your Analytics", body: "Understand your traffic data, ranking improvements, and conversion metrics inside the dashboard.", href: "#" },
  { icon: "🔌", title: "CMS Integration Setup", body: "Step-by-step guides for connecting WordPress, Shopify, Webflow, Ghost, and more.", href: "#" },
];

// ─── HTML ─────────────────────────────────────────────────────
function buildHtml() {
  const trainingItems = fullTraining.map((v) => `
    <a href="${v.href}" class="lrn-video-card">
      <div class="lrn-video-thumb">
        <span class="lrn-video-emoji">${v.emoji}</span>
        <span class="lrn-play-icon">▶</span>
      </div>
      <div class="lrn-video-info">
        <div class="lrn-video-meta">
          ${v.badge ? `<span class="lrn-badge">${v.badge}</span>` : ""}
          <span class="lrn-duration">${v.duration}</span>
        </div>
        <div class="lrn-video-title">${v.title}</div>
      </div>
    </a>`).join("");

  const courseItems = freeCourses.map((c) => `
    <a href="${c.href}" class="lrn-course-card">
      <div class="lrn-course-left">
        <span class="lrn-course-emoji">${c.emoji}</span>
        <div>
          <div class="lrn-course-title">${c.title}</div>
          <div class="lrn-course-duration">${c.duration}</div>
        </div>
      </div>
      <div class="lrn-course-right">
        ${c.badge ? `<span class="lrn-badge lrn-badge-green">${c.badge}</span>` : ""}
        <span class="lrn-arrow">→</span>
      </div>
    </a>`).join("");

  const guideItems = quickGuides.map((g) => `
    <a href="${g.href}" class="lrn-guide-card">
      <div class="lrn-guide-icon">${g.icon}</div>
      <h4 class="lrn-guide-title">${g.title}</h4>
      <p class="lrn-guide-body">${g.body}</p>
      <span class="lrn-guide-cta">Read guide →</span>
    </a>`).join("");

  return `
<main class="lrn-root">

  <!-- Hero -->
  <section class="lrn-hero">
    <div class="container">
      <div class="lrn-eyebrow">
        <span>📚</span> Learning &amp; Training
      </div>
      <h1>Master AI-Powered SEO.<br><span class="lrn-accent">Free, on your schedule.</span></h1>
      <p class="lrn-hero-sub">Video walkthroughs, deep-dive courses, and quick guides — everything you need to get the most out of Infin8Content and stay ahead of AI search.</p>
      <div class="lrn-hero-cta">
        <a href="#training" class="btn btn-primary btn-lg">Start Learning</a>
        <a href="#courses" class="btn btn-ghost">Browse courses</a>
      </div>
      <div class="lrn-stats">
        <div class="lrn-stat"><strong>12+</strong> video tutorials</div>
        <div class="lrn-stat-divider"></div>
        <div class="lrn-stat"><strong>6</strong> free courses</div>
        <div class="lrn-stat-divider"></div>
        <div class="lrn-stat"><strong>100%</strong> free forever</div>
      </div>
    </div>
  </section>

  <!-- Training Videos -->
  <section class="mkt-section" id="training">
    <div class="container">
      <div class="lrn-section-head">
        <div>
          <div class="mkt-section-label">📹 Product walkthroughs</div>
          <h2 class="mkt-section-title">Official Training Videos</h2>
          <p class="mkt-section-sub">Get up to speed fast with step-by-step video guides made by the Infin8Content team.</p>
        </div>
      </div>
      <div class="lrn-video-grid">${trainingItems}</div>
    </div>
  </section>

  <!-- Free Courses Band -->
  <section class="mkt-section mkt-section-alt" id="courses">
    <div class="container">
      <div class="lrn-section-head">
        <div>
          <div class="mkt-section-label">🎓 Free courses</div>
          <h2 class="mkt-section-title">SEO &amp; AI Courses</h2>
          <p class="mkt-section-sub">Industry-leading courses on LLM SEO, local search, AI content strategy, and more — completely free.</p>
        </div>
      </div>
      <div class="lrn-courses-list">${courseItems}</div>
    </div>
  </section>

  <!-- Quick Guides -->
  <section class="mkt-section" id="guides">
    <div class="container">
      <div class="lrn-section-head">
        <div>
          <div class="mkt-section-label">⚡ Quick guides</div>
          <h2 class="mkt-section-title">Get Things Done Fast</h2>
          <p class="mkt-section-sub">Short, focused guides that answer the most common questions our users have.</p>
        </div>
      </div>
      <div class="lrn-guides-grid">${guideItems}</div>
    </div>
  </section>

  <!-- Community CTA -->
  <section class="lrn-community">
    <div class="container">
      <div class="lrn-community-inner">
        <div class="lrn-community-text">
          <div class="mkt-section-label">💬 Community</div>
          <h2 class="mkt-section-title" style="margin-bottom:10px">Still have questions?</h2>
          <p class="mkt-section-sub">Join thousands of SEOs and marketers in the Infin8Content community. Share strategies, ask questions, and stay ahead of AI search trends together.</p>
          <div class="lrn-community-actions">
            <a href="#" class="btn btn-primary">Join the community</a>
            <a href="#" class="btn btn-ghost">Help docs →</a>
          </div>
        </div>
        <div class="lrn-community-card">
          <div class="lrn-comm-badge">🌟 Active community</div>
          <div class="lrn-comm-stat">10,000+</div>
          <div class="lrn-comm-label">marketers &amp; SEOs</div>
          <div class="lrn-comm-topics">
            <div class="lrn-comm-topic">LLM SEO strategies</div>
            <div class="lrn-comm-topic">AI content tips</div>
            <div class="lrn-comm-topic">Platform Q&amp;A</div>
            <div class="lrn-comm-topic">Case studies</div>
          </div>
        </div>
      </div>
    </div>
  </section>

</main>
`;
}

// ─── CSS ─────────────────────────────────────────────────────
const css = `
/* ── LEARN PAGE ── */
.lrn-root { background: var(--bg); }

/* Hero */
.lrn-hero {
  padding: 90px 0 70px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.lrn-hero::before {
  content: '';
  position: absolute;
  top: -100px; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 700px;
  background: radial-gradient(ellipse, rgba(79,110,247,0.13) 0%, transparent 65%);
  pointer-events: none;
}
.lrn-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent-lite); border: 1px solid var(--accent-border);
  border-radius: 20px; padding: 5px 14px;
  font-size: 13px; font-weight: 500; color: #a5b4fc;
  margin-bottom: 22px;
}
.lrn-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(32px,5.2vw,58px);
  font-weight: 800; line-height: 1.08; letter-spacing: -1.5px;
  color: var(--white); max-width: 780px; margin: 0 auto 18px;
}
.lrn-accent { color: var(--accent); font-style: italic; }
.lrn-hero-sub {
  font-size: 18px; color: var(--muted);
  max-width: 560px; margin: 0 auto 30px; line-height: 1.65;
}
.lrn-hero-cta { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
.lrn-stats { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
.lrn-stat { font-size: 14px; color: var(--muted); }
.lrn-stat strong { color: var(--white); font-weight: 700; font-size: 15px; margin-right: 4px; }
.lrn-stat-divider { width: 1px; height: 18px; background: var(--border); }

/* Section header */
.lrn-section-head { margin-bottom: 36px; }

/* Video grid */
.lrn-video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.lrn-video-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s;
  display: flex; flex-direction: column;
}
.lrn-video-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-3px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}
.lrn-video-thumb {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--surface2), #0d1028);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  border-bottom: 1px solid var(--border);
}
.lrn-video-emoji { font-size: 40px; opacity: 0.6; }
.lrn-play-icon {
  position: absolute; bottom: 10px; right: 10px;
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(79,110,247,0.85);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff;
  box-shadow: 0 4px 12px rgba(79,110,247,0.4);
  transition: transform 0.2s;
}
.lrn-video-card:hover .lrn-play-icon { transform: scale(1.15); }
.lrn-video-info { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
.lrn-video-meta { display: flex; align-items: center; gap: 8px; }
.lrn-badge {
  background: var(--accent-lite); border: 1px solid var(--accent-border);
  border-radius: 4px; padding: 2px 8px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--accent);
}
.lrn-badge-green {
  background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.25); color: var(--green);
}
.lrn-duration {
  font-size: 12px; color: var(--muted2); font-weight: 500;
}
.lrn-video-title {
  font-family: var(--font-display); font-size: 14px; font-weight: 600;
  color: var(--text); line-height: 1.4;
}

/* Courses list */
.lrn-courses-list {
  display: flex; flex-direction: column; gap: 2px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.lrn-course-card {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface);
  padding: 18px 22px;
  text-decoration: none;
  transition: background 0.15s;
  gap: 16px;
}
.lrn-course-card:hover { background: var(--surface2); }
.lrn-course-left { display: flex; align-items: center; gap: 16px; }
.lrn-course-emoji { font-size: 26px; flex-shrink: 0; }
.lrn-course-title {
  font-family: var(--font-display); font-size: 15px; font-weight: 600;
  color: var(--text); margin-bottom: 3px;
}
.lrn-course-duration { font-size: 12.5px; color: var(--muted); }
.lrn-course-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.lrn-arrow { font-size: 16px; color: var(--muted2); transition: transform 0.2s, color 0.2s; }
.lrn-course-card:hover .lrn-arrow { transform: translateX(4px); color: var(--accent); }

/* Quick guides */
.lrn-guides-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.lrn-guide-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 26px 22px;
  text-decoration: none;
  transition: all 0.2s;
  display: flex; flex-direction: column; gap: 10px;
}
.lrn-guide-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-3px);
}
.lrn-guide-icon { font-size: 28px; }
.lrn-guide-title {
  font-family: var(--font-display); font-size: 15px; font-weight: 600;
  color: var(--white); line-height: 1.3;
}
.lrn-guide-body {
  font-size: 13.5px; color: var(--muted); line-height: 1.6; flex: 1;
}
.lrn-guide-cta {
  font-size: 13px; font-weight: 600; color: var(--accent);
  transition: gap 0.2s;
}
.lrn-guide-card:hover .lrn-guide-cta { text-decoration: underline; }

/* Community */
.lrn-community { padding: 90px 0; }
.lrn-community-inner {
  display: grid; grid-template-columns: 1fr 380px; gap: 64px; align-items: center;
}
.lrn-community-actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.lrn-community-card {
  background: var(--surface);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius);
  padding: 32px 28px;
  box-shadow: 0 0 40px rgba(79,110,247,0.1);
  text-align: center;
}
.lrn-comm-badge {
  display: inline-block; background: rgba(79,110,247,0.1);
  border: 1px solid var(--accent-border);
  border-radius: 20px; padding: 4px 14px;
  font-size: 12px; font-weight: 600; color: var(--accent);
  margin-bottom: 18px;
}
.lrn-comm-stat {
  font-family: var(--font-display); font-size: 52px; font-weight: 800;
  color: var(--white); letter-spacing: -2px; line-height: 1;
  margin-bottom: 4px;
}
.lrn-comm-label { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
.lrn-comm-topics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lrn-comm-topic {
  background: rgba(255,255,255,0.04); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 10px;
  font-size: 12.5px; color: var(--muted); text-align: center;
}

/* Responsive */
@media (max-width: 1024px) {
  .lrn-video-grid { grid-template-columns: repeat(2, 1fr); }
  .lrn-guides-grid { grid-template-columns: repeat(2, 1fr); }
  .lrn-community-inner { grid-template-columns: 1fr; }
  .lrn-community-card { max-width: 420px; }
}
@media (max-width: 600px) {
  .lrn-video-grid { grid-template-columns: 1fr; }
  .lrn-guides-grid { grid-template-columns: 1fr; }
}
`;

// ─── Page ─────────────────────────────────────────────────────
export default function LearnPage() {
  return (
    <MarketingShell>
      <MarketingPageBody html={buildHtml()} css={css} />
    </MarketingShell>
  );
}