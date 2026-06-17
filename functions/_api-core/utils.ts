// ─── CORS ──────────────────────────────────────────────────────────────────────
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
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
  const encodedPayload = encodeBase64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }))
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
