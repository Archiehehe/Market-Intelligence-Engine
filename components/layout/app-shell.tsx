"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TrendingUp, Network, PieChart, Home, Wrench } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "Market Overview", href: "/", icon: Home },
  { name: "Narratives", href: "/narratives", icon: TrendingUp },
  { name: "Belief Graph", href: "/graph", icon: Network },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
  { name: "Tools", href: "/tools", icon: Wrench },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true)
    }, 100)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar",
            "transition-all duration-300 ease-in-out",
            isExpanded ? "w-56 shadow-xl shadow-black/20" : "w-16",
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Logo */}
          <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg bg-primary/10 transition-all duration-300",
                  isExpanded ? "h-9 w-9" : "h-8 w-8",
                )}
              >
                {/* Updated icon size */}
                <Home className={cn("text-primary transition-all duration-300", isExpanded ? "h-5 w-5" : "h-5 w-5")} />
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  isExpanded ? "w-auto opacity-100" : "w-0 opacity-0",
                )}
              >
                <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap">Market</span>
                <span className="text-xs text-muted-foreground block whitespace-nowrap">Intelligence</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1 py-4 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Tooltip key={item.name} delayDuration={isExpanded ? 1000 : 0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg px-3 transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span
                        className={cn(
                          "text-sm font-medium whitespace-nowrap transition-all duration-300",
                          isExpanded
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-2 pointer-events-none absolute",
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" sideOffset={12} className="font-medium">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 pl-16 transition-all duration-300 ease-in-out">{children}</main>
      </div>
    </TooltipProvider>
  )
}
