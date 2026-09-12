import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Two pages: the public marketing shell at `/` and the perimeter-node
      // canvas app (gateway → value-delta simulator → ledger → phantom) at
      // `/simulator/`. They share nothing at runtime, so the site never
      // downloads three.js.
      input: {
        site: fileURLToPath(new URL('index.html', import.meta.url)),
        simulator: fileURLToPath(new URL('simulator/index.html', import.meta.url)),
      },
    },
    // Single-screen WebGL app: three + postprocessing are needed on first paint,
    // so one chunk is the right shape. Raise the advisory limit accordingly.
    chunkSizeWarningLimit: 1400,
  },
});
