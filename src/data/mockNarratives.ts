import { Narrative, BeliefEdge, Portfolio, Asset, MarketOverview } from '@/types/narrative';

// Helper to create dates relative to now
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// Core market narratives - the beliefs driving the market
export const mockNarratives: Narrative[] = [
  {
    id: 'ai-capex-supercycle',
    name: 'AI Capex Supercycle',
    summary: 'Massive capital expenditure cycle driven by AI infrastructure buildout. Hyperscalers spending unprecedented amounts on GPUs, data centers, and AI infrastructure.',
    confidence: { score: 78, trend: 'up', lastUpdated: daysAgo(1) },
    assumptions: [
      { id: 'a1', text: 'AI model scaling continues to yield improvements', fragilityScore: 35 },
      { id: 'a2', text: 'Enterprise AI adoption accelerates', fragilityScore: 25 },
      { id: 'a3', text: 'GPU supply constraints persist', fragilityScore: 45 },
      { id: 'a4', text: 'No major AI regulation impacts spending', fragilityScore: 55 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'NVIDIA Earnings', description: 'Data center revenue up 400% YoY', timestamp: daysAgo(14), weight: 0.9 },
      { id: 'e2', source: 'Microsoft Capex', description: 'Azure AI spending guidance raised 30%', timestamp: daysAgo(7), weight: 0.85 },
      { id: 'e3', source: 'Meta AI Plans', description: 'Zuckerberg commits to $40B AI infrastructure', timestamp: daysAgo(21), weight: 0.8 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Goldman Research', description: 'Questions ROI on AI spending at current levels', timestamp: daysAgo(5), weight: 0.4 },
    ],
    decay: { halfLifeDays: 30, lastReinforced: daysAgo(1) },
    relatedNarratives: { reinforces: ['energy-demand-surge'], conflicts: ['tech-valuation-bubble'], overlaps: [] },
    affectedAssets: [
      { ticker: 'NVDA', name: 'NVIDIA', exposureWeight: 0.95 },
      { ticker: 'AMD', name: 'AMD', exposureWeight: 0.75 },
      { ticker: 'MSFT', name: 'Microsoft', exposureWeight: 0.6 },
      { ticker: 'GOOGL', name: 'Alphabet', exposureWeight: 0.55 },
      { ticker: 'AVGO', name: 'Broadcom', exposureWeight: 0.7 },
      { ticker: 'TSM', name: 'TSMC', exposureWeight: 0.8 },
    ],
    history: [
      { timestamp: daysAgo(30), confidenceScore: 65, summary: 'Early signs of sustained AI investment' },
      { timestamp: daysAgo(14), confidenceScore: 72, summary: 'Q4 earnings confirm thesis' },
    ],
    createdAt: daysAgo(90),
    tags: ['technology', 'AI', 'infrastructure', 'semiconductors'],
  },
  {
    id: 'us-soft-landing',
    name: 'US Soft Landing',
    summary: 'The Federal Reserve successfully navigates inflation back to target without causing a recession. Employment remains strong, consumer spending resilient.',
    confidence: { score: 62, trend: 'flat', lastUpdated: daysAgo(2) },
    assumptions: [
      { id: 'a1', text: 'Inflation continues gradual decline', fragilityScore: 40 },
      { id: 'a2', text: 'Labor market remains resilient', fragilityScore: 35 },
      { id: 'a3', text: 'No external shocks (geopolitical, energy)', fragilityScore: 60 },
      { id: 'a4', text: 'Fed executes rate cuts appropriately', fragilityScore: 45 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'BLS Employment', description: 'Unemployment steady at 3.7%', timestamp: daysAgo(10), weight: 0.7 },
      { id: 'e2', source: 'CPI Report', description: 'Core inflation at 3.2%, continuing downtrend', timestamp: daysAgo(15), weight: 0.75 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Regional Fed Survey', description: 'Manufacturing weakness spreading', timestamp: daysAgo(8), weight: 0.35 },
      { id: 'c2', source: 'Credit Card Data', description: 'Delinquencies rising among lower income', timestamp: daysAgo(12), weight: 0.4 },
    ],
    decay: { halfLifeDays: 14, lastReinforced: daysAgo(2) },
    relatedNarratives: { reinforces: ['fed-rate-cuts'], conflicts: ['recession-risk'], overlaps: [] },
    affectedAssets: [
      { ticker: 'SPY', name: 'S&P 500 ETF', exposureWeight: 0.6 },
      { ticker: 'XLY', name: 'Consumer Discretionary', exposureWeight: 0.7 },
      { ticker: 'XLF', name: 'Financials', exposureWeight: 0.5 },
    ],
    history: [
      { timestamp: daysAgo(60), confidenceScore: 55, summary: 'Uncertainty about inflation path' },
      { timestamp: daysAgo(30), confidenceScore: 60, summary: 'Improving economic data' },
    ],
    createdAt: daysAgo(180),
    tags: ['macro', 'fed', 'economy', 'inflation'],
  },
  {
    id: 'tech-valuation-bubble',
    name: 'Tech Valuation Bubble',
    summary: 'Current technology valuations, particularly in AI-related names, are disconnected from fundamentals. Echoes of dot-com bubble with excessive optimism.',
    confidence: { score: 45, trend: 'down', lastUpdated: daysAgo(3) },
    assumptions: [
      { id: 'a1', text: 'Valuation multiples are historically extreme', fragilityScore: 30 },
      { id: 'a2', text: 'AI revenue growth will disappoint vs expectations', fragilityScore: 65 },
      { id: 'a3', text: 'Rate normalization will compress multiples', fragilityScore: 50 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Shiller PE', description: 'CAPE ratio at 95th percentile', timestamp: daysAgo(30), weight: 0.6 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Earnings Growth', description: 'Mag 7 delivering 25%+ earnings growth', timestamp: daysAgo(14), weight: 0.7 },
      { id: 'c2', source: 'Cash Flow', description: 'Big tech generating record free cash flow', timestamp: daysAgo(20), weight: 0.65 },
    ],
    decay: { halfLifeDays: 21, lastReinforced: daysAgo(10) },
    relatedNarratives: { reinforces: ['rotation-to-value'], conflicts: ['ai-capex-supercycle'], overlaps: [] },
    affectedAssets: [
      { ticker: 'QQQ', name: 'Nasdaq 100 ETF', exposureWeight: -0.7 },
      { ticker: 'NVDA', name: 'NVIDIA', exposureWeight: -0.85 },
      { ticker: 'TSLA', name: 'Tesla', exposureWeight: -0.8 },
    ],
    history: [],
    createdAt: daysAgo(120),
    tags: ['valuation', 'risk', 'technology', 'bubble'],
  },
  {
    id: 'energy-demand-surge',
    name: 'Energy Demand Surge',
    summary: 'AI data centers and electrification are driving unprecedented electricity demand growth. Utility capex cycles accelerating with implications for power generation.',
    confidence: { score: 71, trend: 'up', lastUpdated: daysAgo(2) },
    assumptions: [
      { id: 'a1', text: 'AI data centers consume massive power', fragilityScore: 20 },
      { id: 'a2', text: 'Grid infrastructure requires major upgrades', fragilityScore: 25 },
      { id: 'a3', text: 'Renewable transition continues', fragilityScore: 40 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'EIA Report', description: 'Data center electricity demand up 30% YoY', timestamp: daysAgo(20), weight: 0.8 },
      { id: 'e2', source: 'Utility Guidance', description: 'Major utilities raising capex forecasts', timestamp: daysAgo(14), weight: 0.75 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Efficiency Gains', description: 'New GPU architectures more power efficient', timestamp: daysAgo(30), weight: 0.3 },
    ],
    decay: { halfLifeDays: 45, lastReinforced: daysAgo(2) },
    relatedNarratives: { reinforces: ['ai-capex-supercycle'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'VST', name: 'Vistra', exposureWeight: 0.85 },
      { ticker: 'CEG', name: 'Constellation Energy', exposureWeight: 0.8 },
      { ticker: 'NEE', name: 'NextEra Energy', exposureWeight: 0.6 },
      { ticker: 'SO', name: 'Southern Company', exposureWeight: 0.45 },
    ],
    history: [],
    createdAt: daysAgo(60),
    tags: ['energy', 'utilities', 'AI', 'infrastructure'],
  },
  {
    id: 'fed-rate-cuts',
    name: 'Fed Rate Cuts 2025',
    summary: 'The Federal Reserve will cut rates multiple times in 2025 as inflation normalizes. Market pricing 3-4 cuts.',
    confidence: { score: 58, trend: 'down', lastUpdated: daysAgo(1) },
    assumptions: [
      { id: 'a1', text: 'Inflation reaches 2% target', fragilityScore: 50 },
      { id: 'a2', text: 'No reacceleration in economy', fragilityScore: 45 },
      { id: 'a3', text: 'Fed follows data, not politics', fragilityScore: 35 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Fed Dot Plot', description: 'Median forecast shows 75bps cuts', timestamp: daysAgo(30), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'January CPI', description: 'Hot inflation print raises doubts', timestamp: daysAgo(5), weight: 0.55 },
      { id: 'c2', source: 'Jobs Report', description: 'Strong payrolls suggest no urgency to cut', timestamp: daysAgo(10), weight: 0.5 },
    ],
    decay: { halfLifeDays: 14, lastReinforced: daysAgo(5) },
    relatedNarratives: { reinforces: ['us-soft-landing'], conflicts: ['inflation-sticky'], overlaps: [] },
    affectedAssets: [
      { ticker: 'TLT', name: 'Long-Term Treasury ETF', exposureWeight: 0.9 },
      { ticker: 'XLF', name: 'Financials', exposureWeight: -0.4 },
      { ticker: 'XLU', name: 'Utilities', exposureWeight: 0.5 },
    ],
    history: [],
    createdAt: daysAgo(45),
    tags: ['macro', 'fed', 'rates', 'bonds'],
  },
  {
    id: 'china-stimulus',
    name: 'China Stimulus Pivot',
    summary: 'Chinese authorities are shifting to aggressive stimulus to combat deflation and property crisis. Policy pivot could reignite global growth.',
    confidence: { score: 52, trend: 'up', lastUpdated: daysAgo(3) },
    assumptions: [
      { id: 'a1', text: 'CCP prioritizes growth over deleveraging', fragilityScore: 40 },
      { id: 'a2', text: 'Stimulus transmission works effectively', fragilityScore: 55 },
      { id: 'a3', text: 'Property sector stabilizes', fragilityScore: 65 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'PBOC Policy', description: 'Rate cuts and RRR reductions announced', timestamp: daysAgo(10), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Property Data', description: 'Home sales still declining 20% YoY', timestamp: daysAgo(8), weight: 0.5 },
    ],
    decay: { halfLifeDays: 21, lastReinforced: daysAgo(3) },
    relatedNarratives: { reinforces: ['commodity-supercycle'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'FXI', name: 'China Large Cap ETF', exposureWeight: 0.9 },
      { ticker: 'BABA', name: 'Alibaba', exposureWeight: 0.8 },
      { ticker: 'FCX', name: 'Freeport McMoran', exposureWeight: 0.6 },
      { ticker: 'PDD', name: 'PDD Holdings', exposureWeight: 0.7 },
    ],
    history: [],
    createdAt: daysAgo(30),
    tags: ['china', 'stimulus', 'macro', 'commodities'],
  },
  // ===== NEW NARRATIVES =====
  {
    id: 'japan-reflation',
    name: 'Japan Reflation Trade',
    summary: 'Japan exits decades of deflation with BOJ tightening, wage growth accelerating, and corporate governance reforms driving equity rerating. Yen weakness amplifies export earnings.',
    confidence: { score: 68, trend: 'up', lastUpdated: daysAgo(2) },
    assumptions: [
      { id: 'a1', text: 'Wage-price spiral sustains inflation above 2%', fragilityScore: 40 },
      { id: 'a2', text: 'Corporate governance reforms continue', fragilityScore: 25 },
      { id: 'a3', text: 'BOJ normalizes policy without market crash', fragilityScore: 55 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Shunto Wage Negotiations', description: 'Largest wage increases in 30+ years', timestamp: daysAgo(10), weight: 0.85 },
      { id: 'e2', source: 'Tokyo CPI', description: 'Core inflation above 2% for 18 months', timestamp: daysAgo(5), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Yen Carry Unwind', description: 'Sharp yen strengthening risks equity selloff', timestamp: daysAgo(15), weight: 0.5 },
    ],
    decay: { halfLifeDays: 30, lastReinforced: daysAgo(2) },
    relatedNarratives: { reinforces: [], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'EWJ', name: 'iShares Japan ETF', exposureWeight: 0.85 },
      { ticker: 'TM', name: 'Toyota Motor', exposureWeight: 0.6 },
      { ticker: 'SMFG', name: 'Sumitomo Mitsui', exposureWeight: 0.7 },
    ],
    history: [],
    createdAt: daysAgo(60),
    tags: ['japan', 'macro', 'equities', 'currency'],
  },
  {
    id: 'de-dollarization',
    name: 'De-Dollarization',
    summary: 'BRICS nations and others reducing USD reserves and trade settlement. Gold accumulation by central banks accelerating. Gradual shift but structurally significant.',
    confidence: { score: 44, trend: 'flat', lastUpdated: daysAgo(5) },
    assumptions: [
      { id: 'a1', text: 'BRICS trade settlement alternatives gain traction', fragilityScore: 55 },
      { id: 'a2', text: 'USD weaponization via sanctions continues', fragilityScore: 30 },
      { id: 'a3', text: 'No viable replacement for USD liquidity', fragilityScore: 25 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Central Bank Gold Buying', description: 'Record gold purchases by central banks in 2024', timestamp: daysAgo(20), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'IMF Data', description: 'USD still 58% of global reserves, minimal decline', timestamp: daysAgo(30), weight: 0.6 },
    ],
    decay: { halfLifeDays: 60, lastReinforced: daysAgo(20) },
    relatedNarratives: { reinforces: ['commodity-supercycle'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'GLD', name: 'SPDR Gold Shares', exposureWeight: 0.8 },
      { ticker: 'UUP', name: 'USD Bull ETF', exposureWeight: -0.7 },
      { ticker: 'BTC-USD', name: 'Bitcoin', exposureWeight: 0.4 },
    ],
    history: [],
    createdAt: daysAgo(120),
    tags: ['macro', 'currency', 'geopolitics', 'gold'],
  },
  {
    id: 'commodity-supercycle',
    name: 'Commodity Supercycle',
    summary: 'Decades of underinvestment in mining/extraction combined with green transition metal demand creates structural commodity shortage. Copper, uranium, lithium in secular bull markets.',
    confidence: { score: 64, trend: 'up', lastUpdated: daysAgo(3) },
    assumptions: [
      { id: 'a1', text: 'Green transition drives metal demand higher', fragilityScore: 30 },
      { id: 'a2', text: 'New supply takes 7-10 years to come online', fragilityScore: 20 },
      { id: 'a3', text: 'No demand destruction from recession', fragilityScore: 50 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Copper Inventories', description: 'LME copper stocks at multi-year lows', timestamp: daysAgo(7), weight: 0.8 },
      { id: 'e2', source: 'Uranium Spot', description: 'Uranium price tripled from 2022 lows', timestamp: daysAgo(10), weight: 0.75 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'China Demand', description: 'Slower Chinese construction reducing near-term demand', timestamp: daysAgo(14), weight: 0.4 },
    ],
    decay: { halfLifeDays: 45, lastReinforced: daysAgo(3) },
    relatedNarratives: { reinforces: ['energy-demand-surge'], conflicts: [], overlaps: ['china-stimulus'] },
    affectedAssets: [
      { ticker: 'FCX', name: 'Freeport McMoran', exposureWeight: 0.85 },
      { ticker: 'CCJ', name: 'Cameco (Uranium)', exposureWeight: 0.8 },
      { ticker: 'COPX', name: 'Copper Miners ETF', exposureWeight: 0.9 },
      { ticker: 'BHP', name: 'BHP Group', exposureWeight: 0.65 },
    ],
    history: [],
    createdAt: daysAgo(90),
    tags: ['commodities', 'mining', 'energy', 'metals'],
  },
  {
    id: 'defense-spending-boom',
    name: 'Defense Spending Boom',
    summary: 'Global defense budgets surging due to Ukraine war, Taiwan tensions, and NATO rearmament commitments. European defense spending to double over decade.',
    confidence: { score: 74, trend: 'up', lastUpdated: daysAgo(1) },
    assumptions: [
      { id: 'a1', text: 'Geopolitical tensions remain elevated', fragilityScore: 20 },
      { id: 'a2', text: 'NATO 2% GDP targets enforced', fragilityScore: 30 },
      { id: 'a3', text: 'Defense budgets survive fiscal pressure', fragilityScore: 40 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'NATO Summit', description: 'Record defense spending commitments from members', timestamp: daysAgo(14), weight: 0.85 },
      { id: 'e2', source: 'European Budgets', description: 'Germany 100B euro special defense fund', timestamp: daysAgo(20), weight: 0.8 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Peace Talks', description: 'Potential Ukraine ceasefire could slow urgency', timestamp: daysAgo(7), weight: 0.35 },
    ],
    decay: { halfLifeDays: 60, lastReinforced: daysAgo(1) },
    relatedNarratives: { reinforces: [], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'LMT', name: 'Lockheed Martin', exposureWeight: 0.9 },
      { ticker: 'RTX', name: 'RTX Corporation', exposureWeight: 0.85 },
      { ticker: 'GD', name: 'General Dynamics', exposureWeight: 0.8 },
      { ticker: 'NOC', name: 'Northrop Grumman', exposureWeight: 0.75 },
    ],
    history: [],
    createdAt: daysAgo(120),
    tags: ['defense', 'geopolitics', 'government', 'military'],
  },
  {
    id: 'india-growth-story',
    name: 'India Growth Story',
    summary: 'India emerging as fastest-growing large economy. Demographics, digital infrastructure, and manufacturing shift from China creating multi-decade growth runway.',
    confidence: { score: 72, trend: 'up', lastUpdated: daysAgo(4) },
    assumptions: [
      { id: 'a1', text: 'Reform momentum continues under Modi', fragilityScore: 35 },
      { id: 'a2', text: 'Manufacturing shift from China materializes', fragilityScore: 45 },
      { id: 'a3', text: 'Infrastructure spending sustains growth', fragilityScore: 30 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'GDP Data', description: 'India GDP growing 7%+ consistently', timestamp: daysAgo(15), weight: 0.85 },
      { id: 'e2', source: 'FDI Flows', description: 'Record foreign direct investment into India', timestamp: daysAgo(20), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Valuation Concerns', description: 'Indian market trading at premium to EM peers', timestamp: daysAgo(10), weight: 0.4 },
    ],
    decay: { halfLifeDays: 45, lastReinforced: daysAgo(4) },
    relatedNarratives: { reinforces: [], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'INDA', name: 'iShares India ETF', exposureWeight: 0.9 },
      { ticker: 'IBN', name: 'ICICI Bank', exposureWeight: 0.75 },
      { ticker: 'INFY', name: 'Infosys', exposureWeight: 0.6 },
    ],
    history: [],
    createdAt: daysAgo(90),
    tags: ['india', 'emerging markets', 'growth', 'demographics'],
  },
  {
    id: 'cre-crisis',
    name: 'Commercial Real Estate Crisis',
    summary: 'Office vacancy at record highs post-COVID. Regional banks exposed to CRE loans face losses. Potential systemic risk if defaults cascade.',
    confidence: { score: 56, trend: 'flat', lastUpdated: daysAgo(4) },
    assumptions: [
      { id: 'a1', text: 'Remote work permanently reduces office demand', fragilityScore: 30 },
      { id: 'a2', text: 'Regional banks cant absorb losses', fragilityScore: 50 },
      { id: 'a3', text: 'Refinancing wall hits in 2025-2026', fragilityScore: 35 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'CBRE Data', description: 'Office vacancy at 19.6%, highest on record', timestamp: daysAgo(10), weight: 0.75 },
      { id: 'e2', source: 'Bank Stress Tests', description: 'CRE exposure flagged as key risk', timestamp: daysAgo(25), weight: 0.65 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Office Conversions', description: 'Adaptive reuse reducing oversupply', timestamp: daysAgo(14), weight: 0.3 },
    ],
    decay: { halfLifeDays: 30, lastReinforced: daysAgo(10) },
    relatedNarratives: { reinforces: [], conflicts: ['us-soft-landing'], overlaps: [] },
    affectedAssets: [
      { ticker: 'KRE', name: 'Regional Banks ETF', exposureWeight: -0.8 },
      { ticker: 'VNO', name: 'Vornado Realty', exposureWeight: -0.85 },
      { ticker: 'SLG', name: 'SL Green Realty', exposureWeight: -0.8 },
    ],
    history: [],
    createdAt: daysAgo(90),
    tags: ['real estate', 'banks', 'risk', 'credit'],
  },
  {
    id: 'private-credit-boom',
    name: 'Private Credit Boom',
    summary: 'Private credit AUM surpassing $1.7T as banks retreat from lending. Shadow banking expansion creates both opportunity and systemic risk.',
    confidence: { score: 66, trend: 'up', lastUpdated: daysAgo(3) },
    assumptions: [
      { id: 'a1', text: 'Bank regulation keeps pushing lending to non-banks', fragilityScore: 25 },
      { id: 'a2', text: 'Default rates remain manageable', fragilityScore: 50 },
      { id: 'a3', text: 'Institutional allocators continue increasing allocation', fragilityScore: 30 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Preqin Data', description: 'Private credit AUM doubled in 3 years', timestamp: daysAgo(15), weight: 0.8 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'IMF Warning', description: 'Systemic risk from opaque private credit market', timestamp: daysAgo(20), weight: 0.45 },
    ],
    decay: { halfLifeDays: 30, lastReinforced: daysAgo(3) },
    relatedNarratives: { reinforces: [], conflicts: [], overlaps: ['cre-crisis'] },
    affectedAssets: [
      { ticker: 'ARES', name: 'Ares Management', exposureWeight: 0.85 },
      { ticker: 'OWL', name: 'Blue Owl Capital', exposureWeight: 0.8 },
      { ticker: 'APO', name: 'Apollo Global', exposureWeight: 0.75 },
      { ticker: 'BX', name: 'Blackstone', exposureWeight: 0.7 },
    ],
    history: [],
    createdAt: daysAgo(60),
    tags: ['credit', 'finance', 'alternatives', 'lending'],
  },
  {
    id: 'onshoring-reshoring',
    name: 'Onshoring / Reshoring',
    summary: 'Supply chain resilience driving manufacturing back to US and allied nations. CHIPS Act, IRA, and tariffs accelerating reshoring trend with massive industrial capex.',
    confidence: { score: 69, trend: 'up', lastUpdated: daysAgo(2) },
    assumptions: [
      { id: 'a1', text: 'Government subsidies continue bipartisan support', fragilityScore: 40 },
      { id: 'a2', text: 'Labor availability for manufacturing exists', fragilityScore: 50 },
      { id: 'a3', text: 'Cost premium is acceptable for security', fragilityScore: 35 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Construction Spending', description: 'US manufacturing construction spending up 70% YoY', timestamp: daysAgo(8), weight: 0.85 },
      { id: 'e2', source: 'TSMC Arizona', description: 'TSMC fab on track, yields matching Taiwan', timestamp: daysAgo(12), weight: 0.75 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Cost Analysis', description: 'US manufacturing still 30-40% more expensive', timestamp: daysAgo(20), weight: 0.4 },
    ],
    decay: { halfLifeDays: 45, lastReinforced: daysAgo(2) },
    relatedNarratives: { reinforces: ['defense-spending-boom'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'CAT', name: 'Caterpillar', exposureWeight: 0.7 },
      { ticker: 'URI', name: 'United Rentals', exposureWeight: 0.65 },
      { ticker: 'NUE', name: 'Nucor Steel', exposureWeight: 0.75 },
      { ticker: 'EMR', name: 'Emerson Electric', exposureWeight: 0.6 },
    ],
    history: [],
    createdAt: daysAgo(90),
    tags: ['industrial', 'supply chain', 'manufacturing', 'policy'],
  },
  {
    id: 'crypto-institutional',
    name: 'Crypto Institutional Adoption',
    summary: 'Bitcoin ETF approvals, institutional custody solutions, and regulatory clarity driving crypto from retail speculation to institutional asset class.',
    confidence: { score: 63, trend: 'up', lastUpdated: daysAgo(1) },
    assumptions: [
      { id: 'a1', text: 'Regulatory environment remains favorable', fragilityScore: 45 },
      { id: 'a2', text: 'Institutional allocators increase crypto exposure', fragilityScore: 35 },
      { id: 'a3', text: 'No major exchange failures', fragilityScore: 40 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'ETF Flows', description: 'Bitcoin ETFs attracted $50B in first year', timestamp: daysAgo(5), weight: 0.85 },
      { id: 'e2', source: 'Pension Funds', description: 'State pension funds adding BTC allocation', timestamp: daysAgo(14), weight: 0.7 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'SEC Enforcement', description: 'Ongoing regulatory actions against altcoins', timestamp: daysAgo(12), weight: 0.35 },
    ],
    decay: { halfLifeDays: 21, lastReinforced: daysAgo(1) },
    relatedNarratives: { reinforces: ['de-dollarization'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'IBIT', name: 'iShares Bitcoin Trust', exposureWeight: 0.95 },
      { ticker: 'COIN', name: 'Coinbase', exposureWeight: 0.85 },
      { ticker: 'MSTR', name: 'MicroStrategy', exposureWeight: 0.9 },
      { ticker: 'MARA', name: 'Marathon Digital', exposureWeight: 0.75 },
    ],
    history: [],
    createdAt: daysAgo(45),
    tags: ['crypto', 'digital assets', 'ETF', 'institutional'],
  },
  {
    id: 'healthcare-ai',
    name: 'Healthcare AI Revolution',
    summary: 'AI transforming drug discovery, diagnostics, and clinical operations. GLP-1 drugs and AI-driven biotech creating massive market opportunities.',
    confidence: { score: 67, trend: 'up', lastUpdated: daysAgo(3) },
    assumptions: [
      { id: 'a1', text: 'FDA accelerates AI-driven drug approvals', fragilityScore: 45 },
      { id: 'a2', text: 'GLP-1 market expands beyond obesity', fragilityScore: 30 },
      { id: 'a3', text: 'AI meaningfully reduces drug development costs', fragilityScore: 50 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Novo Nordisk Revenue', description: 'GLP-1 sales exceeding all forecasts', timestamp: daysAgo(10), weight: 0.85 },
      { id: 'e2', source: 'AI Drug Trials', description: 'AI-designed drugs entering Phase 2 trials', timestamp: daysAgo(20), weight: 0.65 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Pricing Pressure', description: 'Government drug price negotiation expanding', timestamp: daysAgo(15), weight: 0.4 },
    ],
    decay: { halfLifeDays: 30, lastReinforced: daysAgo(3) },
    relatedNarratives: { reinforces: ['ai-capex-supercycle'], conflicts: [], overlaps: [] },
    affectedAssets: [
      { ticker: 'LLY', name: 'Eli Lilly', exposureWeight: 0.9 },
      { ticker: 'NVO', name: 'Novo Nordisk', exposureWeight: 0.85 },
      { ticker: 'ISRG', name: 'Intuitive Surgical', exposureWeight: 0.6 },
      { ticker: 'RXRX', name: 'Recursion Pharma', exposureWeight: 0.7 },
    ],
    history: [],
    createdAt: daysAgo(60),
    tags: ['healthcare', 'AI', 'biotech', 'GLP-1'],
  },
  {
    id: 'inflation-sticky',
    name: 'Sticky Inflation',
    summary: 'Core inflation proving stickier than expected. Services inflation, wage growth, and shelter costs keeping inflation above target, forcing Fed to stay higher for longer.',
    confidence: { score: 48, trend: 'up', lastUpdated: daysAgo(2) },
    assumptions: [
      { id: 'a1', text: 'Services inflation remains elevated', fragilityScore: 35 },
      { id: 'a2', text: 'Shelter costs slow to adjust', fragilityScore: 30 },
      { id: 'a3', text: 'Wage growth stays above 4%', fragilityScore: 45 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Core Services CPI', description: 'Supercore inflation reaccelerating', timestamp: daysAgo(5), weight: 0.75 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Rent Data', description: 'New lease rents declining, lag will show in CPI', timestamp: daysAgo(10), weight: 0.55 },
    ],
    decay: { halfLifeDays: 14, lastReinforced: daysAgo(2) },
    relatedNarratives: { reinforces: [], conflicts: ['fed-rate-cuts', 'us-soft-landing'], overlaps: [] },
    affectedAssets: [
      { ticker: 'TIP', name: 'TIPS ETF', exposureWeight: 0.7 },
      { ticker: 'TLT', name: 'Long-Term Treasury ETF', exposureWeight: -0.6 },
      { ticker: 'GLD', name: 'SPDR Gold Shares', exposureWeight: 0.5 },
    ],
    history: [],
    createdAt: daysAgo(45),
    tags: ['macro', 'inflation', 'fed', 'bonds'],
  },
  {
    id: 'rotation-to-value',
    name: 'Rotation to Value',
    summary: 'Market breadth broadening as investors rotate from mega-cap growth to undervalued small/mid-caps and value sectors. Equal-weight outperforming cap-weight.',
    confidence: { score: 51, trend: 'flat', lastUpdated: daysAgo(4) },
    assumptions: [
      { id: 'a1', text: 'Mega-cap concentration is unsustainable', fragilityScore: 40 },
      { id: 'a2', text: 'Small caps benefit from rate cuts', fragilityScore: 45 },
      { id: 'a3', text: 'Earnings growth broadens beyond Mag 7', fragilityScore: 50 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Russell 2000', description: 'Small caps outperforming in recent weeks', timestamp: daysAgo(7), weight: 0.6 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'Fund Flows', description: 'Money still flowing into mega-cap tech ETFs', timestamp: daysAgo(10), weight: 0.5 },
    ],
    decay: { halfLifeDays: 14, lastReinforced: daysAgo(7) },
    relatedNarratives: { reinforces: ['tech-valuation-bubble'], conflicts: ['ai-capex-supercycle'], overlaps: [] },
    affectedAssets: [
      { ticker: 'IWM', name: 'Russell 2000 ETF', exposureWeight: 0.8 },
      { ticker: 'RSP', name: 'Equal Weight S&P 500', exposureWeight: 0.7 },
      { ticker: 'VTV', name: 'Vanguard Value ETF', exposureWeight: 0.65 },
    ],
    history: [],
    createdAt: daysAgo(30),
    tags: ['equities', 'rotation', 'value', 'small caps'],
  },
  {
    id: 'recession-risk',
    name: 'Recession Risk Rising',
    summary: 'Leading indicators flashing warning signs. Yield curve, LEI, and credit conditions suggest recession risk in next 12 months despite surface-level strength.',
    confidence: { score: 38, trend: 'down', lastUpdated: daysAgo(5) },
    assumptions: [
      { id: 'a1', text: 'Yield curve inversion still predictive', fragilityScore: 45 },
      { id: 'a2', text: 'Lagged effects of rate hikes materialize', fragilityScore: 40 },
      { id: 'a3', text: 'Consumer savings buffer depleted', fragilityScore: 50 },
    ],
    supportingEvidence: [
      { id: 'e1', source: 'Conference Board LEI', description: 'Leading indicators declining for 22 months', timestamp: daysAgo(15), weight: 0.6 },
    ],
    contradictingEvidence: [
      { id: 'c1', source: 'GDP Growth', description: 'GDP growing above trend at 3.2%', timestamp: daysAgo(10), weight: 0.7 },
      { id: 'c2', source: 'Employment', description: 'Job gains continue averaging 200K/month', timestamp: daysAgo(8), weight: 0.65 },
    ],
    decay: { halfLifeDays: 14, lastReinforced: daysAgo(15) },
    relatedNarratives: { reinforces: [], conflicts: ['us-soft-landing'], overlaps: [] },
    affectedAssets: [
      { ticker: 'SH', name: 'Short S&P 500 ETF', exposureWeight: 0.7 },
      { ticker: 'TLT', name: 'Long-Term Treasury ETF', exposureWeight: 0.6 },
      { ticker: 'XLP', name: 'Consumer Staples', exposureWeight: 0.5 },
    ],
    history: [],
    createdAt: daysAgo(90),
    tags: ['macro', 'recession', 'risk', 'bonds'],
  },
];

// Belief edges connecting narratives
export const mockBeliefEdges: BeliefEdge[] = [
  { id: 'e1', fromNarrativeId: 'ai-capex-supercycle', toNarrativeId: 'energy-demand-surge', relationship: 'reinforces', strength: 0.85 },
  { id: 'e2', fromNarrativeId: 'ai-capex-supercycle', toNarrativeId: 'tech-valuation-bubble', relationship: 'conflicts', strength: 0.6 },
  { id: 'e3', fromNarrativeId: 'us-soft-landing', toNarrativeId: 'fed-rate-cuts', relationship: 'reinforces', strength: 0.7 },
  { id: 'e4', fromNarrativeId: 'fed-rate-cuts', toNarrativeId: 'tech-valuation-bubble', relationship: 'conflicts', strength: 0.5 },
  { id: 'e5', fromNarrativeId: 'china-stimulus', toNarrativeId: 'commodity-supercycle', relationship: 'reinforces', strength: 0.7 },
  { id: 'e6', fromNarrativeId: 'energy-demand-surge', toNarrativeId: 'inflation-sticky', relationship: 'reinforces', strength: 0.45 },
  { id: 'e7', fromNarrativeId: 'inflation-sticky', toNarrativeId: 'fed-rate-cuts', relationship: 'conflicts', strength: 0.7 },
  { id: 'e8', fromNarrativeId: 'inflation-sticky', toNarrativeId: 'us-soft-landing', relationship: 'conflicts', strength: 0.55 },
  { id: 'e9', fromNarrativeId: 'recession-risk', toNarrativeId: 'us-soft-landing', relationship: 'conflicts', strength: 0.75 },
  { id: 'e10', fromNarrativeId: 'cre-crisis', toNarrativeId: 'recession-risk', relationship: 'reinforces', strength: 0.5 },
  { id: 'e11', fromNarrativeId: 'defense-spending-boom', toNarrativeId: 'onshoring-reshoring', relationship: 'reinforces', strength: 0.55 },
  { id: 'e12', fromNarrativeId: 'de-dollarization', toNarrativeId: 'commodity-supercycle', relationship: 'reinforces', strength: 0.5 },
  { id: 'e13', fromNarrativeId: 'crypto-institutional', toNarrativeId: 'de-dollarization', relationship: 'reinforces', strength: 0.4 },
  { id: 'e14', fromNarrativeId: 'ai-capex-supercycle', toNarrativeId: 'healthcare-ai', relationship: 'reinforces', strength: 0.5 },
  { id: 'e15', fromNarrativeId: 'rotation-to-value', toNarrativeId: 'ai-capex-supercycle', relationship: 'conflicts', strength: 0.45 },
  { id: 'e16', fromNarrativeId: 'private-credit-boom', toNarrativeId: 'cre-crisis', relationship: 'depends_on', strength: 0.4 },
  { id: 'e17', fromNarrativeId: 'onshoring-reshoring', toNarrativeId: 'inflation-sticky', relationship: 'reinforces', strength: 0.35 },
  { id: 'e18', fromNarrativeId: 'india-growth-story', toNarrativeId: 'china-stimulus', relationship: 'conflicts', strength: 0.35 },
];

// Sample portfolio
export const mockPortfolio: Portfolio = {
  id: 'portfolio-1',
  name: 'Growth & Tech Focus',
  holdings: [
    { ticker: 'NVDA', name: 'NVIDIA', weight: 0.20 },
    { ticker: 'MSFT', name: 'Microsoft', weight: 0.15 },
    { ticker: 'GOOGL', name: 'Alphabet', weight: 0.12 },
    { ticker: 'AMD', name: 'AMD', weight: 0.08 },
    { ticker: 'AVGO', name: 'Broadcom', weight: 0.08 },
    { ticker: 'VST', name: 'Vistra', weight: 0.07 },
    { ticker: 'CEG', name: 'Constellation Energy', weight: 0.06 },
    { ticker: 'SPY', name: 'S&P 500 ETF', weight: 0.10 },
    { ticker: 'TLT', name: 'Long-Term Treasury', weight: 0.08 },
    { ticker: 'BABA', name: 'Alibaba', weight: 0.06 },
  ],
  createdAt: daysAgo(90),
  updatedAt: daysAgo(1),
};

// Sample assets with narrative context  
export const mockAssets: Asset[] = [];

// Market overview
export const mockMarketOverview: MarketOverview = {
  dominantNarratives: mockNarratives.filter(n => n.confidence.score >= 70),
  risingNarratives: mockNarratives.filter(n => n.confidence.trend === 'up'),
  fadingNarratives: mockNarratives.filter(n => n.confidence.trend === 'down'),
  conflictClusters: [
    {
      narratives: mockNarratives.filter(n => 
        n.id === 'ai-capex-supercycle' || n.id === 'tech-valuation-bubble'
      ),
      tension: 0.65,
    },
    {
      narratives: mockNarratives.filter(n =>
        n.id === 'inflation-sticky' || n.id === 'fed-rate-cuts'
      ),
      tension: 0.7,
    },
  ],
  marketSentiment: 'bullish',
};
