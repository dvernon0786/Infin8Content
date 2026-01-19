"use client"

import Navigation from '@/components/marketing/Navigation';
import Footer from '@/components/marketing/Footer';
import Link from 'next/link';

interface ComingSoonPageProps {
  title: string;
  showCTA?: boolean;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title, showCTA = false }) => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <h1 className="font-poppins font-bold text-6xl text-charcoal mb-6">
            Coming Soon
          </h1>
          
          <p className="font-lato text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            This page is currently under development.
          </p>
          
          <p className="font-lato text-lg text-neutral-500 mb-12 max-w-xl mx-auto">
            We're actively building this section and will make it available soon.
          </p>
          
          {showCTA && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-brandGradient text-white font-poppins font-semibold rounded-lg hover:scale-105 transition-transform duration-300"
              >
                Back to Home
              </Link>
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-electric-blue text-brand-electric-blue font-poppins font-semibold rounded-lg hover:bg-brand-electric-blue hover:text-white transition-colors duration-300"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ComingSoonPage;
