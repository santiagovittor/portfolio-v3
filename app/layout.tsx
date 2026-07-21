import type { Metadata } from "next";
import { Archivo, Newsreader } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Grain } from "./components/grain";
import { SmoothScroll } from "./components/smooth-scroll";
import { PageSignals, PostHogProvider } from "./analytics/posthog-provider";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: "italic",
  preload: false,
});

export const metadata: Metadata = {
  // .com is the services site; this portfolio's home is .online.
  metadataBase: new URL("https://santiagovittor.online"),
  title: {
    default: "Santiago Vittor, designer-engineer",
    template: "%s · Santiago Vittor",
  },
  description:
    "Designer-engineer in Buenos Aires. Product design, frontend engineering, AI integration and automation.",
  openGraph: {
    title: "Santiago Vittor, designer-engineer",
    description:
      "Product design, frontend engineering, AI integration and automation. Based in Buenos Aires.",
    url: "/",
    siteName: "Santiago Vittor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${newsreader.variable} antialiased`}
    >
      <body>
        <PostHogProvider>
          <SmoothScroll />
          {children}
          <PageSignals />
        </PostHogProvider>
        <Grain />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("%cSantiago Vittor%c\\nDesigned and built by hand. The repo is part of the portfolio:\\nhttps://github.com/santiagovittor/portfolio-v3","font:600 16px Archivo,sans-serif;color:#e86a17","font:14px Archivo,sans-serif;color:#2a2e33")`,
          }}
        />
      </body>
    </html>
  );
}
