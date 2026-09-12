/**
 * The four cluster cells register their DOM elements here; the 3D particle
 * nodes are placed each frame so they project onto the cell centres.
 */
export const CLUSTER_NODES = [
  { id: 'node_01', role: 'api' },
  { id: 'node_02', role: 'db_primary' },
  { id: 'node_03', role: 'partition_01' },
  { id: 'node_04', role: 'partition_02' },
] as const;

export const clusterRegistry = new Map<number, HTMLElement>();

export const registerCell = (index: number) => (el: HTMLElement | null) => {
  if (el) clusterRegistry.set(index, el);
  else clusterRegistry.delete(index);
};
