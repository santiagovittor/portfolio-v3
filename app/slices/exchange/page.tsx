import type { Metadata } from "next";
import { ExchangeSlice } from "./exchange";

export const metadata: Metadata = {
  title: "Slice — The exchange",
  robots: { index: false },
};

export default function ExchangeSlicePage() {
  return (
    <main className="min-h-svh bg-paper">
      <ExchangeSlice />
    </main>
  );
}
