import { Logo } from '../site/components/Logo.tsx';
import { goToMode, useMode, type Mode } from '../state/perimeter.ts';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'gateway', label: '00 gateway' },
  { mode: 'perimeter', label: '01 perimeter' },
  { mode: 'simulator', label: '02 simulator' },
  { mode: 'ledger', label: '03 ledger' },
  { mode: 'phantom', label: '04 phantom' },
];

/** The top-left mark, extended into a direct mode navigator (no reloads). */
export function ModeNav() {
  const mode = useMode();
  const active: Mode = mode === 'routing' ? 'perimeter' : mode;
  return (
    <nav className="mark" aria-label="mode navigator">
      <a href="/" className="mark__org-group group flex items-center gap-3">
        <Logo className="h-6 w-6 shrink-0 transition-transform duration-500 group-hover:scale-105" />
        <div className="hidden sm:flex flex-col justify-center translate-y-[1px]">
          <span className="text-[1.05rem] font-medium tracking-[0.03em] text-white leading-none">
            aetherius
          </span>
          <span className="text-[0.5rem] font-mono tracking-[0.25em] text-cyan-400 uppercase leading-none mt-1 opacity-80">
            intelligence labs
          </span>
        </div>
      </a>
      <span className="mark__sep" aria-hidden="true">
        //
      </span>
      <div className="mark__modes">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            className="mark__mode"
            data-active={active === m.mode || undefined}
            aria-current={active === m.mode ? 'page' : undefined}
            onClick={() => goToMode(m.mode)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
