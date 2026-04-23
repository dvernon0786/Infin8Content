// components/marketing/pricing/PricingComparison.tsx
// Simple at-a-glance comparison — used below the full comparison table
// as a mobile-friendly summary card

import { Check, Minus } from "lucide-react";

const summary = [
  { feature: "Articles / month",      starter: "~10",       pro: "~50",          agency: "~150" },
  { feature: "AutoPublish campaigns", starter: "1",          pro: "5",            agency: "Unlimited" },
  { feature: "Team members",          starter: "1",          pro: "3",            agency: "Unlimited" },
  { feature: "Projects",              starter: "1",          pro: "5",            agency: "Unlimited" },
  { feature: "CMS connections",       starter: "1",          pro: "3",            agency: "Unlimited" },
  { feature: "LLM Visibility Tracker",starter: false,        pro: true,           agency: true },
  { feature: "AI SEO Editor",         starter: false,        pro: true,           agency: true },
  { feature: "Knowledge Bases",       starter: false,        pro: "3",            agency: "Unlimited" },
  { feature: "White-label reports",   starter: false,        pro: true,           agency: true },
  { feature: "API access",            starter: "100 calls",  pro: "1,000 calls",  agency: "Unlimited" },
  { feature: "Sub-accounts",          starter: false,        pro: "1",            agency: "Unlimited" },
  { feature: "Image storage",         starter: "5 GB",       pro: "25 GB",        agency: "100 GB" },
  { feature: "Support response",      starter: "48h",        pro: "24h",          agency: "4h" },
];

function Cell({ val }: { val: string | boolean }) {
  if (val === true) return <Check className="w-4 h-4 text-blue-500 mx-auto" />;
  if (val === false) return <Minus className="w-4 h-4 text-mkt-muted mx-auto" />;
  return <span className="text-sm text-mkt-muted font-lato">{val}</span>;
}

export default function PricingComparison() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <h2 className="text-2xl font-semibold text-mkt-white mb-6 font-poppins">
        Quick comparison
      </h2>

      <div className="overflow-x-auto bg-mkt-surface border border-mkt-border rounded-2xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-mkt-surface2 border-b border-mkt-border">
            <tr>
              <th className="p-4 text-left font-semibold text-mkt-muted">Feature</th>
              <th className="p-4 text-center font-semibold text-mkt-muted">Starter</th>
              <th className="p-4 text-center font-semibold text-mkt-accent bg-mkt-accent-lite">Pro</th>
              <th className="p-4 text-center font-semibold text-mkt-muted">Agency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mkt-border">
            {summary.map((row) => (
              <tr key={row.feature} className="hover:bg-mkt-surface2 transition-colors">
                <td className="p-4 text-mkt-muted font-lato">{row.feature}</td>
                <td className="p-4 text-center"><Cell val={row.starter} /></td>
                <td className="p-4 text-center bg-mkt-accent-lite"><Cell val={row.pro} /></td>
                <td className="p-4 text-center"><Cell val={row.agency} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
