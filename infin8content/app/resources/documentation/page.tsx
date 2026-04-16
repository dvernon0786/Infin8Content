import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | Infin8Content',
  description: 'API references, integration guides, and platform documentation for Infin8Content.',
};

const SECTIONS = [
  { title: 'Getting Started', items: ['Quickstart Guide', 'Organisation Setup', 'Onboarding Checklist', 'First Article Walkthrough'] },
  { title: 'Core Concepts', items: ['Workflows', 'Brand Voice', 'Keyword Pipelines', 'Article Generation'] },
  { title: 'API Reference', items: ['Authentication', 'Endpoints', 'Rate Limits', 'Webhooks'] },
  { title: 'Integrations', items: ['WordPress', 'DataForSEO', 'Tavily Search', 'Stripe Billing'] },
  { title: 'SEO', items: ['E-E-A-T Guide', 'Schema Markup', 'Keyword Density', 'Internal Linking'] },
  { title: 'Troubleshooting', items: ['Common Errors', 'API Status', 'Contact Support'] },
];

export default function DocumentationPage() {
  return (
    <div className="max-w-300 mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="text-xs font-bold font-lato uppercase tracking-widest text-(--brand-electric-blue) mb-3">
          Documentation
        </div>
        <h1 className="font-poppins text-4xl font-bold text-neutral-900 mb-3">
          Documentation
        </h1>
        <p className="font-lato text-neutral-600 text-lg">
          Everything you need to use and integrate Infin8Content.
        </p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-12">
        {/* Sidebar */}
        <aside className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="font-poppins font-semibold text-neutral-900 text-sm mb-2">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-lato text-sm text-neutral-600 hover:text-(--brand-electric-blue) transition-colors block py-0.5"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Content */}
        <main>
          <h2 className="font-poppins text-2xl font-bold text-neutral-900 mb-4">
            Getting Started
          </h2>
          <p className="font-lato text-neutral-600 leading-relaxed mb-6">
            Welcome to Infin8Content. This documentation covers everything from initial setup to advanced API integrations. Use the sidebar to navigate to the section you need.
          </p>
          <div className="card">
            <h3 className="font-poppins font-semibold text-neutral-900 mb-2">Quickstart</h3>
            <p className="font-lato text-sm text-neutral-600 leading-relaxed">
              Create an account, set up your organisation, configure your brand voice, and generate your first article in under 10 minutes. Full documentation coming soon.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
