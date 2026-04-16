import SectionWrapper from "../layout/SectionWrapper";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <SectionWrapper variant="brand" className="text-center">
      <h2 className="font-poppins text-4xl font-bold text-white mb-4">
        Start building content that earns authority
      </h2>
      <p className="font-lato text-white/80 mb-8 text-lg max-w-xl mx-auto">
        One trial article included. No credit card required.
      </p>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-lg font-bold font-lato text-base shadow-lg hover:shadow-xl transition-shadow"
        >
          Start Free Trial <ArrowRight size={16} />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-6 py-3 rounded-lg font-bold font-lato text-base hover:bg-white/10 transition-colors"
        >
          View Pricing
        </Link>
      </div>
    </SectionWrapper>
  );
}
