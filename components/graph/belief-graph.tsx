"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ZoomIn, ZoomOut, Maximize2, Link2, AlertTriangle, Zap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphNode {
  id: string
  title: string
  summary: string
  direction: "bullish" | "bearish" | "neutral"
  confidence: number
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  source: string
  target: string
  relationship: "reinforces" | "conflicts" | "depends_on"
  strength: number
}

interface NarrativeDetails {
  id: string
  name: string
  summary: string
  confidence_score: number
  confidence_trend: string
  updated_at: string
  assumptions: Array<{ id: string; text: string; fragility_score: number }>
  evidence: Array<{ id: string; description: string; type: string; source: string }>
}

const fetcher = async () => {
  const supabase = createClient()

  const { data: narratives, error: narrativesError } = await supabase
    .from("narratives")
    .select("id, name, summary, confidence_score, confidence_trend, direction, updated_at")

  if (narrativesError) {
    console.error("Failed to fetch narratives:", narrativesError)
    throw narrativesError
  }

  const seenNames = new Set<string>()
  const uniqueNarratives = (narratives || []).filter((n) => {
    const normalizedName = n.name?.toLowerCase().trim()
    if (seenNames.has(normalizedName)) {
      return false
    }
    seenNames.add(normalizedName)
    return true
  })

  const { data: edges, error: edgesError } = await supabase.from("belief_edges").select("*")

  if (edgesError) {
    console.error("Failed to fetch edges:", edgesError)
  }

  return {
    narratives: uniqueNarratives,
    edges: edges || [],
  }
}

const fetchNarrativeDetails = async (narrativeId: string): Promise<NarrativeDetails | null> => {
  const supabase = createClient()

  const [narrativeRes, assumptionsRes, evidenceRes] = await Promise.all([
    supabase.from("narratives").select("*").eq("id", narrativeId).single(),
    supabase.from("assumptions").select("*").eq("narrative_id", narrativeId),
    supabase.from("evidence").select("*").eq("narrative_id", narrativeId).order("timestamp", { ascending: false }),
  ])

  if (narrativeRes.error) return null

  return {
    ...narrativeRes.data,
    assumptions: assumptionsRes.data || [],
    evidence: evidenceRes.data || [],
  }
}

export function BeliefGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])

  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<NarrativeDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [strengthFilter, setStrengthFilter] = useState(0)
  const [nodeCount, setNodeCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)

  const { data, isLoading, error } = useSWR("belief-graph", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  // Initialize nodes with physics
  useEffect(() => {
    if (!data || data.narratives.length === 0) return

    const canvas = canvasRef.current
    const width = canvas?.width || 800
    const height = canvas?.height || 600
    const centerX = width / 2
    const centerY = height / 2

    const angleStep = (2 * Math.PI) / data.narratives.length
    const radius = Math.min(width, height) * 0.35

    nodesRef.current = data.narratives.map((n, i) => ({
      id: n.id,
      title: n.name,
      summary: n.summary || "No summary available",
      direction: (n.direction || "neutral") as GraphNode["direction"],
      confidence: n.confidence_score || 0.5,
      x: centerX + Math.cos(angleStep * i) * radius,
      y: centerY + Math.sin(angleStep * i) * radius,
      vx: 0,
      vy: 0,
    }))

    edgesRef.current = (data.edges || [])
      .filter((e) => {
        const sourceExists = nodesRef.current.some((n) => n.id === e.from_narrative_id)
        const targetExists = nodesRef.current.some((n) => n.id === e.to_narrative_id)
        return sourceExists && targetExists
      })
      .map((e) => ({
        source: e.from_narrative_id,
        target: e.to_narrative_id,
        relationship: e.relationship as GraphEdge["relationship"],
        strength: e.strength || 0.5,
      }))

    setNodeCount(nodesRef.current.length)
    setEdgeCount(edgesRef.current.length)
  }, [data])

  useEffect(() => {
    if (selectedNode) {
      setLoadingDetails(true)
      fetchNarrativeDetails(selectedNode.id).then((details) => {
        setSelectedDetails(details)
        setLoadingDetails(false)
      })
    } else {
      setSelectedDetails(null)
    }
  }, [selectedNode])

  // Physics simulation - Restored original working version
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      // Center gravity
      node.vx += (centerX - node.x) * 0.001
      node.vy += (centerY - node.y) * 0.001

      // Repulsion between nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j]
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = 2000 / (dist * dist)

        node.vx += (dx / dist) * force
        node.vy += (dy / dist) * force
        other.vx -= (dx / dist) * force
        other.vy -= (dy / dist) * force
      }
    }

    // Edge attraction
    for (const edge of edges) {
      if (edge.strength < strengthFilter / 100) continue

      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) continue

      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - 150) * 0.01 * edge.strength

      source.vx += (dx / dist) * force
      source.vy += (dy / dist) * force
      target.vx -= (dx / dist) * force
      target.vy -= (dy / dist) * force
    }

    // Update positions with damping
    for (const node of nodes) {
      node.vx *= 0.9
      node.vy *= 0.9
      node.x += node.vx
      node.y += node.vy

      // Boundary constraints
      node.x = Math.max(60, Math.min(width - 60, node.x))
      node.y = Math.max(60, Math.min(height - 60, node.y))
    }

    // Clear and draw
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-width / 2, -height / 2)

    // Draw edges
    for (const edge of edges) {
      if (edge.strength < strengthFilter / 100) continue

      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) continue

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)

      const isHighlighted = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target)

      if (edge.relationship === "reinforces") {
        ctx.strokeStyle = isHighlighted ? "rgba(74, 222, 128, 0.8)" : "rgba(74, 222, 128, 0.3)"
      } else if (edge.relationship === "conflicts") {
        ctx.strokeStyle = isHighlighted ? "rgba(248, 113, 113, 0.8)" : "rgba(248, 113, 113, 0.3)"
      } else {
        ctx.strokeStyle = isHighlighted ? "rgba(147, 197, 253, 0.8)" : "rgba(147, 197, 253, 0.3)"
      }

      ctx.lineWidth = isHighlighted ? 3 : 1 + edge.strength * 2
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNode?.id === node.id
      const isConnected =
        selectedNode &&
        edges.some(
          (e) =>
            (e.source === selectedNode.id && e.target === node.id) ||
            (e.target === selectedNode.id && e.source === node.id),
        )

      const baseRadius = 25
      const radius = baseRadius + node.confidence * 10
      const alpha = selectedNode && !isSelected && !isConnected ? 0.3 : 1

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)

      if (node.direction === "bullish") {
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha * 0.8})`
      } else if (node.direction === "bearish") {
        ctx.fillStyle = `rgba(248, 113, 113, ${alpha * 0.8})`
      } else {
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha * 0.8})`
      }

      ctx.fill()

      if (isSelected || isHovered) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Node label
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.font = "11px Geist, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const label = node.title.length > 20 ? node.title.slice(0, 17) + "..." : node.title
      ctx.fillText(label, node.x, node.y + radius + 14)
    }

    ctx.restore()
    animationRef.current = requestAnimationFrame(simulate)
  }, [zoom, selectedNode, hoveredNode, strengthFilter])

  // Start simulation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(simulate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulate])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle mouse interactions
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvas.width / 2) / zoom + canvas.width / 2
    const y = (e.clientY - rect.top - canvas.height / 2) / zoom + canvas.height / 2

    const clickedNode = nodesRef.current.find((node) => {
      const radius = 25 + node.confidence * 10
      const dx = x - node.x
      const dy = y - node.y
      return dx * dx + dy * dy < radius * radius
    })

    setSelectedNode(clickedNode || null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvas.width / 2) / zoom + canvas.width / 2
    const y = (e.clientY - rect.top - canvas.height / 2) / zoom + canvas.height / 2

    const hovered = nodesRef.current.find((node) => {
      const radius = 25 + node.confidence * 10
      const dx = x - node.x
      const dy = y - node.y
      return dx * dx + dy * dy < radius * radius
    })

    setHoveredNode(hovered || null)
    canvas.style.cursor = hovered ? "pointer" : "default"
  }

  const getConnectedNarratives = () => {
    if (!selectedNode) return []
    return edgesRef.current
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((edge) => {
        const otherId = edge.source === selectedNode.id ? edge.target : edge.source
        const otherNode = nodesRef.current.find((n) => n.id === otherId)
        return {
          ...edge,
          narrative: otherNode,
        }
      })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading belief graph...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Belief Graph</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading the graph data. Please ensure the database is properly configured and try again.
          </p>
          <Badge variant="outline" className="text-xs">
            Run scripts/011-fix-evidence-data.sql
          </Badge>
        </div>
      </div>
    )
  }

  if (!data || data.narratives.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mx-auto mb-4">
            <Link2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Narratives Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The belief graph will display narrative relationships once you add narratives to the system. Run the
            database seed scripts to populate sample data.
          </p>
          <Badge variant="outline" className="text-xs">
            Run scripts/011-fix-evidence-data.sql
          </Badge>
        </div>
      </div>
    )
  }

  const connectedNarratives = getConnectedNarratives()

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Main graph canvas */}
      <div ref={containerRef} className="relative flex-1 rounded-lg border border-border bg-card">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="h-full w-full"
        />

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="secondary" size="icon" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setZoom(1)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 rounded-lg border border-border bg-card/90 p-3 backdrop-blur">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Bearish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-3" />
              <span className="text-muted-foreground">Neutral</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-primary" />
                <span className="text-muted-foreground">Reinforces</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-destructive" />
                <span className="text-muted-foreground">Conflicts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-chart-3" />
                <span className="text-muted-foreground">Depends on</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats badge - Use state instead of ref for proper rendering */}
        <div className="absolute top-4 right-4 rounded-lg border border-border bg-card/90 p-2 backdrop-blur">
          <div className="text-xs text-muted-foreground">
            {nodeCount} narratives • {edgeCount} connections
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-96 space-y-4">
        {/* Filters */}
        <Card className="border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Filters</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Min Edge Strength</Label>
                <span className="text-xs font-mono text-foreground">{strengthFilter}%</span>
              </div>
              <Slider value={[strengthFilter]} onValueChange={([v]) => setStrengthFilter(v)} max={100} step={5} />
            </div>
          </div>
        </Card>

        {/* Selected node details */}
        {selectedNode ? (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {/* Narrative Header */}
              <Card className="border-border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground leading-tight">{selectedNode.title}</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        selectedNode.direction === "bullish"
                          ? "bg-primary/20 text-primary"
                          : selectedNode.direction === "bearish"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-chart-3/20 text-chart-3",
                      )}
                    >
                      {selectedNode.direction}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedNode.summary}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {Math.round(selectedNode.confidence * 100)}%
                    </span>
                    <span className="text-sm text-muted-foreground">confidence</span>
                  </div>
                </div>
              </Card>

              {/* Connected Narratives */}
              {connectedNarratives.length > 0 && (
                <Card className="border-border bg-card p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Connected Narratives
                  </h4>
                  <div className="space-y-2">
                    {connectedNarratives.map((conn, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-2"
                      >
                        <div className="flex items-center gap-2">
                          {conn.relationship === "reinforces" ? (
                            <Zap className="h-4 w-4 text-primary" />
                          ) : conn.relationship === "conflicts" ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-chart-3" />
                          )}
                          <span className="text-sm text-foreground">{conn.narrative?.title}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            conn.relationship === "reinforces"
                              ? "bg-primary/20 text-primary"
                              : conn.relationship === "conflicts"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-chart-3/20 text-chart-3",
                          )}
                        >
                          {conn.relationship}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Details from DB */}
              {loadingDetails ? (
                <Card className="border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Loading details...</div>
                </Card>
              ) : selectedDetails ? (
                <>
                  {/* Assumptions */}
                  {selectedDetails.assumptions.length > 0 && (
                    <Card className="border-border bg-card p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">Key Assumptions</h4>
                      <div className="space-y-2">
                        {selectedDetails.assumptions.map((a) => (
                          <div key={a.id} className="flex items-start gap-2 text-sm">
                            <div
                              className={cn(
                                "mt-1 h-2 w-2 rounded-full shrink-0",
                                a.fragility_score > 0.7
                                  ? "bg-destructive"
                                  : a.fragility_score > 0.4
                                    ? "bg-accent"
                                    : "bg-primary",
                              )}
                            />
                            <span className="text-muted-foreground">{a.text}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Evidence */}
                  {selectedDetails.evidence.length > 0 && (
                    <Card className="border-border bg-card p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">Recent Evidence</h4>
                      <div className="space-y-2">
                        {selectedDetails.evidence.slice(0, 5).map((e) => (
                          <div key={e.id} className="rounded-lg border border-border bg-secondary/30 p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  e.type === "supporting"
                                    ? "bg-primary/20 text-primary"
                                    : e.type === "contradicting"
                                      ? "bg-destructive/20 text-destructive"
                                      : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {e.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{e.source}</span>
                            </div>
                            <p className="text-sm text-foreground">{e.description}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          </ScrollArea>
        ) : (
          <Card className="border-border bg-card p-4">
            <div className="text-center py-8">
              <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Click on a narrative node to view details and connections</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
