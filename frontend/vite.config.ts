import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The Frappe site this dev server proxies to.
const FRAPPE_PORT = 8001
const SITE_NAME = 'kaitet'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../upande_packhouse/public/frontend'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2018',
  },
  server: {
    port: 8080,
    proxy: {
      '^/(app|api|assets|files|private|method)': {
        target: `http://127.0.0.1:${FRAPPE_PORT}`,
        changeOrigin: false,
        headers: { Host: SITE_NAME },
      },
    },
  },
})
