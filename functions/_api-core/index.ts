import { createClient } from "@libsql/client/web"
import { drizzle } from "drizzle-orm/libsql"
import {
  getCorsHeaders,
  withSecurityHeaders,
  jsonResponse,
  safeErrorResponse,
  checkRateLimit,
  getClientIP,
} from "./utils"
import { handleAuthRoutes } from "./routes/auth"
import { handleChatbotRoutes } from "./routes/chatbot"
import { handleUploadRoutes } from "./routes/upload"
import { handleDynamicRoute } from "./api/dynamicHandler"

export interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  JWT_SECRET?: string
  GROQ_API_KEY?: string
  IMGBB_API_KEY?: string
  ADMIN_ACCESS_CODE?: string
  [key: string]: any
}

// ─── DANGEROUS FALLBACK VALUES ─────────────────────────────────────────────────
const DANGEROUS_SECRETS = [
  'fallback_secret_do_not_use_in_prod',
  'fallback',
  'secret',
  'changeme',
  'fallback_admin_code_change_me',
]

function isSecretSafe(secret: string | undefined): boolean {
  if (!secret) return false
  if (secret.length < 16) return false
  if (DANGEROUS_SECRETS.includes(secret.toLowerCase())) return false
  return true
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url)
    const cors = getCorsHeaders(request)

    // ── CORS PREFLIGHT ──────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: withSecurityHeaders(cors) })
    }

    // ── GLOBAL RATE LIMIT (100 req/min per IP) ──────────────────────
    const clientIP = getClientIP(request)
    const globalLimit = checkRateLimit(`global:${clientIP}`, 100, 60_000)
    if (!globalLimit.allowed) {
      return jsonResponse(
        { error: "Too many requests. Please slow down." },
        cors,
        429
      )
    }

    // ── HEALTH CHECK (sanitized — no DB URL leak) ───────────────────
    if (url.pathname === "/status") {
      return jsonResponse(
        { status: "ok", timestamp: new Date().toISOString() },
        cors,
        200,
        10 // Cache for 10 seconds
      )
    }

    // ── CREATE DB CLIENT ────────────────────────────────────────────
    let db: any = null
    let dbClient: any = null
    if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
      try {
        const dbUrl = env.TURSO_DATABASE_URL.replace('libsql://', 'https://')
        dbClient = createClient({ url: dbUrl, authToken: env.TURSO_AUTH_TOKEN })
        db = drizzle(dbClient)
      } catch (e) {
        console.error("Failed to create DB client:", e)
      }
    }

    // ── PATH-BASED ROUTING ──────────────────────────────────────────
    try {
      // Auth routes: /auth/login, /auth/register, /auth/verify-code
      if (url.pathname.startsWith('/auth/')) {
        // Enforce safe secrets for auth operations
        if (!isSecretSafe(env.JWT_SECRET)) {
          console.error('[SECURITY] JWT_SECRET is missing or insecure. Auth operations are disabled.')
          return jsonResponse(
            { error: "Authentication is currently unavailable. Contact the administrator." },
            cors,
            503
          )
        }
        const response = await handleAuthRoutes(url, request, db, env)
        if (response) return response
      }

      // Chatbot route: /api/chat
      if (url.pathname === '/api/chat') {
        const response = await handleChatbotRoutes(url, request, env)
        if (response) return response
      }

      // Upload route: /api/upload
      if (url.pathname === '/api/upload') {
        const response = await handleUploadRoutes(url, request, env)
        if (response) return response
      }

      // Dynamic CRUD: /api/dynamic/{table}
      if (url.pathname.startsWith('/api/dynamic/')) {
        const response = await handleDynamicRoute(url, request, dbClient, env)
        if (response) return response
      }
    } catch (err) {
      return safeErrorResponse(err, cors)
    }

    // ── NOTHING MATCHED ─────────────────────────────────────────────
    return jsonResponse({ error: "Not Found" }, cors, 404)
  }
}
