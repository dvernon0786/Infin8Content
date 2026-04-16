import SectionWrapper from "../layout/SectionWrapper";
import SectionHeader from "../layout/SectionHeader";
import CTASection from "../sections/CTASection";

interface Benefit {
  title: string;
  desc: string;
}

interface UseCase {
  title: string;
  desc: string;
}

interface SolutionPageTemplateProps {
  hero: {
    title: string;
    description: string;
  };
  problem: {
    title: string;
    body: string;
  };
  benefits: Benefit[];
  useCases?: UseCase[];
}

export default function SolutionPageTemplate({
  hero,
  problem,
  benefits,
  useCases,
}: SolutionPageTemplateProps) {
  return (
    <>
      {/* HERO */}
      <SectionWrapper variant="gradient">
        <div className="max-w-3xl">
          <h1 className="font-poppins text-5xl font-bold text-neutral-900 leading-tight mb-6">
            {hero.title}
          </h1>
          <p className="font-lato text-lg text-neutral-600 leading-relaxed mt-4">
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

      {/* BENEFITS */}
      <SectionWrapper variant="surface">
        <SectionHeader title="What You Get" align="center" />
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {benefits.map((b, i) => (
            <div key={i} className="card">
              <h3 className="font-poppins font-semibold text-neutral-900 mb-2">
                {b.title}
              </h3>
              <p className="font-lato text-sm text-neutral-600 leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* USE CASES */}
      {useCases && useCases.length > 0 && (
        <SectionWrapper>
          <SectionHeader title="How Teams Use It" align="center" />
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {useCases.map((uc, i) => (
              <div key={i} className="card">
                <h3 className="font-poppins font-semibold text-neutral-900 mb-2">
                  {uc.title}
                </h3>
                <p className="font-lato text-sm text-neutral-600 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </SectionWrapper>
      )}

      <CTASection />
    </>
  );
}
