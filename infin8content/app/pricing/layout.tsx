import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
      <Footer />
    </>
  );
}
