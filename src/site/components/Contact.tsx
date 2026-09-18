import type { FormEvent } from 'react';
import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Glow } from './Section.tsx';

const FIELD_LABEL = 'font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted';
const FIELD =
  'h-11 rounded-md border border-white/[0.16] bg-black/50 px-3 text-[15px] text-ink placeholder:text-dim/70 focus-visible:border-cyan/60';

/**
 * The design's form has no action — its `onsubmit` is a bare preventDefault.
 * Wiring it to a real endpoint is a separate decision, so it stays inert here.
 */
export function Contact() {
  const noSubmit = (e: FormEvent<HTMLFormElement>) => e.preventDefault();

  return (
    <section id="contact" className="relative scroll-mt-20 border-t border-white/[0.07] py-14 lg:pt-16 lg:pb-[72px]">
      <Glow x="50%" y="40%" w="1200px" h="420px" alpha={0.1} />
      <Container className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        <Item>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.24em] text-cyan">{'// deploy'}</p>
          <h2 className="mt-5 max-w-[18ch] text-balance text-[34px] font-medium leading-[1.02] tracking-[-0.042em] text-ink sm:text-[42px] lg:text-[52px]">
            name your hardest problem.
          </h2>
          <p className="mt-5 max-w-[44ch] text-pretty text-[17px] leading-[1.6] text-muted lg:text-[18px]">
            send us the shape of your stack and a rough monthly spend. we return a modelled delta and a fixed royalty
            rate within a week — or tell you there is nothing worth taking.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 font-mono text-[13px] tracking-[0.06em]">
            <a href="mailto:deploy@aetheriuslabs.com" className="w-fit text-cyan transition-colors duration-300 hover:text-cyan-lift">
              deploy@aetheriuslabs.com
            </a>
            <span className="text-muted">london · singapore · remote</span>
          </div>
        </Item>

        <Item>
          <form onSubmit={noSubmit} className="flex flex-col gap-4 rounded-[14px] border border-white/[0.12] bg-white/[0.022] p-6 lg:p-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>name</span>
                <input type="text" name="name" autoComplete="name" placeholder="jordan okafor" className={FIELD} />
              </label>
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>work email</span>
                <input type="email" name="email" autoComplete="email" placeholder="jordan@company.com" className={FIELD} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>company</span>
                <input type="text" name="company" autoComplete="organization" placeholder="northwind logistics" className={FIELD} />
              </label>
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>monthly cloud spend</span>
                <input type="text" name="spend" inputMode="numeric" placeholder="$120,000" className={`${FIELD} font-mono text-sm`} />
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>what is breaking</span>
              <textarea
                name="context"
                rows={3}
                placeholder="postgres write path is our ceiling; we are over-provisioned on kubernetes."
                className="resize-y rounded-md border border-white/[0.16] bg-black/50 p-3 text-[15px] leading-[1.5] text-ink placeholder:text-dim/70 focus-visible:border-cyan/60"
              />
            </label>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                className="h-12 cursor-pointer rounded-full border border-cyan bg-cyan/10 px-7 text-[15px] font-medium normal-case text-cyan transition-colors duration-300 hover:bg-cyan/[0.16]"
              >
                Book a Technical Call
              </button>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted">nda on request</span>
            </div>
          </form>
        </Item>
      </Container>
    </section>
  );
}
