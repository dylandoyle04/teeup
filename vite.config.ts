import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production (GitHub Pages project site) assets live under /teeup/.
// In dev we serve from root so localhost stays clean.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/teeup/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5191,
    strictPort: true,
    // allow the public Cloudflare tunnel host to reach the dev server
    allowedHosts: true,
  },
}))
