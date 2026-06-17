import { corsHeaders, verifyToken } from '../utils'
import type { Env } from '../index'

export async function handleUploadRoutes(url: URL, request: Request, env: Env): Promise<Response | null> {
  if (url.pathname === "/api/upload" && request.method === "POST") {
    try {
      // Must be logged in to upload
      const payload = await verifyToken(request, env.JWT_SECRET || 'fallback')
      if (!payload) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: corsHeaders
        })
      }

      if (!env.IMGBB_API_KEY) {
        return new Response(JSON.stringify({ error: "ImgBB API key not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const formData = await request.formData()
      const image = formData.get("image")
      
      if (!image) {
        return new Response(JSON.stringify({ error: "No image provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
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
        throw new Error("Failed to upload image to ImgBB")
      }

      const data: any = await response.json()
      
      return new Response(JSON.stringify({
        success: true,
        url: data.data.url,
        display_url: data.data.display_url,
        delete_url: data.data.delete_url
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      console.error("Upload error:", err)
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  return null
}
