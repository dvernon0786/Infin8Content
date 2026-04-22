import { Metadata } from 'next';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

export const metadata: Metadata = {
  title: 'AI Content Writer — Rank-Ready Articles in 30 Seconds | Infin8Content',
  description: 'Write rank-ready, SEO-optimised articles in 30 seconds with Infin8Content AI Content Writer.',
};

const CSS = `
/* ===== ARTICLE PREVIEW MOCKUP ===== */
    .article-preview-wrap { max-width: 880px; margin: 0 auto; position: relative; }
    .article-preview-wrap::after { content: ''; position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); width: 70%; height: 80px; background: radial-gradient(ellipse, rgba(79,110,247,.22) 0%, transparent 70%); filter: blur(20px); pointer-events: none; }
    .browser-frame { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04); }
    .browser-bar { background: var(--surface2); padding: 10px 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border); }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-r { background: #ff5f57; } .dot-y { background: #febc2e; } .dot-g { background: #28c840; }
    .browser-url { flex: 1; background: rgba(255,255,255,.04); border-radius: 6px; height: 24px; margin: 0 12px; display: flex; align-items: center; padding: 0 10px; font-size: 11px; color: var(--muted2); }
    .article-mock { display: grid; grid-template-columns: 220px 1fr; min-height: 480px; }
    .mock-sidebar { background: rgba(255,255,255,.015); border-right: 1px solid var(--border); padding: 20px 16px; display: flex; flex-direction: column; gap: 4px; }
    .mock-sidebar .site-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); margin-bottom: 10px; }
    .mock-sidebar .domain-badge { background: rgba(79,110,247,.12); border: 1px solid rgba(79,110,247,.2); border-radius: 6px; padding: 6px 10px; font-size: 11px; color: #a5b4fc; margin-bottom: 14px; }
    .toc-item { padding: 5px 8px; border-radius: 5px; font-size: 11.5px; color: var(--muted); cursor: default; transition: all .15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toc-item:hover { color: var(--white); background: rgba(255,255,255,.04); }
    .toc-item.active { color: var(--accent); background: rgba(79,110,247,.1); }
    .toc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); padding: 8px 8px 4px; margin-top: 6px; }
    .mock-content { padding: 28px 32px; overflow: hidden; text-align: left; }
    .mock-content .art-tag { display: inline-block; background: rgba(79,110,247,.1); border: 1px solid rgba(79,110,247,.2); border-radius: 4px; font-size: 10px; font-weight: 700; color: #a5b4fc; padding: 2px 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .06em; }
    .mock-content h2 { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--white); margin-bottom: 14px; line-height: 1.3; }
    .mock-content .art-badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .art-badge { background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
    .art-badge .dot-sm { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
    .mock-content p { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 14px; }
    .mock-content p strong { color: var(--text); }
    .mock-content h3 { font-family: var(--font-display); font-size: 14px; font-weight: 600; color: var(--white); margin: 16px 0 8px; }
    .mock-content ul.art-list { padding-left: 0; display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .mock-content ul.art-list li { font-size: 12.5px; color: var(--muted); display: flex; align-items: flex-start; gap: 8px; }
    .mock-content ul.art-list li::before { content: '→'; color: var(--accent); flex-shrink: 0; }
    .mock-content .art-quote { border-left: 2px solid var(--accent); padding: 8px 14px; background: rgba(79,110,247,.06); border-radius: 0 6px 6px 0; font-size: 12.5px; color: var(--text); font-style: italic; margin: 14px 0; line-height: 1.6; }
    .mock-content table.art-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 10px; }
    .mock-content table.art-table th { background: rgba(79,110,247,.1); color: #a5b4fc; padding: 6px 10px; text-align: left; border: 1px solid rgba(79,110,247,.15); font-weight: 600; }
    .mock-content table.art-table td { padding: 5px 10px; border: 1px solid var(--border); color: var(--muted); }
    .mock-content table.art-table tr:nth-child(even) td { background: rgba(255,255,255,.02); }
    .mock-content .img-placeholder { width: 100%; height: 90px; background: linear-gradient(135deg, var(--surface2), #0d1228); border-radius: 8px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--muted2); margin: 12px 0; }

    /* article tag highlights */
    .mock-content .kw-highlight { background: rgba(79,110,247,.15); border-radius: 3px; padding: 0 3px; color: #a5b4fc; }
    .mock-content .link-highlight { color: var(--accent); border-bottom: 1px solid rgba(79,110,247,.4); cursor: pointer; }

    /* overlay badges on mockup */
    .mockup-badges { display: flex; gap: 8px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
    .m-badge { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 12.5px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
    .m-badge .icon { font-size: 14px; }
    .m-badge strong { color: var(--white); }

    /* ===== FEATURE HIGHLIGHTS (4-grid below article) ===== */
    .highlights-section { background: linear-gradient(180deg, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent); }
    .highlights-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .highlight-item { background: var(--surface); padding: 28px 24px; }
    .highlight-item .h-icon { font-size: 22px; margin-bottom: 12px; }
    .highlight-item h4 { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 8px; }
    .highlight-item p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

    /* ===== TABBED FEATURE SECTION ===== */
    .tabbed-section { padding: 90px 0; }
    .tabbed-section .section-title { text-align: center; margin-bottom: 10px; }
    .tabbed-section .section-sub { text-align: center; margin-bottom: 0; }
    .tabs-wrapper { display: grid; grid-template-columns: 260px 1fr; gap: 32px; margin-top: 40px; align-items: start; }
    .tabs-nav { display: flex; flex-direction: column; gap: 4px; }
    .tab-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; cursor: pointer; transition: all .2s; border: 1px solid transparent; background: transparent; text-align: left; width: 100%; }
    .tab-btn:hover { background: rgba(255,255,255,.03); }
    .tab-btn.active { background: rgba(79,110,247,.1); border-color: rgba(79,110,247,.25); }
    .tab-btn .tb-icon { font-size: 18px; flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: center; }
    .tab-btn.active .tb-icon { background: rgba(79,110,247,.15); }
    .tab-btn .tb-text h5 { font-family: var(--font-display); font-size: 13.5px; font-weight: 600; color: var(--text); margin-bottom: 2px; transition: color .2s; }
    .tab-btn.active .tb-text h5 { color: var(--white); }
    .tab-btn .tb-text p { font-size: 12px; color: var(--muted); line-height: 1.4; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
    .tab-img { border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .tab-img-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 100%; background: linear-gradient(135deg, var(--surface), var(--surface2)); }
    .tab-img-inner .ti-icon { font-size: 40px; opacity: .35; }
    .tab-img-inner .ti-label { font-size: 13px; color: var(--muted2); font-family: var(--font-display); text-align: center; padding: 0 20px; }
    .tab-img .glow { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at 60% 30%, rgba(79,110,247,.08) 0%, transparent 60%); }

    /* Mini icon grid below tabs */
    .mini-icons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 40px; }
    .mini-icon-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 16px; transition: all .2s; }
    .mini-icon-card:hover { border-color: rgba(79,110,247,.3); transform: translateY(-2px); }
    .mini-icon-card .mic-icon { font-size: 20px; margin-bottom: 10px; }
    .mini-icon-card h5 { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--white); margin-bottom: 6px; }
    .mini-icon-card p { font-size: 12px; color: var(--muted); line-height: 1.5; }

    /* ===== CUSTOM IMAGES SECTION ===== */
    .custom-images-section { padding: 90px 0; }
    .ci-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
    .ci-copy .section-title { text-align: left; }
    .ci-list { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
    .ci-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--muted); line-height: 1.5; }
    .ci-list li::before { content: '✓'; color: var(--accent); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .ci-img { border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 60px rgba(0,0,0,.4); overflow: hidden; position: relative; }
    .ci-img-inner { width: 100%; height: 100%; background: linear-gradient(135deg, var(--surface), var(--surface2)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
    .ci-img-inner .ci-icon { font-size: 36px; opacity: .35; }
    .ci-img-inner .ci-label { font-size: 12px; color: var(--muted2); font-family: var(--font-display); text-align: center; }
    .ci-img .glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 40% 40%, rgba(79,110,247,.07) 0%, transparent 60%); }

    /* ===== HOW IT WORKS ===== */
    .how-section { padding: 90px 0; background: linear-gradient(180deg, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent); }
    .how-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .step-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 22px; position: relative; transition: all .2s; }
    .step-card:hover { border-color: rgba(79,110,247,.3); transform: translateY(-3px); }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: rgba(79,110,247,.15); border: 1px solid rgba(79,110,247,.3); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--accent); margin-bottom: 16px; }
    .step-img { width: 100%; height: 100px; border-radius: 8px; background: linear-gradient(135deg, var(--surface2), #0d1228); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: .5; margin-bottom: 16px; }
    .step-card h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; color: var(--white); margin-bottom: 8px; line-height: 1.3; }
    .step-card p { font-size: 13px; color: var(--muted); line-height: 1.6; }
    .step-connector { display: none; }

    /* ===== KNOWLEDGE BASE ===== */
    .kb-section { padding: 90px 0; }
    .kb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
    .kb-copy .section-title { text-align: left; margin-bottom: 16px; }
    .kb-copy .section-label { margin-bottom: 14px; }
    .kb-steps { display: flex; flex-direction: column; gap: 0; margin-top: 10px; }
    .kb-step { display: flex; gap: 18px; padding: 22px 0; border-bottom: 1px solid var(--border); }
    .kb-step:last-child { border-bottom: none; }
    .kb-step-num { width: 36px; height: 36px; border-radius: 50%; background: rgba(79,110,247,.12); border: 1px solid rgba(79,110,247,.25); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--accent); flex-shrink: 0; margin-top: 2px; }
    .kb-step h4 { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 6px; }
    .kb-step p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
    .kb-visual { border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 60px rgba(0,0,0,.4); overflow: hidden; position: relative; }
    .kb-visual-inner { width: 100%; height: 100%; background: linear-gradient(135deg, var(--surface), var(--surface2)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 30px; }
    .kb-upload-ui { width: 100%; background: rgba(79,110,247,.06); border: 1.5px dashed rgba(79,110,247,.3); border-radius: 12px; padding: 28px 20px; text-align: center; }
    .kb-upload-ui .ku-icon { font-size: 28px; margin-bottom: 10px; opacity: .6; }
    .kb-upload-ui h5 { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--white); margin-bottom: 4px; }
    .kb-upload-ui p { font-size: 11.5px; color: var(--muted); }
    .kb-file-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .kb-chip { background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; }
    .kb-chip .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

    /* ===== FINAL CTA ===== */
    .final-cta { padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
    .final-cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(79,110,247,.12) 0%, transparent 70%); pointer-events: none; }
    .final-cta h2 { font-family: var(--font-display); font-size: clamp(28px,5vw,52px); font-weight: 800; letter-spacing: -1px; color: var(--white); margin-bottom: 14px; }
    .final-cta p { font-size: 17px; color: var(--muted); margin-bottom: 34px; }
    .cta-perks { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 22px; flex-wrap: wrap; }
    .cta-perk { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
    .cta-perk::before { content: '✓'; color: var(--green); font-weight: 700; }
    .cta-screenshot { max-width: 720px; margin: 52px auto 0; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); box-shadow: 0 30px 80px rgba(0,0,0,.5); }
    .cta-mock { width: 100%; height: 300px; background: linear-gradient(135deg,#0d1226,#0a1020); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
    .cta-mock .cm-icon { font-size: 32px; opacity: .3; }
    .cta-mock .cm-label { font-size: 12px; color: var(--muted2); font-family: var(--font-display); }

    /* ===== RESPONSIVE ===== */
    @media(max-width:1024px){
      .footer-top{grid-template-columns:1fr 1fr 1fr;}
      .footer-brand{grid-column:1/-1;}
      .tabs-wrapper{grid-template-columns:1fr;}
      .mini-icons{grid-template-columns:repeat(2,1fr);}
      .how-grid{grid-template-columns:repeat(2,1fr);}
    }
    @media(max-width:860px){
      .main-nav{display:none;}
      .nav-toggle{display:flex;}
      .article-mock{grid-template-columns:1fr;}
      .mock-sidebar{display:none;}
      .highlights-grid{grid-template-columns:repeat(2,1fr);}
      .ci-grid,.kb-grid{grid-template-columns:1fr;}
      .footer-top{grid-template-columns:1fr 1fr;}
      .footer-brand{grid-column:1/-1;}
    }
    @media(max-width:600px){
      .highlights-grid{grid-template-columns:1fr;}
      .how-grid{grid-template-columns:1fr;}
      .mini-icons{grid-template-columns:1fr 1fr;}
      .hero h1{font-size:30px;}
    }
    .main-nav.open{display:flex!important;flex-direction:column;position:fixed;top:62px;left:0;right:0;background:rgba(8,9,13,.97);backdrop-filter:blur(12px);padding:20px;border-bottom:1px solid var(--border);gap:4px;z-index:39;}
    .main-nav.open .dropdown{display:none!important;}
`;

const HTML = `
<!-- PROMO BAR -->
<div class="promo-bar">
  ✨ &nbsp;New Year Offer: <strong style="color:#a5b4fc;margin:0 6px;">40% Off</strong> on Yearly Plans &nbsp;
  <span class="time-unit js-ph">08</span>hrs
  <span class="time-unit js-pm">34</span>min
  <span class="time-unit js-ps">12</span>sec
  <a class="deal-link" href="#">Get Deal</a>
</div>

<!-- HEADER -->
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/"><img src="/infin8content_logo.png" alt="Infin8Content"></a>
    <nav class="main-nav" id="main-nav">
      <div class="nav-item">
        <span class="nav-link">Features <span class="chevron">▾</span></span>
        <div class="dropdown">
          <div class="dropdown-label">AI Writing</div>
          <a class="dropdown-link" href="#">AI Content Writer</a>
          <a class="dropdown-link" href="#">AI Brief Generator</a>
          <a class="dropdown-link" href="#">News Writer</a>
          <a class="dropdown-link" href="#">Video to Blog Post</a>
          <hr>
          <div class="dropdown-label">Automation</div>
          <a class="dropdown-link" href="#">AutoPublish</a>
          <a class="dropdown-link" href="#">Workflow Orchestration</a>
          <a class="dropdown-link" href="#">SEO Reports</a>
          <a class="dropdown-link" href="#">Analytics Tracker</a>
        </div>
      </div>
      <div class="nav-item">
        <span class="nav-link">Solutions <span class="chevron">▾</span></span>
        <div class="dropdown">
          <a class="dropdown-link" href="#"><strong>SaaS</strong><small>Scale organic traffic for your product</small></a>
          <a class="dropdown-link" href="#"><strong>Agencies</strong><small>Manage multiple clients at scale</small></a>
          <a class="dropdown-link" href="#"><strong>E-Commerce</strong><small>Upgrade your store's content</small></a>
          <a class="dropdown-link" href="#"><strong>Enterprise</strong><small>SAML, SSO & dedicated support</small></a>
        </div>
      </div>
      <a class="nav-link" href="#">Pricing</a>
      <div class="nav-item">
        <span class="nav-link">Resources <span class="chevron">▾</span></span>
        <div class="dropdown">
          <a class="dropdown-link" href="#">Case Studies</a>
          <a class="dropdown-link" href="#">Learning & Training</a>
          <a class="dropdown-link" href="#">Help Docs</a>
          <a class="dropdown-link" href="#">Blog</a>
        </div>
      </div>
    </nav>
    <div class="header-cta">
      <a class="btn-link" href="#">Login</a>
      <a class="btn btn-primary" href="#">Get Started</a>
    </div>
    <button class="nav-toggle" id="nav-toggle">☰</button>
  </div>
</header>

<main>

  <!-- ===== HERO ===== -->
  <section class="hero">
    <div class="container">
      <div class="hero-eyebrow fade-up">✍️ &nbsp;AI Content Writer</div>
      <h1 class="fade-up">The AI Writer <span class="high">Tailored for SEO</span><br>that ranks you #1</h1>
      <p class="sub fade-up">The best AI SEO content writer that actually works — rank-ready articles in 30 seconds, in your brand voice.</p>
      <div class="hero-actions fade-up">
        <a class="btn btn-primary btn-primary-lg" href="#">Get Started Free</a>
      </div>
      <div class="social-proof fade-up">
        <div class="avatars">
          <div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div>
        </div>
        Trusted by <strong>&nbsp;10,000+&nbsp;</strong> Marketers & Agencies
      </div>
      <div class="hero-perks fade-up">
        <span>"Ready to rank"</span>
        <span>Articles in 30 secs</span>
        <span>Plagiarism Free</span>
      </div>

      <!-- ARTICLE PREVIEW MOCKUP -->
      <div class="article-preview-wrap fade-up">
        <div class="browser-frame">
          <div class="browser-bar">
            <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
            <div class="browser-url">infin8content.com/editor — The Future of AI Content Marketing</div>
          </div>
          <div class="article-mock">
            <!-- Sidebar: TOC -->
            <div class="mock-sidebar">
              <div class="site-label">Your Blog</div>
              <div class="domain-badge">📝 &nbsp;yourwebsite.com</div>
              <div class="toc-label">Table of Contents</div>
              <div class="toc-item active">Key Highlights</div>
              <div class="toc-item">The Content Revolution</div>
              <div class="toc-item">AI Writer Features</div>
              <div class="toc-item">Brand Voice Training</div>
              <div class="toc-item">Publishing Workflow</div>
              <div class="toc-item">Technical Specs</div>
              <div class="toc-item">SEO Optimization</div>
              <div class="toc-item">Case Studies</div>
              <div class="toc-item">FAQ</div>
            </div>
            <!-- Main content -->
            <div class="mock-content">
              <div class="art-tag">AI-Generated · SEO Optimized</div>
              <h2>How AI Content Marketing is Transforming Modern SEO Strategy</h2>
              <div class="art-badges">
                <span class="art-badge"><span class="dot-sm"></span> Published</span>
                <span class="art-badge">🌍 English</span>
                <span class="art-badge">📊 SEO Score: 94/100</span>
                <span class="art-badge">⏱ 2,400 words</span>
              </div>
              <h3>Key Highlights</h3>
              <ul class="art-list">
                <li>AI-powered content creation reduces publishing time by <span class="kw-highlight">80%</span> without sacrificing quality</li>
                <li>Brand voice training ensures every article sounds authentically human, not robotic</li>
                <li>One-click publish to <span class="link-highlight">WordPress, Shopify, Ghost</span>, and 10+ other platforms</li>
                <li>Built-in internal & external linking boosts domain authority automatically</li>
              </ul>
              <p>The shift to <span class="kw-highlight">AI-powered content workflows</span> is no longer optional for competitive marketers. Teams using Infin8Content report publishing <strong>10x more content</strong> with the same headcount — while simultaneously improving quality scores and organic rankings.</p>
              <div class="art-quote">"Infin8Content cut our time-to-publish by 80% and our organic traffic has tripled in 60 days." — Head of Content, Nova Media</div>
              <div class="img-placeholder">📸 &nbsp;In-article image — auto-generated with article context</div>
              <h3>Technical Comparison</h3>
              <table class="art-table">
                <tr><th>Metric</th><th>Before AI</th><th>With Infin8Content</th></tr>
                <tr><td>Articles/week</td><td>4</td><td>40+</td></tr>
                <tr><td>Avg. publish time</td><td>3 days</td><td>30 minutes</td></tr>
                <tr><td>SEO score avg.</td><td>62/100</td><td>91/100</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="mockup-badges">
          <div class="m-badge"><span class="icon">🔗</span> <strong>Internal linking</strong></div>
          <div class="m-badge"><span class="icon">🖼️</span> <strong>Auto images</strong></div>
          <div class="m-badge"><span class="icon">📺</span> <strong>Embedded videos</strong></div>
          <div class="m-badge"><span class="icon">🌍</span> <strong>150+ languages</strong></div>
          <div class="m-badge"><span class="icon">✅</span> <strong>Google compliant</strong></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== HIGHLIGHTS ===== -->
  <section class="highlights-section" style="padding:70px 0;">
    <div class="container">
      <p class="section-label" style="justify-content:center;margin-bottom:36px;">✦ &nbsp;Feature-Rich, Factual & SEO-Optimized Articles</p>
      <div class="highlights-grid">
        <div class="highlight-item">
          <div class="h-icon">✅</div>
          <h4>Google Compliant</h4>
          <p>Equivalent to an expert writer — informed articles that follow Google's E-E-A-T guidelines and rank fast.</p>
        </div>
        <div class="highlight-item">
          <div class="h-icon">🖼️</div>
          <h4>Relevant Images, Videos & Links</h4>
          <p>All articles include a featured image, in-article images, YouTube embeds, and internal & external links.</p>
        </div>
        <div class="highlight-item">
          <div class="h-icon">📐</div>
          <h4>Extensive Formatting</h4>
          <p>Properly formatted with all key HTML elements: H2s, H3s, paragraphs, lists, tables, and blockquotes.</p>
        </div>
        <div class="highlight-item">
          <div class="h-icon">📋</div>
          <h4>Table of Contents</h4>
          <p>Every article includes a structured outline that follows a natural flow to maximize engagement and read time.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== TABBED FEATURES ===== -->
  <section class="tabbed-section">
    <div class="container">
      <p class="section-label" style="justify-content:center;">⚡ &nbsp;The AI Content Writer Features</p>
      <h2 class="section-title">The AI Writer That's<br>Tailored for SEO</h2>

      <div class="tabs-wrapper">
        <div class="tabs-nav">
          <button class="tab-btn active" onclick="switchTab(this,'tab-formatting')">
            <div class="tb-icon">📐</div>
            <div class="tb-text"><h5>Extensive Formatting</h5><p>H2s, H3s, paragraphs, lists, tables</p></div>
          </button>
          <button class="tab-btn" onclick="switchTab(this,'tab-images')">
            <div class="tb-icon">🖼️</div>
            <div class="tb-text"><h5>Relevant Images</h5><p>Featured + in-article images auto-generated</p></div>
          </button>
          <button class="tab-btn" onclick="switchTab(this,'tab-videos')">
            <div class="tb-icon">📺</div>
            <div class="tb-text"><h5>Relevant Videos</h5><p>YouTube videos embedded contextually</p></div>
          </button>
          <button class="tab-btn" onclick="switchTab(this,'tab-links')">
            <div class="tb-icon">🔗</div>
            <div class="tb-text"><h5>Relevant Links</h5><p>Internal & external links auto-inserted</p></div>
          </button>
          <button class="tab-btn" onclick="switchTab(this,'tab-toc')">
            <div class="tb-icon">📋</div>
            <div class="tb-text"><h5>Table of Contents</h5><p>Thoughtful outline for every article</p></div>
          </button>
        </div>

        <div>
          <div class="tab-panel active" id="tab-formatting">
            <div class="tab-img">
              <div class="tab-img-inner"><div class="ti-icon">📐</div><div class="ti-label">Formatting Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div></div>
              <div class="glow"></div>
            </div>
          </div>
          <div class="tab-panel" id="tab-images">
            <div class="tab-img">
              <div class="tab-img-inner"><div class="ti-icon">🖼️</div><div class="ti-label">Image Generation Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div></div>
              <div class="glow"></div>
            </div>
          </div>
          <div class="tab-panel" id="tab-videos">
            <div class="tab-img">
              <div class="tab-img-inner"><div class="ti-icon">📺</div><div class="ti-label">Video Embed Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div></div>
              <div class="glow"></div>
            </div>
          </div>
          <div class="tab-panel" id="tab-links">
            <div class="tab-img">
              <div class="tab-img-inner"><div class="ti-icon">🔗</div><div class="ti-label">Linking Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div></div>
              <div class="glow"></div>
            </div>
          </div>
          <div class="tab-panel" id="tab-toc">
            <div class="tab-img">
              <div class="tab-img-inner"><div class="ti-icon">📋</div><div class="ti-label">Table of Contents Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div></div>
              <div class="glow"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mini icon grid -->
      <div class="mini-icons">
        <div class="mini-icon-card">
          <div class="mic-icon">📝</div>
          <h5>Content</h5>
          <p>Well-crafted content in seconds with the power of AI and your brand knowledge</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">🧠</div>
          <h5>Knowledge</h5>
          <p>Brand-tailored, with your own tone of voice — without sounding AI-generated</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">✏️</div>
          <h5>Formatting</h5>
          <p>Multiple formatting tools to facilitate editing and ensure a professional output</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">🖼️</div>
          <h5>Images</h5>
          <p>In-article images to increase relevancy, visual appeal, and reader UX</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">📺</div>
          <h5>Videos</h5>
          <p>Relevant in-article videos automatically embedded into your content</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">🔗</div>
          <h5>Internal Linking</h5>
          <p>Automatically links internally to other relevant pages on your site</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">🌐</div>
          <h5>External Linking</h5>
          <p>Automatically builds credibility with links to authoritative external sources</p>
        </div>
        <div class="mini-icon-card">
          <div class="mic-icon">⚙️</div>
          <h5>Structure</h5>
          <p>Fully customizable article structure — templates, CTAs, FAQs, and more</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== CUSTOM IMAGES ===== -->
  <section class="custom-images-section">
    <div class="container">
      <div class="ci-grid">
        <div class="ci-copy">
          <div class="section-label">🎨 &nbsp;AI Image Generation</div>
          <h2 class="section-title">Get creative with your blog<br>using <span style="color:var(--accent)">Custom Images</span></h2>
          <p style="color:var(--muted);font-size:15px;line-height:1.65;margin-bottom:20px;">Use AI to generate custom, on-brand images for your content. Iterate as many times as you need until you're satisfied — no design tool required.</p>
          <ul class="ci-list">
            <li>Unlimited generations and regenerations per article</li>
            <li>Images are generated with full article context for relevance</li>
            <li>Regenerate specific images easily with custom prompts</li>
          </ul>
        </div>
        <div class="ci-img">
          <div class="ci-img-inner">
            <div class="ci-icon">🎨</div>
            <div class="ci-label">AI Image Generation Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with product screenshot</span></div>
          </div>
          <div class="glow"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== HOW IT WORKS ===== -->
  <section class="how-section">
    <div class="container">
      <p class="section-label" style="justify-content:center;">🔧 &nbsp;How It Works</p>
      <h2 class="section-title" style="text-align:center;">How our AI writer works</h2>
      <p class="section-sub">Input information about your business or product, and let Infin8Content do the rest — from brief to published post.</p>

      <div class="how-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <div class="step-img">🔍</div>
          <h4>Generate Articles from Titles, Keywords or a Description</h4>
          <p>Generate articles based on keywords you want to rank for, or just describe your business & niche. You can input specific titles, or let AI suggest the best ones.</p>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <div class="step-img">✏️</div>
          <h4>Customize the Outline & Add a CTA</h4>
          <p>Set article length and take full control of the headings. Add headings manually and let AI generate the rest contextually. Add CTAs, Key Takeaways, FAQs, and custom sections.</p>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <div class="step-img">🌍</div>
          <h4>Language, Tonality & Geo-Targeting</h4>
          <p>Write content in 150+ languages. Choose formality, point of view, and tonality — from factual to creative. Apply geo-targeting for location-specific content.</p>
        </div>
        <div class="step-card">
          <div class="step-num">4</div>
          <div class="step-img">🚀</div>
          <h4>Generate & Publish Multiple Articles at Once</h4>
          <p>Choose how many articles to generate in a single run. Download them as a zip file or publish in one click directly to your website or CMS.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== KNOWLEDGE BASE ===== -->
  <section class="kb-section">
    <div class="container">
      <div class="kb-grid">
        <div class="kb-copy">
          <div class="section-label">📚 &nbsp;Knowledge Base</div>
          <h2 class="section-title">Upload your own<br>Knowledge Base</h2>
          <p style="color:var(--muted);font-size:15px;line-height:1.65;margin-bottom:24px;">Get articles that reflect deep, in-depth knowledge about your specific business — not generic AI-sounding fluff.</p>
          <div class="kb-steps">
            <div class="kb-step">
              <div class="kb-step-num">1</div>
              <div>
                <h4>Upload Assets</h4>
                <p>Upload your website, videos, text documents, product docs, or any available business information. We'll analyse everything.</p>
              </div>
            </div>
            <div class="kb-step">
              <div class="kb-step-num">2</div>
              <div>
                <h4>Learning Phase</h4>
                <p>Our AI enters a learning phase, loading your assets and refining its understanding of your brand voice, expertise, and context.</p>
              </div>
            </div>
            <div class="kb-step">
              <div class="kb-step-num">3</div>
              <div>
                <h4>Tailored Articles</h4>
                <p>Generate articles that reflect your business's unique knowledge and context — content that sounds like you wrote it, not an AI.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="kb-visual">
          <div class="kb-visual-inner">
            <div class="kb-upload-ui">
              <div class="ku-icon">☁️</div>
              <h5>Upload Your Knowledge Base</h5>
              <p>Drag & drop your files, paste a URL, or connect your CMS</p>
            </div>
            <div class="kb-file-chips">
              <div class="kb-chip"><span class="chip-dot"></span> Website scanned</div>
              <div class="kb-chip"><span class="chip-dot"></span> 3 PDFs uploaded</div>
              <div class="kb-chip"><span class="chip-dot"></span> Brand voice set</div>
              <div class="kb-chip"><span class="chip-dot"></span> 12 videos indexed</div>
            </div>
            <div style="width:100%;background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.2);border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;box-shadow:0 0 8px var(--green);"></div>
              <span style="font-size:12.5px;color:var(--text);">Knowledge base ready — generating tailored articles…</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== FINAL CTA ===== -->
  <section class="final-cta">
    <div class="container">
      <h2>Scale more content.<br>Do less work.</h2>
      <p>Get started and see why agencies trust Infin8Content.</p>
      <a class="btn btn-primary btn-primary-lg" href="#">Get Started Free</a>
      <div class="cta-perks">
        <span class="cta-perk">Cancel anytime</span>
        <span class="cta-perk">Articles in 30 secs</span>
        <span class="cta-perk">Plagiarism free</span>
      </div>
      <div class="cta-screenshot">
        <div class="cta-mock">
          <div class="cm-icon">🖥️</div>
          <div class="cm-label">Platform preview — replace with your app screenshot</div>
        </div>
      </div>
    </div>
  </section>

</main>

<!-- FOOTER -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="/"><img src="/infin8content_logo.png" alt="Infin8Content"></a>
        <p>AI content workflows for modern teams and agencies.</p>
      </div>
      <div class="footer-col">
        <h4>AI Writing</h4>
        <a href="#">AI Content Writer</a>
        <a href="#">AI Brief Generator</a>
        <a href="#">News Writer</a>
        <a href="#">Video to Blog</a>
      </div>
      <div class="footer-col">
        <h4>Automation</h4>
        <a href="#">AutoPublish</a>
        <a href="#">Workflow Orchestration</a>
        <a href="#">SEO Reports</a>
        <a href="#">Analytics Tracker</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="#">Pricing</a>
        <a href="#">Blog</a>
        <a href="#">Help Docs</a>
        <a href="#">Case Studies</a>
        <a href="#">About Us</a>
      </div>
      <div class="footer-col">
        <h4>Integrations</h4>
        <a href="#">WordPress</a>
        <a href="#">Shopify</a>
        <a href="#">Ghost</a>
        <a href="#">Webflow</a>
        <a href="#">Zapier</a>
      </div>
      <div class="footer-col">
        <h4>Solutions</h4>
        <a href="#">SaaS</a>
        <a href="#">Agencies</a>
        <a href="#">E-Commerce</a>
        <a href="#">Enterprise</a>
      </div>
    </div>
    <div class="footer-bottom">
      <small>© <span class="js-year"></span> Infin8Content. All rights reserved.</small>
      <div class="footer-legal">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">contact@infin8content.com</a>
      </div>
    </div>
  </div>
</footer>
`;

export default function AIContentWriterPage() {
  return <MarketingPageBody html={HTML} css={CSS} />;
}
