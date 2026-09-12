import { synth } from '../audio/synth.ts';
import { perimeter } from '../state/perimeter.ts';

/** Phase boundaries from the spec, ms after click. */
export const PHASE_MS = { injecting: 800, verifying: 1800, symbiotic: 2800 } as const;

export const PHASE_LABEL: Record<number, string> = {
  0: 'unoptimized_legacy_baseline',
  1: 'compiling_ephemeral_binary...',
  2: 'injecting_zero_allocation_fabric...',
  3: 'eidoseye_ast_verification...',
  4: 'symbiotic_optimization_active',
};

const HEX = '0123456789abcdef';

function randomHex(length: number, upper = false): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += HEX[b >> 4] + HEX[b & 15];
  s = s.slice(0, length);
  return upper ? s.toUpperCase() : s;
}

/** `mac_bind: 0x8F4A…` — a simulated hardware hash, 16 hex digits after the spec'd prefix. */
export const macBindHash = () => `0x8F4A${randomHex(12, true)}`;

/** 64-character hex payload behind the `ail_sec_tok_` prefix. */
export const deploymentToken = () => `ail_sec_tok_${randomHex(64)}`;

let timers: number[] = [];

export function executePhantomDrop() {
  if (perimeter.get().dropPhase !== 0) return;
  perimeter.dropAt = performance.now();
  synth.dropPulse();
  perimeter.set({ dropPhase: 1, macBind: macBindHash(), token: null });
  timers.push(window.setTimeout(() => perimeter.set({ dropPhase: 2 }), PHASE_MS.injecting));
  timers.push(window.setTimeout(() => perimeter.set({ dropPhase: 3 }), PHASE_MS.verifying));
  timers.push(
    window.setTimeout(() => {
      perimeter.set({ dropPhase: 4, token: deploymentToken() });
      timers = [];
    }, PHASE_MS.symbiotic),
  );
}
