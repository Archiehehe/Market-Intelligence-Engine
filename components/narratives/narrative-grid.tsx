"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  X,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Narrative {
  id: string
  name: string
  summary: string
  confidence_score: number
  confidence_trend: "up" | "down" | "flat"
  direction: "bullish" | "bearish" | "neutral"
  updated_at: string
  tags: string[]
  assumptions: Array<{
    id: string
    text: string
    fragility_score: number
  }>
  evidence: Array<{
    id: string
    description: string
    type: "supporting" | "contradicting" | "neutral"
    source: string
    weight: number
    timestamp: string
  }>
  relatedNarratives?: {
    reinforces: Array<{ id: string; name: string }>
    contradicts: Array<{ id: string; name: string }>
  }
  affectedAssets?: Array<{
    symbol: string
    name: string
    impact: number
  }>
}

const fetcher = async (): Promise<Narrative[]> => {
  const supabase = createClient()

  const { data: narratives, error: narrativesError } = await supabase
    .from("narratives")
    .select("*")
    .order("confidence_score", { ascending: false })

  if (narrativesError) throw narrativesError

  const seenNames = new Set<string>()
  const uniqueNarratives = (narratives || []).filter((n) => {
    const normalizedName = n.name?.toLowerCase().trim()
    if (seenNames.has(normalizedName)) {
      return false
    }
    seenNames.add(normalizedName)
    return true
  })

  const { data: edges } = await supabase.from("belief_edges").select("*")

  const { data: assetExposures } = await supabase.from("narrative_asset_exposure").select(`
    narrative_id,
    asset_id,
    exposure_weight,
    assets (
      id,
      ticker,
      name
    )
  `)

  const enrichedNarratives = await Promise.all(
    uniqueNarratives.map(async (narrative) => {
      const [assumptionsRes, evidenceRes] = await Promise.all([
        supabase.from("assumptions").select("*").eq("narrative_id", narrative.id),
        supabase.from("evidence").select("*").eq("narrative_id", narrative.id).order("timestamp", { ascending: false }),
      ])

      const relatedEdges = (edges || []).filter(
        (e) => e.from_narrative_id === narrative.id || e.to_narrative_id === narrative.id,
      )

      const reinforces = relatedEdges
        .filter((e) => e.relationship === "reinforces")
        .map((e) => {
          const otherId = e.from_narrative_id === narrative.id ? e.to_narrative_id : e.from_narrative_id
          const otherNarrative = uniqueNarratives.find((n) => n.id === otherId)
          return otherNarrative ? { id: otherNarrative.id, name: otherNarrative.name } : null
        })
        .filter((item): item is { id: string; name: string } => item !== null)

      const contradicts = relatedEdges
        .filter((e) => e.relationship === "conflicts")
        .map((e) => {
          const otherId = e.from_narrative_id === narrative.id ? e.to_narrative_id : e.from_narrative_id
          const otherNarrative = uniqueNarratives.find((n) => n.id === otherId)
          return otherNarrative ? { id: otherNarrative.id, name: otherNarrative.name } : null
        })
        .filter((item): item is { id: string; name: string } => item !== null)

      const narrativeAssets = (assetExposures || [])
        .filter((ae) => ae.narrative_id === narrative.id)
        .map((ae) => {
          const asset = ae.assets as { id: string; ticker: string; name: string } | null
          if (!asset) return null
          return {
            symbol: asset.ticker,
            name: asset.name,
            impact: (ae.exposure_weight || 0.5) * 100 * (narrative.direction === "bearish" ? -1 : 1),
          }
        })
        .filter((item): item is { symbol: string; name: string; impact: number } => item !== null)

      return {
        ...narrative,
        tags: narrative.tags || ["Macro"],
        assumptions: assumptionsRes.data || [],
        evidence: evidenceRes.data || [],
        relatedNarratives: {
          reinforces,
          contradicts,
        },
        affectedAssets: narrativeAssets,
      }
    }),
  )

  return enrichedNarratives
}

export function NarrativeGrid() {
  const { data: narratives, error, isLoading } = useSWR("narratives-grid", fetcher)
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("confidence")
  const [filterTag, setFilterTag] = useState("all")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const supportingCount = (evidence: Narrative["evidence"]) => {
    if (!evidence || !Array.isArray(evidence)) return 0
    return evidence.filter((e) => e && e.type === "supporting").length
  }

  const contradictingCount = (evidence: Narrative["evidence"]) => {
    if (!evidence || !Array.isArray(evidence)) return 0
    return evidence.filter((e) => e && e.type === "contradicting").length
  }

  const { filteredNarratives, allTags } = useMemo(() => {
    const tags = Array.from(new Set((narratives || []).flatMap((n) => n.tags || [])))

    const filtered = (narratives || [])
      .filter((n) => {
        const matchesSearch =
          n.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTag = filterTag === "all" || n.tags?.includes(filterTag)
        return matchesSearch && matchesTag
      })
      .sort((a, b) => {
        if (sortBy === "confidence") return b.confidence_score - a.confidence_score
        if (sortBy === "recent") return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        return 0
      })

    return { filteredNarratives: filtered, allTags: tags }
  }, [narratives, searchQuery, sortBy, filterTag])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Failed to load narratives. Please try again.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const toggleExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search narratives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-32 bg-secondary/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 bg-secondary/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Narrative cards grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNarratives.map((narrative) => {
            const isExpanded = expandedCards.has(narrative.id)
            const isSelected = selectedNarrative?.id === narrative.id
            const trendColor =
              narrative.confidence_trend === "up"
                ? "text-primary"
                : narrative.confidence_trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"

            return (
              <Card
                key={narrative.id}
                className={cn(
                  "bg-card border-border transition-all cursor-pointer hover:border-primary/50",
                  isSelected && "border-primary ring-2 ring-primary/30",
                )}
                onClick={() => setSelectedNarrative(narrative)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{narrative.name}</h3>
                      {narrative.confidence_trend === "up" ? (
                        <TrendingUp className={cn("h-4 w-4 shrink-0", trendColor)} />
                      ) : narrative.confidence_trend === "down" ? (
                        <TrendingDown className={cn("h-4 w-4 shrink-0", trendColor)} />
                      ) : (
                        <Minus className={cn("h-4 w-4 shrink-0", trendColor)} />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(narrative.updated_at || Date.now()), { addSuffix: false })}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Confidence score */}
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        narrative.confidence_score >= 0.7
                          ? "text-primary"
                          : narrative.confidence_score >= 0.5
                            ? "text-accent"
                            : "text-destructive",
                      )}
                    >
                      {Math.round(narrative.confidence_score * 100)}
                    </span>
                    <span className="text-sm text-muted-foreground">confidence</span>
                  </div>

                  {/* Confidence bar */}
                  <Progress
                    value={narrative.confidence_score * 100}
                    className={cn(
                      "h-1.5",
                      narrative.confidence_score >= 0.7
                        ? "[&>div]:bg-primary"
                        : narrative.confidence_score >= 0.5
                          ? "[&>div]:bg-accent"
                          : "[&>div]:bg-destructive",
                    )}
                  />

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{narrative.summary}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {(narrative.tags || []).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-secondary/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Supporting/Contradicting counts */}
                  <div className="flex items-center gap-4 pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-primary">{supportingCount(narrative.evidence)}</span>
                      <span className="text-xs text-muted-foreground">supporting</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        {contradictingCount(narrative.evidence)}
                      </span>
                      <span className="text-xs text-muted-foreground">contradicting</span>
                    </div>
                  </div>

                  {/* Expand/Collapse for assumptions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(narrative.id)
                    }}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show more
                      </>
                    )}
                  </Button>

                  {/* Expanded assumptions */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Key Assumptions
                      </h4>
                      <div className="space-y-2">
                        {narrative.assumptions && narrative.assumptions.length > 0 ? (
                          narrative.assumptions.slice(0, 3).map((assumption) => (
                            <div key={assumption.id} className="flex items-start justify-between gap-2">
                              <p className="text-sm text-foreground leading-snug flex-1">{assumption.text}</p>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs shrink-0",
                                  assumption.fragility_score > 0.5
                                    ? "bg-destructive/20 text-destructive"
                                    : assumption.fragility_score > 0.35
                                      ? "bg-accent/20 text-accent"
                                      : "bg-primary/20 text-primary",
                                )}
                              >
                                {Math.round(assumption.fragility_score * 100)}% fragile
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No assumptions defined yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNarrative && (
        <div className="w-96 shrink-0">
          <Card className="bg-card border-border sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Narrative Detail</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedNarrative(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <CardContent className="space-y-6">
                {/* Title and trend */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{selectedNarrative.name}</h2>
                    {selectedNarrative.confidence_trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : selectedNarrative.confidence_trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className={cn(
                        "text-4xl font-bold",
                        selectedNarrative.confidence_score >= 0.7
                          ? "text-primary"
                          : selectedNarrative.confidence_score >= 0.5
                            ? "text-accent"
                            : "text-destructive",
                      )}
                    >
                      {Math.round(selectedNarrative.confidence_score * 100)}
                    </span>
                    <span className="text-muted-foreground">confidence score</span>
                  </div>
                  <Progress
                    value={selectedNarrative.confidence_score * 100}
                    className={cn(
                      "h-2 mt-2",
                      selectedNarrative.confidence_score >= 0.7
                        ? "[&>div]:bg-primary"
                        : selectedNarrative.confidence_score >= 0.5
                          ? "[&>div]:bg-accent"
                          : "[&>div]:bg-destructive",
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {(selectedNarrative.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Summary</h4>
                  <p className="text-sm text-foreground leading-relaxed">{selectedNarrative.summary}</p>
                </div>

                {/* Key Assumptions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Key Assumptions ({selectedNarrative.assumptions?.length || 0})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {selectedNarrative.assumptions && selectedNarrative.assumptions.length > 0 ? (
                      selectedNarrative.assumptions.map((assumption) => (
                        <div key={assumption.id} className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground leading-snug">{assumption.text}</p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs shrink-0",
                                assumption.fragility_score > 0.5
                                  ? "bg-destructive/20 text-destructive"
                                  : assumption.fragility_score > 0.35
                                    ? "bg-accent/20 text-accent"
                                    : "bg-primary/20 text-primary",
                              )}
                            >
                              {Math.round(assumption.fragility_score * 100)}% fragile
                            </Badge>
                          </div>
                          <Progress
                            value={assumption.fragility_score * 100}
                            className={cn(
                              "h-1",
                              assumption.fragility_score > 0.5
                                ? "[&>div]:bg-destructive"
                                : assumption.fragility_score > 0.35
                                  ? "[&>div]:bg-accent"
                                  : "[&>div]:bg-primary",
                            )}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No assumptions defined</p>
                    )}
                  </div>
                </div>

                {/* Supporting Evidence */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Supporting ({supportingCount(selectedNarrative.evidence)})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedNarrative.evidence?.filter((e) => e.type === "supporting").length > 0 ? (
                      selectedNarrative.evidence
                        .filter((e) => e.type === "supporting")
                        .map((ev) => (
                          <div key={ev.id} className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-medium text-foreground">{ev.source}</h5>
                              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                                {Math.round(ev.weight * 100)}% weight
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No supporting evidence yet</p>
                    )}
                  </div>
                </div>

                {/* Contradicting Evidence */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contradicting ({contradictingCount(selectedNarrative.evidence)})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedNarrative.evidence?.filter((e) => e.type === "contradicting").length > 0 ? (
                      selectedNarrative.evidence
                        .filter((e) => e.type === "contradicting")
                        .map((ev) => (
                          <div key={ev.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-medium text-foreground">{ev.source}</h5>
                              <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                                {Math.round(ev.weight * 100)}% weight
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No contradicting evidence yet</p>
                    )}
                  </div>
                </div>

                {/* Related Narratives */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Related Narratives
                    </h4>
                  </div>
                  {selectedNarrative.relatedNarratives?.reinforces &&
                  selectedNarrative.relatedNarratives.reinforces.length > 0 ? (
                    <div className="mb-3">
                      <p className="text-xs text-primary mb-2">Reinforces:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedNarrative.relatedNarratives.reinforces.map((rel) => (
                          <Badge key={rel.id} variant="outline" className="text-xs border-primary/50 text-primary">
                            {rel.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedNarrative.relatedNarratives?.contradicts &&
                  selectedNarrative.relatedNarratives.contradicts.length > 0 ? (
                    <div>
                      <p className="text-xs text-destructive mb-2">Conflicts with:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedNarrative.relatedNarratives.contradicts.map((rel) => (
                          <Badge
                            key={rel.id}
                            variant="outline"
                            className="text-xs border-destructive/50 text-destructive"
                          >
                            {rel.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {(!selectedNarrative.relatedNarratives?.reinforces ||
                    selectedNarrative.relatedNarratives.reinforces.length === 0) &&
                    (!selectedNarrative.relatedNarratives?.contradicts ||
                      selectedNarrative.relatedNarratives.contradicts.length === 0) && (
                      <p className="text-sm text-muted-foreground">No related narratives found</p>
                    )}
                </div>

                {/* Affected Assets */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Affected Assets ({selectedNarrative.affectedAssets?.length || 0})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedNarrative.affectedAssets && selectedNarrative.affectedAssets.length > 0 ? (
                      selectedNarrative.affectedAssets.map((asset) => (
                        <div
                          key={asset.symbol}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{asset.symbol}</p>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              asset.impact > 0
                                ? "bg-primary/20 text-primary"
                                : asset.impact < 0
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {asset.impact > 0 ? "+" : ""}
                            {Math.round(asset.impact)}%
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No affected assets mapped</p>
                    )}
                  </div>
                </div>

                {/* Last updated */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatDistanceToNow(new Date(selectedNarrative.updated_at || Date.now()))} ago
                  </p>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  )
}
