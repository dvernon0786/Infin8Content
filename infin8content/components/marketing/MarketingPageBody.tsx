'use client';

import { useEffect } from 'react';

interface Props {
  html: string;
  css: string;
}

export default function MarketingPageBody({ html, css }: Props) {
  useEffect(() => {
    // Year
    const year = String(new Date().getFullYear());
    document.querySelectorAll<HTMLElement>('.js-year').forEach(el => (el.textContent = year));
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = year;

    // Countdown (8h 34m 12s starting point)
    let total = 8 * 3600 + 34 * 60 + 12;
    function tick() {
      if (total <= 0) return;
      total--;
      const h = String(Math.floor(total / 3600)).padStart(2, '0');
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const s = String(total % 60).padStart(2, '0');
      // class-based selectors (ai-seo-agent, ai-seo-editor, autopublish, llm-tracker)
      document.querySelectorAll<HTMLElement>('.js-ph').forEach(e => (e.textContent = h));
      document.querySelectorAll<HTMLElement>('.js-pm').forEach(e => (e.textContent = m));
      document.querySelectorAll<HTMLElement>('.js-ps').forEach(e => (e.textContent = s));
      // id-based selectors (ai-content-writer)
      const ph = document.getElementById('ph'); if (ph) ph.textContent = h;
      const pm = document.getElementById('pm'); if (pm) pm.textContent = m;
      const ps = document.getElementById('ps'); if (ps) ps.textContent = s;
    }
    tick();
    const timer = setInterval(tick, 1000);

    // switchTab global — used by ai-content-writer onclick="switchTab(this,'id')"
    (window as Window & { switchTab?: (btn: HTMLElement, panelId: string) => void }).switchTab =
      (btn: HTMLElement, panelId: string) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const el = document.getElementById(panelId);
        if (el) el.classList.add('active');
      };

    // toggleFaq global — used by homepage onclick="toggleFaq(this)"
    (window as Window & { toggleFaq?: (el: HTMLElement) => void }).toggleFaq =
      (el: HTMLElement) => {
        const item = el.parentElement;
        const wasOpen = item?.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!wasOpen && item) item.classList.add('open');
      };

    // FAQ accordion
    document.querySelectorAll<HTMLElement>('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.parentElement;
        const wasOpen = item?.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!wasOpen && item) item.classList.add('open');
      });
    });

    // data-tab tabs
    document.querySelectorAll<HTMLElement>('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panel) { const el = document.getElementById(panel); if (el) el.classList.add('active'); }
      });
    });

    // data-ftab tabs (ai-seo-editor)
    document.querySelectorAll<HTMLElement>('.ftab').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.ftab;
        document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ftab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panel) { const el = document.getElementById(panel); if (el) el.classList.add('active'); }
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href) return;
        const t = document.querySelector(href);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    return () => {
      clearInterval(timer);
      delete (window as Window & { switchTab?: unknown }).switchTab;
      delete (window as Window & { toggleFaq?: unknown }).toggleFaq;
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
