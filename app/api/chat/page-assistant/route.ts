import { streamText, type Message } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message, context, systemPrompt, conversationHistory } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response("Invalid message format", { status: 400 })
    }

    // Build the full conversation with system context
    const fullSystemPrompt = `${systemPrompt || "You are a helpful assistant."}

You are a helpful assistant for a market intelligence platform. You have knowledge about:
- Market narratives and investment theses
- Portfolio analysis and risk assessment
- Evidence-based investing principles
- Market trends and sector analysis

Always provide thoughtful, context-aware responses. Reference previous parts of the conversation when relevant.
Be concise but thorough. Use markdown formatting for clarity when appropriate.`

    const formattedMessages: Message[] = [{ role: "system" as const, content: fullSystemPrompt }]

    // Add conversation history if it exists and is an array
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg && msg.role && msg.content) {
          formattedMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })
        }
      }
    }

    // Add the current user message
    formattedMessages.push({ role: "user" as const, content: message })

    const result = streamText({
      model: "openai/gpt-4o-mini",
      messages: formattedMessages,
      maxTokens: 1500,
      temperature: 0.7,
      abortSignal: req.signal,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Page assistant error:", error)
    return new Response("I'm having trouble processing your request. Please try again.", {
      status: 500,
    })
  }
}
