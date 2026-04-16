"use client";

import React, { useState } from 'react';
import { Check, ArrowRight, TrendingUp, Zap, Clock, Star, Users, Search, Brain, BarChart3, Shield, Globe, Layers } from 'lucide-react';
import Navigation from './Navigation';
import CTASection from './sections/CTASection';
import FAQSection from './sections/FAQSection';

// ─── HERO ──────────────────────────────────────────────────────
const HeroSection = () => {
  return (
    <section style={{ background: `radial-gradient(at 27% 37%, hsla(215,98%,61%,0.09) 0px, transparent 50%), radial-gradient(at 97% 21%, hsla(265,87%,54%,0.09) 0px, transparent 50%), radial-gradient(at 10% 80%, hsla(215,98%,61%,0.06) 0px, transparent 50%), var(--color-bg-primary)`, padding: '6rem 0 5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }} className="md:grid-cols-5-3">

          {/* Left */}
          <div style={{ maxWidth: '660px' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(to right, var(--blue-50), var(--purple-50))', border: '1px solid var(--blue-100)', borderRadius: '999px', padding: '0.375rem 1rem', marginBottom: '1.75rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(to right, var(--brand-electric-blue), var(--brand-infinite-purple))' }}></div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-electric-blue)', fontFamily: 'var(--font-lato, Lato, sans-serif)', letterSpacing: '0.02em' }}>Real-Time Research · E-E-A-T Compliant</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', lineHeight: 1.15, color: 'var(--neutral-900)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              The AI Content Platform<br />
              <span style={{ background: 'linear-gradient(to right, var(--brand-electric-blue), var(--brand-infinite-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                That Actually Does the Research
              </span>
            </h1>

            <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--neutral-600)', marginBottom: '2.5rem', maxWidth: '580px' }}>
              Infin8Content discovers high-value keywords, plans your content strategy, conducts real-time web research, and writes grounded, E-E-A-T-compliant long-form articles — then tracks every article from draft to published.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginBottom: '2.5rem' }}>
              <a href="/register" style={{ background: 'linear-gradient(to right, var(--brand-electric-blue), var(--brand-infinite-purple))', color: 'var(--brand-white)', padding: '0.875rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-lato, Lato, sans-serif)', boxShadow: 'var(--shadow-brand)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Start Free Trial <ArrowRight size={16} />
              </a>
              <a href="/pricing" style={{ background: 'transparent', color: 'var(--brand-electric-blue)', padding: '0.875rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-lato, Lato, sans-serif)', border: `2px solid var(--brand-electric-blue)`, transition: 'all 0.2s', display: 'inline-block' }}>
                View Pricing
              </a>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>
              Trusted by content teams, SEO agencies, and growing businesses. One trial article included.
            </p>
          </div>

          {/* Right — dashboard mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardMockup = () => (
  <div style={{ background: 'var(--color-bg-primary)', borderRadius: '20px', boxShadow: '0 24px 64px rgba(33,124,235,0.12), 0 4px 16px rgba(0,0,0,0.06)', border: `1px solid var(--color-border-light)`, padding: '1.5rem', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
    {/* Header bar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-error)' }}></div>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-warning)' }}></div>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>infin8content.com/dashboard</span>
    </div>

    {/* Stats row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
      {[{ label: 'Articles', value: '47', color: 'var(--brand-electric-blue)' }, { label: 'Researched', value: '100%', color: 'var(--color-success)' }, { label: 'SEO Score', value: '92', color: 'var(--brand-infinite-purple)' }].map(s => (
        <div key={s.label} style={{ background: 'var(--color-bg-surface)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-poppins, Poppins, sans-serif)', lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginTop: '2px' }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Article rows */}
    {[
      { title: 'Best AI Tools for SEO in 2026', status: 'Completed', score: 94, statusColor: 'var(--color-success)' },
      { title: 'How to Build Topical Authority', status: 'Processing', score: '—', statusColor: 'var(--color-warning)' },
      { title: 'E-E-A-T Guide for Content Teams', status: 'Draft', score: 88, statusColor: 'var(--brand-electric-blue)' },
    ].map((a, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: i < 2 ? `1px solid var(--ui-light-gray)` : 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-deep-charcoal)', fontFamily: 'var(--font-lato, Lato, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginTop: '2px' }}>2,847 words • Tavily-grounded</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: a.statusColor, background: a.statusColor + '18', padding: '2px 8px', borderRadius: '999px', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>{a.status}</span>
          {a.score !== '—' && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-infinite-purple)', fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{a.score}</span>}
        </div>
      </div>
    ))}

    {/* Research grounding bar */}
    <div style={{ marginTop: '1rem', background: 'linear-gradient(to right, var(--blue-50), var(--purple-50))', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Search size={14} style={{ color: 'var(--brand-electric-blue)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-electric-blue)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>Research grounding active</div>
        <div style={{ height: '4px', background: 'var(--blue-100)', borderRadius: '999px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '78%', background: 'linear-gradient(to right, var(--brand-electric-blue), var(--brand-infinite-purple))', borderRadius: '999px' }}></div>
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-electric-blue)', fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>78%</span>
    </div>
  </div>
);

// ─── FEATURE STRIP ────────────────────────────────────────────
const FeatureStrip = () => {
  const features = [
    { icon: <Search size={22} />, title: 'Real-Time Research Grounding', desc: 'Every article is backed by live web sources via Tavily — no hallucinated facts, no generic filler.' },
    { icon: <Brain size={22} />, title: 'Brand Voice Engine', desc: 'Your tone, your style, your industry context — baked into every word, not bolted on after.' },
    { icon: <BarChart3 size={22} />, title: 'Workflow-First Content Engine', desc: 'From keyword discovery to published article, every step is tracked, audited, and repeatable.' },
  ];
  return (
    <section style={{ background: 'var(--color-bg-surface)', borderTop: `1px solid var(--ui-light-gray)`, borderBottom: `1px solid var(--ui-light-gray)`, padding: '3.5rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--blue-50), var(--purple-50))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-electric-blue)', flexShrink: 0, border: '1px solid var(--blue-100)' }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--neutral-900)', marginBottom: '0.375rem' }}>{f.title}</h3>
                <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '0.9rem', color: 'var(--neutral-600)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── PROBLEM SECTION ──────────────────────────────────────────
const ProblemSection = () => (
  <section style={{ background: 'var(--color-bg-primary)', padding: '6rem 0' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ maxWidth: '700px', marginBottom: '4rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-electric-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginBottom: '1rem' }}>The Problem</div>
        <h2 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: 'var(--neutral-900)', lineHeight: 1.2, marginBottom: '1.5rem' }}>
          Generic AI content is everywhere.<br />
          <span style={{ color: 'var(--brand-infinite-purple)' }}>Authoritative content is rare.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1.0625rem', color: 'var(--neutral-600)', lineHeight: 1.75 }}>
          Most AI writing tools generate fast, cheap, and wrong. They hallucinate statistics. They ignore your brand. They produce content that sounds like every other AI-written article on the web. Google's E-E-A-T guidelines exist precisely to filter this out.
        </p>
        <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1.0625rem', color: 'var(--neutral-600)', lineHeight: 1.75, marginTop: '1rem' }}>
          Infin8Content is built differently. Before a single word is written, our Research Agent pulls real sources from the web. Your brand voice is captured during onboarding and applied consistently. Your competitors are analysed so your content fills the gaps they leave open. The result is content that earns authority — not just fills a page.
        </p>
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 700, color: 'var(--neutral-500)', borderBottom: `2px solid var(--color-border-light)`, width: '40%' }}></th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-electric-blue)', borderBottom: `2px solid var(--brand-electric-blue)`, background: 'linear-gradient(to bottom, var(--blue-50), var(--color-bg-primary))', borderRadius: '8px 8px 0 0' }}>Infin8Content</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-500)', borderBottom: `2px solid var(--color-border-light)` }}>Generic AI Writers</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Real-time web research', true, false],
              ['Brand voice capture', true, false],
              ['Competitor gap analysis', true, false],
              ['E-E-A-T compliance', true, false],
              ['Full lifecycle tracking', true, false],
              ['Parallel article generation', true, false],
            ].map(([label, a, b], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--neutral-50)' : 'var(--color-bg-primary)' }}>
                <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.9375rem', color: 'var(--brand-deep-charcoal)', fontWeight: 500 }}>{label as string}</td>
                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                  {a ? <span style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>✓</span> : <span style={{ color: 'var(--color-error)' }}>✗</span>}
                </td>
                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                  {b ? <span style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>✓</span> : <span style={{ color: 'var(--color-border-medium)', fontSize: '1.1rem' }}>✗</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

// ─── HOW IT WORKS ─────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    { n: '01', title: 'Discover', desc: 'Enter your blog URL and industry. We analyse your existing content and brand positioning.' },
    { n: '02', title: 'Competitors', desc: "Add competitor URLs. We map their content gaps so you can own topics they haven't covered." },
    { n: '03', title: 'Keywords', desc: 'Set intent filters and volume thresholds. Our DataForSEO integration surfaces high-value, low-competition opportunities.' },
    { n: '04', title: 'Clusters', desc: 'We group keywords into topic clusters for maximum topical authority across your domain.' },
    { n: '05', title: 'Review', desc: 'You approve keyword clusters before any content is created. You stay in control.' },
    { n: '06', title: 'Brand Voice', desc: 'Define your tone, style, and content defaults — applied to every article automatically.' },
    { n: '07', title: 'Plan', desc: 'Our Content Planner Agent architects article outlines with proper structure and FAQ coverage.' },
    { n: '08', title: 'Research', desc: 'The Research Agent queries live web sources and grounds every section in real citations.' },
    { n: '09', title: 'Generate', desc: 'Parallel generation. Multiple articles written simultaneously. Publication-ready drafts.' },
  ];

  return (
    <section style={{ background: 'linear-gradient(135deg, var(--blue-50) 0%, var(--purple-50) 100%)', padding: '6rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-infinite-purple)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginBottom: '1rem' }}>How It Works</div>
          <h2 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: 'var(--neutral-900)', marginBottom: '1rem' }}>
            From strategy to published article — every step automated
          </h2>
          <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1.0625rem', color: 'var(--neutral-600)', maxWidth: '560px', margin: '0 auto' }}>
            The 9-step workflow that turns a URL and a niche into publication-ready, grounded content.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: 'var(--color-bg-primary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(33,124,235,0.12)', display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(33,124,235,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-electric-blue), var(--brand-infinite-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-white)', flexShrink: 0 }}>
                {step.n}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--neutral-900)', marginBottom: '0.375rem' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href="/features/ai-article-generator" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-electric-blue)', textDecoration: 'none', fontWeight: 700, fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1rem', borderBottom: `2px solid var(--brand-electric-blue)`, paddingBottom: '2px' }}>
            See the full workflow <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

// ─── FEATURE HIGHLIGHTS ───────────────────────────────────────
const FeatureHighlights = () => {
  const rows = [
    {
      tag: 'AI Article Generator',
      title: 'Articles that are researched, not generated from memory',
      desc: 'Long-form articles written in parallel — each section independently researched and grounded. 2,000–4,000 words with real citations, internal linking, and SEO-optimised structure. Not a template. Not a rewrite. Original, grounded content built from live research.',
      href: '/features/ai-article-generator',
      icon: <Zap size={28} />,
      visual: 'article',
    },
    {
      tag: 'Brand Voice Engine',
      title: 'Your voice. Applied consistently. At scale.',
      desc: 'Most AI tools write in the same voice for every client. Infin8Content captures your specific tone during onboarding — professional or casual, technical or accessible — and applies it to every article, every section, every sentence.',
      href: '/features/brand-voice-engine',
      icon: <Brain size={28} />,
      visual: 'voice',
      flip: true,
    },
    {
      tag: 'Research Assistant',
      title: 'Every article backed by real sources. Not training-data guesses.',
      desc: 'Powered by Tavily Search API, our Research Agent conducts real web searches before writing begins. It consolidates sources, extracts key data points, and cites them inline. No made-up statistics. No outdated claims. Maximum 5 citations per article.',
      href: '/features/research-assistant',
      icon: <Search size={28} />,
      visual: 'research',
    },
    {
      tag: 'SEO Optimisation',
      title: 'E-E-A-T engineered in from the outline stage',
      desc: "Built-in SEO scoring, schema markup generation, keyword density analysis, and E-E-A-T compliance checking. SEO isn't an afterthought — it's engineered into the content architecture before a word is written.",
      href: '/features/seo-optimization',
      icon: <TrendingUp size={28} />,
      visual: 'seo',
      flip: true,
    },
  ];

  return (
    <section style={{ background: 'var(--color-bg-primary)', padding: '6rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-electric-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginBottom: '1rem' }}>Features</div>
          <h2 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: 'var(--neutral-900)' }}>
            One Platform. Infinite Possibilities.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
              <div style={{ order: row.flip ? 2 : 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(to right, var(--blue-50), var(--purple-50))', border: '1px solid var(--blue-100)', borderRadius: '999px', padding: '0.3rem 0.875rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: 'var(--brand-electric-blue)' }}>{row.icon}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-electric-blue)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>{row.tag}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)', color: 'var(--neutral-900)', lineHeight: 1.25, marginBottom: '1rem' }}>{row.title}</h3>
                <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1.0rem', color: 'var(--neutral-600)', lineHeight: 1.75, marginBottom: '1.5rem' }}>{row.desc}</p>
                <a href={row.href} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-electric-blue)', textDecoration: 'none', fontWeight: 700, fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '0.9375rem', borderBottom: `2px solid var(--brand-electric-blue)`, paddingBottom: '2px' }}>
                  Learn more <ArrowRight size={15} />
                </a>
              </div>
              <FeatureVisual type={row.visual} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureVisual = ({ type }: { type: string }) => {
  const baseStyle: React.CSSProperties = { background: 'linear-gradient(135deg, var(--blue-50) 0%, var(--purple-50) 100%)', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(74,66,204,0.1)', minHeight: '260px', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' };

  if (type === 'article') return (
    <div style={baseStyle}>
      {['Introduction — 320 words', 'What is Topical Authority?', 'How Google Measures E-E-A-T', 'Implementation Strategy', 'Case Studies & Results', 'FAQ Section'].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-bg-primary)', borderRadius: '10px', padding: '0.625rem 1rem', border: '1px solid var(--color-border-light)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 2 ? 'linear-gradient(to right,var(--brand-electric-blue),var(--brand-infinite-purple))' : 'var(--blue-100)', flexShrink: 0 }}></div>
          <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-lato, Lato, sans-serif)', color: 'var(--neutral-800)', fontWeight: i === 2 ? 700 : 400 }}>{s}</span>
          {i === 2 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'var(--blue-50)', color: 'var(--brand-electric-blue)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>Writing</span>}
        </div>
      ))}
    </div>
  );

  if (type === 'voice') return (
    <div style={baseStyle}>
      <div style={{ background: 'var(--color-bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--color-border-light)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Voice Config</div>
        {[{ label: 'Tone', value: 'Professional + Direct', color: 'var(--brand-electric-blue)' }, { label: 'Style', value: 'Authoritative', color: 'var(--brand-infinite-purple)' }, { label: 'Audience', value: 'Technical SEOs', color: 'var(--color-success)' }].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--ui-light-gray)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>{item.label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color, fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: '#F0FFF4', borderRadius: '10px', padding: '0.75rem 1rem' }}>
        <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#166534', fontFamily: 'var(--font-lato, Lato, sans-serif)', fontWeight: 600 }}>Applied to all 47 articles automatically</span>
      </div>
    </div>
  );

  if (type === 'research') return (
    <div style={baseStyle}>
      {[
        { query: 'Topical authority metrics 2026', sources: 4, status: 'Cached' },
        { query: 'Google E-E-A-T ranking signals', sources: 5, status: 'Live' },
        { query: 'Domain authority measurement tools', sources: 3, status: 'Live' },
      ].map((r, i) => (
        <div key={i} style={{ background: 'var(--color-bg-primary)', borderRadius: '10px', padding: '0.875rem 1rem', border: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-800)', fontFamily: 'var(--font-lato, Lato, sans-serif)', lineHeight: 1.4, flex: 1 }}>{r.query}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: r.status === 'Live' ? 'var(--color-success)' : 'var(--color-warning)', background: r.status === 'Live' ? '#F0FFF4' : '#FFFBEB', padding: '2px 8px', borderRadius: '999px', flexShrink: 0 }}>{r.status}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem' }}>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} style={{ width: '24px', height: '4px', borderRadius: '999px', background: j < r.sources ? 'var(--brand-electric-blue)' : 'var(--color-border-light)' }}></div>
            ))}
            <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginLeft: '4px' }}>{r.sources}/5 sources</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={baseStyle}>
      {[{ label: 'Keyword Density', score: 94 }, { label: 'Header Structure', score: 100 }, { label: 'E-E-A-T Signals', score: 88 }, { label: 'Schema Completeness', score: 92 }].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-800)', fontFamily: 'var(--font-lato, Lato, sans-serif)', width: '150px', flexShrink: 0 }}>{item.label}</span>
          <div style={{ flex: 1, height: '8px', background: 'var(--color-border-light)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${item.score}%`, background: 'linear-gradient(to right, var(--brand-electric-blue), var(--brand-infinite-purple))', borderRadius: '999px' }}></div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-electric-blue)', fontFamily: 'var(--font-poppins, Poppins, sans-serif)', width: '36px', textAlign: 'right' }}>{item.score}</span>
        </div>
      ))}
    </div>
  );
};

// ─── STATS BAR ────────────────────────────────────────────────
const StatsBar = () => (
  <section style={{ background: 'linear-gradient(to right, var(--brand-infinite-purple), var(--brand-infinite-purple))', padding: '4rem 0' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
        {[
          { value: '500K+', label: 'Articles Created', icon: <Zap size={20} /> },
          { value: '100%', label: 'Real Citations', icon: <Shield size={20} /> },
          { value: '<10 min', label: 'Per Article', icon: <Clock size={20} /> },
          { value: '4.8/5', label: 'User Rating', icon: <Star size={20} /> },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#93C5FD', marginBottom: '0.75rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--brand-white)', marginBottom: '0.25rem' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '0.875rem', color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── TESTIMONIALS ─────────────────────────────────────────────
const Testimonials = () => {
  const items = [
    { quote: "We've tried six AI writing tools. Infin8Content is the first one where our editor didn't have to fact-check every paragraph.", name: "Content Manager", role: "SaaS Company", initials: "CM", metric: 'Zero fact-check failures' },
    { quote: "The competitor gap analysis alone has changed how we plan our editorial calendar. We're owning topics nobody else is covering.", name: "SEO Director", role: "Digital Agency", initials: "SD", metric: '+3× organic traffic' },
    { quote: "Our domain authority grew 40% in three months. The research grounding makes the difference — Google rewards it.", name: "Founder", role: "Content Marketing Agency", initials: "FM", metric: '+40% domain authority' },
  ];
  return (
    <section style={{ background: 'var(--color-bg-surface)', padding: '6rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-electric-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-lato, Lato, sans-serif)', marginBottom: '1rem' }}>Social Proof</div>
          <h2 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: 'var(--neutral-900)' }}>Teams that need content that actually ranks</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {items.map((t, i) => (
            <div key={i} style={{ background: 'var(--color-bg-primary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(33,124,235,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={16} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '1rem', color: 'var(--neutral-800)', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-electric-blue), var(--brand-infinite-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-white)', fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{t.initials}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--neutral-900)' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-lato, Lato, sans-serif)', fontSize: '0.8125rem', color: 'var(--neutral-500)' }}>{t.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', background: '#F0FFF4', padding: '4px 10px', borderRadius: '999px', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>{t.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ─────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'Does Infin8Content work for any niche?', a: 'Yes. The Research Agent fetches live web sources for any topic. The Brand Voice Engine adapts to any industry tone. You provide your URL and competitors — we handle the rest.' },
  { q: 'How is this different from ChatGPT or Jasper?', a: 'Infin8Content is a complete content workflow system, not a text generator. It plans, researches, writes, and tracks content across its full lifecycle. ChatGPT gives you words. Infin8Content gives you a content operation.' },
  { q: 'Will Google penalise AI-generated content?', a: "Google rewards quality and E-E-A-T — regardless of who or what wrote the content. Our articles are grounded in real sources, structured for readability, and built with schema markup. That's what earns rankings." },
  { q: 'How long does it take to generate an article?', a: 'With parallel section processing, a fully researched 2,500-word article is ready in under 10 minutes.' },
  { q: 'Can I edit articles before publishing?', a: "Yes. Every article is a draft you control. Review, edit, and publish when you're ready. CMS integration available on Starter plan and above." },
  { q: 'What if the research returns insufficient data?', a: 'The Research Agent explicitly notes gaps rather than fabricating content. Sections with insufficient source coverage are flagged in your dashboard so you can supplement manually.' },
  { q: 'Do unused articles roll over?', a: 'Monthly limits reset on your billing date. Upgrade your plan if you need more volume.' },
  { q: 'What kind of support do you offer?', a: 'All plans include email support. Starter gets 48h response, Pro gets 24h, Agency gets 4h with dedicated account management.' },
];

// ─── FOOTER ───────────────────────────────────────────────────
const Footer = () => (
  <footer style={{ background: 'var(--neutral-900)', color: 'var(--color-text-muted)', paddingTop: '4rem', paddingBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        {/* Brand */}
        <div style={{ gridColumn: 'span 1' }}>
          <img src="/infin8content-logo.png" alt="Infin8Content" style={{ width: '160px', height: '36px', objectFit: 'contain', marginBottom: '1rem', filter: 'brightness(0) invert(1)' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.6, fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>AI-powered content platform for modern marketing teams.</p>
        </div>

        {[
          { heading: 'Product', links: [['AI Article Generator', '/features/ai-article-generator'], ['Brand Voice Engine', '/features/brand-voice-engine'], ['Research Assistant', '/features/research-assistant'], ['SEO Optimisation', '/features/seo-optimization']] },
          { heading: 'Solutions', links: [['Marketing Teams', '/solutions/content-marketing'], ['SEO Teams', '/solutions/seo-teams'], ['Agencies', '/solutions/agencies'], ['Enterprise', '/solutions/enterprise']] },
          { heading: 'Resources', links: [['Documentation', '/resources/documentation'], ['Blog', '/resources/blog'], ['Support', '/resources/support'], ['Community', '/resources/community']] },
          { heading: 'Company', links: [['About', '/about'], ['Pricing', '/pricing'], ['Contact', '/contact'], ['Careers', '/careers']] },
        ].map(col => (
          <div key={col.heading}>
            <h4 style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-white)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>{col.heading}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {col.links.map(([label, href]) => (
                <li key={label}><a href={href} style={{ color: 'var(--neutral-500)', textDecoration: 'none', fontSize: '0.875rem', fontFamily: 'var(--font-lato, Lato, sans-serif)', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--neutral-500)')}
                >{label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>© 2026 Infin8Content. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Security', '/security']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', textDecoration: 'none', fontFamily: 'var(--font-lato, Lato, sans-serif)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--neutral-500)')}
            >{label}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeatureStrip />
      <ProblemSection />
      <HowItWorks />
      <FeatureHighlights />
      <StatsBar />
      <Testimonials />
      <FAQSection
        title="Questions? We've Got Answers."
        items={FAQ_ITEMS}
      />
      <CTASection />
      <Footer />
    </div>
  );
}
