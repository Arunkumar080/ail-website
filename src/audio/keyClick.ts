import { synth } from './synth.ts';

/** Terminal key click on printable keys and backspace (any console input). */
export const keyClick = (e: { key: string }) => {
  if (e.key.length === 1 || e.key === 'Backspace') synth.click();
};
