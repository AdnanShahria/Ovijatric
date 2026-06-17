import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'shell-rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rewrites: Record<string, string> = {
            '/admin': '/admin.html',
            '/auth': '/auth.html',
          }
          if (req.url) {
            for (const [prefix, html] of Object.entries(rewrites)) {
              if (req.url.startsWith(prefix) && !req.url.includes('.')) {
                req.url = html
                break
              }
            }
          }
          next()
        })
      }
    }
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        auth: './auth.html',
        admin: './admin.html',
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api':   { target: 'http://127.0.0.1:8788', changeOrigin: true },
      '/auth/': { target: 'http://127.0.0.1:8788', changeOrigin: true },
    }
  }
})
