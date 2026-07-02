const projects = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    outcome: "Services site: positioning, conversion copy, WhatsApp funnel.",
    tags: ["Next.js", "Copywriting", "WhatsApp API"],
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    outcome: "Client site designed and shipped end to end.",
    tags: ["Design", "Frontend"],
  },
  {
    slug: "portfolio-ai-assistant",
    name: "Portfolio AI assistant",
    outcome: "RAG chatbot that answers questions about my work.",
    tags: ["RAG", "LLM", "TypeScript"],
  },
];

// TODO(sv): confirm email, WhatsApp and LinkedIn URLs (SPEC.md → Content inventory)
const links = {
  github: "https://github.com/santiagovittor",
  store: "https://santiagovittor.store",
  email: "mailto:svittordev@gmail.com",
  whatsapp: "https://wa.me/000000000000",
  linkedin: "https://www.linkedin.com/in/santiagovittor",
};

export default function Home() {
  return (
    <>
      <header>
        <nav aria-label="Main">
          {/* M1: glass pill nav. Skeleton links for now. */}
          <a href="#work">Work</a> <a href="#about">About</a>{" "}
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        {/* M1: hero shader. Sky field placeholder proves tokens render. */}
        <section
          aria-label="Intro"
          className="flex min-h-screen flex-col justify-end bg-sky p-8 md:p-16"
        >
          <h1 className="max-w-4xl text-6xl font-medium leading-[0.95] tracking-tight text-white md:text-8xl">
            {/* TODO(sv): confirm headline (SPEC.md → Hero) */}
            Designing interfaces. Engineering the rest.
          </h1>
          <p className="mt-8 max-w-md text-white">
            I design products and build them: interfaces, frontends, and the AI
            plumbing behind them. Based in Buenos Aires, working with teams in
            US time zones.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="#work"
              className="rounded-full bg-poppy px-6 py-3 text-white"
            >
              See the work
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/25 px-6 py-3 text-white"
            >
              Get in touch
            </a>
          </div>
        </section>

        <section id="work" aria-label="Work" className="px-8 py-16 md:px-16 md:py-32">
          <h2 className="text-4xl font-medium tracking-tight">Selected work</h2>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {projects.map((p) => (
              <li key={p.slug} className="rounded-card border border-shadow-ink/20 p-6">
                {/* M2: card grid with cover images + hover states */}
                <h3 className="text-2xl font-medium">{p.name}</h3>
                <p className="mt-2 text-shadow-ink">{p.outcome}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
                  {p.tags.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="about" aria-label="About" className="px-8 py-16 md:px-16 md:py-32">
          <h2 className="text-4xl font-medium tracking-tight">About</h2>
          {/* M4: two-column with portrait */}
          <p className="mt-8 max-w-2xl">
            I&apos;m Santiago Vittor, a designer-engineer in Buenos Aires. I
            take products from first sketch to deployed code: design systems,
            frontends that hold up in production, and AI features that earn
            their place. Before this I built sites and funnels for small
            businesses, which taught me to care about outcomes, not deliverables.
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

        <section id="contact" aria-label="Contact" className="px-8 py-16 md:px-16 md:py-32">
          <h2 className="text-6xl font-medium tracking-tight md:text-8xl">
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
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-8 py-8 md:px-16">
        <p className="font-medium">Santiago Vittor</p>
        <p className="text-shadow-ink">
          {new Date().getFullYear()} — Designed &amp; built by me.{" "}
          <a
            href="https://github.com/santiagovittor/portfolio-v3"
            className="underline"
          >
            View source
          </a>
        </p>
      </footer>
    </>
  );
}
