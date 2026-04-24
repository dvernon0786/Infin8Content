"use client";

import { useEffect } from "react";

// Help Center — Marketing pages group is wrapped by MarketingShell via (marketing-pages)/layout.tsx
// This page injects its own CSS/HTML and wires imperative JS for search/navigation.

const css = `
/* ===== HELP HERO ===== */
.help-hero { padding: 72px 0 56px; text-align: center; position: relative; overflow: hidden; }
.help-hero::before { content:''; position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:800px; height:600px; background:radial-gradient(circle, rgba(79,110,247,.11) 0%, transparent 65%); pointer-events:none; }
.help-hero::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent, rgba(79,110,247,.25), transparent); }
.hero-eyebrow { display:inline-flex; align-items:center; gap:6px; background:var(--accent-lite); border:1px solid var(--accent-border); border-radius:20px; padding:5px 14px; font-size:12.5px; font-weight:600; font-family:var(--font-display); color:#a5b4fc; margin-bottom:20px; letter-spacing:.02em; }
.help-hero h1 { font-family:var(--font-display); font-size:clamp(32px,5vw,54px); font-weight:800; letter-spacing:-1.5px; color:var(--white); margin-bottom:14px; line-height:1.08; }
.help-hero h1 .high { color:var(--accent); font-style:italic; }
.help-hero .sub { font-size:17px; color:var(--muted); max-width:480px; margin:0 auto 32px; line-height:1.65; }
.search-wrap { max-width:580px; margin:0 auto 20px; position:relative; }
.search-wrap input { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 20px 16px 48px; font-size:15px; font-family:var(--font-body); color:var(--text); outline:none; transition:border-color .2s; }
.search-wrap input::placeholder { color:var(--muted2); }
.search-wrap input:focus { border-color:var(--accent-border); box-shadow:0 0 0 3px var(--accent-lite); }
.search-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:16px; color:var(--muted2); pointer-events:none; }
.search-tags { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; margin-top:16px; }
.search-tag { background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:20px; padding:4px 12px; font-size:12px; color:var(--muted); cursor:pointer; transition:all .15s; }
.search-tag:hover { border-color:var(--accent-border); color:#a5b4fc; background:var(--accent-lite); }

/* ===== MAIN LAYOUT ===== */
.help-body { display:grid; grid-template-columns:240px 1fr; gap:0; max-width:var(--container); margin:0 auto; padding:0 28px; min-height:calc(100vh - 300px); }

/* ===== SIDEBAR ===== */
.help-sidebar { border-right:1px solid var(--border); padding:40px 0 40px; position:sticky; top:62px; height:calc(100vh - 62px); overflow-y:auto; }
.help-sidebar::-webkit-scrollbar { width:4px; }
.help-sidebar::-webkit-scrollbar-track { background:transparent; }
.help-sidebar::-webkit-scrollbar-thumb { background:var(--muted2); border-radius:2px; }
.sidebar-section { margin-bottom:28px; }
.sidebar-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--muted2); padding:0 16px; margin-bottom:6px; }
.sidebar-link { display:flex; align-items:center; gap:9px; padding:8px 16px; border-radius:var(--radius-sm); font-size:13.5px; color:var(--muted); cursor:pointer; transition:all .15s; border:none; background:none; width:100%; text-align:left; margin-bottom:1px; }
.sidebar-link:hover { color:var(--white); background:rgba(255,255,255,.04); }
.sidebar-link.active { color:var(--white); background:var(--accent-lite); }
.sidebar-link.active .sl-icon { color:var(--accent); }
.sl-icon { font-size:14px; flex-shrink:0; }
.sidebar-divider { height:1px; background:var(--border); margin:18px 16px; }

/* ===== CONTENT AREA ===== */
.help-content { padding:40px 0 60px 48px; min-width:0; }

/* ===== CATEGORY GRID ===== */
.category-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:14px; }
.cat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:24px; cursor:pointer; transition:all .2s; display:block; text-align:left; }
.cat-card:hover { border-color:var(--accent-border); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,.3), 0 0 0 1px var(--accent-border); }
.cat-card-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:14px; }
.cat-card-title { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--white); margin-bottom:6px; }
.cat-card-desc { font-size:13px; color:var(--muted); line-height:1.55; margin-bottom:14px; }
.cat-card-count { font-size:11.5px; font-weight:600; font-family:var(--font-display); color:var(--accent); background:var(--accent-lite); border:1px solid var(--accent-border); border-radius:20px; padding:3px 10px; display:inline-block; }

/* ===== ARTICLE LIST ===== */
.panel-header-row { display:flex; align-items:center; gap:12px; margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid var(--border); }
.panel-back { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:var(--radius-sm); padding:7px 12px; font-size:13px; color:var(--muted); cursor:pointer; transition:all .15s; }
.panel-back:hover { border-color:var(--accent-border); color:var(--white); }
.panel-title-row { display:flex; align-items:center; gap:10px; }
.panel-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
.panel-title { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--white); }

.article-list { display:flex; flex-direction:column; gap:3px; }
.article-row { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:16px 20px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; transition:all .15s; }
.article-row:hover { border-color:var(--accent-border); background:rgba(79,110,247,.04); }
.article-row-left { display:flex; align-items:center; gap:14px; min-width:0; }
.article-row-icon { font-size:18px; flex-shrink:0; }
.article-row-title { font-size:14px; font-weight:600; color:var(--text); margin-bottom:2px; }
.article-row-meta { font-size:12px; color:var(--muted2); }
.article-row-arrow { color:var(--muted2); font-size:16px; flex-shrink:0; transition:transform .15s; }
.article-row:hover .article-row-arrow { transform:translateX(3px); color:var(--accent); }

/* ===== ARTICLE VIEW ===== */
.article-view { max-width:720px; }
.article-view h1 { font-family:var(--font-display); font-size:28px; font-weight:800; letter-spacing:-.5px; color:var(--white); margin-bottom:10px; line-height:1.15; }
.article-meta-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid var(--border); }
.art-tag { display:inline-flex; align-items:center; gap:5px; background:var(--accent-lite); border:1px solid var(--accent-border); border-radius:20px; padding:4px 10px; font-size:11.5px; font-weight:600; font-family:var(--font-display); color:#a5b4fc; }
.art-tag-plain { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:20px; padding:4px 10px; font-size:11.5px; color:var(--muted); }
.article-view h2 { font-family:var(--font-display); font-size:19px; font-weight:700; color:var(--white); margin:28px 0 10px; }
.article-view h3 { font-family:var(--font-display); font-size:15px; font-weight:600; color:#a5b4fc; margin:20px 0 8px; }
.article-view p { font-size:14.5px; color:var(--muted); line-height:1.75; margin-bottom:14px; }
.article-view p strong { color:var(--text); }
.article-view ul, .article-view ol { padding-left:0; margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
.article-view ul li { font-size:14px; color:var(--muted); display:flex; align-items:flex-start; gap:8px; line-height:1.6; }
.article-view ul li::before { content:'→'; color:var(--accent); flex-shrink:0; font-weight:700; margin-top:1px; }
.article-view ol { counter-reset:ol-counter; }
.article-view ol li { font-size:14px; color:var(--muted); display:flex; align-items:flex-start; gap:12px; line-height:1.6; counter-increment:ol-counter; }
.article-view ol li::before { content:counter(ol-counter); min-width:24px; height:24px; background:var(--accent-lite); border:1px solid var(--accent-border); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; font-family:var(--font-display); color:var(--accent); flex-shrink:0; margin-top:1px; }
.article-view code { background:rgba(255,255,255,.06); border:1px solid var(--border); border-radius:5px; padding:2px 7px; font-size:12.5px; font-family:'Courier New',monospace; color:#a5b4fc; }
.article-view pre { background:#0d0f18; border:1px solid var(--border); border-radius:10px; padding:20px; margin:16px 0; overflow-x:auto; }
.article-view pre code { background:none; border:none; color:#c4cef7; font-size:13px; padding:0; }
.article-view table { width:100%; border-collapse:collapse; margin:16px 0; font-size:13.5px; }
.article-view th { background:rgba(79,110,247,.1); color:#a5b4fc; padding:10px 14px; text-align:left; border:1px solid rgba(79,110,247,.15); font-family:var(--font-display); font-size:12px; font-weight:700; letter-spacing:.03em; }
.article-view td { padding:10px 14px; border:1px solid var(--border); color:var(--muted); vertical-align:top; }
.article-view tr:nth-child(even) td { background:rgba(255,255,255,.02); }

/* callout boxes */
.callout { border-radius:10px; padding:16px 18px; margin:16px 0; display:flex; gap:12px; }
.callout-info { background:var(--blue-lite); border:1px solid rgba(59,130,246,.2); }
.callout-tip { background:var(--accent-lite); border:1px solid var(--accent-border); }
.callout-warn { background:var(--amber-lite); border:1px solid rgba(245,158,11,.2); }
.callout-danger { background:var(--red-lite); border:1px solid rgba(239,68,68,.2); }
.callout-success { background:var(--green-lite); border:1px solid rgba(34,197,94,.2); }
.callout-emoji { font-size:16px; flex-shrink:0; margin-top:1px; }
.callout-body { flex:1; }
.callout-label { font-family:var(--font-display); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
.callout-info .callout-label { color:#93c5fd; }
.callout-tip .callout-label { color:#a5b4fc; }
.callout-warn .callout-label { color:#fcd34d; }
.callout-danger .callout-label { color:#fca5a5; }
.callout-success .callout-label { color:#86efac; }
.callout-body p { font-size:13.5px; line-height:1.6; margin:0; }
.callout-info p { color:#93c5fd; }
.callout-tip p { color:#c7d2fe; }
.callout-warn p { color:#fde68a; }
.callout-danger p { color:#fecaca; }
.callout-success p { color:#bbf7d0; }

/* steps */
.step-list { display:flex; flex-direction:column; gap:0; margin:16px 0; }
.step-item { display:flex; gap:16px; padding:18px 0; border-bottom:1px solid var(--border2); }
.step-item:last-child { border-bottom:none; }
.step-num { width:32px; height:32px; border-radius:50%; background:rgba(79,110,247,.12); border:1px solid var(--accent-border); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--accent); flex-shrink:0; margin-top:2px; }
.step-body strong { display:block; font-size:14.5px; font-family:var(--font-display); color:var(--white); margin-bottom:4px; }
.step-body p { font-size:13.5px; color:var(--muted); margin:0; line-height:1.6; }

/* status badges */
.badge { display:inline-flex; align-items:center; gap:4px; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; font-family:var(--font-display); letter-spacing:.02em; }
.badge-blue { background:var(--accent-lite); border:1px solid var(--accent-border); color:#a5b4fc; }
.badge-green { background:var(--green-lite); border:1px solid rgba(34,197,94,.2); color:#86efac; }
.badge-amber { background:var(--amber-lite); border:1px solid rgba(245,158,11,.2); color:#fcd34d; }
.badge-red { background:var(--red-lite); border:1px solid rgba(239,68,68,.2); color:#fca5a5; }
.badge-gray { background:rgba(255,255,255,.04); border:1px solid var(--border); color:var(--muted); }
.badge-purple { background:rgba(168,85,247,.1); border:1px solid rgba(168,85,247,.25); color:#d8b4fe; }

/* ===== HOME STATS BAR ===== */
.home-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:36px; }
.stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px 22px; display:flex; align-items:center; gap:14px; }
.stat-icon { font-size:22px; }
.stat-num { font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--white); }
.stat-label { font-size:12px; color:var(--muted); }

/* ===== SECTION LABEL ===== */
.content-section-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--muted2); margin-bottom:14px; font-family:var(--font-display); }

/* ===== PANELS ===== */
#home-view { display:block; }
.view { display:none; }
.view.active { display:block; }

/* ===== MOBILE ===== */
@media(max-width:860px){
  .help-body { grid-template-columns:1fr; }
  .help-sidebar { display:none; position:static; height:auto; border-right:none; border-bottom:1px solid var(--border); padding:20px 0; }
  .help-sidebar.open { display:block; }
  .help-content { padding:32px 0 40px; }
  .category-grid { grid-template-columns:1fr; }
  .home-stats { grid-template-columns:1fr; }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
.fade-up { animation:fadeUp .5s ease forwards; }
.fade-up:nth-child(1){animation-delay:.04s}.fade-up:nth-child(2){animation-delay:.1s}.fade-up:nth-child(3){animation-delay:.16s}.fade-up:nth-child(4){animation-delay:.22s}.fade-up:nth-child(5){animation-delay:.28s}.fade-up:nth-child(6){animation-delay:.34s}.fade-up:nth-child(7){animation-delay:.4s}.fade-up:nth-child(8){animation-delay:.46s}
`;

const html = `
  <!-- HERO -->
  <div class="help-hero">
    <div class="container">
      <div class="hero-eyebrow fade-up">📚 &nbsp;Help Center</div>
      <h1 class="fade-up">How can we <span class="high">help you?</span></h1>
      <p class="sub fade-up">Guides, walkthroughs and references for every feature in Infin8Content.</p>
      <div class="search-wrap fade-up">
        <span class="search-icon">🔍</span>
        <input type="text" id="search-input" placeholder="Search articles… e.g. WordPress, workflow, API keys" oninput="handleSearch(this.value)" />
      </div>
      <div class="search-tags fade-up">
        <span class="search-tag" onclick="triggerSearch('WordPress')">WordPress</span>
        <span class="search-tag" onclick="triggerSearch('workflow')">Intent Workflow</span>
        <span class="search-tag" onclick="triggerSearch('API')">API Keys</span>
        <span class="search-tag" onclick="triggerSearch('stuck')">Stuck article</span>
        <span class="search-tag" onclick="triggerSearch('publish')">Publishing</span>
        <span class="search-tag" onclick="triggerSearch('billing')">Billing</span>
      </div>
    </div>
  </div>

  <!-- MAIN BODY -->
  <div class="help-body">

    <!-- SIDEBAR -->
    <aside class="help-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-label">Browse</div>
        <button class="sidebar-link active" onclick="showHome()"><span class="sl-icon">🏠</span> Home</button>
        <button class="sidebar-link" onclick="navTo('getting-started')"><span class="sl-icon">🚀</span> Getting Started</button>
        <button class="sidebar-link" onclick="navTo('how-to')"><span class="sl-icon">📖</span> How-to Guides</button>
        <button class="sidebar-link" onclick="navTo('workflows')"><span class="sl-icon">🗺️</span> Intent Workflows</button>
        <button class="sidebar-link" onclick="navTo('campaigns')"><span class="sl-icon">📣</span> Campaigns &amp; Autoblogs</button>
        <button class="sidebar-link" onclick="navTo('feeds')"><span class="sl-icon">📡</span> Feeds</button>
        <button class="sidebar-link" onclick="navTo('article-templates')"><span class="sl-icon">📝</span> Article Templates</button>
        <button class="sidebar-link" onclick="navTo('integrations')"><span class="sl-icon">🔌</span> Integrations</button>
        <button class="sidebar-link" onclick="navTo('seo')"><span class="sl-icon">📊</span> SEO &amp; Analytics</button>
        <button class="sidebar-link" onclick="navTo('features')"><span class="sl-icon">⚡</span> Features</button>
        <button class="sidebar-link" onclick="navTo('issues')"><span class="sl-icon">🛠️</span> Common Issues</button>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <div class="sidebar-label">Support</div>
        <button class="sidebar-link"><span class="sl-icon">💬</span> Contact Support</button>
        <button class="sidebar-link"><span class="sl-icon">🔄</span> System Status</button>
        <button class="sidebar-link"><span class="sl-icon">📋</span> Changelog</button>
      </div>
    </aside>

    <!-- CONTENT -->
    <main class="help-content">

      <!-- HOME VIEW -->
      <div id="home-view">
        <div class="home-stats">
          <div class="stat-card fade-up"><span class="stat-icon">📄</span><div><div class="stat-num">60+</div><div class="stat-label">Help articles</div></div></div>
          <div class="stat-card fade-up"><span class="stat-icon">⚡</span><div><div class="stat-num">10</div><div class="stat-label">Topic categories</div></div></div>
          <div class="stat-card fade-up"><span class="stat-icon">🔌</span><div><div class="stat-num">7</div><div class="stat-label">CMS integrations</div></div></div>
        </div>

        <div class="content-section-label">Browse by topic</div>
        <div class="category-grid">
          <div class="cat-card fade-up" onclick="navTo('getting-started')">
            <div class="cat-card-icon" style="background:rgba(79,110,247,.12);">🚀</div>
            <div class="cat-card-title">Getting Started</div>
            <div class="cat-card-desc">Create your account, complete onboarding, and generate your first article in minutes.</div>
            <span class="cat-card-count">7 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('how-to')">
            <div class="cat-card-icon" style="background:rgba(34,197,94,.1);">📖</div>
            <div class="cat-card-title">How-to Guides</div>
            <div class="cat-card-desc">Step-by-step walkthroughs for publishing, scheduling, keyword research, and more.</div>
            <span class="cat-card-count">8 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('workflows')">
            <div class="cat-card-icon" style="background:rgba(245,158,11,.1);">🗺️</div>
            <div class="cat-card-title">Intent Workflow Engine</div>
            <div class="cat-card-desc">Master the 9-step ICP → keyword → cluster → article pipeline with human approval gates.</div>
            <span class="cat-card-count">8 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('campaigns')">
            <div class="cat-card-icon" style="background:rgba(168,85,247,.1);">📣</div>
            <div class="cat-card-title">Campaigns &amp; Autoblogs</div>
            <div class="cat-card-desc">Automated content campaigns, bulk article generation, and always-on publishing pipelines.</div>
            <span class="cat-card-count">6 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('feeds')">
            <div class="cat-card-icon" style="background:rgba(34,197,94,.1);">📡</div>
            <div class="cat-card-title">Feeds</div>
            <div class="cat-card-desc">Connect RSS feeds, news sources, and trend signals to fuel automated content discovery.</div>
            <span class="cat-card-count">6 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('article-templates')">
            <div class="cat-card-icon" style="background:rgba(79,110,247,.12);">📝</div>
            <div class="cat-card-title">Article Templates</div>
            <div class="cat-card-desc">Configure writing styles, tone, audience targeting, and content defaults.</div>
            <span class="cat-card-count">6 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('integrations')">
            <div class="cat-card-icon" style="background:rgba(239,68,68,.1);">🔌</div>
            <div class="cat-card-title">Integrations</div>
            <div class="cat-card-desc">Connect WordPress, Ghost, Notion, Shopify, Webflow, social platforms, and the v1 API.</div>
            <span class="cat-card-count">11 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('seo')">
            <div class="cat-card-icon" style="background:rgba(34,197,94,.1);">📊</div>
            <div class="cat-card-title">SEO &amp; Analytics</div>
            <div class="cat-card-desc">Understand SEO scores, DataForSEO keyword research, and performance analytics.</div>
            <span class="cat-card-count">5 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('features')">
            <div class="cat-card-icon" style="background:rgba(168,85,247,.1);">⚡</div>
            <div class="cat-card-title">Features</div>
            <div class="cat-card-desc">LLM Visibility Tracker, Backlink Exchange, Bulk Actions, the Public v1 API, and more.</div>
            <span class="cat-card-count">9 articles</span>
          </div>
          <div class="cat-card fade-up" onclick="navTo('issues')">
            <div class="cat-card-icon" style="background:rgba(245,158,11,.1);">🛠️</div>
            <div class="cat-card-title">Common Issues</div>
            <div class="cat-card-desc">Troubleshoot stuck articles, failed publishing, payment errors, and CMS connection problems.</div>
            <span class="cat-card-count">8 articles</span>
          </div>
        </div>
      </div>

      <!-- CATEGORY VIEWS (dynamically populated) -->
      <div id="category-view" class="view"></div>

      <!-- ARTICLE VIEW -->
      <div id="article-view" class="view">
        <div class="panel-header-row">
          <button class="panel-back" onclick="goBackFromArticle()">← Back</button>
        </div>
        <div id="article-body" class="article-view"></div>
      </div>

      <!-- SEARCH RESULTS -->
      <div id="search-view" class="view">
        <div class="panel-header-row">
          <button class="panel-back" onclick="showHome()">← Back</button>
          <div class="panel-title">Search results for: <span id="search-query-label" style="color:var(--accent)"></span></div>
        </div>
        <div id="search-results" class="article-list"></div>
      </div>

    </main>
  </div>
`;

export default function HelpPage() {
  useEffect(() => {
    // ============================================================
    // ARTICLE DATA
    // ============================================================
    const CATEGORIES: Record<string, any> = {
      'getting-started': { icon:'🚀', label:'Getting Started', color:'rgba(79,110,247,.12)', articles:[
        {id:'onboarding-wizard', icon:'🧭', title:'Completing the 7-step Onboarding Wizard', meta:'Onboarding · 5 min read'},
        {id:'first-article', icon:'✍️', title:'Generating your first article', meta:'Articles · 4 min read'},
        {id:'dashboard-overview', icon:'🏠', title:'Dashboard overview & navigation', meta:'Dashboard · 4 min read'},
        {id:'invite-team', icon:'👥', title:'Inviting team members & setting roles', meta:'Team · 3 min read'},
        {id:'plans-billing', icon:'💳', title:'Plans, billing & article quotas', meta:'Billing · 4 min read'},
        {id:'connect-cms', icon:'🔌', title:'Connecting your first CMS', meta:'Integrations · 5 min read'},
        {id:'create-account', icon:'👤', title:'Creating your account & first login', meta:'Account · 3 min read'},
      ]},
      'how-to': { icon:'📖', label:'How-to Guides', color:'rgba(34,197,94,.1)', articles:[
        {id:'generate-article-guide', icon:'⚡', title:'How to generate an article from a keyword', meta:'Articles · 5 min read'},
        {id:'publish-cms', icon:'🚀', title:'How to publish an article to your CMS', meta:'Publishing · 4 min read'},
        {id:'schedule-article', icon:'📅', title:'How to schedule future publishing', meta:'Publishing · 3 min read'},
        {id:'bulk-actions', icon:'☑️', title:'How to use Bulk Actions (archive, delete, re-run)', meta:'Articles · 3 min read'},
        {id:'keyword-research-guide', icon:'🔍', title:'How to run keyword research with DataForSEO', meta:'SEO · 5 min read'},
        {id:'export-data', icon:'📤', title:'How to export analytics data (CSV & PDF)', meta:'Analytics · 3 min read'},
        {id:'manage-api-keys', icon:'🔑', title:'How to create & manage v1 API keys', meta:'API · 4 min read'},
        {id:'manage-team', icon:'👥', title:'How to manage your team & permissions', meta:'Team · 3 min read'},
      ]},
      'workflows': { icon:'🗺️', label:'Intent Workflow Engine', color:'rgba(245,158,11,.1)', articles:[
        {id:'workflow-intro', icon:'💡', title:'What is the Intent Workflow Engine?', meta:'Overview · 4 min read'},
        {id:'workflow-create', icon:'➕', title:'Creating a new Intent Workflow', meta:'Workflows · 4 min read'},
        {id:'step-icp', icon:'🎯', title:'Step 1–2: Defining your ICP & analyzing competitors', meta:'Workflows · 5 min read'},
        {id:'step-keywords', icon:'🔑', title:'Step 3–5: Seed keywords, longtails & filtering', meta:'Workflows · 5 min read'},
        {id:'step-clusters', icon:'🔬', title:'Step 6–8: Clustering, validation & subtopics', meta:'Workflows · 5 min read'},
        {id:'human-approval', icon:'✅', title:'Understanding the two Human Approval Gates', meta:'Workflows · 4 min read'},
        {id:'queue-articles', icon:'📋', title:'Step 9: Reviewing & queuing articles for generation', meta:'Workflows · 3 min read'},
        {id:'workflow-status', icon:'📊', title:'Workflow statuses explained', meta:'Workflows · 3 min read'},
      ]},
      'campaigns': { icon:'📣', label:'Campaigns & Autoblogs', color:'rgba(168,85,247,.1)', articles:[
        {id:'campaigns-intro', icon:'💡', title:'What are Campaigns & Autoblogs?', meta:'Overview · 4 min read'},
        {id:'campaign-create', icon:'➕', title:'Creating your first Campaign', meta:'Campaigns · 5 min read'},
        {id:'autoblog-setup', icon:'🤖', title:'Setting up an Autoblog pipeline', meta:'Autoblogs · 5 min read'},
        {id:'campaign-schedule', icon:'📅', title:'Scheduling & cadence settings', meta:'Campaigns · 4 min read'},
        {id:'campaign-monitor', icon:'📈', title:'Monitoring campaign progress & output', meta:'Campaigns · 3 min read'},
        {id:'campaign-troubleshoot', icon:'🛠️', title:'Campaign paused or articles not generating', meta:'Troubleshooting · 3 min read'},
      ]},
      'feeds': { icon:'📡', label:'Feeds', color:'rgba(34,197,94,.1)', articles:[
        {id:'feeds-intro', icon:'💡', title:'What are Feeds & how do they work?', meta:'Overview · 3 min read'},
        {id:'rss-feed', icon:'📰', title:'Connecting an RSS feed as a content source', meta:'Feeds · 4 min read'},
        {id:'news-poller', icon:'📡', title:'Trending topics & news polling explained', meta:'Feeds · 4 min read'},
        {id:'feed-to-campaign', icon:'🔗', title:'Using a feed to trigger a Campaign', meta:'Feeds · 4 min read'},
        {id:'feed-filters', icon:'🎛️', title:'Filtering feed items by keyword & relevance', meta:'Feeds · 3 min read'},
        {id:'feed-troubleshoot', icon:'🛠️', title:'Feed not updating or showing stale items', meta:'Troubleshooting · 3 min read'},
      ]},
      'article-templates': { icon:'📝', label:'Article Templates', color:'rgba(79,110,247,.12)', articles:[
        {id:'content-defaults', icon:'⚙️', title:'Setting your content defaults (tone, length, style)', meta:'Templates · 4 min read'},
        {id:'writing-styles', icon:'✏️', title:'Available writing styles & when to use them', meta:'Templates · 3 min read'},
        {id:'custom-instructions', icon:'📋', title:'Using custom instructions to control output', meta:'Templates · 4 min read'},
        {id:'target-audience', icon:'🎯', title:'Configuring target audience & persona', meta:'Templates · 3 min read'},
        {id:'word-count', icon:'📏', title:'Setting target word counts per article type', meta:'Templates · 2 min read'},
        {id:'seo-defaults', icon:'🌍', title:'SEO defaults: geo targeting & keyword settings', meta:'SEO · 3 min read'},
      ]},
      'integrations': { icon:'🔌', label:'Integrations', color:'rgba(239,68,68,.1)', articles:[
        {id:'wordpress-integration', icon:'🟦', title:'Connecting WordPress', meta:'CMS · 5 min read'},
        {id:'ghost-integration', icon:'👻', title:'Connecting Ghost', meta:'CMS · 5 min read'},
        {id:'notion-integration', icon:'◻️', title:'Connecting Notion', meta:'CMS · 5 min read'},
        {id:'shopify-integration', icon:'🛍️', title:'Connecting Shopify', meta:'CMS · 5 min read'},
        {id:'webflow-integration', icon:'🌊', title:'Connecting Webflow', meta:'CMS · 5 min read'},
        {id:'custom-cms', icon:'🔧', title:'Setting up a Custom / Generic CMS connection', meta:'CMS · 5 min read'},
        {id:'social-publishing', icon:'📱', title:'Connecting social platforms for publishing', meta:'Social · 4 min read'},
        {id:'webhooks', icon:'⚡', title:'Configuring outbound Webhooks', meta:'Webhooks · 5 min read'},
        {id:'v1-api', icon:'🔑', title:'Using the Public v1 REST API', meta:'API · 6 min read'},
        {id:'test-connection', icon:'🧪', title:'Testing & troubleshooting CMS connections', meta:'Troubleshooting · 3 min read'},
        {id:'manage-cms-connections', icon:'🗂️', title:'Managing multiple CMS connections', meta:'CMS · 3 min read'},
      ]},
      'seo': { icon:'📊', label:'SEO & Analytics', color:'rgba(34,197,94,.1)', articles:[
        {id:'seo-score', icon:'🎯', title:'Understanding your SEO Score', meta:'SEO · 4 min read'},
        {id:'seo-recommendations', icon:'💡', title:'Acting on SEO recommendations', meta:'SEO · 3 min read'},
        {id:'keyword-research-guide', icon:'🔍', title:'Running keyword research with DataForSEO', meta:'SEO · 5 min read'},
        {id:'analytics-dashboard', icon:'📈', title:'Analytics dashboard explained', meta:'Analytics · 4 min read'},
        {id:'weekly-reports', icon:'📋', title:'Weekly performance reports', meta:'Analytics · 3 min read'},
      ]},
      'features': { icon:'⚡', label:'Features', color:'rgba(168,85,247,.1)', articles:[
        {id:'article-fsm', icon:'🔄', title:'Article lifecycle & FSM status explained', meta:'Articles · 5 min read'},
        {id:'realtime-updates', icon:'📡', title:'Real-time generation progress', meta:'Articles · 3 min read'},
        {id:'llm-visibility', icon:'🤖', title:'LLM Visibility Tracker — monitor your brand in AI responses', meta:'Features · 5 min read'},
        {id:'backlink-exchange', icon:'🔗', title:'Backlink Exchange marketplace', meta:'Features · 4 min read'},
        {id:'bulk-actions', icon:'☑️', title:'Bulk Actions — archive, delete, re-run at scale', meta:'Features · 3 min read'},
        {id:'activity-feed', icon:'📰', title:'Activity Feed & Audit Logs', meta:'Features · 3 min read'},
        {id:'usage-quotas', icon:'📊', title:'Usage quotas & article limits', meta:'Billing · 3 min read'},
        {id:'social-analytics', icon:'📱', title:'Social publish analytics', meta:'Social · 3 min read'},
        {id:'internal-linking', icon:'🔗', title:'Automatic internal linking', meta:'SEO · 3 min read'},
      ]},
      'issues': { icon:'🛠️', label:'Common Issues', color:'rgba(245,158,11,.1)', articles:[
        {id:'stuck-article', icon:'⏳', title:'Article is stuck in "generating" — what to do', meta:'Troubleshooting · 4 min read'},
        {id:'failed-article', icon:'❌', title:'Article failed — understanding error messages', meta:'Troubleshooting · 4 min read'},
        {id:'publish-failed', icon:'🚫', title:'CMS publishing failed — diagnosis & fix', meta:'Publishing · 4 min read'},
        {id:'payment-issues', icon:'💳', title:'Payment failures, grace periods & suspension', meta:'Billing · 4 min read'},
        {id:'quota-reached', icon:'📊', title:'Article quota reached — options & upgrades', meta:'Billing · 3 min read'},
        {id:'cms-connection-fail', icon:'🔌', title:'CMS connection test failing', meta:'Integrations · 4 min read'},
        {id:'onboarding-blocked', icon:'🚧', title:"Can't access dashboard — onboarding gate", meta:'Onboarding · 2 min read'},
        {id:'workflow-blocked', icon:'⛔', title:"Intent workflow step won't advance", meta:'Workflows · 3 min read'},
      ]},
    };

    // ============================================================
    // ARTICLE CONTENT
    // ============================================================
    const ARTICLES: Record<string, any> = {
      'onboarding-wizard': { cat:'getting-started', title:'Completing the 7-step Onboarding Wizard', tag:'Onboarding', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>When you create a new organization on Infin8Content, you must complete the Onboarding Wizard before you can access the dashboard. The wizard collects the information needed to personalize your AI content and set up your integrations.</p>
        <div class="callout callout-success"><span class="callout-emoji">✅</span><div class="callout-body"><div class="callout-label">Good to know</div><p>You can skip optional steps and return to Settings later to fill in missing details.</p></div></div>
        <h2>The 7 steps</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Business Profile</strong><p>Enter your company name, industry, website URL, and content goals. This informs the ICP and tone of all generated content.</p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Competitors</strong><p>Add up to 10 competitor URLs. Infin8Content uses these for keyword gap analysis in the Intent Workflow Engine.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Blog Configuration</strong><p>Enter your blog URL and select your CMS platform. Used to suggest publishing categories.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Keyword Settings</strong><p>Set your primary geographic market, preferred keyword difficulty range, and minimum monthly search volume threshold.</p></div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body"><strong>Content Defaults</strong><p>Choose default writing tone (professional, casual, authoritative), target word count, and content type.</p></div></div>
          <div class="step-item"><div class="step-num">6</div><div class="step-body"><strong>CMS Integration</strong><p>Connect your first CMS. Required to enable one-click publishing. Additional CMSs can be added later under Settings → Integrations.</p></div></div>
          <div class="step-item"><div class="step-num">7</div><div class="step-body"><strong>Completion</strong><p>Your organization is marked as onboarded and you are taken to the dashboard.</p></div></div>
        </div>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Important</div><p>The dashboard is locked behind the onboarding gate. If you are redirected to onboarding repeatedly, check that Steps 1, 5, and 6 have been saved — these are required.</p></div></div>
        <h2>Editing settings after onboarding</h2>
        <p>All onboarding settings are editable under <strong>Settings → Organization</strong>, <strong>Settings → Keyword Settings</strong>, and <strong>Settings → Integrations</strong>.</p>
      `},

      'first-article': { cat:'getting-started', title:'Generating your first article', tag:'Articles', time:'4 min read', html:`
        <h2>Overview</h2>
        <p>Once onboarding is complete, generating an article takes under 60 seconds to kick off. The actual generation typically completes within 3–8 minutes depending on word count.</p>
        <h2>Step-by-step</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Dashboard → Articles</strong><p>Click <strong>Generate Article</strong> or the <strong>+ New Article</strong> button in the top right.</p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Enter a keyword</strong><p>Type the primary SEO keyword you want to target. e.g. <code>best crm software for startups</code></p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Configure options</strong><p>Optionally override writing style, target audience, word count, and custom instructions.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Click Generate</strong><p>The article is created in <span class="badge badge-blue">queued</span> status and the generation pipeline starts immediately.</p></div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body"><strong>Watch the progress</strong><p>Status moves through: researching → outlining → generating → reviewing → <span class="badge badge-green">completed</span></p></div></div>
          <div class="step-item"><div class="step-num">6</div><div class="step-body"><strong>Review & publish</strong><p>Click the completed article to read, edit, and publish to your CMS or social platforms.</p></div></div>
        </div>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">Tip</div><p>You do not need to stay on the page while the article generates. You can close the tab and come back — your article will be waiting for you.</p></div></div>
        <h2>Article statuses</h2>
        <table>
          <tr><th>Status</th><th>Meaning</th></tr>
          <tr><td><span class="badge badge-blue">queued</span></td><td>In the generation queue</td></tr>
          <tr><td><span class="badge badge-amber">researching</span></td><td>AI is running web research via Tavily</td></tr>
          <tr><td><span class="badge badge-amber">outlining</span></td><td>AI is building the article structure</td></tr>
          <tr><td><span class="badge badge-amber">generating</span></td><td>AI is writing each section</td></tr>
          <tr><td><span class="badge badge-blue">reviewing</span></td><td>Awaiting your review</td></tr>
          <tr><td><span class="badge badge-green">completed</span></td><td>Ready to publish</td></tr>
          <tr><td><span class="badge badge-purple">published</span></td><td>Live on your CMS</td></tr>
          <tr><td><span class="badge badge-red">failed</span></td><td>Generation error — see error details</td></tr>
        </table>
      `},

      'workflow-intro': { cat:'workflows', title:'What is the Intent Workflow Engine?', tag:'Overview', time:'4 min read', html:`
        <h2>Overview</h2>
        <p>The Intent Workflow Engine is Infin8Content's strategic content planning system. Rather than generating articles one keyword at a time, it builds a comprehensive, ICP-driven content strategy — then queues dozens of articles for automatic generation.</p>
        <h2>The problem it solves</h2>
        <p>Most content teams struggle with <em>what</em> to write, not how to write it. The Intent Workflow Engine answers that question systematically by starting from your Ideal Customer Profile and competitors, then working backwards to discover the exact keywords your target customers are searching for.</p>
        <h2>The 9-step pipeline</h2>
        <table>
          <tr><th>Step</th><th>Name</th><th>What happens</th></tr>
          <tr><td>1</td><td>ICP Definition</td><td>AI defines your target customer profile from your business details</td></tr>
          <tr><td>2</td><td>Competitor Analysis</td><td>AI extracts keyword gaps from competitor sites</td></tr>
          <tr><td>3</td><td>Seed Keywords</td><td>Seed keyword list generated from ICP + competitor data</td></tr>
          <tr><td>4</td><td>Longtail Expansion</td><td>Seeds expanded to hundreds of longtail variants</td></tr>
          <tr><td>—</td><td><strong>Human Gate 1</strong></td><td>You review and approve the longtail keyword list</td></tr>
          <tr><td>5</td><td>Keyword Filtering</td><td>Keywords filtered by volume, difficulty, and intent</td></tr>
          <tr><td>6</td><td>Topic Clustering</td><td>Keywords grouped into thematic topic clusters</td></tr>
          <tr><td>7</td><td>Cluster Validation</td><td>AI validates clusters for quality and coverage</td></tr>
          <tr><td>8</td><td>Subtopic Mapping</td><td>Subtopics mapped to article-ready outlines</td></tr>
          <tr><td>—</td><td><strong>Human Gate 2</strong></td><td>You review and approve the final article queue</td></tr>
          <tr><td>9</td><td>Queue Articles</td><td>Approved articles queued for automatic generation</td></tr>
        </table>
        <div class="callout callout-success"><span class="callout-emoji">✅</span><div class="callout-body"><div class="callout-label">Result</div><p>At the end of a workflow, you will have a queue of 20–100+ articles strategically aligned to your ICP, optimized for search intent, and ready to generate with one click.</p></div></div>
      `},

      'human-approval': { cat:'workflows', title:'Understanding the two Human Approval Gates', tag:'Workflows', time:'4 min read', html:`
        <h2>Overview</h2>
        <p>The Intent Workflow Engine has two points where a human must review and approve before the pipeline can continue. These gates ensure you stay in control of your content strategy.</p>
        <h2>Gate 1 — Longtail Keyword Approval (after Step 4)</h2>
        <p>After the AI expands your seed keywords into longtail variants, you see a full list of discovered keywords with their estimated volume and difficulty scores.</p>
        <ul>
          <li>Review each keyword and remove irrelevant ones</li>
          <li>Add keywords manually that the AI missed</li>
          <li>Approve individual keywords or bulk-approve all</li>
        </ul>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">Tip</div><p>Be selective at Gate 1. Every keyword you approve will ultimately become a topic cluster and potentially an article. Quality over quantity.</p></div></div>
        <h2>Gate 2 — Article Queue Approval (after Step 8)</h2>
        <p>After subtopics are mapped and articles are ready to queue, you see the full list of planned articles with their target keywords and estimated content angles.</p>
        <ul>
          <li>Remove articles you do not want to generate</li>
          <li>Approve articles in bulk or one by one</li>
          <li>View the cluster each article belongs to</li>
        </ul>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Important</div><p>Once you approve Gate 2 and click "Queue Articles", the articles are immediately created in <code>backlog</code> status and will begin generating. This action cannot be undone, but you can archive articles afterwards.</p></div></div>
        <h2>What happens if I do not approve?</h2>
        <p>The workflow pauses at the gate indefinitely. No articles are queued. You can return to the workflow at any time to complete the approval.</p>
      `},

      'wordpress-integration': { cat:'integrations', title:'Connecting WordPress', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content connects to WordPress using the WordPress REST API with Application Passwords. This works with WordPress 5.6+ and requires HTTPS.</p>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">HTTPS required</div><p>WordPress Application Passwords only work over HTTPS. If your site is still on HTTP, you need to add SSL before connecting.</p></div></div>
        <h2>Step 1: Create an Application Password in WordPress</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Log in to WordPress Admin</strong><p>Go to <code>yoursite.com/wp-admin</code></p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Go to Users → Your Profile</strong><p>Scroll down to the <strong>Application Passwords</strong> section.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Create a new password</strong><p>Enter a name like "Infin8Content" and click <strong>Add New Application Password</strong>. Copy the generated password — you will not see it again.</p></div></div>
        </div>
        <h2>Step 2: Add the connection in Infin8Content</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Settings → Integrations → Add CMS Connection → WordPress</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Fill in the form</strong><p>Enter your WordPress site URL (e.g. <code>https://yoursite.com</code>), your WordPress username, and the Application Password.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Click "Test Connection"</strong><p>A green success message confirms the connection works.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Save</strong><p>Your WordPress site is now available as a publish target.</p></div></div>
        </div>
        <h2>What gets published</h2>
        <ul>
          <li>Title — from the AI-generated title</li>
          <li>Content — full HTML article body</li>
          <li>Slug — from the generated SEO slug</li>
          <li>Status — <code>draft</code> by default (configurable)</li>
          <li>Meta description — via Yoast SEO or Rank Math if installed</li>
        </ul>
        <div class="callout callout-danger"><span class="callout-emoji">🔐</span><div class="callout-body"><div class="callout-label">Security note</div><p>Your Application Password is stored encrypted using AES-256. It is never exposed to the browser and is only decrypted on the server at publish time.</p></div></div>
      `},

      'ghost-integration': { cat:'integrations', title:'Connecting Ghost', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content connects to Ghost using the Ghost Admin API. This works with both Ghost Pro (hosted) and self-hosted Ghost 5.x+.</p>
        <h2>Step 1: Generate a Ghost Admin API key</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Log in to Ghost Admin</strong><p>Go to <code>yoursite.com/ghost</code></p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Go to Settings → Integrations</strong><p>Click <strong>Add custom integration</strong> and name it "Infin8Content".</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Copy the Admin API Key</strong><p>You will see both a Content API Key and an Admin API Key. Copy the <strong>Admin API Key</strong>.</p></div></div>
        </div>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Admin vs Content API Key</div><p>Make sure you copy the Admin API Key (not the Content API Key). The Admin key is required for creating and publishing posts.</p></div></div>
        <h2>Step 2: Add the connection in Infin8Content</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Settings → Integrations → Add CMS Connection → Ghost</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Enter your Ghost URL</strong><p>e.g. <code>https://yoursite.com</code> or <code>https://yoursite.ghost.io</code> for Ghost Pro.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Paste your Admin API Key, then Test &amp; Save</strong></div></div>
        </div>
        <h2>What gets published</h2>
        <ul>
          <li>Title — AI-generated title</li>
          <li>HTML — full article content (Ghost accepts rich HTML natively)</li>
          <li>Slug — SEO-optimized slug</li>
          <li>Custom excerpt — from the AI-generated meta description</li>
          <li>Status — <code>draft</code> by default; configurable to <code>published</code></li>
        </ul>
      `},

      'notion-integration': { cat:'integrations', title:'Connecting Notion', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content publishes articles to a Notion database using the Notion API. Each article becomes a page inside a database you designate.</p>
        <h2>Step 1: Create a Notion Integration</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to notion.so/my-integrations</strong><p>Click <strong>New integration</strong>.</p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Configure the integration</strong><p>Name it "Infin8Content". Set capabilities to: Read content, Update content, Insert content.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Copy the Internal Integration Token</strong><p>Starts with <code>secret_</code></p></div></div>
        </div>
        <h2>Step 2: Share your database with the integration</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Open the target database in Notion</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Click ··· menu → Connections → find "Infin8Content" → Confirm</strong></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Copy the Database ID</strong><p>Open the database as a full page. The URL contains the ID: <code>notion.so/yourworkspace/<strong>abc123...</strong>?v=xyz</strong></code></p></div></div>
        </div>
        <h2>Required database schema</h2>
        <table>
          <tr><th>Property</th><th>Type</th><th>Mapped from</th></tr>
          <tr><td>Name</td><td>Title</td><td>Article title</td></tr>
          <tr><td>Status</td><td>Select</td><td>Set to "Draft" on publish</td></tr>
          <tr><td>Keyword</td><td>Rich text</td><td>Target SEO keyword</td></tr>
          <tr><td>Published At</td><td>Date</td><td>Timestamp of publish</td></tr>
          <tr><td>Slug</td><td>Rich text</td><td>URL slug</td></tr>
        </table>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">Tip</div><p>Article body content is published as Notion blocks inside the page, not as a single text property — so it renders natively in Notion with full formatting.</p></div></div>
      `},

      'shopify-integration': { cat:'integrations', title:'Connecting Shopify', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content publishes articles to the Shopify Blog section of your store using the Shopify Admin API. Ideal for e-commerce stores using their blog for SEO content.</p>
        <h2>Step 1: Create a Shopify Custom App</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Shopify Admin → Settings → Apps and sales channels</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Click "Develop apps" → Create an app</strong><p>Name it "Infin8Content".</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Configure Admin API scopes</strong><p>Enable <code>write_content</code> and <code>read_content</code>.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Install the app and copy the Admin API access token</strong></div></div>
        </div>
        <div class="callout callout-danger"><span class="callout-emoji">🔐</span><div class="callout-body"><div class="callout-label">One-time token</div><p>Shopify only shows the Admin API access token once. If you miss it, you will need to uninstall and reinstall the app to regenerate it.</p></div></div>
        <h2>Step 2: Add the connection in Infin8Content</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Settings → Integrations → Add CMS Connection → Shopify</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Enter your store URL</strong><p>Format: <code>yourstore.myshopify.com</code> — use the .myshopify.com domain, not a custom domain.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Paste your Admin API access token, select target blog, then Test &amp; Save</strong></div></div>
        </div>
      `},

      'webflow-integration': { cat:'integrations', title:'Connecting Webflow', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content publishes to Webflow CMS Collections using the Webflow Data API v2. Your site must have a CMS Collection set up for blog posts and be on the CMS or Business plan.</p>
        <h2>Step 1: Generate a Webflow API token</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Open Webflow → Workspace Settings → Integrations → API access</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Click "Generate API token"</strong><p>Name it "Infin8Content" and scope it to your target site.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Copy the token</strong></div></div>
        </div>
        <h2>Step 2: Find your Collection ID</h2>
        <p>Open the Webflow Designer → CMS → Collections → select your blog posts collection. The Collection ID appears in the URL or settings panel.</p>
        <h2>Required collection fields</h2>
        <table>
          <tr><th>Field</th><th>Webflow type</th><th>Mapped from</th></tr>
          <tr><td>Name / Title</td><td>Plain Text</td><td>AI-generated title</td></tr>
          <tr><td>Post Body</td><td>Rich Text</td><td>Article HTML content</td></tr>
          <tr><td>Slug</td><td>Plain Text</td><td>SEO slug</td></tr>
          <tr><td>Meta Description</td><td>Plain Text</td><td>AI-generated meta description</td></tr>
        </table>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Publishing in Webflow</div><p>Creating a CMS item via API does not automatically publish it to your live site. You still need to Publish in Webflow Designer, or enable auto-publish in your integration settings.</p></div></div>
      `},

      'custom-cms': { cat:'integrations', title:'Setting up a Custom / Generic CMS connection', tag:'CMS Integration', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>The Custom adapter lets you publish to any system that accepts an HTTP POST request with article data — headless CMSs, custom-built systems, or middleware.</p>
        <h2>How it works</h2>
        <p>When publishing to a Custom CMS connection, Infin8Content sends a POST request to a URL you specify with the article data as a JSON payload. Your server receives it and handles creating the post in your CMS.</p>
        <h2>Payload format</h2>
        <pre><code>{
  "article_id": "uuid-here",
  "title": "Article Title Here",
  "content_html": "&lt;h2&gt;Introduction&lt;/h2&gt;&lt;p&gt;...&lt;/p&gt;",
  "keyword": "target seo keyword",
  "slug": "article-title-here",
  "meta_description": "SEO meta description text",
  "word_count": 1847,
  "writing_style": "professional",
  "target_audience": "SaaS founders",
  "created_at": "2026-04-22T10:00:00Z",
  "org_id": "org-uuid"
}</code></pre>
        <h2>Expected response</h2>
        <pre><code>{
  "success": true,
  "url": "https://yoursite.com/blog/article-title-here",
  "post_id": "your-internal-id"
}</code></pre>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">Use cases</div><p>Commonly used for Contentful, Sanity, Prismic, custom-built CMS systems, and middleware that transforms content before storing it.</p></div></div>
      `},

      'v1-api': { cat:'integrations', title:'Using the Public v1 REST API', tag:'API', time:'6 min read', html:`
        <h2>Authentication</h2>
        <p>All v1 API requests require an API key in the Authorization header:</p>
        <pre><code>Authorization: Bearer inf8_your_api_key_here</code></pre>
        <p>Generate API keys under <strong>Settings → API Keys</strong>. Keys can be revoked at any time.</p>
        <h2>Base URL</h2>
        <pre><code>https://app.infin8content.com/api/v1</code></pre>
        <h2>Key Endpoints</h2>
        <table>
          <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
          <tr><td>GET</td><td><code>/articles</code></td><td>List all articles</td></tr>
          <tr><td>POST</td><td><code>/articles/generate</code></td><td>Trigger AI generation</td></tr>
          <tr><td>GET</td><td><code>/articles/:id</code></td><td>Get a single article</td></tr>
          <tr><td>POST</td><td><code>/articles/:id/publish</code></td><td>Publish to CMS</td></tr>
          <tr><td>POST</td><td><code>/articles/:id/publish-social</code></td><td>Publish to social</td></tr>
          <tr><td>GET</td><td><code>/analytics/articles/:id</code></td><td>Article analytics</td></tr>
          <tr><td>POST</td><td><code>/keywords/research</code></td><td>Keyword research</td></tr>
          <tr><td>GET</td><td><code>/social/accounts</code></td><td>List social accounts</td></tr>
        </table>
        <h2>Triggering article generation</h2>
        <pre><code>POST /api/v1/articles/generate
Authorization: Bearer &lt;key&gt;
Content-Type: application/json

{
  "keyword": "best project management software",
  "writing_style": "professional",
  "target_word_count": 2000,
  "custom_instructions": "Include a comparison table."
}</code></pre>
        <h2>Standard response format</h2>
        <pre><code>// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "message", "code": "ERROR_CODE" }</code></pre>
        <div class="callout callout-info"><span class="callout-emoji">ℹ️</span><div class="callout-body"><div class="callout-label">Rate limiting</div><p>API requests are rate limited per API key. A 429 response means you need to wait before retrying. Rate limit headers are included in every response.</p></div></div>
      `},

      'article-fsm': { cat:'features', title:'Article lifecycle & FSM status explained', tag:'Articles', time:'5 min read', html:`
        <h2>The Zero Drift Protocol</h2>
        <p>Every article in Infin8Content follows a strict, deterministic lifecycle governed by a Finite State Machine (FSM). Article status can <em>only</em> be changed by the generation pipeline — no user action, UI click, or API call can change it directly. This prevents data inconsistency and ensures every article has a complete, auditable history.</p>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">What this means for you</div><p>You cannot manually force an article to "completed" or skip a stage. If an article is stuck, an automatic cleanup job resets stuck articles every hour.</p></div></div>
        <h2>Full state diagram</h2>
        <table>
          <tr><th>Status</th><th>Meaning</th><th>Set by</th></tr>
          <tr><td><span class="badge badge-blue">backlog</span></td><td>Created but not yet queued</td><td>Trigger API / Intent pipeline</td></tr>
          <tr><td><span class="badge badge-blue">queued</span></td><td>In queue, waiting for worker</td><td>Trigger API</td></tr>
          <tr><td><span class="badge badge-amber">researching</span></td><td>Running web research (Tavily)</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-amber">outlining</span></td><td>Building section-by-section outline</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-amber">generating</span></td><td>Writing article sections</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-blue">reviewing</span></td><td>Generation complete, awaiting review</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-green">completed</span></td><td>Ready to publish</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-purple">published</span></td><td>Live on CMS</td><td>Publish trigger</td></tr>
          <tr><td><span class="badge badge-red">failed</span></td><td>Unrecoverable error after retries</td><td>Inngest worker</td></tr>
          <tr><td><span class="badge badge-gray">archived</span></td><td>Manually archived</td><td>Bulk operations</td></tr>
        </table>
        <h2>Valid transitions</h2>
        <pre><code>backlog → queued → researching → outlining → generating → reviewing → completed → published

Any state → failed    (on unrecoverable error)
Any state → archived  (manual action only)</code></pre>
        <p>Reverse transitions are forbidden by the system. Every state change is logged to the <code>workflow_transition_audit</code> table with a timestamp, previous state, new state, and actor.</p>
      `},

      'stuck-article': { cat:'issues', title:'Article is stuck in "generating" — what to do', tag:'Troubleshooting', time:'4 min read', html:`
        <h2>How long should generation take?</h2>
        <table>
          <tr><th>Word count</th><th>Expected time</th></tr>
          <tr><td>Up to 1,000 words</td><td>2–4 minutes</td></tr>
          <tr><td>1,000–2,500 words</td><td>4–8 minutes</td></tr>
          <tr><td>2,500–5,000 words</td><td>8–15 minutes</td></tr>
        </table>
        <p>If your article has been generating for more than <strong>30 minutes</strong>, it may be stuck.</p>
        <div class="callout callout-success"><span class="callout-emoji">✅</span><div class="callout-body"><div class="callout-label">You usually do not need to do anything</div><p>An automated cleanup job runs every hour and detects articles stuck in generating or researching. These are automatically reset to queued and re-queued.</p></div></div>
        <h2>If the article keeps failing after retry</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Check the error details</strong><p>If the article transitions to <span class="badge badge-red">failed</span>, click on it and scroll to <strong>Error Details</strong> to see the exact failure reason.</p></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Check for LLM provider issues</strong><p>Infin8Content uses OpenRouter which routes to multiple LLM providers. Check <code>status.openrouter.ai</code> if all articles are failing.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Try re-generating</strong><p>From the article detail page, click <strong>Re-generate</strong> to create a fresh generation attempt.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Contact support</strong><p>Use the Feedback widget in the dashboard to report the article ID.</p></div></div>
        </div>
      `},

      'publish-failed': { cat:'issues', title:'CMS publishing failed — diagnosis & fix', tag:'Publishing', time:'4 min read', html:`
        <h2>Step 1: Check the error message</h2>
        <p>Go to the article detail page → <strong>Publish History</strong>. Failed publish attempts show an error message.</p>
        <h2>Common errors</h2>
        <table>
          <tr><th>Error</th><th>Cause</th><th>Fix</th></tr>
          <tr><td><code>401 Unauthorized</code></td><td>Credentials expired or revoked</td><td>Go to Settings → Integrations, edit the connection, update credentials, click Test Connection.</td></tr>
          <tr><td><code>403 Forbidden</code></td><td>User lacks publish permission</td><td>Ensure the CMS user has Editor or Admin role.</td></tr>
          <tr><td><code>404 Not Found</code></td><td>API endpoint URL wrong</td><td>Check the site URL in your CMS connection settings.</td></tr>
          <tr><td><code>Connection timeout</code></td><td>CMS server unreachable</td><td>Check if your CMS is online. Try the Test Connection button.</td></tr>
          <tr><td><code>SSL certificate error</code></td><td>Expired or self-signed cert</td><td>Renew your SSL certificate. Self-signed certs are not supported.</td></tr>
        </table>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">WordPress tip</div><p>If you are getting 401 errors on WordPress, check that the Application Password has not been deleted: Users → Your Profile → Application Passwords.</p></div></div>
      `},

      'payment-issues': { cat:'issues', title:'Payment failures, grace periods & suspension', tag:'Billing', time:'4 min read', html:`
        <h2>Timeline after a failed payment</h2>
        <table>
          <tr><th>Time</th><th>What happens</th></tr>
          <tr><td>Day 0</td><td>Payment fails. A <strong>payment warning banner</strong> appears in your dashboard. All features remain accessible.</td></tr>
          <tr><td>Day 1–7</td><td><strong>Grace period.</strong> Stripe automatically retries the payment. Email notifications are sent. All features remain accessible.</td></tr>
          <tr><td>Day 7+</td><td>Account is <strong>suspended</strong>. Article generation is paused. You are redirected to the upgrade/payment page.</td></tr>
        </table>
        <h2>How to resolve a failed payment</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Settings → Billing</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Click "Manage Billing"</strong><p>This opens the Stripe billing portal where you can update your payment method.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Update your card</strong><p>Add a new payment method. Stripe will automatically retry the outstanding invoice.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Wait for confirmation</strong><p>Once payment succeeds, your account status updates automatically and the suspension is lifted.</p></div></div>
        </div>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Suspended accounts</div><p>While suspended, your data is safe and preserved. No articles are deleted. Generation simply pauses until the payment issue is resolved.</p></div></div>
      `},

      'campaigns-intro': { cat:'campaigns', title:'What are Campaigns & Autoblogs?', tag:'Overview', time:'4 min read', html:`
        <h2>Campaigns</h2>
        <p>A <strong>Campaign</strong> is a scheduled, bulk content production run. You define a set of keywords or a content theme, a publishing cadence, and a target CMS — and Infin8Content automatically generates and publishes articles on that schedule.</p>
        <ul>
          <li>Publishing 3 articles per week from a pre-approved keyword list</li>
          <li>Running a 30-day content push for a product launch</li>
          <li>Maintaining a consistent publishing schedule without hiring writers</li>
        </ul>
        <h2>Autoblogs</h2>
        <p>An <strong>Autoblog</strong> is a continuous, always-on pipeline driven by a <strong>Feed</strong>. When new topics appear in your feed, Infin8Content automatically generates and publishes articles about them.</p>
        <ul>
          <li>News commentary blogs that publish on trending topics automatically</li>
          <li>Niche affiliate sites that auto-generate content on new product releases</li>
          <li>Industry news summary blogs</li>
        </ul>
        <h2>Campaigns vs Autoblogs</h2>
        <table>
          <tr><th></th><th>Campaign</th><th>Autoblog</th></tr>
          <tr><td>Keyword source</td><td>Manual list or Intent Workflow output</td><td>Live Feed (RSS, news, trends)</td></tr>
          <tr><td>Duration</td><td>Defined start/end</td><td>Ongoing until paused</td></tr>
          <tr><td>Publishing</td><td>Scheduled cadence</td><td>Triggered by new feed items</td></tr>
          <tr><td>Human review</td><td>Optional</td><td>Typically fully automated</td></tr>
        </table>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Quota consumption</div><p>Both Campaigns and Autoblogs consume your monthly article quota. Check your plan capacity before setting up high-cadence pipelines.</p></div></div>
      `},

      'feeds-intro': { cat:'feeds', title:'What are Feeds & how do they work?', tag:'Overview', time:'3 min read', html:`
        <h2>Overview</h2>
        <p>Feeds are content discovery sources that Infin8Content monitors to find new topics for article generation. Instead of manually supplying keywords, a Feed automatically surfaces new topics based on real-world signals.</p>
        <h2>Supported feed types</h2>
        <table>
          <tr><th>Type</th><th>Source</th><th>Use case</th></tr>
          <tr><td><strong>RSS Feed</strong></td><td>Any RSS/Atom URL</td><td>Monitor competitor blogs, industry publications, news sites</td></tr>
          <tr><td><strong>News Poller</strong></td><td>Built-in news API (Tavily)</td><td>Trending topics in your industry, breaking news</td></tr>
          <tr><td><strong>Keyword Trend Feed</strong></td><td>DataForSEO trending keywords</td><td>Emerging search terms in your niche</td></tr>
        </table>
        <h2>How feeds are processed</h2>
        <p>Infin8Content checks each active Feed <strong>every hour</strong>. New items that pass your relevance filters are added to the feed's item queue. If the feed is connected to an Autoblog, these items trigger article generation.</p>
        <div class="callout callout-info"><span class="callout-emoji">ℹ️</span><div class="callout-body"><div class="callout-label">Note</div><p>Feeds themselves do not generate content — they are sources. Content generation only happens when a Feed is connected to an Autoblog.</p></div></div>
      `},

      'webhooks': { cat:'integrations', title:'Configuring outbound Webhooks', tag:'Webhooks', time:'5 min read', html:`
        <h2>Overview</h2>
        <p>Infin8Content can notify your own systems whenever key events happen — article completed, article published, workflow approved, payment failed, and more.</p>
        <h2>Setting up a webhook</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Go to Settings → Webhooks → Add Webhook Endpoint</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Enter your endpoint URL</strong><p>Must be an HTTPS URL on your server.</p></div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Select events to subscribe to</strong><p>Available events: <code>article.completed</code>, <code>article.published</code>, <code>article.failed</code>, <code>workflow.approved</code>, <code>payment.failed</code>, and more.</p></div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body"><strong>Test &amp; Save</strong><p>Click "Send Test" to verify your endpoint receives the payload correctly.</p></div></div>
        </div>
        <h2>Payload format</h2>
        <pre><code>{
  "event": "article.completed",
  "organization_id": "org-uuid",
  "timestamp": "2026-04-22T10:30:00Z",
  "data": {
    "article_id": "article-uuid",
    "title": "Best CRM Software for Startups",
    "keyword": "best crm software startups",
    "status": "completed",
    "word_count": 2147
  }
}</code></pre>
        <div class="callout callout-warn"><span class="callout-emoji">⚠️</span><div class="callout-body"><div class="callout-label">Timeout</div><p>Your endpoint must respond within 10 seconds. If it times out, the delivery is treated as failed and retried with exponential backoff.</p></div></div>
      `},

      'workflow-blocked': { cat:'issues', title:"Intent workflow step won't advance", tag:'Workflows', time:'3 min read', html:`
        <h2>Steps must be completed in order</h2>
        <p>The Intent Workflow Engine enforces <strong>sequential progression</strong>. You cannot skip a step or access a later step before the current one is complete.</p>
        <h2>Common blocking conditions</h2>
        <table>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
          <tr><td>Step button is greyed out</td><td>Previous step not marked complete</td><td>Go back and ensure the previous step was saved and the AI task completed.</td></tr>
          <tr><td>"Approval required" message</td><td>You are at a Human Gate</td><td>Review the keyword or article list and click Approve to continue.</td></tr>
          <tr><td>Step keeps loading indefinitely</td><td>Background AI task still running</td><td>Wait 2–5 minutes and refresh. The step runs AI analysis in the background.</td></tr>
          <tr><td>"Blocking conditions not met"</td><td>Missing required data from earlier step</td><td>Check the blocking conditions panel — it lists exactly what is missing.</td></tr>
        </table>
        <div class="callout callout-tip"><span class="callout-emoji">💡</span><div class="callout-body"><div class="callout-label">Step 4 Human Gate</div><p>The most common stuck point is at the Human Approval Gate after Step 4. You must explicitly review and approve keywords — the step will never auto-advance past a human gate.</p></div></div>
      `},
    };

    // ============================================================
    // STATE & NAV HELPERS
    // ============================================================
    let currentCategory: string | null = null;
    let currentView: 'home' | 'category' | 'article' | 'search' = 'home';

    function hideAllViews(){
      const hv = document.getElementById('home-view'); if (hv) hv.style.display = 'none';
      document.getElementById('category-view')?.classList.remove('active');
      document.getElementById('article-view')?.classList.remove('active');
      document.getElementById('search-view')?.classList.remove('active');
    }

    function updateSidebarActive(catId: string | null){
      document.querySelectorAll<HTMLButtonElement>('.sidebar-link').forEach(l => {
        const isHome = (catId===null && l.textContent?.trim()==='Home');
        const isCat = (catId!==null && l.getAttribute('onclick')?.includes(`'${catId}'`));
        l.classList.toggle('active', Boolean(isHome || isCat));
      });
    }

    function showHome(){
      hideAllViews();
      const hv = document.getElementById('home-view'); if (hv) hv.style.display='block';
      currentView='home'; currentCategory=null;
      updateSidebarActive(null);
      window.scrollTo(0,0);
    }

    function buildCategoryHTML(catId: string, cat: any){
      const items = cat.articles.map((a: any) => `
        <div class="article-row" onclick="showArticle('${a.id}','${catId}')">
          <div class="article-row-left">
            <span class="article-row-icon">${a.icon}</span>
            <div>
              <div class="article-row-title">${a.title}</div>
              <div class="article-row-meta">${a.meta}</div>
            </div>
          </div>
          <span class="article-row-arrow">›</span>
        </div>`).join('');
      return `
        <div class="panel-header-row">
          <button class="panel-back" onclick="showHome()">← All topics</button>
          <div class="panel-title-row">
            <div class="panel-icon" style="background:${cat.color}">${cat.icon}</div>
            <div class="panel-title">${cat.label}</div>
          </div>
        </div>
        <div class="article-list">${items}</div>`;
    }

    function navTo(catId: string){
      const cat = (CATEGORIES as any)[catId]; if(!cat) return;
      hideAllViews();
      currentCategory = catId; currentView='category';
      const view = document.getElementById('category-view');
      if (view) {
        view.classList.add('active');
        view.innerHTML = buildCategoryHTML(catId, cat);
      }
      updateSidebarActive(catId);
      window.scrollTo(0,0);
    }

    function showArticle(id: string, fromCat?: string){
      if (fromCat) currentCategory = fromCat;
      const art = (ARTICLES as any)[id];
      hideAllViews();
      currentView = 'article';
      const panel = document.getElementById('article-view');
      panel?.classList.add('active');
      const back = panel?.querySelector('.panel-back') as HTMLElement | null;
      if (back) back.textContent = currentCategory && (CATEGORIES as any)[currentCategory] ? `← ${(CATEGORIES as any)[currentCategory].label}` : '← Back';
      const body = document.getElementById('article-body');
      if (!body) return;
      if (!art) {
        // try stub lookup from current category
        const catId = fromCat || currentCategory;
        const cat = catId ? (CATEGORIES as any)[catId] : null;
        if (cat) {
          const a = cat.articles.find((x: any) => x.id === id);
          if (a) {
            body.innerHTML = `
              <h1>${a.title}</h1>
              <div class="article-meta-bar">
                <span class="art-tag-plain">${a.meta}</span>
              </div>
              <div class="callout callout-info" style="margin-top:24px;">
                <span class="callout-emoji">📝</span>
                <div class="callout-body">
                  <div class="callout-label">Coming soon</div>
                  <p>This article is being written. Check back soon or contact support for immediate help.</p>
                </div>
              </div>`;
            window.scrollTo(0,0);
          }
        }
        return;
      }
      body.innerHTML = `
        <h1>${art.title}</h1>
        <div class="article-meta-bar">
          <span class="art-tag">${art.tag}</span>
          <span class="art-tag-plain">⏱ ${art.time}</span>
        </div>
        ${art.html}`;
      window.scrollTo(0,0);
    }

    function goBackFromArticle(){
      if (currentCategory) navTo(currentCategory); else showHome();
    }

    // ============================================================
    // SEARCH
    // ============================================================
    function runSearch(q: string, label: string){
      hideAllViews();
      currentView='search';
      document.getElementById('search-view')?.classList.add('active');
      const lbl = document.getElementById('search-query-label'); if (lbl) lbl.textContent = `"${label}"`;
      const results: Array<any> = [];
      Object.entries(CATEGORIES).forEach(([catId, cat]: any) => {
        (cat.articles as any[]).forEach(a => {
          if (a.title.toLowerCase().includes(q) || a.meta.toLowerCase().includes(q) || (catId as string).includes(q)) {
            results.push({ ...a, catId, catLabel: cat.label, catIcon: cat.icon });
          }
        });
      });
      const el = document.getElementById('search-results');
      if (!el) return;
      if (results.length === 0) {
        el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);">No articles found for "${label}". <span style="cursor:pointer;color:var(--accent)" onclick="showHome()">Browse all topics →</span></div>`;
      } else {
        el.innerHTML = results.map(r => `
          <div class="article-row" onclick="showArticle('${r.id}','${r.catId}')">
            <div class="article-row-left">
              <span class="article-row-icon">${r.icon}</span>
              <div>
                <div class="article-row-title">${r.title}</div>
                <div class="article-row-meta">${r.catIcon} ${r.catLabel} · ${r.meta}</div>
              </div>
            </div>
            <span class="article-row-arrow">›</span>
          </div>`).join('');
      }
      window.scrollTo(0,0);
    }

    function handleSearch(val: string){
      const q = val.trim().toLowerCase();
      if (q.length < 2){ if (currentView==='search') showHome(); return; }
      runSearch(q, val);
    }

    function triggerSearch(term: string){
      const input = document.getElementById('search-input') as HTMLInputElement | null;
      if (input) input.value = term;
      runSearch(term.toLowerCase(), term);
    }

    // expose globals for inline handlers in injected HTML
    (window as any).showHome = showHome;
    (window as any).navTo = navTo;
    (window as any).showArticle = showArticle;
    (window as any).goBackFromArticle = goBackFromArticle;
    (window as any).handleSearch = handleSearch;
    (window as any).triggerSearch = triggerSearch;

    return () => {
      delete (window as any).showHome;
      delete (window as any).navTo;
      delete (window as any).showArticle;
      delete (window as any).goBackFromArticle;
      delete (window as any).handleSearch;
      delete (window as any).triggerSearch;
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
