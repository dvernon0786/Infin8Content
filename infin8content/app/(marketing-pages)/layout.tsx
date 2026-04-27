import MarketingShell from '@/components/marketing/MarketingShell';

export default function MarketingPagesLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
