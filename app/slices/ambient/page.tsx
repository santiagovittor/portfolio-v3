import type { Metadata } from "next";
import { AmbientSlice } from "./ambient";

export const metadata: Metadata = {
  title: "Slice — The ambient layer",
  robots: { index: false },
};

export default function AmbientSlicePage() {
  return (
    <main className="min-h-svh bg-paper">
      <AmbientSlice />
    </main>
  );
}
