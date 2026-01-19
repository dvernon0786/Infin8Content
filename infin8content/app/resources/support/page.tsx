import ComingSoonPage from '@/components/shared/ComingSoonPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon | Infin8Content',
  description: 'This page is currently under development.',
};

export default function SupportPage() {
  return <ComingSoonPage title="Support" showCTA={true} />;
}
