const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Plan",
      description: "Map your content strategy with our intelligent topic planner. Get AI-powered topic suggestions based on your niche, audience, and SEO goals.",
      icon: "📅"
    },
    {
      number: "02", 
      title: "Create",
      description: "Write with AI assistance or let our generator create the first draft. Real-time feedback keeps you on-brand and SEO-optimized.",
      icon: "✍️"
    },
    {
      number: "03",
      title: "Publish", 
      description: "Review, approve, and publish to all your channels with one click. Schedule ahead or go live instantly.",
      icon: "🚀"
    }
  ];

  return (
    <section className="bg-gradient-light section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            From Idea to Published in 3 Simple Steps
          </h2>
          <p className="text-large text-neutral-600 max-w-3xl mx-auto">
            No complicated workflows. No scattered tools. Just results.
          </p>
        </div>

        {/* Desktop: Horizontal flow with connecting lines */}
        <div className="hidden md:flex items-center justify-between relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex-1 relative">
              {/* Step Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-sm mx-auto relative group hover:shadow-xl transition-shadow duration-300">
                {/* Step Number Badge */}
                <div className="absolute -top-5 left-8 w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center text-white font-poppins font-bold text-xl shadow-brand group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="aspect-video bg-gradient-light rounded-lg flex items-center justify-center mb-6 mt-4">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-h3-desktop text-h3-mobile text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-body text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {/* Connecting Line (except for last step) */}
              {idx < steps.length - 1 && (
                <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-brand transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Vertical stack */}
        <div className="md:hidden space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg relative group hover:shadow-xl transition-shadow duration-300">
              {/* Step Number Badge */}
              <div className="absolute -top-5 left-8 w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center text-white font-poppins font-bold text-xl shadow-brand group-hover:scale-110 transition-transform duration-300">
                {step.number}
              </div>
              
              {/* Icon */}
              <div className="aspect-video bg-gradient-light rounded-lg flex items-center justify-center mb-6 mt-4">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-h3-desktop text-h3-mobile text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-body text-neutral-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Below */}
        <div className="text-center mt-12">
          <button className="btn-secondary focus-ring">
            See It In Action
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
