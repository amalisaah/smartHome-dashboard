import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    /**
     * The API under a path on our own origin, so requests to it are same-origin
     * and there is no preflight to fail.
     *
     * This is a dev shim for a gap in the API's CORS: it answers
     * `access-control-allow-methods: GET,HEAD,POST`, so every `PATCH` and
     * `DELETE` the spec documents — updating a shipment, a line, an item's
     * group — is refused by the browser before it is sent. The fix is for the
     * API to allow the methods it documents; until then this is what lets the
     * shipment builder save anything but the first create.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
