"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { NarrativeWithDetails } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react"
import { EvidenceList } from "./evidence-list"

interface NarrativeCardProps {
  narrative: NarrativeWithDetails
  onGenerateSynthesis?: (narrativeId: string) => void
  isGeneratingSynthesis?: boolean
}

export function NarrativeCard({ narrative, onGenerateSynthesis, isGeneratingSynthesis }: NarrativeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    flat: Minus,
  }
  const TrendIcon = trendIcons[narrative.confidence_trend] || Minus

  const trendColors = {
    up: "text-primary",
    down: "text-destructive",
    flat: "text-chart-3",
  }
  const trendColor = trendColors[narrative.confidence_trend] || "text-chart-3"

  const confidenceColor =
    narrative.confidence_score >= 0.7
      ? "bg-primary/20 text-primary"
      : narrative.confidence_score >= 0.4
        ? "bg-accent/20 text-accent"
        : "bg-destructive/20 text-destructive"

  // Calculate time decay factor (fresher = higher)
  const daysSinceUpdate = Math.floor((Date.now() - new Date(narrative.updated_at).getTime()) / (1000 * 60 * 60 * 24))
  const decayFactor = Math.max(0, 1 - daysSinceUpdate * 0.05)

  const decayStatus =
    decayFactor >= 0.8
      ? { label: "Fresh", color: "text-primary", Icon: CheckCircle }
      : decayFactor >= 0.5
        ? { label: "Aging", color: "text-accent", Icon: Clock }
        : { label: "Stale", color: "text-destructive", Icon: AlertTriangle }

  const DecayIcon = decayStatus.Icon

  const evidenceCounts = narrative.evidence.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-border bg-card transition-all hover:border-muted-foreground/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <TrendIcon className={cn("h-5 w-5", trendColor)} />
                <h3 className="font-semibold leading-tight text-card-foreground">{narrative.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{narrative.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className={cn("font-mono", confidenceColor)}>
                {Math.round(narrative.confidence_score * 100)}%
              </Badge>
              <div className={cn("flex items-center gap-1 text-xs", decayStatus.color)}>
                <DecayIcon className="h-3 w-3" />
                <span>{decayStatus.label}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Confidence bar - simplified without decay visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Conviction</span>
              <span>
                {formatDistanceToNow(new Date(narrative.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <Progress value={narrative.confidence_score * 100} className="h-2" />
          </div>

          {/* Evidence summary - use type field from database */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{narrative.evidence.length} pieces of evidence</span>
            </div>
            {evidenceCounts.supporting > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <CheckCircle className="h-3 w-3" />
                <span>{evidenceCounts.supporting} supporting</span>
              </div>
            )}
            {evidenceCounts.contradicting > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" />
                <span>{evidenceCounts.contradicting} contradicting</span>
              </div>
            )}
          </div>

          {/* Assumptions preview - use text and fragility_score from database */}
          {narrative.assumptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {narrative.assumptions.slice(0, 3).map((assumption) => (
                <Badge
                  key={assumption.id}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    assumption.fragility_score < 0.3
                      ? "border-primary/50 text-primary"
                      : assumption.fragility_score > 0.7
                        ? "border-destructive/50 text-destructive"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {assumption.text.slice(0, 30)}...
                </Badge>
              ))}
              {narrative.assumptions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{narrative.assumptions.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Expand/Collapse trigger */}
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <span>{isExpanded ? "Hide details" : "Show details"}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>

          {/* Expanded content */}
          <CollapsibleContent className="space-y-4">
            {/* AI Synthesis button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-2"
              onClick={() => onGenerateSynthesis?.(narrative.id)}
              disabled={isGeneratingSynthesis}
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingSynthesis ? "Generating synthesis..." : "Generate AI synthesis"}
            </Button>

            {/* Full assumptions list - use text and fragility_score */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Key Assumptions</h4>
              <div className="space-y-2">
                {narrative.assumptions.map((assumption) => (
                  <div
                    key={assumption.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    {assumption.fragility_score < 0.3 ? (
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : assumption.fragility_score > 0.7 ? (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{assumption.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fragility: {Math.round(assumption.fragility_score * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence list */}
            <EvidenceList evidence={narrative.evidence} />
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}
