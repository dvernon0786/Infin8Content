import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section
      className="relative py-32 px-6 text-white"
      style={{ backgroundColor: "#2C2C2E" }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl font-semibold">
          Build a content engine that scales with you.
        </h2>

        <Link
          href="/register"
          className="inline-block px-8 py-4 rounded-md font-medium bg-brandGradient text-white"
        >
          Start generating content
        </Link>
      </div>
    </section>
  );
}
