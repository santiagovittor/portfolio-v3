"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import store from "@/public/images/projects/store.png";
import dubanronald from "@/public/images/projects/dubanronald.png";
// TODO(sv): real cover for the AI assistant case study
import assistant from "@/public/images/hero/eugene-golovesov-OvB7KPihcL8-unsplash.jpg";

type Project = {
  slug: string;
  name: string;
  outcome: string;
  tags: string[];
  cover: StaticImageData;
  alt: string;
};

const projects: Project[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    outcome: "Services site that turns visits into WhatsApp conversations.",
    tags: ["Positioning", "Conversion copy", "WhatsApp funnel"],
    cover: store,
    alt: "Homepage of santiagovittor.store",
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    outcome: "Client site designed and shipped end to end.",
    tags: ["Design", "Frontend"],
    cover: dubanronald,
    alt: "Homepage of dubanronald.com",
  },
  {
    slug: "portfolio-ai-assistant",
    name: "Portfolio AI assistant",
    outcome: "RAG chatbot that answers recruiter questions with citations.",
    tags: ["RAG", "LLM", "TypeScript"],
    cover: assistant,
    alt: "Abstract infrared trees, placeholder cover for the AI assistant",
  },
];

const entrance = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

export function Work() {
  return (
    <section id="work" aria-label="Work" className="px-5 py-16 md:px-16 md:py-32">
      <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-tight">
        Selected work
      </h2>
      <MotionConfig reducedMotion="user">
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {projects.map((p, i) => (
          <motion.li
            key={p.slug}
            {...entrance}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
          >
            <Link
              href={`/work/${p.slug}`}
              className="group block rounded-card border border-shadow-ink/20 bg-white/40 p-4 transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg"
            >
              <div className="overflow-hidden rounded-image">
                <Image
                  src={p.cover}
                  alt={p.alt}
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="aspect-[4/3] object-cover"
                />
              </div>
              <h3 className="mt-4 text-2xl font-medium tracking-tight">
                {p.name}
              </h3>
              <p className="mt-1 text-shadow-ink">{p.outcome}</p>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                {p.tags.join(" · ")}
              </p>
            </Link>
          </motion.li>
        ))}
      </ul>
      </MotionConfig>
    </section>
  );
}
