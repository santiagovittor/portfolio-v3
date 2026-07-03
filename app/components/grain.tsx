/**
 * Site-wide film grain (DESIGN.md → The grain). Static SVG turbulence tile as
 * a data URI — no live filter per frame, no JS. Mounted once in the root layout.
 */
const NOISE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
)}`;

export function Grain({
  className = "fixed inset-0 z-50",
}: {
  /** Positioning only; pass e.g. "absolute inset-0" to scope it to a surface */
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none opacity-[0.06] mix-blend-overlay ${className}`}
      style={{ backgroundImage: `url("${NOISE}")` }}
    />
  );
}
