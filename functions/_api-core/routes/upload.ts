import {
  getCorsHeaders,
  verifyToken,
  jsonResponse,
  safeErrorResponse,
  checkRateLimit,
  getClientIP,
} from '../utils'
import type { Env } from '../index'

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function handleUploadRoutes(url: URL, request: Request, env: Env): Promise<Response | null> {
  const cors = getCorsHeaders(request)

  if (url.pathname === "/api/upload" && request.method === "POST") {
    // Rate limit: 10 uploads per minute per IP
    const clientIP = getClientIP(request)
    const rl = checkRateLimit(`upload:${clientIP}`, 10, 60_000)
    if (!rl.allowed) {
      return jsonResponse(
        { error: "Too many uploads. Please try again later." },
        cors, 429
      )
    }

    try {
      // Must be logged in to upload
      const payload = await verifyToken(request, env.JWT_SECRET || '')
      if (!payload) {
        return jsonResponse({ error: "Unauthorized" }, cors, 401)
      }

      if (!env.IMGBB_API_KEY) {
        return jsonResponse(
          { error: "Image upload service is currently unavailable" },
          cors, 503
        )
      }

      const formData = await request.formData()
      const image = formData.get("image")

      if (!image) {
        return jsonResponse({ error: "No image provided" }, cors, 400)
      }

      // ── FILE TYPE VALIDATION ────────────────────────────────────
      if (image instanceof File) {
        if (!ALLOWED_MIME_TYPES.includes(image.type)) {
          return jsonResponse(
            { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
            cors, 400
          )
        }

        // ── FILE SIZE VALIDATION ──────────────────────────────────
        if (image.size > MAX_FILE_SIZE_BYTES) {
          return jsonResponse(
            { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` },
            cors, 400
          )
        }

        if (image.size === 0) {
          return jsonResponse({ error: "Empty file provided" }, cors, 400)
        }
      }

      // Forward to ImgBB
      const imgbbForm = new FormData()
      imgbbForm.append("key", env.IMGBB_API_KEY)
      imgbbForm.append("image", image)

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: imgbbForm
      })

      if (!response.ok) {
        console.error("ImgBB upload failed:", await response.text())
        return jsonResponse(
          { error: "Image upload failed. Please try again." },
          cors, 502
        )
      }

      const data: any = await response.json()

      // Return only necessary fields (don't expose delete_url)
      return jsonResponse({
        success: true,
        url: data.data.url,
        display_url: data.data.display_url,
      }, cors)
    } catch (err: any) {
      console.error("Upload error:", err)
      return safeErrorResponse(err, cors)
    }
  }

  return null
}
