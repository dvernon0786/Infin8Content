import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PricingFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Will AI-generated content rank on Google?",
      a: "Yes! Our AI creates original, high-quality content optimized for search engines. We combine AI efficiency with your unique brand voice and expertise to create content that both Google and humans love."
    },
    {
      q: "How does the brand voice feature work?",
      a: "Upload your style guide, sample content, or brand guidelines. Our AI learns your tone, vocabulary, and writing style—then applies it automatically to every piece of content."
    },
    {
      q: "Can I use this for multiple clients/brands?",
      a: "Absolutely. Create unlimited organizations, each with its own brand voice, team members, and content library. Perfect for agencies."
    },
    {
      q: "What if I don't like the AI-generated content?",
      a: "You have full editorial control. Use AI for first drafts, research, or optimization—or write from scratch with AI assistance. The platform adapts to your workflow."
    },
    {
      q: "Do you integrate with my existing tools?",
      a: "Yes. We integrate with WordPress, Medium, LinkedIn, and more. We also offer API access for custom integrations."
    },
    {
      q: "Do you offer a free trial?",
      a: "We operate on a professional, paywall-first model. Choose your plan and get instant access to all features. Cancel anytime if it's not the right fit. Annual plans save up to 33%."
    },
    {
      q: "How is this different from ChatGPT?",
      a: "Infin8Content is a complete content platform, not just a text generator. We provide research tools, SEO optimization, brand voice control, team collaboration, and multi-channel publishing—all in one workflow."
    },
    {
      q: "What kind of support do you offer?",
      a: "All plans include email support. Pro plans get 24h response time, and Agency plans get 4h response time with dedicated account management."
    }
  ];

  return (
    <section className="bg-white section-padding-mobile md:section-padding">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            Questions? We've Got Answers.
          </h2>
          <p className="text-large text-neutral-600 max-w-2xl mx-auto">
            Everything you need to know about Infin8Content
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-neutral-200 rounded-xl overflow-hidden group hover:border-blue-300 transition-all duration-300"
            >
              <button
                className="w-full p-6 text-left font-semibold text-neutral-900 flex items-center justify-between hover:text-blue-600 transition-colors duration-300 focus-ring bg-white hover:bg-neutral-50 group-hover:bg-neutral-50"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="pr-4">{faq.q}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-blue-500 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === idx ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-6 bg-neutral-50 text-body text-neutral-600 leading-relaxed border-t border-neutral-200">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
