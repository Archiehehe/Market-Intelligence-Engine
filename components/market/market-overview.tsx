"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, TrendingUp, BarChart3, Newspaper, Activity, Sparkles, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { TradingViewWidget } from "./trading-view-widget"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  widget?: {
    type: "chart" | "heatmap" | "screener" | "overview" | "news" | "trending" | "financials"
    symbol?: string
    title?: string
  }
}

const suggestedQueries = [
  { label: "Market Overview", icon: Activity, query: "Show me today's market overview" },
  { label: "Tech Sector", icon: BarChart3, query: "How is the tech sector performing?" },
  { label: "Top Gainers", icon: TrendingUp, query: "What are today's top gaining stocks?" },
  { label: "Market News", icon: Newspaper, query: "Show me the latest market news" },
]

export function MarketOverview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Market Intelligence. I can help you analyze markets, view charts, and track narratives. What would you like to explore today?",
      widget: { type: "overview", title: "Market Overview" },
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response with widget detection
    setTimeout(() => {
      const response = generateResponse(query)
      setMessages((prev) => [...prev, response])
      setIsLoading(false)
    }, 1000)
  }

  const generateResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase()

    // Detect intent and return appropriate widget
    if (lowerQuery.includes("overview") || lowerQuery.includes("market today")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here's the current market overview showing major indices, futures, and key market movements.",
        widget: { type: "overview", title: "Market Overview" },
      }
    }

    if (lowerQuery.includes("heatmap") || lowerQuery.includes("sector") || lowerQuery.includes("tech")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Here's the market heatmap showing sector performance. Green indicates gains while red shows declines.",
        widget: { type: "heatmap", title: "Market Heatmap" },
      }
    }

    if (
      lowerQuery.includes("gainer") ||
      lowerQuery.includes("loser") ||
      lowerQuery.includes("trending") ||
      lowerQuery.includes("active")
    ) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are today's trending stocks showing top gainers, losers, and most active stocks.",
        widget: { type: "trending", title: "Trending Stocks" },
      }
    }

    if (lowerQuery.includes("news") || lowerQuery.includes("headline")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are the latest market news and headlines affecting the markets today.",
        widget: { type: "news", title: "Market News" },
      }
    }

    if (lowerQuery.includes("screener") || lowerQuery.includes("find stock") || lowerQuery.includes("discover")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Use the stock screener below to find stocks matching your criteria.",
        widget: { type: "screener", title: "Stock Screener" },
      }
    }

    // Check for specific stock symbols or company names
    const symbolMatch = query.match(
      /\b(AAPL|MSFT|GOOGL|AMZN|NVDA|TSLA|META|JPM|V|JNJ|WMT|PG|UNH|HD|BAC|XOM|PFE|ABBV|KO|PEP|COST|MRK|AVGO|TMO|MCD|CSCO|ABT|ACN|DHR|ADBE|CRM|NKE|TXN|LIN|NEE|PM|ORCL|INTC|AMD|QCOM|IBM)\b/i,
    )

    if (symbolMatch || lowerQuery.includes("chart") || lowerQuery.includes("price")) {
      const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : "SPY"
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `Here's the price chart for ${symbol}. You can interact with the chart to change timeframes and add technical indicators.`,
        widget: { type: "chart", symbol, title: `${symbol} Chart` },
      }
    }

    if (
      lowerQuery.includes("financial") ||
      lowerQuery.includes("earnings") ||
      lowerQuery.includes("revenue") ||
      lowerQuery.includes("profit")
    ) {
      const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : "AAPL"
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `Here's the financial breakdown for ${symbol} showing key metrics and performance indicators.`,
        widget: { type: "financials", symbol, title: `${symbol} Financials` },
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "I can help you with:\n\n• **Market Overview** - Today's market performance\n• **Stock Charts** - Just mention a ticker like NVDA or AAPL\n• **Sector Heatmaps** - See sector performance\n• **Trending Stocks** - Top gainers and losers\n• **Market News** - Latest headlines\n• **Stock Screener** - Find new opportunities\n\nWhat would you like to explore?",
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Market Intelligence</h1>
              <p className="text-sm text-muted-foreground">AI-powered market analysis and insights</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Live Data
          </Badge>
        </div>
      </header>

      {/* Chat and Widget Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="flex w-[420px] flex-col border-r border-border">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2.5",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.widget && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="mr-1 h-3 w-3" />
                          {message.widget.title}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-medium text-muted-foreground">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-secondary px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Queries */}
          <div className="border-t border-border p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-transparent"
                  onClick={() => handleSubmit(suggestion.query)}
                  disabled={isLoading}
                >
                  <suggestion.icon className="h-3 w-3" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(input)
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about markets, stocks, or narratives..."
                className="flex-1 bg-secondary"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Widget Display Area */}
        <div className="flex-1 overflow-auto bg-background p-6">
          {messages.filter((m) => m.widget).length > 0 ? (
            <div className="space-y-6">
              {messages
                .filter((m) => m.widget)
                .slice(-2) // Show last 2 widgets
                .map((message) => (
                  <TradingViewWidget
                    key={message.id}
                    type={message.widget!.type}
                    symbol={message.widget!.symbol}
                    title={message.widget!.title}
                  />
                ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Start Exploring</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask a question or use the quick actions to view market data
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
