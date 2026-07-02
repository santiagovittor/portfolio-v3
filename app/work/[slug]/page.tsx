import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { caseStudies } from "../case-studies";

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return {};
  return { title: cs.name, description: cs.summary };
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const index = caseStudies.findIndex((c) => c.slug === slug);
  if (index === -1) notFound();

  const cs = caseStudies[index];
  const prev = caseStudies[(index - 1 + caseStudies.length) % caseStudies.length];
  const next = caseStudies[(index + 1) % caseStudies.length];

  return (
    <>
      <Nav variant="paper" />

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-32 md:px-16">
        <header className="max-w-3xl">
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight">
            {cs.name}
          </h1>
          <p className="mt-4 text-xl text-shadow-ink">{cs.summary}</p>
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 text-sm">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                Role
              </dt>
              <dd className="mt-1">{cs.role}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                Year
              </dt>
              <dd className="mt-1 font-serif italic">{cs.year}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                Stack
              </dt>
              <dd className="mt-1">{cs.stack.join(" · ")}</dd>
            </div>
          </dl>
        </header>

        <div className="plate mt-12 overflow-hidden">
          <Image
            src={cs.cover.src}
            alt={cs.cover.alt}
            priority
            sizes="(min-width: 1440px) 1312px, 90vw"
            className="aspect-[16/9] w-full object-cover object-top"
          />
        </div>

        <article className="mx-auto mt-16 grid max-w-3xl gap-16 md:mt-24">
          <section aria-label="The problem">
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
              The problem
            </h2>
            <p className="mt-4 leading-relaxed">{cs.problem}</p>
          </section>

          <section aria-label="Key decisions" className="grid gap-12">
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
              Key decisions
            </h2>
            {cs.decisions.map((d, i) => (
              <div key={d.title}>
                <h3 className="text-xl font-medium tracking-tight">
                  <span className="mr-3 font-serif italic text-shadow-ink">
                    {i + 1}
                  </span>
                  {d.title}
                </h3>
                <p className="mt-3 leading-relaxed">{d.body}</p>
                {d.image && (
                  <figure className="plate mt-6 overflow-hidden">
                    <Image
                      src={d.image.src}
                      alt={d.image.alt}
                      sizes="(min-width: 768px) 768px, 90vw"
                      className="w-full object-cover"
                    />
                  </figure>
                )}
              </div>
            ))}
          </section>

          <section aria-label="Outcome">
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
              Outcome
            </h2>
            <p className="mt-4 leading-relaxed">{cs.outcome}</p>
          </section>
        </article>

        <nav
          aria-label="Case studies"
          className="mx-auto mt-24 flex max-w-3xl justify-between border-t border-shadow-ink/20 pt-8"
        >
          <Link href={`/work/${prev.slug}`} className="group max-w-[45%]">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
              Previous
            </span>
            <span className="mt-1 block font-medium">
              <span className="link-draw">{prev.name}</span>
            </span>
          </Link>
          <Link href={`/work/${next.slug}`} className="group max-w-[45%] text-right">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
              Next
            </span>
            <span className="mt-1 block font-medium">
              <span className="link-draw">{next.name}</span>
            </span>
          </Link>
        </nav>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-16">
        <Link href="/" className="font-medium">
          Santiago Vittor
        </Link>
        <p className="text-shadow-ink">
          <Link href="/#work" className="underline">
            All work
          </Link>
        </p>
      </footer>
    </>
  );
}
