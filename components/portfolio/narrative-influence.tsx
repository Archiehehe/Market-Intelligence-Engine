"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface NarrativeImpact {
  id: string
  name: string
  direction: "bullish" | "bearish" | "neutral"
  confidence: number
  confidenceTrend: "up" | "down" | "flat"
  portfolioExposure: number
  impactScore: number
  affectedHoldings: number
}

const fetcher = async (): Promise<NarrativeImpact[]> => {
  const supabase = createClient()

  const [narrativesRes, exposuresRes, holdingsRes] = await Promise.all([
    supabase.from("narratives").select("id, name, direction, confidence_score, confidence_trend"),
    supabase.from("narrative_asset_exposures").select("narrative_id, asset_id, exposure_weight"),
    supabase.from("portfolio_holdings").select("id, current_weight, assets(id)"),
  ])

  const narratives = narrativesRes.data || []
  const exposures = exposuresRes.data || []
  const holdings = holdingsRes.data || []

  // Calculate narrative influence on portfolio
  const narrativeImpacts: NarrativeImpact[] = narratives.map((narrative) => {
    const narrativeExposures = exposures.filter((e) => e.narrative_id === narrative.id)
    const affectedHoldingIds = new Set(narrativeExposures.map((e) => e.asset_id))

    let totalExposure = 0
    let affectedCount = 0

    holdings.forEach((holding) => {
      const assetId = (holding.assets as { id: string })?.id
      if (assetId && affectedHoldingIds.has(assetId)) {
        const exposure = narrativeExposures.find((e) => e.asset_id === assetId)
        totalExposure += holding.current_weight * (exposure?.exposure_weight || 0.5)
        affectedCount++
      }
    })

    // Calculate impact score (combination of exposure and confidence)
    const impactScore = totalExposure * narrative.confidence_score

    return {
      id: narrative.id,
      name: narrative.name,
      direction: narrative.direction as "bullish" | "bearish" | "neutral",
      confidence: narrative.confidence_score,
      confidenceTrend: narrative.confidence_trend as "up" | "down" | "flat",
      portfolioExposure: totalExposure,
      impactScore,
      affectedHoldings: affectedCount,
    }
  })

  // Sort by impact score and return top 5
  return narrativeImpacts
    .filter((n) => n.portfolioExposure > 0)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5)
}

export function NarrativeInfluence() {
  const { data: narratives, isLoading } = useSWR("narrative-influence", fetcher)

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Narrative Influence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-secondary" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const trendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    flat: Minus,
  }

  const trendColor = {
    up: "text-primary",
    down: "text-destructive",
    flat: "text-muted-foreground",
  }

  const directionColor = {
    bullish: "bg-primary/20 text-primary border-primary/30",
    bearish: "bg-destructive/20 text-destructive border-destructive/30",
    neutral: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Narrative Influence
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!narratives || narratives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No narrative exposures found</p>
        ) : (
          <div className="space-y-4">
            {narratives.map((narrative) => {
              const TrendIcon = trendIcon[narrative.confidenceTrend]

              return (
                <div key={narrative.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TrendIcon className={cn("h-4 w-4 shrink-0", trendColor[narrative.confidenceTrend])} />
                      <span className="text-sm font-medium text-foreground truncate">{narrative.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", directionColor[narrative.direction])}>
                        {narrative.direction}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(narrative.confidence * 100)}% confidence</span>
                    <span>{narrative.affectedHoldings} holdings affected</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress
                      value={narrative.portfolioExposure * 100}
                      className={cn(
                        "h-2 flex-1",
                        narrative.direction === "bullish"
                          ? "[&>div]:bg-primary"
                          : narrative.direction === "bearish"
                            ? "[&>div]:bg-destructive"
                            : "[&>div]:bg-chart-3",
                      )}
                    />
                    <span className="text-xs font-mono text-foreground w-12 text-right">
                      {Math.round(narrative.portfolioExposure * 100)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
