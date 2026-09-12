import { useEffect, useState } from 'react';
import { LINKS, SIMULATOR_HREF } from '../links.ts';
import { Container } from './Container.tsx';
import { Logo, Wordmark } from './Logo.tsx';

/**
 * Which section the reader is in. The band is the 64px under the bar down to
 * 30% of the viewport, so a section becomes active as its head clears the nav.
 */
function useActiveSection() {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-64px 0px -70% 0px' },
    );
    const sections = LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(Boolean);
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return activeId;
}

const PILL =
  'inline-flex shrink-0 items-center rounded-full border border-cyan/55 bg-cyan/[0.06] font-mono tracking-[0.08em] text-cyan transition-colors duration-300 hover:bg-cyan/[0.12]';

export function Nav() {
  const activeId = useActiveSection();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.13] bg-shell/[0.78] backdrop-blur-[14px]">
      <Container className="flex h-16 items-center justify-between gap-6 lg:gap-10">
        <a href="#top" className="flex items-center gap-[11px] text-base">
          <Logo className="h-[26px] w-[26px] shrink-0" />
          <span className="hidden sm:flex">
            <Wordmark />
          </span>
        </a>

        {/* desktop sections */}
        <nav aria-label="sections" className="hidden items-center gap-[30px] text-sm lg:flex">
          {LINKS.map((l) => {
            const active = activeId === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? 'true' : undefined}
                className={`relative py-[22px] transition-colors duration-300 ${active ? 'text-cyan' : 'text-quiet hover:text-cyan-lift'}`}
              >
                {l.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-[15px] h-0.5 bg-cyan transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a href={SIMULATOR_HREF} className={`${PILL} h-9 px-[18px] text-[11.5px]`}>
            [launch simulator]
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="toggle menu"
            className="p-2 text-quiet lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {/* mobile drawer — not in the 1440 artboard; stacking behaviour is ours */}
      {open && (
        <div className="border-t border-white/10 bg-shell/95 backdrop-blur-[14px] lg:hidden">
          <Container className="flex flex-col gap-4 py-6 text-sm">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={activeId === l.href.slice(1) ? 'text-cyan' : 'text-quiet'}
              >
                {l.label}
              </a>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}
