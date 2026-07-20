import type { Metadata } from "next";
import { Nav } from "../components/nav";
import { LocalTime } from "../components/local-time";
import { Transcript } from "./transcript";

export const metadata: Metadata = {
  title: "Interview",
  description:
    "A live interview with Santiago Vittor, conducted by you, answered by an AI stand-in grounded in his own words.",
  openGraph: {
    title: "Interview with Santiago Vittor",
    description:
      "Conducted live, by you. Answers by an AI stand-in, grounded in Santiago's own words.",
    url: "/interview",
  },
};

export default function InterviewPage() {
  return (
    <>
      <Nav variant="paper" />
      <main className="laid-paper relative isolate flex h-svh flex-col overflow-hidden border-b border-shadow-ink/15 bg-paper px-5 pb-3 pt-24 md:px-16 md:pt-32">
        <span aria-hidden className="ghost-numeral -z-10">
          03
        </span>
        <header className="mx-auto w-full max-w-[72ch] flex-none">
          <p className="tape-label">
            In conversation, Buenos Aires · <LocalTime />
          </p>
          <h1
            data-text="Interview with Santiago Vittor"
            className="register mt-2 text-balance text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.02] tracking-tight md:mt-3"
          >
            Interview with Santiago Vittor
          </h1>
          {/* One standfirst, both breakpoints. The transcript's empty state
              used to repeat this in a second paragraph; it doesn't now. */}
          <p className="tape-caption mt-3">
            Conducted by you. Answered by an AI stand-in, in his own words.
          </p>
        </header>
        <Transcript />
      </main>
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log("%cQ. Who built this?%c\\nSV. I did. The stand-in answers upstairs; the source is at https://github.com/santiagovittor/portfolio-v3","font:600 13px Archivo,sans-serif;color:#2a2e33","font:13px Archivo,sans-serif;color:#e86a17")`,
        }}
      />
    </>
  );
}
