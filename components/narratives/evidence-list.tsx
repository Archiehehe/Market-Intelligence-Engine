"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Evidence } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle, XCircle, ExternalLink, FileText, Calendar, Scale } from "lucide-react"

interface EvidenceListProps {
  evidence: Evidence[]
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)

  if (evidence.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No evidence collected yet
      </div>
    )
  }

  const typeConfig = {
    supporting: {
      icon: CheckCircle,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
      label: "Supporting",
    },
    contradicting: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      label: "Contradicting",
    },
  }

  const seenDescriptions = new Set<string>()
  const uniqueEvidence = evidence.filter((item) => {
    const normalizedDesc = item.description?.toLowerCase().trim()
    if (seenDescriptions.has(normalizedDesc)) {
      return false
    }
    seenDescriptions.add(normalizedDesc)
    return true
  })

  // Helper to detect if source looks like a URL
  const getSourceUrl = (item: Evidence): string | null => {
    if (item.source_url) return item.source_url
    if (item.source.startsWith("http://") || item.source.startsWith("https://")) {
      return item.source
    }
    const sourceUrlMap: Record<string, string> = {
      Bloomberg: "https://bloomberg.com",
      Reuters: "https://reuters.com",
      WSJ: "https://wsj.com",
      "Wall Street Journal": "https://wsj.com",
      "Financial Times": "https://ft.com",
      FT: "https://ft.com",
      CNBC: "https://cnbc.com",
      "Yahoo Finance": "https://finance.yahoo.com",
      MarketWatch: "https://marketwatch.com",
      "Seeking Alpha": "https://seekingalpha.com",
      "SEC Filing": "https://sec.gov/cgi-bin/browse-edgar",
      "Company Earnings Call": null,
      "Analyst Report": null,
    }
    return sourceUrlMap[item.source] || null
  }

  const supportingEvidence = uniqueEvidence.filter((e) => e.type === "supporting")
  const contradictingEvidence = uniqueEvidence.filter((e) => e.type === "contradicting")

  return (
    <>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Evidence Trail</h4>

        {supportingEvidence.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-primary" />
              <span>SUPPORTING ({supportingEvidence.length})</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {supportingEvidence.map((item) => {
                const config = typeConfig.supporting
                const Icon = config.icon
                const sourceUrl = getSourceUrl(item)

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEvidence(item)}
                    className={cn(
                      "w-full rounded-lg border p-3 transition-all text-left",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-2 hover:ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      config.border,
                      config.bg,
                      "cursor-pointer",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {item.description.split(" - ")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description.split(" - ")[1] || item.description}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs", sourceUrl && "gap-1")}>
                              {item.source}
                              {sourceUrl && <ExternalLink className="h-2.5 w-2.5" />}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                              {Math.round(item.weight * 100)}% weight
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {contradictingEvidence.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3 text-destructive" />
              <span>CONTRADICTING ({contradictingEvidence.length})</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {contradictingEvidence.map((item) => {
                const config = typeConfig.contradicting
                const Icon = config.icon
                const sourceUrl = getSourceUrl(item)

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEvidence(item)}
                    className={cn(
                      "w-full rounded-lg border p-3 transition-all text-left",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-2 hover:ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      config.border,
                      config.bg,
                      "cursor-pointer",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {item.description.split(" - ")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description.split(" - ")[1] || item.description}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs", sourceUrl && "gap-1")}>
                              {item.source}
                              {sourceUrl && <ExternalLink className="h-2.5 w-2.5" />}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                              {Math.round(item.weight * 100)}% weight
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Show message if no evidence of either type */}
        {supportingEvidence.length === 0 && contradictingEvidence.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No categorized evidence available</p>
        )}
      </div>

      {/* Evidence Detail Modal */}
      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-lg">
          {selectedEvidence && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {selectedEvidence.type === "supporting" ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <DialogTitle>{typeConfig[selectedEvidence.type]?.label || "Evidence"} Evidence</DialogTitle>
                </div>
                <DialogDescription>Review the full details of this evidence piece</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Full Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {selectedEvidence.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Timestamp
                    </h4>
                    <p className="text-sm text-foreground">
                      {new Date(selectedEvidence.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      Evidence Weight
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            selectedEvidence.type === "supporting" ? "bg-primary" : "bg-destructive",
                          )}
                          style={{ width: `${selectedEvidence.weight * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-foreground">
                        {Math.round(selectedEvidence.weight * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Source with Link */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Source</h4>
                  {getSourceUrl(selectedEvidence) ? (
                    <Button variant="outline" className="w-full justify-between bg-transparent" asChild>
                      <a href={getSourceUrl(selectedEvidence)!} target="_blank" rel="noopener noreferrer">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedEvidence.source}
                        </span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-sm">
                      {selectedEvidence.source}
                    </Badge>
                  )}
                </div>

                {/* Impact Explanation */}
                <div
                  className={cn(
                    "p-3 rounded-lg border",
                    selectedEvidence.type === "supporting"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-destructive/5 border-destructive/20",
                  )}
                >
                  <h4 className="text-sm font-medium text-foreground mb-1">Impact on Narrative</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedEvidence.type === "supporting"
                      ? `This evidence strengthens the narrative thesis with a weight of ${Math.round(selectedEvidence.weight * 100)}%. Higher weighted evidence has a stronger influence on overall confidence scores.`
                      : `This evidence challenges the narrative thesis with a weight of ${Math.round(selectedEvidence.weight * 100)}%. Contradicting evidence reduces confidence and signals potential thesis invalidation.`}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
