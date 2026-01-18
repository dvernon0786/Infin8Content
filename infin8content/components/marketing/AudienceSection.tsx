export default function AudienceSection() {
  return (
    <section className="relative bg-lightGray pt-20 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <p className="text-lg">
          Infin8Content is built for teams that treat content as infrastructure.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-medium">
          <span>SEO teams</span>
          <span>Agencies</span>
          <span>Founders</span>
          <span>Content operators</span>
        </div>
      </div>
    </section>
  );
}
