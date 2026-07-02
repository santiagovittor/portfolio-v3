import Image from "next/image";
import { Hero } from "./components/hero";
import { Nav } from "./components/nav";
import { Work } from "./components/work";
import portrait from "@/public/images/about/_MG_9444Europa2025.jpg";

// TODO(sv): confirm email and WhatsApp (SPEC.md → Content inventory)
const links = {
  github: "https://github.com/santiagovittor",
  store: "https://santiagovittor.store",
  email: "mailto:svittordev@gmail.com",
  whatsapp: "https://wa.me/000000000000",
  linkedin: "https://www.linkedin.com/in/santiago-vittor/",
};

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
          <Work />

          <section id="about" aria-label="About" className="px-5 py-16 md:px-16 md:py-32">
            <div className="grid items-start gap-10 md:grid-cols-12 md:gap-6">
              <div className="md:col-span-4">
                <div className="overflow-hidden rounded-card">
                  <Image
                    src={portrait}
                    alt="Santiago Vittor, portrait in a museum gallery"
                    sizes="(min-width: 768px) 33vw, 90vw"
                    className="aspect-[4/5] object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-7 md:col-start-6">
                <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-tight">
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
                  <a
                    href={links.store}
                    className="font-medium underline decoration-poppy decoration-2 underline-offset-4"
                  >
                    Hiring for a business project? → my services site
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section id="contact" aria-label="Contact" className="px-5 py-16 md:px-16 md:py-32">
            <h2 className="text-[clamp(3rem,10vw,9rem)] font-medium leading-none tracking-[-0.03em]">
              Let&apos;s talk
            </h2>
            <p className="mt-8 max-w-md text-lg text-shadow-ink">
              A project, a role, or a question about how I built something.
              Email gets answered first.
            </p>
            <a
              href={links.email}
              className="mt-6 inline-block text-xl font-medium underline decoration-poppy decoration-2 underline-offset-4 md:text-2xl"
            >
              svittordev@gmail.com
            </a>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium uppercase tracking-[0.08em]">
              <li>
                {/* TODO(sv): real WhatsApp number */}
                <a href={links.whatsapp} className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-poppy">WhatsApp</a>
              </li>
              <li>
                <a href={links.github} className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-poppy">GitHub</a>
              </li>
              <li>
                <a href={links.linkedin} className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-poppy">LinkedIn</a>
              </li>
            </ul>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-shadow-ink/20 px-5 py-8 md:px-16">
            <p className="font-medium">Santiago Vittor</p>
            <p className="text-sm text-shadow-ink">
              <span className="font-serif italic">{new Date().getFullYear()}</span>
              {" "}· Designed and built by me ·{" "}
              <a
                href="https://github.com/santiagovittor/portfolio-v3"
                className="underline"
              >
                View source
              </a>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
