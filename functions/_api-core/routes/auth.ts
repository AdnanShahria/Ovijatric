import {
  hashPassword,
  generateSalt,
  signToken,
  generateUUID,
  getCorsHeaders,
  withSecurityHeaders,
  jsonResponse,
  safeErrorResponse,
  checkRateLimit,
  getClientIP,
  isValidEmail,
  validatePasswordStrength,
  sanitizeString,
  timingSafeEqual,
} from '../utils'
import type { Env } from '../index'
import { eq } from 'drizzle-orm'
import { users } from '../../../database/schema'

export async function handleAuthRoutes(url: URL, request: Request, db: any, env: Env): Promise<Response | null> {
  const cors = getCorsHeaders(request)
  const JWT_SECRET = env.JWT_SECRET!
  const clientIP = getClientIP(request)

  // ── REGISTER ─────────────────────────────────────────────────────
  if (url.pathname === "/auth/register" && request.method === "POST") {
    // Rate limit: 5 registrations per minute per IP
    const rl = checkRateLimit(`register:${clientIP}`, 5, 60_000)
    if (!rl.allowed) {
      return jsonResponse(
        { error: "Too many registration attempts. Please try again later." },
        cors, 429
      )
    }

    try {
      const body: any = await request.json()
      const email = sanitizeString(body.email || '', 254).toLowerCase()
      const password = body.password || ''
      const name = sanitizeString(body.name || '', 100)

      // Validate required fields
      if (!email || !password || !name) {
        return jsonResponse(
          { error: "Missing required fields (email, password, name)" },
          cors, 400
        )
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return jsonResponse(
          { error: "Invalid email address format" },
          cors, 400
        )
      }

      // Validate password strength
      const pwCheck = validatePasswordStrength(password)
      if (!pwCheck.valid) {
        return jsonResponse({ error: pwCheck.reason }, cors, 400)
      }

      // Validate name length
      if (name.length < 2 || name.length > 100) {
        return jsonResponse(
          { error: "Name must be between 2 and 100 characters" },
          cors, 400
        )
      }

      if (!db) {
        return jsonResponse({ error: "Database unavailable" }, cors, 503)
      }

      // Check existing user
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existing.length > 0) {
        // Don't reveal whether the email exists — use generic message
        return jsonResponse(
          { error: "Registration failed. Please try a different email or sign in." },
          cors, 400
        )
      }

      // Hash password
      const salt = generateSalt()
      const iterations = 600000
      const hash = await hashPassword(password, salt, iterations)
      const userId = generateUUID()

      // Insert user
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: `${iterations}:${salt}:${hash}`,
        name,
        role: 'member',
        createdAt: new Date()
      })

      return jsonResponse({
        success: true,
        user: { id: userId, email, name, role: 'member' }
      }, cors)
    } catch (err: any) {
      return safeErrorResponse(err, cors)
    }
  }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (url.pathname === "/auth/login" && request.method === "POST") {
    // Rate limit: 5 login attempts per minute per IP
    const rl = checkRateLimit(`login:${clientIP}`, 5, 60_000)
    if (!rl.allowed) {
      const retryAfter = rl.retryAfterMs ? Math.ceil(rl.retryAfterMs / 1000) : 60
      const headers = withSecurityHeaders({
        ...cors,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      })
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        { status: 429, headers }
      )
    }

    try {
      const body: any = await request.json()
      const email = sanitizeString(body.email || '', 254).toLowerCase()
      const password = body.password || ''

      if (!email || !password) {
        return jsonResponse({ error: "Email and password required" }, cors, 400)
      }

      if (!db) {
        return jsonResponse({ error: "Database unavailable" }, cors, 503)
      }

      const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (result.length === 0) {
        // Use generic error to prevent user enumeration
        return jsonResponse({ error: "Invalid email or password" }, cors, 401)
      }

      const user = result[0]
      const parts = user.passwordHash.split(':')
      let storedIterations = 100000
      let storedSalt, storedHash
      if (parts.length === 3) {
        storedIterations = parseInt(parts[0], 10)
        storedSalt = parts[1]
        storedHash = parts[2]
      } else {
        storedSalt = parts[0]
        storedHash = parts[1]
      }
      const computedHash = await hashPassword(password, storedSalt, storedIterations)

      if (computedHash !== storedHash) {
        return jsonResponse({ error: "Invalid email or password" }, cors, 401)
      }

      const token = await signToken(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET
      )

      return jsonResponse({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }, cors)
    } catch (err: any) {
      return safeErrorResponse(err, cors)
    }
  }

  // ── ADMIN ACCESS CODE LOGIN ───────────────────────────────────────
  if (url.pathname === "/auth/verify-code" && request.method === "POST") {
    // Rate limit: 3 attempts per minute per IP (strict — admin endpoint)
    const rl = checkRateLimit(`verify-code:${clientIP}`, 3, 60_000)
    if (!rl.allowed) {
      const retryAfter = rl.retryAfterMs ? Math.ceil(rl.retryAfterMs / 1000) : 60
      const headers = withSecurityHeaders({
        ...cors,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      })
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again later." }),
        { status: 429, headers }
      )
    }

    try {
      const body: any = await request.json()
      const code = (body.code || '').trim()

      if (!code) {
        return jsonResponse({ error: "Access code required" }, cors, 400)
      }

      const validCode = env.ADMIN_ACCESS_CODE
      if (!validCode || validCode === 'fallback_admin_code_change_me') {
        console.error('[SECURITY] ADMIN_ACCESS_CODE is missing or insecure.')
        return jsonResponse(
          { error: "Admin access is currently unavailable. Contact the administrator." },
          cors, 503
        )
      }

      // Timing-safe comparison to prevent timing attacks
      const isValid = await timingSafeEqual(code, validCode)
      if (!isValid) {
        return jsonResponse({ error: "Invalid access code" }, cors, 401)
      }

      // Generate a token for the admin
      const token = await signToken(
        { userId: 'admin-system', email: 'admin@ovijatrik', role: 'admin' },
        JWT_SECRET
      )

      return jsonResponse({
        success: true,
        token,
        user: { id: 'admin-system', email: 'admin', name: 'System Admin', role: 'admin' }
      }, cors)
    } catch (err: any) {
      return safeErrorResponse(err, cors)
    }
  }

  return null
}
