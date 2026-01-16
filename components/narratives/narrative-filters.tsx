"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Search, TrendingUp, TrendingDown, Minus, Layers } from "lucide-react"

interface NarrativeFiltersProps {
  filters: {
    trend: "all" | "up" | "down" | "flat"
    minConfidence: number
    search: string
  }
  onFiltersChange: (filters: NarrativeFiltersProps["filters"]) => void
}

export function NarrativeFilters({ filters, onFiltersChange }: NarrativeFiltersProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search narratives..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 bg-secondary border-border"
          />
        </div>

        <ToggleGroup
          type="single"
          value={filters.trend}
          onValueChange={(value) => value && onFiltersChange({ ...filters, trend: value as typeof filters.trend })}
          className="bg-secondary rounded-lg p-1"
        >
          <ToggleGroupItem value="all" className="gap-1 data-[state=on]:bg-card">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="up" className="gap-1 data-[state=on]:bg-card data-[state=on]:text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Up</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="down" className="gap-1 data-[state=on]:bg-card data-[state=on]:text-destructive">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Down</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="flat" className="gap-1 data-[state=on]:bg-card data-[state=on]:text-chart-3">
            <Minus className="h-4 w-4" />
            <span className="hidden sm:inline">Flat</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Confidence slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Min Confidence</Label>
          <span className="text-sm font-mono text-foreground">{filters.minConfidence}%</span>
        </div>
        <Slider
          value={[filters.minConfidence]}
          onValueChange={([value]) => onFiltersChange({ ...filters, minConfidence: value })}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  )
}
