import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { Grain } from "./grain";
import { Magnet } from "./magnet";
import { HeroHeadline } from "./hero-headline";
import { LocalTime } from "./local-time";

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
        {/* Split-tone grade: cool shadows, warm highlights, over the photo's
            own color rather than replacing it */}
        <div aria-hidden className="hero-grade absolute inset-0" />
        {/* Halation: warm bloom off the poppy field, the analog tell */}
        <div aria-hidden className="hero-halation absolute inset-0" />
        {/* Laid-paper stock, blended into the emulsion */}
        <div aria-hidden className="hero-fiber absolute inset-0" />
        {/* Card-scoped grain matches the poster's fiber */}
        <Grain className="absolute inset-0" />
        {/* Vignette: darkens toward the corners like a physical print */}
        <div aria-hidden className="hero-vignette absolute inset-0" />

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type.
            Multi-stop and full-height because the grade brightens the poppy
            highlights the headline sits over, and on mobile the wrapped
            headline reaches roughly halfway up the card - measured against
            the graded image, not assumed. */}
        <div aria-hidden className="hero-scrim absolute inset-0" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 p-6 pb-8 md:flex-row md:items-end md:justify-between md:px-10 md:pb-10">
        <HeroHeadline />
        <div className="max-w-xs shrink-0">
          {/* Credit block: letterspaced caps, no prose, no rules. The role
              and location lines are Santiago's to write (SV:confirm) - until
              they exist this is just the live clock, because empty ruled
              rows read as a rendering fault, not as structure. */}
          <dl className="hero-credit">
            <dt className="sr-only">Local time in Buenos Aires</dt>
            <dd>
              <LocalTime />
            </dd>
          </dl>
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
