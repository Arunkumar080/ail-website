import type { ReactNode } from 'react';
import { Item } from './Motion.tsx';
import { Card, Section } from './Section.tsx';

/*
 * Every graphic is raw inline SVG: a true-black tile, pure white 1.5px
 * strokes, cyan highlights, hollow geometry only. `.gfx *` (site.css) sets
 * vector-effect: non-scaling-stroke, so a graphic renders at any size with
 * its strokes staying exactly 1.5px.
 */
const FRAME = {
  viewBox: '0 0 240 160',
  fill: 'none',
  stroke: '#ffffff',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'gfx block aspect-[3/2] h-auto w-full max-w-full',
  role: 'img',
} as const;
const SPARK = { filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.7))' } as const;
const SPARK_BRIGHT = { filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.8))' } as const;

/** A tangled monolith funnels through a cyan filter into three parallel streams. */
const TANGLE = 'M26 44 48 34M48 34 66 50M26 44 32 70M66 50 56 78M32 70 56 78M32 70 24 98M56 78 70 92M24 98 46 108M46 108 70 92M46 108 34 124M34 124 58 130M58 130 70 92M48 34 56 78M24 98 34 124';
const KNOT = [[26, 44], [48, 34], [66, 50], [32, 70], [56, 78], [24, 98], [46, 108], [70, 92], [34, 124], [58, 130]];
const STREAM_Y = [56, 80, 112];
const STREAM_X = [160, 184, 208];

function Refactor() {
  return (
    <svg {...FRAME} aria-label="a tangle of monolith nodes funnelling through a cyan filter into three parallel streams">
      <path opacity="0.5" d={TANGLE} />
      {KNOT.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" />
      ))}
      <path opacity="0.6" d="M74 50 104 74M74 124 104 90" />
      <rect x="106" y="56" width="12" height="48" rx="6" stroke="#22d3ee" style={SPARK} />
      <path opacity="0.7" d="M120 64 132 56M120 80 132 80M120 96 132 112" />
      <g opacity="0.75">
        {STREAM_Y.map((y) => (
          <path key={y} d={`M136 ${y} 156 ${y}M164 ${y} 180 ${y}M188 ${y} 204 ${y}M212 ${y} 226 ${y}`} />
        ))}
        {STREAM_Y.map((y) => STREAM_X.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" />))}
      </g>
    </svg>
  );
}

/** A cyan cylinder dropping into an isometric partition with concentric ripples. */
function DataScaling() {
  return (
    <svg {...FRAME} aria-label="a cyan cylinder dropping into an isometric data partition with concentric ripples">
      <path
        opacity="0.38"
        d="M120 68 47.3 110M132.1 75 59.4 117M144.2 82 71.5 124M156.4 89 83.6 131M168.5 96 95.8 138M180.6 103 107.9 145M192.7 110 120 152M120 68 192.7 110M107.9 75 180.6 117M95.8 82 168.5 124M83.6 89 156.4 131M71.5 96 144.2 138M59.4 103 132.1 145M47.3 110 120 152"
      />
      <g stroke="#22d3ee">
        <ellipse cx="120" cy="110" rx="62" ry="30" opacity="0.25" />
        <ellipse cx="120" cy="110" rx="44" ry="21" opacity="0.45" />
        <g style={SPARK}>
          <ellipse cx="120" cy="36" rx="22" ry="10" />
          <path d="M98 36V110M142 36V110" />
          <ellipse cx="120" cy="110" rx="22" ry="10" />
        </g>
      </g>
    </svg>
  );
}

/** A closed loop of circle, square and diamond with a cyan spark tracing it. */
function Pipelines() {
  return (
    <svg {...FRAME} aria-label="a closed loop of circle, square and diamond with a cyan spark tracing the pipeline">
      <circle cx="56" cy="48" r="19" />
      <rect x="164" y="29" width="38" height="38" />
      <path d="M120 100 146 124 120 148 94 124Z" />
      <path opacity="0.85" d="M75 48H164M157 42 164 48 157 54" />
      <path opacity="0.85" d="M180 67 140 112M147 108 140 112 140 105" />
      <path opacity="0.85" d="M100 112 66 66M66 73 66 66 73 67" />
      <path className="ail-spark" d="M56 48 183 48 120 124Z" pathLength={120} strokeDasharray="7 113" stroke="#22d3ee" style={SPARK_BRIGHT} />
    </svg>
  );
}

const CARDS: { index: string; title: string; body: string; graphic: ReactNode }[] = [
  {
    index: '01',
    title: 'deep-stack refactoring',
    body: 'we convert slow single-tenant monoliths into scalable multi-tenant architectures, in place, without disrupting daily operations.',
    graphic: <Refactor />,
  },
  {
    index: '02',
    title: 'bare-metal data scaling',
    body: 'we replace choking database layers with zero-allocation engines that absorb 2m+ record inserts while shrinking the compute bill.',
    graphic: <DataScaling />,
  },
  {
    index: '03',
    title: 'autonomous pipelines',
    body: 'multi-agent workflows ingest raw requirements and generate production-ready code in days, inside your review process.',
    graphic: <Pipelines />,
  },
];

export function Interventions() {
  return (
    <Section id="interventions" index="01 / 05" eyebrow="interventions" title="the problems we take on.">
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {CARDS.map((c) => (
          <Item key={c.index} className="flex">
            <Card className="flex w-full flex-col p-[22px]">
              <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-black">{c.graphic}</div>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{`// ${c.index}`}</p>
              <h3 className="mt-2.5 text-[22px] font-medium leading-[1.15] tracking-[-0.025em] text-ink lg:text-2xl">{c.title}</h3>
              <p className="mt-3 text-pretty text-[15.5px] leading-[1.6] text-muted">{c.body}</p>
            </Card>
          </Item>
        ))}
      </div>
    </Section>
  );
}
