import { X } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      title: "Slow & Scattered",
      icon: "🐌",
      points: [
        "Writers juggling 5+ tools",
        "Hours lost to context switching",
        "Inconsistent workflows across teams",
        "Missed deadlines, frustrated stakeholders"
      ]
    },
    {
      title: "Quality Inconsistency",
      icon: "❌",
      points: [
        "Off-brand content going live",
        "Every article sounds different",
        "No quality control at scale",
        "Endless revision cycles"
      ]
    },
    {
      title: "SEO Guesswork",
      icon: "🎯",
      points: [
        "Publishing without data",
        "Content that doesn't rank",
        "No idea what's working",
        "Traffic stuck in neutral"
      ]
    }
  ];

  return (
    <section className="bg-neutral-50 section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            Content Creation Shouldn't Feel This Hard
          </h2>
          <p className="text-large text-neutral-600 max-w-3xl mx-auto">
            Your content team deserves better. So do your readers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, idx) => (
            <div key={idx} className="card hover-lift group">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  {problem.icon}
                </div>
                <h3 className="text-h3-desktop text-h3-mobile text-neutral-900 group-hover:text-blue-600 transition-colors duration-300">
                  {problem.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {problem.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-neutral-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-large text-neutral-700 italic max-w-2xl mx-auto">
            Stop fighting the chaos. Start creating content that converts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
