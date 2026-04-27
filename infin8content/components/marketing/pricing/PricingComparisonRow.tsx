"use client";

import { Check, Minus } from "lucide-react";

type CellVal = string | boolean | number;

interface Row {
  feature: string;
  category?: string; // section header
  starter: CellVal;
  pro: CellVal;
  agency: CellVal;
  highlight?: boolean; // bold the row
}

const rows: Row[] = [
  // ── Writing ─────────────────────────────────────────────────────────
  { feature: "AI Writing", category: "ai-writing", starter: "", pro: "", agency: "" },
  { feature: "AI article writer", starter: true, pro: true, agency: true },
  { feature: "Credits / month", starter: "1,000", pro: "2,000", agency: "8,000", highlight: true },
  { feature: "Articles / month (est.)", starter: "~10", pro: "~50", agency: "~150" },
  { feature: "150+ languages", starter: true, pro: true, agency: true },
  { feature: "AI SEO Editor", starter: false, pro: true, agency: true },
  { feature: "News Writer", starter: true, pro: true, agency: true },
  { feature: "Video to Blog Post", starter: true, pro: true, agency: true },
  { feature: "Custom content templates", starter: false, pro: true, agency: true },
  { feature: "AI-generated images", starter: true, pro: true, agency: true },
  { feature: "Custom AI image prompts", starter: false, pro: true, agency: true },
  { feature: "Auto-translate", starter: false, pro: true, agency: true },

  // ── Knowledge Base ──────────────────────────────────────────────────
  { feature: "Knowledge Base", category: "knowledge", starter: "", pro: "", agency: "" },
  { feature: "Knowledge bases", starter: false, pro: "3", agency: "Unlimited" },
  { feature: "Upload websites, PDFs, docs", starter: false, pro: true, agency: true },
  { feature: "Brand voice training", starter: false, pro: true, agency: true },

  // ── Automation ──────────────────────────────────────────────────────
  { feature: "Automation", category: "automation", starter: "", pro: "", agency: "" },
  { feature: "AutoPublish campaigns", starter: "1", pro: "5", agency: "Unlimited", highlight: true },
  { feature: "RSS / keyword / news feeds", starter: true, pro: true, agency: true },
  { feature: "Auto-social posting", starter: true, pro: true, agency: true },
  { feature: "Google fast-indexing", starter: true, pro: true, agency: true },
  { feature: "AI SEO Agent (autopilot)", starter: false, pro: true, agency: true },
  { feature: "Schema markup injection", starter: false, pro: true, agency: true },
  { feature: "Internal link automation", starter: true, pro: true, agency: true },
  { feature: "Broken link repair", starter: false, pro: true, agency: true },

  // ── LLM Visibility ──────────────────────────────────────────────────
  { feature: "LLM Brand Visibility", category: "llm", starter: "", pro: "", agency: "" },
  { feature: "LLM Brand Visibility Tracker", starter: false, pro: true, agency: true, highlight: true },
  { feature: "LLM prompts tracked / mo", starter: "—", pro: "25", agency: "Unlimited" },
  { feature: "Platforms (ChatGPT, Perplexity…)", starter: "—", pro: "6 platforms", agency: "6 platforms" },
  { feature: "Competitor tracking", starter: false, pro: "3 competitors", agency: "Unlimited" },
  { feature: "Sentiment analysis", starter: false, pro: true, agency: true },
  { feature: "White-label LLM reports", starter: false, pro: false, agency: true },

  // ── Publishing ──────────────────────────────────────────────────────
  { feature: "Publishing & Integrations", category: "publishing", starter: "", pro: "", agency: "" },
  { feature: "CMS connections", starter: "1", pro: "3", agency: "Unlimited" },
  { feature: "WordPress, Shopify, Webflow…", starter: true, pro: true, agency: true },
  { feature: "Zapier integration", starter: true, pro: true, agency: true },
  { feature: "Webhooks", starter: false, pro: true, agency: true },
  { feature: "Public API access", starter: false, pro: false, agency: true },
  { feature: "API calls / month", starter: "100", pro: "1,000", agency: "Unlimited" },

  // ── Team & Agency ─────────────────────────────────────────────────────
  { feature: "Team & Agency", category: "team", starter: "", pro: "", agency: "" },
  { feature: "Projects", starter: "1", pro: "5", agency: "Unlimited" },
  { feature: "Team members", starter: "1", pro: "3", agency: "Unlimited" },
  { feature: "Sub-accounts / clients", starter: "—", pro: "1", agency: "Unlimited" },
  { feature: "Unlimited workspaces", starter: false, pro: false, agency: true },
  { feature: "White-label & custom domain", starter: false, pro: false, agency: true },
  { feature: "Client portal", starter: false, pro: false, agency: true },
  { feature: "White-label SEO reports", starter: false, pro: true, agency: true },

  // ── Storage & Support ───────────────────────────────────────────────────
  { feature: "Storage & Support", category: "support", starter: "", pro: "", agency: "" },
  { feature: "Image storage", starter: "5 GB", pro: "25 GB", agency: "100 GB" },
  { feature: "Support response time", starter: "48h", pro: "24h", agency: "4h" },
  { feature: "Live chat on Slack", starter: false, pro: false, agency: true },
  { feature: "Strategy support", starter: false, pro: false, agency: true },
  { feature: "99.9% uptime SLA", starter: false, pro: false, agency: true },
];

function Cell({ val }: { val: CellVal }) {
  if (val === "") return null;
  if (val === true) return <Check className="w-4 h-4 text-blue-500 mx-auto" />;
  if (val === false) return <Minus className="w-4 h-4 text-neutral-300 mx-auto" />;
  return <span className="text-sm text-neutral-700 font-lato">{String(val)}</span>;
}

export default function PricingComparisonRow() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-semibold text-mkt-white font-poppins">
          Compare plans in full
        </h2>
        <p className="text-sm text-mkt-muted font-lato hidden md:block">
          Every feature, side by side
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-mkt-border shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mkt-surface2 border-b border-mkt-border">
              <th className="p-4 text-left font-semibold text-mkt-muted w-[40%]">
                Feature
              </th>
              {["Starter", "Pro", "Agency"].map((name) => (
                <th
                  key={name}
                  className={`p-4 text-center font-semibold ${
                    name === "Pro"
                      ? "text-mkt-accent bg-mkt-accent-lite"
                      : "text-mkt-muted"
                  }`}
                >
                  {name}
                  {name === "Pro" && (
                    <span className="block text-[10px] font-normal text-mkt-accent mt-0.5">
                      Most Popular
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-mkt-surface divide-y divide-mkt-border">
            {rows.map((row, i) => {
              // Section header row
              if (row.category) {
                return (
                  <tr key={`${row.category}-${i}`} className="bg-mkt-surface2">
                    <td
                      colSpan={4}
                      className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-mkt-muted2"
                    >
                      {row.feature}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={row.feature}
                  className={`transition-colors hover:bg-mkt-surface2 ${
                    row.highlight ? "bg-mkt-accent-lite" : ""
                  }`}
                >
                  <td
                    className={`p-4 font-lato ${
                      row.highlight
                        ? "font-semibold text-mkt-white"
                        : "text-mkt-muted"
                    }`}
                  >
                    {row.feature}
                    {row.feature === "LLM Brand Visibility Tracker" && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-linear-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center"><Cell val={row.starter} /></td>
                  <td
                    className={`p-4 text-center ${row.pro === true || (typeof row.pro === "string" && row.pro !== "—") ? "bg-blue-50/40" : ""}`}
                  >
                    <Cell val={row.pro} />
                  </td>
                  <td className="p-4 text-center"><Cell val={row.agency} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
