import { registerLabel } from '../ledger/labels.ts';
import { focusLayer, selectNode } from '../ledger/navigate.ts';
import { LAYERS, NODE_ORDER, NODES } from '../ledger/nodes.ts';
import { usePerimeter } from '../state/perimeter.ts';

/**
 * The Dimensional Ladder's DOM labels. Each element is anchored to a 3D
 * point; the ledger frame loop projects that point and writes the transform,
 * so React only re-renders when focus/selection changes.
 */
export function LedgerLabels() {
  const focused = usePerimeter((s) => s.focusedLayer);
  const selected = usePerimeter((s) => s.selectedNode);
  return (
    <div className="ladder" aria-label="dimensional ladder">
      {LAYERS.map((name, i) => (
        <button
          key={name}
          type="button"
          ref={registerLabel(`plane:${i}`)}
          className="ladder__plane"
          data-active={focused === i || undefined}
          onClick={() => focusLayer(i)}
        >
          <span className="ladder__in">
            <span className="ladder__idx">0{i + 1}</span>
            <span className="tok">{name}</span>
          </span>
        </button>
      ))}
      {NODE_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          ref={registerLabel(`node:${id}`)}
          className="ladder__node"
          data-active={selected === id || undefined}
          onClick={() => selectNode(id)}
        >
          <span className="ladder__in">
            <span className="ladder__dot" aria-hidden="true" />
            {NODES[id].name}
          </span>
        </button>
      ))}
    </div>
  );
}
