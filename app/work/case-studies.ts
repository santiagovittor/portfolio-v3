import type { StaticImageData } from "next/image";
import storeLanding from "@/public/images/projects/store-landing.png";
import storeServices from "@/public/images/projects/store-services.png";
import dubanronaldLanding from "@/public/images/projects/dubanronald-landing.jpg";
import dubanronaldRealEstate from "@/public/images/projects/dubanronald-realestate.jpg";
import canvassOutreach from "@/public/images/projects/canvass-outreach.png";
import canvassScraper from "@/public/images/projects/canvass-scraper.png";
import canvassAnalytics from "@/public/images/projects/canvass-analytics.png";

export type Decision = {
  title: string;
  body: string;
  image?: { src: StaticImageData; alt: string };
};

export type CaseStudy = {
  slug: string;
  name: string;
  summary: string;
  role: string;
  year: string;
  stack: string[];
  cover: { src: StaticImageData; alt: string };
  problem: string;
  decisions: Decision[];
  outcome: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    summary:
      "Bilingual services site with an embedded AI assistant that qualifies leads, books calls and hands off to WhatsApp.",
    role: "Positioning, copy, design, build",
    year: "2025",
    stack: ["Next.js", "Tailwind v4", "Vercel AI SDK", "Gemini"],
    cover: {
      src: storeLanding,
      alt: "santiagovittor.store landing: 'I build web & AI products' over a starfield",
    },
    problem:
      "Small businesses do not buy development. They buy a site that brings clients, an assistant that answers at 2am, hours saved on repetitive work. My old services page listed technologies and got silence. It needed to speak in outcomes and route interested people into a conversation instead of a form they abandon.",
    decisions: [
      {
        title: "Outcomes in the headline, stack in the footnotes",
        body: "The landing leads with what the client gets. Tech stack appears once, small, near the end. Every section ends with the same question a client would ask next, and answers it. English at the root, Argentine Spanish at /ar — same argument, native register in both.",
        image: {
          src: storeLanding,
          alt: "Landing headline of santiagovittor.store",
        },
      },
      {
        title: "An AI assistant that does the qualifying",
        body: "The chat in the corner is the product demo. One streaming endpoint routes three tools: book a call through an inline Cal.com embed, send a contact request through Resend, or hand off to WhatsApp. Language detection drives a bilingual system prompt, injection patterns are matched before the model ever sees a message, and a sliding ten-turn window is trimmed so it never orphans a tool call. A client asking 'can you build a chatbot?' gets the answer by talking to one.",
        image: {
          src: storeServices,
          alt: "Services grid of santiagovittor.store, including the AI and chatbot development card",
        },
      },
      {
        title: "Every path ends in a conversation",
        body: "Booking, contact and WhatsApp all open a dialogue, not a ticket. Forms create homework: fill fields, wait, check spam. A WhatsApp link opens the app my clients already use all day, one tap on mobile, and I answer as a person. One call to action per screen, so each viewport has a single next step.",
      },
    ],
    outcome:
      "The site opens conversations instead of collecting submissions, and it doubles as a live demo: the assistant a visitor talks to is the same kind of build they can buy.",
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    summary:
      "Site for a paid media agency, built to argue its case first and sell second.",
    role: "Design, frontend",
    year: "2025",
    stack: ["Next.js", "GSAP", "Meta Conversions API"],
    cover: {
      src: dubanronaldLanding,
      alt: "dubanronald.com landing: 'Your budget isn't the problem.' on a warm mesh gradient",
    },
    problem:
      "An agency running Meta and Google Ads for owners who spend on ads and don't see the leads. The brief: make the argument first, the services second. Most agency sites open with credentials nobody asked for; this one had to open with the sentence clients already believe.",
    decisions: [
      {
        title: "Lead with the client's real objection",
        body: "The page opens with 'Your budget isn't the problem.' — the phrase behind every first meeting. It filters visitors fast: people who nod keep reading, people who don't were never going to hire the agency. The ad is only half the system; the site sells the other half.",
        image: {
          src: dubanronaldLanding,
          alt: "dubanronald.com headline",
        },
      },
      {
        title: "Editorial warmth over agency gloss",
        body: "Cormorant Garamond display type against Inter body, on a warm analog palette — cream, deep teal, burnt orange — instead of the default SaaS blue-on-white. The hero background is a hand-rolled mesh gradient, not a stock photo, and GSAP drives the scroll sections. It reads like a well set article, which matches how the agency sells: with arguments, not showreels.",
      },
      {
        title: "Measurement that survives ad blockers",
        body: "An agency selling attribution cannot lose its own conversion events to iOS privacy limits. The Meta Pixel is doubled by the Conversions API, wired server-side through a Next.js route, so events reach Meta even when the browser blocks the pixel. The site practices the measurement discipline the agency preaches.",
      },
      {
        title: "A landing per market",
        body: "Bilingual routing, English at /en and Spanish at /es, plus a dedicated /real-estate page for the agency's strongest vertical — acquisition systems for high-consideration sales cycles, with its own copy about lead quality and speed to response.",
        image: {
          src: dubanronaldRealEstate,
          alt: "dubanronald.com real estate landing page",
        },
      },
    ],
    outcome:
      "Shipped end to end and in use as the agency's main link in outreach. The site does the qualifying before the first call.",
  },
  {
    slug: "canvass",
    name: "Canvass",
    summary:
      "Prospecting tool that maps local businesses, scores them as leads and drafts cold emails grounded in each one's real gaps.",
    role: "Design, engineering",
    year: "2026",
    stack: ["TypeScript", "Node", "React", "SQLite", "Gemini", "Docker"],
    cover: {
      src: canvassOutreach,
      alt: "Canvass outreach queue with a ranked lead list and a drafted cold email in Spanish",
    },
    problem:
      "Cold outreach breaks one of two ways: mass-send a generic template and everyone ignores it, or hand-write every email and send four a day. I built the middle path to run my own client acquisition — pull real business data off Google Maps, rank leads by fit, read each one's web presence, and draft an email that names a concrete gap. I use it most weeks, so it has to earn its place.",
    decisions: [
      {
        title: "Draw an area, get a queue",
        body: "Draw a polygon over a map or type a neighborhood, pick a keyword and a grid resolution, and the tool tiles the area into cells and pulls matching businesses through a self-hosted scraper. Progress streams live over Server-Sent Events, and jobs are crash-safe: kill the server mid-scrape and it resumes from the last finished cell instead of starting over.",
        image: {
          src: canvassScraper,
          alt: "Canvass scraper with a polygon drawn over a Buenos Aires map, split into grid cells",
        },
      },
      {
        title: "Deterministic lead scoring",
        body: "Every lead gets a 0-to-1 score from pure math, so the queue is stable and I can explain any ranking. Ratings are pulled toward the database mean with Bayesian shrinkage — a 5.0 with two reviews shouldn't outrank a 4.6 with four hundred, and that alone killed roughly 720 low-sample five-stars that flooded the top. Review volume, category budget, reachability and visible site pain fill out the weights.",
      },
      {
        title: "Read the website before pitching",
        body: "A cheap crawl checks the basics: SSL, mobile viewport, booking, WhatsApp, PageSpeed. Then a gated vision pass renders the site in headless Chromium, screenshots desktop and mobile, and has Gemini read the design and name specific gaps. The expensive layer only runs for leads heading into outreach — the difference between an AI bill of a few cents and a few dollars. The draft cites one concrete problem, never a generic pitch.",
        image: {
          src: canvassAnalytics,
          alt: "Canvass analytics: pipeline funnel, lead density map of Buenos Aires and send-streak calendar",
        },
      },
      {
        title: "Reply detection that distrusts machines",
        body: "Every ten minutes an IMAP scan checks the inbox for contacted leads. The trap is that autoresponders look exactly like replies, so each match is classified with three signals: RFC 3834 auto-reply headers, out-of-office heuristics in English and Spanish, and velocity — an answer inside three minutes of a cold send is a machine. Real replies leave the follow-up queue immediately; out-of-offices don't count as engagement.",
      },
    ],
    outcome:
      "Runs in Docker on my machine and drives my actual acquisition: five thousand plus leads scraped, hundreds contacted, every billed AI call in a cost ledger that reports cost-per-send and cost-per-reply. Text stages run on free-tier models with a paid fallback that takes over automatically when one starts failing.",
  },
];
