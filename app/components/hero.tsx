import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { Grain } from "./grain";
import { HeroShader } from "./hero-shader";
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
        {/* Card-scoped grain matches the shader's fiber so the swap is silent */}
        <Grain className="absolute inset-0" />
        <HeroShader image="/images/hero/poppies-1920.jpg" />
        {/* Second, heavier grain layer: the 0.06 site-wide pass reads too
            subtle at hero scale on its own (validated against renders). */}
        <Grain className="absolute inset-0" opacity={0.15} />
        {/* Vignette: darkens toward the corners like a physical print */}
        <div aria-hidden className="hero-vignette absolute inset-0" />

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/60 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 p-6 pb-8 md:flex-row md:items-end md:justify-between md:px-10 md:pb-10">
        <h1 className="hero-headline hero-noir flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)]">
          <span className="noir-line noir-line-1">
            <span className="noir-line-shadow" aria-hidden="true">Designing interfaces.</span>
            <span className="noir-line-outline" aria-hidden="true">Designing interfaces.</span>
            <span className="noir-line-fill">Designing interfaces.</span>
          </span>
          <span className="noir-line noir-line-2">
            <span className="noir-line-shadow" aria-hidden="true">Engineering the rest.</span>
            <span className="noir-line-outline" aria-hidden="true">Engineering the rest.</span>
            <span className="noir-line-fill">Engineering the rest.</span>
          </span>
        </h1>
        <div className="max-w-xs shrink-0">
          <p className="text-white/90">
            I design products and build them: interfaces, frontends, and the
            AI behind them. Buenos Aires, working US hours.
          </p>
          <div className="mt-6 flex gap-3">
            <Magnet>
              <a
                href="#work"
                className="btn block rounded-full bg-poppy px-6 py-3 font-medium text-ink hover:bg-poppy/90"
              >
                See the work
              </a>
            </Magnet>
            <Magnet>
              <a
                href="#contact"
                className="btn block rounded-full border border-white/25 bg-white/12 px-6 py-3 font-medium text-white backdrop-blur-md hover:bg-white/20"
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
