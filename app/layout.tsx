import type { Metadata } from "next";
import { Archivo, Newsreader } from "next/font/google";
import { Grain } from "./components/grain";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: "italic",
});

export const metadata: Metadata = {
  title: "Santiago Vittor — designer-engineer",
  description:
    "Designer-engineer in Buenos Aires. Product design, frontend engineering, and AI integration.",
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
        {children}
        <Grain />
      </body>
    </html>
  );
}
