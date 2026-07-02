const glass =
  "rounded-full border border-white/25 bg-white/12 backdrop-blur-md";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between p-4 md:px-8 md:py-6">
      <a
        href="#top"
        className="font-medium tracking-tight text-white"
        aria-label="Santiago Vittor — home"
      >
        SV
      </a>
      {/* TODO(sv): M2 — flip to ink-on-glass once scrolled onto paper */}
      <nav
        aria-label="Main"
        className={`${glass} absolute left-1/2 -translate-x-1/2 px-2 py-1`}
      >
        <ul className="flex items-center text-sm font-medium text-white">
          <li>
            <a href="#work" className="rounded-full px-4 py-2 transition-colors hover:bg-white/15">
              Work
            </a>
          </li>
          <li>
            <a href="#about" className="rounded-full px-4 py-2 transition-colors hover:bg-white/15">
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="rounded-full px-4 py-2 transition-colors hover:bg-white/15">
              Contact
            </a>
          </li>
        </ul>
      </nav>
      <a
        href="#contact"
        className={`${glass} hidden px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 sm:block`}
      >
        Get in touch
      </a>
    </header>
  );
}
