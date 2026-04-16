import { Metadata } from 'next';
import FeaturePageTemplate from '@/components/marketing/pages/FeaturePageTemplate';

export const metadata: Metadata = {
  title: 'SEO Optimisation | Infin8Content',
  description: 'E-E-A-T compliance, schema markup, keyword density analysis engineered into the content architecture before a word is written.',
};

export default function SEOOptimizationPage() {
  return (
    <FeaturePageTemplate
      hero={{
        title: "E-E-A-T engineered in from the outline stage — not retrofitted after.",
        description:
          "Built-in SEO scoring, schema markup generation, keyword density analysis, and E-E-A-T compliance checking. SEO isn't an afterthought — it's engineered into the content architecture before a word is written.",
      }}
      problem={{
        title: 'Adding SEO after writing is too late.',
        body: 'Most content teams treat SEO as a post-writing checklist. By then, the structure is fixed, the headers are set, and retrofitting proper keyword placement, schema, and E-E-A-T signals means rewriting — not optimising.',
      }}
      steps={[
        { title: 'Analyse', desc: 'Target keyword, intent, and competitive SERP data are analysed before the outline is built.' },
        { title: 'Architect', desc: 'The outline is built with proper H1–H3 hierarchy, FAQ coverage, and E-E-A-T signal placement.' },
        { title: 'Optimise', desc: 'Keyword density, schema markup, and internal linking are applied during generation, not post-processing.' },
      ]}
      deepDive={[
        { title: 'Schema Markup Generation', desc: 'Article, FAQ, and HowTo schema generated automatically and embedded in the output.' },
        { title: 'Keyword Density Analysis', desc: 'Target keyword density monitored section by section to avoid over-optimisation.' },
        { title: 'E-E-A-T Signal Placement', desc: 'Experience, Expertise, Authoritativeness, and Trustworthiness signals are built into section structure and citations.' },
        { title: 'Internal Linking Engine', desc: 'Relevant internal link opportunities are surfaced and inserted during generation based on your existing content.' },
      ]}
      differentiators={[
        'SEO architecture built at outline stage, not post-processing',
        'Automatic schema markup for Article, FAQ, and HowTo',
        'E-E-A-T signals engineered into content structure',
        'Keyword density monitoring per section',
        'Internal linking engine powered by your existing content',
      ]}
      faq={[
        { q: 'Does Infin8Content guarantee rankings?', a: 'No tool can guarantee rankings. Infin8Content produces content that meets technical SEO best practices — ranking depends on domain authority, competition, and many other factors.' },
        { q: 'What schema types are supported?', a: 'Article, FAQ, HowTo, and BreadcrumbList schemas are generated automatically based on content structure.' },
        { q: 'Is keyword stuffing avoided?', a: 'Yes. Keyword density is monitored per section with hard limits to prevent over-optimisation.' },
        { q: 'How does internal linking work?', a: 'You provide your sitemap or existing article URLs during onboarding. The system surfaces relevant internal link opportunities during generation.' },
      ]}
    />
  );
}
