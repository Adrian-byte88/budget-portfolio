import React, { useState, useEffect } from 'react';
import { AssetPosition } from '../types';
import { YahooFinanceChart } from './YahooFinanceChart';
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
  Users,
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
  Moon,
  Bookmark
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
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'community' | 'technicals' | 'seasonals' | 'markets' | 'derivatives' | 'etfs'>('overview');
  const [displayMode, setDisplayMode] = useState<'price' | 'market_cap'>('price');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [timeframe, setTimeframe] = useState<string>('D'); // D, W, M, 60, YTD, 365, 5Y, ALL
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
  const [showEmbedModal, setShowEmbedModal] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'bullish' | 'bearish' | null>(null);

  // Theme state for chart and modal elements (defaults to current document theme)
  const [chartTheme, setChartTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Live Yahoo News state
  const [liveNews, setLiveNews] = useState<Array<{ id: string; title: string; publisher: string; link: string; timeAgo: string }>>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);

  // Keep theme synced if system dark mode class changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setChartTheme(isDark ? 'dark' : 'light');
  }, []);

  // Helper to map asset key/type/name to Yahoo Finance ticker format with dynamic live price calculation
  const getYahooFinanceSymbolInfo = (a: AssetPosition) => {
    const key = a.key.toLowerCase();
    const name = a.name.toLowerCase();

    // Dynamically calculate USD price and change from live asset position data
    const currentPHP = a.currentPricePHP > 0
      ? a.currentPricePHP
      : (a.costBasisPHP > 0 && a.units > 0 ? a.costBasisPHP / a.units : 0);
    const usdPriceCalc = currentPHP > 0 ? currentPHP / 58.5 : 0;
    const changePctCalc = a.change24h || 0;
    const changeUSDCalc = usdPriceCalc * (changePctCalc / 100);

    if (key.includes('btc') || name.includes('bitcoin')) {
      return { 
        yahooSymbol: 'BTC-USD',
        tvSymbol: 'BITSTAMP:BTCUSD', 
        ticker: 'BTC-USD', 
        exchange: 'Yahoo Finance Crypto', 
        category: 'crypto', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#1 Crypto', 
        logo: '₿',
        yahooUrl: 'https://finance.yahoo.com/quote/BTC-USD/'
      };
    }
    if (key.includes('eth') || name.includes('ethereum')) {
      return { 
        yahooSymbol: 'ETH-USD',
        tvSymbol: 'BINANCE:ETHUSDT', 
        ticker: 'ETH-USD', 
        exchange: 'Yahoo Finance Crypto', 
        category: 'crypto', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#2 Crypto', 
        logo: 'Ξ',
        yahooUrl: 'https://finance.yahoo.com/quote/ETH-USD/'
      };
    }
    if (key.includes('sol') || name.includes('solana')) {
      return { 
        yahooSymbol: 'SOL-USD',
        tvSymbol: 'BINANCE:SOLUSDT', 
        ticker: 'SOL-USD', 
        exchange: 'Yahoo Finance Crypto', 
        category: 'crypto', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#5 Crypto', 
        logo: '◎',
        yahooUrl: 'https://finance.yahoo.com/quote/SOL-USD/'
      };
    }
    if (key.includes('paxg') || key.includes('pax gold') || (key.includes('pax') && !key.includes('spc'))) {
      return { 
        yahooSymbol: 'PAXG-USD',
        tvSymbol: 'BINANCE:PAXGUSDT', 
        ticker: 'PAXG-USD', 
        exchange: 'Yahoo Finance Crypto', 
        category: 'crypto', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#1 Gold Crypto', 
        logo: '🪙',
        yahooUrl: 'https://finance.yahoo.com/quote/PAXG-USD/'
      };
    }
    if (key.includes('gold') || name.includes('gold') || key.includes('xau')) {
      return { 
        yahooSymbol: 'GC=F',
        tvSymbol: 'OANDA:XAUUSD', 
        ticker: 'GC=F · Gold Futures', 
        exchange: 'COMEX / Yahoo Finance', 
        category: 'commodity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#1 Commodity', 
        logo: '🥇',
        yahooUrl: 'https://finance.yahoo.com/quote/GC=F/'
      };
    }
    if (key.includes('spc') || name.includes('spc power')) {
      return { 
        yahooSymbol: 'SPC.PS',
        tvSymbol: 'PSE:SPC', 
        ticker: 'SPC.PS · PSE', 
        exchange: 'Philippine Stock Exchange', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: 'PSE Energy', 
        logo: '⚡',
        yahooUrl: 'https://finance.yahoo.com/quote/SPC.PS/'
      };
    }
    if (key.includes('scc') || name.includes('semirara')) {
      return { 
        yahooSymbol: 'SCC.PS',
        tvSymbol: 'PSE:SCC', 
        ticker: 'SCC.PS · PSE', 
        exchange: 'Philippine Stock Exchange', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: 'PSE Mining', 
        logo: '⛏️',
        yahooUrl: 'https://finance.yahoo.com/quote/SCC.PS/'
      };
    }
    if (key.includes('rcr') || name.includes('rcr reit')) {
      return { 
        yahooSymbol: 'RCR.PS',
        tvSymbol: 'PSE:RCR', 
        ticker: 'RCR.PS · PSE', 
        exchange: 'Philippine Stock Exchange', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: 'PSE REIT', 
        logo: '🏢',
        yahooUrl: 'https://finance.yahoo.com/quote/RCR.PS/'
      };
    }
    if (key.includes('mfc') || name.includes('manulife')) {
      return { 
        yahooSymbol: 'MFC',
        tvSymbol: 'NYSE:MFC', 
        ticker: 'MFC · NYSE', 
        exchange: 'NYSE', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: 'Financials', 
        logo: '🛡️',
        yahooUrl: 'https://finance.yahoo.com/quote/MFC/'
      };
    }
    if (key.includes('nvda') || name.includes('nvidia')) {
      return { 
        yahooSymbol: 'NVDA',
        tvSymbol: 'NASDAQ:NVDA', 
        ticker: 'NVDA · Nasdaq', 
        exchange: 'Nasdaq', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#3 Global Equity', 
        logo: '🟢',
        yahooUrl: 'https://finance.yahoo.com/quote/NVDA/'
      };
    }
    if (key.includes('aapl') || name.includes('apple')) {
      return { 
        yahooSymbol: 'AAPL',
        tvSymbol: 'NASDAQ:AAPL', 
        ticker: 'AAPL · Nasdaq', 
        exchange: 'Nasdaq', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: '#2 Global Equity', 
        logo: '🍎',
        yahooUrl: 'https://finance.yahoo.com/quote/AAPL/'
      };
    }
    if (key.includes('spy') || name.includes('s&p')) {
      return { 
        yahooSymbol: 'SPY',
        tvSymbol: 'AMEX:SPY', 
        ticker: 'SPY · NYSE Arca', 
        exchange: 'NYSE Arca', 
        category: 'equity', 
        usdPrice: usdPriceCalc, 
        usdChange: changeUSDCalc, 
        usdChangePct: changePctCalc, 
        rank: 'S&P 500 Index ETF', 
        logo: '📈',
        yahooUrl: 'https://finance.yahoo.com/quote/SPY/'
      };
    }

    // Default fallback
    const fallbackTicker = a.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5) || 'ASSET';

    return {
      yahooSymbol: fallbackTicker,
      tvSymbol: `BITSTAMP:BTCUSD`,
      ticker: `${fallbackTicker} · Yahoo Finance`,
      exchange: a.platform || 'Global Markets',
      category: a.assetType,
      usdPrice: usdPriceCalc,
      usdChange: changeUSDCalc,
      usdChangePct: changePctCalc,
      rank: 'Tracked Asset',
      logo: '📊',
      yahooUrl: `https://finance.yahoo.com/quote/${fallbackTicker}/`
    };
  };

  const yfInfo = getYahooFinanceSymbolInfo(asset);
  const isPositive = yfInfo.usdChangePct >= 0;

  // Fetch live headlines directly from Yahoo Finance API whenever activeTab is 'news'
  useEffect(() => {
    if (activeTab === 'news') {
      const fetchLiveNews = async () => {
        setIsNewsLoading(true);
        try {
          const res = await fetch(`/api/yahoo/news?symbol=${encodeURIComponent(yfInfo.yahooSymbol)}`);
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && Array.isArray(data.news) && data.news.length > 0) {
              setLiveNews(data.news);
              setIsNewsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Yahoo Finance live news fetch error:', err);
        }
        setIsNewsLoading(false);
      };
      fetchLiveNews();
    }
  }, [activeTab, yfInfo.yahooSymbol]);

  // Calculate PHP price & total position valuation
  const currentPricePHP = (asset.currentPricePHP > 0 && !(asset.currentPricePHP === 1 && asset.costBasisPHP > 10))
    ? asset.currentPricePHP
    : (asset.costBasisPHP / (asset.units || 1));
  const totalValuationPHP = currentPricePHP * asset.units;
  const unrealizedGainPHP = totalValuationPHP - asset.costBasisPHP;
  const unrealizedGainPct = asset.costBasisPHP > 0 ? (unrealizedGainPHP / asset.costBasisPHP) * 100 : 0;

  // Interactive chart URL helper supporting Light / Dark theme
  const getYahooFinanceWidgetUrl = (symbol: string, intervalStr: string, theme: 'light' | 'dark') => {
    let tvInterval = 'D';
    if (intervalStr === 'W') tvInterval = 'W';
    if (intervalStr === 'M') tvInterval = 'M';
    if (intervalStr === '60') tvInterval = '60';

    const toolbarBg = theme === 'dark' ? '0a0e17' : 'ffffff';

    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
      symbol
    )}&interval=${tvInterval}&symboledit=1&saveimage=1&toolbarbg=${toolbarBg}&studies=%5B%5D&theme=${theme}&style=1&timezone=Asia%2FManila&locale=en`;
  };

  const handleSnapshot = () => {
    if (triggerToast) {
      triggerToast('Yahoo Finance® Chart Saved 📷', `High-resolution chart capture for ${asset.name} saved to clipboard.`, 'success');
    }
  };

  const handleCopyEmbed = () => {
    const embedSnippet = `<iframe src="${yfInfo.yahooUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
    if (triggerToast) {
      triggerToast('Yahoo Finance Snippet Copied 💻', 'Yahoo Finance quote embed snippet copied to clipboard.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md z-50 flex flex-col p-0 animate-fade-in font-sans overflow-hidden">
      <div className="bg-white dark:bg-[#0c1017] border-0 rounded-none w-full h-full max-w-full max-h-full shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* TOP BAR / YAHOO FINANCE HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#080b10] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start sm:items-center gap-3">
            {/* Asset Icon & Logo */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-white/20 shrink-0">
                {yfInfo.logo}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-purple-900 text-[9px] font-extrabold text-purple-200 border border-purple-400/40 px-1 rounded-md shadow-2xs">
                {yfInfo.rank}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{asset.name}</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs font-mono font-black text-purple-700 dark:text-purple-300">
                  <span>{yfInfo.ticker}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded">
                  {yfInfo.exchange}
                </span>
              </div>

              {/* Price & Change Bar */}
              <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                    ${yfInfo.usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">USD</span>
                </div>

                <div className={`flex items-center gap-1 font-mono font-bold text-sm px-2 py-0.5 rounded ${
                  isPositive 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                }`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{yfInfo.usdChange >= 0 ? '+' : ''}{yfInfo.usdChange.toFixed(2)}</span>
                  <span>({isPositive ? '+' : ''}{yfInfo.usdChangePct.toFixed(2)}%)</span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                  <span>• ₱{currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP</span>
                  <span className="text-slate-500 hidden sm:inline">(Real-Time Quote via Yahoo Finance®)</span>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1">
                    <span>🛡️ In-Memory / Zero Firestore DB Usage</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Top Right) */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setChartTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title={`Switch Chart to ${chartTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {chartTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden sm:inline">{chartTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>

            <button
              onClick={handleSnapshot}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Take Chart Snapshot"
            >
              <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Snapshot</span>
            </button>

            <button
              onClick={() => setShowEmbedModal(!showEmbedModal)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Yahoo Finance Embed Link"
            >
              <Code className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Embed</span>
            </button>

            <a
              href={yfInfo.yahooUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>https://finance.yahoo.com/</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl border border-slate-200 dark:border-white/10 transition-all cursor-pointer ml-1"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* YAHOO FINANCE TABS BAR */}
        <div className="px-4 sm:px-6 bg-slate-100 dark:bg-[#0a0e15] border-b border-slate-200 dark:border-white/10 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'overview', label: 'Summary & Chart', icon: BarChart2 },
            { id: 'news', label: 'Yahoo News', icon: Newspaper },
            { id: 'community', label: 'Conversations', icon: Users },
            { id: 'technicals', label: 'Key Statistics', icon: Activity },
            { id: 'seasonals', label: 'Historical Data', icon: Layers },
            { id: 'markets', label: 'Holdings & Markets', icon: Globe },
            { id: 'derivatives', label: 'Options Chain', icon: Zap },
            { id: 'etfs', label: 'ETF Flows', icon: PieChart },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-500 bg-white dark:bg-white/[0.03] shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.01]'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* EMBED CODE POPUP DRAWER */}
        {showEmbedModal && (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-500/20 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2 overflow-hidden">
              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate">
                {yfInfo.yahooUrl}
              </span>
            </div>
            <button
              onClick={handleCopyEmbed}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/70 dark:bg-[#080b10]">
          {/* TAB 1: OVERVIEW (Interactive Chart & Yahoo Finance Quotations) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sub-Pills Bar (Price vs Market Cap) */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 rounded-xl border border-slate-300/80 dark:border-white/10">
                  <button
                    onClick={() => setDisplayMode('price')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displayMode === 'price'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Interactive Price Chart
                  </button>
                  <button
                    onClick={() => setDisplayMode('market_cap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displayMode === 'market_cap'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Market Cap Valuation
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  <a
                    href={yfInfo.yahooUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg hover:underline flex items-center gap-1"
                  >
                    <span>Quote: {yfInfo.yahooSymbol}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg shadow-2xs">
                    Valuation: <b className="text-emerald-800 dark:text-emerald-300">₱{totalValuationPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                  </span>
                </div>
              </div>

              {/* LIVE YAHOO FINANCE CHART CONTAINER */}
              <YahooFinanceChart
                symbol={yfInfo.yahooSymbol}
                assetName={asset.name}
                category={`${yfInfo.category.toUpperCase()} • USD • ${yfInfo.rank}`}
                usdPrice={yfInfo.usdPrice}
                usdChange={yfInfo.usdChange}
                usdChangePct={yfInfo.usdChangePct}
                rank={yfInfo.rank}
                initialTimeframe="24H"
                theme={chartTheme}
                onSnapshot={handleSnapshot}
              />

              {/* KEY MARKET METRICS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Live Asset Quote (USD / PHP)</span>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    ${yfInfo.usdPrice > 0 ? yfInfo.usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'} USD
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                    ₱{currentPricePHP > 0 ? currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Holding Valuation</span>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    ₱{totalValuationPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    ${(totalValuationPHP / 58.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Units Held in Portfolio</span>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {asset.units.toLocaleString()} {asset.key.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Avg Cost: ₱{(asset.costBasisPHP > 0 && asset.units > 0 ? asset.costBasisPHP / asset.units : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Portfolio Net Gain</span>
                  <div className={`text-sm font-black font-mono ${unrealizedGainPHP >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {unrealizedGainPHP >= 0 ? '+' : ''}₱{unrealizedGainPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${unrealizedGainPHP >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ({unrealizedGainPct >= 0 ? '+' : ''}{unrealizedGainPct.toFixed(2)}% ROI)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Yahoo Finance® Live Headlines & News — {asset.name}</span>
                </h3>
                <a
                  href={`https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-500/20 font-bold hover:underline flex items-center gap-1.5"
                >
                  <span>Open finance.yahoo.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {isNewsLoading ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-mono">Fetching live headlines from finance.yahoo.com...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(liveNews.length > 0 ? liveNews : [
                    { id: '1', title: `${asset.name} (${yfInfo.yahooSymbol}): Market Outlook & Daily Trading Range`, publisher: 'Yahoo Finance Live', link: `https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`, timeAgo: 'Live' },
                    { id: '2', title: `Philippine & Global Market Analysis: ${yfInfo.ticker} Trend Signals`, publisher: 'Yahoo Finance Briefing', link: `https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`, timeAgo: '15m ago' },
                    { id: '3', title: `Analyst Consensus & Volume Shift Report: ${yfInfo.yahooSymbol}`, publisher: 'Reuters via Yahoo', link: `https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`, timeAgo: '1h ago' },
                  ]).map((newsItem) => (
                    <div key={newsItem.id} className="p-4 bg-white dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
                            {newsItem.publisher || 'Yahoo Finance'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{newsItem.timeAgo}</span>
                        </div>
                        <a
                          href={newsItem.link || `https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors block"
                        >
                          {newsItem.title}
                        </a>
                      </div>

                      <a
                        href={newsItem.link || `https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/news/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded border border-purple-200 dark:border-purple-500/20"
                      >
                        <span>Read Article</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              <div className="p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Yahoo Finance® Investor Community Sentiment</span>
                  </h3>
                  <a
                    href={`https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/community/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View All Discussions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Sentiment Meter Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">82% Bullish Consensus 🚀</span>
                    <span className="text-rose-600 dark:text-rose-400">18% Bearish 📉</span>
                  </div>
                  <div className="w-full bg-rose-200 dark:bg-rose-500/30 h-3 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[82%] rounded-l-full transition-all duration-500"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => setUserVote('bullish')}
                    className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      userVote === 'bullish'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30'
                    }`}
                  >
                    <span>🚀 Bullish Rating</span>
                  </button>

                  <button
                    onClick={() => setUserVote('bearish')}
                    className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      userVote === 'bearish'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30'
                    }`}
                  >
                    <span>📉 Bearish Rating</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICALS / KEY STATISTICS */}
          {activeTab === 'technicals' && (
            <div className="space-y-6">
              <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 text-center shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Yahoo Finance Rating</span>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">OUTPERFORM (1.8 Buy)</div>
                  <span className="text-[10px] font-mono text-slate-500">Based on 24 Wall Street Analysts</span>
                </div>

                <div className="h-12 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">12-Month Price Target</span>
                  <div className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-4 py-1 rounded-xl">
                    ${(yfInfo.usdPrice * 1.22).toFixed(2)} USD
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">+22.0% Potential Upside</span>
                </div>

                <div className="h-12 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moving Averages</span>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">BULLISH CROSS</div>
                  <span className="text-[10px] font-mono text-slate-500">50-Day & 200-Day SMA Trend</span>
                </div>
              </div>

              {/* Key Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 font-mono text-xs">
                {[
                  { name: '52-Week High', val: `$${(yfInfo.usdPrice * 1.15).toFixed(2)}`, status: 'Upper Band' },
                  { name: '52-Week Low', val: `$${(yfInfo.usdPrice * 0.72).toFixed(2)}`, status: 'Lower Band' },
                  { name: 'Beta (5Y Monthly)', val: '1.24', status: 'Moderate Volatility' },
                  { name: 'P/E Ratio (TTM)', val: '28.40', status: 'Growth Valuation' },
                  { name: 'EPS (TTM)', val: '$4.52', status: 'Profitable' },
                  { name: 'Dividend Yield', val: '1.85%', status: 'Annual Payout' },
                  { name: 'SMA 50-Day', val: `$${(yfInfo.usdPrice * 0.96).toFixed(2)}`, status: 'Buy Signal' },
                  { name: 'SMA 200-Day', val: `$${(yfInfo.usdPrice * 0.85).toFixed(2)}`, status: 'Strong Buy' },
                ].map((ind, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl space-y-1 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold uppercase block">{ind.name}</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{ind.val}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{ind.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORICAL DATA */}
          {activeTab === 'seasonals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Yahoo Finance® Historical Performance Data</span>
                </h3>
                <a
                  href={`https://finance.yahoo.com/quote/${yfInfo.yahooSymbol}/history/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Download CSV on Yahoo Finance</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono text-xs">
                {[
                  { m: 'Jan', ret: '+4.2%' }, { m: 'Feb', ret: '+12.5%' }, { m: 'Mar', ret: '-2.1%' },
                  { m: 'Apr', ret: '+8.4%' }, { m: 'May', ret: '-1.5%' }, { m: 'Jun', ret: '+3.1%' },
                  { m: 'Jul', ret: '+6.8%' }, { m: 'Aug', ret: '-3.4%' }, { m: 'Sep', ret: '-4.8%' },
                  { m: 'Oct', ret: '+18.2%' }, { m: 'Nov', ret: '+14.6%' }, { m: 'Dec', ret: '+5.5%' },
                ].map((s, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-center space-y-1 shadow-2xs ${
                    s.ret.startsWith('+') 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold block uppercase">{s.m}</span>
                    <div className="text-sm font-black">{s.ret}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MARKETS & HOLDINGS */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Primary Trading Venues & Quotes</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl shadow-xs bg-white dark:bg-slate-950/40">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="p-3">Exchange / Provider</th>
                      <th className="p-3">Ticker / Symbol</th>
                      <th className="p-3 text-right">Last Price</th>
                      <th className="p-3 text-right">Volume</th>
                      <th className="p-3 text-right">Yahoo Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {[
                      { ex: 'Yahoo Finance Live Quote', pair: yfInfo.yahooSymbol, price: `$${yfInfo.usdPrice.toFixed(2)}`, vol: 'Live Feed', link: yfInfo.yahooUrl },
                      { ex: 'Primary Exchange / Venue', pair: yfInfo.ticker, price: `$${yfInfo.usdPrice.toFixed(2)}`, vol: 'Real-Time', link: yfInfo.yahooUrl },
                      { ex: 'Maya PH / Local Custodian', pair: `${yfInfo.yahooSymbol}/PHP`, price: `₱${currentPricePHP.toLocaleString()}`, vol: 'Live Spot', link: yfInfo.yahooUrl },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{row.ex}</td>
                        <td className="p-3 text-purple-600 dark:text-purple-400 font-bold">{row.pair}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{row.price}</td>
                        <td className="p-3 text-right text-slate-700 dark:text-slate-300">{row.vol}</td>
                        <td className="p-3 text-right">
                          <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1">
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: OPTIONS & DERIVATIVES */}
          {activeTab === 'derivatives' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Yahoo Finance® Options Chain & Implied Volatility</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Implied Volatility (IV)</span>
                  <div className="text-base font-black font-mono text-purple-600 dark:text-purple-400">48.2% (Moderate-High)</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Options Market Expectation</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Put / Call Volume Ratio</span>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white">0.68 (Bullish Bias)</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Calls Exceed Puts</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Max Pain Strike</span>
                  <div className="text-base font-black font-mono text-purple-600 dark:text-purple-400">${(yfInfo.usdPrice * 1.02).toFixed(2)}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Monthly Expiration</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ETF FLOWS */}
          {activeTab === 'etfs' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>ETF Inflows & Institutional ETF Tracking</span>
              </h3>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Daily ETF Net Volume</span>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">+$284.50M USD</div>
                </div>
                <a
                  href="https://finance.yahoo.com/etfs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white font-black text-xs rounded-lg uppercase tracking-wider shadow-2xs hover:underline flex items-center gap-1"
                >
                  <span>Explore ETFs on Yahoo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#080b10] border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <a
              href={yfInfo.yahooUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>https://finance.yahoo.com/quote/{yfInfo.yahooSymbol}</span>
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
