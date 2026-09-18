import type { ReactNode } from 'react';
import { Item } from './Motion.tsx';
import { Card, Section } from './Section.tsx';

/*
 * The five tools, inlined. These marks are the site's own — `src/brand/` is
 * shared with the /simulator/ canvas app and sits outside this stylesheet's
 * Tailwind scan scope, so it is deliberately left untouched.
 */
const ICON = {
  viewBox: '0 0 28 28',
  width: 28,
  height: 28,
  fill: 'none',
  stroke: '#22d3ee',
  strokeWidth: 1.4,
  'aria-hidden': true,
} as const;

type Tool = { id: string; name: string; body: string; metric: string; span: string; icon: ReactNode };

const TOOLS: Tool[] = [
  {
    id: 'aetherius-db',
    name: 'aetherius db',
    body: 'hardware-native data engine. zero-allocation storage paths, 2m+ partition inserts without a queue in front of it.',
    metric: '8.2× throughput',
    span: 'lg:col-span-2',
    icon: (
      <svg {...ICON}>
        <ellipse cx="14" cy="7" rx="9" ry="3.6" />
        <path d="M5 7v14c0 2 4 3.6 9 3.6s9-1.6 9-3.6V7" />
        <path opacity="0.5" d="M5 14c0 2 4 3.6 9 3.6s9-1.6 9-3.6" />
      </svg>
    ),
  },
  {
    id: 'vision-craft',
    name: 'vision craft',
    body: 'multi-agent pipeline. takes a prd and returns reviewed, test-covered code on your branch conventions.',
    metric: '90% cycle reduction',
    span: 'lg:col-span-2',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="3" width="9" height="9" />
        <rect x="16" y="16" width="9" height="9" />
        <path opacity="0.55" d="M12 7.5h8.5V16M7.5 12v8.5H16" />
      </svg>
    ),
  },
  {
    id: 'eidos-eye',
    name: 'eidos eye',
    body: 'living architecture graph. ast-bound drift detection that flags divergence the day it lands.',
    metric: '0-day drift detection',
    span: 'lg:col-span-2',
    icon: (
      <svg {...ICON}>
        <circle cx="14" cy="14" r="10.5" />
        <circle cx="14" cy="14" r="3.2" />
        <path opacity="0.5" d="M14 3.5v7M14 17.5v7M3.5 14h7M17.5 14h7" />
      </svg>
    ),
  },
  {
    id: 'proteus',
    name: 'proteus',
    body: 'organizational brain. a continuous-learning ui shell that reshapes itself around how each team actually works.',
    metric: 'continuous ui adaptation',
    span: 'lg:col-start-2 lg:col-span-2',
    icon: (
      <svg {...ICON}>
        <path d="M14 3.5 24.5 14 14 24.5 3.5 14Z" />
        <path opacity="0.55" d="M8.2 14h11.6M14 8.2v11.6" />
      </svg>
    ),
  },
  {
    id: 'aetherius-vivid',
    name: 'aetherius vivid',
    body: 'autonomous shadow architect. the execution interface your engineers drive the agent fleet from.',
    metric: '100% autonomous execution',
    span: 'lg:col-start-4 lg:col-span-2',
    icon: (
      <svg {...ICON}>
        <rect x="3.5" y="5.5" width="21" height="17" rx="2" />
        <path opacity="0.6" d="M7.5 11l3 3-3 3M13 17h7.5" />
      </svg>
    ),
  },
];

/**
 * Six-column bento: three tools across the top row, the remaining two
 * centred beneath them (columns 2–3 and 4–5).
 */
export function Arsenal() {
  return (
    <Section id="arsenal" index="02 / 05" eyebrow="arsenal" title="the aetherius arsenal.">
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
        {TOOLS.map((t) => (
          <Item key={t.id} className={`flex ${t.span}`}>
            <Card className="flex w-full flex-col gap-4 p-6">
              <div className="flex items-center gap-3.5">
                {t.icon}
                <h3 className="text-[19px] font-medium tracking-[-0.02em] text-ink">{t.name}</h3>
              </div>
              <p className="flex-1 text-[15px] leading-[1.6] text-muted">{t.body}</p>
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.11] pt-3.5">
                <span className="font-mono text-[11.5px] tracking-[0.06em] text-cyan">{t.metric}</span>
                <a href="#arsenal" className="font-mono text-[11.5px] normal-case tracking-[0.08em] text-muted transition-colors duration-300 hover:text-cyan-lift">
                  Details
                </a>
              </div>
            </Card>
          </Item>
        ))}
      </div>
    </Section>
  );
}
