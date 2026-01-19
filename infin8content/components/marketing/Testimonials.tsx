import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Infin8Content helped us increase our content output by 400% while maintaining quality. Our SEO rankings have never been better.",
      name: "Sarah Chen",
      role: "Head of Content @ TechFlow",
      metric: "+400% Output",
      avatar: "SC"
    },
    {
      quote: "The brand voice feature is a game-changer. Every article sounds like us, no matter who writes it.",
      name: "Marcus Rodriguez", 
      role: "Marketing Director @ GrowthLabs",
      metric: "100% Brand Consistency",
      avatar: "MR"
    },
    {
      quote: "We went from 2 articles per week to 2 per day. Same team. Better results.",
      name: "Emma Thompson",
      role: "Founder @ ContentCo Agency", 
      metric: "10x Faster",
      avatar: "ET"
    }
  ];

  return (
    <section className="bg-neutral-50 section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            Loved by Content Teams Worldwide
          </h2>
          <p className="text-large text-neutral-600 max-w-3xl mx-auto">
            Join 10,000+ content creators who trust Infin8Content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="card hover-lift group relative">
              {/* Quote Mark */}
              <div className="absolute top-6 left-6 text-6xl text-purple-200 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
                "
              </div>
              
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-large text-neutral-700 leading-relaxed mb-6 italic group-hover:text-neutral-800 transition-colors duration-300">
                "{testimonial.quote}"
              </p>
              
              {/* Author Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-brand border-3 border-white flex items-center justify-center text-white font-bold shadow-brand group-hover:scale-110 transition-transform duration-300">
                    {testimonial.avatar}
                  </div>
                  
                  {/* Author Info */}
                  <div>
                    <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors duration-300">
                      {testimonial.name}
                    </div>
                    <div className="text-small text-neutral-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                
                {/* Metric Badge */}
                <div className="absolute top-6 right-6 px-3 py-1 bg-blue-100 text-blue-700 text-small font-semibold rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  {testimonial.metric}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
