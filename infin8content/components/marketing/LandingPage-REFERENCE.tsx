"use client"

import React, { useState } from 'react';
import { ChevronDown, Menu, X, Zap, Clock, Star, Users, TrendingUp } from 'lucide-react';

// ========================================
// NAVIGATION COMPONENT
// ========================================
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/infin8content-logo.png" 
              alt="Infin8Content Logo"
              style={{ 
                width: '192px', 
                height: '41px',
                borderRadius: '6px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Desktop Menu */}
          <div style={{ alignItems: 'center', gap: '2rem' }} className="hidden md:flex">
            <div style={{ position: 'relative' }}>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  color: '#2C2C2E', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '1rem' 
                }}
                onMouseEnter={() => setFeaturesOpen(true)}
                onMouseLeave={() => setFeaturesOpen(false)}
              >
                Features <ChevronDown style={{ width: '16px', height: '16px' }} />
              </button>
              {featuresOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    width: '224px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F4F4F6',
                    padding: '0.5rem 0'
                  }}
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <a href="/features/ai-article-generator" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>AI Article Generator</a>
                  <a href="/features/brand-voice-engine" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Brand Voice Engine</a>
                  <a href="/features/research-assistant" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Research Assistant</a>
                  <a href="/features/seo-optimization" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>SEO Optimization</a>
                </div>
              )}
            </div>

            <button 
              style={{
                background: 'linear-gradient(to right, #217CEB, #4A42CC)',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

// ========================================
// HERO SECTION COMPONENT
// ========================================
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12">
              <button className="btn-primary focus-ring">
                Get Started
              </button>
              <button className="btn-secondary focus-ring">
                See Pricing
              </button>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ========================================
// STATS BAR COMPONENT
// ========================================
const StatsBar = () => {
  const stats = [
    { icon: <Zap className="w-12 h-12" />, value: "500K+", label: "Articles Created" },
    { icon: <Clock className="w-12 h-12" />, value: "80%", label: "Faster Creation" },
    { icon: <Star className="w-12 h-12" />, value: "4.8/5", label: "User Rating" },
    { icon: <Users className="w-12 h-12" />, value: "50+", label: "Team Seats" },
  ];

  return (
    <section className="bg-white border-y border-neutral-200 section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div className="flex justify-center mb-3 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="text-h3-desktop text-h3-mobile text-neutral-900 font-bold mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-small text-neutral-600 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========================================
// PROBLEM SECTION COMPONENT
// ========================================
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
      </div>
    </section>
  );
};

// ========================================
// FEATURE SHOWCASE COMPONENT
// ========================================
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

// ========================================
// HOW IT WORKS COMPONENT
// ========================================
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
      </div>
    </section>
  );
};

// ========================================
// TESTIMONIALS COMPONENT
// ========================================
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

// ========================================
// FAQ COMPONENT
// ========================================
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Will AI-generated content rank on Google?",
      a: "Yes! Our AI creates original, high-quality content optimized for search engines. We combine AI efficiency with your unique brand voice and expertise to create content that both Google and humans love."
    },
    {
      q: "How does the brand voice feature work?",
      a: "Upload your style guide, sample content, or brand guidelines. Our AI learns your tone, vocabulary, and writing style—then applies it automatically to every piece of content."
    },
    {
      q: "Can I use this for multiple clients/brands?",
      a: "Absolutely. Create unlimited organizations, each with its own brand voice, team members, and content library. Perfect for agencies."
    },
    {
      q: "What if I don't like the AI-generated content?",
      a: "You have full editorial control. Use AI for first drafts, research, or optimization—or write from scratch with AI assistance. The platform adapts to your workflow."
    },
    {
      q: "Do you integrate with my existing tools?",
      a: "Yes. We integrate with WordPress, Medium, LinkedIn, and more. We also offer API access for custom integrations."
    },
    {
      q: "Do you offer a free trial?",
      a: "We operate on a professional, paywall-first model. Choose your plan and get instant access to all features. Cancel anytime if it's not the right fit. Annual plans save up to 33%."
    }
  ];

  return (
    <section className="bg-white section-padding-mobile md:section-padding">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-h2-responsive text-neutral-900 mb-4">
            Questions? We've Got Answers.
          </h2>
          <p className="text-large text-neutral-600 max-w-2xl mx-auto">
            Everything you need to know about Infin8Content
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-neutral-200 rounded-xl overflow-hidden group hover:border-blue-300 transition-all duration-300"
            >
              <button
                className="w-full p-6 text-left font-semibold text-neutral-900 flex items-center justify-between hover:text-blue-600 transition-colors duration-300 focus-ring bg-white hover:bg-neutral-50 group-hover:bg-neutral-50"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="pr-4">{faq.q}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-blue-500 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === idx ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-6 bg-neutral-50 text-body text-neutral-600 leading-relaxed border-t border-neutral-200">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========================================
// FINAL CTA COMPONENT
// ========================================
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
      </div>
    </section>
  );
};

// ========================================
// FOOTER COMPONENT
// ========================================
const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Logo & Tagline */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="/infin8content-logo.png" 
              alt="Infin8Content Logo"
              style={{ 
                width: '176px', 
                height: '40px',
                borderRadius: '6px',
                objectFit: 'contain'
              }}
            />
          </div>
          <p className="text-small text-neutral-400 text-center max-w-md">
            AI-powered content creation platform for modern marketing teams
          </p>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product Column */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/features/ai-article-generator" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  AI Article Generator
                </a>
              </li>
              <li>
                <a href="/features/brand-voice-engine" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Brand Voice Engine
                </a>
              </li>
              <li>
                <a href="/features/research-assistant" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Research Assistant
                </a>
              </li>
              <li>
                <a href="/features/seo-optimization" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  SEO Optimization
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/solutions/content-marketing" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Marketing Teams
                </a>
              </li>
              <li>
                <a href="/solutions/content-marketing" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Content Writers
                </a>
              </li>
              <li>
                <a href="/solutions/seo-teams" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  SEO Teams
                </a>
              </li>
              <li>
                <a href="/solutions/agencies" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Agencies
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/resources/documentation" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/resources/blog" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Blog
                </a>
              </li>
              <li>
                <a href="/resources/tutorials" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="/resources/support" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  About
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/contact" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Contact
                </a>
              </li>
              <li>
                <a href="/careers" className="text-neutral-300 hover:text-blue-400 transition-colors duration-300 text-small">
                  Careers
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-4">
              <span className="text-small text-neutral-500">
                © 2026 Infin8Content. All rights reserved.
              </span>
            </div>

            {/* Legal Links */}
            <div className="flex gap-6">
              <a href="/privacy" className="text-small text-neutral-500 hover:text-blue-400 transition-colors duration-300">
                Privacy
              </a>
              <a href="/terms" className="text-small text-neutral-500 hover:text-blue-400 transition-colors duration-300">
                Terms
              </a>
              <a href="/security" className="text-small text-neutral-500 hover:text-blue-400 transition-colors duration-300">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ========================================
// MAIN LANDING PAGE COMPONENT
// ========================================
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F4F6' }}>
      <Navigation />
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <FeatureShowcase />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
