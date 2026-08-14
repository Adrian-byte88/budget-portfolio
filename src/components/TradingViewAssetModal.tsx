import React, { useState, useEffect } from 'react';
import { AssetPosition } from '../types';
import {
  TradingViewAdvancedChart,
  TradingViewTechnicalAnalysis,
  TradingViewSymbolProfile,
  TradingViewTimelineNews,
  getTradingViewSymbolDetails
} from './TradingViewWidget';
import {
  X,
  ExternalLink,
  Camera,
  Code,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Globe,
  Newspaper,
  Layers,
  PieChart,
  Shield,
  Zap,
  DollarSign,
  Maximize2,
  Check,
  Copy,
  Info,
  Sun,
  Moon
} from 'lucide-react';

interface TradingViewAssetModalProps {
  asset: AssetPosition;
  onClose: () => void;
  triggerToast?: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export const TradingViewAssetModal: React.FC<TradingViewAssetModalProps> = ({
  asset,
  onClose,
  triggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'technicals' | 'profile' | 'news' | 'holdings'>('chart');
  const [chartInterval, setChartInterval] = useState<string>('D'); // D, W, M, 60, 15
  const [chartStyle, setChartStyle] = useState<string>('1'); // 1 = candles, 2 = line, 8 = heikin ashi
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
  const [showEmbedModal, setShowEmbedModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Theme state for chart and modal elements (defaults to current document theme)
  const [chartTheme, setChartTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Keep theme synced if system dark mode class changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setChartTheme(isDark ? 'dark' : 'light');
  }, []);

  const tvDetails = getTradingViewSymbolDetails(asset.key, asset.name);

  // Calculate PHP price & total position valuation
  const currentPricePHP = (asset.currentPricePHP > 0 && !(asset.currentPricePHP === 1 && asset.costBasisPHP > 10))
    ? asset.currentPricePHP
    : (asset.costBasisPHP / (asset.units || 1));
  const totalValuationPHP = currentPricePHP * asset.units;
  const unrealizedGainPHP = totalValuationPHP - asset.costBasisPHP;
  const unrealizedGainPct = asset.costBasisPHP > 0 ? (unrealizedGainPHP / asset.costBasisPHP) * 100 : 0;
  const usdPriceEst = currentPricePHP > 0 ? currentPricePHP / 58.5 : 0;
  const changePct = asset.change24h || 0;
  const isPositive = changePct >= 0;

  const handleSnapshot = () => {
    if (triggerToast) {
      triggerToast('TradingView Chart Captured 📷', `High-resolution chart view for ${asset.name} is ready for export.`, 'success');
    }
  };

  const handleCopyEmbed = () => {
    const embedSnippet = `<iframe src="${tvDetails.tradingViewUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
    if (triggerToast) {
      triggerToast('TradingView Widget Snippet Copied 💻', 'Embed code copied to clipboard.', 'info');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col p-0 animate-fade-in font-sans overflow-hidden ${
      isFullscreen ? 'bg-black' : 'bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md'
    }`}>
      <div className="bg-white dark:bg-[#0c1017] border-0 rounded-none w-full h-full max-w-full max-h-full shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* TOP BAR / TRADINGVIEW HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#080b10] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Asset Icon & Logo */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-white/20 shrink-0">
                {tvDetails.logo}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{asset.name}</h2>
                
                {/* TradingView Ticker Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300">
                  <span>{tvDetails.tvSymbol}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>

                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded">
                  {tvDetails.exchange}
                </span>

                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>TradingView® Embedded</span>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                <span>Holdings: <b className="text-slate-800 dark:text-slate-200 font-bold">{asset.units.toLocaleString()} {asset.key.toUpperCase()}</b></span>
                <span>•</span>
                <span>Valuation: <b className="text-emerald-600 dark:text-emerald-400 font-bold">₱{totalValuationPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
                <span>•</span>
                <span className={unrealizedGainPHP >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  P&L: {unrealizedGainPHP >= 0 ? '+' : ''}₱{unrealizedGainPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({unrealizedGainPct >= 0 ? '+' : ''}{unrealizedGainPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Top Right) */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setChartTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title={`Switch Widget Theme to ${chartTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {chartTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden sm:inline">{chartTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Interval Quick Switchers */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-mono font-bold">
              {[
                { id: '15', label: '15m' },
                { id: '60', label: '1h' },
                { id: 'D', label: '1D' },
                { id: 'W', label: '1W' },
                { id: 'M', label: '1M' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setChartInterval(t.id)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    chartInterval === t.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSnapshot}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Snapshot View"
            >
              <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>

            <button
              onClick={() => setShowEmbedModal(!showEmbedModal)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Copy TradingView Embed Code"
            >
              <Code className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>

            <a
              href={tvDetails.tradingViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>TradingView.com</span>
            </a>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl border border-slate-200 dark:border-white/10 transition-all cursor-pointer ml-1"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TRADINGVIEW TABS BAR */}
        <div className="px-4 sm:px-6 bg-slate-100 dark:bg-[#0a0e15] border-b border-slate-200 dark:border-white/10 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'chart', label: 'Advanced Real-Time Chart', icon: BarChart2 },
            { id: 'technicals', label: 'Technical Analysis Gauge', icon: Activity },
            { id: 'profile', label: 'Market Profile & Stats', icon: Globe },
            { id: 'news', label: 'TradingView Market Timeline', icon: Newspaper },
            { id: 'holdings', label: 'Portfolio Allocation & P&L', icon: PieChart },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500 bg-white dark:bg-white/[0.03] shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.01]'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* EMBED CODE DRAWER */}
        {showEmbedModal && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2 overflow-hidden">
              <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate">
                {tvDetails.tradingViewUrl}
              </span>
            </div>
            <button
              onClick={handleCopyEmbed}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? 'Copied!' : 'Copy Embed Snippet'}</span>
            </button>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-[#080b10]">
          
          {/* TAB 1: ADVANCED REAL-TIME CHART */}
          {activeTab === 'chart' && (
            <div className="h-full flex flex-col space-y-3 min-h-[580px]">
              {/* Chart Toolbar Controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg">
                    Symbol: <b>{tvDetails.tvSymbol}</b>
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
                    Interval: <b>{chartInterval}</b>
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Timezone: Asia/Manila (PHT)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    Includes: SMA, RSI, MACD & Full Technical Drawings
                  </span>
                </div>
              </div>

              {/* Embedded TradingView Advanced Chart */}
              <div className="flex-1 min-h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md bg-slate-900">
                <TradingViewAdvancedChart
                  symbol={tvDetails.tvSymbol}
                  theme={chartTheme}
                  interval={chartInterval}
                  style={chartStyle}
                  height="100%"
                  width="100%"
                  allow_symbol_change={true}
                  hide_side_toolbar={false}
                  hide_top_toolbar={false}
                  withdateranges={true}
                  details={true}
                  hotlist={false}
                  calendar={false}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL ANALYSIS GAUGE */}
          {activeTab === 'technicals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>TradingView® Technical Analysis Gauge & Oscillators</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time consensus based on Moving Averages, Relative Strength Index (RSI), MACD, Stochastic, and Bull/Bear Power.
                  </p>
                </div>
                <a
                  href={tvDetails.tradingViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open Full Analysis on TradingView</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xs">
                <TradingViewTechnicalAnalysis
                  symbol={tvDetails.tvSymbol}
                  theme={chartTheme}
                  interval="1D"
                  height={480}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE & FINANCIAL METRICS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>TradingView® Company / Asset Profile & Financials</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Fundamental data, capitalization metrics, sector breakdown, and corporate valuation.
                  </p>
                </div>
                <a
                  href={tvDetails.tradingViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xs">
                <TradingViewSymbolProfile
                  symbol={tvDetails.tvSymbol}
                  theme={chartTheme}
                  height={480}
                />
              </div>
            </div>
          )}

          {/* TAB 4: MARKET TIMELINE & NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>TradingView® Live Market Timeline & Breaking News</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time global news feed covering {asset.name} and related market developments.
                  </p>
                </div>
                <a
                  href={`https://www.tradingview.com/news/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>TradingView News Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xs">
                <TradingViewTimelineNews
                  symbol={tvDetails.tvSymbol}
                  theme={chartTheme}
                  feedMode="symbol"
                  height={560}
                />
              </div>
            </div>
          )}

          {/* TAB 5: PORTFOLIO HOLDINGS & P&L */}
          {activeTab === 'holdings' && (
            <div className="space-y-6">
              {/* KEY METRICS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Estimated Price per Unit</span>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                    ₱{currentPricePHP > 0 ? currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    ≈ ${usdPriceEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Current Holding Value</span>
                  <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₱{totalValuationPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    ${(totalValuationPHP / 58.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Units Held</span>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {asset.units.toLocaleString()} {asset.key.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Cost Basis: ₱{asset.costBasisPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Unrealized Net P&L</span>
                  <div className={`text-base font-black font-mono ${unrealizedGainPHP >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {unrealizedGainPHP >= 0 ? '+' : ''}₱{unrealizedGainPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${unrealizedGainPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ({unrealizedGainPct >= 0 ? '+' : ''}{unrealizedGainPct.toFixed(2)}% ROI)
                  </span>
                </div>
              </div>

              {/* Holding Details Breakdown */}
              <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl space-y-4 shadow-2xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Asset Information & Storage Custody
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Platform / Custodian</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{asset.platform || 'Direct Storage'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Asset Classification</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{asset.class.toUpperCase()} • {asset.assetType.toUpperCase()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">TradingView Symbol</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{tvDetails.tvSymbol}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER BAR */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#080b10] border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <a
              href={tvDetails.tradingViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>{tvDetails.tradingViewUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
};
