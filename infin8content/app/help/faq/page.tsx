// Epic 12: Story 12-3/12-10 — Help & FAQ static page

import { FAQ_ITEMS } from '@/lib/config/help-content'

export const metadata = {
  title: 'FAQ | Infin8Content Help',
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-poppins text-2xl font-bold text-neutral-900 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="font-lato text-neutral-500 mb-8">
        Can&apos;t find what you&apos;re looking for?{' '}
        <a href="mailto:support@infin8content.com" className="text-[--brand-electric-blue] underline">
          Contact support
        </a>
        .
      </p>
      <div className="space-y-0 divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group bg-white">
            <summary className="flex items-center justify-between p-5 cursor-pointer font-lato font-medium text-neutral-800 hover:bg-neutral-50 list-none">
              {item.question}
              <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg leading-none">⌄</span>
            </summary>
            <p className="px-5 pb-5 font-lato text-sm text-neutral-600 leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}
