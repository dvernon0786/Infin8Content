'use client';

import { useEffect } from 'react';

interface Props {
  html: string;
  css: string;
}

export default function MarketingPageBody({ html, css }: Props) {
  useEffect(() => {

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

    // Pricing billing toggle (if present on page)
    (window as Window & { _setPricing?: (mode: 'monthly' | 'annual') => void })._setPricing =
      (mode: 'monthly' | 'annual') => {
        document.body.classList.remove('billing-monthly', 'billing-annual');
        document.body.classList.add(`billing-${mode}`);
        const btnM = document.getElementById('btn-monthly');
        const btnA = document.getElementById('btn-annual');
        btnM?.classList.toggle('active', mode === 'monthly');
        btnA?.classList.toggle('active', mode === 'annual');
        const savingsEl = document.getElementById('billing-savings') as HTMLElement | null;
        if (savingsEl) savingsEl.style.display = mode === 'annual' ? 'block' : 'none';
      };

    const btnMonthly = document.getElementById('btn-monthly');
    const btnAnnual = document.getElementById('btn-annual');
    if (btnMonthly && btnAnnual) {
      btnMonthly.addEventListener('click', () => (window as any)._setPricing?.('monthly'));
      btnAnnual.addEventListener('click', () => (window as any)._setPricing?.('annual'));
      // Default to annual display
      (window as any)._setPricing?.('annual');
    }

    // Smooth scroll for anchor links
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const t = document.querySelector(href);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    return () => {
      delete (window as Window & { switchTab?: unknown }).switchTab;
      delete (window as Window & { toggleFaq?: unknown }).toggleFaq;
      delete (window as Window & { _setPricing?: unknown })._setPricing;
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
