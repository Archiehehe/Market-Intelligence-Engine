import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Terminal, Zap, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
  {
    id: 'narrative-terminal',
    name: 'Narrative Terminal',
    description: 'Single-stock market intelligence engine. Enter a stock ticker to analyze its narrative exposure, key assumptions, and market sentiment.',
    url: 'https://marketnarrative.vercel.app/',
    icon: Terminal,
    status: 'Live' as const,
  },
  {
    id: 'snapjudgement',
    name: 'SnapJudgement',
    description: 'Rapid sentiment analysis and opinion formation tool for market events and news.',
    url: 'https://snapjudgement.vercel.app/',
    icon: Zap,
    status: 'Live' as const,
  },
  {
    id: 'dipsnipe',
    name: 'DipSnipe',
    description: 'Identify and analyze market dips with statistical rigor. Find oversold conditions and mean-reversion opportunities.',
    url: 'https://archiehehe.shinyapps.io/DipSnipe/',
    icon: TrendingDown,
    status: 'Live' as const,
  },
  {
    id: 'sector-momentum',
    name: 'Sector Momentum',
    description: 'Track sector rotation and momentum across the market. Identify which sectors are leading and lagging.',
    url: 'https://archiehehe.shinyapps.io/SectorMomentumTracker/',
    icon: BarChart3,
    status: 'Live' as const,
  },
];

export default function ResearchTools() {
  const [activeTab, setActiveTab] = useState(tools[0].id);

  const activeTool = tools.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Research Tools</h1>
        <p className="text-muted-foreground">Specialized tools for narrative analysis</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tools.map(tool => (
            <TabsTrigger key={tool.id} value={tool.id} className="flex items-center gap-2">
              <tool.icon className="h-4 w-4" />
              {tool.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tools.map(tool => (
          <TabsContent key={tool.id} value={tool.id} className="space-y-4">
            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <tool.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{tool.name}</h2>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {tool.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      Open in New Tab <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <iframe
                src={tool.url}
                className="w-full border-0"
                style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}
                title={tool.name}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
