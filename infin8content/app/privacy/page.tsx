import ComingSoonPage from '@/components/shared/ComingSoonPage';
import Navigation from '@/components/marketing/Navigation';
import Footer from '@/components/marketing/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon | Infin8Content',
  description: 'This page is currently under development.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <ComingSoonPage title="Privacy" showCTA={false} />
      <Footer />
    </>
  );
}
