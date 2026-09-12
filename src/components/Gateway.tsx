import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { synth } from '../audio/synth.ts';
import { ArsenalLogo } from '../brand/ArsenalLogos.tsx';
import { ARSENAL, monolithDim } from '../gateway/arsenal.ts';
import { DOSSIER_PAGES, ECONOMICS, HOOK, PARTNERSHIP, SERVICES, SOVEREIGNTY, VERIFICATION, type DossierBlock } from '../gateway/dossier.ts';
import { goToMode, perimeter, usePerimeter } from '../state/perimeter.ts';

const MANIFESTO = [
  'we do not sell software.',
  'we are an embedded deep-tech task force.',
  'we rewrite your code. we redesign your databases. we operate in your shadows.',
  'zero data exfiltration. zero upfront capital.',
  'you only pay for the inefficiency we destroy.',
];
const HOLD_MS = 2700;
const SHATTER_TO_ROUTE_MS = 950;

const blur = {
  initial: { opacity: 0, filter: 'blur(14px)', y: 10 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
  exit: { opacity: 0, filter: 'blur(14px)', y: -10 },
};
const ease = [0.16, 1, 0.3, 1] as const;

/** Phase 3: sub-bass sweep, shatter the monolith into the fabric, route into [02 simulator]. */
function launchSimulator() {
  if (perimeter.get().shattering) return;
  synth.gatewaySweep();
  perimeter.shatterAt = performance.now();
  perimeter.set({ shattering: true, arsenalHover: null });
  window.setTimeout(() => goToMode('simulator'), SHATTER_TO_ROUTE_MS);
}

const setDossierPage = (page: number) =>
  perimeter.set({ dossierPage: Math.max(0, Math.min(DOSSIER_PAGES.length - 1, page)) });

const PRIMARY_BTN =
  'tok w-full max-w-[30rem] cursor-pointer rounded-[0.7rem] border-0 bg-cyan px-4 py-3.5 text-[0.8rem] font-medium tracking-[0.04em] text-void shadow-[0_0_36px_-6px_rgba(95,242,255,0.7)] transition-[background,box-shadow] duration-200 hover:bg-electric hover:shadow-[0_0_48px_-4px_rgba(95,242,255,0.85)] focus-visible:bg-electric focus-visible:outline-none disabled:cursor-default';
const SECONDARY_BTN =
  'tok cursor-pointer rounded-[0.7rem] border border-hair bg-transparent px-4 py-3.5 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors duration-200 hover:border-cyan hover:text-cyan focus-visible:border-cyan focus-visible:outline-none';

/** Phase 1: the manifesto, one line at a time, fade-and-blur. Ends by spawning the arsenal. */
function Manifesto({ hidden }: { hidden: boolean }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(
      () => {
        if (index < MANIFESTO.length - 1) setIndex(index + 1);
        else {
          setDone(true);
          perimeter.set({ arsenal: true });
        }
      },
      HOLD_MS + (index === 0 ? 500 : 0),
    );
    return () => window.clearTimeout(id);
  }, [index, done]);

  return (
    <motion.div
      className="gate__manifesto flex items-center justify-center"
      aria-live="polite"
      aria-hidden={hidden || undefined}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.5, ease }}
    >
      <AnimatePresence mode="wait">
        {!done && (
          <motion.p
            key={index}
            {...blur}
            transition={{ duration: 0.72, ease }}
            className="mx-auto max-w-[22ch] text-balance text-center text-[clamp(1.55rem,0.9rem+2.4vw,3rem)] font-[340] leading-[1.12] tracking-[-0.022em] text-ink [text-shadow:0_0_40px_rgba(0,0,0,0.9)]"
          >
            {MANIFESTO[index]}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Phase 2 overlay: the hovered node's identity on a strict two-column grid, left side. */
function ArsenalIdentity() {
  const hover = usePerimeter((s) => s.arsenalHover);
  const arsenal = usePerimeter((s) => s.arsenal);
  const node = hover ? ARSENAL.find((n) => n.id === hover) : undefined;
  return (
    <div className="gate__arsenal self-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {arsenal && node && (
          <motion.dl
            key={node.id}
            {...blur}
            transition={{ duration: 0.38, ease }}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 text-[0.74rem] leading-[1.5] tracking-[0.02em]"
          >
            <dt className="tok flex items-center gap-3 text-cyan">
              <ArsenalLogo id={node.id} className="shrink-0" />
              {node.label}
            </dt>
            <dd className="text-ink-dim">→</dd>
            <dd className="col-span-2 max-w-[28ch] text-ink">{node.description}</dd>
          </motion.dl>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Accordion (module 00.7 mechanics): one item open at a time; height animated by framer-motion. */
function Accordion({ items, label }: { items: { id: string; title: string; body: string }[]; label: string }) {
  const [open, setOpen] = useState<string | null>(items[0].id);
  return (
    <ul className="m-0 list-none p-0" aria-label={label}>
      {items.map((item) => {
        const active = open === item.id;
        return (
          <motion.li
            key={item.id}
            className="border-t border-hair last:border-b [contain:layout]"
            animate={{ opacity: active ? 1 : 0.5 }}
            transition={{ duration: 0.4, ease }}
          >
            <button
              type="button"
              id={`acc-${item.id}`}
              aria-expanded={active}
              aria-controls={`acc-${item.id}-body`}
              onClick={() => setOpen(active ? null : item.id)}
              className={`tok w-full cursor-pointer border-0 bg-transparent px-0 py-4 text-left text-[0.86rem] font-medium tracking-[0.03em] transition-colors duration-300 focus-visible:outline-none ${active ? 'text-cyan' : 'text-white hover:text-cyan'}`}
            >
              {item.title}
            </button>
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  key="body"
                  id={`acc-${item.id}-body`}
                  role="region"
                  aria-labelledby={`acc-${item.id}`}
                  className="overflow-hidden will-change-[height]"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.45, ease }, opacity: { duration: 0.3 } }}
                >
                  <p className="max-w-[52ch] pb-5 text-[clamp(0.92rem,0.8rem+0.4vw,1.06rem)] leading-[1.62] tracking-[0.005em] text-white">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}

const BODY = 'max-w-[46ch] text-[clamp(0.96rem,0.82rem+0.45vw,1.14rem)] leading-[1.62] tracking-[0.005em] text-white';
const HEAD = 'tok mb-4 text-[0.78rem] font-medium tracking-[0.06em] text-cyan';

function Blocks({ blocks, cols }: { blocks: DossierBlock[]; cols: 2 | 3 }) {
  return (
    <div className={`grid items-start gap-x-14 gap-y-10 max-wide:grid-cols-1 max-wide:gap-y-9 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {blocks.map((b) => (
        <article key={b.head} className="max-wide:py-1">
          <h3 className={HEAD}>{b.head}</h3>
          <p className={BODY}>{b.body}</p>
        </article>
      ))}
    </div>
  );
}

function PageBody({ page }: { page: number }) {
  switch (DOSSIER_PAGES[page].id) {
    case 'hook':
      return (
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-end gap-x-16 gap-y-10 max-wide:grid-cols-1">
          <h1 className="max-w-[16ch] text-balance text-[clamp(1.9rem,1.1rem+2.9vw,3.9rem)] font-[340] leading-[1.06] tracking-[-0.025em] text-white">
            {HOOK.headline}
          </h1>
          <div className="flex flex-col gap-6">
            <p className={BODY}>{HOOK.proposition}</p>
            <p className="max-w-[46ch] text-[clamp(0.96rem,0.82rem+0.45vw,1.14rem)] leading-[1.62] tracking-[0.005em] text-cyan">{HOOK.bottomLine}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" className={SECONDARY_BTN} onClick={() => setDossierPage(1)}>
                {HOOK.ctaExplore}
              </button>
              <button type="button" className={`${PRIMARY_BTN} !w-auto`} onClick={launchSimulator}>
                {HOOK.ctaSimulate}
              </button>
            </div>
          </div>
        </div>
      );
    case 'services':
      return (
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-x-16 gap-y-8 max-wide:grid-cols-1">
          <p className={BODY}>three tactical interventions, executed by an embedded research and execution team, entirely bound by the pay-as-you-get model.</p>
          <Accordion items={SERVICES} label="services" />
        </div>
      );
    case 'economics':
      return <Blocks blocks={ECONOMICS} cols={2} />;
    case 'sovereignty':
      return <Blocks blocks={SOVEREIGNTY} cols={2} />;
    case 'partnership':
      return <Blocks blocks={PARTNERSHIP} cols={3} />;
    case 'verification':
      return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-x-16 gap-y-8 max-wide:grid-cols-1">
          <div>
            <h3 className={HEAD}>{VERIFICATION.head}</h3>
            <p className={BODY}>{VERIFICATION.body}</p>
          </div>
          <div className="flex justify-end max-wide:justify-start">
            <button type="button" className={`${PRIMARY_BTN} !w-auto`} onClick={launchSimulator}>
              {VERIFICATION.cta}
            </button>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/** The executive dossier: six zero-scroll pages, indexed, arrow-key navigable, over the dimmed monolith. */
function Dossier() {
  const page = usePerimeter((s) => s.dossierPage);
  const current = DOSSIER_PAGES[page];
  const next = DOSSIER_PAGES[page + 1];
  return (
    <motion.section
      className="gate__briefing"
      aria-label="executive briefing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.7, ease }}
    >
      <nav className="mb-8 flex flex-wrap gap-x-5 gap-y-1 text-[0.68rem] tracking-[0.03em]" aria-label="dossier pages">
        {DOSSIER_PAGES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-current={i === page ? 'page' : undefined}
            onClick={() => setDossierPage(i)}
            className={`tok cursor-pointer border-0 bg-transparent p-0 transition-colors duration-250 hover:text-cyan focus-visible:outline-none ${i === page ? 'text-electric' : 'text-ink-mute'}`}
          >
            {p.index} {p.label}
          </button>
        ))}
      </nav>
      <AnimatePresence mode="wait">
        <motion.article
          key={current.id}
          aria-label={current.section}
          initial={{ opacity: 0, filter: 'blur(10px)', x: 18 }}
          animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
          exit={{ opacity: 0, filter: 'blur(10px)', x: -18 }}
          transition={{ duration: 0.45, ease }}
        >
          <h2 className="tok mb-7 text-[0.74rem] font-medium tracking-[0.08em] text-cyan">{current.section}</h2>
          <PageBody page={page} />
          {next && (
            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setDossierPage(page + 1)}
                className="tok cursor-pointer border-0 bg-transparent p-0 text-[0.72rem] tracking-[0.04em] text-ink-dim transition-colors duration-250 hover:text-cyan focus-visible:outline-none"
              >
                next: {next.index} {next.label} →
              </button>
            </div>
          )}
        </motion.article>
      </AnimatePresence>
    </motion.section>
  );
}

/** Bottom-centre CTA. Hidden on dossier pages that carry their own CTAs (hook, verification). */
function Launch({ label, hidden }: { label: string; hidden: boolean }) {
  const shattering = usePerimeter((s) => s.shattering);
  const shown = !shattering && !hidden;
  return (
    <div className="gate__cta flex justify-center" style={{ pointerEvents: shown ? 'auto' : 'none' }}>
      <motion.button
        type="button"
        onClick={launchSimulator}
        disabled={!shown}
        tabIndex={shown ? 0 : -1}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: shown ? 1 : 0, y: 0 }}
        transition={{ duration: 0.6, ease, delay: shown ? 0.4 : 0 }}
        className={PRIMARY_BTN}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={label} className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

/** Module 00: the Master Gateway, with the executive dossier view. */
export function Gateway() {
  const view = usePerimeter((s) => s.gatewayView);
  const page = usePerimeter((s) => s.dossierPage);
  const executive = view === 'executive';
  const pageId = DOSSIER_PAGES[page].id;
  const inlineCta = executive && (pageId === 'hook' || pageId === 'verification');

  // A fresh visit replays the manifesto, re-spawns the arsenal, and starts on the technical view, page 01.
  useEffect(() => {
    perimeter.set({ arsenal: false, arsenalHover: null, shattering: false, gatewayView: 'technical', dossierPage: 0 });
    return () => {
      perimeter.set({ arsenalHover: null, shattering: false });
      document.body.style.cursor = '';
    };
  }, []);

  // framer-motion tweens the monolith's brightness; the R3F loop only reads the value.
  useEffect(() => {
    const controls = animate(monolithDim, executive ? 0.2 : 1, { duration: 0.9, ease });
    return () => controls.stop();
  }, [executive]);

  return (
    <>
      {!executive && <ArsenalIdentity />}
      <Manifesto hidden={executive} />
      <AnimatePresence>{executive && <Dossier />}</AnimatePresence>
      <Launch
        label={executive ? 'Prove The Math: Initialize Value Delta Simulation' : 'Initialize Value Delta Simulation'}
        hidden={inlineCta}
      />
    </>
  );
}
