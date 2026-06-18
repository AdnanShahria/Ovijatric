import { hashPassword, generateSalt, signToken, generateUUID, corsHeaders } from '../utils'
import type { Env } from '../index'
import { eq } from 'drizzle-orm'
import { users } from '../../../database/schema'

export async function handleAuthRoutes(url: URL, request: Request, db: any, env: Env): Promise<Response | null> {
  const JWT_SECRET = env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod'

  // ── REGISTER ─────────────────────────────────────────────────────
  if (url.pathname === "/auth/register" && request.method === "POST") {
    try {
      const body: any = await request.json()
      const email = body.email?.trim().toLowerCase()
      const { password, name } = body

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "Missing required fields (email, password, name)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      if (!db) {
        return new Response(JSON.stringify({ error: "Database unavailable" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      // Check existing
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: "User already exists" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      // Hash password
      const salt = generateSalt()
      const hash = await hashPassword(password, salt)
      const userId = generateUUID()

      // Insert user
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: `${salt}:${hash}`,
        name,
        role: 'member',
        createdAt: new Date()
      })

      return new Response(JSON.stringify({
        success: true,
        user: { id: userId, email, name, role: 'member' }
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (url.pathname === "/auth/login" && request.method === "POST") {
    try {
      const body: any = await request.json()
      const email = body.email?.trim().toLowerCase()
      const { password } = body

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      if (!db) {
        return new Response(JSON.stringify({ error: "Database unavailable" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (result.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const user = result[0]
      const [storedSalt, storedHash] = user.passwordHash.split(':')
      const computedHash = await hashPassword(password, storedSalt)

      if (computedHash !== storedHash) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const token = await signToken({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET)

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  // ── ADMIN ACCESS CODE LOGIN ───────────────────────────────────────
  if (url.pathname === "/auth/verify-code" && request.method === "POST") {
    try {
      const body: any = await request.json()
      const { code } = body

      if (!code) {
        return new Response(JSON.stringify({ error: "Access code required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const validCode = env.ADMIN_ACCESS_CODE || 'fallback_admin_code_change_me'

      if (code !== validCode) {
        return new Response(JSON.stringify({ error: "Invalid access code" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      // Generate a token for the admin without needing a database user
      const token = await signToken({ userId: 'admin-system', email: 'admin@ovijatrik', role: 'admin' }, JWT_SECRET)

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: 'admin-system', email: 'admin', name: 'System Admin', role: 'admin' }
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  return null
}
