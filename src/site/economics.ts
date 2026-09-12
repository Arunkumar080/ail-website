/**
 * The worked example's arithmetic, ported verbatim from the design's own
 * `renderVals()` so the bar widths and the ledger can never disagree.
 *
 * Note the two different roundings the design uses on purpose: `deltaPct` is
 * a whole number for the label copy, while the bar widths keep one decimal.
 */
const BASELINE_SPEND = 120_000;
const OPTIMISED_SPEND = 50_000;
const ROYALTY_PCT = 20;

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export function workedExample(base = BASELINE_SPEND, optimised = OPTIMISED_SPEND, pct = ROYALTY_PCT) {
  const opt = Math.min(optimised, base);
  const delta = Math.max(0, base - opt);
  const royalty = delta * (pct / 100);
  const net = delta - royalty;
  const pctOf = (v: number) => `${(base > 0 ? (v / base) * 100 : 0).toFixed(1)}%`;

  return {
    baseFmt: money(base),
    optFmt: money(opt),
    deltaFmt: money(delta),
    royaltyFmt: money(royalty),
    netFmt: money(net),
    netAnnual: money(net * 12),
    pctLabel: `${pct}%`,
    deltaPct: `${Math.round(base > 0 ? (delta / base) * 100 : 0)}%`,
    /** bar widths, as a share of the baseline bar */
    optW: pctOf(opt),
    deltaW: pctOf(delta),
    /** the royalty slice, as a share of the delta bar — not of the baseline */
    royaltySplit: `${pct}%`,
  };
}
