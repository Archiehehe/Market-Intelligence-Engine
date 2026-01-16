"use client"

import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface ConfidenceDecayChartProps {
  narrativeId: string
}

export function ConfidenceDecayChart({ narrativeId }: ConfidenceDecayChartProps) {
  // Generate mock historical data - in production this would come from event store
  const data = useMemo(() => {
    const points = []
    let confidence = 0.5 + Math.random() * 0.3
    const now = Date.now()

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      // Add some random walk with mean reversion
      const change = (Math.random() - 0.5) * 0.1
      const meanReversion = (0.6 - confidence) * 0.05
      confidence = Math.max(0.1, Math.min(0.95, confidence + change + meanReversion))

      points.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        confidence: Math.round(confidence * 100),
        decayAdjusted: Math.round(confidence * (0.95 - i * 0.015) * 100),
      })
    }

    return points
  }, [narrativeId])

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="decayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
            tickFormatter={(v) => `${v}%`}
            width={35}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium text-popover-foreground">{payload[0]?.payload?.date}</p>
                  <p className="text-primary">Raw: {payload[0]?.value}%</p>
                  <p className="text-accent">Decay-adjusted: {payload[1]?.value}%</p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="confidence"
            stroke="oklch(0.7 0.15 160)"
            strokeWidth={2}
            fill="url(#confidenceGradient)"
          />
          <Area
            type="monotone"
            dataKey="decayAdjusted"
            stroke="oklch(0.75 0.15 85)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="url(#decayGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
