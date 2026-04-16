import { Metadata } from 'next';
import FeaturePageTemplate from '@/components/marketing/pages/FeaturePageTemplate';

export const metadata: Metadata = {
  title: 'Research Assistant | Infin8Content',
  description: 'Real web research before every article. Live sources, real citations, no hallucinated statistics.',
};

export default function ResearchAssistantPage() {
  return (
    <FeaturePageTemplate
      hero={{
        title: 'Every article backed by real sources. Not training-data guesses.',
        description:
          'Powered by Tavily Search API, our Research Agent conducts real web searches before writing begins. It consolidates sources, extracts key data points, and cites them inline.',
      }}
      problem={{
        title: 'Hallucinated statistics are a liability, not a shortcut.',
        body: 'AI tools that write from training data invent statistics, misquote studies, and cite sources that do not exist. One published hallucination can trigger corrections, damage authority, and trigger penalties from search engines flagging low-quality content.',
      }}
      steps={[
        { title: 'Query', desc: 'The Research Agent issues targeted web searches via Tavily Search API for each article section.' },
        { title: 'Consolidate', desc: 'Results are filtered, ranked by relevance, and consolidated into a research brief per section.' },
        { title: 'Cite', desc: 'Data points are extracted and cited inline. Maximum 5 citations per article. All URLs verified.' },
      ]}
      deepDive={[
        { title: 'Tavily Search Integration', desc: 'Direct integration with Tavily Search API for real-time web queries — not a cached index.' },
        { title: 'Per-Section Research', desc: 'Each article section gets its own independent research pass, not a single shared search.' },
        { title: 'Citation Verification', desc: 'All cited URLs are verified before inclusion. Dead links and paywalled pages are excluded.' },
        { title: 'Research Depth Control', desc: 'Configure research depth by topic sensitivity — more sources for medical, legal, or financial content.' },
      ]}
      differentiators={[
        'Live web research, not training data recall',
        'Per-section independent research passes',
        'Citation verification — no dead links or paywalled sources',
        'Maximum 5 citations for clean, authoritative content',
        'Configurable research depth by content category',
      ]}
      faq={[
        { q: 'How current is the research?', a: 'Research is conducted live at the time of article generation using Tavily Search — results are current to the day.' },
        { q: 'How many sources are cited per article?', a: 'Maximum 5 citations per article, selected for relevance and authority.' },
        { q: 'What happens if no good sources are found?', a: 'If the Research Agent cannot find verifiable sources for a claim, that claim is not included in the article.' },
        { q: 'Can I see the research sources before publishing?', a: 'Yes. All citations are included in the article output and can be reviewed before publishing.' },
      ]}
    />
  );
}
