"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradingViewWidget } from "@/components/market/trading-view-widget"
import { Activity, BarChart3, TrendingUp, Newspaper, Globe, Zap } from "lucide-react"

export default function MarketOverviewPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Market Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time market data and analysis</p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Data
            </Badge>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50 h-12 p-1.5 gap-1">
              <TabsTrigger
                value="overview"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="h-4 w-4" />
                Market Overview
              </TabsTrigger>
              <TabsTrigger
                value="heatmap"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4" />
                Market HeatMap
              </TabsTrigger>
              <TabsTrigger
                value="gainers"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4" />
                Top Movers
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="gap-2 px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Newspaper className="h-4 w-4" />
                Market News
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key indices row */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      S&P 500
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TradingViewWidget type="ticker" symbol="FOREXCOM:SPXUSD" compact />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Nasdaq 100
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TradingViewWidget type="ticker" symbol="FOREXCOM:NSXUSD" compact />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Dow Jones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TradingViewWidget type="ticker" symbol="FOREXCOM:DJI" compact />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      VIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TradingViewWidget type="ticker" symbol="TVC:VIX" compact />
                  </CardContent>
                </Card>
              </div>

              {/* Main content grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Market overview widget - takes 2 columns */}
                <div className="lg:col-span-2">
                  <TradingViewWidget type="overview" title="Market Overview" />
                </div>
                {/* Top movers widget */}
                <div>
                  <TradingViewWidget type="trending" title="Top Movers ($5B+)" minMarketCap />
                </div>
              </div>

              {/* Heatmap and screener row */}
              <div className="grid gap-6 lg:grid-cols-2">
                <TradingViewWidget type="heatmap" title="S&P 500 Heatmap" />
                <TradingViewWidget type="screener" title="Stock Screener" />
              </div>
            </TabsContent>

            <TabsContent value="heatmap" className="space-y-6">
              <TradingViewWidget type="heatmap" title="Market HeatMap" height={700} />
            </TabsContent>

            <TabsContent value="gainers" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Top Gainers & Losers</h2>
                  <p className="text-sm text-muted-foreground">Filtered to stocks with $5B+ market cap</p>
                </div>
                <Badge variant="secondary">Min Market Cap: $5B</Badge>
              </div>
              <TradingViewWidget type="trending" title="Top Gainers & Losers" minMarketCap height={600} />
            </TabsContent>

            <TabsContent value="news" className="space-y-6">
              <TradingViewWidget type="news" title="Market News" height={700} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
