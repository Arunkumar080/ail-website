import type { ArsenalId } from '../state/perimeter.ts';

export interface ArsenalNode {
  id: ArsenalId;
  /** display name on the public site */
  name: string;
  /** node token used by the canvas app */
  label: string;
  description: string;
}

/** The five Aetherius Arsenal engines, in orbit order. */
export const ARSENAL: ArsenalNode[] = [
  { id: 'aetherius_db', name: 'Aetherius DB', label: 'Node: Aetherius DB', description: 'hardware-native data engine / zero-allocation / 2m+ partition inserts.' },
  { id: 'vision_craft', name: 'Vision Craft', label: 'Node: Vision Craft', description: 'multi-agent pipeline / autonomous prd-to-code generation.' },
  { id: 'eidos_eye', name: 'Eidos Eye', label: 'Node: Eidos Eye', description: 'living architecture graph / ast-bound drift detection.' },
  { id: 'proteus', name: 'Proteus', label: 'Node: Proteus', description: 'organizational brain / continuous-learning ui shell.' },
  { id: 'vivid', name: 'Aetherius Vivid', label: 'Node: Vivid', description: 'autonomous shadow architect / execution interface.' },
];
