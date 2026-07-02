import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { HeroShader } from "./hero-shader";
import { Magnet } from "./magnet";

// Reactbits "BlurText": each word develops from blur with a small stagger.
// Split at build time; CSS owns the animation and reduced motion.
function BlurLine({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <span className="block">
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="hero-word"
          style={{ animationDelay: `${(from + i) * 70}ms` }}
        >
          {word}
          {" "}
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section aria-label="Intro" className="relative min-h-svh overflow-hidden bg-sky">
      {/* Poster: LCP element and the shader's static fallback */}
      <Image
        src={poppies}
        alt="Field of orange poppies against a blue sky"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <HeroShader image="/images/hero/poppies-1920.jpg" />

      {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/60 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 p-6 pb-10 md:flex-row md:items-end md:justify-between md:px-16 md:pb-16">
        <h1 className="hero-headline flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.03em] text-white">
          {/* TODO(sv): confirm headline (SPEC.md → Hero) */}
          <BlurLine text="Designing interfaces." />
          <BlurLine text="Engineering the rest." from={2} />
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
    </section>
  );
}
