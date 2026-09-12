/**
 * DOM labels for planes and nodes are positioned by the ledger's frame loop
 * (world → screen projection) writing transforms straight to the elements.
 * Nothing here goes through React state.
 */
export const labelRegistry = new Map<string, HTMLElement>();

export const registerLabel = (key: string) => (el: HTMLElement | null) => {
  if (el) labelRegistry.set(key, el);
  else labelRegistry.delete(key);
};
