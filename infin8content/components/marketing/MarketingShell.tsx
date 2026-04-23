'use client';

import { useEffect } from 'react';

const shellCss = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #08090d; --surface: #0f1117; --surface2: #13151e; --surface3: #0b0d14;
  --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.04);
  --accent: #4f6ef7; --accent-lite: rgba(79,110,247,0.12); --accent-border: rgba(79,110,247,0.25); --accent-glow: rgba(79,110,247,0.18);
  --text: #e8eaf2; --muted: #7b8098; --muted2: #4a4f68; --white: #ffffff;
  --green: #22c55e; --green-lite: rgba(34,197,94,0.1); --red: #ef4444;
  --font-display: 'Sora', sans-serif; --font-body: 'DM Sans', sans-serif;
  --radius: 14px; --radius-sm: 8px; --container: 1160px;
}
html { scroll-behavior: smooth; }
body { font-family: var(--font-body); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; overflow-x: hidden; line-height: 1.6; }
a { color: inherit; text-decoration: none; transition: color .2s; }
img { max-width: 100%; display: block; }
ul { list-style: none; }
.container { max-width: var(--container); margin: 0 auto; padding: 0 28px; }

/* PROMO BAR */
.promo-bar { background: linear-gradient(90deg,#1a1060,#0f1340 50%,#1a1060); border-bottom: 1px solid var(--accent-border); text-align: center; padding: 10px 20px; font-size: 13px; font-family: var(--font-display); font-weight: 500; color: var(--text); position: relative; z-index: 50; }
.time-unit { background: var(--accent-lite); border: 1px solid var(--accent-border); border-radius: 4px; padding: 2px 6px; font-weight: 700; color: #a5b4fc; font-variant-numeric: tabular-nums; min-width: 28px; display: inline-block; text-align: center; }
.deal-link { background: var(--accent); color: #fff; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600; margin-left: 10px; }

/* HEADER */
.site-header { position: sticky; top: 0; z-index: 40; background: rgba(8,9,13,.88); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 62px; gap: 16px; }
.brand { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: -.5px; color: var(--white); flex-shrink: 0; }
.brand span { color: var(--accent); }
.brand img { height: 32px; width: auto; display: block; }
.main-nav { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
.nav-item { position: relative; }
.nav-link { display: flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; color: var(--muted); transition: all .2s; cursor: pointer; white-space: nowrap; }
.nav-link:hover { color: var(--white); background: rgba(255,255,255,.05); }
.chevron { font-size: 10px; transition: transform .2s; }
.nav-item:hover .chevron { transform: rotate(180deg); }
.dropdown { display: none; position: absolute; top: 100%; left: 0; background: #12141f; border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 8px 8px; min-width: 230px; box-shadow: 0 20px 60px rgba(0,0,0,.5); z-index: 100; }
.nav-item:hover .dropdown { display: block; }
.dropdown-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); padding: 4px 10px; margin-bottom: 2px; }
.dropdown-link { display: block; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 13.5px; color: var(--muted); transition: all .15s; }
.dropdown-link:hover { color: var(--white); background: rgba(255,255,255,.05); }
.dropdown-link strong { display: block; color: var(--text); font-size: 13.5px; margin-bottom: 1px; }
.dropdown-link small { font-size: 12px; color: var(--muted); }
.dropdown hr { border: none; border-top: 1px solid var(--border); margin: 6px 0; }
.header-cta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-link { font-size: 14px; font-weight: 500; color: var(--muted); padding: 7px 12px; border-radius: var(--radius-sm); transition: all .2s; }
.btn-link:hover { color: var(--white); background: rgba(255,255,255,.05); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-display); font-weight: 600; border-radius: var(--radius-sm); transition: all .2s; cursor: pointer; border: none; text-decoration: none; }
.btn-primary { background: var(--accent); color: #fff; padding: 9px 18px; font-size: 14px; box-shadow: 0 0 20px rgba(79,110,247,.3); }
.btn-primary:hover { background: #3d5df5; box-shadow: 0 0 30px rgba(79,110,247,.5); transform: translateY(-1px); }
.btn-lg { padding: 14px 30px; font-size: 16px; border-radius: 10px; }
.btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 9px 18px; font-size: 14px; }
.btn-ghost:hover { border-color: rgba(255,255,255,.2); color: var(--white); }
.nav-toggle { display: none; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); padding: 7px 10px; font-size: 18px; cursor: pointer; }
@media(max-width:860px){ .main-nav{display:none;} .nav-toggle{display:flex;} }
.main-nav.open { display:flex!important; flex-direction:column; position:fixed; top:62px; left:0; right:0; background:rgba(8,9,13,.97); backdrop-filter:blur(12px); padding:20px; border-bottom:1px solid var(--border); gap:4px; z-index:39; }
.main-nav.open .dropdown{display:none!important;}

/* FOOTER */
.site-footer { border-top: 1px solid var(--border); padding: 60px 0 40px; }
.footer-top { display: grid; grid-template-columns: 220px repeat(5,1fr); gap: 40px; margin-bottom: 48px; }
.footer-brand .brand { display: block; margin-bottom: 12px; }
.footer-brand p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
.footer-col h4 { font-family: var(--font-display); font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); margin-bottom: 14px; }
.footer-col a { display: block; font-size: 13.5px; color: var(--muted); margin-bottom: 10px; transition: color .2s; }
.footer-col a:hover { color: var(--white); }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 12px; }
.footer-bottom small { font-size: 12.5px; color: var(--muted2); }
.footer-legal { display: flex; gap: 16px; }
.footer-legal a { font-size: 12.5px; color: var(--muted2); }
.footer-legal a:hover { color: var(--muted); }
@media(max-width:1024px){ .footer-top{grid-template-columns:1fr 1fr 1fr;} .footer-brand{grid-column:1/-1;} }
@media(max-width:860px){ .footer-top{grid-template-columns:1fr 1fr;} .footer-brand{grid-column:1/-1;} }
`;

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Year
    const year = String(new Date().getFullYear());
    document.querySelectorAll<HTMLElement>('.js-year').forEach(el => (el.textContent = year));

    // Countdown
    let total = 8 * 3600 + 34 * 60 + 12;
    function tick() {
      if (total <= 0) return;
      total--;
      const h = String(Math.floor(total / 3600)).padStart(2, '0');
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const s = String(total % 60).padStart(2, '0');
      document.querySelectorAll<HTMLElement>('.js-ph').forEach(e => (e.textContent = h));
      document.querySelectorAll<HTMLElement>('.js-pm').forEach(e => (e.textContent = m));
      document.querySelectorAll<HTMLElement>('.js-ps').forEach(e => (e.textContent = s));
    }
    tick();
    const timer = setInterval(tick, 1000);

    // Nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');
    if (navToggle && mainNav) {
      const handler = () => {
        mainNav.classList.toggle('open');
        navToggle.textContent = mainNav.classList.contains('open') ? '✕' : '☰';
      };
      navToggle.addEventListener('click', handler);
      return () => {
        clearInterval(timer);
        navToggle.removeEventListener('click', handler);
      };
    }
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mkt-layout">
      <style dangerouslySetInnerHTML={{ __html: shellCss }} />

      {/* Promo Bar */}
      <div className="promo-bar">
        ✨&nbsp; New Year Offer:{' '}
        <strong style={{ color: '#a5b4fc', margin: '0 6px' }}>40% Off</strong> on Yearly Plans
        &nbsp;
        <span className="time-unit js-ph">08</span>hrs{' '}
        <span className="time-unit js-pm">34</span>min{' '}
        <span className="time-unit js-ps">12</span>sec
        <a className="deal-link" href="#">Get Deal</a>
      </div>

      {/* Header */}
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/">
            <img src="/infin8content_logo.png" alt="Infin8Content" />
          </a>
          <nav className="main-nav" id="main-nav">
            <div className="nav-item">
              <span className="nav-link">Features <span className="chevron">▾</span></span>
              <div className="dropdown">
                <div className="dropdown-label">AI Writing</div>
                <a className="dropdown-link" href="/ai-content-writer">AI Content Writer</a>
                <a className="dropdown-link" href="/ai-seo-editor">AI SEO Editor</a>
                <a className="dropdown-link" href="#">News Writer</a>
                <hr />
                <div className="dropdown-label">SEO &amp; Automation</div>
                <a className="dropdown-link" href="/ai-seo-agent">AI SEO Agent</a>
                <a className="dropdown-link" href="/autopublish">AutoPublish</a>
                <a className="dropdown-link" href="/llm-tracker">LLM Tracker</a>
              </div>
            </div>
            <div className="nav-item">
              <span className="nav-link">Solutions <span className="chevron">▾</span></span>
              <div className="dropdown">
                <a className="dropdown-link" href="/solutions/saas"><strong>SaaS</strong><small>Scale organic traffic for your product</small></a>
                <a className="dropdown-link" href="/solutions/agency"><strong>Agencies</strong><small>Manage multiple clients at scale</small></a>
                <a className="dropdown-link" href="/solutions/ecommerce"><strong>E-Commerce</strong><small>Upgrade your store&apos;s content</small></a>
                <a className="dropdown-link" href="#"><strong>Enterprise</strong><small>SAML, SSO &amp; dedicated support</small></a>
              </div>
            </div>
            <a className="nav-link" href="/pricing">Pricing</a>
            <div className="nav-item">
              <span className="nav-link">Resources <span className="chevron">▾</span></span>
              <div className="dropdown">
                <a className="dropdown-link" href="/resources/case-studies">Case Studies</a>
                <a className="dropdown-link" href="/resources/learn">Learning &amp; Training</a>
                <a className="dropdown-link" href="#">Help Docs</a>
                <a className="dropdown-link" href="/resources/blog">Blog</a>
              </div>
            </div>
          </nav>
          <div className="header-cta">
            <a className="btn-link" href="#">Login</a>
            <a className="btn btn-primary" href="#">Get Started</a>
          </div>
          <button className="nav-toggle" id="nav-toggle">☰</button>
        </div>
      </header>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a className="brand" href="/">
                <img src="/infin8content_logo.png" alt="Infin8Content" />
              </a>
              <p>AI content workflows for modern teams and agencies.</p>
            </div>
            <div className="footer-col">
              <h4>AI Writing</h4>
              <a href="/ai-content-writer">AI Content Writer</a>
              <a href="/ai-seo-editor">AI SEO Editor</a>
              <a href="#">News Writer</a>
              <a href="#">Video to Blog</a>
            </div>
            <div className="footer-col">
              <h4>Automation</h4>
              <a href="/ai-seo-agent">AI SEO Agent</a>
              <a href="/autopublish">AutoPublish</a>
              <a href="#">SEO Reports</a>
              <a href="/llm-tracker">LLM Tracker</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="/pricing">Pricing</a>
              <a href="/resources/blog">Blog</a>
              <a href="#">Help Docs</a>
              <a href="/resources/case-studies">Case Studies</a>
            </div>
            <div className="footer-col">
              <h4>Integrations</h4>
              <a href="#">WordPress</a>
              <a href="#">Shopify</a>
              <a href="#">Ghost</a>
              <a href="#">Webflow</a>
              <a href="#">Zapier</a>
            </div>
            <div className="footer-col">
              <h4>Solutions</h4>
              <a href="/solutions/saas">SaaS</a>
              <a href="/solutions/agency">Agencies</a>
              <a href="/solutions/ecommerce">E-Commerce</a>
              <a href="#">Enterprise</a>
            </div>
          </div>
          <div className="footer-bottom">
            <small>© <span className="js-year"></span> Infin8Content. All rights reserved.</small>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">contact@infin8content.com</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
