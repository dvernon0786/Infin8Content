const FinalCTA = () => {
  return (
    <section className="bg-gradient-vibrant section-padding-mobile md:section-padding relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-300 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-h1-responsive text-white mb-6">
          Ready to Scale Your Content? Get Started Today.
        </h2>
        <p className="text-large text-white/90 mb-8 max-w-2xl mx-auto">
          Join 10,000+ content teams creating better content, faster.
        </p>

        <button className="btn-primary bg-white text-neutral-900 hover:scale-105 focus-ring mb-8 text-lg px-8 py-4 shadow-xl">
          Get Started Now
        </button>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-white/80 text-small">
            <span className="text-xl">💳</span>
            <span>Secure payment via Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-small">
            <span className="text-xl">🔒</span>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-small">
            <span className="text-xl">⚡</span>
            <span>Instant access</span>
          </div>
        </div>

        {/* Bonus Incentive */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-400/30">
          <span className="text-lg">🎁</span>
          <span className="text-small font-medium">
            Annual plans save up to 33% • Switch or cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
