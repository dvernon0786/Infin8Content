import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Logo & Tagline */}
        <div className="flex flex-col items-center mb-12">
          <Link href="/" aria-label="Go to homepage" className="flex items-center gap-4 mb-4 cursor-pointer">
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
          </Link>
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

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 hover:bg-gradient-brand hover:text-white hover:scale-110 transition-all duration-300"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 hover:bg-gradient-brand hover:text-white hover:scale-110 transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 hover:bg-gradient-brand hover:text-white hover:scale-110 transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 hover:bg-gradient-brand hover:text-white hover:scale-110 transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
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

export default Footer;
