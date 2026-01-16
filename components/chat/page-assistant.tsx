"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Send, Loader2, Bot, MessageCircle, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SuggestedQuestion {
  label: string
  question: string
}

interface PageAssistantProps {
  context: "narratives" | "graph" | "portfolio" | "intelligence" | "market" | "tools"
  contextData?: Record<string, unknown>
}

const contextConfig: Record<
  string,
  {
    title: string
    description: string
    suggestedQuestions: SuggestedQuestion[]
    systemPrompt: string
  }
> = {
  narratives: {
    title: "Narrative Assistant",
    description: "Ask about market narratives and investment theses",
    suggestedQuestions: [
      { label: "Top narratives", question: "What are the strongest narratives right now?" },
      { label: "Declining confidence", question: "Which narratives are losing confidence and why?" },
      { label: "AI exposure", question: "How can I get exposure to the AI narrative?" },
    ],
    systemPrompt:
      "You are a market intelligence assistant specializing in narrative analysis. Help users understand investment narratives, their confidence levels, supporting evidence, and implications for portfolios.",
  },
  graph: {
    title: "Graph Assistant",
    description: "Understand narrative relationships and connections",
    suggestedQuestions: [
      { label: "Conflicts", question: "What are the main conflicting narratives?" },
      { label: "Dependencies", question: "Which narratives depend on each other?" },
      { label: "Risk clusters", question: "Are there any dangerous narrative clusters?" },
    ],
    systemPrompt:
      "You are a market intelligence assistant specializing in belief graph analysis. Help users understand how narratives relate to each other, identify conflicts, dependencies, and systemic risks.",
  },
  portfolio: {
    title: "Portfolio Assistant",
    description: "Analyze portfolio exposure and risks",
    suggestedQuestions: [
      { label: "Fragility", question: "What makes my portfolio fragile?" },
      { label: "Concentration", question: "Am I too concentrated in any narrative?" },
      { label: "Hedging", question: "How can I hedge my narrative exposure?" },
    ],
    systemPrompt:
      "You are a portfolio intelligence assistant. Help users understand their portfolio's exposure to market narratives, identify concentration risks, fragility points, and suggest improvements.",
  },
  intelligence: {
    title: "Intelligence Assistant",
    description: "Extract insights from market data",
    suggestedQuestions: [
      { label: "Latest signals", question: "What are the most important recent signals?" },
      { label: "Contradictions", question: "Is there any contradicting evidence I should know about?" },
      { label: "Emerging themes", question: "Are there any emerging narratives I'm missing?" },
    ],
    systemPrompt:
      "You are a market intelligence assistant specializing in evidence analysis. Help users extract signals from market data, identify emerging themes, and synthesize information into actionable insights.",
  },
  market: {
    title: "Market Assistant",
    description: "Get real-time market insights",
    suggestedQuestions: [
      { label: "Market sentiment", question: "What's the overall market sentiment today?" },
      { label: "Sector rotation", question: "Which sectors are seeing the most rotation?" },
      { label: "Key levels", question: "What are the key technical levels to watch?" },
    ],
    systemPrompt:
      "You are a market intelligence assistant. Help users understand current market conditions, sector performance, and key developments affecting the markets.",
  },
  tools: {
    title: "Tools Assistant",
    description: "Get help with research tools and workflows",
    suggestedQuestions: [
      { label: "Tool workflow", question: "How should I use these tools together?" },
      { label: "Macro research", question: "What's the best tool for researching macro themes?" },
      { label: "Verify evidence", question: "How can I verify evidence for my narratives?" },
    ],
    systemPrompt:
      "You are a research tools assistant. Help users understand how to effectively use various research tools, create efficient workflows, and integrate insights from multiple sources into their narrative analysis.",
  },
}

const defaultConfig = {
  title: "Assistant",
  description: "Ask me anything",
  suggestedQuestions: [{ label: "Help", question: "What can you help me with?" }],
  systemPrompt: "You are a helpful assistant.",
}

export function PageAssistant({ context, contextData }: PageAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const config = contextConfig[context] || defaultConfig

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const generateResponse = useCallback(
    async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
      try {
        // Call the AI API with full conversation history
        const response = await fetch("/api/chat/page-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            context,
            systemPrompt: config.systemPrompt,
            conversationHistory: conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No response body")
        }

        const decoder = new TextDecoder()
        let fullResponse = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += decoder.decode(value, { stream: true })
        }

        return fullResponse
      } catch (error) {
        console.error("Failed to generate response:", error)
        // Fallback to basic response if API fails
        return `I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment, or ask about specific topics like:

- Market narratives and confidence levels
- Portfolio exposure analysis
- Evidence and assumptions for investment theses
- Risk assessment and hedging strategies

What would you like to know more about?`
      }
    },
    [context, config.systemPrompt],
  )

  const handleSubmit = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

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
      const response = await generateResponse(messageText, updatedMessages)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages([...updatedMessages, assistantMessage])
    } catch (error) {
      console.error("Failed to generate response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            size="icon"
            aria-label="Open assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-base">{config.title}</SheetTitle>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-secondary mb-4">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">How can I help you today?</p>

                  {/* Suggested questions */}
                  <div className="space-y-2">
                    {config.suggestedQuestions.map((sq, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3 bg-transparent"
                        onClick={() => handleSubmit(sq.question)}
                      >
                        <span className="text-xs">{sq.question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
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
                placeholder="Ask a follow-up question..."
                className="flex-1 bg-secondary"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
