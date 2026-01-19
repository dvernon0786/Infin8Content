import ComingSoonPage from '@/components/shared/ComingSoonPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon | Infin8Content',
  description: 'This page are currently under development.',
};

export default function TermsPage() {
  return <ComingSoonPage title="Terms" showCTA={false} />;
}
