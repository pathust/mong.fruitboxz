import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:9000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    copyPublicDir: false,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/auth': {
        target: backendTarget,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/media': { target: backendTarget, changeOrigin: true },
      '/admin': {
        target: backendTarget,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/store': { target: backendTarget, changeOrigin: true },
    },
  },
})
