import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Eyebrow } from './Section.tsx';

const STEPS = [
  { day: 'day 01', title: 'audit & deploy', body: 'agents land in your vpc under your iam and build a living graph of the architecture within hours.' },
  { day: 'day 07', title: 'bottleneck isolation', body: 'we rank the most expensive pipelines by cost per request and agree the target list with your leads.' },
  { day: 'day 14', title: 'surgical rewrites', body: 'rewrites ship as ordinary pull requests behind flags, reviewed by your engineers before rollout.' },
  { day: 'day 30', title: 'measured roi', body: 'we lock the optimised baseline, publish the value-delta report, and invoice the royalty on it.' },
] as const;

/**
 * A timeline, not cards: one hairline fading from cyan to white/8 across the
 * whole row, with each checkpoint's dot pinned onto it.
 */
export function Engagement() {
  return (
    <section id="engagement" className="relative scroll-mt-20 border-t border-white/[0.07] py-14 lg:py-16">
      <Container>
        <Item>
          <Eyebrow index="05 / 05" label="engagement" />
        </Item>
        <Item>
          <div className="mt-5 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
            <h2 className="text-balance text-[32px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[38px] lg:text-[46px]">
              the first thirty days.
            </h2>
            <p className="max-w-[44ch] text-base leading-[1.6] text-muted lg:mb-1.5">
              four checkpoints, one contract, no capital at risk until the delta is signed off.
            </p>
          </div>
        </Item>

        <Item>
          <div aria-hidden="true" className="mt-9 h-px bg-gradient-to-r from-cyan/50 to-white/[0.08]" />
          <div className="-mt-[9px] grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.day}>
                <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-cyan bg-shell">
                  <span className="h-[5px] w-[5px] rounded-full bg-cyan" />
                </div>
                <p className="mt-[18px] font-mono text-xs uppercase tracking-[0.16em] text-cyan">{s.day}</p>
                <h3 className="mt-2.5 text-xl font-medium tracking-[-0.02em] text-ink">{s.title}</h3>
                <p className="mt-2.5 pr-3.5 text-[15px] leading-[1.6] text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Item>
      </Container>
    </section>
  );
}
