import type { CSSProperties } from "react";
import Image from "next/image";
import { Hero } from "./components/hero";
import { Nav } from "./components/nav";
import { Work } from "./components/work";
import { Reveal } from "./components/reveal";
import { LocalTime } from "./components/local-time";
import { CircularText } from "./components/circular-text";
import { PaperArtifacts } from "./components/paper-artifacts";
import portrait from "@/public/images/about/portrait-4x5.jpg";
import { links } from "./links";

const contactIndex = [
  // TODO(sv): real WhatsApp number
  { label: "WhatsApp", note: "fastest for projects", href: links.whatsapp },
  { label: "LinkedIn", note: "roles and referrals", href: links.linkedin },
  { label: "GitHub", note: "the code, including this site", href: links.github },
  { label: "Interview", note: "ask the AI stand-in anything", href: "/interview" },
  { label: "Services site", note: "for business projects", href: links.store },
];

export default function Home() {
  return (
    <>
      <Nav />

      <main id="top">
        <div className="hero-stage relative">
          <div className="hero-pin sticky top-0 h-svh overflow-hidden">
            <Hero />
          </div>
        </div>

        {/* The paper sheet that slides up over the pinned hero */}
        <div className="work-sheet relative z-10 -mt-[100svh] bg-paper">
          <PaperArtifacts />
          <Work />

          {/* Laid-paper stock: the textural break between work and contact
              (DESIGN.md → Section backgrounds) */}
          <section
            id="about"
            aria-label="About"
            className="laid-paper relative isolate overflow-hidden border-y border-shadow-ink/15 bg-paper px-5 py-16 md:px-16 md:py-32"
          >
            {/* The column grid the content aligns to, made visible */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-5 right-5 -z-10 md:left-16 md:right-16"
            >
              <div className="column-rule left-0" />
              <div className="column-rule hidden md:block" style={{ left: "calc(100% / 12 * 5)" }} />
              <div className="column-rule left-full" />
            </div>
            {/* Ghost numeral: letterpress watermark in the open lower-right */}
            <span aria-hidden className="ghost-numeral -z-10">
              02
            </span>
            <Reveal className="grid items-start gap-10 md:grid-cols-12 md:gap-6">
              <figure className="reveal-item relative md:col-span-4">
                <div className="plate overflow-hidden">
                  <Image
                    src={portrait}
                    alt="Santiago Vittor, portrait in a museum gallery"
                    sizes="(min-width: 768px) 33vw, 90vw"
                    className="aspect-[4/5] object-cover"
                  />
                </div>
                <CircularText
                  text="SANTIAGO VITTOR · BUENOS AIRES · "
                  className="absolute -right-5 -top-5 h-24 w-24 md:-right-7 md:-top-7 md:h-28 md:w-28"
                />
                <figcaption className="mt-3 font-serif italic text-shadow-ink">
                  Somewhere in Europe, 2025.
                </figcaption>
              </figure>
              <div
                className="reveal-item md:col-span-7 md:col-start-6"
                style={{ "--reveal-delay": "120ms" } as CSSProperties}
              >
                <h2
                  data-text="About"
                  className="register text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-tight"
                >
                  About
                </h2>
                <p className="mt-6 max-w-[65ch] text-lg leading-relaxed">
                  I&apos;m Santiago Vittor. By day I lead a data and AI squad
                  at FoodStyles: I train teams on LLM workflows, run our
                  analytics program, and built the RAG assistant they use
                  daily. Nights and weekends I design and build sites like
                  this one. Based in Buenos Aires, working remote with teams
                  in the US and UK since 2022.
                </p>
                <ul className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm font-medium uppercase tracking-[0.08em] text-shadow-ink">
                  <li>Product design</li>
                  <li>Frontend engineering</li>
                  <li>AI integration</li>
                  <li>Chatbots &amp; automation</li>
                </ul>
                <p className="mt-10">
                  <a href={links.store} className="link-draw font-medium">
                    Hiring for a business project? → my services site
                  </a>
                </p>
              </div>
            </Reveal>
          </section>

          <section
            id="contact"
            aria-label="Contact"
            className="relative px-5 py-16 md:px-16 md:py-32"
          >
            <Reveal>
              <h2
                data-text="Let's talk"
                className="register reveal-item text-[clamp(3rem,10vw,9rem)] font-medium leading-none tracking-[-0.03em]"
              >
                Let&apos;s talk
              </h2>
            </Reveal>
            <Reveal className="mt-10 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-6">
              <div className="reveal-item md:col-span-5">
                <p className="max-w-md text-lg text-shadow-ink">
                  A project, a role, or a question about how I built
                  something. Email gets answered first.
                </p>
                <a
                  href={links.email}
                  className="link-draw mt-6 inline-block text-xl font-medium md:text-2xl"
                >
                  svittordev@gmail.com
                </a>
                <p className="mt-12 font-serif italic text-shadow-ink">
                  It&apos;s <LocalTime />
                  {" in Buenos Aires. If I'm awake, I'm probably online."}
                </p>
              </div>
              <ul
                className="reveal-item md:col-span-6 md:col-start-7"
                style={{ "--reveal-delay": "120ms" } as CSSProperties}
              >
                {contactIndex.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="index-row flex items-baseline justify-between gap-4 border-t border-shadow-ink/20 py-5"
                    >
                      <span className="text-lg font-medium md:text-xl">
                        {item.label}
                        <span aria-hidden className="tile-arrow ml-2">
                          →
                        </span>
                      </span>
                      <span className="text-right font-serif italic text-shadow-ink">
                        {item.note}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>

          <footer className="relative flex flex-wrap items-center justify-between gap-4 border-t border-shadow-ink/20 px-5 py-8 md:px-16">
            <p className="font-medium">Santiago Vittor</p>
            <p className="text-sm text-shadow-ink">
              <span className="font-serif italic">{new Date().getFullYear()}</span>
              {" "}· Designed and built by me ·{" "}
              <a
                href="https://github.com/santiagovittor/portfolio-v3"
                className="link-draw"
              >
                View source
              </a>
            </p>
            <script
              dangerouslySetInnerHTML={{
                __html: `console.log("%cBuilt frame by frame.\\nSource: https://github.com/santiagovittor/portfolio-v3", "font-family: monospace; color: #e86a17;");`,
              }}
            />
          </footer>
        </div>
      </main>
    </>
  );
}
