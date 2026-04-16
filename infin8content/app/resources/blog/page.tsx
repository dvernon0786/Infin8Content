import { Metadata } from 'next';
import SectionWrapper from '@/components/marketing/layout/SectionWrapper';
import SectionHeader from '@/components/marketing/layout/SectionHeader';
import CTASection from '@/components/marketing/sections/CTASection';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | Infin8Content',
  description: 'Guides on AI content, SEO strategy, and scaling content operations at speed.',
};

const POSTS = [
  {
    title: 'How to Build Topical Authority in 90 Days',
    desc: 'A step-by-step breakdown of the keyword clustering and content production strategy that drives topical authority.',
    category: 'SEO Strategy',
    href: '#',
  },
  {
    title: 'E-E-A-T Explained: What It Means for AI-Generated Content',
    desc: "Google's E-E-A-T framework and how to engineer Experience, Expertise, Authoritativeness, and Trustworthiness into every article.",
    category: 'Content Quality',
    href: '#',
  },
  {
    title: 'Why AI Writers Hallucinate (And How We Stopped It)',
    desc: 'The technical approach behind live web research, citation verification, and the decision to use Tavily Search.',
    category: 'Technology',
    href: '#',
  },
  {
    title: 'Competitor Gap Analysis: The Fastest Way to Find Content Opportunities',
    desc: 'How to use competitor URLs to map keyword gaps and build an editorial calendar that systematically captures their traffic.',
    category: 'Content Strategy',
    href: '#',
  },
  {
    title: 'Brand Voice at Scale: Stop Sounding Like Every Other AI',
    desc: 'Why consistent brand voice is your moat in a world where everyone uses the same AI writing tools.',
    category: 'Brand',
    href: '#',
  },
  {
    title: 'The Content Marketing Stack in 2026',
    desc: 'A practical review of the tools, workflows, and automation patterns that high-output content teams are using right now.',
    category: 'Tools & Workflow',
    href: '#',
  },
];

export default function BlogPage() {
  return (
    <>
      <SectionWrapper variant="gradient">
        <SectionHeader
          label="Blog"
          title="The Infin8Content Blog"
          description="Guides on AI content strategy, SEO, and scaling content operations at speed."
          align="center"
        />
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid md:grid-cols-3 gap-6">
          {POSTS.map((post, i) => (
            <Link key={i} href={post.href} className="card block hover-lift no-underline">
              <div className="text-xs font-bold font-lato uppercase tracking-widest text-[color:var(--brand-electric-blue)] mb-3">
                {post.category}
              </div>
              <h3 className="font-poppins font-semibold text-neutral-900 text-lg leading-snug mb-3">
                {post.title}
              </h3>
              <p className="font-lato text-sm text-neutral-600 leading-relaxed">
                {post.desc}
              </p>
            </Link>
          ))}
        </div>
      </SectionWrapper>

      <CTASection />
    </>
  );
}

