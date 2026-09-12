import { useEffect, useRef, useState, type FormEvent } from 'react';
import { keyClick } from '../audio/keyClick.ts';
import { SCENARIOS, customResponse } from '../phantom/vivid.ts';
import { queryVivid, vividTransport, type VividStream } from '../services/vividApi.ts';
import { perimeter, usePerimeter, type ConsoleMessage } from '../state/perimeter.ts';

let nextId = 1;

/** VIVID Agent Console (left half). */
export function VividConsole() {
  const messages = usePerimeter((s) => s.phantomMessages);
  const [streaming, setStreaming] = useState(false);
  const [value, setValue] = useState('');
  const streamEl = useRef<HTMLParagraphElement>(null);
  const scrollEl = useRef<HTMLDivElement>(null);
  const active = useRef<VividStream | null>(null);

  // Abort a live stream if the console unmounts mid-reply (the partial text is kept).
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    const sc = scrollEl.current;
    if (sc) sc.scrollTop = sc.scrollHeight;
  }, [messages, streaming]);

  const push = (m: ConsoleMessage) => perimeter.set({ phantomMessages: [...perimeter.get().phantomMessages, m] });

  /**
   * Chunks arrive from the service (local typewriter, SSE, or WebSocket) and
   * are written straight to the streaming element, coalesced per animation
   * frame; the full message is committed to React once at the end.
   */
  const ask = async (prompt: string, fallback: string) => {
    if (streaming) return;
    push({ id: nextId++, role: 'user', text: prompt });
    setStreaming(true);
    const stream = queryVivid(prompt, () => fallback);
    active.current = stream;
    let text = '';
    let raf = 0;
    const paint = () => {
      raf = 0;
      const el = streamEl.current;
      if (el) el.textContent = text;
      const sc = scrollEl.current;
      if (sc) sc.scrollTop = sc.scrollHeight;
    };
    try {
      for await (const chunk of stream.chunks) {
        text += chunk;
        if (!raf) raf = requestAnimationFrame(paint);
      }
    } finally {
      cancelAnimationFrame(raf);
      paint();
      if (text) push({ id: nextId++, role: 'vivid', text });
      active.current = null;
      setStreaming(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || streaming) return;
    setValue('');
    void ask(q, customResponse(q));
  };

  return (
    <section className="panel console" aria-label="vivid agent console" data-transport={vividTransport}>
      <header className="panel__head">
        <h2 className="tok">Aetherius Vivid // Shadow Architect V4</h2>
      </header>
      <div className="console__status">
        <span className="pip" aria-hidden="true" />
        <span className="tok">Status: Live And Listening</span>
      </div>
      <div className="console__pills" role="group" aria-label="scenario triggers">
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" className="pill" disabled={streaming} onClick={() => void ask(s.prompt, s.response)}>
            {s.label}
          </button>
        ))}
      </div>
      <div ref={scrollEl} className="console__stream" role="log" aria-live="polite">
        {messages.map((m) => (
          <p key={m.id} className="msg" data-role={m.role}>
            {m.text}
          </p>
        ))}
        {streaming && <p ref={streamEl} className="msg msg--streaming" data-role="vivid" />}
      </div>
      <form className="console__input" onSubmit={onSubmit}>
        <span className="terminal__prompt" aria-hidden="true">
          ›
        </span>
        <label className="sr-only" htmlFor="vivid-query">
          question for vivid
        </label>
        <input
          id="vivid-query"
          name="vivid-query"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={keyClick}
          placeholder="ask vivid..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          disabled={streaming}
        />
      </form>
    </section>
  );
}
