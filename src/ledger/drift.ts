import { NODES, RECOVERY_LINE, driftHash } from './nodes.ts';
import { synth } from '../audio/synth.ts';
import { perimeter, type NodeId } from '../state/perimeter.ts';

const ESCALATE_MS = 900;
const RECOVER_MS = 2500;

let timers: number[] = [];

/**
 * Simulated illegal code modification on `nodeId`:
 * hash mismatch → drifted (amber) → quarantined (flashing red) → after 2.5s
 * the EidosEye recovery protocol re-compiles, re-aligns the hash, and
 * appends the recovery line to the node's decision log.
 */
export function triggerDrift(nodeId: NodeId) {
  if (perimeter.get().drift.phase !== 'synced') return;
  const bad = driftHash(NODES[nodeId].astHash);
  perimeter.driftAt = performance.now();
  synth.driftAlert();
  perimeter.set({ drift: { nodeId, phase: 'drifted', hash: bad } });

  timers.push(
    window.setTimeout(() => {
      perimeter.set({ drift: { nodeId, phase: 'quarantined', hash: bad } });
    }, ESCALATE_MS),
  );
  timers.push(
    window.setTimeout(() => {
      const logs = perimeter.get().driftLog;
      perimeter.set({
        drift: { nodeId: null, phase: 'synced', hash: null },
        driftLog: { ...logs, [nodeId]: [...(logs[nodeId] ?? []), RECOVERY_LINE] },
      });
      timers = [];
    }, RECOVER_MS),
  );
}
