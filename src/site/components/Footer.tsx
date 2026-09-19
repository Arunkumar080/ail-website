import { COMPANY_LINKS, LINKEDIN_HREF, PRIVACY_HREF, PRODUCT_LINKS } from '../links.ts';
import { Container } from './Container.tsx';
import { Logo, Wordmark } from './Logo.tsx';

const HEAD = 'mb-[18px] font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted';
const LINK = 'normal-case text-quiet transition-colors duration-300 hover:text-cyan-lift';

/** `base` prefixes the in-page anchors — see the note on `Nav`. */
export function Footer({ base = '' }: { base?: string }) {
  return (
    <footer className="border-t border-white/[0.11] bg-void pt-14 pb-[22px]">
      <Container className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-center gap-[11px]">
            <Logo className="h-[26px] w-[26px] shrink-0" />
            <Wordmark />
          </div>
          <p className="mt-[18px] max-w-[30ch] text-[14.5px] leading-[1.6] text-muted">
            your private, embedded research team — a fleet of ai agents and deep-tech experts, paid only once the
            problem is solved.
          </p>
        </div>

        <nav aria-label="product">
          <h4 className={HEAD}>{'// product'}</h4>
          <ul className="flex list-none flex-col gap-[11px] p-0 text-[14.5px]">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href.startsWith('#') ? `${base}${l.href}` : l.href} className={LINK}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="company">
          <h4 className={HEAD}>{'// company'}</h4>
          <ul className="flex list-none flex-col gap-[11px] p-0 text-[14.5px]">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href.startsWith('#') ? `${base}${l.href}` : l.href} className={LINK}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4 className={HEAD}>{'// contact'}</h4>
          <a href="mailto:info@aetheriuslabs.com" className="text-[15.5px] text-ink transition-colors duration-300 hover:text-cyan-lift">
            info@aetheriuslabs.com
          </a>
          <div className="mt-4">
            <a
              href={`${base}#contact`}
              className="inline-flex h-[38px] items-center rounded-full border border-cyan/55 px-5 font-mono text-[11.5px] normal-case tracking-[0.08em] text-cyan transition-colors duration-300 hover:bg-cyan/10"
            >
              Book a Technical Call
            </a>
          </div>
          <div className="mt-[18px] flex items-center gap-3.5 text-[14.5px]">
            <a href={LINKEDIN_HREF} target="_blank" rel="noopener noreferrer" className={LINK}>
              LinkedIn
            </a>
            <span className="text-[#5c6469]">/</span>
            <a href="#github" className={LINK}>
              GitHub
            </a>
          </div>
        </div>
      </Container>

      <div className="mt-11 border-t border-white/[0.11] pt-5">
        <Container className="flex flex-col items-start justify-between gap-4 font-mono text-[11.5px] tracking-[0.1em] text-[#8e979f] sm:flex-row sm:items-center">
          <p>aetherius intelligence labs ltd · © 2026</p>
          <div className="flex gap-6">
            <a href={PRIVACY_HREF} className="normal-case transition-colors duration-300 hover:text-cyan-lift">
              Privacy
            </a>
            <a href={`${base}#security-trust`} className="normal-case transition-colors duration-300 hover:text-cyan-lift">
              Security
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
