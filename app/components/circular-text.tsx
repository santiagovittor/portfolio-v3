/**
 * Reactbits "CircularText" as a letterpress seal: text on a circle,
 * rotating slowly. Pure SVG + CSS, static under reduced motion.
 */
export function CircularText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={`seal ${className}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs>
          <path
            id="seal-circle"
            d="M 60,60 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0"
          />
        </defs>
        <circle cx="60" cy="60" r="59" fill="var(--color-poppy)" />
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="1"
        />
        <text
          fill="var(--color-paper)"
          fontSize="10.5"
          fontWeight="500"
          letterSpacing="0.18em"
        >
          <textPath href="#seal-circle">{text}</textPath>
        </text>
      </svg>
    </div>
  );
}
