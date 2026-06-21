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
            '/member': '/member.html',
          }
          if (req.url) {
            const url = new URL(req.url, 'http://localhost')
            const pathname = url.pathname
            const isProxyPath = pathname.startsWith('/api') || pathname.startsWith('/auth/')
            const isGet = req.method === 'GET' || req.method === 'HEAD'

            if (isGet && !isProxyPath) {
              for (const [prefix, html] of Object.entries(rewrites)) {
                if (pathname.startsWith(prefix) && !pathname.includes('.')) {
                  req.url = html
                  break
                }
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
        member: './member.html',
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
