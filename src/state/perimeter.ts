import { useSyncExternalStore } from 'react';
import { synth } from '../audio/synth.ts';

/**
 * Tiny external store shared between the DOM tree and the react-three-fiber
 * root. Anything read per-frame (pointer, surge timestamp, hover, slider
 * values via `get()`) is read directly so the render loop never waits on React.
 */
export type Mode = 'gateway' | 'perimeter' | 'routing' | 'simulator' | 'ledger' | 'phantom';
export type GatewayView = 'technical' | 'executive';
export type ArsenalId = 'aetherius_db' | 'vision_craft' | 'eidos_eye' | 'proteus' | 'vivid';
/** 0 idle · 1 compiling · 2 injecting · 3 verifying · 4 symbiotic */
export type DropPhase = 0 | 1 | 2 | 3 | 4;
export interface ConsoleMessage {
  id: number;
  role: 'user' | 'vivid';
  text: string;
}
export type NodeId = 'proteus' | 'visioncraft' | 'eidoseye' | 'aetheriusdb' | 'vivid';
export type DriftPhase = 'synced' | 'drifted' | 'quarantined';

export const INGESTION = { min: 100_000, max: 10_000_000, step: 100_000, default: 2_000_000 } as const;
export const OPEX = { min: 10_000, max: 500_000, step: 1_000, default: 50_000 } as const;

export interface DriftState {
  nodeId: NodeId | null;
  phase: DriftPhase;
  /** the mismatched hash while drifting; null when synced */
  hash: string | null;
}

export interface PerimeterState {
  /** true while the intent terminal has focus — VIVID is listening. */
  listening: boolean;
  mode: Mode;
  /** records per partition insert */
  ingestionLoad: number;
  /** current monthly cloud spend, USD */
  opexBaseline: number;
  /** ledger: node whose schema is open in the inspector */
  selectedNode: NodeId | null;
  /** ledger: plane index the camera is navigated to */
  focusedLayer: number | null;
  drift: DriftState;
  /** ledger: append-only lines added to each node's decision log at runtime */
  driftLog: Partial<Record<NodeId, string[]>>;
  /** phantom: execution sequence phase */
  dropPhase: DropPhase;
  /** phantom: hardware hash generated in phase 1 */
  macBind: string | null;
  /** phantom: single-use deployment token, generated at phase 4 */
  token: string | null;
  /** phantom: VIVID console transcript */
  phantomMessages: ConsoleMessage[];
  /** gateway: the manifesto has finished and the arsenal nodes have spawned */
  arsenal: boolean;
  /** gateway: arsenal node under the pointer */
  arsenalHover: ArsenalId | null;
  /** gateway: the monolith is shattering into the fabric */
  shattering: boolean;
  /** gateway: technical architecture (orbiting nodes) or the executive briefing overlay */
  gatewayView: GatewayView;
  /** gateway · executive briefing: current dossier page (0-based) */
  dossierPage: number;
}

let state: PerimeterState = {
  listening: false,
  mode: 'gateway',
  ingestionLoad: INGESTION.default,
  opexBaseline: OPEX.default,
  selectedNode: null,
  focusedLayer: null,
  drift: { nodeId: null, phase: 'synced', hash: null },
  driftLog: {},
  dropPhase: 0,
  macBind: null,
  token: null,
  phantomMessages: [],
  arsenal: false,
  arsenalHover: null,
  shattering: false,
  gatewayView: 'technical',
  dossierPage: 0,
};
const subscribers = new Set<() => void>();

export const perimeter = {
  get: () => state,
  set(patch: Partial<PerimeterState>) {
    let changed = false;
    for (const key of Object.keys(patch) as (keyof PerimeterState)[]) {
      if (patch[key] !== state[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    for (const cb of subscribers) cb();
  },
  subscribe(cb: () => void) {
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  },
  /** Normalised pointer in [-1, 1]; +y is up (matches three.js). */
  pointer: { x: 0, y: 0 },
  /** performance.now() of the last submitted intent. */
  surgeAt: -1e9,
  surge() {
    perimeter.surgeAt = performance.now();
  },
  /** ingestion_load mapped linearly onto [0, 1]. */
  stress: () => (state.ingestionLoad - INGESTION.min) / (INGESTION.max - INGESTION.min),
  /** ledger: node under the pointer (per-frame, never re-renders) */
  hoverNode: null as NodeId | null,
  /** performance.now() when the current drift began */
  driftAt: -1e9,
  /** performance.now() when the phantom drop was executed */
  dropAt: -1e9,
  /** performance.now() when the gateway monolith began to shatter */
  shatterAt: -1e9,
};

export function usePerimeter<T>(selector: (s: PerimeterState) => T): T {
  return useSyncExternalStore(perimeter.subscribe, () => selector(perimeter.get()));
}
export const useListening = () => usePerimeter((s) => s.listening);
export const useMode = () => usePerimeter((s) => s.mode);

/** Direct mode navigation (no reload). Leaving the terminal always releases listening. */
export function goToMode(mode: Mode) {
  if (state.mode === mode) return;
  synth.modeShift();
  perimeter.set({ mode, listening: false });
}
