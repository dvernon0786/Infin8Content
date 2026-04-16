import { Metadata } from 'next';
import SolutionPageTemplate from '@/components/marketing/pages/SolutionPageTemplate';

export const metadata: Metadata = {
  title: 'Enterprise | Infin8Content',
  description: 'Brand-safe, audit-ready content at enterprise scale. Centralised controls, team role management, and compliance built in.',
};

export default function EnterprisePage() {
  return (
    <SolutionPageTemplate
      hero={{
        title: 'Brand-safe, audit-ready content for large teams.',
        description:
          'Centralised brand controls, role-based access, full audit trails, and compliance-grade content generation. Built for organisations where quality and consistency are non-negotiable.',
      }}
      problem={{
        title: 'Enterprise content has compliance requirements most AI tools ignore.',
        body: 'Large organisations need content that passes legal review, maintains consistent messaging, is traceable for compliance, and meets accessibility standards. Generic AI tools produce content that requires extensive human review to be enterprise-safe.',
      }}
      benefits={[
        { title: 'Centralised Brand Controls', desc: 'One canonical brand voice configuration enforced across all users, teams, and content types.' },
        { title: 'Role-Based Access', desc: 'Assign permissions to content creators, editors, approvers, and administrators independently.' },
        { title: 'Full Audit Trails', desc: 'Every content generation event is logged with timestamp, user, configuration, and output for compliance review.' },
        { title: 'Approval Workflows', desc: 'Build human approval gates into the content pipeline before any article reaches CMS.' },
        { title: 'E-E-A-T Compliance', desc: 'Every article meets E-E-A-T standards by architecture — documented and reviewable.' },
        { title: 'Priority Support', desc: 'Dedicated onboarding, SLA-backed support, and account management.' },
      ]}
      useCases={[
        { title: 'Legal & Compliance Review', desc: 'Full generation logs enable legal teams to review exactly what was produced and on what basis.' },
        { title: 'Multi-Team Coordination', desc: 'Different teams operate independently within shared brand standards enforced by the system.' },
        { title: 'Content Governance', desc: 'Approval workflows ensure no article is published without designated sign-off.' },
        { title: 'Regulated Industries', desc: 'Healthcare, finance, and legal content generated with appropriate source citation and E-E-A-T compliance built in.' },
      ]}
    />
  );
}
