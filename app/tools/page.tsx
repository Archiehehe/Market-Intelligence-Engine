"use client"
import { AppShell } from "@/components/layout/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal, Zap, Info, ExternalLink, Sparkles, BookOpen, TrendingDown, Activity } from "lucide-react"

interface Tool {
  id: string
  name: string
  description: string
  url: string
  category: "ai-research" | "market-data" | "news" | "analysis"
  icon: typeof Sparkles | typeof BookOpen | typeof Zap | typeof TrendingDown | typeof Activity
  tags: string[]
  useCase: string
  isPremium?: boolean
}

const tools: Tool[] = [
  // AI Research Tools
  {
    id: "chatgpt-o3",
    name: "ChatGPT o3",
    description:
      "OpenAI's most advanced reasoning model. Excellent for complex market analysis, thesis development, and multi-step logical reasoning about investment scenarios.",
    url: "https://chat.openai.com",
    category: "ai-research",
    icon: Zap,
    tags: ["Reasoning", "Analysis", "Thesis Building"],
    useCase:
      "Use for deep dive analysis on specific narratives, stress-testing assumptions, or developing new investment theses",
    isPremium: true,
  },
  {
    id: "chatgpt-deep-research",
    name: "ChatGPT Deep Research",
    description:
      "Comprehensive research mode that synthesizes information from multiple sources to produce detailed research reports on any topic.",
    url: "https://chat.openai.com/?model=gpt-4-research",
    category: "ai-research",
    icon: BookOpen,
    tags: ["Research", "Synthesis", "Reports"],
    useCase:
      "Generate comprehensive research reports on sectors, companies, or macro themes before adding to your narrative framework",
    isPremium: true,
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    description:
      "Real-time AI search that cites sources. Perfect for fact-checking, finding recent news, and verifying claims with up-to-date information.",
    url: "https://perplexity.ai",
    category: "ai-research",
    icon: Sparkles,
    tags: ["Search", "Citations", "Real-time"],
    useCase:
      "Quickly find recent evidence for or against your narratives, verify data points, or explore new angles with cited sources",
  },
  {
    id: "claude",
    name: "Claude",
    description:
      "Anthropic's AI assistant known for nuanced analysis and long-form document processing. Great for analyzing earnings transcripts and lengthy reports.",
    url: "https://claude.ai",
    category: "ai-research",
    icon: Zap,
    tags: ["Analysis", "Documents", "Nuanced"],
    useCase:
      "Analyze lengthy earnings call transcripts, SEC filings, or complex financial documents to extract narrative-relevant insights",
  },

  // Market Data Tools
  {
    id: "tradingview",
    name: "TradingView",
    description:
      "Professional-grade charting platform with real-time data, technical analysis tools, and a large community of traders sharing ideas.",
    url: "https://tradingview.com",
    category: "market-data",
    icon: Zap,
    tags: ["Charts", "Technical", "Real-time"],
    useCase:
      "Monitor price action on assets tied to your narratives, set alerts for breakout levels, or analyze market structure",
  },
  {
    id: "koyfin",
    name: "Koyfin",
    description:
      "Bloomberg-like terminal for retail investors. Access fundamental data, financials, and screening tools at a fraction of the cost.",
    url: "https://koyfin.com",
    category: "market-data",
    icon: Zap,
    tags: ["Fundamentals", "Screening", "Data"],
    useCase:
      "Screen for stocks exposed to your narratives, compare valuations, or track fundamental metrics across portfolios",
  },
  {
    id: "finviz",
    name: "FinViz",
    description:
      "Fast stock screener and visualization tool. The market map provides instant sector-level perspective on market movements.",
    url: "https://finviz.com",
    category: "market-data",
    icon: Zap,
    tags: ["Screener", "Maps", "Fast"],
    useCase:
      "Quickly visualize sector rotations relevant to your narratives or screen for stocks meeting specific criteria",
  },
  {
    id: "fred",
    name: "FRED (St. Louis Fed)",
    description:
      "The definitive source for economic data. Hundreds of thousands of time series covering macro indicators globally.",
    url: "https://fred.stlouisfed.org",
    category: "market-data",
    icon: Zap,
    tags: ["Economic", "Macro", "Historical"],
    useCase: "Track economic indicators that serve as leading or confirming evidence for macro narratives",
  },

  // News & Analysis
  {
    id: "bloomberg",
    name: "Bloomberg",
    description:
      "The gold standard for financial news and data. Terminal-level insights for serious market participants.",
    url: "https://bloomberg.com",
    category: "news",
    icon: Zap,
    tags: ["News", "Premium", "Comprehensive"],
    useCase: "Stay on top of breaking news that could affect your narratives or provide new evidence",
    isPremium: true,
  },
  {
    id: "seeking-alpha",
    name: "Seeking Alpha",
    description:
      "Crowdsourced investment research with detailed analysis from thousands of contributors covering individual stocks.",
    url: "https://seekingalpha.com",
    category: "news",
    icon: Zap,
    tags: ["Analysis", "Crowdsourced", "Deep-dives"],
    useCase: "Find detailed bull/bear cases for specific companies that map to your narrative exposures",
  },
  {
    id: "macrovoices",
    name: "MacroVoices",
    description: "Weekly podcast featuring in-depth interviews with institutional investors and macro strategists.",
    url: "https://macrovoices.com",
    category: "news",
    icon: Zap,
    tags: ["Macro", "Podcast", "Expert"],
    useCase: "Discover new macro narratives or get contrarian perspectives on existing theses",
  },

  // Analysis Tools
  {
    id: "sec-edgar",
    name: "SEC EDGAR",
    description:
      "Official SEC filing database. Access 10-Ks, 10-Qs, 8-Ks, and insider trading reports directly from the source.",
    url: "https://sec.gov/cgi-bin/browse-edgar",
    category: "analysis",
    icon: Zap,
    tags: ["Filings", "Official", "Primary"],
    useCase: "Verify company-level assumptions, check insider activity, or review risk disclosures for holdings",
  },
  {
    id: "openinsider",
    name: "OpenInsider",
    description:
      "Track insider buying and selling activity across the market. Often a leading indicator of company-specific developments.",
    url: "http://openinsider.com",
    category: "analysis",
    icon: Zap,
    tags: ["Insider", "Signals", "Free"],
    useCase: "Monitor insider activity in companies exposed to your narratives for confirmation or warning signals",
  },
  {
    id: "dipsnipe",
    name: "DipSnipe",
    description:
      "Identify optimal buying opportunities by analyzing historical dip patterns and recovery rates across different market conditions.",
    url: "https://archiehehe.shinyapps.io/DipSnipe/",
    category: "analysis",
    icon: TrendingDown,
    tags: ["Dips", "Timing", "Tactical"],
    useCase: "Find tactical entry points when narratives experience temporary weakness but fundamentals remain intact",
  },
  {
    id: "sector-momentum",
    name: "Sector Momentum Tracker",
    description:
      "Track relative strength and momentum across market sectors to identify rotation patterns and emerging trends.",
    url: "https://archiehehe.shinyapps.io/SectorMomentumTracker/",
    category: "analysis",
    icon: Activity,
    tags: ["Momentum", "Sectors", "Rotation"],
    useCase: "Spot sector rotation signals that confirm or challenge your narrative-based positioning",
  },
]

const categories = [
  { id: "all", label: "All Tools", icon: Zap },
  { id: "ai-research", label: "AI Research", icon: Zap },
  { id: "market-data", label: "Market Data", icon: Zap },
  { id: "news", label: "News & Analysis", icon: Zap },
  { id: "analysis", label: "Research Tools", icon: Zap },
]

export default function ToolsPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Research Tools</h1>
              <p className="text-sm text-muted-foreground">Specialized tools for narrative analysis</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="narrative-terminal" className="space-y-6">
            <TabsList className="bg-secondary/50 h-12 p-1.5 gap-1">
              <TabsTrigger
                value="narrative-terminal"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Terminal className="h-4 w-4" />
                Narrative Terminal
              </TabsTrigger>
              <TabsTrigger
                value="snap-judgement"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Zap className="h-4 w-4" />
                SnapJudgement
              </TabsTrigger>
              <TabsTrigger
                value="dipsnipe"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingDown className="h-4 w-4" />
                DipSnipe
              </TabsTrigger>
              <TabsTrigger
                value="sector-momentum"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="h-4 w-4" />
                Sector Momentum
              </TabsTrigger>
            </TabsList>

            <TabsContent value="narrative-terminal" className="space-y-4">
              {/* Tool Info Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Terminal className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Narrative Terminal</CardTitle>
                        <CardDescription>Single-stock market intelligence engine</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                        Live
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                        <a href="https://marketnarrative.vercel.app/" target="_blank" rel="noopener noreferrer">
                          Open in New Tab
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <p>
                      Enter a stock ticker to analyze its narrative exposure, key assumptions, and market sentiment. The
                      terminal provides real-time intelligence on how market narratives affect individual stocks.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Embedded App */}
              <Card className="bg-card border-border overflow-hidden">
                <div className="relative w-full" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
                  <iframe
                    src="https://marketnarrative.vercel.app/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="Narrative Terminal"
                    allow="clipboard-write"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="snap-judgement" className="space-y-4">
              {/* Tool Info Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-accent/10">
                        <Zap className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-base">SnapJudgement</CardTitle>
                        <CardDescription>Quick analysis and decision support tool</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        Live
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                        <a href="https://snapjudgement.vercel.app/" target="_blank" rel="noopener noreferrer">
                          Open in New Tab
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                    <p>
                      SnapJudgement provides rapid analysis capabilities for quick decision making. Use it to validate
                      ideas, check assumptions, and get instant feedback on market scenarios.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Embedded App */}
              <Card className="bg-card border-border overflow-hidden">
                <div className="relative w-full" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
                  <iframe
                    src="https://snapjudgement.vercel.app/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="SnapJudgement"
                    allow="clipboard-write"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="dipsnipe" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-destructive/10">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <CardTitle className="text-base">DipSnipe</CardTitle>
                        <CardDescription>Identify optimal buying opportunities during market dips</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                        Live
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                        <a href="https://archiehehe.shinyapps.io/DipSnipe/" target="_blank" rel="noopener noreferrer">
                          Open in New Tab
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                    <p>
                      Analyze historical dip patterns and recovery rates to identify tactical entry points. Particularly
                      useful when high-conviction narratives experience temporary weakness.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border overflow-hidden">
                <div className="relative w-full" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
                  <iframe
                    src="https://archiehehe.shinyapps.io/DipSnipe/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="DipSnipe"
                    allow="clipboard-write"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="sector-momentum" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-chart-3/10">
                        <Activity className="h-5 w-5 text-chart-3" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Sector Momentum Tracker</CardTitle>
                        <CardDescription>Track relative strength and sector rotation patterns</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">
                        Live
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                        <a
                          href="https://archiehehe.shinyapps.io/SectorMomentumTracker/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in New Tab
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-chart-3" />
                    <p>
                      Monitor sector-level momentum and rotation to validate narrative-based positioning. Spot early
                      signals when market flows confirm or challenge your theses.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border overflow-hidden">
                <div className="relative w-full" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
                  <iframe
                    src="https://archiehehe.shinyapps.io/SectorMomentumTracker/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="Sector Momentum Tracker"
                    allow="clipboard-write"
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
