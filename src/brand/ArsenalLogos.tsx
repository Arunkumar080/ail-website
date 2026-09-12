import type { JSX, ReactNode } from 'react';
import type { ArsenalId } from '../state/perimeter.ts';

/**
 * Product marks for the five Aetherius Arsenal engines. Architectural
 * wireframes: true black tile, pure white 1.5 strokes, electric cyan
 * highlights, no filled geometry. 32×32 viewBox rendered at 32px so every
 * stroke is exactly 1.5px. Self-contained (the proteus pulse carries its own
 * keyframes) so a mark can be dropped onto either page.
 */
const CYAN = '#00ffff';
const GLOW = { filter: 'drop-shadow(0 0 3px rgba(0,255,255,0.8))' } as const;

function Mark({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#ffffff"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" fill="#000000" stroke="none" />
      {children}
    </svg>
  );
}

/** Three stacked server blades; the centre blade glows cyan and extends further out. */
export const AetheriusDbMark = ({ className }: { className?: string }) => (
  <Mark className={className}>
    <rect x="6" y="5.5" width="20" height="5" rx="1.25" />
    <rect x="3" y="13.5" width="26" height="5" rx="1.25" stroke={CYAN} style={GLOW} />
    <rect x="6" y="21.5" width="20" height="5" rx="1.25" />
  </Mark>
);

/** A wireframe cube whose bottom face is hinging open into a flat square; the unfolding edge is cyan. */
export const VisionCraftMark = ({ className }: { className?: string }) => (
  <Mark className={className}>
    <rect x="5" y="9" width="12" height="12" />
    <rect x="13" y="3" width="12" height="12" />
    <path d="M5 9 L13 3 M17 9 L25 3 M17 21 L25 15 M5 21 L13 15" />
    <path d="M5 21 L9 29 M17 21 L21 29" />
    <path d="M9 29 H21" stroke={CYAN} style={GLOW} />
  </Mark>
);

/** A diamond nested inside a concentric diamond; the centre point is a glowing cyan dot. */
export const EidosEyeMark = ({ className }: { className?: string }) => (
  <Mark className={className}>
    <path d="M16 3 L29 16 L16 29 L3 16 Z" />
    <path d="M16 9 L23 16 L16 23 L9 16 Z" />
    <circle cx="16" cy="16" r="3.5" stroke={CYAN} opacity="0.35" />
    <circle cx="16" cy="16" r="1.4" stroke={CYAN} style={GLOW} />
  </Mark>
);

/** A hexagon with three internal nodes joined by straight lines; the top-right node pulses cyan. */
export const ProteusMark = ({ className }: { className?: string }) => (
  <Mark className={className}>
    <style>{`@keyframes ail-pulse{0%,100%{opacity:1}50%{opacity:.25}}.ail-pulse{animation:ail-pulse 1.8s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.ail-pulse{animation:none}}`}</style>
    <path d="M16 3 L27.3 9.5 V22.5 L16 29 L4.7 22.5 V9.5 Z" />
    <path d="M13.2 21 H18.8 M12.5 19.4 L19 12.1 M20.6 12.7 L20.9 18.8" />
    <circle cx="11" cy="21" r="2.2" />
    <circle cx="21" cy="21" r="2.2" />
    <circle cx="20.5" cy="10.5" r="2.2" stroke={CYAN} style={GLOW} className="ail-pulse" />
  </Mark>
);

/** A 'V' overlapping an inverted 'V' (an hourglass prism) with a cyan vertical beam through the centre. */
export const VividMark = ({ className }: { className?: string }) => (
  <Mark className={className}>
    <path d="M6 3 L16 19 L26 3" />
    <path d="M6 29 L16 13 L26 29" />
    <path d="M16 1 V31" stroke={CYAN} style={GLOW} />
  </Mark>
);

const MARKS: Record<ArsenalId, (p: { className?: string }) => JSX.Element> = {
  aetherius_db: AetheriusDbMark,
  vision_craft: VisionCraftMark,
  eidos_eye: EidosEyeMark,
  proteus: ProteusMark,
  vivid: VividMark,
};

/** The mark for an arsenal node id. */
export function ArsenalLogo({ id, className }: { id: ArsenalId; className?: string }) {
  const M = MARKS[id];
  return <M className={className} />;
}
