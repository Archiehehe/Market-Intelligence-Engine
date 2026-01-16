import { streamObject } from "ai"
import { z } from "zod"

const EvidenceExtractionSchema = z.object({
  signals: z.array(
    z.object({
      content: z.string().describe("The key signal or insight extracted from the text"),
      source_type: z
        .enum(["news", "earnings_call", "sec_filing", "market_data", "social_media", "research_report", "other"])
        .describe("The type of source this signal came from"),
      impact: z.enum(["supporting", "contradicting", "neutral"]).describe("How this signal affects the narrative"),
      signal_strength: z.number().min(0).max(1).describe("Confidence in the signal strength (0-1)"),
      relevant_narratives: z.array(z.string()).describe("List of narrative titles this signal is most relevant to"),
      key_entities: z.array(z.string()).describe("Companies, people, or concepts mentioned"),
    }),
  ),
  summary: z.string().describe("A brief summary of the overall content and its market implications"),
  suggested_narrative_updates: z
    .array(
      z.object({
        narrative_title: z.string(),
        confidence_change: z.number().min(-0.3).max(0.3).describe("Suggested change to confidence score"),
        reasoning: z.string(),
      }),
    )
    .describe("Suggested updates to existing narratives based on this evidence"),
})

export async function POST(req: Request) {
  const { content, existingNarratives } = await req.json()

  const narrativeContext =
    existingNarratives?.map((n: { title: string; thesis: string }) => `- ${n.title}: ${n.thesis}`).join("\n") || ""

  const result = streamObject({
    model: "anthropic/claude-sonnet-4-20250514",
    schema: EvidenceExtractionSchema,
    prompt: `You are a market intelligence analyst. Extract actionable signals from the following content and determine how they relate to existing investment narratives.

Existing Narratives:
${narrativeContext}

Content to analyze:
${content}

Extract all relevant market signals, categorize them appropriately, and suggest how they might update confidence in existing narratives. Be specific and quantitative where possible.`,
  })

  return result.toTextStreamResponse()
}
