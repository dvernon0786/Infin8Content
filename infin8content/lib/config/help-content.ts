// Help content configuration — Epic 12, Story 12-3/12-10/12-11
// Single source of truth for FAQ, Tutorial, and Help link content.
// Update URLs and text here without touching component code.

export const HELP_LINKS = [
  { label: 'Getting Started Guide', url: 'https://docs.infin8content.com/getting-started' },
  { label: 'Keyword Research Tutorial', url: 'https://docs.infin8content.com/keyword-research' },
  { label: 'WordPress Publishing Setup', url: 'https://docs.infin8content.com/wordpress-setup' },
  { label: 'Managing Workflows', url: 'https://docs.infin8content.com/workflows' },
  { label: 'Billing & Plans FAQ', url: 'https://docs.infin8content.com/billing' },
] as const

export const SUPPORT_EMAIL = 'support@infin8content.com'

export const FAQ_ITEMS = [
  {
    question: 'How does article generation work?',
    answer:
      'Our AI researches your keyword using live web data (Tavily), then writes a full SEO-optimized article section by section. Each article takes 2–5 minutes depending on length.',
  },
  {
    question: 'How do I connect my WordPress site?',
    answer:
      'Go to Settings → Integrations and enter your WordPress site URL along with an Application Password. We use the WordPress REST API — no plugins required.',
  },
  {
    question: 'What are workflows?',
    answer:
      'Workflows are the core of Infin8Content. You define your ICP, add competitors, approve keyword clusters, and the platform generates a full content strategy and articles automatically.',
  },
  {
    question: 'What counts as an article generation?',
    answer:
      'Each completed article counts as one generation toward your monthly quota. Articles that fail or are cancelled do not count.',
  },
  {
    question: 'Can I edit generated articles?',
    answer:
      'Yes — every article has a built-in editor. You can edit before publishing to your CMS.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer:
      'Go to Settings → Billing and choose a new plan. Upgrades take effect immediately and are prorated.',
  },
  {
    question: 'What is ICP and why do I need it?',
    answer:
      'ICP stands for Ideal Customer Profile. It helps the AI understand who your content is targeting so it can write with the right tone, depth, and vocabulary.',
  },
  {
    question: 'How many CMS connections can I have?',
    answer:
      'Starter: 1 connection. Pro: 3 connections. Agency: unlimited. Each connection can be WordPress or another supported CMS.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted at rest and in transit. We use Supabase with Row-Level Security so your org data is isolated from other tenants.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'Go to Settings → Billing → Cancel Subscription. Your access continues until the end of the billing period.',
  },
] as const

export const TUTORIAL_VIDEOS = [
  {
    title: 'Quick Start: Your First Workflow',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // replace with real URL
    duration: '4 min',
  },
  {
    title: 'Keyword Research Deep Dive',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '6 min',
  },
  {
    title: 'Publishing to WordPress',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3 min',
  },
  {
    title: 'Understanding Your Analytics',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5 min',
  },
] as const
