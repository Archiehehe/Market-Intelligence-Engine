import { AppShell } from "@/components/layout/app-shell"
import { PortfolioOverview } from "@/components/portfolio/portfolio-overview"
import { FragilityWarnings } from "@/components/portfolio/fragility-warnings"
import { NarrativeInfluence } from "@/components/portfolio/narrative-influence"

export default function PortfolioPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Portfolio Lens</h1>
              <p className="text-sm text-muted-foreground">Analyze narrative exposure and fragility</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <PortfolioOverview />
            </div>
            <div className="space-y-6">
              <FragilityWarnings />
              <NarrativeInfluence />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
