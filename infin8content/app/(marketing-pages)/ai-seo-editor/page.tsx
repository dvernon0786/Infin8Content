import type { Metadata } from 'next';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

export const metadata: Metadata = {
  title: 'AI SEO Content Editor & Optimizer | Infin8Content',
};

const css = `/* ===================== RESET & TOKENS ===================== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #08090d;
  --surface: #0f1117;
  --surface2: #13151e;
  --surface3: #0b0d14;
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.04);
  --accent: #4f6ef7;
  --accent-lite: rgba(79,110,247,0.12);
  --accent-border: rgba(79,110,247,0.25);
  --accent-glow: rgba(79,110,247,0.18);
  --text: #e8eaf2;
  --muted: #7b8098;
  --muted2: #4a4f68;
  --white: #ffffff;
  --green: #22c55e;
  --green-lite: rgba(34,197,94,0.1);
  --red: #ef4444;
  --font-display: 'Sora', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --radius: 14px;
  --radius-sm: 8px;
  --container: 1160px;
}
html { scroll-behavior: smooth; }
body { font-family: var(--font-body); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; overflow-x: hidden; line-height: 1.6; }
a { color: inherit; text-decoration: none; transition: color .2s; }
img { max-width: 100%; display: block; }
ul { list-style: none; }
.container { max-width: var(--container); margin: 0 auto; padding: 0 28px; }

/* ===================== PROMO BAR ===================== */
.promo-bar { background: linear-gradient(90deg,#1a1060,#0f1340 50%,#1a1060); border-bottom: 1px solid var(--accent-border); text-align: center; padding: 10px 20px; font-size: 13px; font-family: var(--font-display); font-weight: 500; color: var(--text); position: relative; z-index: 50; }
.time-unit { background: var(--accent-lite); border: 1px solid var(--accent-border); border-radius: 4px; padding: 2px 6px; font-weight: 700; color: #a5b4fc; font-variant-numeric: tabular-nums; min-width: 28px; display: inline-block; text-align: center; }
.deal-link { background: var(--accent); color: #fff; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600; margin-left: 10px; }

/* ===================== HEADER ===================== */
.site-header { position: sticky; top: 0; z-index: 40; background: rgba(8,9,13,.88); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 62px; gap: 16px; }
.brand { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: -.5px; color: var(--white); flex-shrink: 0; }
.brand span { color: var(--accent); }
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

/* ===================== SHARED HERO ===================== */
.hero { padding: 80px 0 64px; text-align: center; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 700px; height: 600px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); pointer-events: none; }
.hero-eyebrow { display: inline-flex; align-items: center; gap: 6px; background: var(--accent-lite); border: 1px solid var(--accent-border); border-radius: 20px; padding: 5px 14px; font-size: 13px; font-weight: 500; color: #a5b4fc; margin-bottom: 22px; }
.hero h1 { font-family: var(--font-display); font-size: clamp(32px,5.2vw,58px); font-weight: 800; line-height: 1.07; letter-spacing: -1.5px; color: var(--white); max-width: 820px; margin: 0 auto 18px; }
.hero h1 .high { color: var(--accent); font-style: italic; }
.hero .sub { font-size: 18px; color: var(--muted); max-width: 560px; margin: 0 auto 30px; line-height: 1.65; }
.hero-actions { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
.social-proof { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13.5px; color: var(--muted); margin-bottom: 12px; }
.avatars { display: flex; }
.avatars .av { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--bg); background: var(--surface2); margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--accent); }
.avatars .av:first-child { margin-left: 0; }
.social-proof strong { color: var(--white); }
.hero-perks { display: flex; align-items: center; justify-content: center; gap: 20px; font-size: 13px; color: var(--muted); margin-top: 6px; flex-wrap: wrap; }
.hero-perks span::before { content: '✓'; color: var(--green); font-weight: 700; margin-right: 5px; }

/* ===================== SHARED SECTIONS ===================== */
.section { padding: 90px 0; }
.section-alt { background: linear-gradient(180deg, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent); }
.section-label { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); margin-bottom: 14px; }
.section-title { font-family: var(--font-display); font-size: clamp(24px,3.5vw,40px); font-weight: 700; letter-spacing: -.6px; color: var(--white); margin-bottom: 14px; line-height: 1.15; }
.section-sub { font-size: 16px; color: var(--muted); line-height: 1.65; }

/* ===================== BROWSER FRAME ===================== */
.browser-frame { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04); }
.browser-bar { background: var(--surface2); padding: 10px 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background:#ff5f57; } .dot-y { background:#febc2e; } .dot-g { background:#28c840; }
.browser-url { flex: 1; background: rgba(255,255,255,.04); border-radius: 6px; height: 24px; margin: 0 12px; display: flex; align-items: center; padding: 0 10px; font-size: 11px; color: var(--muted2); }

/* ===================== BEFORE/AFTER ===================== */
.before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
.ba-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.ba-header { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 13px; font-weight: 700; }
.ba-header.before { color: var(--muted); }
.ba-header.after { color: var(--green); }
.ba-header .ba-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; border-radius: 4px; padding: 2px 7px; }
.ba-header.before .ba-label { background: rgba(255,255,255,.06); color: var(--muted); }
.ba-header.after .ba-label { background: var(--green-lite); color: var(--green); }
.ba-body { padding: 20px; }
.ba-img { width: 100%; height: 160px; background: linear-gradient(135deg,var(--surface2),var(--surface3)); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: .4; border: 1px solid var(--border); }
.ba-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: var(--muted); padding: 5px 0; }
.ba-list.before li::before { content: '✗'; color: var(--red); font-weight: 700; flex-shrink: 0; }
.ba-list.after li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; }

/* ===================== FEATURE ROWS (left/right) ===================== */
.feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; padding: 60px 0; border-bottom: 1px solid var(--border); }
.feature-row:last-child { border-bottom: none; }
.feature-row.rev { direction: rtl; }
.feature-row.rev > * { direction: ltr; }
.feature-row-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); margin-bottom: 12px; }
.feature-row h2 { font-family: var(--font-display); font-size: clamp(20px,2.8vw,30px); font-weight: 700; letter-spacing: -.4px; color: var(--white); margin-bottom: 16px; line-height: 1.2; }
.feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--muted); padding: 5px 0; line-height: 1.5; }
.feature-list li::before { content: '✓'; color: var(--accent); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.feat-img { border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
.feat-img-inner { width: 100%; height: 100%; background: linear-gradient(135deg,var(--surface),var(--surface2)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.feat-img-icon { font-size: 36px; opacity: .35; }
.feat-img-label { font-size: 12px; color: var(--muted2); text-align: center; padding: 0 20px; font-family: var(--font-display); }
.feat-img .glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 30%, rgba(79,110,247,.08) 0%, transparent 60%); }

/* ===================== STEPS ===================== */
.steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.step-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 22px; transition: all .2s; }
.step-card:hover { border-color: var(--accent-border); transform: translateY(-3px); }
.step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-lite); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--accent); margin-bottom: 16px; }
.step-icon { font-size: 26px; margin-bottom: 12px; }
.step-card h4 { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 8px; line-height: 1.3; }
.step-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

/* ===================== FAQ ===================== */
.faq-list { max-width: 760px; margin: 40px auto 0; }
.faq-item { border-bottom: 1px solid var(--border); }
.faq-q { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; cursor: pointer; font-size: 15px; font-weight: 500; color: var(--text); transition: color .2s; gap: 20px; }
.faq-q:hover { color: var(--white); }
.faq-icon { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; transition: all .3s; color: var(--muted); }
.faq-item.open .faq-icon { background: var(--accent-lite); color: var(--accent); transform: rotate(45deg); }
.faq-a { display: none; padding: 0 0 20px; font-size: 14.5px; color: var(--muted); line-height: 1.7; }
.faq-item.open .faq-a { display: block; }

/* ===================== TESTIMONIAL CARDS ===================== */
.t-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 40px; }
.t-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; display: flex; flex-direction: column; gap: 14px; transition: border-color .2s; }
.t-card:hover { border-color: var(--accent-border); }
.t-quote { font-size: 14px; color: var(--text); line-height: 1.65; flex: 1; }
.t-quote strong { color: var(--white); }
.t-author { display: flex; align-items: center; gap: 10px; }
.t-av { width: 36px; height: 36px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: var(--accent); flex-shrink: 0; }
.t-name { font-weight: 600; font-size: 13px; color: var(--white); }
.t-role { font-size: 11.5px; color: var(--muted); }

/* ===================== GRID FEATURE CARDS ===================== */
.feat-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.feat-card { background: var(--surface); padding: 26px 22px; transition: background .2s; }
.feat-card:hover { background: var(--surface2); }
.feat-card .fc-icon { font-size: 22px; margin-bottom: 12px; }
.feat-card h4 { font-family: var(--font-display); font-size: 14px; font-weight: 600; color: var(--white); margin-bottom: 7px; }
.feat-card p { font-size: 13px; color: var(--muted); line-height: 1.55; }

/* ===================== FINAL CTA ===================== */
.final-cta { padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
.final-cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(79,110,247,.12) 0%, transparent 70%); pointer-events: none; }
.final-cta h2 { font-family: var(--font-display); font-size: clamp(28px,5vw,50px); font-weight: 800; letter-spacing: -1px; color: var(--white); margin-bottom: 14px; }
.final-cta p { font-size: 17px; color: var(--muted); margin-bottom: 34px; }
.cta-perks { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 20px; flex-wrap: wrap; }
.cta-perk { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.cta-perk::before { content: '✓'; color: var(--green); font-weight: 700; }
.cta-social { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 28px; }
.cta-mock-img { max-width: 700px; margin: 48px auto 0; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); box-shadow: 0 30px 80px rgba(0,0,0,.5); }
.cta-mock-inner { width: 100%; height: 280px; background: linear-gradient(135deg,#0d1226,#0a1020); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
.cta-mock-inner .cm-icon { font-size: 30px; opacity: .3; }
.cta-mock-inner .cm-label { font-size: 12px; color: var(--muted2); font-family: var(--font-display); }

/* ===================== FOOTER ===================== */
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

/* ===================== ANIMATIONS ===================== */
@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.fade-up { opacity:0; animation: fadeUp .6s ease forwards; }
.fade-up:nth-child(1){animation-delay:.05s} .fade-up:nth-child(2){animation-delay:.15s} .fade-up:nth-child(3){animation-delay:.25s} .fade-up:nth-child(4){animation-delay:.35s} .fade-up:nth-child(5){animation-delay:.45s}

/* ===================== VIDEO PLACEHOLDER ===================== */
.video-wrap { max-width: 860px; margin: 0 auto; aspect-ratio: 16/9; background: #0c0f1a; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 30px 80px rgba(0,0,0,.5); }
.play-btn { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.1); border: 2px solid rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 26px; cursor: pointer; transition: all .2s; backdrop-filter: blur(6px); }
.play-btn:hover { background: rgba(79,110,247,.4); transform: scale(1.06); }

/* ===================== RESPONSIVE ===================== */
@media(max-width:1024px){ .footer-top{grid-template-columns:1fr 1fr 1fr;} .footer-brand{grid-column:1/-1;} .feat-cards{grid-template-columns:repeat(2,1fr);} .t-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:860px){ .main-nav{display:none;} .nav-toggle{display:flex;} .feature-row{grid-template-columns:1fr; gap:36px;} .feature-row.rev{direction:ltr;} .before-after{grid-template-columns:1fr;} .steps-grid{grid-template-columns:1fr;} .footer-top{grid-template-columns:1fr 1fr;} .footer-brand{grid-column:1/-1;} .t-grid{grid-template-columns:1fr;} }
@media(max-width:600px){ .hero h1{font-size:28px;} .feat-cards{grid-template-columns:1fr;} }
.main-nav.open { display:flex!important; flex-direction:column; position:fixed; top:62px; left:0; right:0; background:rgba(8,9,13,.97); backdrop-filter:blur(12px); padding:20px; border-bottom:1px solid var(--border); gap:4px; z-index:39; }
.main-nav.open .dropdown{display:none!important;}
/* PAGE-SPECIFIC */
    .editor-wrap { max-width: 960px; margin: 52px auto 0; position: relative; }
    .editor-wrap::after { content:''; position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); width:70%; height:80px; background:radial-gradient(ellipse,rgba(79,110,247,.22) 0%,transparent 70%); filter:blur(20px); pointer-events:none; }
    .editor-mock { display: grid; grid-template-columns: 1fr 300px; min-height: 440px; }
    .em-main { padding: 28px 30px; border-right: 1px solid var(--border); }
    .em-toolbar { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
    .em-tool { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 5px 12px; font-size: 12px; color: var(--muted); cursor: pointer; transition: all .15s; }
    .em-tool:hover,.em-tool.active { background: var(--accent-lite); border-color: var(--accent-border); color: #a5b4fc; }
    .em-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--white); margin-bottom: 14px; }
    .em-para { font-size: 13px; color: var(--muted); line-height: 1.75; margin-bottom: 12px; }
    .em-para .em-kw { background: rgba(79,110,247,.15); border-radius: 3px; padding: 0 3px; color: #a5b4fc; }
    .em-para .em-link { color: var(--accent); border-bottom: 1px solid rgba(79,110,247,.35); }
    .em-highlight { background: rgba(251,191,36,.08); border-left: 2px solid #fbbf24; padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 12.5px; color: var(--text); font-style: italic; margin: 12px 0; }
    .em-sidebar { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .em-sidebar-section h5 { font-family: var(--font-display); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); margin-bottom: 10px; }
    .em-score { display: flex; align-items: center; gap: 10px; }
    .em-score-ring { width: 52px; height: 52px; border-radius: 50%; background: conic-gradient(var(--accent) 330deg, rgba(255,255,255,.05) 0); display: flex; align-items: center; justify-content: center; position: relative; }
    .em-score-ring::before { content:''; position:absolute; inset:5px; background:var(--surface2); border-radius:50%; }
    .em-score-ring span { position: relative; z-index: 1; font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--accent); }
    .em-score-info { font-size: 12px; color: var(--muted); }
    .em-score-info strong { display: block; color: var(--white); font-size: 14px; margin-bottom: 2px; }
    .em-suggestion { display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 8px; background: rgba(255,255,255,.02); border: 1px solid var(--border); font-size: 12px; color: var(--muted); line-height: 1.4; }
    .em-suggestion .s-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
    .em-suggestion.green .s-dot { background: var(--green); }
    .em-suggestion.amber .s-dot { background: #f59e0b; }
    .em-suggestion.blue .s-dot { background: var(--accent); }
    .em-ai-chat { background: rgba(79,110,247,.06); border: 1px solid var(--accent-border); border-radius: 8px; padding: 12px; }
    .em-chat-msg { font-size: 12px; color: var(--text); line-height: 1.5; margin-bottom: 8px; }
    .em-chat-input { width: 100%; background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 6px; padding: 7px 10px; font-size: 12px; color: var(--muted); font-family: var(--font-body); cursor: default; }
    .feat-tabs-wrap { margin-top: 40px; }
    .feat-tabs-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 32px; flex-wrap: wrap; }
    .ftab { padding: 10px 18px; font-size: 13.5px; font-weight: 500; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; background: transparent; border-left: none; border-right: none; border-top: none; font-family: var(--font-body); }
    .ftab:hover { color: var(--white); }
    .ftab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .ftab-panel { display: none; }
    .ftab-panel.active { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
    .ftab-panel h3 { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--white); margin-bottom: 14px; letter-spacing: -.4px; }
    .ftab-panel p { font-size: 15px; color: var(--muted); line-height: 1.65; margin-bottom: 16px; }
    .t-strip { padding: 70px 0; background: linear-gradient(180deg,transparent,var(--surface2) 20%,var(--surface2) 80%,transparent); overflow: hidden; }
    .t-strip h2 { font-family: var(--font-display); font-size: clamp(22px,3.5vw,36px); font-weight: 700; letter-spacing: -.4px; color: var(--white); text-align: center; margin-bottom: 8px; }
    .t-strip .ts-sub { text-align: center; color: var(--muted); font-size: 15px; margin-bottom: 36px; }
    @media(max-width:860px){ .editor-mock{grid-template-columns:1fr;} .em-sidebar{display:none;} .ftab-panel.active{grid-template-columns:1fr;} }`;

const html = `<!-- PROMO BAR -->
<div class="promo-bar">
  ✨&nbsp; New Year Offer: <strong style="color:#a5b4fc;margin:0 6px;">40% Off</strong> on Yearly Plans &nbsp;
  <span class="time-unit js-ph">08</span>hrs <span class="time-unit js-pm">34</span>min <span class="time-unit js-ps">12</span>sec
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
          <a class="dropdown-link" href="/ai-content-writer">AI Content Writer</a>
          <a class="dropdown-link" href="/ai-seo-editor">AI SEO Editor</a>
          <a class="dropdown-link" href="#">News Writer</a>
          <a class="dropdown-link" href="#">Video to Blog Post</a>
          <hr>
          <div class="dropdown-label">Automation</div>
          <a class="dropdown-link" href="/ai-seo-agent">AI SEO Agent</a>
          <a class="dropdown-link" href="/autopublish">AutoPublish</a>
          <a class="dropdown-link" href="#">SEO Reports</a>
          <a class="dropdown-link" href="/llm-tracker">LLM Visibility Tracker</a>
        </div>
      </div>
      <div class="nav-item">
        <span class="nav-link">Solutions <span class="chevron">▾</span></span>
        <div class="dropdown">
          <a class="dropdown-link" href="#"><strong>SaaS</strong><small>Scale organic traffic for your product</small></a>
          <a class="dropdown-link" href="#"><strong>Agencies</strong><small>Manage multiple clients at scale</small></a>
          <a class="dropdown-link" href="#"><strong>E-Commerce</strong><small>Upgrade your store's content</small></a>
          <a class="dropdown-link" href="#"><strong>Enterprise</strong><small>SAML, SSO &amp; dedicated support</small></a>
        </div>
      </div>
      <a class="nav-link" href="#">Pricing</a>
      <div class="nav-item">
        <span class="nav-link">Resources <span class="chevron">▾</span></span>
        <div class="dropdown">
          <a class="dropdown-link" href="#">Case Studies</a>
          <a class="dropdown-link" href="#">Learning &amp; Training</a>
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

<!-- HERO -->
<section class="hero">
  <div class="container">
    <div class="hero-eyebrow fade-up">✏️ &nbsp;AI SEO Editor</div>
    <h1 class="fade-up">Optimize Existing Content with<br>the <span class="high">SEO Editor</span> &amp; AI Assistant</h1>
    <p class="sub fade-up">Add links, images, keywords, and AI-powered rewrites that optimize your existing content — without starting from scratch.</p>
    <div class="hero-actions fade-up">
      <a class="btn btn-primary btn-lg" href="#">Get Started Free</a>
    </div>
    <div class="social-proof fade-up">
      <div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div>
      Trusted by <strong>&nbsp;10,000+&nbsp;</strong> Marketers &amp; Agencies
    </div>

    <div class="editor-wrap fade-up">
      <div class="browser-frame">
        <div class="browser-bar">
          <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
          <div class="browser-url">app.infin8content.com/editor — AI Content Workflows for Modern Teams</div>
        </div>
        <div class="editor-mock">
          <div class="em-main">
            <div class="em-toolbar">
              <span class="em-tool active">Rewrite</span>
              <span class="em-tool">Add Keywords</span>
              <span class="em-tool">Add Links</span>
              <span class="em-tool">Generate Images</span>
              <span class="em-tool">AI Assistant</span>
            </div>
            <div class="em-title">How AI Content Workflows Are Transforming Modern Marketing Teams</div>
            <div class="em-para">The shift to <span class="em-kw">AI-powered content workflows</span> is no longer optional for competitive marketing teams. Organizations that have adopted <span class="em-link">automated content pipelines</span> report publishing up to <strong style="color:var(--white)">10x more content</strong> with the same headcount — while simultaneously improving quality and organic rankings.</div>
            <div class="em-highlight">Rewriting with prompt: "Make this paragraph more persuasive and data-driven"...</div>
            <div class="em-para">According to <span class="em-link">recent SEO benchmarks</span>, teams using <span class="em-kw">content automation tools</span> see a <strong style="color:var(--white)">3x improvement</strong> in organic traffic within 60 days of adoption. The key differentiator isn't just speed — it's the ability to maintain consistent brand voice at scale without sacrificing <span class="em-kw">content quality</span>.</div>
          </div>
          <div class="em-sidebar">
            <div class="em-sidebar-section">
              <h5>SEO Score</h5>
              <div class="em-score">
                <div class="em-score-ring"><span>92</span></div>
                <div class="em-score-info"><strong>Excellent</strong>Optimized for ranking</div>
              </div>
            </div>
            <div class="em-sidebar-section">
              <h5>Suggestions</h5>
              <div class="em-suggestion green"><span class="s-dot"></span> 3 keywords added successfully</div>
              <div class="em-suggestion amber"><span class="s-dot"></span> Add 2 more internal links</div>
              <div class="em-suggestion blue"><span class="s-dot"></span> Image alt text optimized</div>
            </div>
            <div class="em-sidebar-section">
              <h5>AI Assistant</h5>
              <div class="em-ai-chat">
                <div class="em-chat-msg">💬 "Make this section more persuasive and include a CTA"</div>
                <div class="em-chat-input">Type a prompt for this section…</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURE TABS -->
<section class="section">
  <div class="container">
    <div class="feat-tabs-wrap">
      <div class="feat-tabs-nav">
        <button class="ftab active" data-ftab="tab-rewrite">Content Rewriting</button>
        <button class="ftab" data-ftab="tab-keywords">Adding Keywords</button>
        <button class="ftab" data-ftab="tab-links">Adding Links</button>
        <button class="ftab" data-ftab="tab-images">Generating Images</button>
        <button class="ftab" data-ftab="tab-assistant">AI SEO Assistant</button>
      </div>

      <div class="ftab-panel active" id="tab-rewrite">
        <div>
          <div class="feature-row-tag">✍️ &nbsp;Rewrite</div>
          <h3>Content Rewriting</h3>
          <p>Rewrite any section of your article with custom prompts. Change specific paragraphs or entire pieces to align perfectly with your brand voice and target audience.</p>
          <ul class="feature-list">
            <li>Rewrite with your own custom prompts</li>
            <li>Change specific sections or entire paragraphs</li>
            <li>Align tone with your brand voice and target audience</li>
          </ul>
        </div>
        <div class="feat-img">
          <div class="feat-img-inner"><div class="feat-img-icon">✍️</div><div class="feat-img-label">Content Rewriting Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div>
          <div class="glow"></div>
        </div>
      </div>

      <div class="ftab-panel" id="tab-keywords">
        <div>
          <div class="feature-row-tag">🔍 &nbsp;Optimization</div>
          <h3>Adding Keywords</h3>
          <p>Sprinkle your target keywords precisely where they matter most. Our AI places them contextually — no keyword stuffing, no manual placement.</p>
          <ul class="feature-list">
            <li>Sprinkle SEO keywords in dedicated sections</li>
            <li>Further optimize by including all target keywords</li>
            <li>Seamless, contextual automatic keyword placement</li>
          </ul>
        </div>
        <div class="feat-img">
          <div class="feat-img-inner"><div class="feat-img-icon">🔍</div><div class="feat-img-label">Keyword Optimization Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div>
          <div class="glow"></div>
        </div>
      </div>

      <div class="ftab-panel" id="tab-links">
        <div>
          <div class="feature-row-tag">🔗 &nbsp;Linking</div>
          <h3>Adding Links</h3>
          <p>Browse suggested link opportunities and add internal or external links with one click. Apply them to specific sections or across the entire article.</p>
          <ul class="feature-list">
            <li>Add relevant internal and external links</li>
            <li>Browse suggested link opportunities and select your picks</li>
            <li>Apply links to the whole article or specific sections</li>
          </ul>
        </div>
        <div class="feat-img">
          <div class="feat-img-inner"><div class="feat-img-icon">🔗</div><div class="feat-img-label">Link Building Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div>
          <div class="glow"></div>
        </div>
      </div>

      <div class="ftab-panel" id="tab-images">
        <div>
          <div class="feature-row-tag">🖼️ &nbsp;Visuals</div>
          <h3>Generating Images</h3>
          <p>Add new images or regenerate existing ones with custom AI prompts. Image generation takes full article context into account for maximum relevance.</p>
          <ul class="feature-list">
            <li>Add new images or regenerate with custom AI prompts</li>
            <li>Context-aware generation per article section</li>
            <li>Unlimited generations and regenerations</li>
          </ul>
        </div>
        <div class="feat-img">
          <div class="feat-img-inner"><div class="feat-img-icon">🖼️</div><div class="feat-img-label">Image Generation Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div>
          <div class="glow"></div>
        </div>
      </div>

      <div class="ftab-panel" id="tab-assistant">
        <div>
          <div class="feature-row-tag">🤖 &nbsp;AI Assistant</div>
          <h3>AI SEO Assistant</h3>
          <p>Chat back and forth with your content. See changes applied live and approve or reject them manually — all with brand context baked in.</p>
          <ul class="feature-list">
            <li>Chat back and forth with the content</li>
            <li>See changes happening live and approve manually</li>
            <li>Custom AI prompting with full brand context</li>
          </ul>
        </div>
        <div class="feat-img">
          <div class="feat-img-inner"><div class="feat-img-icon">🤖</div><div class="feat-img-label">AI Assistant Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div>
          <div class="glow"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="t-strip">
  <div class="container">
    <h2>Real Stories of Success with the SEO Editor</h2>
    <p class="ts-sub">Infin8Content is helping teams save time and money by leveraging AI to optimize content at scale.</p>
    <div class="t-grid">
      <div class="t-card">
        <p class="t-quote">"It comes down to how easy it is to create content, and the <strong>impressive rankings</strong> we see with it. The editor is a game-changer."</p>
        <div class="t-author"><div class="t-av">TS</div><div><div class="t-name">Timo S.</div><div class="t-role">Agency Owner</div></div></div>
      </div>
      <div class="t-card">
        <p class="t-quote">"The platform helps me quickly <strong>write draft articles from keywords</strong> and puts them on my blog automatically — then I just tweak as needed."</p>
        <div class="t-author"><div class="t-av">AB</div><div><div class="t-name">Andrew B.</div><div class="t-role">Content Marketer</div></div></div>
      </div>
      <div class="t-card">
        <p class="t-quote">"We've heavily <strong>reduced our reliance on external copywriters</strong>. It's been a game-changer for our agency and our clients love the results."</p>
        <div class="t-author"><div class="t-av">BE</div><div><div class="t-name">Brian E.</div><div class="t-role">Agency Founder</div></div></div>
      </div>
      <div class="t-card">
        <p class="t-quote">"This is the most complete solution I've found — and the best bang for your buck. <strong>It's now essential for 3 of my businesses.</strong> 10/10."</p>
        <div class="t-author"><div class="t-av">CJ</div><div><div class="t-name">Christian J.</div><div class="t-role">Serial Entrepreneur</div></div></div>
      </div>
      <div class="t-card">
        <p class="t-quote">"I've got a deep dive article with real-time research that <strong>saved me countless hours and hundreds of dollars</strong> vs. hiring a ghostwriter."</p>
        <div class="t-author"><div class="t-av">DC</div><div><div class="t-name">Damon C.</div><div class="t-role">Founder</div></div></div>
      </div>
      <div class="t-card">
        <p class="t-quote">"You guys are <strong>constantly improving the platform</strong> — great job! I absolutely love it. The SEO editor alone is worth the subscription."</p>
        <div class="t-author"><div class="t-av">EV</div><div><div class="t-name">Eric V.</div><div class="t-role">Content Director</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="final-cta">
  <div class="container">
    <h2>Scale more content.<br>Do less work.</h2>
    <p>Get started and see why agencies trust Infin8Content.</p>
    <a class="btn btn-primary btn-lg" href="#">Get Started Free</a>
    <div class="cta-perks">
      <span class="cta-perk">Cancel anytime</span>
      <span class="cta-perk">Articles in 30 secs</span>
      <span class="cta-perk">Plagiarism free</span>
    </div>
    <div class="cta-social">
      <div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div>
      <span style="font-size:13.5px;color:var(--muted);">Trusted by <strong style="color:var(--white)">10,000+</strong> marketers</span>
    </div>
    <div class="cta-mock-img"><div class="cta-mock-inner"><div class="cm-icon">🖥️</div><div class="cm-label">Platform preview — replace with screenshot</div></div></div>
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
      <div class="footer-col"><h4>AI Writing</h4><a href="/ai-content-writer">AI Content Writer</a><a href="/ai-seo-editor">AI SEO Editor</a><a href="#">News Writer</a><a href="#">Video to Blog</a></div>
      <div class="footer-col"><h4>Automation</h4><a href="/ai-seo-agent">AI SEO Agent</a><a href="/autopublish">AutoPublish</a><a href="#">SEO Reports</a><a href="/llm-tracker">LLM Tracker</a></div>
      <div class="footer-col"><h4>Resources</h4><a href="#">Pricing</a><a href="#">Blog</a><a href="#">Help Docs</a><a href="#">Case Studies</a></div>
      <div class="footer-col"><h4>Integrations</h4><a href="#">WordPress</a><a href="#">Shopify</a><a href="#">Ghost</a><a href="#">Webflow</a><a href="#">Zapier</a></div>
      <div class="footer-col"><h4>Solutions</h4><a href="#">SaaS</a><a href="#">Agencies</a><a href="#">E-Commerce</a><a href="#">Enterprise</a></div>
    </div>
    <div class="footer-bottom">
      <small>© <span class="js-year"></span> Infin8Content. All rights reserved.</small>
      <div class="footer-legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">contact@infin8content.com</a></div>
    </div>
  </div>
</footer>`;

export default function AISEOEditorPage() {
  return <MarketingPageBody css={css} html={html} />;
}
