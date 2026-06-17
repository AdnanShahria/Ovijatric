import { corsHeaders } from '../utils'
import type { Env } from '../index'

export async function handleChatbotRoutes(url: URL, request: Request, env: Env): Promise<Response | null> {
  if (url.pathname === "/api/chat" && request.method === "POST") {
    try {
      const { message, history } = await request.json() as any
      
      if (!env.GROQ_API_KEY) {
        return new Response(JSON.stringify({ error: "Groq API key not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const systemPrompt = {
        role: "system",
        content: `You are the friendly, energetic, and helpful AI assistant for Ovijatrik - RUET Adventure Club (tagline: "Time To Explore"). 
You help users by answering questions about the club's activities (like Marathon 2.0, Trekking, Volunteering, etc.), membership benefits, how to join, and any general inquiries.
Keep responses concise, adventurous, and encouraging.`
      }

      const messages = [
        systemPrompt,
        ...(history || []),
        { role: "user", content: message }
      ]

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 512,
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Groq API error: ${errText}`)
      }

      const data: any = await response.json()
      
      return new Response(JSON.stringify({
        success: true,
        reply: data.choices[0].message.content
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      console.error("Chatbot error:", err)
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  return null
}
