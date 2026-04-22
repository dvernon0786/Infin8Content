import { Metadata } from 'next';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

export const metadata: Metadata = {
  title: 'LLM Brand Visibility Tracker — Monitor AI Mentions | Infin8Content',
  description: 'Track and monitor your brand visibility across LLM models with Infin8Content LLM Tracker.',
};

const CSS = `
/* ===================== RESET & TOKENS ===================== */
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
.brand { display:inline-flex; align-items:center; flex-shrink:0; line-height:0; }
.brand img { height:32px; width:auto; display:block; }
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
/* LLM tracker dashboard mockup */
    .llm-wrap { max-width: 940px; margin: 52px auto 0; position: relative; }
    .llm-wrap::after { content:''; position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); width:70%; height:80px; background:radial-gradient(ellipse,rgba(79,110,247,.22) 0%,transparent 70%); filter:blur(20px); pointer-events:none; }
    .llm-mock { display: grid; grid-template-columns: 200px 1fr; min-height: 420px; }
    .llm-sidebar { background: rgba(255,255,255,.015); border-right: 1px solid var(--border); padding: 18px 14px; }
    .llm-sidebar h5 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); margin-bottom: 10px; }
    .llm-brand-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; font-size: 12.5px; color: var(--muted); margin-bottom: 4px; cursor: default; }
    .llm-brand-item.active { background: var(--accent-lite); color: var(--white); }
    .llm-brand-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .llm-main { padding: 22px 26px; }
    .llm-platforms { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .llm-plat { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--muted); transition: all .2s; }
    .llm-plat.active { background: var(--accent-lite); border-color: var(--accent-border); color: #a5b4fc; }
    .llm-plat .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
    .llm-metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px; }
    .llm-metric { background: rgba(255,255,255,.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
    .llm-metric .lm-val { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--white); }
    .llm-metric .lm-label { font-size: 10.5px; color: var(--muted); margin-top: 3px; }
    .llm-metric .lm-trend { font-size: 10.5px; color: var(--green); margin-top: 2px; }
    .llm-mentions { display: flex; flex-direction: column; gap: 8px; }
    .llm-mention { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,.02); border: 1px solid var(--border); font-size: 12px; }
    .llm-mention .lm-plat-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .llm-mention .lm-body p { font-size: 12px; color: var(--muted); line-height: 1.4; }
    .llm-mention .lm-body p strong { color: var(--white); }
    .llm-mention .lm-sent { margin-left: auto; flex-shrink: 0; }
    .sent-pos { color: var(--green); font-size: 11px; font-weight: 600; }
    .sent-neu { color: var(--muted); font-size: 11px; font-weight: 600; }

    /* Platform logos row */
    .platforms-row { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 36px; }
    .plat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 20px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--muted); transition: all .2s; }
    .plat-card:hover { border-color: var(--accent-border); color: var(--white); background: var(--accent-lite); }
    .plat-icon { font-size: 20px; }

    /* Feature rows with right-side content */
    .llm-features { padding: 90px 0; }

    /* Pricing comparison */
    .pricing-compare { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-top: 40px; }
    .pc-head { display: grid; grid-template-columns: 1fr 1fr 1fr; }
    .pc-col { padding: 20px 24px; border-right: 1px solid var(--border); }
    .pc-col:last-child { border-right: none; }
    .pc-col.highlight { background: var(--accent-lite); border-color: var(--accent-border); }
    .pc-col h4 { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 4px; }
    .pc-col .pc-price { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--accent); }
    .pc-col .pc-sub { font-size: 12px; color: var(--muted); }
    .pc-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 1px solid var(--border); }
    .pc-cell { padding: 12px 24px; border-right: 1px solid var(--border); font-size: 13px; color: var(--muted); }
    .pc-cell:last-child { border-right: none; }
    .pc-cell.highlight { background: rgba(79,110,247,.04); }
    .pc-cell .check { color: var(--green); font-weight: 700; margin-right: 6px; }
    .pc-cell .cross { color: var(--muted2); margin-right: 6px; }

    @media(max-width:860px){ .llm-mock{grid-template-columns:1fr;} .llm-sidebar{display:none;} .llm-metrics{grid-template-columns:1fr 1fr;} .pc-head,.pc-row{grid-template-columns:1fr;} .pc-col,.pc-cell{border-right:none; border-bottom:1px solid var(--border);} }
    @media(max-width:600px){ .llm-metrics{grid-template-columns:1fr 1fr;} }
`;

const HTML = `
<div class="promo-bar">✨&nbsp; New Year Offer: <strong style="color:#a5b4fc;margin:0 6px;">40% Off</strong> on Yearly Plans &nbsp;<span class="time-unit js-ph">08</span>hrs <span class="time-unit js-pm">34</span>min <span class="time-unit js-ps">12</span>sec<a class="deal-link" href="#">Get Deal</a></div>

<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/"><img src="/infin8content_logo.png" alt="Infin8Content"></a>
    <nav class="main-nav" id="main-nav">
      <div class="nav-item"><span class="nav-link">Features <span class="chevron">▾</span></span><div class="dropdown"><div class="dropdown-label">AI Writing</div><a class="dropdown-link" href="/ai-content-writer">AI Content Writer</a><a class="dropdown-link" href="/ai-seo-editor">AI SEO Editor</a><a class="dropdown-link" href="#">News Writer</a><hr><div class="dropdown-label">Automation</div><a class="dropdown-link" href="/ai-seo-agent">AI SEO Agent</a><a class="dropdown-link" href="/autopublish">AutoPublish</a><a class="dropdown-link" href="/llm-tracker">LLM Tracker</a></div></div>
      <div class="nav-item"><span class="nav-link">Solutions <span class="chevron">▾</span></span><div class="dropdown"><a class="dropdown-link" href="#"><strong>SaaS</strong><small>Scale organic traffic</small></a><a class="dropdown-link" href="#"><strong>Agencies</strong><small>Manage clients at scale</small></a></div></div>
      <a class="nav-link" href="#">Pricing</a>
      <div class="nav-item"><span class="nav-link">Resources <span class="chevron">▾</span></span><div class="dropdown"><a class="dropdown-link" href="#">Case Studies</a><a class="dropdown-link" href="#">Help Docs</a><a class="dropdown-link" href="#">Blog</a></div></div>
    </nav>
    <div class="header-cta"><a class="btn-link" href="#">Login</a><a class="btn btn-primary" href="#">Start Tracking</a></div>
    <button class="nav-toggle" id="nav-toggle">☰</button>
  </div>
</header>

<main>

<section class="hero">
  <div class="container">
    <div class="hero-eyebrow fade-up">🔭 &nbsp;LLM Brand Visibility Tracker</div>
    <h1 class="fade-up">Track Your Brand<br>in <span class="high">AI Search</span></h1>
    <p class="sub fade-up">See how ChatGPT, Perplexity, Gemini, Claude, and Google AI Overviews talk about your brand. Monitor mentions, citations, and share of voice — all in one dashboard, one price.</p>
    <div class="hero-actions fade-up">
      <a class="btn btn-primary btn-lg" href="#">Start Tracking Free</a>
    </div>
    <div class="social-proof fade-up">
      <div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div>
      Trusted by <strong>&nbsp;10,000+&nbsp;</strong> Marketers & Agencies
    </div>

    <!-- LLM dashboard mockup -->
    <div class="llm-wrap fade-up">
      <div class="browser-frame">
        <div class="browser-bar">
          <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
          <div class="browser-url">app.infin8content.com/llm-tracker — Brand Visibility Dashboard</div>
        </div>
        <div class="llm-mock">
          <div class="llm-sidebar">
            <h5>Tracking</h5>
            <div class="llm-brand-item active"><div class="llm-brand-dot" style="background:var(--accent)"></div> Infin8Content</div>
            <div class="llm-brand-item"><div class="llm-brand-dot" style="background:#94a3b8"></div> Competitor A</div>
            <div class="llm-brand-item"><div class="llm-brand-dot" style="background:#64748b"></div> Competitor B</div>
            <h5 style="margin-top:16px;">Prompts (24)</h5>
            <div class="llm-brand-item">best content tools</div>
            <div class="llm-brand-item">ai content writer</div>
            <div class="llm-brand-item">content automation</div>
          </div>
          <div class="llm-main">
            <div class="llm-platforms">
              <div class="llm-plat active"><span class="lp-dot"></span> ChatGPT</div>
              <div class="llm-plat active"><span class="lp-dot"></span> Perplexity</div>
              <div class="llm-plat active"><span class="lp-dot"></span> Gemini</div>
              <div class="llm-plat active"><span class="lp-dot"></span> Claude</div>
              <div class="llm-plat active"><span class="lp-dot"></span> Grok</div>
              <div class="llm-plat active"><span class="lp-dot"></span> AI Overviews</div>
            </div>
            <div class="llm-metrics">
              <div class="llm-metric"><div class="lm-val">68%</div><div class="lm-label">Share of Voice</div><div class="lm-trend">↑ +12% this week</div></div>
              <div class="llm-metric"><div class="lm-val">247</div><div class="lm-label">Total Mentions</div><div class="lm-trend">↑ +34 this week</div></div>
              <div class="llm-metric"><div class="lm-val">89%</div><div class="lm-label">Positive Sentiment</div><div class="lm-trend">↑ +5% this week</div></div>
              <div class="llm-metric"><div class="lm-val">142</div><div class="lm-label">Citations</div><div class="lm-trend">↑ +18 this week</div></div>
            </div>
            <div class="llm-mentions">
              <div class="llm-mention"><div class="lm-plat-icon">🤖</div><div class="lm-body"><p><strong>ChatGPT:</strong> "For AI-powered content workflows, <strong>Infin8Content</strong> is one of the leading solutions — offering automated publishing, SEO optimization…"</p></div><div class="lm-sent"><span class="sent-pos">Positive</span></div></div>
              <div class="llm-mention"><div class="lm-plat-icon">🔍</div><div class="lm-body"><p><strong>Perplexity:</strong> "According to <strong>infin8content.com</strong>, agencies can reduce their content production time by up to 80%…"</p></div><div class="lm-sent"><span class="sent-pos">Cited</span></div></div>
              <div class="llm-mention"><div class="lm-plat-icon">💎</div><div class="lm-body"><p><strong>Gemini:</strong> "Several tools handle this well — <strong>Infin8Content</strong> is particularly strong for agencies managing multiple client sites…"</p></div><div class="lm-sent"><span class="sent-neu">Neutral</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SETUP STEPS -->
<section class="section section-alt">
  <div class="container">
    <p class="section-label" style="justify-content:center;">🚀 &nbsp;Getting Started</p>
    <h2 class="section-title" style="text-align:center;margin-bottom:12px;">Set Up AI Visibility Tracking in 3 Simple Steps</h2>
    <p class="section-sub" style="text-align:center;max-width:480px;margin:0 auto 44px;">From zero to complete AI search visibility in minutes.</p>
    <div class="steps-grid">
      <div class="step-card"><div class="step-num">1</div><div class="step-icon">🏷️</div><h4>Add Your Brands</h4><p>Enter your brand name and the competitors you want to track. Add the topics and queries that matter most to your business and customers.</p></div>
      <div class="step-card"><div class="step-num">2</div><div class="step-icon">🕵️</div><h4>We Query the AIs</h4><p>Our crawler asks real questions to ChatGPT, Perplexity, Gemini, Claude, Grok, and Google AI Overviews — exactly like your customers do every day.</p></div>
      <div class="step-card"><div class="step-num">3</div><div class="step-icon">📊</div><h4>See Your Visibility</h4><p>Get detailed reports on mentions, citations, sentiment, and share of voice. Track changes over time and spot opportunities to improve your AI presence.</p></div>
    </div>
  </div>
</section>

<!-- ALL PLATFORMS, ONE PRICE callout -->
<section class="section">
  <div class="container">
    <p class="section-label" style="justify-content:center;">💰 &nbsp;All AI Platforms. One Price.</p>
    <h2 class="section-title" style="text-align:center;margin-bottom:14px;">All AI Platforms. One Price.</h2>
    <p class="section-sub" style="text-align:center;max-width:580px;margin:0 auto 16px;">Other tools charge $99–199/month for each AI platform separately. ChatGPT is one add-on. Perplexity is another. With Infin8Content, you get every platform included — no nickel-and-diming.</p>
    <div class="platforms-row">
      <div class="plat-card"><span class="plat-icon">🤖</span> ChatGPT</div>
      <div class="plat-card"><span class="plat-icon">🔍</span> Perplexity</div>
      <div class="plat-card"><span class="plat-icon">🌐</span> Google AI Overviews</div>
      <div class="plat-card"><span class="plat-icon">💎</span> Gemini</div>
      <div class="plat-card"><span class="plat-icon">🤝</span> Claude</div>
      <div class="plat-card"><span class="plat-icon">⚡</span> Grok</div>
    </div>

    <!-- Pricing comparison table -->
    <div class="pricing-compare" style="margin-top:48px;">
      <div class="pc-head">
        <div class="pc-col"><h4>Feature</h4><div class="pc-sub">What you get</div></div>
        <div class="pc-col"><h4>Other Tools</h4><div class="pc-price" style="font-size:16px;color:var(--muted)">$99–199</div><div class="pc-sub">per platform/mo</div></div>
        <div class="pc-col highlight"><h4>Infin8Content</h4><div class="pc-price">Included</div><div class="pc-sub">all platforms, one plan</div></div>
      </div>
      <div class="pc-row"><div class="pc-cell">ChatGPT tracking</div><div class="pc-cell"><span class="check">✓</span> Add-on — $99/mo</div><div class="pc-cell highlight"><span class="check">✓</span> Included</div></div>
      <div class="pc-row"><div class="pc-cell">Perplexity tracking</div><div class="pc-cell"><span class="cross">✗</span> Separate add-on</div><div class="pc-cell highlight"><span class="check">✓</span> Included</div></div>
      <div class="pc-row"><div class="pc-cell">Gemini + Grok + Claude</div><div class="pc-cell"><span class="cross">✗</span> Not available</div><div class="pc-cell highlight"><span class="check">✓</span> Included</div></div>
      <div class="pc-row"><div class="pc-cell">White label reports</div><div class="pc-cell"><span class="cross">✗</span> Not included</div><div class="pc-cell highlight"><span class="check">✓</span> Included</div></div>
      <div class="pc-row"><div class="pc-cell">Sentiment analysis</div><div class="pc-cell"><span class="cross">✗</span> Premium only</div><div class="pc-cell highlight"><span class="check">✓</span> Included</div></div>
    </div>
  </div>
</section>

<!-- FEATURE ROWS -->
<section class="llm-features section-alt" style="padding:70px 0;">
  <div class="container">
    <div class="feature-row" style="padding-top:0;">
      <div>
        <div class="feature-row-tag">📊 &nbsp;Share of Voice</div>
        <h2 class="section-title">Track Share of Voice Across AI Search</h2>
        <p style="color:var(--muted);font-size:15px;line-height:1.65;margin-bottom:18px;">Know exactly how often AI recommends your brand versus competitors. SOV tells you who's winning in AI search — and by how much.</p>
        <ul class="feature-list">
          <li>Percentage of AI recommendations you win</li>
          <li>Head-to-head competitor comparison</li>
          <li>Historical trends to track your progress over time</li>
        </ul>
      </div>
      <div class="feat-img"><div class="feat-img-inner"><div class="feat-img-icon">📊</div><div class="feat-img-label">Share of Voice Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div><div class="glow"></div></div>
    </div>
    <div class="feature-row rev">
      <div>
        <div class="feature-row-tag">🔔 &nbsp;Mention Monitoring</div>
        <h2 class="section-title">Monitor Every Mention and Citation</h2>
        <p style="color:var(--muted);font-size:15px;line-height:1.65;margin-bottom:18px;">See exactly when and where AI mentions your brand — from direct recommendations to passing references. Know which sources AI cites when talking about you.</p>
        <ul class="feature-list">
          <li>Real-time mention tracking across all platforms</li>
          <li>Source citations and backlink discovery</li>
          <li>Full context of every mention captured</li>
        </ul>
      </div>
      <div class="feat-img"><div class="feat-img-inner"><div class="feat-img-icon">🔔</div><div class="feat-img-label">Mentions Dashboard Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div><div class="glow"></div></div>
    </div>
    <div class="feature-row" style="padding-bottom:0;border-bottom:none;">
      <div>
        <div class="feature-row-tag">😊 &nbsp;Sentiment Analysis</div>
        <h2 class="section-title">Understand AI Sentiment About Your Brand</h2>
        <p style="color:var(--muted);font-size:15px;line-height:1.65;margin-bottom:18px;">Not all mentions are equal. Our sentiment analysis shows whether AI talks about your brand positively, negatively, or neutrally — and alerts you before issues spread.</p>
        <ul class="feature-list">
          <li>Positive, negative, neutral classification</li>
          <li>Early warning system for reputation risks</li>
          <li>Sentiment trend tracking over time</li>
        </ul>
      </div>
      <div class="feat-img"><div class="feat-img-inner"><div class="feat-img-icon">😊</div><div class="feat-img-label">Sentiment Analysis Preview<br><span style="font-size:11px;color:var(--muted2)">Replace with screenshot</span></div></div><div class="glow"></div></div>
    </div>
  </div>
</section>

<!-- FEATURES GRID -->
<section class="section">
  <div class="container">
    <p class="section-label" style="justify-content:center;">✦ &nbsp;Everything Included</p>
    <h2 class="section-title" style="text-align:center;margin-bottom:36px;">Everything You Need for AI Search Visibility</h2>
    <div class="feat-cards">
      <div class="feat-card"><div class="fc-icon">🌐</div><h4>Multi-Platform Coverage</h4><p>Track ChatGPT, Perplexity, Gemini, Claude, Grok, and Google AI Overviews — all from one dashboard.</p></div>
      <div class="feat-card"><div class="fc-icon">🏆</div><h4>Competitor Benchmarking</h4><p>Track competitor mentions, SOV, and sentiment alongside your own to see exactly who's winning AI recommendations.</p></div>
      <div class="feat-card"><div class="fc-icon">📈</div><h4>Historical Tracking</h4><p>Track AI visibility over time. See trends, spot changes, and measure the impact of your content strategy on AI citations.</p></div>
      <div class="feat-card"><div class="fc-icon">🔔</div><h4>Alerts & Notifications</h4><p>Get notified when AI mentions you or your competitors. Never miss an important change in your AI visibility landscape.</p></div>
      <div class="feat-card"><div class="fc-icon">🏷️</div><h4>White Label Reports</h4><p>Agencies can white label AI visibility reports with custom branding, logos, and domains for client presentations.</p></div>
      <div class="feat-card"><div class="fc-icon">🔌</div><h4>API Access</h4><p>Integrate AI visibility data into your own tools and workflows with our API. Build custom dashboards and automations.</p></div>
      <div class="feat-card"><div class="fc-icon">📋</div><h4>Prompt Tracking</h4><p>Define the exact queries your customers ask AI — and track how often your brand appears in those specific conversations.</p></div>
      <div class="feat-card"><div class="fc-icon">😊</div><h4>Sentiment Analysis</h4><p>Understand the tone behind every AI mention — positive, negative, or neutral — and monitor changes in brand perception over time.</p></div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section section-alt">
  <div class="container">
    <p class="section-label" style="justify-content:center;">❓ &nbsp;FAQ</p>
    <h2 class="section-title" style="text-align:center;">AI Visibility Tracking FAQ</h2>
    <div class="faq-list">
      <div class="faq-item"><div class="faq-q">What AI platforms do you track?<div class="faq-icon">+</div></div><div class="faq-a">We track all major AI search platforms including ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude, and Grok. All platforms are included in one price — no per-platform fees like other tools charge.</div></div>
      <div class="faq-item"><div class="faq-q">What metrics does the AI visibility tracker measure?<div class="faq-icon">+</div></div><div class="faq-a">We track share of voice (percentage of AI responses mentioning your brand), direct mentions, citations (when AI links to your content), impressions weighted by search volume, and sentiment analysis. You can also see the actual AI responses that reference your brand.</div></div>
      <div class="faq-item"><div class="faq-q">Is AI visibility tracking included in my plan?<div class="faq-icon">+</div></div><div class="faq-a">AI visibility tracking is included in all Infin8Content plans. Unlike competitors who charge $99–199/month for each AI platform separately, we include all platforms in your subscription at no extra cost.</div></div>
      <div class="faq-item"><div class="faq-q">How is this different from Ahrefs Brand Radar or other tools?<div class="faq-icon">+</div></div><div class="faq-a">Most AI visibility tools charge per platform — Ahrefs Brand Radar charges separately for each AI index. Infin8Content includes all AI platforms in one dashboard, one price. Complete visibility without fragmented costs or surprise fees.</div></div>
      <div class="faq-item"><div class="faq-q">Can I white label the AI visibility reports?<div class="faq-icon">+</div></div><div class="faq-a">Yes. Agencies can white label AI visibility reports with their own logo, brand colors, and custom domain — perfect for sharing branded AI visibility dashboards with clients during monthly reporting.</div></div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="final-cta">
  <div class="container">
    <h2>Know what AI says<br>about your brand.</h2>
    <p>Get started and see why agencies trust Infin8Content.</p>
    <a class="btn btn-primary btn-lg" href="#">Start Tracking Free</a>
    <div class="cta-perks"><span class="cta-perk">All platforms included</span><span class="cta-perk">Cancel anytime</span><span class="cta-perk">White label reports</span></div>
    <div class="cta-social"><div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div><span style="font-size:13.5px;color:var(--muted);">Trusted by <strong style="color:var(--white)">10,000+</strong> marketers</span></div>
    <div class="cta-mock-img"><div class="cta-mock-inner"><div class="cm-icon">🔭</div><div class="cm-label">LLM tracker dashboard — replace with screenshot</div></div></div>
  </div>
</section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand"><a class="brand" href="/"><img src="/infin8content_logo.png" alt="Infin8Content"></a><p>AI content workflows for modern teams and agencies.</p></div>
      <div class="footer-col"><h4>AI Writing</h4><a href="/ai-content-writer">AI Content Writer</a><a href="/ai-seo-editor">AI SEO Editor</a><a href="#">News Writer</a><a href="#">Video to Blog</a></div>
      <div class="footer-col"><h4>Automation</h4><a href="/ai-seo-agent">AI SEO Agent</a><a href="/autopublish">AutoPublish</a><a href="#">SEO Reports</a><a href="/llm-tracker">LLM Tracker</a></div>
      <div class="footer-col"><h4>Resources</h4><a href="#">Pricing</a><a href="#">Blog</a><a href="#">Help Docs</a><a href="#">Case Studies</a></div>
      <div class="footer-col"><h4>Integrations</h4><a href="#">WordPress</a><a href="#">Shopify</a><a href="#">Ghost</a><a href="#">Webflow</a><a href="#">Zapier</a></div>
      <div class="footer-col"><h4>Solutions</h4><a href="#">SaaS</a><a href="#">Agencies</a><a href="#">E-Commerce</a><a href="#">Enterprise</a></div>
    </div>
    <div class="footer-bottom"><small>© <span class="js-year"></span> Infin8Content. All rights reserved.</small><div class="footer-legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">contact@infin8content.com</a></div></div>
  </div>
</footer>
`;

export default function LlmTrackerPage() {
  return <MarketingPageBody html={HTML} css={CSS} />;
}
