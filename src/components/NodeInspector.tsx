import { triggerDrift } from '../ledger/drift.ts';
import { LAYERS, NODES } from '../ledger/nodes.ts';
import { usePerimeter, type DriftPhase } from '../state/perimeter.ts';

/** EidosEye Sentient Node Schema for the selected node (right half). */
export function NodeInspector() {
  const selected = usePerimeter((s) => s.selectedNode);
  const drift = usePerimeter((s) => s.drift);
  const driftLog = usePerimeter((s) => s.driftLog);

  if (!selected) {
    return (
      <aside className="inspector inspector--empty" aria-label="sentient node inspector">
        <span>select a node on the ladder</span>
      </aside>
    );
  }

  const node = NODES[selected];
  const active = drift.nodeId === node.id;
  const status: DriftPhase = active ? drift.phase : 'synced';
  const hash = active && drift.hash ? drift.hash : node.astHash;
  const log = [...node.why, ...(driftLog[node.id] ?? [])];
  const busy = drift.phase !== 'synced';

  return (
    <aside key={node.id} className="inspector" aria-label="sentient node inspector" data-status={status}>
      <header className="inspector__head">
        <span className="inspector__pip" aria-hidden="true" />
        <h2>Sentient Node Schema</h2>
        <span className="inspector__node">{node.name}</span>
      </header>

      <div className="schema">
        <h3 className="schema__section">identity</h3>
        <span className="schema__k">Node ULID</span>
        <span className="schema__v tok">{node.ulid}</span>
        <span className="schema__k">Target Layer</span>
        <span className="schema__v tok">{LAYERS[node.layer]}</span>
        <span className="schema__k">Parent ID</span>
        <span className="schema__v tok">
          {node.parentId}
          <em>{node.parentName}</em>
        </span>

        <h3 className="schema__section">The Contract</h3>
        <span className="schema__k">role</span>
        <span className="schema__v">{node.role}</span>
        <span className="schema__k">Hard Constraints</span>
        <ul className="schema__v tokens">
          {node.constraints.map((c) => (
            <li key={c} className="tok">
              {c}
            </li>
          ))}
        </ul>

        <h3 className="schema__section">The What</h3>
        <span className="schema__k">Tech Stack</span>
        <span className="schema__v">{node.techStack.join(' · ')}</span>
        <span className="schema__k">Current AST Hash</span>
        <span className="schema__v tok hash" data-status={status}>
          {hash}
        </span>
        <span className="schema__k">Drift Status</span>
        <span className="schema__v">
          <span className="status" data-status={status} role="status" aria-live="polite">
            {status}
          </span>
        </span>

        <h3 className="schema__section">The Why</h3>
        <span className="schema__k">Decision Log</span>
        <ol className="schema__v log" aria-live="polite">
          {log.map((line, i) => (
            <li key={i} data-runtime={i >= node.why.length || undefined}>
              {line}
            </li>
          ))}
        </ol>
      </div>

      <button type="button" className="drift-btn" onClick={() => triggerDrift(node.id)} disabled={busy}>
        Trigger Simulated Code Drift
      </button>
    </aside>
  );
}
