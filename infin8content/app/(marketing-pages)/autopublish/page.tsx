import type { Metadata } from 'next';
import MarketingPageBody from '@/components/marketing/MarketingPageBody';

export const metadata: Metadata = {
  title: 'AutoPublish — Automated AI Content Writing & Publishing | Infin8Content',
};

const css = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
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
.promo-bar { background: linear-gradient(90deg,#1a1060,#0f1340 50%,#1a1060); border-bottom: 1px solid var(--accent-border); text-align: center; padding: 10px 20px; font-size: 13px; font-family: var(--font-display); font-weight: 500; color: var(--text); position: relative; z-index: 50; }
.time-unit { background: var(--accent-lite); border: 1px solid var(--accent-border); border-radius: 4px; padding: 2px 6px; font-weight: 700; color: #a5b4fc; font-variant-numeric: tabular-nums; min-width: 28px; display: inline-block; text-align: center; }
.deal-link { background: var(--accent); color: #fff; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600; margin-left: 10px; }
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
.section { padding: 90px 0; }
.section-alt { background: linear-gradient(180deg, transparent, var(--surface2) 20%, var(--surface2) 80%, transparent); }
.section-label { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); margin-bottom: 14px; }
.section-title { font-family: var(--font-display); font-size: clamp(24px,3.5vw,40px); font-weight: 700; letter-spacing: -.6px; color: var(--white); margin-bottom: 14px; line-height: 1.15; }
.section-sub { font-size: 16px; color: var(--muted); line-height: 1.65; }
.browser-frame { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04); }
.browser-bar { background: var(--surface2); padding: 10px 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background:#ff5f57; } .dot-y { background:#febc2e; } .dot-g { background:#28c840; }
.browser-url { flex: 1; background: rgba(255,255,255,.04); border-radius: 6px; height: 24px; margin: 0 12px; display: flex; align-items: center; padding: 0 10px; font-size: 11px; color: var(--muted2); }
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
.steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.step-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 22px; transition: all .2s; }
.step-card:hover { border-color: var(--accent-border); transform: translateY(-3px); }
.step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-lite); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--accent); margin-bottom: 16px; }
.step-icon { font-size: 26px; margin-bottom: 12px; }
.step-card h4 { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 8px; line-height: 1.3; }
.step-card p { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
.faq-list { max-width: 760px; margin: 40px auto 0; }
.faq-item { border-bottom: 1px solid var(--border); }
.faq-q { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; cursor: pointer; font-size: 15px; font-weight: 500; color: var(--text); transition: color .2s; gap: 20px; }
.faq-q:hover { color: var(--white); }
.faq-icon { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; transition: all .3s; color: var(--muted); }
.faq-item.open .faq-icon { background: var(--accent-lite); color: var(--accent); transform: rotate(45deg); }
.faq-a { display: none; padding: 0 0 20px; font-size: 14.5px; color: var(--muted); line-height: 1.7; }
.faq-item.open .faq-a { display: block; }
.t-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 40px; }
.t-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; display: flex; flex-direction: column; gap: 14px; transition: border-color .2s; }
.t-card:hover { border-color: var(--accent-border); }
.t-quote { font-size: 14px; color: var(--text); line-height: 1.65; flex: 1; }
.t-quote strong { color: var(--white); }
.t-author { display: flex; align-items: center; gap: 10px; }
.t-av { width: 36px; height: 36px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: var(--accent); flex-shrink: 0; }
.t-name { font-weight: 600; font-size: 13px; color: var(--white); }
.t-role { font-size: 11.5px; color: var(--muted); }
.feat-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.feat-card { background: var(--surface); padding: 26px 22px; transition: background .2s; }
.feat-card:hover { background: var(--surface2); }
.feat-card .fc-icon { font-size: 22px; margin-bottom: 12px; }
.feat-card h4 { font-family: var(--font-display); font-size: 14px; font-weight: 600; color: var(--white); margin-bottom: 7px; }
.feat-card p { font-size: 13px; color: var(--muted); line-height: 1.55; }
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
@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.fade-up { opacity:0; animation: fadeUp .6s ease forwards; }
.fade-up:nth-child(1){animation-delay:.05s} .fade-up:nth-child(2){animation-delay:.15s} .fade-up:nth-child(3){animation-delay:.25s} .fade-up:nth-child(4){animation-delay:.35s} .fade-up:nth-child(5){animation-delay:.45s}
.video-wrap { max-width: 860px; margin: 0 auto; aspect-ratio: 16/9; background: #0c0f1a; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 30px 80px rgba(0,0,0,.5); }
.play-btn { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.1); border: 2px solid rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 26px; cursor: pointer; transition: all .2s; backdrop-filter: blur(6px); }
.play-btn:hover { background: rgba(79,110,247,.4); transform: scale(1.06); }
@media(max-width:1024px){ .footer-top{grid-template-columns:1fr 1fr 1fr;} .footer-brand{grid-column:1/-1;} .feat-cards{grid-template-columns:repeat(2,1fr);} .t-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:860px){ .main-nav{display:none;} .nav-toggle{display:flex;} .feature-row{grid-template-columns:1fr; gap:36px;} .feature-row.rev{direction:ltr;} .before-after{grid-template-columns:1fr;} .steps-grid{grid-template-columns:1fr;} .footer-top{grid-template-columns:1fr 1fr;} .footer-brand{grid-column:1/-1;} .t-grid{grid-template-columns:1fr;} }
@media(max-width:600px){ .hero h1{font-size:28px;} .feat-cards{grid-template-columns:1fr;} }
.main-nav.open { display:flex!important; flex-direction:column; position:fixed; top:62px; left:0; right:0; background:rgba(8,9,13,.97); backdrop-filter:blur(12px); padding:20px; border-bottom:1px solid var(--border); gap:4px; z-index:39; }
.main-nav.open .dropdown{display:none!important;}
.ap-wrap { max-width: 920px; margin: 52px auto 0; position: relative; }
    .ap-wrap::after { content:''; position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); width:70%; height:80px; background:radial-gradient(ellipse,rgba(79,110,247,.22) 0%,transparent 70%); filter:blur(20px); pointer-events:none; }
    .ap-mock { padding: 28px; }
    .ap-pipeline { display: flex; align-items: center; gap: 0; margin-bottom: 28px; }
    .ap-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .ap-step-icon { width: 56px; height: 56px; border-radius: 14px; background: var(--accent-lite); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; font-size: 22px; position: relative; z-index: 1; }
    .ap-step-icon.active { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 20px rgba(79,110,247,.4); }
    .ap-step-icon.done { background: var(--green-lite); border-color: rgba(34,197,94,.3); }
    .ap-step h5 { font-family: var(--font-display); font-size: 11.5px; font-weight: 600; color: var(--white); text-align: center; }
    .ap-step p { font-size: 10.5px; color: var(--muted); text-align: center; }
    .ap-connector { flex-shrink: 0; width: 40px; height: 1px; background: linear-gradient(90deg,var(--accent-border),rgba(79,110,247,.1)); margin-bottom: 28px; }
    .ap-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .ap-article-card { background: rgba(255,255,255,.03); border: 1px solid var(--border); border-radius: 9px; padding: 12px; }
    .ap-article-card .aac-img { width: 100%; height: 60px; background: linear-gradient(135deg,var(--surface2),#0d1228); border-radius: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; opacity: .5; }
    .ap-article-card .aac-title { font-size: 11.5px; font-weight: 600; color: var(--white); margin-bottom: 5px; line-height: 1.3; font-family: var(--font-display); }
    .ap-article-card .aac-meta { display: flex; align-items: center; gap: 6px; }
    .ap-article-card .aac-badge { font-size: 10px; border-radius: 4px; padding: 2px 7px; font-weight: 600; }
    .aac-badge.pub { background: var(--green-lite); color: var(--green); border: 1px solid rgba(34,197,94,.2); }
    .aac-badge.sched { background: var(--accent-lite); color: #a5b4fc; border: 1px solid var(--accent-border); }
    .aac-badge.gen { background: rgba(251,191,36,.1); color: #fbbf24; border: 1px solid rgba(251,191,36,.2); }
    .ap-article-card .aac-time { font-size: 10px; color: var(--muted2); margin-left: auto; }
    .ecosystem-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
    .eco-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 24px; transition: all .2s; }
    .eco-card:hover { border-color: var(--accent-border); transform: translateY(-3px); }
    .eco-card .eco-icon { font-size: 28px; margin-bottom: 14px; }
    .eco-card h3 { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--white); margin-bottom: 10px; }
    .eco-card p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 14px; }
    .eco-card ul li { font-size: 13.5px; color: var(--muted); padding: 4px 0; display: flex; gap: 8px; }
    .eco-card ul li::before { content:'→'; color: var(--accent); flex-shrink: 0; }
    .integrations-strip { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 36px; }
    .int-badge { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; color: var(--muted); transition: all .2s; display: flex; align-items: center; gap: 7px; }
    .int-badge:hover { color: var(--white); border-color: var(--accent-border); background: var(--accent-lite); }
    @media(max-width:860px){ .ap-pipeline{flex-direction:column; gap:16px;} .ap-connector{width:1px; height:24px; margin:0;} .ecosystem-grid{grid-template-columns:1fr;} .ap-cards{grid-template-columns:1fr 1fr;} }
    @media(max-width:600px){ .ap-cards{grid-template-columns:1fr;} }`;

const html = `<div class="promo-bar">✨&nbsp; New Year Offer: <strong style="color:#a5b4fc;margin:0 6px;">40% Off</strong> on Yearly Plans &nbsp;<span class="time-unit js-ph">08</span>hrs <span class="time-unit js-pm">34</span>min <span class="time-unit js-ps">12</span>sec<a class="deal-link" href="#">Get Deal</a></div>

<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/"><img src="/infin8content_logo.png" alt="Infin8Content"></a>
    <nav class="main-nav" id="main-nav">
      <div class="nav-item"><span class="nav-link">Features <span class="chevron">▾</span></span><div class="dropdown"><div class="dropdown-label">AI Writing</div><a class="dropdown-link" href="/ai-content-writer">AI Content Writer</a><a class="dropdown-link" href="/ai-seo-editor">AI SEO Editor</a><a class="dropdown-link" href="#">News Writer</a><hr><div class="dropdown-label">Automation</div><a class="dropdown-link" href="/ai-seo-agent">AI SEO Agent</a><a class="dropdown-link" href="/autopublish">AutoPublish</a><a class="dropdown-link" href="/llm-tracker">LLM Tracker</a></div></div>
      <div class="nav-item"><span class="nav-link">Solutions <span class="chevron">▾</span></span><div class="dropdown"><a class="dropdown-link" href="#"><strong>SaaS</strong><small>Scale organic traffic</small></a><a class="dropdown-link" href="#"><strong>Agencies</strong><small>Manage clients at scale</small></a><a class="dropdown-link" href="#"><strong>E-Commerce</strong><small>Upgrade store content</small></a></div></div>
      <a class="nav-link" href="#">Pricing</a>
      <div class="nav-item"><span class="nav-link">Resources <span class="chevron">▾</span></span><div class="dropdown"><a class="dropdown-link" href="#">Case Studies</a><a class="dropdown-link" href="#">Help Docs</a><a class="dropdown-link" href="#">Blog</a></div></div>
    </nav>
    <div class="header-cta"><a class="btn-link" href="#">Login</a><a class="btn btn-primary" href="#">Get Started</a></div>
    <button class="nav-toggle" id="nav-toggle">☰</button>
  </div>
</header>

<main>

<section class="hero">
  <div class="container">
    <div class="hero-eyebrow fade-up">🚀 &nbsp;AutoPublish</div>
    <h1 class="fade-up">Automatically Generate and Publish<br>Content <span class="high">While You Sleep</span></h1>
    <p class="sub fade-up">The automated AI blogging system that runs on autopilot — 150+ languages, any niche, any schedule.</p>
    <div class="hero-actions fade-up">
      <a class="btn btn-primary btn-lg" href="#">Get Started Free</a>
    </div>
    <div class="social-proof fade-up">
      <div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div>
      Trusted by <strong>&nbsp;10,000+&nbsp;</strong> Marketers &amp; Agencies
    </div>

    <div class="ap-wrap fade-up">
      <div class="browser-frame">
        <div class="browser-bar">
          <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
          <div class="browser-url">app.infin8content.com/autopublish — Campaign: Tech Blog</div>
        </div>
        <div class="ap-mock">
          <div class="ap-pipeline">
            <div class="ap-step"><div class="ap-step-icon done">📡</div><h5>Feed Source</h5><p>RSS / Keywords</p></div>
            <div class="ap-connector"></div>
            <div class="ap-step"><div class="ap-step-icon done">✍️</div><h5>AI Writes</h5><p>SEO-optimized</p></div>
            <div class="ap-connector"></div>
            <div class="ap-step"><div class="ap-step-icon active">🖼️</div><h5>Images Generated</h5><p>With context</p></div>
            <div class="ap-connector"></div>
            <div class="ap-step"><div class="ap-step-icon">📤</div><h5>Auto-Published</h5><p>To your CMS</p></div>
            <div class="ap-connector"></div>
            <div class="ap-step"><div class="ap-step-icon">📊</div><h5>Analytics</h5><p>Track ranking</p></div>
          </div>
          <div class="ap-cards">
            <div class="ap-article-card"><div class="aac-img">📰</div><div class="aac-title">The Future of AI in Content Marketing</div><div class="aac-meta"><span class="aac-badge pub">Published</span><span class="aac-time">2h ago</span></div></div>
            <div class="ap-article-card"><div class="aac-img">💡</div><div class="aac-title">10 SEO Strategies That Actually Work in 2026</div><div class="aac-meta"><span class="aac-badge sched">Scheduled</span><span class="aac-time">Tomorrow</span></div></div>
            <div class="ap-article-card"><div class="aac-img">🚀</div><div class="aac-title">How to Scale Content Without Hiring Writers</div><div class="aac-meta"><span class="aac-badge gen">Generating</span><span class="aac-time">Now</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <p class="section-label" style="justify-content:center;">⚡ &nbsp;The Difference</p>
    <h2 class="section-title" style="text-align:center;margin-bottom:40px;">From manual chaos to fully automated</h2>
    <div class="before-after">
      <div class="ba-card">
        <div class="ba-header before"><span class="ba-label">Before</span> Difficult &amp; hard to manage</div>
        <div class="ba-body">
          <div class="ba-img">😩</div>
          <ul class="ba-list before">
            <li>Setting up blog — ~1 week of work</li>
            <li>Hiring copywriter — $600/month</li>
            <li>Hiring designer — $600/month</li>
            <li>Managing hires — ~10 hours/week</li>
          </ul>
        </div>
      </div>
      <div class="ba-card">
        <div class="ba-header after"><span class="ba-label">After</span> Blog runs automatically</div>
        <div class="ba-body">
          <div class="ba-img">🚀</div>
          <ul class="ba-list after">
            <li>All-in-one solution — set and forget</li>
            <li>Connect to your blog in seconds</li>
            <li>AI images generated automatically</li>
            <li>Publishes on your schedule, 24/7</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="section-label" style="justify-content:center;">🌐 &nbsp;How It Works</p>
    <h2 class="section-title" style="text-align:center;margin-bottom:12px;">How The AutoPublish Ecosystem Works</h2>
    <p class="section-sub" style="text-align:center;max-width:540px;margin:0 auto 44px;">Select a content feed, choose your output frequency, and connect with your site's backend. That's it.</p>
    <div class="ecosystem-grid">
      <div class="eco-card">
        <div class="eco-icon">📡</div>
        <h3>Feed the AI</h3>
        <p>Generate content based on feeds with valuable information and context from multiple sources.</p>
        <ul>
          <li>RSS feeds from any source</li>
          <li>Target keywords &amp; topics</li>
          <li>YouTube videos to blog posts</li>
          <li>Live news events</li>
        </ul>
      </div>
      <div class="eco-card">
        <div class="eco-icon">⚙️</div>
        <h3>Campaigns &amp; AutoPublish</h3>
        <p>Campaigns define how your content is generated and published. Choose manual or fully automated.</p>
        <ul>
          <li>Manual execution or autopilot</li>
          <li>Custom schedules (daily, weekly)</li>
          <li>Per-campaign niche &amp; tone settings</li>
          <li>Multi-site campaign management</li>
        </ul>
      </div>
      <div class="eco-card">
        <div class="eco-icon">🔌</div>
        <h3>Integrations</h3>
        <p>Publish your articles directly to any major CMS platform with a single connection.</p>
        <ul>
          <li>Connect unlimited websites</li>
          <li>One-click publish to any CMS</li>
          <li>Advanced feature integrations</li>
          <li>Zapier &amp; webhooks support</li>
        </ul>
      </div>
    </div>

    <div style="text-align:center;margin-top:48px;">
      <p class="section-label" style="justify-content:center;margin-bottom:20px;">🔗 &nbsp;Connects With</p>
      <div class="integrations-strip">
        <div class="int-badge">🔷 WordPress</div>
        <div class="int-badge">🛍️ Shopify</div>
        <div class="int-badge">👻 Ghost</div>
        <div class="int-badge">🌊 Webflow</div>
        <div class="int-badge">⬡ Wix</div>
        <div class="int-badge">📝 Squarespace</div>
        <div class="int-badge">⚡ Zapier</div>
        <div class="int-badge">🔗 Webhooks</div>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <p class="section-label" style="justify-content:center;">❓ &nbsp;FAQ</p>
    <h2 class="section-title" style="text-align:center;">Frequently Asked Questions</h2>
    <div class="faq-list">
      <div class="faq-item"><div class="faq-q">What is AutoPublish and how does it work?<div class="faq-icon">+</div></div><div class="faq-a">AutoPublish is an AI-powered tool that automatically generates and publishes SEO-optimized content to your website. It researches topics, writes unique articles, and schedules them to go live — all without manual effort. You configure the schedule, niche, tone, and categories once, and it runs indefinitely.</div></div>
      <div class="faq-item"><div class="faq-q">Does AutoPublish support multilingual content?<div class="faq-icon">+</div></div><div class="faq-a">Yes. AutoPublish can generate and publish content in 150+ languages, helping you reach global audiences and improve international SEO performance across any market.</div></div>
      <div class="faq-item"><div class="faq-q">Can I customize the content generated by AutoPublish?<div class="faq-icon">+</div></div><div class="faq-a">Yes. You can set your niche, tone of voice, keyword preferences, and even edit each article before or after it's published using the AI SEO Editor to match your brand's style perfectly.</div></div>
      <div class="faq-item"><div class="faq-q">Is AutoPublish good for SEO?<div class="faq-icon">+</div></div><div class="faq-a">Absolutely. AutoPublish uses AI trained on top-ranking pages and incorporates SEO best practices including keyword integration, proper headings, internal linking, and structured data to help your blog rank higher on Google.</div></div>
      <div class="faq-item"><div class="faq-q">How often does AutoPublish publish new articles?<div class="faq-icon">+</div></div><div class="faq-a">You control the frequency entirely. Choose daily, weekly, or custom schedules to keep your website consistently updated with fresh, SEO-optimized content on autopilot.</div></div>
      <div class="faq-item"><div class="faq-q">Can I connect AutoPublish to WordPress?<div class="faq-icon">+</div></div><div class="faq-a">Yes. AutoPublish integrates directly with WordPress, Shopify, Webflow, Wix, Ghost, Squarespace, Zapier, and many more — auto-publishing content straight to your blog without any extra steps.</div></div>
      <div class="faq-item"><div class="faq-q">Will the articles be 100% unique?<div class="faq-icon">+</div></div><div class="faq-a">Yes. All articles generated by Infin8Content's AutoPublish are unique and AI-crafted to avoid duplicate content penalties, ensuring strong SEO performance and no plagiarism flags.</div></div>
    </div>
  </div>
</section>

<section class="final-cta">
  <div class="container">
    <h2>Your blog. Running itself.</h2>
    <p>Get started and see why agencies trust Infin8Content.</p>
    <a class="btn btn-primary btn-lg" href="#">Start AutoPublish Free</a>
    <div class="cta-perks"><span class="cta-perk">Cancel anytime</span><span class="cta-perk">150+ languages</span><span class="cta-perk">Set and forget</span></div>
    <div class="cta-social"><div class="avatars"><div class="av">JL</div><div class="av">MR</div><div class="av">AK</div><div class="av">SB</div><div class="av">TD</div></div><span style="font-size:13.5px;color:var(--muted);">Trusted by <strong style="color:var(--white)">10,000+</strong> marketers</span></div>
    <div class="cta-mock-img"><div class="cta-mock-inner"><div class="cm-icon">🚀</div><div class="cm-label">AutoPublish dashboard — replace with screenshot</div></div></div>
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
</footer>`;

export default function AutoPublishPage() {
  return <MarketingPageBody css={css} html={html} />;
}
