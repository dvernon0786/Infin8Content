import { TrendingUp } from 'lucide-react';

const FeatureShowcase = () => {
  const features = [
    {
      title: "Write Smarter, Not Harder",
      subtitle: "AI Article Generator",
      description: "Generate SEO-optimized articles in minutes with AI that matches your brand voice, tone, and style guidelines automatically.",
      benefit: "10x faster first drafts",
      icon: "✍️"
    },
    {
      title: "Stay On-Brand, Every Time",
      subtitle: "Brand Voice Engine",
      description: "Upload your style guide once. Every piece of content—from every team member—automatically follows your brand standards.",
      benefit: "100% brand consistency",
      icon: "🎯"
    },
    {
      title: "Research Built In",
      subtitle: "Research Assistant",
      description: "Stop Googling. Our AI pulls relevant data, stats, and sources directly into your editor while you write.",
      benefit: "Cut research time by 70%",
      icon: "🔍"
    },
    {
      title: "Rank Higher, Faster",
      subtitle: "SEO Optimization",
      description: "Real-time SEO scoring, keyword suggestions, and content analysis ensure every article is optimized before you hit publish.",
      benefit: "Average 45% traffic increase",
      icon: "📈"
    },
    {
      title: "Team Collaboration",
      subtitle: "Workflow Management",
      description: "Streamline approvals, share drafts, and collaborate seamlessly with your entire content team in one unified workspace.",
      benefit: "50% faster approvals",
      icon: "👥"
    },
    {
      title: "Multi-Channel Publishing",
      subtitle: "Distribution Hub",
      description: "Publish to WordPress, Medium, LinkedIn, and more with one click. Schedule ahead or go live instantly.",
      benefit: "Save 5+ hours/week",
      icon: "🚀"
    }
  ];

  return (
    <section className="bg-white section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            One Platform. Infinite Possibilities.
          </h2>
          <p className="text-large text-neutral-600 max-w-3xl mx-auto">
            Infin8Content brings planning, creation, collaboration, and publishing together—powered by AI that understands your brand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group relative bg-neutral-50 p-8 rounded-xl border-2 border-neutral-200 hover:border-blue-500 hover:shadow-brand hover:scale-102 transition-all duration-300 overflow-hidden">
              {/* Gradient Accent Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon Container */}
              <div className="w-16 h-16 bg-gradient-light rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="text-3xl bg-gradient-brand bg-clip-text text-transparent font-bold">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-gradient-brand text-white text-small font-semibold rounded-full">
                  {feature.subtitle}
                </div>
                
                <h3 className="text-h3-desktop text-h3-mobile text-neutral-900 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-body text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 text-small font-semibold rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4" />
                  {feature.benefit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
