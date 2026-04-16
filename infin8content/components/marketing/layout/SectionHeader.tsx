import clsx from "clsx";

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeader({
  label,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "max-w-2xl",
        align === "center" && "mx-auto text-center"
      )}
    >
      {label && (
        <div className="text-xs font-bold uppercase tracking-widest font-lato mb-3 text-(--brand-electric-blue)">
          {label}
        </div>
      )}
      <h2 className="font-poppins text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-4">
        {title}
      </h2>
      {description && (
        <p className="font-lato text-neutral-600 text-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
