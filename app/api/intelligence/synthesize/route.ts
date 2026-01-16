import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { narrativeId } = await req.json()

  const supabase = await createClient()

  // Fetch narrative with all related data
  const [narrativeRes, assumptionsRes, evidenceRes, edgesRes] = await Promise.all([
    supabase.from("narratives").select("*").eq("id", narrativeId).single(),
    supabase.from("assumptions").select("*").eq("narrative_id", narrativeId).order("importance_weight", {
      ascending: false,
    }),
    supabase.from("evidence").select("*").eq("narrative_id", narrativeId).order("observed_at", { ascending: false }),
    supabase
      .from("belief_edges")
      .select("*, narratives!belief_edges_target_narrative_id_fkey(title, direction)")
      .or(`source_narrative_id.eq.${narrativeId},target_narrative_id.eq.${narrativeId}`),
  ])

  if (narrativeRes.error || !narrativeRes.data) {
    return new Response(JSON.stringify({ error: "Narrative not found" }), { status: 404 })
  }

  const narrative = narrativeRes.data
  const assumptions = assumptionsRes.data || []
  const evidence = evidenceRes.data || []
  const edges = edgesRes.data || []

  const supportingEvidence = evidence.filter((e) => e.impact === "supporting")
  const contradictingEvidence = evidence.filter((e) => e.impact === "contradicting")

  const relatedNarratives = edges.map((e) => ({
    relationship: e.relationship_type,
    strength: e.strength,
    narrative: e.narratives,
  }))

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: `You are a senior investment analyst synthesizing market intelligence. Your role is to provide clear, actionable analysis of investment narratives.

Style guidelines:
- Be direct and specific, avoid hedging language
- Use data and evidence to support claims
- Highlight key risks and uncertainties
- Structure your analysis clearly with sections
- End with actionable takeaways`,
    prompt: `Synthesize a comprehensive analysis of this investment narrative:

**Narrative:** ${narrative.title}
**Thesis:** ${narrative.thesis}
**Direction:** ${narrative.direction}
**Current Confidence:** ${Math.round(narrative.confidence_score * 100)}%

**Key Assumptions (${assumptions.length}):**
${assumptions.map((a) => `- [${a.status}] ${a.description} (importance: ${Math.round(a.importance_weight * 100)}%)`).join("\n")}

**Supporting Evidence (${supportingEvidence.length} pieces):**
${supportingEvidence
  .slice(0, 5)
  .map((e) => `- ${e.content} (signal: ${Math.round((e.signal_strength || 0.5) * 100)}%)`)
  .join("\n")}

**Contradicting Evidence (${contradictingEvidence.length} pieces):**
${contradictingEvidence
  .slice(0, 5)
  .map((e) => `- ${e.content} (signal: ${Math.round((e.signal_strength || 0.5) * 100)}%)`)
  .join("\n")}

**Related Narratives:**
${relatedNarratives.map((r) => `- ${r.relationship}: ${(r.narrative as { title: string })?.title || "Unknown"} (strength: ${Math.round(r.strength * 100)}%)`).join("\n")}

Provide:
1. Executive Summary (2-3 sentences)
2. Current State Assessment
3. Key Risk Factors
4. Catalysts to Watch
5. Recommended Actions`,
  })

  return result.toTextStreamResponse()
}
