import { verifyToken, corsHeaders } from '../utils'
import type { Env } from '../index'

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────
const PUBLIC_READ_TABLES: string[] = ['events', 'gallery', 'team', 'blog_posts', 'settings', 'banners', 'map_pins']
const TABLES_WITHOUT_ID: string[] = ['settings']

const OWNER_COLUMNS: Record<string, string> = {
  'blog_posts': 'author_id',
}

export async function handleDynamicRoute(url: URL, request: Request, dbClient: any, env: Env): Promise<Response | null> {
  const pathParts = url.pathname.split('/')
  if (pathParts.length !== 4 || pathParts[1] !== 'api' || pathParts[2] !== 'dynamic') return null

  const table = pathParts[3]

  // Validate table name (prevent SQL injection)
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    return new Response(JSON.stringify({ error: "Invalid table name" }), { status: 400, headers: corsHeaders })
  }

  // Auth check
  const payload = await verifyToken(request, env.JWT_SECRET || 'fallback')
  const isPublicRead = request.method === 'GET' && PUBLIC_READ_TABLES.includes(table)
  
  // Custom: if creating contact_messages or registrations, allow without auth
  const isPublicPost = request.method === 'POST' && ['contact_messages', 'registrations'].includes(table)

  if (!payload && !isPublicRead && !isPublicPost) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  }

  const ownerCol = OWNER_COLUMNS[table] || 'user_id'

  try {
    // ── GET ─────────────────────────────────────────────────────────
    if (request.method === "GET") {
      let sql = `SELECT * FROM ${table}`
      const args: any[] = []
      const whereClauses: string[] = []

      // Dynamic filters from query params
      url.searchParams.forEach((val, key) => {
        if (key.startsWith('eq_')) {
          const col = key.replace('eq_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NULL`) }
          else { whereClauses.push(`${col} = ?`); args.push(val) }
        } else if (key.startsWith('neq_')) {
          const col = key.replace('neq_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NOT NULL`) }
          else { whereClauses.push(`${col} != ?`); args.push(val) }
        } else if (key.startsWith('ilike_')) {
          const col = key.replace('ilike_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          whereClauses.push(`${col} LIKE ?`); args.push(`%${val}%`)
        }
      })

      if (whereClauses.length > 0) sql += ` WHERE ` + whereClauses.join(' AND ')

      const orderCol = url.searchParams.get("order")
      if (orderCol && /^[a-zA-Z0-9_]+$/.test(orderCol)) {
        sql += ` ORDER BY ${orderCol} ${url.searchParams.get("dir") === 'asc' ? 'ASC' : 'DESC'}`
      }

      const limit = url.searchParams.get("limit")
      if (limit && !isNaN(Number(limit))) { sql += ` LIMIT ?`; args.push(Number(limit)) }

      const res = dbClient ? await dbClient.execute({ sql, args }) : { rows: [] }
      return new Response(JSON.stringify({ success: true, data: res.rows }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── POST (INSERT) ──────────────────────────────────────────────
    if (request.method === "POST") {
      const body: any = await request.json()

      // Auto-inject owner if applicable
      if (payload && OWNER_COLUMNS[table] && !body[ownerCol]) {
        body[ownerCol] = payload.userId
      }

      // Ensure 'admin-system' user exists in users table to prevent FOREIGN KEY constraint failure on blog posts
      if (table === 'blog_posts' && body.author_id === 'admin-system') {
        if (dbClient) {
          const checkAdmin = await dbClient.execute({
            sql: "SELECT id FROM users WHERE id = ?",
            args: ['admin-system']
          })
          if (checkAdmin.rows.length === 0) {
            await dbClient.execute({
              sql: "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              args: ['admin-system', 'admin@ovijatrik', 'system:system', 'System Admin', 'admin', new Date().getTime()]
            })
          }
        }
      }

      // Auto-generate ID
      if (!body.id && !TABLES_WITHOUT_ID.includes(table)) body.id = crypto.randomUUID()

      // Ensure created_at for all tables that might need it
      if (!body.created_at && ['users', 'events', 'registrations', 'contact_messages', 'banners', 'map_pins'].includes(table)) {
        body.created_at = new Date().getTime()
      }
      if (!body.uploaded_at && table === 'gallery') body.uploaded_at = new Date().getTime()
      if (!body.published_at && table === 'blog_posts') body.published_at = new Date().getTime()

      const keys = Object.keys(body)
      for (const key of keys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return new Response(JSON.stringify({ error: "Invalid column name" }), { status: 400, headers: corsHeaders })
        }
      }

      if (dbClient) {
        await dbClient.execute({
          sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          args: keys.map(k => body[k])
        })
      }
      return new Response(JSON.stringify({ success: true, data: body }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── PUT (UPDATE) ───────────────────────────────────────────────
    if (request.method === "PUT") {
      const body: any = await request.json()
      if (!body.id) {
        return new Response(JSON.stringify({ error: "Missing id for update" }), { status: 400, headers: corsHeaders })
      }

      const updateKeys = Object.keys(body).filter(k => k !== 'id')
      if (updateKeys.length === 0) {
        return new Response(JSON.stringify({ success: true, data: body }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      for (const key of updateKeys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return new Response(JSON.stringify({ error: "Invalid column name" }), { status: 400, headers: corsHeaders })
        }
      }

      const args = [...updateKeys.map(k => body[k]), body.id]

      if (dbClient) {
        await dbClient.execute({
          sql: `UPDATE ${table} SET ${updateKeys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
          args
        })
      }
      return new Response(JSON.stringify({ success: true, data: body }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── DELETE ──────────────────────────────────────────────────────
    if (request.method === "DELETE") {
      const args: any[] = []
      const whereClauses: string[] = []

      url.searchParams.forEach((val, key) => {
        if (key.startsWith('eq_')) {
          const col = key.replace('eq_', '')
          if (/^[a-zA-Z0-9_]+$/.test(col)) { whereClauses.push(`${col} = ?`); args.push(val) }
        }
      })

      if (whereClauses.length === 0) {
        return new Response(JSON.stringify({ error: "Missing delete conditions" }), { status: 400, headers: corsHeaders })
      }

      if (dbClient) {
        await dbClient.execute({ sql: `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`, args })
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

  } catch (err: any) {
    console.error(`Dynamic API error [${table}]:`, err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  return null
}
