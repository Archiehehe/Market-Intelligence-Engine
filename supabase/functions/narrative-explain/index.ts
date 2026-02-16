import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, narrativeName, narrativeSummary, assetTicker, assetName, exposureWeight, evidenceDescription, evidenceSource, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt = "";

    if (type === "asset_exposure") {
      prompt = `Explain why ${assetTicker} (${assetName}) has a ${Math.round(exposureWeight * 100)}% exposure weight to the "${narrativeName}" narrative. 

Narrative context: ${narrativeSummary}

Provide a detailed 3-4 paragraph rationale covering:
1. Why this specific company/asset is affected by this narrative
2. The transmission mechanism (how does this narrative translate to the asset's fundamentals?)
3. Key risks or nuances to the exposure estimate
Be specific and analytical. Reference real business fundamentals.`;
    } else if (type === "evidence") {
      prompt = `Analyze this piece of evidence for the "${narrativeName}" narrative:

Source: ${evidenceSource}
Evidence: ${evidenceDescription}

Narrative context: ${narrativeSummary}

Provide a detailed 3-4 paragraph analysis covering:
1. Why this evidence matters for the narrative
2. How it shifts confidence in the narrative (and by how much)
3. What to watch for next — what would confirm or invalidate this signal
Be specific and analytical.`;
    } else if (type === "portfolio_analysis") {
      prompt = `Analyze this portfolio position's narrative exposure:

Ticker: ${assetTicker} (${assetName})
${context || ''}

Explain which market narratives this position is most exposed to, whether bullish or bearish, and what assumptions the holder is implicitly making by owning this position. Be detailed and specific about narrative connections.`;
    } else if (type === "belief_graph_node") {
      prompt = `Explain the "${narrativeName}" narrative in the context of a belief graph showing how market narratives connect and influence each other.

Narrative: ${narrativeSummary}
${context || ''}

Provide:
1. A clear summary of why this narrative matters right now
2. How it connects to other major market narratives (reinforcing, conflicting)
3. Key fragility points — what could break this narrative
4. Investment implications`;
    } else if (type === "belief_graph_edge") {
      prompt = `Explain the relationship between these two market narratives:

${context}

Explain:
1. Why these narratives have this specific relationship
2. The causal mechanism connecting them
3. Historical precedents for this type of narrative interaction
4. What would change this relationship`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a market narrative intelligence analyst. You provide detailed, analytical explanations about market narratives and their effects on assets. Be specific, reference real market dynamics, and avoid vague generalities. Use markdown formatting." },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("narrative-explain error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
