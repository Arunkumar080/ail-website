import { Fragment } from 'react';
import { SIMULATOR_HREF } from '../links.ts';
import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Glow } from './Section.tsx';

const PROOF = [
  { value: '40–60%', label: 'avg. cloud spend reduction' },
  { value: '< 30 days', label: 'to first measured roi' },
  { value: '0 bytes', label: 'client data leaving the vpc' },
] as const;

/**
 * Centred statement over a single cyan wash, closed by a full-bleed proof
 * strip. No structural axis line — the redesign carries the eye on the glow
 * and the strip's rules instead.
 */
export function Hero() {
  return (
    <section id="top" className="relative scroll-mt-20 pt-20 lg:pt-[76px]">
      <Glow x="50%" y="26%" w="1300px" h="520px" alpha={0.13} />

      <Container className="flex flex-col items-center text-center">
        <Item>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.26em] text-cyan">{'// embedded deep-tech task force'}</p>
        </Item>
        <Item className="w-full">
          <h1 className="mx-auto mt-[22px] max-w-[940px] text-balance text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-ink sm:text-[52px] lg:text-[68px] lg:leading-[1]">
            stop bleeding cloud capital. start autonomous engineering.
          </h1>
        </Item>
        <Item className="w-full">
          <p className="mx-auto mt-6 max-w-[660px] text-pretty text-[17px] leading-[1.55] text-muted lg:text-[19px]">
            an embedded engineering task force that rewrites your legacy infrastructure inside your own cloud. no upfront
            capital, no data exfiltration — we take a royalty only on the savings we can measure.
          </p>
        </Item>
        <Item>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-[18px]">
            <a
              href={SIMULATOR_HREF}
              className="inline-flex h-[52px] items-center rounded-full border border-cyan bg-cyan/[0.08] px-8 text-base font-medium tracking-[0.01em] text-cyan transition-colors duration-300 hover:bg-cyan/[0.14] lg:px-[34px]"
            >
              launch value-delta simulator
            </a>
            <a
              href="#economics"
              className="inline-flex h-[52px] items-center font-mono text-[13px] tracking-[0.1em] text-quiet transition-colors duration-300 hover:text-cyan-lift"
            >
              [see the economics]
            </a>
          </div>
        </Item>
      </Container>

      <div className="mt-14 border-y border-white/[0.11] bg-white/[0.018]">
        <Container className="grid grid-cols-1 items-center gap-7 py-[26px] sm:grid-cols-[1fr_1px_1fr_1px_1fr]">
          {PROOF.map((p, i) => (
            <Fragment key={p.label}>
              {i > 0 && <div aria-hidden="true" className="hidden h-11 bg-white/[0.11] sm:block" />}
              <div className="text-center">
                <p className="text-[30px] font-medium tracking-[-0.03em] text-ink lg:text-[36px]">{p.value}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{p.label}</p>
              </div>
            </Fragment>
          ))}
        </Container>
      </div>
    </section>
  );
}
