import {
  verifyToken,
  getCorsHeaders,
  jsonResponse,
  safeErrorResponse,
  sanitizeString,
  isValidEmail,
  isValidPhoneNumber,
  checkRateLimit,
  getClientIP,
} from '../utils'
import type { Env } from '../index'

// ─── TABLE & COLUMN WHITELIST ──────────────────────────────────────────────────
const VALID_TABLES = [
  'events', 'gallery', 'team', 'blog_posts', 'settings',
  'banners', 'map_pins', 'contact_messages', 'registrations', 'users'
] as const

type ValidTable = typeof VALID_TABLES[number]

/** Columns allowed for each table (prevents schema probing) */
const TABLE_COLUMNS: Record<ValidTable, string[]> = {
  events: ['id', 'title', 'description', 'title_bn', 'description_bn', 'date', 'location', 'fee', 'total_spots', 'image_url', 'hover_image_url', 'additional_images', 'tags', 'sponsors', 'is_registration_open', 'created_at'],
  gallery: ['id', 'image_url', 'category', 'caption', 'user_id', 'status', 'uploaded_at'],
  team: ['id', 'name', 'role', 'image_url', 'facebook_url', 'linkedin_url', 'order_index'],
  blog_posts: ['id', 'title', 'content', 'author_id', 'image_url', 'hover_image_url', 'additional_images', 'published_at'],
  settings: ['key', 'value'],
  banners: ['id', 'image_url', 'is_active', 'order_index', 'topic', 'start_date', 'end_date', 'created_at', 'link_type', 'link_value'],
  map_pins: ['id', 'name', 'lat', 'lng', 'type', 'title', 'details', 'image_url', 'date_text', 'linked_event_id', 'linked_gallery_ids', 'linked_place_slug', 'created_at'],
  contact_messages: ['id', 'name', 'email', 'message', 'status', 'created_at'],
  registrations: ['id', 'event_id', 'user_id', 'name', 'email', 'phone', 'student_id', 'status', 'created_at'],
  users: ['id', 'name', 'email', 'phone', 'student_id', 'role', 'created_at'],
}

// ─── ROLE-BASED ACCESS CONTROL ─────────────────────────────────────────────────
type Permission = '*' | 'admin'

const TABLE_PERMISSIONS: Record<ValidTable, { read: Permission; write: Permission; delete: Permission }> = {
  events:           { read: '*',     write: 'admin', delete: 'admin' },
  gallery:          { read: '*',     write: '*',     delete: 'admin' },
  team:             { read: '*',     write: 'admin', delete: 'admin' },
  blog_posts:       { read: '*',     write: 'admin', delete: 'admin' },
  settings:         { read: '*',     write: 'admin', delete: 'admin' },
  banners:          { read: '*',     write: 'admin', delete: 'admin' },
  map_pins:         { read: '*',     write: 'admin', delete: 'admin' },
  contact_messages: { read: 'admin', write: '*',     delete: 'admin' },
  registrations:    { read: 'admin', write: '*',     delete: 'admin' },
  users:            { read: 'admin', write: 'admin', delete: 'admin' },
}

const TABLES_WITHOUT_ID: string[] = ['settings']

const OWNER_COLUMNS: Record<string, string> = {
  'blog_posts': 'author_id',
  'gallery': 'user_id',
  'registrations': 'user_id',
}

// ─── DEFAULT & MAX LIMITS ──────────────────────────────────────────────────────
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function isValidTable(name: string): name is ValidTable {
  return (VALID_TABLES as readonly string[]).includes(name)
}

function isValidColumn(table: ValidTable, column: string): boolean {
  return TABLE_COLUMNS[table].includes(column)
}

function hasPermission(
  permission: Permission,
  userRole: string | undefined,
  action: 'read' | 'write' | 'delete'
): boolean {
  if (permission === '*') return true
  if (!userRole) return false
  return userRole === permission
}

/** Validate public POST data for contact_messages and registrations */
function validatePublicPost(table: ValidTable, body: any): string | null {
  if (table === 'contact_messages') {
    if (!body.name || sanitizeString(body.name, 100).length < 2) return 'Name is required (min 2 characters)'
    if (!body.email || !isValidEmail(body.email)) return 'A valid email is required'
    if (!body.message || sanitizeString(body.message, 5000).length < 10) return 'Message is required (min 10 characters)'
    if (body.message && body.message.length > 5000) return 'Message is too long (max 5000 characters)'
  }

  if (table === 'registrations') {
    if (!body.name || sanitizeString(body.name, 100).length < 2) return 'Name is required (min 2 characters)'
    if (!body.email || !isValidEmail(body.email)) return 'A valid email is required'
    if (!body.phone || !isValidPhoneNumber(body.phone)) return 'A valid phone number is required'
    if (!body.event_id) return 'Event ID is required'
  }

  return null // valid
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function handleDynamicRoute(url: URL, request: Request, dbClient: any, env: Env): Promise<Response | null> {
  const cors = getCorsHeaders(request)
  const pathParts = url.pathname.split('/')
  if (pathParts.length !== 4 || pathParts[1] !== 'api' || pathParts[2] !== 'dynamic') return null

  const tableName = pathParts[3]

  // ── TABLE WHITELIST ─────────────────────────────────────────────
  if (!isValidTable(tableName)) {
    return jsonResponse({ error: "Invalid resource" }, cors, 400)
  }

  const table: ValidTable = tableName

  // ── AUTH & RBAC ─────────────────────────────────────────────────
  const payload = await verifyToken(request, env.JWT_SECRET || '')
  const userRole = payload?.role as string | undefined
  const permissions = TABLE_PERMISSIONS[table]

  // Determine required permission based on method
  let requiredAction: 'read' | 'write' | 'delete'
  switch (request.method) {
    case 'GET': requiredAction = 'read'; break
    case 'POST': case 'PUT': requiredAction = 'write'; break
    case 'DELETE': requiredAction = 'delete'; break
    default: return jsonResponse({ error: "Method not allowed" }, cors, 405)
  }

  if (!hasPermission(permissions[requiredAction], userRole, requiredAction)) {
    return jsonResponse({ error: "Unauthorized" }, cors, 401)
  }

  // ── PUBLIC POST RATE LIMITING ───────────────────────────────────
  if (request.method === 'POST' && permissions.write === '*') {
    const clientIP = getClientIP(request)
    const rl = checkRateLimit(`public-post:${table}:${clientIP}`, 5, 60_000)
    if (!rl.allowed) {
      return jsonResponse({ error: "Too many submissions. Please try again later." }, cors, 429)
    }
  }

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
          if (!isValidColumn(table, col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NULL`) }
          else { whereClauses.push(`${col} = ?`); args.push(val) }
        } else if (key.startsWith('neq_')) {
          const col = key.replace('neq_', '')
          if (!isValidColumn(table, col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NOT NULL`) }
          else { whereClauses.push(`${col} != ?`); args.push(val) }
        } else if (key.startsWith('ilike_')) {
          const col = key.replace('ilike_', '')
          if (!isValidColumn(table, col)) return
          whereClauses.push(`${col} LIKE ?`); args.push(`%${val}%`)
        }
      })

      if (whereClauses.length > 0) sql += ` WHERE ` + whereClauses.join(' AND ')

      // ── ORDER BY (column whitelist) ──────────────────────────────
      const orderCol = url.searchParams.get("order")
      if (orderCol && isValidColumn(table, orderCol)) {
        sql += ` ORDER BY ${orderCol} ${url.searchParams.get("dir") === 'asc' ? 'ASC' : 'DESC'}`
      }

      // ── PAGINATION (enforced) ────────────────────────────────────
      const limitParam = url.searchParams.get("limit")
      let limit = DEFAULT_LIMIT
      if (limitParam && !isNaN(Number(limitParam))) {
        limit = Math.min(Math.max(1, Number(limitParam)), MAX_LIMIT)
      }
      sql += ` LIMIT ?`
      args.push(limit)

      const res = dbClient ? await dbClient.execute({ sql, args }) : { rows: [] }

      // Cache public reads for 60 seconds (do not cache for admins)
      const cacheSeconds = (permissions.read === '*' && userRole !== 'admin') ? 60 : 0
      return jsonResponse({ success: true, data: res.rows }, cors, 200, cacheSeconds)
    }

    // ── POST (INSERT) ──────────────────────────────────────────────
    if (request.method === "POST") {
      const body: any = await request.json()

      // Validate public POST data
      if (permissions.write === '*') {
        const validationError = validatePublicPost(table, body)
        if (validationError) {
          return jsonResponse({ error: validationError }, cors, 400)
        }
      }

      // Auto-inject owner if applicable
      const ownerCol = OWNER_COLUMNS[table] || 'user_id'
      if (payload && OWNER_COLUMNS[table] && !body[ownerCol]) {
        body[ownerCol] = payload.userId
      }

      // Ensure 'admin-system' user exists for blog posts FK constraint
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

      // Ensure timestamps
      if (!body.created_at && ['events', 'registrations', 'contact_messages', 'banners', 'map_pins'].includes(table)) {
        body.created_at = new Date().getTime()
      }
      if (!body.uploaded_at && table === 'gallery') body.uploaded_at = new Date().getTime()
      if (!body.published_at && table === 'blog_posts') body.published_at = new Date().getTime()

      // ── COLUMN WHITELIST ─────────────────────────────────────────
      const keys = Object.keys(body)
      for (const key of keys) {
        if (!isValidColumn(table, key)) {
          return jsonResponse({ error: `Invalid field: ${key}` }, cors, 400)
        }
      }

      // Sanitize string values
      for (const key of keys) {
        if (typeof body[key] === 'string') {
          body[key] = sanitizeString(body[key], 10000)
        }
      }

      if (dbClient) {
        await dbClient.execute({
          sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          args: keys.map(k => body[k])
        })
      }
      return jsonResponse({ success: true, data: body }, cors)
    }

    // ── PUT (UPDATE) ───────────────────────────────────────────────
    if (request.method === "PUT") {
      const body: any = await request.json()

      // Settings table uses 'key' instead of 'id'
      const identifierCol = TABLES_WITHOUT_ID.includes(table) ? 'key' : 'id'
      if (!body[identifierCol]) {
        return jsonResponse({ error: `Missing ${identifierCol} for update` }, cors, 400)
      }

      const updateKeys = Object.keys(body).filter(k => k !== identifierCol)
      if (updateKeys.length === 0) {
        return jsonResponse({ success: true, data: body }, cors)
      }

      // Column whitelist
      for (const key of [...updateKeys, identifierCol]) {
        if (!isValidColumn(table, key)) {
          return jsonResponse({ error: `Invalid field: ${key}` }, cors, 400)
        }
      }

      // Sanitize string values
      for (const key of updateKeys) {
        if (typeof body[key] === 'string') {
          body[key] = sanitizeString(body[key], 10000)
        }
      }

      const args = [...updateKeys.map(k => body[k]), body[identifierCol]]

      if (dbClient) {
        await dbClient.execute({
          sql: `UPDATE ${table} SET ${updateKeys.map(k => `${k} = ?`).join(', ')} WHERE ${identifierCol} = ?`,
          args
        })
      }
      return jsonResponse({ success: true, data: body }, cors)
    }

    // ── DELETE ──────────────────────────────────────────────────────
    if (request.method === "DELETE") {
      const args: any[] = []
      const whereClauses: string[] = []

      url.searchParams.forEach((val, key) => {
        if (key.startsWith('eq_')) {
          const col = key.replace('eq_', '')
          if (isValidColumn(table, col)) {
            whereClauses.push(`${col} = ?`)
            args.push(val)
          }
        }
      })

      if (whereClauses.length === 0) {
        return jsonResponse({ error: "Missing delete conditions" }, cors, 400)
      }

      if (dbClient) {
        await dbClient.execute({
          sql: `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`,
          args
        })
      }
      return jsonResponse({ success: true }, cors)
    }

  } catch (err: any) {
    console.error(`Dynamic API error [${table}]:`, err)
    return safeErrorResponse(err, cors)
  }

  return null
}
