import type { ReactNode } from 'react';
import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';

/**
 * Connective tissue. The redesign has no tracer and no dividers between
 * sections beyond a single hairline top border; depth comes from the faint
 * radial glows and the eyebrow rules.
 */

/** A huge, very faint cyan radial wash sitting behind a section's content. */
export function Glow({ x = '50%', y = '0%', w = '1200px', h = '440px', alpha = 0.12 }: { x?: string; y?: string; w?: string; h?: string; alpha?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -z-10 max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: x, top: y, width: w, height: h, background: `radial-gradient(closest-side, rgba(34,211,238,${alpha}), transparent)` }}
    />
  );
}

/** `// LABEL` in cyan mono, a hairline rule, then the section index at the far right. */
export function Eyebrow({ index, label }: { index?: string; label: string }) {
  return (
    <div className="flex items-center gap-5 font-mono text-[11.5px] uppercase tracking-[0.24em]">
      <span className="text-cyan">{`// ${label}`}</span>
      <span aria-hidden="true" className="h-px min-w-8 flex-1 bg-white/[0.13]" />
      {index && <span className="tabular-nums text-dim">{index}</span>}
    </div>
  );
}

/** Section h2: 46px / 500 / -0.04em, fluid down to 32px. */
export const H2 = 'max-w-[22ch] text-balance text-[32px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[38px] lg:text-[46px]';

/** Static bento card: hairline border, 2.2% white fill. No hover lift, no spotlight. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`h-full rounded-[14px] border border-white/10 bg-white/[0.022] ${className}`}>{children}</article>;
}

/** Section shell: hairline top border, 64px rhythm, eyebrow + optional h2. */
export function Section({
  id,
  index,
  eyebrow,
  title,
  children,
  className = '',
  glow,
}: {
  id: string;
  index?: string;
  eyebrow: string;
  title?: string;
  children: ReactNode;
  className?: string;
  glow?: ReactNode;
}) {
  return (
    <section id={id} className={`relative scroll-mt-20 border-t border-white/[0.07] py-14 lg:py-16 ${className}`}>
      {glow}
      <Container>
        <Item>
          <Eyebrow index={index} label={eyebrow} />
        </Item>
        {title && (
          <Item>
            <h2 className={`mt-5 ${H2}`}>{title}</h2>
          </Item>
        )}
        {children}
      </Container>
    </section>
  );
}
