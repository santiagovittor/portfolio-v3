import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/app/work/case-studies";
import { tastes, type TasteCategory } from "@/content/bible/taste";
import { links } from "@/app/links";

export function ProjectCard({ slug }: { slug: string }) {
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return null; // unknown slug: render nothing, never crash
  return (
    <figure className="plate mt-6 bg-white/40 md:max-w-md">
      <Image
        src={cs.cover.src}
        alt={cs.cover.alt}
        sizes="(min-width: 768px) 28rem, 90vw"
        className="aspect-[3/2] w-full object-cover"
      />
      <figcaption className="p-4">
        <p className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{cs.name}</span>
          <span className="tape-caption">{cs.year}</span>
        </p>
        <p className="mt-1 text-sm text-shadow-ink">{cs.summary}</p>
        <p className="mt-3 text-sm">
          <Link href={`/work/${cs.slug}`} className="link-draw font-medium">
            Read case study
          </Link>
        </p>
      </figcaption>
    </figure>
  );
}

export function TasteCard({ category }: { category: TasteCategory }) {
  const t = tastes[category];
  if (!t) return null;
  return (
    <figure className="plate mt-6 bg-white/40 p-4 md:max-w-md">
      <figcaption className="tape-label">{t.title}</figcaption>
      <ul className="mt-3 space-y-2">
        {t.items.map((item) => (
          <li key={item.name} className="flex items-baseline justify-between gap-4">
            <span className="font-medium">{item.name}</span>
            <span className="tape-caption text-right text-sm">{item.note}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function ContactCard() {
  const rows = [
    { label: "Email", href: links.email, note: "answered first" },
    { label: "WhatsApp", href: links.whatsapp, note: "fastest for projects" },
    { label: "LinkedIn", href: links.linkedin, note: "roles and referrals" },
    { label: "Services site", href: links.store, note: "for business projects" },
  ];
  return (
    <div className="plate mt-6 bg-white/40 p-4 md:max-w-md">
      <p className="tape-label">Reach the real one</p>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="border-t border-shadow-ink/15 first:border-t-0">
            <a
              href={r.href}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span className="link-draw text-sm font-medium">{r.label}</span>
              <span className="tape-caption text-sm">{r.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
