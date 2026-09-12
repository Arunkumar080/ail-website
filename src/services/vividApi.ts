/**
 * VIVID query service. With `VITE_VIVID_API_URL` unset (the default) every
 * reply comes from the local deterministic engine, paced as a typewriter.
 * With it set, chunks stream from the network:
 *   http(s)://  → POST {prompt} and read Server-Sent Events. Each `data:` line
 *                 may be raw text, or JSON with a `delta` / `text` / `content`
 *                 string. `[DONE]` ends the stream.
 *   ws(s)://    → open a socket, send {prompt}, receive the same payloads
 *                 until `[DONE]`, `{done:true}`, or close.
 * A live request that fails before its first chunk falls back to the local
 * engine so the console always answers.
 */
const API_URL = (import.meta.env.VITE_VIVID_API_URL ?? '').trim();

export const vividLive = API_URL.length > 0;
export const vividTransport: 'local' | 'sse' | 'websocket' = !vividLive ? 'local' : /^wss?:/i.test(API_URL) ? 'websocket' : 'sse';

export interface VividStream {
  chunks: AsyncIterable<string>;
  abort(): void;
}

/** characters per second for the local typewriter */
const CPS = 95;
const DONE = '[DONE]';

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

/** Local engine: reveals `text` by elapsed time, one slice per animation frame. */
async function* typewriter(text: string, signal: AbortSignal): AsyncGenerator<string> {
  let shown = 0;
  let start = -1;
  while (shown < text.length && !signal.aborted) {
    const now = await nextFrame();
    if (start < 0) start = now;
    const n = Math.min(text.length, Math.floor(((now - start) * CPS) / 1000));
    if (n > shown) {
      yield text.slice(shown, n);
      shown = n;
    }
  }
}

/** Accepts raw text, JSON strings, or objects with delta/text/content; null = nothing to show. */
function decodePayload(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s === DONE) return DONE;
  if (s[0] !== '{' && s[0] !== '"') return raw;
  try {
    const j: unknown = JSON.parse(s);
    if (typeof j === 'string') return j;
    if (j && typeof j === 'object') {
      const o = j as Record<string, unknown>;
      if (o.done === true) return DONE;
      for (const k of ['delta', 'text', 'content']) if (typeof o[k] === 'string') return o[k] as string;
    }
    return null;
  } catch {
    return raw;
  }
}

function parseSseEvent(event: string): string | null {
  const data = event
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).replace(/^ /, ''));
  return data.length ? decodePayload(data.join('\n')) : null;
}

function sseStream(prompt: string, fallback: () => string): VividStream {
  const ac = new AbortController();
  async function* chunks(): AsyncGenerator<string> {
    let received = false;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({ prompt }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`vivid api ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const payload = parseSseEvent(buffer.slice(0, idx));
          buffer = buffer.slice(idx + 2);
          if (payload === null) continue;
          if (payload === DONE) return;
          received = true;
          yield payload;
        }
      }
    } catch {
      if (ac.signal.aborted) return;
      if (received) {
        yield '\n> vivid uplink interrupted.';
        return;
      }
      yield* typewriter(fallback(), ac.signal);
    }
  }
  return { chunks: chunks(), abort: () => ac.abort() };
}

function wsStream(prompt: string, fallback: () => string): VividStream {
  const ac = new AbortController();
  async function* chunks(): AsyncGenerator<string> {
    const queue: string[] = [];
    let closed = false;
    let failed = false;
    let wake: (() => void) | null = null;
    const notify = () => {
      wake?.();
      wake = null;
    };
    let ws: WebSocket;
    try {
      ws = new WebSocket(API_URL);
    } catch {
      yield* typewriter(fallback(), ac.signal);
      return;
    }
    ws.onopen = () => ws.send(JSON.stringify({ prompt }));
    ws.onmessage = (e) => {
      const payload = decodePayload(String(e.data));
      if (payload === DONE) ws.close();
      else if (payload !== null) queue.push(payload);
      notify();
    };
    ws.onerror = () => {
      failed = true;
      notify();
    };
    ws.onclose = () => {
      closed = true;
      notify();
    };
    ac.signal.addEventListener('abort', () => ws.close());

    let received = false;
    while (!ac.signal.aborted) {
      if (queue.length) {
        received = true;
        yield queue.shift() as string;
        continue;
      }
      if (closed || failed) break;
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
    if (failed && !received && !ac.signal.aborted) yield* typewriter(fallback(), ac.signal);
  }
  return { chunks: chunks(), abort: () => ac.abort() };
}

function localStream(text: string): VividStream {
  const ac = new AbortController();
  return { chunks: typewriter(text, ac.signal), abort: () => ac.abort() };
}

/** Ask VIVID. `fallback` builds the local reply, used when offline or on failure. */
export function queryVivid(prompt: string, fallback: () => string): VividStream {
  if (vividTransport === 'local') return localStream(fallback());
  if (vividTransport === 'websocket') return wsStream(prompt, fallback);
  return sseStream(prompt, fallback);
}
