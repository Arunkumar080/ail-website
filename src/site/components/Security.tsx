import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Eyebrow } from './Section.tsx';

const MONO = "'JetBrains Mono Variable', 'JetBrains Mono', monospace";
const LABEL = { fill: '#9ba4ad', stroke: 'none', fontSize: 10, letterSpacing: 1.3, fontFamily: MONO } as const;

const GUARANTEES = [
  'byo cloud account, byo keys, byo audit log',
  'no outbound egress rules required for us to work',
  'every agent action lands as a reviewable pull request',
] as const;

/**
 * The deployment picture, stated as geometry: agents and client services sit
 * inside the dashed VPC boundary, the public net sits outside it, and the one
 * line that reaches the edge is stopped by a solid cyan bar.
 */
function PerimeterDiagram() {
  return (
    <svg
      viewBox="0 0 560 330"
      className="gfx block h-auto w-full"
      fill="none"
      stroke="#ffffff"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="deployment diagram: agents and client services inside the client vpc boundary, with no connection crossing out to the public internet"
    >
      <rect x="14" y="26" width="404" height="288" rx="14" stroke="#22d3ee" strokeDasharray="7 7" opacity="0.55" />
      <text x="32" y="54" fill="#22d3ee" stroke="none" fontSize="11.5" letterSpacing="1.6" fontFamily={MONO}>
        CLIENT VPC / ISOLATED ENCLAVE
      </text>

      <g opacity="0.5">
        <rect x="452" y="120" width="94" height="100" rx="8" stroke="rgba(255,255,255,0.35)" />
        <text x="465" y="112" fill="#9ba4ad" stroke="none" fontSize="10.5" letterSpacing="1.4" fontFamily={MONO}>
          PUBLIC NET
        </text>
        <path d="M468 152h62M468 170h62M468 188h44" stroke="rgba(255,255,255,0.3)" />
      </g>

      <g stroke="#22d3ee" style={{ filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.55))' }}>
        <rect x="46" y="96" width="58" height="44" rx="7" />
        <rect x="46" y="176" width="58" height="44" rx="7" />
        <rect x="132" y="136" width="58" height="44" rx="7" />
      </g>
      <text x="50" y="90" {...LABEL}>AGENT.01</text>
      <text x="50" y="238" {...LABEL}>AGENT.02</text>
      <text x="136" y="198" {...LABEL}>ENGINE</text>

      <rect x="252" y="96" width="112" height="164" rx="8" stroke="rgba(255,255,255,0.45)" />
      <text x="256" y="90" {...LABEL}>CLIENT SERVICES + DATA</text>
      <path opacity="0.4" d="M268 128h80M268 152h80M268 176h60M268 200h80M268 224h48" />

      <path opacity="0.55" d="M104 118h148M190 158h62M104 198h148M76 140v36M104 130l28 14M104 190l28 -14" />
      <path opacity="0.5" stroke="#22d3ee" d="M364 178h44" />
      <path stroke="#22d3ee" strokeWidth={2.5} d="M410 150v56" />

      <text x="430" y="290" fill="#22d3ee" stroke="none" fontSize="11" letterSpacing="1.4" fontFamily={MONO}>
        0 BYTES OUT
      </text>
      <text x="430" y="308" fill="#9ba4ad" stroke="none" fontSize="10" letterSpacing="1.2" fontFamily={MONO}>
        SAVINGS REPORT ONLY
      </text>
    </svg>
  );
}

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-20 border-t border-white/[0.07] py-14 lg:py-16">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div>
          <Item>
            <Eyebrow index="04 / 05" label="the shadow perimeter" />
          </Item>
          <Item>
            <h2 className="mt-5 max-w-[16ch] text-balance text-[34px] font-medium leading-[1.02] tracking-[-0.042em] text-ink sm:text-[42px] lg:text-[52px]">
              absolute data sovereignty.
            </h2>
          </Item>
          <Item>
            <p className="mt-5 max-w-[46ch] text-pretty text-[17px] leading-[1.6] text-muted lg:text-[18px]">
              our agents and optimisation engines run entirely inside your vpc, under your iam, against your own
              observability stack. source code and customer data never cross the boundary — the only thing that leaves
              is a signed savings report.
            </p>
          </Item>
          <Item>
            <ul className="mt-6 flex list-none flex-col gap-3 p-0">
              {GUARANTEES.map((g, i) => (
                <li key={g} className="flex items-baseline gap-3 text-[15px] text-quiet">
                  <span className="font-mono text-[11px] tracking-[0.1em] text-cyan">{String(i + 1).padStart(2, '0')}</span>
                  {g}
                </li>
              ))}
            </ul>
          </Item>
        </div>

        <Item>
          <div className="rounded-[14px] border border-white/10 bg-black p-4 lg:p-[18px]">
            <PerimeterDiagram />
          </div>
        </Item>
      </Container>
    </section>
  );
}
