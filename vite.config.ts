import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from the root of the custom domain (flagstickfinder.com), so the
// base is '/' in both dev and production.
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5191,
    strictPort: true,
    // allow the public Cloudflare tunnel host to reach the dev server
    allowedHosts: true,
  },
}))
