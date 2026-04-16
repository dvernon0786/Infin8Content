import Link from "next/link";

export interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
}

interface MegaMenuProps {
  items: MegaMenuItem[];
}

export default function MegaMenu({ items }: MegaMenuProps) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-160 bg-white shadow-xl border border-(--neutral-200) rounded-xl p-4 grid grid-cols-2 gap-2 z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="p-3 rounded-lg hover:bg-neutral-100 transition-colors group block"
        >
          <div className="font-poppins font-semibold text-neutral-900 text-sm group-hover:text-(--brand-electric-blue) transition-colors">
            {item.label}
          </div>
          <div className="font-lato text-sm text-neutral-600 mt-0.5">
            {item.description}
          </div>
        </Link>
      ))}
    </div>
  );
}
