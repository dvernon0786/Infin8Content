import { Metadata } from 'next';
import SolutionPageTemplate from '@/components/marketing/pages/SolutionPageTemplate';

export const metadata: Metadata = {
  title: 'Agencies | Infin8Content',
  description: 'Deliver client content at agency speed. Per-client brand voice, keyword pipelines, and CMS publishing built into one platform.',
};

export default function AgenciesPage() {
  return (
    <SolutionPageTemplate
      hero={{
        title: 'Deliver client content at agency speed.',
        description:
          'Per-client brand voice profiles, keyword pipelines, and CMS publishing. Infin8Content is built for agencies managing content for multiple clients at once.',
      }}
      problem={{
        title: 'Scaling client content without scaling your team is an unsolved problem.',
        body: 'Each new client means new briefings, new style guides, new quality checks, and more writers. Infin8Content eliminates that equation — one operator runs full content pipelines for multiple clients simultaneously.',
      }}
      benefits={[
        { title: 'Per-Client Brand Voice', desc: 'Separate brand voice configurations per client. Every article matches their specific tone, vocabulary, and style.' },
        { title: 'Multi-Client Dashboard', desc: 'Manage all client pipelines from a single dashboard without context switching.' },
        { title: 'Bulk Content Generation', desc: 'Queue and run full article batches for multiple clients in parallel.' },
        { title: 'White-Label Ready', desc: 'Export clean Markdown or HTML for delivery. No Infin8Content branding in deliverables.' },
        { title: 'CMS Publishing', desc: 'Publish directly to client WordPress instances with one-click integration.' },
        { title: 'Quality Control', desc: 'E-E-A-T scoring and citation verification on every article before delivery.' },
      ]}
      useCases={[
        { title: 'Content Retainers', desc: 'Deliver monthly article quotas for clients without proportional headcount increases.' },
        { title: 'SEO Campaigns', desc: 'Run full topical authority campaigns for clients with automated keyword research and content generation.' },
        { title: 'New Client Onboarding', desc: 'Capture brand voice, configure keyword parameters, and generate a first batch of content in one onboarding session.' },
        { title: 'Content Audits', desc: 'Use competitor gap analysis to identify content opportunities and present them to clients before generating.' },
      ]}
    />
  );
}
