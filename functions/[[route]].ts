import worker from './_api-core/index'

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url)

  // ── STATIC ASSETS → CDN ─────────────────────────────────────────
  const staticExts = ['.html','.js','.css','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.woff2','.ttf','.map','.webp','.avif']
  if (
    staticExts.some(ext => url.pathname.endsWith(ext)) ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/src/')
  ) {
    return context.next()
  }

  // ── API & AUTH ROUTES → WORKER ───────────────────────────────────
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/status'
  ) {
    return worker.fetch(context.request, context.env as any, context as any)
  }

  // ── EVERYTHING ELSE → CDN (SPA fallback via _redirects) ─────────
  return context.next()
}
