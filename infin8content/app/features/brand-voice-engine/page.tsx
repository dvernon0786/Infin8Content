import { Metadata } from 'next';
import FeaturePageTemplate from '@/components/marketing/pages/FeaturePageTemplate';

export const metadata: Metadata = {
  title: 'Brand Voice Engine | Infin8Content',
  description: 'Capture your tone and style during onboarding. Applied to every article, every section, every sentence — automatically.',
};

export default function BrandVoiceEnginePage() {
  return (
    <FeaturePageTemplate
      hero={{
        title: 'Your voice. Applied consistently. At scale.',
        description:
          'Most AI tools write in the same neutral voice for every client. Infin8Content captures your specific tone during onboarding and applies it to every article — professional or casual, technical or accessible.',
      }}
      problem={{
        title: 'Generic AI voice destroys brand differentiation.',
        body: 'When every company uses the same AI writing tool with the same defaults, all their content sounds identical. Readers notice. Search engines notice. Your brand voice is a competitive moat — but only if it is consistently applied.',
      }}
      steps={[
        { title: 'Capture', desc: 'During onboarding, define your tone (professional/casual), style (technical/accessible), and content defaults.' },
        { title: 'Configure', desc: 'Set industry-specific vocabulary, prohibited phrases, preferred sentence length, and formatting rules.' },
        { title: 'Apply', desc: 'Your brand voice configuration is automatically applied to every section of every article generated.' },
      ]}
      deepDive={[
        { title: 'Tone Configuration', desc: 'Set professional vs casual, formal vs conversational — applied per sentence, not just at document level.' },
        { title: 'Industry Vocabulary', desc: 'Whitelist industry-specific terms and blacklist phrases that do not align with your brand.' },
        { title: 'Consistency Scoring', desc: 'Every article is scored for brand voice consistency before delivery.' },
        { title: 'Multi-Brand Support', desc: 'Agencies can configure separate brand voice profiles per client within one account.' },
      ]}
      differentiators={[
        'Voice configured once, applied automatically to all content',
        'Beyond tone — covers vocabulary, structure, and formatting',
        'Consistency scoring built into every generation',
        'Per-client profiles for agencies',
        'No manual editing required to maintain brand standards',
      ]}
      faq={[
        { q: 'How is brand voice captured?', a: 'During onboarding you answer a structured questionnaire about tone, style, audience, and vocabulary preferences. This configuration is stored and applied automatically.' },
        { q: 'Can I update my brand voice settings?', a: 'Yes. You can update your configuration at any time from your organisation settings.' },
        { q: 'Does brand voice apply to all content types?', a: 'Yes — all articles generated through Infin8Content inherit your brand voice configuration.' },
        { q: 'Can agencies manage multiple brand voices?', a: 'Yes. Agency plans support per-client brand voice profiles.' },
      ]}
    />
  );
}
