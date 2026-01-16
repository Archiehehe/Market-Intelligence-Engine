"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Bot, User, TrendingUp, TrendingDown, Sparkles, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Narrative {
  id: string
  name: string
  summary: string
  confidence_score: number
  confidence_trend: string
  direction: string
}

const narrativesFetcher = async (): Promise<Narrative[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("narratives")
    .select("id, name, summary, confidence_score, confidence_trend, direction")
    .order("confidence_score", { ascending: false })

  if (error) {
    console.error("Failed to fetch narratives:", error)
    return []
  }
  return data || []
}

const suggestedPrompts = [
  { label: "Market Summary", prompt: "Give me a summary of all current market narratives and their confidence levels" },
  { label: "AI Sector Analysis", prompt: "Analyze the AI and technology narratives in detail" },
  { label: "Risk Assessment", prompt: "What are the biggest risks across all narratives right now?" },
  { label: "Opportunity Finder", prompt: "Which narratives have the best risk/reward setup currently?" },
]

export function IntelligenceChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: narratives, error: narrativesError } = useSWR("narratives-for-chat", narrativesFetcher)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    setError(null)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/intelligence/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          narratives: narratives || [],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to get response")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages([...updatedMessages, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantMessage.content += chunk

        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { ...assistantMessage }
          return newMessages
        })
      }
    } catch (err) {
      console.error("Failed to generate response:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)

      const errorResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages([...updatedMessages, errorResponseMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col border-border bg-card overflow-hidden">
          <CardHeader className="shrink-0 border-b border-border py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Intelligence Chat</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    AI-powered narrative analysis ({narratives?.length || 0} narratives loaded)
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearChat} className="gap-1 text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Error banner */}
          {error && (
            <div className="shrink-0 px-4 py-2 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Ask questions about market narratives, analyze risks, or discover opportunities. I have access to
                    all your narrative data and evidence. Follow-up questions are fully supported.
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
                    {suggestedPrompts.map((sp, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="h-auto py-3 px-4 justify-start text-left bg-transparent"
                        onClick={() => handleSubmit(sp.prompt)}
                        disabled={isLoading}
                      >
                        <div>
                          <p className="text-sm font-medium">{sp.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{sp.prompt}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "")}>
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="shrink-0 border-t border-border p-4">
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
                placeholder="Ask about market narratives or follow up on previous responses..."
                className="flex-1 bg-secondary"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Sidebar with narratives */}
      <div className="w-80 shrink-0">
        <Card className="border-border bg-card h-full">
          <CardHeader className="py-3 border-b border-border">
            <CardTitle className="text-sm">Available Narratives</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <CardContent className="p-3 space-y-2">
              {narrativesError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive">Failed to load narratives</p>
                </div>
              )}
              {!narrativesError && (!narratives || narratives.length === 0) && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">
                    No narratives found. Run the database seed scripts to add data.
                  </p>
                </div>
              )}
              {narratives?.slice(0, 10).map((narrative) => (
                <button
                  key={narrative.id}
                  onClick={() =>
                    handleSubmit(`Tell me more about the "${narrative.name}" narrative and its current outlook.`)
                  }
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{narrative.name}</span>
                    {narrative.confidence_trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                    ) : narrative.confidence_trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        narrative.confidence_score >= 0.7
                          ? "bg-primary/20 text-primary"
                          : narrative.confidence_score >= 0.5
                            ? "bg-accent/20 text-accent"
                            : "bg-destructive/20 text-destructive",
                      )}
                    >
                      {Math.round(narrative.confidence_score * 100)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{narrative.direction}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
