// ─── CORS (Origin Whitelist) ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://ovijatrik.pages.dev',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8788',
  'http://localhost:5173',
  'http://localhost:8788',
]

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

/** @deprecated Use getCorsHeaders(request) instead */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// ─── SECURITY HEADERS ──────────────────────────────────────────────────────────
export function withSecurityHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '0',
    'Content-Type': headers['Content-Type'] || 'application/json',
  }
}

// ─── SAFE ERROR RESPONSE ───────────────────────────────────────────────────────
export function safeErrorResponse(
  err: unknown,
  corsHdrs: Record<string, string>,
  status = 500,
  publicMessage = 'An internal error occurred. Please try again later.'
): Response {
  const message = err instanceof Error ? err.message : String(err)
  console.error('[API Error]', message)
  return new Response(
    JSON.stringify({ error: publicMessage }),
    { status, headers: withSecurityHeaders({ ...corsHdrs, 'Content-Type': 'application/json' }) }
  )
}

// ─── JSON RESPONSE HELPER ──────────────────────────────────────────────────────
export function jsonResponse(data: any, corsHdrs: Record<string, string>, status = 200, cacheSeconds = 0): Response {
  const headers: Record<string, string> = {
    ...corsHdrs,
    'Content-Type': 'application/json',
  }
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds * 5}`
  } else {
    headers['Cache-Control'] = 'no-store'
  }
  return new Response(JSON.stringify(data), { status, headers: withSecurityHeaders(headers) })
}

// ─── INPUT VALIDATION ──────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < 6) return { valid: false, reason: 'Password must be at least 6 characters long' }
  if (password.length > 128) return { valid: false, reason: 'Password must be at most 128 characters long' }
  return { valid: true }
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength)
}

export function isValidPhoneNumber(phone: string): boolean {
  // Allow international formats: +880..., 01..., etc.
  return /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())
}

// ─── RATE LIMITER (In-Memory Sliding Window) ───────────────────────────────────
const rateLimitMap = new Map<string, { timestamps: number[] }>()

// Clean up stale entries periodically (every 1000 checks)
let cleanupCounter = 0
function maybeCleanup(windowMs: number) {
  cleanupCounter++
  if (cleanupCounter % 1000 === 0) {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)
      if (entry.timestamps.length === 0) rateLimitMap.delete(key)
    }
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  maybeCleanup(windowMs)
  const now = Date.now()
  const entry = rateLimitMap.get(key) || { timestamps: [] }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = windowMs - (now - oldestInWindow)
    return { allowed: false, retryAfterMs }
  }

  entry.timestamps.push(now)
  rateLimitMap.set(key, entry)
  return { allowed: true }
}

export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || request.headers.get('X-Real-IP')
    || '0.0.0.0'
}

// ─── TIMING-SAFE STRING COMPARISON ─────────────────────────────────────────────
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const keyA = enc.encode(a)
  const keyB = enc.encode(b)

  // Import both as HMAC keys and sign a constant message, then compare
  if (keyA.length !== keyB.length) {
    // Still do the work to avoid timing leaks on length
    const padded = new Uint8Array(Math.max(keyA.length, keyB.length))
    padded.set(keyA)
    // Fall through but will return false
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode('timing-safe-check'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sigA = new Uint8Array(await crypto.subtle.sign('HMAC', key, keyA))
    const sigB = new Uint8Array(await crypto.subtle.sign('HMAC', key, keyB))

    if (sigA.length !== sigB.length) return false
    let result = 0
    for (let i = 0; i < sigA.length; i++) {
      result |= sigA[i] ^ sigB[i]
    }
    return result === 0
  } catch {
    return false
  }
}

// ─── UUID ──────────────────────────────────────────────────────────────────────
export function generateUUID(): string {
  return crypto.randomUUID()
}

// ─── BASE64URL ─────────────────────────────────────────────────────────────────
function encodeBase64Url(source: Uint8Array | string): string {
  let uint8: Uint8Array
  if (typeof source === 'string') {
    uint8 = new TextEncoder().encode(source)
  } else {
    uint8 = source
  }
  let binary = ''
  for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i])
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodeBase64Url(source: string): Uint8Array {
  const base64 = source.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ─── PASSWORD HASHING (PBKDF2 via Web Crypto) ─────────────────────────────────
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string, iterations = 600000): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  return Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── JWT (HMAC-SHA256 via Web Crypto) ──────────────────────────────────────────
export async function signToken(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = encodeBase64Url(JSON.stringify(header))
  const encodedPayload = encodeBase64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 100 }))
  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign))
  return `${dataToSign}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyToken(request: Request, secret: string): Promise<any | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  const token = authHeader.substring(7)
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const isValid = await crypto.subtle.verify('HMAC', key, decodeBase64Url(encodedSignature) as any, enc.encode(`${encodedHeader}.${encodedPayload}`))
  if (!isValid) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)))
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch { return null }
}
