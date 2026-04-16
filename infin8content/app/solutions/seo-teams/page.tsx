import { Metadata } from 'next';
import SolutionPageTemplate from '@/components/marketing/pages/SolutionPageTemplate';

export const metadata: Metadata = {
  title: 'SEO Teams | Infin8Content',
  description: 'Keyword research, clustering, and content generation in one automated pipeline. Built for SEO teams who need to move fast.',
};

export default function SEOTeamsPage() {
  return (
    <SolutionPageTemplate
      hero={{
        title: 'The complete SEO content pipeline. Automated.',
        description:
          'From competitor URL to published article — keyword extraction, clustering, topical mapping, and content generation in one workflow.',
      }}
      problem={{
        title: 'SEO teams spend too much time on production, not strategy.',
        body: 'Manual keyword research, competitor gap analysis, content briefing, and writer coordination eat the time that should go into strategy. Infin8Content handles the entire production pipeline so your team focuses on what matters.',
      }}
      benefits={[
        { title: 'Competitor Gap Analysis', desc: 'Feed competitor URLs and get a map of the keyword opportunities they own that you do not.' },
        { title: 'Keyword Clustering', desc: 'Keywords automatically grouped into hub-and-spoke topic clusters for maximum topical authority.' },
        { title: 'Intent Filtering', desc: 'Filter keywords by search intent, volume, and difficulty thresholds before generating content.' },
        { title: 'Batch Article Generation', desc: 'Generate multiple articles in parallel. Full clusters covered in one run.' },
        { title: 'E-E-A-T by Architecture', desc: 'E-E-A-T signals built into every article structure, not retrofitted post-generation.' },
        { title: 'DataForSEO Integration', desc: 'Direct DataForSEO integration for accurate keyword volume and difficulty data.' },
      ]}
      useCases={[
        { title: 'Topical Authority Campaigns', desc: 'Cover entire topic clusters end-to-end without writer coordination overhead.' },
        { title: 'Competitor Gap Exploitation', desc: 'Systematically identify and publish articles on keywords competitors rank for that you do not.' },
        { title: 'Content Sprint Execution', desc: 'Plan a 50-article content sprint and execute it in days, not months.' },
        { title: 'Client Reporting', desc: 'Generate content volume reports and keyword coverage maps for client presentations.' },
      ]}
    />
  );
}
