"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, CheckCircle, XCircle, Minus, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExtractedSignal {
  content: string
  source_type: string
  impact: "supporting" | "contradicting" | "neutral"
  signal_strength: number
  relevant_narratives: string[]
  key_entities: string[]
}

interface NarrativeUpdate {
  narrative_title: string
  confidence_change: number
  reasoning: string
}

interface ExtractionResult {
  signals: ExtractedSignal[]
  summary: string
  suggested_narrative_updates: NarrativeUpdate[]
}

const narrativesFetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("narratives").select("id, name, summary, confidence_score")
  return data || []
}

const simulateExtraction = async (content: string, narratives: any[]): Promise<ExtractionResult> => {
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate processing time

  const narrativeNames = narratives?.map((n) => n.name) || ["AI Infrastructure Boom", "Commercial Real Estate Distress"]

  return {
    signals: [
      {
        content: "Strong quarterly revenue growth exceeding analyst expectations by 15%",
        source_type: "earnings_report",
        impact: "supporting",
        signal_strength: 0.85,
        relevant_narratives: [narrativeNames[0] || "AI Infrastructure Boom"],
        key_entities: ["NVIDIA", "Data Center", "GPU Demand"],
      },
      {
        content: "Management guidance indicates continued capital expenditure increases",
        source_type: "earnings_call",
        impact: "supporting",
        signal_strength: 0.72,
        relevant_narratives: [narrativeNames[0] || "AI Infrastructure Boom"],
        key_entities: ["CapEx", "Infrastructure", "Cloud Providers"],
      },
      {
        content: "Rising vacancy rates in major metropolitan office markets",
        source_type: "market_data",
        impact: "supporting",
        signal_strength: 0.78,
        relevant_narratives: [narrativeNames[1] || "Commercial Real Estate Distress"],
        key_entities: ["Office REITs", "Vacancy Rate", "Remote Work"],
      },
    ],
    summary:
      "Analysis indicates strong supporting evidence for technology infrastructure investment themes, with particular strength in AI-related capital expenditure. Commercial real estate concerns remain elevated with continued pressure on office space demand.",
    suggested_narrative_updates: [
      {
        narrative_title: narrativeNames[0] || "AI Infrastructure Boom",
        confidence_change: 0.08,
        reasoning: "Earnings beat and raised guidance provide concrete validation of sustained demand growth",
      },
      {
        narrative_title: narrativeNames[1] || "Commercial Real Estate Distress",
        confidence_change: 0.05,
        reasoning: "Continued vacancy rate increases align with thesis of structural demand shift",
      },
    ],
  }
}

export function NewsAnalyzer() {
  const [content, setContent] = useState("")
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [useDemoMode, setUseDemoMode] = useState(true) // Default to demo mode

  const { data: narratives } = useSWR("narratives-for-analysis", narrativesFetcher)

  const handleAnalyze = async () => {
    if (!content.trim()) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      if (useDemoMode) {
        const simulated = await simulateExtraction(content, narratives || [])
        setResult(simulated)
        return
      }

      const response = await fetch("/api/intelligence/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          existingNarratives: narratives,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      try {
        const parsed = JSON.parse(accumulated)
        setResult(parsed)
      } catch {
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          setResult(JSON.parse(jsonMatch[0]))
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const impactConfig = {
    supporting: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
    contradicting: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    neutral: { icon: Minus, color: "text-chart-3", bg: "bg-chart-3/10" },
  }

  return (
    <div className="space-y-6">
      {useDemoMode && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-3/10 border border-chart-3/20">
          <AlertTriangle className="h-5 w-5 text-chart-3 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">Demo Mode Active</span> — Using simulated AI responses. Add a credit card to
              your Vercel account to enable real AI analysis.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setUseDemoMode(!useDemoMode)} className="shrink-0">
            {useDemoMode ? "Try Live API" : "Use Demo"}
          </Button>
        </div>
      )}

      {/* Input section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Evidence Extraction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste news article, earnings transcript, SEC filing, or any market-relevant content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 bg-secondary border-border resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{narratives?.length || 0} narratives available for matching</p>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !content.trim()} className="gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Signals
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results section */}
      {result && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signals" className="space-y-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="signals">Signals ({result.signals?.length || 0})</TabsTrigger>
                <TabsTrigger value="updates">
                  Suggested Updates ({result.suggested_narrative_updates?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="space-y-3">
                {result.signals?.map((signal, i) => {
                  const config = impactConfig[signal.impact]
                  const Icon = config.icon

                  return (
                    <div key={i} className={cn("rounded-lg border border-border p-4", config.bg)}>
                      <div className="flex items-start gap-3">
                        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.color)} />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-foreground">{signal.content}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {signal.source_type.replace("_", " ")}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {Math.round(signal.signal_strength * 100)}% signal
                            </Badge>
                            {signal.key_entities?.slice(0, 3).map((entity) => (
                              <Badge key={entity} variant="outline" className="text-xs">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                          {signal.relevant_narratives?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              <span className="text-xs text-muted-foreground">Relevant to:</span>
                              {signal.relevant_narratives.map((narrative) => (
                                <Badge
                                  key={narrative}
                                  variant="secondary"
                                  className="text-xs bg-primary/10 text-primary"
                                >
                                  {narrative}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </TabsContent>

              <TabsContent value="updates" className="space-y-3">
                {result.suggested_narrative_updates?.map((update, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{update.narrative_title}</h4>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs font-mono",
                              update.confidence_change > 0 ? "text-primary" : "text-destructive",
                            )}
                          >
                            {update.confidence_change > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {update.confidence_change > 0 ? "+" : ""}
                            {Math.round(update.confidence_change * 100)}%
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{update.reasoning}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="summary">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
