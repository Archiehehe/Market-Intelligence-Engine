import type {
  PortfolioHolding,
  Narrative,
  NarrativeAssetExposure,
  NarrativeExposure,
  FragilityAnalysis,
  Assumption,
} from "@/lib/types"

/**
 * X - Narrative Exposure Mapping
 * Turn portfolio holdings into narrative exposure
 */
export function computeNarrativeExposure(
  holdings: (PortfolioHolding & { asset_id: string })[],
  narratives: (Narrative & {
    affected_assets: NarrativeAssetExposure[]
  })[],
): NarrativeExposure[] {
  const exposures: Map<string, NarrativeExposure> = new Map()

  for (const narrative of narratives) {
    let totalExposure = 0

    for (const holding of holdings) {
      const assetExposure = narrative.affected_assets?.find((ae) => ae.asset_id === holding.asset_id)
      if (assetExposure) {
        // holding_weight × narrative_exposure_weight
        totalExposure += holding.weight * assetExposure.exposure_weight
      }
    }

    if (totalExposure > 0) {
      exposures.set(narrative.id, {
        narrative_id: narrative.id,
        narrative_name: narrative.name,
        portfolio_exposure: totalExposure,
        confidence_adjusted_exposure: totalExposure * narrative.confidence_score,
        narrative_confidence: narrative.confidence_score,
      })
    }
  }

  return Array.from(exposures.values()).sort((a, b) => b.portfolio_exposure - a.portfolio_exposure)
}

/**
 * Y - Belief Concentration & Fragility
 * Detect hidden concentration and fragile beliefs
 */
export function computeFragility(
  exposures: NarrativeExposure[],
  narratives: (Narrative & { assumptions: Assumption[] })[],
): FragilityAnalysis {
  const fragilityByNarrative = exposures.map((exp) => {
    const narrative = narratives.find((n) => n.id === exp.narrative_id)
    const assumptions = narrative?.assumptions || []
    const avgFragility =
      assumptions.length > 0 ? assumptions.reduce((sum, a) => sum + a.fragility_score, 0) / assumptions.length : 0.5

    // Fragility = exposure × (1 - confidence) × assumption_fragility
    const fragilityContribution = exp.portfolio_exposure * (1 - exp.narrative_confidence) * avgFragility

    return {
      narrative_id: exp.narrative_id,
      narrative_name: exp.narrative_name,
      fragility_contribution: fragilityContribution,
      assumption_count: assumptions.length,
      avg_assumption_fragility: avgFragility,
    }
  })

  const totalFragility = fragilityByNarrative.reduce((sum, f) => sum + f.fragility_contribution, 0)

  // Find single point of failure (narrative with > 40% fragility contribution)
  const sortedByFragility = [...fragilityByNarrative].sort(
    (a, b) => b.fragility_contribution - a.fragility_contribution,
  )
  const topFragile = sortedByFragility[0]
  const singlePointOfFailure =
    topFragile && totalFragility > 0 && topFragile.fragility_contribution / totalFragility > 0.4
      ? topFragile.narrative_id
      : null

  return {
    total_fragility: totalFragility,
    fragility_by_narrative: fragilityByNarrative.sort((a, b) => b.fragility_contribution - a.fragility_contribution),
    single_point_of_failure: singlePointOfFailure,
  }
}

/**
 * Calculate confidence decay based on time since last reinforcement
 */
export function calculateDecayedConfidence(
  currentConfidence: number,
  lastReinforcedAt: string,
  halfLifeDays: number,
): number {
  const now = new Date()
  const lastReinforced = new Date(lastReinforcedAt)
  const daysSinceReinforced = (now.getTime() - lastReinforced.getTime()) / (1000 * 60 * 60 * 24)

  // Exponential decay: confidence * (0.5 ^ (days / halfLife))
  const decayFactor = Math.pow(0.5, daysSinceReinforced / halfLifeDays)
  return currentConfidence * decayFactor
}

/**
 * Format exposure as percentage string
 */
export function formatExposure(exposure: number): string {
  return `${(exposure * 100).toFixed(1)}%`
}

/**
 * Get trend icon based on confidence trend
 */
export function getTrendDirection(trend: "up" | "down" | "flat"): number {
  switch (trend) {
    case "up":
      return 1
    case "down":
      return -1
    default:
      return 0
  }
}

/**
 * Calculate overall portfolio fragility score
 * Fragility increases when holdings are concentrated in narratives with low confidence
 */
export function calculatePortfolioFragility(
  holdings: Array<{
    weight: number
    narrativeExposures: Array<{
      narrativeId: string
      exposureType: "long" | "short"
      confidence: number
    }>
  }>,
): number {
  if (holdings.length === 0) return 0

  let totalFragility = 0
  let totalWeight = 0

  for (const holding of holdings) {
    const weight = holding.weight
    totalWeight += weight

    if (holding.narrativeExposures.length === 0) {
      // Holdings without narrative exposure are neutral
      continue
    }

    // Calculate fragility contribution from each narrative exposure
    for (const exposure of holding.narrativeExposures) {
      // Fragility = weight × (1 - confidence)
      // Low confidence narratives contribute more to fragility
      const fragilityContribution = weight * (1 - exposure.confidence)
      totalFragility += fragilityContribution
    }
  }

  // Normalize to 0-1 range
  return totalWeight > 0 ? Math.min(1, totalFragility / totalWeight) : 0
}

/**
 * Calculate narrative concentration using Herfindahl-Hirschman Index (HHI)
 * Higher values indicate more concentration in fewer narratives
 */
export function calculateNarrativeConcentration(
  narrativeWeights: Array<{
    narrativeId: string
    totalWeight: number
  }>,
): number {
  if (narrativeWeights.length === 0) return 0

  const totalExposure = narrativeWeights.reduce((sum, n) => sum + n.totalWeight, 0)
  if (totalExposure === 0) return 0

  // Calculate HHI (sum of squared market shares)
  let hhi = 0
  for (const narrative of narrativeWeights) {
    const share = narrative.totalWeight / totalExposure
    hhi += share * share
  }

  // Normalize: HHI ranges from 1/n to 1
  // Convert to 0-1 scale where 0 = perfectly diversified, 1 = completely concentrated
  const minHHI = narrativeWeights.length > 0 ? 1 / narrativeWeights.length : 0
  const normalizedHHI = (hhi - minHHI) / (1 - minHHI)

  return Math.max(0, Math.min(1, normalizedHHI))
}
