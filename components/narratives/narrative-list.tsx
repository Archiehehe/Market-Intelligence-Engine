"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { NarrativeWithDetails } from "@/lib/types"
import { NarrativeCard } from "./narrative-card"
import { NarrativeFilters } from "./narrative-filters"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = async (): Promise<NarrativeWithDetails[]> => {
  const supabase = createClient()

  const { data: narratives, error: narrativesError } = await supabase
    .from("narratives")
    .select("*")
    .order("updated_at", { ascending: false })

  if (narrativesError) throw narrativesError

  // Fetch related data for each narrative
  const enrichedNarratives = await Promise.all(
    (narratives || []).map(async (narrative) => {
      const [assumptionsRes, evidenceRes] = await Promise.all([
        supabase.from("assumptions").select("*").eq("narrative_id", narrative.id),
        supabase.from("evidence").select("*").eq("narrative_id", narrative.id).order("timestamp", { ascending: false }),
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

export function NarrativeList() {
  const { data: narratives, error, isLoading } = useSWR("narratives", fetcher)
  const [filters, setFilters] = useState({
    trend: "all" as "all" | "up" | "down" | "flat",
    minConfidence: 0,
    search: "",
  })
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const handleGenerateSynthesis = async (narrativeId: string) => {
    setGeneratingId(narrativeId)
    // This will be implemented with the AI layer
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setGeneratingId(null)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Failed to load narratives. Please try again.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const filteredNarratives = (narratives || []).filter((narrative) => {
    if (filters.trend !== "all" && narrative.confidence_trend !== filters.trend) {
      return false
    }
    if (narrative.confidence_score < filters.minConfidence / 100) {
      return false
    }
    if (
      filters.search &&
      !narrative.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !narrative.summary?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <NarrativeFilters filters={filters} onFiltersChange={setFilters} />

      {filteredNarratives.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">No narratives match your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNarratives.map((narrative) => (
            <NarrativeCard
              key={narrative.id}
              narrative={narrative}
              onGenerateSynthesis={handleGenerateSynthesis}
              isGeneratingSynthesis={generatingId === narrative.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
