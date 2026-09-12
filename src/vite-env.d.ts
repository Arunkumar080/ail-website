/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** VIVID query endpoint (http(s) = SSE, ws(s) = WebSocket). Unset → local engine. */
  readonly VITE_VIVID_API_URL?: string;
  /** Absolute site origin for social meta (og:url, og:image). */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
