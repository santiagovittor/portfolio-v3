import { Hero } from "./components/hero";
import { Nav } from "./components/nav";
import { Work } from "./components/work";

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
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-tight">
              About
            </h2>
            {/* M4: two-column with portrait */}
            <p className="mt-8 max-w-2xl">
              I&apos;m Santiago Vittor, a designer-engineer in Buenos Aires. I
              take products from first sketch to deployed code: design
              systems, frontends that hold up in production, and AI features
              that earn their place. Before this I built sites and funnels
              for small businesses, which taught me to care about outcomes,
              not deliverables.
            </p>
            <ul className="mt-8 max-w-2xl">
              <li>Product design</li>
              <li>Frontend engineering</li>
              <li>AI integration</li>
              <li>Chatbots &amp; automation</li>
            </ul>
            <p className="mt-8">
              <a href={links.store} className="underline">
                Hiring for a business project? → my services site
              </a>
            </p>
          </section>

          <section id="contact" aria-label="Contact" className="px-5 py-16 md:px-16 md:py-32">
            <h2 className="text-[clamp(3rem,8vw,7rem)] font-medium tracking-tight">
              Let&apos;s talk
            </h2>
            <ul className="mt-8 flex flex-wrap gap-6">
              <li>
                <a href={links.email} className="underline">Email</a>
              </li>
              <li>
                <a href={links.whatsapp} className="underline">WhatsApp</a>
              </li>
              <li>
                <a href={links.github} className="underline">GitHub</a>
              </li>
              <li>
                <a href={links.linkedin} className="underline">LinkedIn</a>
              </li>
            </ul>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-16">
            <p className="font-medium">Santiago Vittor</p>
            <p className="text-shadow-ink">
              {new Date().getFullYear()}. Designed and built by me.{" "}
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
