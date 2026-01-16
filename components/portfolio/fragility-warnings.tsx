"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingDown,
  Layers,
  DollarSign,
  PieChart,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AffectedAsset {
  symbol: string
  name: string
  dollarExposure: number
  portfolioWeight: number
  priceChange24h?: number
}

interface Warning {
  id: string
  type: "high_concentration" | "conflicting_narratives" | "stale_thesis" | "single_point_failure"
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  affectedAssets: AffectedAsset[]
  recommendation: string
  totalExposure: number
  narrativeContext?: {
    id: string
    name: string
    confidence: number
  }[]
}

const fetcher = async (): Promise<Warning[]> => {
  const supabase = createClient()

  // Fetch all relevant data including asset details
  const [holdingsRes, narrativesRes, edgesRes, exposuresRes] = await Promise.all([
    supabase.from("portfolio_holdings").select(`
      id,
      current_weight,
      quantity,
      cost_basis,
      assets (id, symbol, name, current_price)
    `),
    supabase.from("narratives").select("id, title, confidence_score, updated_at"),
    supabase.from("belief_edges").select("*"),
    supabase.from("narrative_asset_exposures").select(`
      narrative_id,
      asset_id,
      exposure_weight,
      assets (id, symbol, name),
      narratives (id, title, confidence_score)
    `),
  ])

  const holdings = holdingsRes.data || []
  const narratives = narrativesRes.data || []
  const edges = edgesRes.data || []
  const exposures = exposuresRes.data || []

  const warnings: Warning[] = []

  // Calculate total portfolio value
  const totalPortfolioValue =
    holdings.reduce((sum, h) => {
      const price = (h.assets as { current_price?: number })?.current_price || h.cost_basis || 100
      return sum + (h.quantity || 0) * price
    }, 0) || 100000 // Default to $100k if no holdings

  // Check for high concentration
  const sortedHoldings = [...holdings].sort((a, b) => b.current_weight - a.current_weight)
  const topHolding = sortedHoldings[0]
  if (topHolding && topHolding.current_weight > 0.3) {
    const asset = topHolding.assets as { symbol: string; name: string; current_price?: number }
    const dollarValue = totalPortfolioValue * topHolding.current_weight

    warnings.push({
      id: "concentration-1",
      type: "high_concentration",
      severity: topHolding.current_weight > 0.5 ? "critical" : "warning",
      title: "High Position Concentration",
      description: `${asset?.symbol} represents ${Math.round(topHolding.current_weight * 100)}% of your portfolio`,
      affectedAssets: [
        {
          symbol: asset?.symbol || "Unknown",
          name: asset?.name || "Unknown Asset",
          dollarExposure: dollarValue,
          portfolioWeight: topHolding.current_weight,
        },
      ],
      recommendation: "Consider reducing position size or adding uncorrelated assets",
      totalExposure: dollarValue,
    })
  }

  // Check for contradicting narratives with affected assets
  const contradictions = edges.filter((e) => e.relationship_type === "contradicts" && e.strength > 0.6)
  if (contradictions.length > 0) {
    const affectedNarrativeIds = new Set<string>()
    contradictions.forEach((c) => {
      affectedNarrativeIds.add(c.source_narrative_id)
      affectedNarrativeIds.add(c.target_narrative_id)
    })

    // Find assets exposed to these narratives
    const affectedAssetMap = new Map<string, AffectedAsset>()
    const narrativeContext: { id: string; name: string; confidence: number }[] = []

    exposures.forEach((exp) => {
      if (affectedNarrativeIds.has(exp.narrative_id)) {
        const asset = exp.assets as { id: string; symbol: string; name: string }
        const narrative = exp.narratives as { id: string; title: string; confidence_score: number }

        // Find the holding for this asset
        const holding = holdings.find((h) => (h.assets as { id: string })?.id === exp.asset_id)
        if (holding && asset) {
          const dollarValue = totalPortfolioValue * holding.current_weight

          if (!affectedAssetMap.has(asset.symbol)) {
            affectedAssetMap.set(asset.symbol, {
              symbol: asset.symbol,
              name: asset.name,
              dollarExposure: dollarValue,
              portfolioWeight: holding.current_weight,
            })
          }
        }

        if (narrative && !narrativeContext.find((n) => n.id === narrative.id)) {
          narrativeContext.push({
            id: narrative.id,
            name: narrative.title,
            confidence: narrative.confidence_score,
          })
        }
      }
    })

    const affectedAssets = Array.from(affectedAssetMap.values())
    const totalExposure = affectedAssets.reduce((sum, a) => sum + a.dollarExposure, 0)

    warnings.push({
      id: "conflict-1",
      type: "conflicting_narratives",
      severity: "warning",
      title: "Conflicting Narrative Exposure",
      description: `Your portfolio has exposure to ${affectedNarrativeIds.size} narratives with strong contradictions`,
      affectedAssets,
      recommendation: "Review conflicting positions and consider reducing one side",
      totalExposure,
      narrativeContext,
    })
  }

  // Check for stale narratives with affected assets
  const staleNarratives = narratives.filter((n) => {
    const daysSince = Math.floor((Date.now() - new Date(n.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince > 14
  })

  if (staleNarratives.length > 0) {
    const staleNarrativeIds = new Set(staleNarratives.map((n) => n.id))
    const affectedAssetMap = new Map<string, AffectedAsset>()

    exposures.forEach((exp) => {
      if (staleNarrativeIds.has(exp.narrative_id)) {
        const asset = exp.assets as { id: string; symbol: string; name: string }
        const holding = holdings.find((h) => (h.assets as { id: string })?.id === exp.asset_id)

        if (holding && asset && !affectedAssetMap.has(asset.symbol)) {
          const dollarValue = totalPortfolioValue * holding.current_weight
          affectedAssetMap.set(asset.symbol, {
            symbol: asset.symbol,
            name: asset.name,
            dollarExposure: dollarValue,
            portfolioWeight: holding.current_weight,
          })
        }
      }
    })

    const affectedAssets = Array.from(affectedAssetMap.values())
    const totalExposure = affectedAssets.reduce((sum, a) => sum + a.dollarExposure, 0)

    warnings.push({
      id: "stale-1",
      type: "stale_thesis",
      severity: "info",
      title: "Stale Narrative Theses",
      description: `${staleNarratives.length} narratives haven't been updated in over 2 weeks`,
      affectedAssets,
      recommendation: "Review and update narrative evidence or adjust confidence scores",
      totalExposure,
      narrativeContext: staleNarratives.map((n) => ({
        id: n.id,
        name: n.title,
        confidence: n.confidence_score,
      })),
    })
  }

  // Check for single point of failure (many holdings depend on one narrative)
  const highConfNarrative = narratives.find((n) => n.confidence_score > 0.8)
  if (highConfNarrative) {
    const dependentAssets = exposures
      .filter((exp) => exp.narrative_id === highConfNarrative.id && exp.exposure_weight > 0.5)
      .map((exp) => {
        const asset = exp.assets as { id: string; symbol: string; name: string }
        const holding = holdings.find((h) => (h.assets as { id: string })?.id === exp.asset_id)
        if (holding && asset) {
          const dollarValue = totalPortfolioValue * holding.current_weight
          return {
            symbol: asset.symbol,
            name: asset.name,
            dollarExposure: dollarValue,
            portfolioWeight: holding.current_weight,
          }
        }
        return null
      })
      .filter((a): a is AffectedAsset => a !== null)

    const totalExposure = dependentAssets.reduce((sum, a) => sum + a.dollarExposure, 0)

    if (dependentAssets.length > 0 || totalExposure > 0) {
      warnings.push({
        id: "spof-1",
        type: "single_point_failure",
        severity: totalExposure > totalPortfolioValue * 0.3 ? "warning" : "info",
        title: "High Confidence Dependency",
        description: `Multiple positions depend heavily on "${highConfNarrative.title}"`,
        affectedAssets: dependentAssets,
        recommendation: "Stress test portfolio against narrative invalidation",
        totalExposure,
        narrativeContext: [
          {
            id: highConfNarrative.id,
            name: highConfNarrative.title,
            confidence: highConfNarrative.confidence_score,
          },
        ],
      })
    }
  }

  return warnings
}

export function FragilityWarnings() {
  const { data: warnings, isLoading } = useSWR("fragility-warnings", fetcher)
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null)

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Risk Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-secondary" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedWarnings = [...(warnings || [])].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      iconColor: "text-destructive",
      badge: "bg-destructive/20 text-destructive",
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-accent/10",
      border: "border-accent/30",
      iconColor: "text-accent",
      badge: "bg-accent/20 text-accent",
    },
    info: {
      icon: Info,
      bg: "bg-chart-3/10",
      border: "border-chart-3/30",
      iconColor: "text-chart-3",
      badge: "bg-chart-3/20 text-chart-3",
    },
  }

  const typeIcons = {
    high_concentration: Layers,
    conflicting_narratives: AlertTriangle,
    stale_thesis: Info,
    single_point_failure: TrendingDown,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Risk Alerts</CardTitle>
            {sortedWarnings.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {sortedWarnings.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedWarnings.length === 0 ? (
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-4 w-4" />
              <span className="text-sm">No active risk alerts</span>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedWarnings.map((warning) => {
                const config = severityConfig[warning.severity]
                const TypeIcon = typeIcons[warning.type]
                const SeverityIcon = config.icon

                return (
                  <button
                    key={warning.id}
                    onClick={() => setSelectedWarning(warning)}
                    className={cn(
                      "w-full rounded-lg border p-4 text-left transition-all",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-2 hover:ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      config.bg,
                      config.border,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <SeverityIcon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{warning.title}</h4>
                            <Badge variant="secondary" className={cn("text-xs", config.badge)}>
                              {warning.severity}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{warning.description}</p>

                        <div className="flex items-center gap-4 pt-1">
                          {warning.totalExposure > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(warning.totalExposure)} at risk</span>
                            </div>
                          )}
                          {warning.affectedAssets.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <PieChart className="h-3 w-3" />
                              <span>
                                {warning.affectedAssets.length} asset{warning.affectedAssets.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Warning Modal */}
      <Dialog open={!!selectedWarning} onOpenChange={() => setSelectedWarning(null)}>
        <DialogContent className="max-w-lg">
          {selectedWarning && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {(() => {
                    const SeverityIcon = severityConfig[selectedWarning.severity].icon
                    return (
                      <SeverityIcon className={cn("h-5 w-5", severityConfig[selectedWarning.severity].iconColor)} />
                    )
                  })()}
                  <DialogTitle>{selectedWarning.title}</DialogTitle>
                </div>
                <DialogDescription>{selectedWarning.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Total Exposure Banner */}
                {selectedWarning.totalExposure > 0 && (
                  <div
                    className={cn(
                      "p-4 rounded-lg border flex items-center justify-between",
                      severityConfig[selectedWarning.severity].bg,
                      severityConfig[selectedWarning.severity].border,
                    )}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Total Exposure at Risk</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(selectedWarning.totalExposure)}
                      </p>
                    </div>
                    <DollarSign className={cn("h-8 w-8", severityConfig[selectedWarning.severity].iconColor)} />
                  </div>
                )}

                {/* Affected Assets List */}
                {selectedWarning.affectedAssets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Affected Assets
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedWarning.affectedAssets.map((asset) => (
                        <div
                          key={asset.symbol}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-mono font-bold text-sm text-foreground">
                              {asset.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{formatCurrency(asset.dollarExposure)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(asset.portfolioWeight * 100)}% of portfolio
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Narratives */}
                {selectedWarning.narrativeContext && selectedWarning.narrativeContext.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Related Narratives</h4>
                    <div className="space-y-1">
                      {selectedWarning.narrativeContext.map((narrative) => (
                        <div
                          key={narrative.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                        >
                          <span className="text-sm text-foreground">{narrative.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {Math.round(narrative.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="text-sm font-medium text-foreground mb-1">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{selectedWarning.recommendation}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setSelectedWarning(null)}>
                    Dismiss
                  </Button>
                  <Button className="flex-1 gap-2">
                    View in Portfolio
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
