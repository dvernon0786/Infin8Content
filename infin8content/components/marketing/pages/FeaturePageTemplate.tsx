import SectionWrapper from "../layout/SectionWrapper";
import SectionHeader from "../layout/SectionHeader";
import StepsSection from "../sections/StepsSection";
import CTASection from "../sections/CTASection";
import FAQSection, { type FAQItem } from "../sections/FAQSection";

interface Step {
  title: string;
  desc: string;
}

interface DeepDiveItem {
  title: string;
  desc: string;
}

interface FeaturePageTemplateProps {
  hero: {
    title: string;
    description: string;
  };
  problem: {
    title: string;
    body: string;
  };
  steps: Step[];
  deepDive: DeepDiveItem[];
  differentiators: string[];
  faq: FAQItem[];
}

export default function FeaturePageTemplate({
  hero,
  problem,
  steps,
  deepDive,
  differentiators,
  faq,
}: FeaturePageTemplateProps) {
  return (
    <>
      {/* HERO */}
      <SectionWrapper variant="gradient">
        <div className="max-w-3xl">
          <h1 className="font-poppins text-5xl font-bold text-neutral-900 leading-tight mb-6">
            {hero.title}
          </h1>
          <p className="font-lato text-lg text-neutral-600 leading-relaxed">
            {hero.description}
          </p>
        </div>
      </SectionWrapper>

      {/* PROBLEM */}
      <SectionWrapper>
        <SectionHeader title={problem.title} />
        <p className="font-lato text-neutral-600 mt-6 max-w-2xl text-lg leading-relaxed">
          {problem.body}
        </p>
      </SectionWrapper>

      {/* HOW IT WORKS */}
      <StepsSection title="How It Works" steps={steps} />

      {/* DEEP DIVE */}
      <SectionWrapper>
        <SectionHeader title="Inside the System" align="center" />
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {deepDive.map((item, i) => (
            <div key={i} className="card">
              <h3 className="font-poppins font-semibold text-lg text-neutral-900 mb-2">
                {item.title}
              </h3>
              <p className="font-lato text-neutral-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* DIFFERENTIATORS */}
      <SectionWrapper variant="surface">
        <SectionHeader title="Why This Is Different" />
        <ul className="mt-8 space-y-3">
          {differentiators.map((d, i) => (
            <li key={i} className="flex items-start gap-3 font-lato text-neutral-700">
              <span className="mt-0.5 text-(--brand-electric-blue) font-bold">✓</span>
              {d}
            </li>
          ))}
        </ul>
      </SectionWrapper>

      <CTASection />

      {/* FAQ */}
      <FAQSection title="Frequently Asked Questions" items={faq} />
    </>
  );
}
