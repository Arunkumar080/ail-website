import { useSyncExternalStore } from 'react';
import { synth } from '../audio/synth.ts';

/** `[audio: on/off]` — muted by default; the first enable happens on this click. */
export function AudioToggle() {
  const on = useSyncExternalStore(synth.subscribe, () => synth.enabled);
  return (
    <button
      type="button"
      className="audio-toggle"
      aria-pressed={on}
      aria-label={on ? 'mute procedural audio' : 'enable procedural audio'}
      onClick={() => synth.toggle()}
    >
      <svg className="audio-toggle__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M2.5 6h2.6L8.5 3.2v9.6L5.1 10H2.5z" fill="currentColor" />
        {on ? (
          <>
            <path d="M10.6 5.6a3 3 0 0 1 0 4.8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M12.4 3.9a5.4 5.4 0 0 1 0 8.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </>
        ) : (
          <path d="M10.5 6.2l3.4 3.6M13.9 6.2l-3.4 3.6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        )}
      </svg>
      <span className="tok">audio: {on ? 'on' : 'off'}</span>
    </button>
  );
}
