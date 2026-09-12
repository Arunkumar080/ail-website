import type { ReactNode } from 'react';

/**
 * The one layout primitive: a centred 1216px shell with a 32px gutter. The
 * redesign drops the shared 12-column grid — every section declares its own
 * track ratios (`repeat(3,1fr)`, `repeat(6,1fr)`, `1.15fr 1fr`, …) directly.
 */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1216px] px-6 lg:px-8 ${className}`}>{children}</div>;
}
