"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Will AI-generated content rank on Google?",
    a: "Yes. Google rewards high-quality, helpful content regardless of how it's produced. Infin8Content creates structured, factual, and SEO-optimized articles that follow Google's E-E-A-T guidelines. Every plan includes brand voice training so your content sounds authentically human — not generic AI.",
  },
  {
    q: "What is the LLM Brand Visibility Tracker and which plans include it?",
    a: "The LLM Brand Visibility Tracker monitors how ChatGPT, Perplexity, Gemini, Claude, Grok, and Google AI Overviews mention and recommend your brand. It tracks share-of-voice, sentiment, citations, and competitor mentions. It's included in the Pro and Agency plans — and unlike other tools that charge $99–199 per AI platform, all 6 platforms are included in one price.",
  },
  {
    q: "What are credits and how do they work?",
    a: "Credits are consumed each time you generate content, run the AI SEO Agent, or use other AI-powered features. Starter gets 1,000 credits/month (~10 full articles), Pro gets 2,000 (~50 articles), and Agency gets 8,000 (~150 articles). Unused credits do not roll over, but you can upgrade at any time to unlock more.",
  },
  {
    q: "How does AutoPublish work?",
    a: "AutoPublish lets you set up a campaign that automatically generates and publishes SEO-optimized content to your CMS on a schedule you define. You connect a feed source (RSS, keywords, YouTube videos, news events), set your publishing frequency, and Infin8Content handles the rest — writing, image generation, linking, and publishing.",
  },
  {
    q: "Can I use this for multiple clients?",
    a: "Yes. Pro includes 1 sub-account and 5 projects. Agency includes unlimited sub-accounts, unlimited workspaces, a client portal, and white-label reports — built specifically for agencies managing multiple clients from one dashboard.",
  },
  {
    q: "What CMS platforms do you integrate with?",
    a: "We integrate natively with WordPress, Shopify, Ghost, Webflow, Wix, Squarespace, and Blogger. We also support Zapier (connects to 5,000+ tools), webhooks, and a public API (Agency plan) for fully custom integrations.",
  },
  {
    q: "How does the brand voice feature work?",
    a: "Upload your style guide, sample articles, website URL, or brand documents. Our AI enters a learning phase to understand your tone, vocabulary, and content patterns — then applies them automatically to every piece of content generated for that project.",
  },
  {
    q: "How is Infin8Content different from ChatGPT or other AI writers?",
    a: "Infin8Content is a complete, end-to-end content operations system — not a text generator. ChatGPT gives you text. Infin8Content automates the full workflow: keyword research, brief generation, writing in your brand voice, adding images and links, CMS publishing, scheduling, LLM visibility tracking, SEO fixes via the AI Agent, and white-label client reporting.",
  },
  {
    q: "Do you offer a free trial?",
    a: "We offer a $1 trial for 3 days on Starter and Pro plans. This gives you full access to every feature in your plan — enough to publish your first articles and see results. Cancel any time with no questions asked.",
  },
  {
    q: "What kind of support do you provide?",
    a: "Starter plans receive email support with a 48h response time. Pro plans get 24h response. Agency plans get a 4h response time plus live chat on Slack and access to strategy support from our team.",
  },
  {
    q: "Can the AI SEO Agent break my site?",
    a: "No. The AI SEO Agent makes targeted improvements — meta tags, schema markup, alt texts, canonical tags, internal links — that are completely reversible. You can review a log of all changes before or after they're applied, and roll back any individual fix.",
  },
  {
    q: "What is the Bespoke AI Content Service?",
    a: "It's a done-for-you service starting at $2,000/month where our human strategists manage your entire content operation using Infin8Content. You get 10–20 published articles per month, an in-depth topic cluster, LLM visibility reporting, and a 25% traffic growth guarantee in 90 days — or you don't pay. Only 10 companies are accepted per cohort.",
  },
];

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-24 border-t border-neutral-100">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 font-poppins">
            Questions? We&apos;ve got answers.
          </h2>
          <p className="text-base text-neutral-600 max-w-xl mx-auto mt-4 font-lato">
            Everything you need to know about Infin8Content pricing and features.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-neutral-200 rounded-2xl overflow-hidden group hover:border-blue-300 transition-all duration-200"
            >
              <button
                className="w-full p-6 text-left font-semibold text-neutral-900 flex items-center justify-between hover:text-blue-600 transition-colors duration-200 bg-white hover:bg-neutral-50/60 focus:outline-none"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="pr-4 text-sm md:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-blue-500 transition-transform duration-300 shrink-0 ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === idx ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="p-6 pt-0 bg-neutral-50 text-sm text-neutral-600 leading-relaxed font-lato border-t border-neutral-100">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center bg-linear-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-8">
          <p className="text-sm font-semibold text-neutral-700 mb-1">
            Still have questions?
          </p>
          <p className="text-sm text-neutral-500 font-lato mb-5">
            Our team typically responds within a few hours.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="mailto:hello@infin8content.com"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(to right,#217CEB,#4A42CC)" }}
            >
              Email us
            </a>
            <a
              href="/call"
              className="text-sm font-semibold text-blue-600 border border-blue-200 bg-white px-5 py-2.5 rounded-xl hover:border-blue-400 transition-colors"
            >
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
