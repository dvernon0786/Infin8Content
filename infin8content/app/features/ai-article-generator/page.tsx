import { Metadata } from 'next';
import FeaturePageTemplate from '@/components/marketing/pages/FeaturePageTemplate';

export const metadata: Metadata = {
  title: 'AI Article Generator | Infin8Content',
  description: 'Research-backed, E-E-A-T optimised long-form articles written in parallel. Real citations, real sources — not training-data guesses.',
};

export default function AIArticleGeneratorPage() {
  return (
    <FeaturePageTemplate
      hero={{
        title: 'Articles that are researched, not generated from memory',
        description:
          'Infin8Content queries live web sources before writing a single word. Every section is independently researched and grounded in real citations — not training-data guesses.',
      }}
      problem={{
        title: 'AI writers hallucinate. That destroys trust, rankings, and authority.',
        body: 'Most AI tools draw from training data that may be months or years out of date. They invent statistics, cite non-existent studies, and produce content that confidently states things that are simply wrong. One published error is enough to tank your credibility.',
      }}
      steps={[
        { title: 'Plan', desc: 'A structured outline is created with section targets, FAQ coverage, and internal linking opportunities.' },
        { title: 'Research', desc: 'The Research Agent queries Tavily Search for live web sources — consolidating real data before a word is written.' },
        { title: 'Generate', desc: 'Sections are written in parallel. 2,000–4,000 word publication-ready drafts with real citations, schema markup, and E-E-A-T signals.' },
      ]}
      deepDive={[
        { title: 'Parallel Section Processing', desc: 'Unlike sequential generation, each section is researched and written independently — dramatically reducing total generation time.' },
        { title: 'Citation Control', desc: 'Maximum 5 citations per article. Only real, verifiable sources. No hallucinated URLs.' },
        { title: 'E-E-A-T by Architecture', desc: 'E-E-A-T compliance is engineered into the outline stage, not retrofitted after generation.' },
        { title: 'Brand Voice Applied', desc: 'Your tone and style settings from the Brand Voice Engine are applied to every section automatically.' },
      ]}
      differentiators={[
        'Real citations only — verified live sources, not training data',
        'Parallel section processing for faster generation',
        'E-E-A-T engineered from the outline stage',
        '2,000–4,000 words, publication-ready',
        'Full internal linking and schema markup included',
      ]}
      faq={[
        { q: 'How long are articles?', a: 'Standard articles are 2,000–4,000 words. Length is determined by keyword intent and competitive analysis.' },
        { q: 'Are citations real?', a: 'Yes. Every citation is retrieved from live web sources via Tavily Search API at the time of generation.' },
        { q: 'Can I edit articles after generation?', a: 'Articles are exported as clean Markdown or HTML. You can publish directly or edit in any CMS.' },
        { q: 'How many articles can I generate at once?', a: 'Multiple articles can be queued and generated in parallel, limited only by your plan quota.' },
      ]}
    />
  );
}

