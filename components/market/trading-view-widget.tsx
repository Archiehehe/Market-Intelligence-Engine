"use client"

import { useEffect, useRef, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, LineChart, Newspaper, TrendingUp, Grid3X3, Search, DollarSign, Activity } from "lucide-react"

interface TradingViewWidgetProps {
  type: "chart" | "heatmap" | "screener" | "overview" | "news" | "trending" | "financials" | "ticker"
  symbol?: string
  title?: string
  height?: number
  compact?: boolean
  minMarketCap?: boolean
}

const widgetIcons = {
  chart: LineChart,
  heatmap: Grid3X3,
  screener: Search,
  overview: BarChart3,
  news: Newspaper,
  trending: TrendingUp,
  financials: DollarSign,
  ticker: Activity,
}

function TradingViewWidgetComponent({
  type,
  symbol = "SPY",
  title,
  height,
  compact,
  minMarketCap,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ""

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true

    let widgetConfig: Record<string, unknown> = {}

    switch (type) {
      case "ticker":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js"
        widgetConfig = {
          symbol: symbol,
          width: "100%",
          isTransparent: true,
          colorTheme: "dark",
          locale: "en",
        }
        break

      case "chart":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
        widgetConfig = {
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          support_host: "https://www.tradingview.com",
        }
        break

      case "heatmap":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
        widgetConfig = {
          exchanges: [],
          dataSource: "SPX500",
          grouping: "sector",
          blockSize: "market_cap_basic",
          blockColor: "change",
          locale: "en",
          symbolUrl: "",
          colorTheme: "dark",
          hasTopBar: true,
          isDataSet498: true,
          isZoomEnabled: true,
          hasSymbolTooltip: true,
          width: "100%",
          height: "100%",
        }
        break

      case "screener":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
        widgetConfig = {
          width: "100%",
          height: "100%",
          defaultColumn: "overview",
          defaultScreen: minMarketCap ? "large_cap" : "most_capitalized",
          market: "america",
          showToolbar: true,
          colorTheme: "dark",
          locale: "en",
        }
        break

      case "overview":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
        widgetConfig = {
          colorTheme: "dark",
          dateRange: "12M",
          showChart: true,
          locale: "en",
          width: "100%",
          height: "100%",
          largeChartUrl: "",
          isTransparent: false,
          showSymbolLogo: true,
          showFloatingTooltip: true,
          plotLineColorGrowing: "rgba(41, 191, 140, 1)",
          plotLineColorFalling: "rgba(255, 93, 93, 1)",
          gridLineColor: "rgba(42, 46, 57, 0)",
          scaleFontColor: "rgba(219, 219, 219, 1)",
          belowLineFillColorGrowing: "rgba(41, 191, 140, 0.12)",
          belowLineFillColorFalling: "rgba(255, 93, 93, 0.12)",
          belowLineFillColorGrowingBottom: "rgba(41, 191, 140, 0)",
          belowLineFillColorFallingBottom: "rgba(255, 93, 93, 0)",
          symbolActiveColor: "rgba(41, 191, 140, 0.12)",
          tabs: [
            {
              title: "Indices",
              symbols: [
                { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
                { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
                { s: "FOREXCOM:DJI", d: "Dow Jones" },
                { s: "INDEX:NKY", d: "Nikkei 225" },
                { s: "INDEX:DEU40", d: "DAX Index" },
                { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
              ],
              originalTitle: "Indices",
            },
            {
              title: "Futures",
              symbols: [
                { s: "CME_MINI:ES1!", d: "S&P 500" },
                { s: "CME:6E1!", d: "Euro" },
                { s: "COMEX:GC1!", d: "Gold" },
                { s: "NYMEX:CL1!", d: "Crude Oil" },
                { s: "NYMEX:NG1!", d: "Natural Gas" },
                { s: "CBOT:ZC1!", d: "Corn" },
              ],
              originalTitle: "Futures",
            },
            {
              title: "Bonds",
              symbols: [
                { s: "CBOT:ZB1!", d: "T-Bond" },
                { s: "CBOT:UB1!", d: "Ultra T-Bond" },
                { s: "EUREX:FGBL1!", d: "Euro Bund" },
                { s: "EUREX:FBTP1!", d: "Euro BTP" },
                { s: "EUREX:FGBM1!", d: "Euro BOBL" },
              ],
              originalTitle: "Bonds",
            },
            {
              title: "Forex",
              symbols: [
                { s: "FX:EURUSD", d: "EUR/USD" },
                { s: "FX:GBPUSD", d: "GBP/USD" },
                { s: "FX:USDJPY", d: "USD/JPY" },
                { s: "FX:USDCHF", d: "USD/CHF" },
                { s: "FX:AUDUSD", d: "AUD/USD" },
                { s: "FX:USDCAD", d: "USD/CAD" },
              ],
              originalTitle: "Forex",
            },
          ],
        }
        break

      case "news":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
        widgetConfig = {
          feedMode: "all_symbols",
          isTransparent: false,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          colorTheme: "dark",
          locale: "en",
        }
        break

      case "trending":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js"
        widgetConfig = {
          colorTheme: "dark",
          dateRange: "12M",
          exchange: "US",
          showChart: true,
          locale: "en",
          width: "100%",
          height: "100%",
          largeChartUrl: "",
          isTransparent: false,
          showSymbolLogo: true,
          showFloatingTooltip: true,
          plotLineColorGrowing: "rgba(41, 191, 140, 1)",
          plotLineColorFalling: "rgba(255, 93, 93, 1)",
          gridLineColor: "rgba(42, 46, 57, 0)",
          scaleFontColor: "rgba(219, 219, 219, 1)",
          belowLineFillColorGrowing: "rgba(41, 191, 140, 0.12)",
          belowLineFillColorFalling: "rgba(255, 93, 93, 0.12)",
          belowLineFillColorGrowingBottom: "rgba(41, 191, 140, 0)",
          belowLineFillColorFallingBottom: "rgba(255, 93, 93, 0)",
        }
        break

      case "financials":
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-financials.js"
        widgetConfig = {
          colorTheme: "dark",
          isTransparent: false,
          largeChartUrl: "",
          displayMode: "regular",
          width: "100%",
          height: "100%",
          symbol: symbol,
          locale: "en",
        }
        break
    }

    script.innerHTML = JSON.stringify(widgetConfig)

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container__widget"
    widgetContainer.style.height = compact ? "80px" : "100%"
    widgetContainer.style.width = "100%"

    containerRef.current.appendChild(widgetContainer)
    widgetContainer.appendChild(script)
  }, [type, symbol, compact, minMarketCap])

  const Icon = widgetIcons[type]
  const widgetHeight = compact ? 80 : height || 500

  if (compact) {
    return <div ref={containerRef} className="tradingview-widget-container w-full" style={{ height: widgetHeight }} />
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {title || type.charAt(0).toUpperCase() + type.slice(1)}
          </CardTitle>
          <div className="flex items-center gap-2">
            {minMarketCap && (
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                Large Cap Only
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              TradingView
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="tradingview-widget-container w-full" style={{ height: widgetHeight }} />
      </CardContent>
    </Card>
  )
}

export const TradingViewWidget = memo(TradingViewWidgetComponent)
