"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, FileText, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Narrative {
  id: string
  name: string
  summary: string
  confidence_score: number
  confidence_trend: string
  assumptions?: Array<{ id: string; text: string; fragility_score: number }>
  evidence?: Array<{ id: string; description: string; type: string; source: string }>
}

const narrativesFetcher = async (): Promise<Narrative[]> => {
  const supabase = createClient()

  const { data: narratives } = await supabase
    .from("narratives")
    .select("id, name, summary, confidence_trend, confidence_score")
    .order("updated_at", { ascending: false })

  // Fetch assumptions and evidence for each narrative
  const enrichedNarratives = await Promise.all(
    (narratives || []).map(async (narrative) => {
      const [assumptionsRes, evidenceRes] = await Promise.all([
        supabase.from("assumptions").select("*").eq("narrative_id", narrative.id),
        supabase.from("evidence").select("*").eq("narrative_id", narrative.id),
      ])

      return {
        ...narrative,
        assumptions: assumptionsRes.data || [],
        evidence: evidenceRes.data || [],
      }
    }),
  )

  return enrichedNarratives
}

export function NarrativeSynthesis() {
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string>("")
  const [synthesis, setSynthesis] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: narratives } = useSWR("narratives-for-synthesis", narrativesFetcher)

  const selectedNarrative = narratives?.find((n) => n.id === selectedNarrativeId)

  const handleGenerate = async () => {
    if (!selectedNarrativeId || !selectedNarrative) return

    setIsGenerating(true)
    setSynthesis("")

    try {
      const response = await fetch("/api/intelligence/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrativeId: selectedNarrative.id,
          narrativeName: selectedNarrative.name,
          narrativeSummary: selectedNarrative.summary,
          confidenceScore: selectedNarrative.confidence_score,
          confidenceTrend: selectedNarrative.confidence_trend,
          assumptions: selectedNarrative.assumptions,
          evidence: selectedNarrative.evidence,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate synthesis")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setSynthesis((prev) => prev + chunk)
      }
    } catch (error) {
      console.error("Synthesis failed:", error)
      setSynthesis("Failed to generate synthesis. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (synthesis) {
      await navigator.clipboard.writeText(synthesis)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const trendConfig = {
    up: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/20" },
    down: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/20" },
    flat: { icon: Minus, color: "text-chart-3", bg: "bg-chart-3/20" },
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Narrative Synthesis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-muted-foreground">Select Narrative</label>
              <Select value={selectedNarrativeId} onValueChange={setSelectedNarrativeId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a narrative to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {narratives?.map((narrative) => {
                    const config = trendConfig[narrative.confidence_trend as keyof typeof trendConfig]
                    const Icon = config?.icon || Minus

                    return (
                      <SelectItem key={narrative.id} value={narrative.id}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config?.color)} />
                          <span>{narrative.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(narrative.confidence_score * 100)}%)
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !selectedNarrativeId} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Synthesis
                </>
              )}
            </Button>
          </div>

          {selectedNarrative && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <Badge
                variant="secondary"
                className={cn(
                  trendConfig[selectedNarrative.confidence_trend as keyof typeof trendConfig]?.bg,
                  trendConfig[selectedNarrative.confidence_trend as keyof typeof trendConfig]?.color,
                )}
              >
                {selectedNarrative.confidence_trend}
              </Badge>
              <span className="text-sm font-mono text-foreground">
                {Math.round(selectedNarrative.confidence_score * 100)}% confidence
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedNarrative.assumptions?.length || 0} assumptions • {selectedNarrative.evidence?.length || 0}{" "}
                evidence items
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synthesis output */}
      {(synthesis || isGenerating) && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              AI Analysis
            </CardTitle>
            {synthesis && !isGenerating && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              {synthesis ? (
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{synthesis}</div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating comprehensive analysis...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
