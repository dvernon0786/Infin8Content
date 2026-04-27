/* shared.js — nav toggle, FAQ, countdown, smooth scroll */
document.addEventListener('DOMContentLoaded', function() {
  // Year
  document.querySelectorAll('.js-year').forEach(el => el.textContent = new Date().getFullYear());

  // Countdown
  let total = 8*3600+34*60+12;
  function tick(){
    if(total<=0)return; total--;
    const h=String(Math.floor(total/3600)).padStart(2,'0');
    const m=String(Math.floor((total%3600)/60)).padStart(2,'0');
    const s=String(total%60).padStart(2,'0');
    document.querySelectorAll('.js-ph').forEach(e=>e.textContent=h);
    document.querySelectorAll('.js-pm').forEach(e=>e.textContent=m);
    document.querySelectorAll('.js-ps').forEach(e=>e.textContent=s);
  }
  tick(); setInterval(tick,1000);

  // Nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if(navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      navToggle.textContent = mainNav.classList.contains('open') ? '✕' : '☰';
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });

  // Tabs (for pages that have them)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const el = document.getElementById(panel);
      if(el) el.classList.add('active');
    });
  });

  // Feature tabs (.ftab / data-ftab) — used by ai-seo-editor.html
  document.querySelectorAll('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.ftab;
      document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.ftab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(panel)?.classList.add('active');
    });
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
});
