import { workedExample } from '../economics.ts';
import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Card, Eyebrow, Glow } from './Section.tsx';

const PILLARS = [
  { index: '01', title: 'zero upfront', body: 'no retainer, no licence fee, no procurement cycle for capital you have not yet saved.' },
  { index: '02', title: 'metered, not estimated', body: 'savings are read from your own billing api and signed off by your finance team each month.' },
  { index: '03', title: 'capped royalty', body: 'a fixed share of measured savings for 24 months, then the optimised baseline is yours outright.' },
] as const;

const BAR_LABEL = 'font-mono text-xs uppercase tracking-[0.12em]';
const BAR_VALUE = 'font-mono text-[15px] tabular-nums';
const ROW = 'flex justify-between gap-4 border-b border-white/[0.11] py-3';

export function Economics() {
  const v = workedExample();

  return (
    <section id="economics" className="relative scroll-mt-20 border-t border-white/[0.07] bg-cyan/[0.022] py-14 lg:pt-16 lg:pb-[72px]">
      <Glow x="24%" y="0%" w="1100px" h="440px" alpha={0.12} />
      <Container>
        <Item>
          <Eyebrow index="03 / 05" label="economics" />
        </Item>

        <Item>
          <div className="mt-5 grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-12">
            <h2 className="text-balance text-[34px] font-medium leading-[1.02] tracking-[-0.042em] text-ink sm:text-[42px] lg:text-[56px]">
              you pay a royalty on savings. nothing else.
            </h2>
            <p className="text-pretty text-[17px] leading-[1.6] text-muted lg:mb-2 lg:text-[18px]">
              no licences, no retainers, no hourly billing. we meter your infrastructure before we touch it, meter it
              after, and take a fraction of the difference. if the difference is zero, the invoice is zero.
            </p>
          </div>
        </Item>

        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Item key={p.index} className="flex">
              <Card className="w-full p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{`// ${p.index}`}</p>
                <h3 className="mt-3.5 text-[22px] font-medium tracking-[-0.025em] text-ink">{p.title}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-muted">{p.body}</p>
              </Card>
            </Item>
          ))}
        </div>

        {/* worked example: the bars on the left and the ledger on the right are
            driven by the same numbers (economics.ts), never hand-written. */}
        <Item>
          <div className="mt-5 rounded-[14px] border border-cyan/[0.28] bg-white/[0.022] p-6 lg:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-6">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.22em] text-cyan">{'// worked example · month 03'}</p>
              <p className="font-mono text-[11.5px] tracking-[0.1em] text-muted">royalty rate {v.pctLabel} of measured delta</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-11">
              {/* bars */}
              <div className="flex flex-col gap-[18px]">
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`${BAR_LABEL} text-muted`}>baseline monthly spend</span>
                    <span className={`${BAR_VALUE} text-ink`}>{v.baseFmt}</span>
                  </div>
                  <div className="mt-[9px] h-[26px] rounded-[3px] border border-white/[0.18] bg-white/5" />
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`${BAR_LABEL} text-muted`}>measured post-optimisation</span>
                    <span className={`${BAR_VALUE} text-ink`}>{v.optFmt}</span>
                  </div>
                  <div className="mt-[9px] flex h-[26px]">
                    <div className="h-full rounded-l-[3px] border border-white/30 bg-white/10" style={{ width: v.optW }} />
                    <div className="h-full flex-1 rounded-r-[3px] border border-l-0 border-dashed border-cyan/45" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`${BAR_LABEL} text-cyan`}>measured delta · {v.deltaPct} of baseline</span>
                    <span className={`${BAR_VALUE} text-cyan`}>{v.deltaFmt}</span>
                  </div>
                  <div className="mt-[9px] flex h-[26px] justify-end">
                    <div className="flex h-full overflow-hidden rounded-[3px]" style={{ width: v.deltaW }}>
                      <div className="h-full bg-cyan/85" style={{ width: v.royaltySplit }} />
                      <div className="h-full flex-1 border border-l-0 border-cyan bg-cyan/[0.16]" />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <div className="flex font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted" style={{ width: v.deltaW }}>
                      <span style={{ width: v.royaltySplit }}>royalty</span>
                      <span className="flex-1">client net</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ledger */}
              <div className="flex flex-col justify-center font-mono">
                <div className={`${ROW} text-[13.5px] text-muted`}>
                  <span>baseline monthly spend</span>
                  <span className="tabular-nums">{v.baseFmt}</span>
                </div>
                <div className={`${ROW} text-[13.5px] text-muted`}>
                  <span>− measured post-optimisation</span>
                  <span className="tabular-nums">{v.optFmt}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-cyan/35 py-3 text-[15px] text-cyan">
                  <span>= gross savings</span>
                  <span className="tabular-nums">{v.deltaFmt}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.11] py-3 pl-[22px] text-[13px] text-muted">
                  <span>− aetherius royalty ({v.pctLabel})</span>
                  <span className="tabular-nums">{v.royaltyFmt}</span>
                </div>
                <div className="flex justify-between gap-4 pt-4 text-[19px] font-medium text-ink">
                  <span>client net / month</span>
                  <span className="tabular-nums">{v.netFmt}</span>
                </div>
                <p className="mt-4 font-sans text-sm leading-[1.55] text-muted">
                  annualised, that is <span className="text-ink">{v.netAnnual}</span> of recovered capital against an
                  invoice that only exists because the savings do.
                </p>
              </div>
            </div>
          </div>
        </Item>
      </Container>
    </section>
  );
}
