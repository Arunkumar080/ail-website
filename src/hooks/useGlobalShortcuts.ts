import { useEffect } from 'react';
import { synth } from '../audio/synth.ts';
import { goToMode, perimeter, type Mode } from '../state/perimeter.ts';

const MODE_KEYS: Record<string, Mode> = {
  '0': 'gateway',
  g: 'gateway',
  '1': 'perimeter',
  p: 'perimeter',
  '2': 'simulator',
  v: 'simulator',
  '3': 'ledger',
  l: 'ledger',
  '4': 'phantom',
  d: 'phantom',
};

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date']);

function isTyping(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === 'TEXTAREA') return true;
  return target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type);
}

/**
 * Zero-mouse navigation. Letters and digits are ignored while a text input
 * has focus so typing never switches modes; Escape always releases focus.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const typing = isTyping(e.target);

      if (e.key === 'Escape') {
        if (typing) {
          e.target.blur();
          e.preventDefault();
          return;
        }
        const { mode, selectedNode } = perimeter.get();
        if (mode === 'ledger' && selectedNode) {
          perimeter.set({ selectedNode: null });
          e.preventDefault();
        }
        return;
      }
      if (typing) return;

      // executive dossier paging
      const s = perimeter.get();
      if (s.mode === 'gateway' && s.gatewayView === 'executive') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          perimeter.set({ dossierPage: Math.min(5, s.dossierPage + 1) });
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          perimeter.set({ dossierPage: Math.max(0, s.dossierPage - 1) });
          return;
        }
      }

      const key = e.key.toLowerCase();
      if (key === '/') {
        const input = document.getElementById('intent') ?? document.getElementById('vivid-query');
        if (input) {
          e.preventDefault();
          input.focus();
        }
        return;
      }
      if (key === 'm') {
        e.preventDefault();
        synth.toggle();
        return;
      }
      const mode = MODE_KEYS[key];
      if (mode) {
        e.preventDefault();
        goToMode(mode);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
