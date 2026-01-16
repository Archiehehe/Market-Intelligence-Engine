import { AppShell } from "@/components/layout/app-shell"
import { NarrativeGrid } from "@/components/narratives/narrative-grid"

export default function NarrativesPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Narratives</h1>
              <p className="text-sm text-muted-foreground">Track and analyze market narratives</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <NarrativeGrid />
        </div>
      </div>
    </AppShell>
  )
}
