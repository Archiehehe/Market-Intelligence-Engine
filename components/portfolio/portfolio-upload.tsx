"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface ParsedRow {
  [key: string]: string | number
}

interface ColumnMapping {
  symbol: string | null
  name: string | null
  quantity: string | null
  price: string | null
  weight: string | null
  sector: string | null
}

interface MappedHolding {
  symbol: string
  name: string
  quantity: number
  price: number
  weight: number
  sector: string
  narrativeExposures: Array<{
    narrative: string
    exposure: number
    direction: "bullish" | "bearish" | "neutral"
  }>
}

// Simulated narrative mapping based on known tickers
const narrativeMappings: Record<
  string,
  Array<{ narrative: string; exposure: number; direction: "bullish" | "bearish" | "neutral" }>
> = {
  NVDA: [
    { narrative: "AI Capex Supercycle", exposure: 0.95, direction: "bullish" },
    { narrative: "Energy Transition Acceleration", exposure: 0.3, direction: "neutral" },
  ],
  MSFT: [
    { narrative: "AI Capex Supercycle", exposure: 0.75, direction: "bullish" },
    { narrative: "US Soft Landing", exposure: 0.4, direction: "bullish" },
  ],
  GOOGL: [
    { narrative: "AI Capex Supercycle", exposure: 0.7, direction: "bullish" },
    { narrative: "US Soft Landing", exposure: 0.35, direction: "bullish" },
  ],
  AAPL: [
    { narrative: "US Soft Landing", exposure: 0.6, direction: "bullish" },
    { narrative: "China Property Deleveraging", exposure: 0.25, direction: "bearish" },
  ],
  TSLA: [
    { narrative: "Energy Transition Acceleration", exposure: 0.85, direction: "bullish" },
    { narrative: "AI Capex Supercycle", exposure: 0.4, direction: "bullish" },
  ],
  AMZN: [
    { narrative: "AI Capex Supercycle", exposure: 0.65, direction: "bullish" },
    { narrative: "US Soft Landing", exposure: 0.55, direction: "bullish" },
  ],
  META: [
    { narrative: "AI Capex Supercycle", exposure: 0.7, direction: "bullish" },
    { narrative: "US Soft Landing", exposure: 0.4, direction: "bullish" },
  ],
  AMD: [{ narrative: "AI Capex Supercycle", exposure: 0.85, direction: "bullish" }],
  INTC: [
    { narrative: "AI Capex Supercycle", exposure: 0.5, direction: "neutral" },
    { narrative: "US Soft Landing", exposure: 0.3, direction: "bullish" },
  ],
  GLD: [{ narrative: "Dollar Dominance Erosion", exposure: 0.8, direction: "bullish" }],
  TLT: [
    { narrative: "US Soft Landing", exposure: 0.7, direction: "bullish" },
    { narrative: "China Property Deleveraging", exposure: 0.3, direction: "bullish" },
  ],
  SPY: [
    { narrative: "US Soft Landing", exposure: 0.8, direction: "bullish" },
    { narrative: "AI Capex Supercycle", exposure: 0.35, direction: "bullish" },
  ],
  QQQ: [
    { narrative: "AI Capex Supercycle", exposure: 0.65, direction: "bullish" },
    { narrative: "US Soft Landing", exposure: 0.55, direction: "bullish" },
  ],
  ENPH: [{ narrative: "Energy Transition Acceleration", exposure: 0.9, direction: "bullish" }],
  NEE: [{ narrative: "Energy Transition Acceleration", exposure: 0.75, direction: "bullish" }],
  FXI: [{ narrative: "China Property Deleveraging", exposure: 0.85, direction: "bearish" }],
}

// Common column name variations for auto-detection
const columnPatterns: Record<keyof ColumnMapping, string[]> = {
  symbol: ["symbol", "ticker", "sym", "stock", "code", "security"],
  name: ["name", "company", "description", "security name", "holding"],
  quantity: ["quantity", "qty", "shares", "units", "amount", "holdings"],
  price: ["price", "current price", "last price", "market price", "value per share", "cost", "avg cost"],
  weight: ["weight", "allocation", "percent", "pct", "%", "portfolio weight", "alloc"],
  sector: ["sector", "industry", "category", "asset class", "type"],
}

interface PortfolioUploadProps {
  onUploadComplete: (holdings: MappedHolding[]) => void
}

export function PortfolioUpload({ onUploadComplete }: PortfolioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    symbol: null,
    name: null,
    quantity: null,
    price: null,
    weight: null,
    sector: null,
  })
  const [step, setStep] = useState<"upload" | "map" | "preview" | "complete">("upload")
  const [error, setError] = useState<string | null>(null)
  const [mappedHoldings, setMappedHoldings] = useState<MappedHolding[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectColumnMapping = useCallback((headers: string[]): ColumnMapping => {
    const newMapping: ColumnMapping = {
      symbol: null,
      name: null,
      quantity: null,
      price: null,
      weight: null,
      sector: null,
    }

    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

    for (const [field, patterns] of Object.entries(columnPatterns)) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i]
        if (patterns.some((p) => header.includes(p) || header === p)) {
          newMapping[field as keyof ColumnMapping] = headers[i]
          break
        }
      }
    }

    return newMapping
  }, [])

  const parseFile = useCallback(
    async (file: File) => {
      setError(null)
      setIsProcessing(true)

      try {
        const extension = file.name.split(".").pop()?.toLowerCase()

        let data: ParsedRow[] = []
        let headers: string[] = []

        if (extension === "csv") {
          const text = await file.text()
          const lines = text.split("\n").filter((line) => line.trim())
          headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""))

          data = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""))
            const row: ParsedRow = {}
            headers.forEach((header, i) => {
              row[header] = values[i] || ""
            })
            return row
          })
        } else if (extension === "xlsx" || extension === "xls") {
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 1 })

          if (jsonData.length > 0) {
            headers = (jsonData[0] as unknown as string[]).map((h) => String(h || "").trim())
            data = jsonData.slice(1).map((row) => {
              const rowArray = row as unknown as (string | number)[]
              const obj: ParsedRow = {}
              headers.forEach((header, i) => {
                obj[header] = rowArray[i] ?? ""
              })
              return obj
            })
          }
        } else {
          throw new Error("Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)")
        }

        // Filter out empty rows
        data = data.filter((row) => Object.values(row).some((v) => v !== "" && v !== undefined && v !== null))

        if (data.length === 0) {
          throw new Error("No data found in the file")
        }

        setParsedData(data)
        setColumns(headers)

        // Auto-detect column mapping
        const detectedMapping = detectColumnMapping(headers)
        setMapping(detectedMapping)

        setStep("map")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file")
      } finally {
        setIsProcessing(false)
      }
    },
    [detectColumnMapping],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        setFile(droppedFile)
        parseFile(droppedFile)
      }
    },
    [parseFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        setFile(selectedFile)
        parseFile(selectedFile)
      }
    },
    [parseFile],
  )

  const processMapping = useCallback(() => {
    if (!mapping.symbol) {
      setError("Please map at least the Symbol column")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const holdings: MappedHolding[] = parsedData
        .map((row) => {
          const symbol = String(row[mapping.symbol!] || "")
            .toUpperCase()
            .trim()
          if (!symbol) return null

          const quantity = mapping.quantity ? Number.parseFloat(String(row[mapping.quantity])) || 0 : 0
          const price = mapping.price ? Number.parseFloat(String(row[mapping.price])) || 0 : 0
          let weight = mapping.weight ? Number.parseFloat(String(row[mapping.weight]).replace("%", "")) : 0

          // Normalize weight if it's over 1 (assuming percentage format)
          if (weight > 1) weight = weight / 100

          const name = mapping.name ? String(row[mapping.name] || symbol) : symbol
          const sector = mapping.sector ? String(row[mapping.sector] || "Unknown") : "Unknown"

          // Get narrative exposures for known symbols
          const narrativeExposures = narrativeMappings[symbol] || [
            { narrative: "US Soft Landing", exposure: 0.3, direction: "neutral" as const },
          ]

          return {
            symbol,
            name,
            quantity,
            price,
            weight,
            sector,
            narrativeExposures,
          }
        })
        .filter((h): h is MappedHolding => h !== null)

      // Calculate weights if not provided
      if (!mapping.weight && mapping.quantity && mapping.price) {
        const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.price, 0)
        if (totalValue > 0) {
          holdings.forEach((h) => {
            h.weight = (h.quantity * h.price) / totalValue
          })
        }
      }

      // If still no weights, distribute equally
      if (holdings.every((h) => h.weight === 0)) {
        const equalWeight = 1 / holdings.length
        holdings.forEach((h) => {
          h.weight = equalWeight
        })
      }

      setMappedHoldings(holdings)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process data")
    } finally {
      setIsProcessing(false)
    }
  }, [mapping, parsedData])

  const handleComplete = useCallback(() => {
    onUploadComplete(mappedHoldings)
    setStep("complete")
  }, [mappedHoldings, onUploadComplete])

  const handleReset = useCallback(() => {
    setFile(null)
    setParsedData([])
    setColumns([])
    setMapping({
      symbol: null,
      name: null,
      quantity: null,
      price: null,
      weight: null,
      sector: null,
    })
    setMappedHoldings([])
    setStep("upload")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Portfolio
            </CardTitle>
            <CardDescription>Import your portfolio from CSV or Excel files</CardDescription>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 bg-transparent">
              <RefreshCw className="h-3 w-3" />
              Start Over
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {(["upload", "map", "preview", "complete"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["map", "preview", "complete"].indexOf(step) >= i
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:inline",
                  step === s ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="portfolio-upload"
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-1">
              {isDragging ? "Drop your file here" : "Drag & drop your portfolio file"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">Supports CSV, XLSX, and XLS formats</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Browse Files"}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Column names are flexible - we'll help you map them in the next step
            </p>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === "map" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">File loaded successfully</p>
                <p className="text-xs text-muted-foreground">
                  {file?.name} - {parsedData.length} rows detected
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Map Your Columns</h4>
              <p className="text-xs text-muted-foreground">
                We've auto-detected some columns. Please verify and adjust as needed.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.keys(mapping) as Array<keyof ColumnMapping>).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-1">
                      {field}
                      {field === "symbol" && <span className="text-destructive">*</span>}
                    </label>
                    <Select
                      value={mapping[field] || "none"}
                      onValueChange={(value) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field]: value === "none" ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not mapped --</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview first few rows */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Data Preview (first 3 rows)
              </h4>
              <div className="overflow-x-auto rounded border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.slice(0, 6).map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>
                        {columns.slice(0, 6).map((col) => (
                          <TableCell key={col} className="text-xs">
                            {String(row[col] || "-")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={processMapping} disabled={isProcessing || !mapping.symbol}>
                {isProcessing ? "Processing..." : "Continue to Preview"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview Mapped Data */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{mappedHoldings.length} holdings ready to import</p>
                <p className="text-xs text-muted-foreground">Review narrative exposures and weights below</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-border max-h-96">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="text-xs">Symbol</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs text-right">Weight</TableHead>
                    <TableHead className="text-xs text-right">Quantity</TableHead>
                    <TableHead className="text-xs">Narrative Exposures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedHoldings.map((holding, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm font-medium">{holding.symbol}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{holding.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {(holding.weight * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {holding.quantity > 0 ? holding.quantity.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {holding.narrativeExposures.slice(0, 2).map((exp, j) => (
                            <Badge
                              key={j}
                              variant="outline"
                              className={cn(
                                "text-xs",
                                exp.direction === "bullish"
                                  ? "border-primary/50 text-primary"
                                  : exp.direction === "bearish"
                                    ? "border-destructive/50 text-destructive"
                                    : "border-muted-foreground/50",
                              )}
                            >
                              {exp.narrative.slice(0, 15)}
                              {exp.narrative.length > 15 ? "..." : ""} ({Math.round(exp.exposure * 100)}%)
                            </Badge>
                          ))}
                          {holding.narrativeExposures.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{holding.narrativeExposures.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("map")}>
                Back to Mapping
              </Button>
              <Button onClick={handleComplete}>Import Portfolio</Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="text-center py-8">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/20 mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Portfolio Imported Successfully</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {mappedHoldings.length} holdings have been added with narrative exposure analysis
            </p>
            <Button variant="outline" onClick={handleReset}>
              Upload Another Portfolio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
