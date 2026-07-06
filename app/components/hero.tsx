import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { Grain } from "./grain";
import { HeroShader } from "./hero-shader";
import { Magnet } from "./magnet";

export function Hero() {
  return (
    <section aria-label="Intro" className="relative h-svh">
      {/* Ambient backdrop: pre-blurred, darkened 128px still of the same shot */}
      <div aria-hidden className="hero-backdrop absolute inset-0" />

      {/* The card is the viewport: everything hero lives inside it */}
      <div className="hero-card bg-sky">
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

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/60 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 p-6 pb-8 md:flex-row md:items-end md:justify-between md:px-10 md:pb-10">
        <h1 className="hero-headline hero-noir flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)]">
          <span className="noir-line noir-line-1" data-text="Designing interfaces.">
            Designing interfaces.
          </span>
          <span className="noir-line noir-line-2" data-text="Engineering the rest.">
            Engineering the rest.
          </span>
        </h1>
        <svg aria-hidden focusable="false" style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <filter id="noir-grain" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
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
