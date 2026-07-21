/**
 * The SV press mark: a ligatured monoline SV die-cut into a ticket rectangle.
 * The S's upper terminal doesn't curl back — it exits as the V's left
 * diagonal, so the two letters share one stroke (the Lubalin/U&lc idiom),
 * drawn as path data rather than typed.
 *
 * Everything is `currentColor` so it rides the nav's theme flip. The two
 * ghost copies are the registration hit: sky and poppy print off-register on
 * hover and snap into alignment (`@keyframes register-align`, globals.css).
 * Struck, not spun — the seal on the About portrait already owns rotation.
 */

const LETTERS =
  "M9 17.5C9 20 11.3 21 14 21C16.7 21 19 19.3 19 17C19 12.5 9.5 14.5 9.5 10.3C9.5 8.2 11.5 7 14 7C16.2 7 18 7.8 18.7 9.4L24 21L30 7";

function Glyphs({ className }: { className?: string }) {
  return (
    <g className={className} transform="translate(2.5 0)">
      <path
        d={LETTERS}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

export function PressMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 44 28"
      className={className}
      role="presentation"
    >
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="27"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <Glyphs className="pm-ghost pm-sky" />
      <Glyphs className="pm-ghost pm-poppy" />
      <Glyphs />
    </svg>
  );
}
