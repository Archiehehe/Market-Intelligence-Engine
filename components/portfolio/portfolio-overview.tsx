"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Shield, Target, DollarSign, PieChart, AlertCircle, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PortfolioUpload } from "./portfolio-upload"

interface PortfolioHolding {
  id: string
  asset: {
    id: string
    symbol: string
    name: string
    asset_class: string
  } | null
  quantity: number
  avg_cost_basis: number
  current_weight: number
  narrative_exposures: Array<{
    narrative_id: string
    narrative_title: string
    exposure_type: "long" | "short"
    confidence: number
  }>
}

interface UploadedHolding {
  symbol: string
  name: string
  quantity: number
  price: number
  weight: number
  sector: string
  narrativeExposures: Array<{
    narrative: string
    exposure: number
    direction: "bullish" | "bearish" | "neutral"
  }>
}

const fetcher = async () => {
  const supabase = createClient()

  const { data: holdings, error: holdingsError } = await supabase.from("portfolio_holdings").select(`
      id,
      weight,
      portfolio_id,
      asset_id,
      assets (
        id,
        ticker,
        name,
        sector
      )
    `)

  if (holdingsError) {
    console.error("Holdings error:", holdingsError)
    throw holdingsError
  }

  const { data: exposures, error: exposuresError } = await supabase.from("narrative_asset_exposure").select(`
      asset_id,
      narrative_id,
      exposure_weight,
      narratives (
        id,
        name,
        confidence_score,
        direction
      )
    `)

  if (exposuresError) {
    console.error("Exposures error:", exposuresError)
  }

  const { data: narratives, error: narrativesError } = await supabase
    .from("narratives")
    .select("id, name, confidence_score, direction")

  if (narrativesError) {
    console.error("Narratives error:", narrativesError)
  }

  const enrichedHoldings: PortfolioHolding[] = (holdings || []).map((h) => {
    const asset = h.assets as { id: string; ticker: string; name: string; sector: string } | null

    const holdingExposures = asset
      ? (exposures || [])
          .filter((e) => e.asset_id === asset.id)
          .map((e) => {
            const narrative = e.narratives as { id: string; name: string; confidence_score: number } | null
            return {
              narrative_id: e.narrative_id,
              narrative_title: narrative?.name || "Unknown",
              exposure_type: "long" as const,
              confidence: narrative?.confidence_score || 0.5,
            }
          })
      : []

    return {
      id: h.id,
      asset: asset
        ? {
            id: asset.id,
            symbol: asset.ticker,
            name: asset.name,
            asset_class: asset.sector || "Unknown",
          }
        : null,
      quantity: 100,
      avg_cost_basis: 100,
      current_weight: h.weight || 0,
      narrative_exposures: holdingExposures,
    }
  })

  const fragility =
    enrichedHoldings.length > 0
      ? enrichedHoldings.reduce((sum, h) => {
          const avgConfidence =
            h.narrative_exposures.length > 0
              ? h.narrative_exposures.reduce((s, e) => s + e.confidence, 0) / h.narrative_exposures.length
              : 0.5
          return sum + h.current_weight * (1 - avgConfidence)
        }, 0)
      : 0

  const clampedFragility = Math.max(0, Math.min(1, fragility))

  const narrativeWeights = new Map<string, number>()
  for (const holding of enrichedHoldings) {
    for (const exp of holding.narrative_exposures) {
      const current = narrativeWeights.get(exp.narrative_id) || 0
      narrativeWeights.set(exp.narrative_id, current + holding.current_weight)
    }
  }

  const weights = Array.from(narrativeWeights.values())
  const concentration = weights.length > 0 ? weights.reduce((sum, w) => sum + w * w, 0) : 0

  return {
    holdings: enrichedHoldings,
    narratives: narratives || [],
    metrics: {
      fragility: clampedFragility,
      concentration: Math.min(1, concentration),
      totalValue: enrichedHoldings.reduce((sum, h) => sum + h.quantity * h.avg_cost_basis * (1 + h.current_weight), 0),
      holdingsCount: enrichedHoldings.length,
    },
  }
}

export function PortfolioOverview() {
  const { data, isLoading, error, mutate } = useSWR("portfolio-overview", fetcher)
  const [uploadedHoldings, setUploadedHoldings] = useState<UploadedHolding[] | null>(null)
  const [activeTab, setActiveTab] = useState<"uploaded" | "database">("uploaded")

  const handleUploadComplete = (holdings: UploadedHolding[]) => {
    setUploadedHoldings(holdings)
    setActiveTab("uploaded")
  }

  if (!uploadedHoldings && !isLoading) {
    return (
      <div className="space-y-6">
        <PortfolioUpload onUploadComplete={handleUploadComplete} />

        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Upload Your Portfolio</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload a CSV file with your portfolio holdings to see narrative exposure analysis, fragility scores,
                  and sector breakdowns.
                </p>
                <p className="text-xs text-muted-foreground">
                  Your CSV should include columns: symbol, name, quantity, price, sector
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show database data if available but secondary */}
        {data && data.holdings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Or view database portfolio</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <DatabasePortfolioView
              holdings={data.holdings}
              narratives={data.narratives}
              metrics={data.metrics}
              fragilityStatus={getFragilityStatus(data.metrics.fragility)}
              concentrationStatus={getConcentrationStatus(data.metrics.concentration)}
              topNarrativeExposures={getTopNarrativeExposures(data.holdings, data.narratives)}
              narrativeExposureMap={getNarrativeExposureMap(data.holdings, data.narratives)}
              topSector={getTopSector(data.holdings)}
            />
          </div>
        )}
      </div>
    )
  }

  if (error && !uploadedHoldings) {
    return (
      <div className="space-y-6">
        <PortfolioUpload onUploadComplete={handleUploadComplete} />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Unable to load portfolio data</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to analyze your portfolio while the database is being configured.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading && !uploadedHoldings) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (uploadedHoldings) {
    return (
      <div className="space-y-6">
        <PortfolioUpload onUploadComplete={handleUploadComplete} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "uploaded" | "database")}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="uploaded">Uploaded Portfolio ({uploadedHoldings.length})</TabsTrigger>
            {data && data.holdings.length > 0 && (
              <TabsTrigger value="database">Database Portfolio ({data.holdings.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="uploaded" className="mt-6">
            <UploadedPortfolioView holdings={uploadedHoldings} />
          </TabsContent>

          {data && data.holdings.length > 0 && (
            <TabsContent value="database" className="mt-6">
              <DatabasePortfolioView
                holdings={data.holdings}
                narratives={data.narratives}
                metrics={data.metrics}
                fragilityStatus={getFragilityStatus(data.metrics.fragility)}
                concentrationStatus={getConcentrationStatus(data.metrics.concentration)}
                topNarrativeExposures={getTopNarrativeExposures(data.holdings, data.narratives)}
                narrativeExposureMap={getNarrativeExposureMap(data.holdings, data.narratives)}
                topSector={getTopSector(data.holdings)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  }

  return null
}

// Helper functions
function getFragilityStatus(fragility: number) {
  return fragility < 0.3
    ? { label: "Robust", color: "text-primary", bg: "bg-primary/20" }
    : fragility < 0.6
      ? { label: "Moderate", color: "text-accent", bg: "bg-accent/20" }
      : { label: "Fragile", color: "text-destructive", bg: "bg-destructive/20" }
}

function getConcentrationStatus(concentration: number) {
  return concentration < 0.3
    ? { label: "Diversified", color: "text-primary" }
    : concentration < 0.6
      ? { label: "Moderate", color: "text-accent" }
      : { label: "Concentrated", color: "text-destructive" }
}

function getNarrativeExposureMap(
  holdings: PortfolioHolding[],
  narratives: Array<{ id: string; name: string; confidence_score: number; direction: string }>,
) {
  const map = new Map<string, { weight: number; direction: "bullish" | "bearish" | "neutral" }>()
  for (const holding of holdings) {
    for (const exp of holding.narrative_exposures) {
      const narrative = narratives.find((n) => n.id === exp.narrative_id)
      const existing = map.get(exp.narrative_id)
      map.set(exp.narrative_id, {
        weight: (existing?.weight || 0) + holding.current_weight,
        direction: (narrative?.direction as "bullish" | "bearish" | "neutral") || "neutral",
      })
    }
  }
  return map
}

function getTopNarrativeExposures(
  holdings: PortfolioHolding[],
  narratives: Array<{ id: string; name: string; confidence_score: number; direction: string }>,
) {
  const map = getNarrativeExposureMap(holdings, narratives)
  return Array.from(map.entries())
    .map(([id, data]) => ({
      id,
      title: narratives.find((n) => n.id === id)?.name || "Unknown",
      confidence: narratives.find((n) => n.id === id)?.confidence_score || 0,
      ...data,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
}

function getTopSector(holdings: PortfolioHolding[]) {
  const sectorCounts = new Map<string, number>()
  for (const h of holdings) {
    if (h.asset?.asset_class) {
      const current = sectorCounts.get(h.asset.asset_class) || 0
      sectorCounts.set(h.asset.asset_class, current + h.current_weight)
    }
  }
  return Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
}

function DatabasePortfolioView({
  holdings,
  narratives,
  metrics,
  fragilityStatus,
  concentrationStatus,
  topNarrativeExposures,
  narrativeExposureMap,
  topSector,
}: {
  holdings: PortfolioHolding[]
  narratives: Array<{ id: string; name: string; confidence_score: number; direction: string }>
  metrics: { fragility: number; concentration: number; totalValue: number; holdingsCount: number }
  fragilityStatus: { label: string; color: string; bg: string }
  concentrationStatus: { label: string; color: string }
  topNarrativeExposures: Array<{
    id: string
    title: string
    confidence: number
    weight: number
    direction: "bullish" | "bearish" | "neutral"
  }>
  narrativeExposureMap: Map<string, { weight: number; direction: "bullish" | "bearish" | "neutral" }>
  topSector: string
}) {
  if (holdings.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <PieChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">No portfolio data found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Upload a CSV file with your portfolio holdings to see narrative exposure analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.holdingsCount} positions</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fragility Score</CardTitle>
            <Shield className={`h-4 w-4 ${fragilityStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fragilityStatus.color}`}>{Math.round(metrics.fragility * 100)}%</div>
            <Badge variant="secondary" className={cn("mt-1 text-xs", fragilityStatus.bg, fragilityStatus.color)}>
              {fragilityStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Narrative Concentration</CardTitle>
            <PieChart className={`h-4 w-4 ${concentrationStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-foreground`}>{narrativeExposureMap.size}</div>
            <p className="text-xs text-muted-foreground mt-1">Active narratives</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Sector</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{topSector}</div>
            <p className="text-xs text-muted-foreground mt-1">Highest allocation</p>
          </CardContent>
        </Card>
      </div>

      {/* Narrative exposure breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Narrative Exposures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topNarrativeExposures.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No narrative exposures found</p>
              <p className="text-xs text-muted-foreground">
                Run the database scripts to populate assets and their narrative mappings
              </p>
            </div>
          ) : (
            topNarrativeExposures.map((exposure) => (
              <div key={exposure.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {exposure.direction === "bullish" ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : exposure.direction === "bearish" ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-chart-3" />
                    )}
                    <span className="text-sm font-medium text-foreground">{exposure.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {Math.round(exposure.confidence * 100)}%
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {Math.round(exposure.weight * 100)}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={Math.min(100, exposure.weight * 100)}
                  className={cn(
                    "h-2",
                    exposure.direction === "bullish"
                      ? "[&>div]:bg-primary"
                      : exposure.direction === "bearish"
                        ? "[&>div]:bg-destructive"
                        : "[&>div]:bg-chart-3",
                  )}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Holdings table */}
      {holdings.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Weight</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Sector</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Narrative Exposures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {holdings
                    .filter((h) => h.asset)
                    .map((holding) => (
                      <tr key={holding.id} className="group hover:bg-secondary/30">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-foreground">{holding.asset?.symbol || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{holding.asset?.name || "Unknown"}</p>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-mono text-sm text-foreground">
                            {Math.round(holding.current_weight * 100)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="text-xs">
                            {holding.asset?.asset_class || "Unknown"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {holding.narrative_exposures.slice(0, 2).map((exp) => (
                              <Badge
                                key={exp.narrative_id}
                                variant="outline"
                                className="text-xs border-primary/50 text-primary"
                              >
                                {exp.narrative_title.slice(0, 15)}
                                {exp.narrative_title.length > 15 ? "..." : ""}
                              </Badge>
                            ))}
                            {holding.narrative_exposures.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{holding.narrative_exposures.length - 2}
                              </Badge>
                            )}
                            {holding.narrative_exposures.length === 0 && (
                              <span className="text-xs text-muted-foreground">No exposures</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UploadedPortfolioView({ holdings }: { holdings: UploadedHolding[] }) {
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.price, 0)

  const narrativeExposureMap = new Map<
    string,
    { weight: number; direction: "bullish" | "bearish" | "neutral"; confidence: number }
  >()
  for (const holding of holdings) {
    for (const exp of holding.narrativeExposures) {
      const existing = narrativeExposureMap.get(exp.narrative)
      narrativeExposureMap.set(exp.narrative, {
        weight: (existing?.weight || 0) + holding.weight * exp.exposure,
        direction: exp.direction,
        confidence: Math.max(existing?.confidence || 0, exp.exposure),
      })
    }
  }

  const topNarrativeExposures = Array.from(narrativeExposureMap.entries())
    .map(([name, data]) => ({
      name,
      ...data,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)

  const sectorCounts = new Map<string, number>()
  for (const h of holdings) {
    const current = sectorCounts.get(h.sector) || 0
    sectorCounts.set(h.sector, current + h.weight)
  }
  const topSector = Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

  // Calculate fragility based on narrative confidence
  const fragility = holdings.reduce((sum, h) => {
    const avgExposure =
      h.narrativeExposures.length > 0
        ? h.narrativeExposures.reduce((s, e) => s + e.exposure, 0) / h.narrativeExposures.length
        : 0.5
    return sum + h.weight * (1 - avgExposure)
  }, 0)

  const fragilityStatus =
    fragility < 0.3
      ? { label: "Robust", color: "text-primary", bg: "bg-primary/20" }
      : fragility < 0.6
        ? { label: "Moderate", color: "text-accent", bg: "bg-accent/20" }
        : { label: "Fragile", color: "text-destructive", bg: "bg-destructive/20" }

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{holdings.length} positions</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fragility Score</CardTitle>
            <Shield className={`h-4 w-4 ${fragilityStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fragilityStatus.color}`}>{Math.round(fragility * 100)}%</div>
            <Badge variant="secondary" className={cn("mt-1 text-xs", fragilityStatus.bg, fragilityStatus.color)}>
              {fragilityStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Narrative Exposure</CardTitle>
            <PieChart className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{narrativeExposureMap.size}</div>
            <p className="text-xs text-muted-foreground mt-1">Active narratives</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Sector</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{topSector}</div>
            <p className="text-xs text-muted-foreground mt-1">Highest allocation</p>
          </CardContent>
        </Card>
      </div>

      {/* Narrative exposure breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Narrative Exposures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topNarrativeExposures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No narrative exposures detected</p>
          ) : (
            topNarrativeExposures.map((exposure) => (
              <div key={exposure.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {exposure.direction === "bullish" ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : exposure.direction === "bearish" ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-chart-3" />
                    )}
                    <span className="text-sm font-medium text-foreground">{exposure.name}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {Math.round(exposure.weight * 100)}%
                  </Badge>
                </div>
                <Progress
                  value={Math.min(100, exposure.weight * 100)}
                  className={cn(
                    "h-2",
                    exposure.direction === "bullish"
                      ? "[&>div]:bg-primary"
                      : exposure.direction === "bearish"
                        ? "[&>div]:bg-destructive"
                        : "[&>div]:bg-chart-3",
                  )}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Holdings table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Uploaded Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Shares</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Price</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Weight</th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Sector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((holding, i) => (
                  <tr key={i} className="group hover:bg-secondary/30">
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-foreground">{holding.symbol}</p>
                        <p className="text-xs text-muted-foreground">{holding.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono text-sm text-foreground">{holding.quantity.toLocaleString()}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono text-sm text-foreground">${holding.price.toFixed(2)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono text-sm text-foreground">{(holding.weight * 100).toFixed(1)}%</span>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs">
                        {holding.sector}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
