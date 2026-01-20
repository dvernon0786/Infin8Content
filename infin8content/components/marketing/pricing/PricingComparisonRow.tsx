export default function PricingComparisonRow() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-poppins text-neutral-900 mb-4">
          Self-Serve or Fully Managed?
        </h2>
        <p className="text-neutral-600 font-lato max-w-2xl mx-auto">
          Choose the level of involvement that fits your team, time, and growth goals.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8">

        {/* Self-Serve */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          <h3 className="text-xl font-semibold font-poppins text-neutral-900 mb-2">
            Self-Serve Platform
          </h3>

          <p className="text-sm text-neutral-600 font-lato mb-6">
            Best for teams who want full control and speed with AI assistance.
          </p>

          <ul className="space-y-3 text-sm font-lato text-neutral-700">
            <li>• You generate & manage content</li>
            <li>• AI-powered article creation</li>
            <li>• Brand voice & SEO tools</li>
            <li>• Team collaboration features</li>
            <li>• Publish on your schedule</li>
          </ul>

          <div className="mt-8 text-sm text-neutral-500 font-lato">
            Ideal if you already have writers or internal resources.
          </div>
        </div>

        {/* Bespoke */}
        <div className="relative bg-white rounded-2xl border border-[#217CEB]/30 p-8 shadow-lg">

          {/* Badge */}
          <div className="absolute -top-3 left-6 bg-gradient-to-r from-[#217CEB] to-[#4A42CC] text-white text-xs font-semibold px-3 py-1 rounded-full font-lato">
            White-Glove
          </div>

          <h3 className="text-xl font-semibold font-poppins text-neutral-900 mb-2">
            Bespoke AI Content Service
          </h3>

          <p className="text-sm text-neutral-600 font-lato mb-6">
            Best for teams who want results without managing execution.
          </p>

          <ul className="space-y-3 text-sm font-lato text-neutral-700">
            <li>• Strategy + execution handled for you</li>
            <li>• AI + human expert editors</li>
            <li>• Guaranteed performance outcomes</li>
            <li>• Publishing-ready content delivered monthly</li>
            <li>• Dedicated strategist oversight</li>
          </ul>

          <div className="mt-8 text-sm text-neutral-500 font-lato">
            Ideal if speed, ROI, and consistency matter more than hands-on work.
          </div>
        </div>

      </div>
    </section>
  );
}
