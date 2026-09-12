/**
 * AIL mark: a white ring holding a cyan diamond around a solid cyan core.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
      <path d="M12 4.5 19.5 12 12 19.5 4.5 12Z" stroke="#22d3ee" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.1" fill="#22d3ee" />
    </svg>
  );
}

/** Wordmark: "aetherius" over a cyan mono "intelligence labs" lockup. */
export function Wordmark() {
  return (
    <span className="flex flex-col gap-[3px]">
      <span className="text-[17px] font-medium leading-none tracking-[0.02em] text-ink">aetherius</span>
      <span className="font-mono text-[8.5px] uppercase leading-none tracking-[0.26em] text-cyan">intelligence labs</span>
    </span>
  );
}
