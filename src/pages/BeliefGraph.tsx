import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNarratives, useBeliefEdges } from '@/hooks/useNarratives';
import { useAIExplain } from '@/hooks/useAIExplain';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, X, Loader2, Sparkles, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function NarrativeNode({ data }: NodeProps) {
  const confidence = data.confidence as number;
  const trend = data.trend as string;
  const tags = (data.tags as string[]) || [];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // Gradient border based on confidence
  const bgGradient = confidence >= 70
    ? 'from-emerald-500/20 to-emerald-500/5'
    : confidence >= 40
    ? 'from-amber-500/20 to-amber-500/5'
    : 'from-red-500/20 to-red-500/5';
  
  const borderColor = confidence >= 70
    ? 'border-emerald-500/40'
    : confidence >= 40
    ? 'border-amber-500/40'
    : 'border-red-500/40';

  const confTextColor = confidence >= 70
    ? 'text-emerald-400'
    : confidence >= 40
    ? 'text-amber-400'
    : 'text-red-400';

  const trendColor = trend === 'up'
    ? 'text-emerald-400'
    : trend === 'down'
    ? 'text-red-400'
    : 'text-muted-foreground';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} backdrop-blur-sm rounded-xl border-2 ${borderColor} p-4 shadow-xl cursor-pointer transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] min-w-[200px] max-w-[240px]`}>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-bold leading-tight text-foreground">{data.label as string}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xl font-bold font-mono ${confTextColor}`}>
            {confidence}
          </span>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{data.summary as string}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-background/50 rounded-full text-muted-foreground font-medium">{tag}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />
    </div>
  );
}

const nodeTypes = { narrative: NarrativeNode };

// Force-directed-like layout using a circle with jitter
function layoutNodes(count: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];
  
  // Use concentric circles for better distribution
  const positions: Array<{ x: number; y: number }> = [];
  const centerX = 600;
  const centerY = 400;
  
  if (count <= 6) {
    const radius = 300;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  } else {
    // Inner ring
    const innerCount = Math.min(6, Math.floor(count / 2));
    const outerCount = count - innerCount;
    const innerRadius = 220;
    const outerRadius = 450;
    
    for (let i = 0; i < innerCount; i++) {
      const angle = (2 * Math.PI * i) / innerCount - Math.PI / 2;
      positions.push({
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      });
    }
    for (let i = 0; i < outerCount; i++) {
      const angle = (2 * Math.PI * i) / outerCount - Math.PI / 2 + Math.PI / outerCount;
      positions.push({
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      });
    }
  }
  
  return positions;
}

export default function BeliefGraph() {
  const { data: narratives = [], isLoading: narrativesLoading } = useNarratives();
  const { data: beliefEdges = [], isLoading: edgesLoading } = useBeliefEdges();
  const { explanation, isLoading: aiLoading, explain, reset } = useAIExplain();
  const [selectedItem, setSelectedItem] = useState<{ type: 'node' | 'edge'; id: string; label: string; detail: string } | null>(null);

  const positions = useMemo(() => layoutNodes(narratives.length), [narratives.length]);

  const initialNodes: Node[] = useMemo(() =>
    narratives.map((n, i) => ({
      id: n.id,
      type: 'narrative',
      position: positions[i] || { x: 0, y: 0 },
      data: {
        label: n.name,
        confidence: n.confidence.score,
        trend: n.confidence.trend,
        tags: n.tags,
        summary: n.summary,
      },
    })), [narratives, positions]);

  const initialEdges: Edge[] = useMemo(() =>
    beliefEdges.map(e => {
      const isReinforce = e.relationship === 'reinforces';
      const isConflict = e.relationship === 'conflicts';
      return {
        id: e.id,
        source: e.fromNarrativeId,
        target: e.toNarrativeId,
        animated: isReinforce,
        type: 'default',
        style: {
          stroke: isReinforce ? '#22c55e' : isConflict ? '#ef4444' : '#f59e0b',
          strokeWidth: Math.max(2, e.strength * 4),
          strokeDasharray: isConflict ? '8 4' : undefined,
          opacity: 0.7,
        },
        label: e.relationship,
        labelStyle: { fontSize: 10, fill: 'hsl(215 20% 65%)', fontWeight: 500 },
        labelBgStyle: { fill: 'hsl(222 47% 9%)', fillOpacity: 0.9, rx: 4, ry: 4 },
        labelBgPadding: [6, 4] as [number, number],
      };
    }), [beliefEdges]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    const narrative = narratives.find(n => n.id === node.id);
    if (!narrative) return;

    const connections = beliefEdges
      .filter(e => e.fromNarrativeId === node.id || e.toNarrativeId === node.id)
      .map(e => {
        const otherId = e.fromNarrativeId === node.id ? e.toNarrativeId : e.fromNarrativeId;
        const other = narratives.find(n => n.id === otherId);
        return `${e.relationship} "${other?.name || otherId}"`;
      })
      .join(', ');

    setSelectedItem({
      type: 'node',
      id: node.id,
      label: narrative.name,
      detail: `${narrative.confidence.score}% confidence, ${narrative.confidence.trend} trend`,
    });
    explain({
      type: 'belief_graph_node',
      narrativeName: narrative.name,
      narrativeSummary: narrative.summary,
      context: `Connections: ${connections || 'None'}. Confidence: ${narrative.confidence.score}%, trend: ${narrative.confidence.trend}. Tags: ${narrative.tags.join(', ')}. Assumptions: ${narrative.assumptions.map(a => a.text).join('; ')}.`,
    });
  }, [narratives, beliefEdges, explain]);

  const handleEdgeClick = useCallback((_: any, edge: Edge) => {
    const be = beliefEdges.find(e => e.id === edge.id);
    if (!be) return;
    const fromN = narratives.find(n => n.id === be.fromNarrativeId);
    const toN = narratives.find(n => n.id === be.toNarrativeId);
    if (!fromN || !toN) return;

    setSelectedItem({
      type: 'edge',
      id: edge.id,
      label: `${fromN.name} → ${toN.name}`,
      detail: `${be.relationship} (${Math.round(be.strength * 100)}% strength)`,
    });
    explain({
      type: 'belief_graph_edge',
      context: `"${fromN.name}" (${fromN.summary}) ${be.relationship} "${toN.name}" (${toN.summary}). Strength: ${Math.round(be.strength * 100)}%.`,
    });
  }, [narratives, beliefEdges, explain]);

  if (narrativesLoading || edgesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Belief Graph</h1>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Network className="h-8 w-8 text-primary" />
          Belief Graph
          <InfoTooltip content="Interactive map of how market narratives connect. Green = reinforcing, red dashed = conflicting, yellow = dependency. Click any node or edge for an AI-powered deep dive." />
        </h1>
        <p className="text-muted-foreground">Click nodes or edges for AI-powered explanations</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 rounded bg-emerald-500" />
          <span className="text-muted-foreground">Reinforces</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 rounded border-t-2 border-dashed border-red-500" />
          <span className="text-muted-foreground">Conflicts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 rounded bg-amber-500" />
          <span className="text-muted-foreground">Depends On</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" /> High confidence</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500/30 border border-amber-500/50" /> Medium</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500/30 border border-red-500/50" /> Low</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className={`overflow-hidden transition-all ${selectedItem ? 'flex-1' : 'w-full'}`} style={{ height: 650 }}>
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(215 20% 20%)" />
            <Controls className="!bg-card !border-border !rounded-lg" />
            <MiniMap
              nodeColor={(n) => {
                const c = n.data?.confidence as number || 50;
                return c >= 70 ? '#22c55e' : c >= 40 ? '#f59e0b' : '#ef4444';
              }}
              maskColor="hsl(222 47% 6% / 0.7)"
              style={{ backgroundColor: 'hsl(222 47% 9%)', borderRadius: 8, border: '1px solid hsl(217 33% 17%)' }}
            />
          </ReactFlow>
        </Card>

        {selectedItem && (
          <Card className="w-[380px] shrink-0 flex flex-col border-primary/20" style={{ height: 650 }}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-bold text-sm truncate">{selectedItem.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedItem.detail}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setSelectedItem(null); reset(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              {aiLoading && !explanation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" /> Analyzing narrative connections...
                </div>
              )}
              {explanation && (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              )}
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}