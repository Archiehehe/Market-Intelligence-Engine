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
    { proName: 'AMEX:SPY', title: 'S&P 500' },
    { proName: 'NASDAQ:QQQ', title: 'Nasdaq 100' },
    { proName: 'AMEX:DIA', title: 'Dow Jones' },
    { proName: 'AMEX:IWM', title: 'Russell 2000' },
    { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
    { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
    { proName: 'COMEX:GC1!', title: 'Gold' },
    { proName: 'NYMEX:CL1!', title: 'Crude Oil' },
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
  showFloatingTooltip: true,
  tabs: [
    {
      title: 'Indices',
      symbols: [
        { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
        { s: 'FOREXCOM:NSXUSD', d: 'Nasdaq 100' },
        { s: 'FOREXCOM:DJI', d: 'Dow Jones' },
        { s: 'INDEX:RUT', d: 'Russell 2000' },
        { s: 'INDEX:VIX', d: 'VIX' },
      ],
      originalTitle: 'Indices',
    },
    {
      title: 'Mega-Cap Tech',
      symbols: [
        { s: 'NASDAQ:AAPL', d: 'Apple' },
        { s: 'NASDAQ:MSFT', d: 'Microsoft' },
        { s: 'NASDAQ:NVDA', d: 'NVIDIA' },
        { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
        { s: 'NASDAQ:AMZN', d: 'Amazon' },
        { s: 'NASDAQ:META', d: 'Meta' },
      ],
      originalTitle: 'Mega-Cap Tech',
    },
    {
      title: 'Sector ETFs',
      symbols: [
        { s: 'AMEX:XLF', d: 'Financials' },
        { s: 'AMEX:XLE', d: 'Energy' },
        { s: 'AMEX:XLK', d: 'Technology' },
        { s: 'AMEX:XLV', d: 'Healthcare' },
        { s: 'AMEX:XLI', d: 'Industrials' },
      ],
      originalTitle: 'Sector ETFs',
    },
    {
      title: 'Commodities',
      symbols: [
        { s: 'TVC:GOLD', d: 'Gold' },
        { s: 'TVC:USOIL', d: 'Crude Oil WTI' },
        { s: 'TVC:SILVER', d: 'Silver' },
        { s: 'NYMEX:NG1!', d: 'Natural Gas' },
      ],
      originalTitle: 'Commodities',
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
            <InfoTooltip content="Real-time market data powered by TradingView. Uses real ETFs and stocks — not CFDs or forex derivatives." />
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
            <BarChart3 className="h-4 w-4" /> Heatmap
          </TabsTrigger>
          <TabsTrigger value="movers" className="flex items-center gap-2">
            <Flame className="h-4 w-4" /> Top Movers
          </TabsTrigger>
          <TabsTrigger value="screener" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Screener
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" /> News
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <TradingViewWidget config={marketOverviewConfig} height={550} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardContent className="pt-6">
              <TradingViewWidget config={heatmapConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movers">
          <Card>
            <CardContent className="pt-6">
              <TradingViewWidget config={topMoversConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screener">
          <Card>
            <CardContent className="pt-6">
              <TradingViewWidget config={screenerConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news">
          <Card>
            <CardContent className="pt-6">
              <TradingViewWidget config={newsConfig} height={600} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}