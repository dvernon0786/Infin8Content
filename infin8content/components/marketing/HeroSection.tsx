const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-mesh section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center min-h-[80vh]">
          {/* Left Column - Content (60% on desktop) */}
          <div className="md:col-span-3 text-center md:text-left">
            <h1 className="text-h1-responsive text-neutral-900 mb-6">
              Create Content That Converts—<br />Without the Chaos
            </h1>
            
            <p className="text-large text-neutral-600 mb-8 max-w-2xl md:mx-0">
              Infin8Content is the AI-powered content platform that helps marketing teams plan, create, and publish high-quality articles at scale—with your brand voice intact.
            </p>

            <p className="text-body text-neutral-600 mb-8 max-w-2xl md:mx-0">
              Stop wrestling with scattered tools, inconsistent quality, and endless revisions. Start creating content that drives results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12">
              <button className="btn-primary focus-ring">
                Get Started
              </button>
              <button className="btn-secondary focus-ring">
                See Pricing
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full bg-gradient-brand border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ marginLeft: i > 1 ? '-8px' : '0' }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-small text-neutral-500">
                💳 Secure payment via Stripe • 🔒 Cancel anytime
              </p>
            </div>
          </div>

          {/* Right Column - Visual (40% on desktop) */}
          <div className="md:col-span-2 flex justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
              <div className="aspect-video bg-gradient-light rounded-lg flex items-center justify-center mb-4">
                <div className="text-6xl">📊</div>
              </div>
              <p className="text-center text-small text-blue-500 font-semibold">
                Dashboard Preview
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-brand rounded-full"></div>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-purple-500 rounded-full"></div>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full w-5/6 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
