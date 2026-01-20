import Navigation from './Navigation';
import HeroSection from './HeroSection';
import StatsBar from './StatsBar';
import ProblemSection from './ProblemSection';
import FeatureShowcase from './FeatureShowcase';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

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
