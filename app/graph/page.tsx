import { AppShell } from "@/components/layout/app-shell"
import { BeliefGraph } from "@/components/graph/belief-graph"

export default function GraphPage() {
  return (
    <AppShell>
      <div className="flex h-screen flex-col">
        <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Belief Graph</h1>
              <p className="text-sm text-muted-foreground">Visualize narrative relationships and conflicts</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <BeliefGraph />
        </div>
      </div>
    </AppShell>
  )
}
