"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react"

const fetcher = async () => {
  const supabase = createClient()

  const { data: narratives, error } = await supabase
    .from("narratives")
    .select("confidence_trend, confidence_score, updated_at")

  if (error) throw error

  const stats = {
    total: narratives?.length || 0,
    trendingUp: narratives?.filter((n) => n.confidence_trend === "up").length || 0,
    trendingDown: narratives?.filter((n) => n.confidence_trend === "down").length || 0,
    avgConfidence:
      narratives && narratives.length > 0
        ? narratives.reduce((sum, n) => sum + n.confidence_score, 0) / narratives.length
        : 0,
    staleCount:
      narratives?.filter((n) => {
        const daysSince = Math.floor((Date.now() - new Date(n.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 14
      }).length || 0,
  }

  return stats
}

export function NarrativeStats() {
  const { data: stats, isLoading } = useSWR("narrative-stats", fetcher)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Active Narratives",
      value: stats?.total || 0,
      icon: Activity,
      color: "text-foreground",
    },
    {
      title: "Trending Up",
      value: stats?.trendingUp || 0,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Trending Down",
      value: stats?.trendingDown || 0,
      icon: TrendingDown,
      color: "text-destructive",
    },
    {
      title: "Need Review",
      value: stats?.staleCount || 0,
      icon: AlertTriangle,
      color: "text-accent",
      subtitle: "Stale narratives",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
