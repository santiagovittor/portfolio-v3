import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import store from "@/public/images/projects/store.png";
import dubanronald from "@/public/images/projects/dubanronald.png";
// TODO(sv): real cover for the AI assistant case study
import assistant from "@/public/images/hero/eugene-golovesov-OvB7KPihcL8-unsplash.jpg";
import { Reveal } from "./reveal";

type Project = {
  slug: string;
  name: string;
  outcome: string;
  tags: string[];
  cover: StaticImageData;
  alt: string;
  year: string;
};

const projects: Project[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    outcome: "Services site that turns visits into WhatsApp conversations.",
    tags: ["Positioning", "Conversion copy", "WhatsApp funnel"],
    cover: store,
    alt: "Homepage of santiagovittor.store",
    year: "2025",
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    outcome: "Client site designed and shipped end to end.",
    tags: ["Design", "Frontend"],
    cover: dubanronald,
    alt: "Homepage of dubanronald.com",
    year: "2025",
  },
  {
    slug: "portfolio-ai-assistant",
    name: "Portfolio AI assistant",
    outcome: "RAG chatbot that answers recruiter questions with citations.",
    tags: ["RAG", "LLM", "TypeScript"],
    cover: assistant,
    alt: "Abstract infrared trees, placeholder cover for the AI assistant",
    year: "2024",
  },
];

const TICKER_RUN =
  "Product design · Frontend engineering · AI integration · Buenos Aires, working US hours · ";

export function Work() {
  return (
    <>
      {/* Letterpress proof strip: marks the switch from photo to paper */}
      <div
        aria-hidden
        className="ticker border-b border-shadow-ink/20 py-3 font-serif text-lg italic text-shadow-ink/80"
      >
        <div className="ticker-track">
          <span className="pr-2">{TICKER_RUN.repeat(3)}</span>
          <span className="pr-2">{TICKER_RUN.repeat(3)}</span>
        </div>
      </div>

      <section id="work" aria-label="Work" className="px-5 py-16 md:px-16 md:py-32">
        <Reveal className="flex items-baseline justify-between">
          <h2 className="reveal-item text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-tight">
            Selected work
            <span className="ml-3 align-middle font-serif text-[0.5em] font-normal italic tracking-normal text-shadow-ink">
              (three)
            </span>
          </h2>
        </Reveal>

        <Reveal
          as="ul"
          className="mt-12 grid gap-x-6 gap-y-16 md:mt-16 lg:grid-cols-12"
        >
          {projects.map((p, i) => (
            <li
              key={p.slug}
              className={`reveal-item lg:col-span-4 ${
                // Editorial rhythm: the middle plate sits lower on the page
                i === 1 ? "lg:translate-y-12" : ""
              }`}
              style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
            >
              <Link href={`/work/${p.slug}`} className="tile group block">
                <div className="tile-cover plate overflow-hidden">
                  <Image
                    src={p.cover}
                    alt={p.alt}
                    sizes="(min-width: 1024px) 30vw, 90vw"
                    className="aspect-[4/3] object-cover"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-medium tracking-tight">
                    {p.name}
                    <span aria-hidden className="tile-arrow ml-2">
                      →
                    </span>
                  </h3>
                  <span className="shrink-0 font-serif italic text-shadow-ink">
                    {p.year}
                  </span>
                </div>
                <p className="mt-1 text-shadow-ink">{p.outcome}</p>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                  {p.tags.join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </Reveal>
      </section>
    </>
  );
}
