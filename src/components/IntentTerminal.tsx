import { useEffect, useRef, useState, type FormEvent } from 'react';
import { keyClick } from '../audio/keyClick.ts';
import { perimeter, useListening, useMode } from '../state/perimeter.ts';

const ROUTING_LINE = '> Intent Registered. Routing to Value-Delta Simulation Engine...';
const PRINT_MS_PER_CHAR = 22;
const HOLD_AFTER_PRINT_MS = 700;

export function IntentTerminal() {
  const listening = useListening();
  const mode = useMode();
  const [value, setValue] = useState('');
  const [printed, setPrinted] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const routing = mode === 'routing';

  // Routing: print the line character by character, hold, then hand over to the simulator.
  useEffect(() => {
    if (!routing) return;
    let i = 0;
    let hold: number | undefined;
    const tick = window.setInterval(() => {
      i++;
      setPrinted(ROUTING_LINE.slice(0, i));
      if (i >= ROUTING_LINE.length) {
        window.clearInterval(tick);
        hold = window.setTimeout(() => perimeter.set({ mode: 'simulator', listening: false }), HOLD_AFTER_PRINT_MS);
      }
    }, PRINT_MS_PER_CHAR);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(hold);
    };
  }, [routing]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode !== 'perimeter') return;
    const intent = value.trim();
    if (!intent) return;
    perimeter.surge();
    setValue('');
    perimeter.set({ mode: 'routing' });
  };

  const status = routing
    ? 'Aetherius Vivid · Routing'
    : listening
      ? 'Aetherius Vivid · Listening'
      : 'Aetherius Vivid · Standby';

  return (
    <form
      className="terminal"
      data-listening={listening || routing}
      data-routing={routing || undefined}
      onSubmit={onSubmit}
    >
      <div className="terminal__status" role="status" aria-live="polite">
        <span className="terminal__dot" aria-hidden="true" />
        <span>{status}</span>
      </div>
      <div className="terminal__field">
        {routing ? (
          <output className="terminal__print" aria-live="polite">
            {printed}
            <span className="terminal__caret" aria-hidden="true" />
          </output>
        ) : (
          <>
            <span className="terminal__prompt" aria-hidden="true">
              ›
            </span>
            <label className="sr-only" htmlFor="intent">
              deployment intent
            </label>
            <input
              ref={inputRef}
              id="intent"
              name="intent"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={keyClick}
              onFocus={() => perimeter.set({ listening: true })}
              onBlur={() => perimeter.set({ listening: false })}
              placeholder="Initialize deployment intent..."
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
            <kbd className="terminal__key" aria-hidden="true">
              {listening ? 'enter' : '/'}
            </kbd>
          </>
        )}
      </div>
    </form>
  );
}
