import ComingSoonPage from '@/components/shared/ComingSoonPage';
import Navigation from '@/components/marketing/Navigation';
import Footer from '@/components/marketing/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon | Infin8Content',
  description: 'This page is currently under development.',
};

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <ComingSoonPage title="Contact" showCTA={true} />
      <Footer />
    </>
  );
}
