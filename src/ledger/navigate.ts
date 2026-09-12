import { NODES } from './nodes.ts';
import { perimeter, type NodeId } from '../state/perimeter.ts';

/** Open a node's schema and navigate the camera to its plane. */
export function selectNode(id: NodeId) {
  perimeter.set({ selectedNode: id, focusedLayer: NODES[id].layer });
}

/** Navigate the camera to a plane without changing the open schema. */
export function focusLayer(index: number) {
  perimeter.set({ focusedLayer: index });
}
