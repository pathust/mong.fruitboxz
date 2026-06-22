import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    copyPublicDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:9000', changeOrigin: true },
      '/auth': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/media': { target: 'http://127.0.0.1:9000', changeOrigin: true },
      '/admin': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/store': { target: 'http://127.0.0.1:9000', changeOrigin: true },
    },
  },
})
