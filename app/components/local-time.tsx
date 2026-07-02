"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

/**
 * Live Buenos Aires clock for the contact section. Renders empty on the
 * server and until mount so there is never a hydration mismatch.
 */
export function LocalTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(formatter.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {time || "--:--"}
    </span>
  );
}
