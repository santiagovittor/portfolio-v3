import type { Metadata } from "next";
import { Nav } from "../components/nav";
import { Transcript } from "./transcript";

export const metadata: Metadata = {
  title: "Interview",
  description:
    "A live interview with Santiago Vittor — conducted by you, answered by an AI stand-in grounded in his own words.",
};

export default function InterviewPage() {
  return (
    <>
      <Nav variant="paper" />
      <main className="laid-paper relative isolate min-h-svh overflow-hidden border-b border-shadow-ink/15 bg-paper px-5 pb-16 pt-32 md:px-16 md:pt-40">
        <span aria-hidden className="ghost-numeral -z-10">
          03
        </span>
        <header className="mx-auto w-full max-w-[72ch]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
            In conversation — Buenos Aires
          </p>
          <h1
            data-text="Interview with Santiago Vittor"
            className="register mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-tight"
          >
            Interview with Santiago Vittor
          </h1>
          <p className="mt-4 font-serif italic text-shadow-ink">
            Conducted live, by you. Answers by an AI stand-in, grounded in
            Santiago&apos;s own words.
          </p>
        </header>
        <Transcript />
      </main>
    </>
  );
}
