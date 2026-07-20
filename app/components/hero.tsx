import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { Grain } from "./grain";
import { Magnet } from "./magnet";

export function Hero() {
  return (
    <section aria-label="Intro" className="relative h-svh bg-paper">
      {/* The card is a photograph mounted in a paper mat: --hero-inset is
          the mat width, exposing bg-paper around the card's sharp corners. */}
      <div data-nav-theme="dark" className="hero-card bg-sky">
        {/* Poster: LCP element and the shader's permanent fallback */}
        <Image
          src={poppies}
          alt="Field of orange poppies against a blue sky"
          fill
          priority
          sizes="100vw"
          className="hero-poster object-cover"
        />
        {/* Duotone grade: warm-faded analog color, same mechanism as the
            vignette below (mix-blend-mode over the static image) */}
        <div aria-hidden className="hero-grade absolute inset-0" />
        {/* Card-scoped grain matches the poster's fiber */}
        <Grain className="absolute inset-0" />
        {/* Second, heavier grain layer: the 0.06 site-wide pass reads too
            subtle at hero scale on its own (validated against renders). */}
        <Grain className="absolute inset-0" opacity={0.15} />
        {/* Vignette: darkens toward the corners like a physical print */}
        <div aria-hidden className="hero-vignette absolute inset-0" />

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type.
            Multi-stop and full-height because the analog grade brightens
            the poppy highlights the headline sits over, and on mobile the
            wrapped headline reaches roughly halfway up the card - measured
            against the graded image, not assumed. */}
        <div aria-hidden className="hero-scrim absolute inset-0" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 p-6 pb-8 md:flex-row md:items-end md:justify-between md:px-10 md:pb-10">
        <h1 className="hero-headline flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)]">
          <span className="hero-line">Designing interfaces.</span>{" "}
          <span className="hero-line hero-line-2">Engineering the rest.</span>
        </h1>
        <div className="max-w-xs shrink-0">
          <p className="font-serif text-lg italic text-white/90">
            I design products and build them: interfaces, frontends, and the
            AI behind them. Buenos Aires, working US hours.
          </p>
          <div className="mt-6 flex gap-3">
            <Magnet>
              <a
                href="#work"
                className="btn btn-letterpress block rounded-[var(--radius-ticket)] bg-poppy px-6 py-2.5 text-sm font-medium uppercase tracking-[0.06em] text-ink hover:bg-poppy/90"
              >
                See the work
              </a>
            </Magnet>
            <Magnet>
              <a
                href="#contact"
                className="btn block rounded-[var(--radius-ticket)] border border-white/25 bg-white/12 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.06em] text-white backdrop-blur-md hover:bg-white/20"
              >
                Get in touch
              </a>
            </Magnet>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
