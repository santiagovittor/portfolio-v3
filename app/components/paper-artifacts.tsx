/**
 * Print artifacts behind the paper sheet: the 12-column grid drawn as faint
 * hairlines (the layout system made visible) and big ink-bleed washes in the
 * two brand inks that drift slowly with scroll (globals.css → Paper
 * artifacts). Sections paint above; the washes surface in the open paper.
 */
export function PaperArtifacts() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid-lines absolute inset-y-0 left-5 right-5 md:left-16 md:right-16" />
      <div
        className="artifact-wash wash-sky"
        style={{ top: "1%", right: "-22%", width: "58vw", height: "58vw" }}
      />
      <div
        className="artifact-wash wash-poppy"
        style={{ top: "26%", left: "-24%", width: "64vw", height: "64vw" }}
      />
      <div
        className="artifact-wash wash-sky"
        style={{ bottom: "-6%", right: "-14%", width: "48vw", height: "48vw" }}
      />
    </div>
  );
}
