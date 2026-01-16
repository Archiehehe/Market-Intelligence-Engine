import { streamText, type Message } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, narratives } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Build context about available narratives
    const narrativeContext =
      narratives && Array.isArray(narratives) && narratives.length > 0
        ? narratives
            .map(
              (n: {
                name: string
                confidence_score: number
                confidence_trend: string
                direction: string
                summary: string
              }) =>
                `- ${n.name}: ${Math.round((n.confidence_score || 0.5) * 100)}% confidence (${n.confidence_trend || "flat"}), ${n.direction || "neutral"}. ${n.summary?.slice(0, 100) || "No summary"}...`,
            )
            .join("\n")
        : "No narratives currently loaded in the system."

    const systemPrompt = `You are an AI-powered market intelligence analyst with access to the following market narratives:

${narrativeContext}

Your role is to:
1. Analyze market narratives and their implications
2. Identify risks and opportunities across narratives
3. Help users understand narrative relationships and conflicts
4. Provide actionable insights based on the evidence
5. Answer questions about specific narratives, sectors, or market themes

Be concise but thorough. Use data and specific references when possible. Format responses with markdown for clarity.
If there are no narratives loaded, explain that the system needs to be populated with data first.`

    const formattedMessages: Message[] = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { id?: string; role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    const result = streamText({
      model: "openai/gpt-4o-mini",
      messages: formattedMessages,
      maxTokens: 2000,
      temperature: 0.7,
      abortSignal: req.signal,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Intelligence chat error:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
