import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Flame, Newspaper } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';

function TradingViewWidget({ config, height = 400 }: { config: Record<string, unknown>; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + (config.widgetType as string) + '.js';
    script.type = 'text/javascript';
    script.async = true;
    const { widgetType, ...rest } = config;
    script.innerHTML = JSON.stringify(rest);
    containerRef.current.appendChild(script);
  }, [config]);

  return <div ref={containerRef} style={{ height }} />;
}

const tickerTapeConfig = {
  widgetType: 'ticker-tape',
  symbols: [
    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
    { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
    { proName: 'FX_IDC:EURUSD', title: 'EUR to USD' },
    { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
    { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
  ],
  showSymbolLogo: true,
  isTransparent: true,
  displayMode: 'adaptive',
  colorTheme: 'dark',
  locale: 'en',
};

const marketOverviewConfig = {
  widgetType: 'market-overview',
  colorTheme: 'dark',
  dateRange: '1D',
  showChart: true,
  locale: 'en',
  width: '100%',
  height: '100%',
  isTransparent: true,
  showSymbolLogo: true,
  showFloatingTooltip: false,
  tabs: [
    {
      title: 'Indices',
      symbols: [
        { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
        { s: 'FOREXCOM:NSXUSD', d: 'US 100' },
        { s: 'FOREXCOM:DJI', d: 'Dow Jones' },
        { s: 'INDEX:NKY', d: 'Nikkei 225' },
      ],
      originalTitle: 'Indices',
    },
    {
      title: 'Futures',
      symbols: [
        { s: 'CME_MINI:ES1!', d: 'S&P 500' },
        { s: 'CME_MINI:NQ1!', d: 'Nasdaq 100' },
        { s: 'COMEX:GC1!', d: 'Gold' },
        { s: 'NYMEX:CL1!', d: 'Crude Oil' },
      ],
      originalTitle: 'Futures',
    },
    {
      title: 'Bonds',
      symbols: [
        { s: 'CBOT:ZB1!', d: 'T-Bond' },
        { s: 'CBOT:UB1!', d: 'Ultra T-Bond' },
        { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
      ],
      originalTitle: 'Bonds',
    },
    {
      title: 'Forex',
      symbols: [
        { s: 'FX:EURUSD', d: 'EUR to USD' },
        { s: 'FX:GBPUSD', d: 'GBP to USD' },
        { s: 'FX:USDJPY', d: 'USD to JPY' },
      ],
      originalTitle: 'Forex',
    },
  ],
};

const topMoversConfig = {
  widgetType: 'hotlists',
  colorTheme: 'dark',
  dateRange: '1D',
  exchange: 'US',
  showChart: true,
  locale: 'en',
  width: '100%',
  height: '100%',
  isTransparent: true,
  showSymbolLogo: true,
  largeChartUrl: '',
};

const heatmapConfig = {
  widgetType: 'stock-heatmap',
  exchanges: [],
  dataSource: 'SPX500',
  grouping: 'sector',
  blockSize: 'market_cap_basic',
  blockColor: 'change',
  locale: 'en',
  symbolUrl: '',
  colorTheme: 'dark',
  hasTopBar: false,
  isDataSetEnabled: false,
  isZoomEnabled: true,
  hasSymbolTooltip: true,
  isMonoSize: false,
  width: '100%',
  height: '100%',
};

const screenerConfig = {
  widgetType: 'screener',
  width: '100%',
  height: '100%',
  defaultColumn: 'overview',
  defaultScreen: 'most_capitalized',
  showToolbar: true,
  locale: 'en',
  market: 'america',
  colorTheme: 'dark',
  isTransparent: true,
};

const newsConfig = {
  widgetType: 'timeline',
  feedMode: 'all_symbols',
  isTransparent: true,
  displayMode: 'regular',
  width: '100%',
  height: '100%',
  colorTheme: 'dark',
  locale: 'en',
};

export default function MarketDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Market Dashboard
            <InfoTooltip content="Real-time market data powered by TradingView. Switch tabs to view market overview, heatmaps, top movers, and news." />
          </h1>
          <p className="text-muted-foreground">Real-time market data and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Live Data</span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <TradingViewWidget config={tickerTapeConfig} height={50} />
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Market Overview
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Market HeatMap
          </TabsTrigger>
          <TabsTrigger value="movers" className="flex items-center gap-2">
            <Flame className="h-4 w-4" /> Top Movers
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" /> Market News
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewWidget config={marketOverviewConfig} height={500} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" /> Top Movers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewWidget config={topMoversConfig} height={500} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>S&P 500 Heatmap</CardTitle></CardHeader>
              <CardContent>
                <TradingViewWidget config={heatmapConfig} height={600} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Stock Screener</CardTitle></CardHeader>
              <CardContent>
                <TradingViewWidget config={screenerConfig} height={600} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movers">
          <Card>
            <CardHeader><CardTitle>Top Movers</CardTitle></CardHeader>
            <CardContent>
              <TradingViewWidget config={topMoversConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news">
          <Card>
            <CardHeader><CardTitle>Market News</CardTitle></CardHeader>
            <CardContent>
              <TradingViewWidget config={newsConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
