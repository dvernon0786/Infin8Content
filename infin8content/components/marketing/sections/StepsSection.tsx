import SectionWrapper from "../layout/SectionWrapper";
import SectionHeader from "../layout/SectionHeader";

interface Step {
  title: string;
  desc: string;
}

interface StepsSectionProps {
  title: string;
  description?: string;
  steps: Step[];
  variant?: "default" | "gradient" | "surface" | "dark";
}

export default function StepsSection({
  title,
  description,
  steps,
  variant = "gradient",
}: StepsSectionProps) {
  return (
    <SectionWrapper variant={variant}>
      <SectionHeader title={title} description={description} align="center" />
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {steps.map((step, i) => (
          <div
            key={i}
            className="card hover-lift"
          >
            <div className="text-sm font-bold font-lato mb-2 text-(--brand-electric-blue)">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="font-poppins font-semibold text-lg text-neutral-900 mb-2">
              {step.title}
            </h3>
            <p className="font-lato text-neutral-600 text-sm leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
