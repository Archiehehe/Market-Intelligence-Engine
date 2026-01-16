// Core Domain Types for Narrative-Centric Market Intelligence
// Aligned with database schema

export interface Narrative {
  id: string
  name: string
  summary: string
  confidence_score: number
  confidence_trend: "up" | "down" | "flat"
  decay_half_life_days: number
  last_reinforced_at: string
  created_at: string
  updated_at: string
}

export interface Assumption {
  id: string
  narrative_id: string
  text: string
  fragility_score: number
  created_at: string
}

export interface Evidence {
  id: string
  narrative_id: string
  type: "supporting" | "contradicting"
  source: string
  source_url?: string
  description: string
  weight: number
  timestamp: string
  created_at: string
}

export interface NarrativeWithDetails extends Narrative {
  assumptions: Assumption[]
  evidence: Evidence[]
}

export interface BeliefEdge {
  id: string
  from_narrative_id: string
  to_narrative_id: string
  relationship: "reinforces" | "conflicts" | "depends_on"
  strength: number
  created_at: string
}

export interface Asset {
  id: string
  ticker: string
  name: string
  sector: string | null
  created_at: string
}

export interface NarrativeAssetExposure {
  id: string
  narrative_id: string
  asset_id: string
  exposure_weight: number
  created_at: string
  asset?: Asset
}

export interface Portfolio {
  id: string
  name: string
  created_at: string
  updated_at: string
  holdings?: PortfolioHolding[]
}

export interface PortfolioHolding {
  id: string
  portfolio_id: string
  asset_id: string
  weight: number
  created_at: string
  asset?: Asset
}

export interface NarrativeEvent {
  id: string
  narrative_id: string
  event_type:
    | "created"
    | "evidence_added"
    | "contradiction_added"
    | "reinforced"
    | "decayed"
    | "linked"
    | "summary_updated"
  payload: Record<string, unknown>
  created_at: string
}

export interface NarrativeHistory {
  id: string
  narrative_id: string
  confidence_score: number
  summary_snapshot: string
  recorded_at: string
}

export interface PortfolioSnapshot {
  id: string
  portfolio_id: string
  narrative_exposures: NarrativeExposure[]
  total_fragility: number
  recorded_at: string
}

// Computed Types (for portfolio intelligence)
export interface NarrativeExposure {
  narrative_id: string
  narrative_name: string
  portfolio_exposure: number
  confidence_adjusted_exposure: number
  narrative_confidence: number
}

export interface FragilityAnalysis {
  total_fragility: number
  fragility_by_narrative: {
    narrative_id: string
    narrative_name: string
    fragility_contribution: number
    assumption_count: number
    avg_assumption_fragility: number
  }[]
  single_point_of_failure: string | null
}

export interface DriftAnalysis {
  delta_risk: number
  drift_drivers: {
    narrative_id: string
    narrative_name: string
    confidence_change: number
    exposure_impact: number
  }[]
}

// UI State Types
export interface NarrativeWithRelations extends Narrative {
  assumptions: Assumption[]
  evidence: Evidence[]
  related_narratives: {
    reinforces: BeliefEdge[]
    conflicts: BeliefEdge[]
    depends_on: BeliefEdge[]
  }
  affected_assets: (NarrativeAssetExposure & { asset: Asset })[]
}

export interface BeliefGraphNode {
  id: string
  name: string
  confidence: number
  trend: "up" | "down" | "flat"
}

export interface BeliefGraphEdge {
  source: string
  target: string
  type: "reinforces" | "conflicts" | "depends_on"
  strength: number
}

export interface BeliefGraph {
  nodes: BeliefGraphNode[]
  edges: BeliefGraphEdge[]
}
