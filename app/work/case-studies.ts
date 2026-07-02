import type { StaticImageData } from "next/image";
import store from "@/public/images/projects/store.png";
import dubanronald from "@/public/images/projects/dubanronald.png";
// TODO(sv): real cover for the AI assistant case study
import assistant from "@/public/images/hero/eugene-golovesov-OvB7KPihcL8-unsplash.jpg";

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

// TODO(sv): verify facts, years, stacks and outcomes on all three
export const caseStudies: CaseStudy[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    summary: "Services site that sells web and AI work to small businesses.",
    role: "Positioning, copy, design, build",
    year: "2025",
    stack: ["Next.js", "Tailwind", "WhatsApp"],
    cover: { src: store, alt: "santiagovittor.store landing page" },
    problem:
      "Small businesses do not buy development. They buy a site that brings clients, an assistant that answers at 2am, hours saved on repetitive work. My old services page listed technologies and got silence. It needed to speak in outcomes and route interested people somewhere they actually reply: WhatsApp.",
    decisions: [
      {
        title: "Outcomes in the headline, stack in the footnotes",
        body: "The landing leads with what the client gets. Tech stack appears once, small, near the end. Every section ends with the same question a client would ask next, and answers it.",
        image: { src: store, alt: "Landing headline of santiagovittor.store" },
      },
      {
        title: "WhatsApp funnel instead of a contact form",
        body: "Forms create homework: fill fields, wait, check spam. A WhatsApp link opens a conversation in the app my clients already use all day. One tap on mobile, prefilled first message, and I answer as a person, not an autoresponder.",
      },
      {
        title: "One call to action per screen",
        body: "Each viewport has a single next step. No competing buttons, no sidebar, no newsletter. Fewer choices, more conversations.",
      },
    ],
    outcome:
      "The site opens conversations instead of collecting form submissions. It also doubles as a live demo: clients see the kind of site they would get.",
    // TODO(sv): real numbers if available (visits to chats, closed projects)
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    summary: "Personal brand site for a marketing consultant, end to end.",
    role: "Design, frontend",
    year: "2025",
    stack: ["Design", "Frontend"],
    cover: { src: dubanronald, alt: "dubanronald.com landing page" },
    problem:
      "A consultant with strong opinions needed a site that sounds like him instead of a template. The brief: make the argument first, the services second. Most consultant sites open with credentials nobody asked for.",
    decisions: [
      {
        title: "Lead with the client's real objection",
        body: "The page opens with the phrase he says most in first meetings. It filters visitors fast: people who nod keep reading, people who do not were never going to hire him.",
        image: { src: dubanronald, alt: "dubanronald.com headline" },
      },
      {
        title: "Editorial layout over agency gloss",
        body: "Big type, short paragraphs, generous whitespace. It reads like a well set article, which matches how he sells: with arguments, not showreels.",
      },
    ],
    outcome:
      "Shipped end to end and in use as his main link in outreach. The site does the qualifying before the first call.",
    // TODO(sv): confirm client context and any results he shared
  },
  {
    slug: "portfolio-ai-assistant",
    name: "Portfolio AI assistant",
    summary: "RAG chatbot that answers questions about my work, with citations.",
    role: "Design, engineering, evaluation",
    year: "2024",
    stack: ["RAG", "LLM API", "TypeScript"],
    cover: { src: assistant, alt: "Abstract cover image for the AI assistant" },
    problem:
      "Recruiters skim. A portfolio answers the questions I predicted; a chatbot answers the ones they actually have. The risk with LLMs is confident nonsense, and confident nonsense about my own experience is worse than no answer.",
    decisions: [
      {
        title: "Retrieval first, generation second",
        body: "The model only answers from a curated knowledge base about my projects and experience, retrieved per question. No retrieval hit, no answer. The prompt requires citing which document backs each claim.",
      },
      {
        title: "Refusal as a feature",
        body: "Out of scope questions get a plain refusal and a pointer to my email. A bot that says 'I do not know that' earns trust for the answers it does give.",
      },
      {
        title: "Knowledge base editable without code",
        body: "Content lives in plain files I can update when a project ships. Rebuilding the index is one command. If updating is hard, the bot rots.",
      },
    ],
    outcome:
      "Ran on portfolio v2. This version ships without it while I rebuild it on this stack; the nav has a slot reserved. At FoodStyles I later built the same pattern in production with chunking, cosine retrieval and refusal guardrails, used by non technical staff daily.",
  },
];
