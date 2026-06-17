import { createClient } from "@libsql/client/web"
import { drizzle } from "drizzle-orm/libsql"
import { corsHeaders } from "./utils"
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
  [key: string]: any
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Health check
    if (url.pathname === "/status") {
      return new Response(JSON.stringify({ status: "ok", db: !!env.TURSO_DATABASE_URL }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Create DB client
    let db: any = null
    let dbClient: any = null
    if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
      try {
        dbClient = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
        db = drizzle(dbClient)
      } catch (e) {
        console.error("Failed to create DB client:", e)
      }
    }

    // ── HANDLER CHAIN ──────────────────────────────────────────────
    let response: Response | null

    response = await handleAuthRoutes(url, request, db, env)
    if (response) return response

    response = await handleChatbotRoutes(url, request, env)
    if (response) return response
    
    response = await handleUploadRoutes(url, request, env)
    if (response) return response

    // Generic CRUD — always LAST before 404
    // Passing dbClient for the raw SQL queries in dynamicHandler
    response = await handleDynamicRoute(url, request, dbClient, env)
    if (response) return response

    // Nothing matched
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
}
