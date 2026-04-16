import { Metadata } from 'next';
import SolutionPageTemplate from '@/components/marketing/pages/SolutionPageTemplate';

export const metadata: Metadata = {
  title: 'Content Marketing | Infin8Content',
  description: 'Scale content production without scaling headcount. Keyword research to published article, fully automated.',
};

export default function ContentMarketingPage() {
  return (
    <SolutionPageTemplate
      hero={{
        title: 'Scale content production without scaling headcount.',
        description:
          'From keyword research to publication-ready articles — the full content marketing workflow, automated. One operator can do the work of a five-person team.',
      }}
      problem={{
        title: 'Manual content production does not scale.',
        body: 'Briefing writers, waiting for drafts, editing for SEO, fact-checking sources, formatting for CMS — each article takes days and dozens of decisions. Infin8Content collapses this into a single automated pipeline.',
      }}
      benefits={[
        { title: 'Keyword-to-Article Pipeline', desc: 'Enter a niche. Get keyword clusters, topic plans, and publication-ready articles — automatically.' },
        { title: 'Consistent Brand Voice', desc: 'Every article matches your tone and style specifications. No writer briefings required.' },
        { title: 'Built-in SEO', desc: 'E-E-A-T compliance, schema markup, and keyword optimisation applied to every piece.' },
        { title: 'Real Research', desc: 'Live web sources cited in every article. No hallucinated statistics.' },
        { title: 'CMS Publishing', desc: 'One-click publish to WordPress and other supported CMS platforms.' },
        { title: 'Quota Tracking', desc: 'Monitor article usage and plan limits in real time from the dashboard.' },
      ]}
      useCases={[
        { title: 'Solo Operators', desc: 'Run a full content marketing programme — keyword research, content planning, article generation, publishing — without a team.' },
        { title: 'In-House Content Teams', desc: 'Augment your team with automated first drafts. Writers focus on editing and strategy, not production.' },
        { title: 'SaaS Companies', desc: 'Build topical authority in your niche with clusters of high-quality articles that cover every keyword opportunity.' },
        { title: 'E-commerce Brands', desc: 'Product category content, buying guides, and comparison articles generated at scale.' },
      ]}
    />
  );
}

