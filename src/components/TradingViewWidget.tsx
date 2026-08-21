import React from 'react';

export interface TradingViewSymbolDetails {
  tvSymbol: string;
  proxyTvSymbol?: string;
  embedRestricted?: boolean;
  ticker: string;
  name: string;
  exchange: string;
  category: 'crypto' | 'equity' | 'commodity' | 'fund' | 'deposit';
  logo: string;
  tradingViewUrl: string;
  marketWatchUrl?: string;
  marketWatchPath?: string;
  isPseStock?: boolean;
}

export const getTradingViewSymbolDetails = (assetKey: string, assetName: string = ''): TradingViewSymbolDetails => {
  const key = (assetKey || '').toLowerCase();
  const name = (assetName || '').toLowerCase();

  if (key.includes('btc') || name.includes('bitcoin')) {
    return {
      tvSymbol: 'BITSTAMP:BTCUSD',
      ticker: 'BTCUSD',
      name: 'Bitcoin',
      exchange: 'Crypto Spot • Bitstamp / Binance',
      category: 'crypto',
      logo: '₿',
      tradingViewUrl: 'https://www.tradingview.com/symbols/BTCUSD/'
    };
  }

  if (key.includes('eth') || name.includes('ethereum')) {
    return {
      tvSymbol: 'BINANCE:ETHUSDT',
      ticker: 'ETHUSDT',
      name: 'Ethereum',
      exchange: 'Crypto Spot • Binance',
      category: 'crypto',
      logo: 'Ξ',
      tradingViewUrl: 'https://www.tradingview.com/symbols/ETHUSDT/'
    };
  }

  if (key.includes('sol') || name.includes('solana')) {
    return {
      tvSymbol: 'BINANCE:SOLUSDT',
      ticker: 'SOLUSDT',
      name: 'Solana',
      exchange: 'Crypto Spot • Binance',
      category: 'crypto',
      logo: '◎',
      tradingViewUrl: 'https://www.tradingview.com/symbols/SOLUSDT/'
    };
  }

  if (key.includes('paxg') || key.includes('pax gold') || (key.includes('pax') && !key.includes('spc'))) {
    return {
      tvSymbol: 'BINANCE:PAXGUSDT',
      ticker: 'PAXGUSDT',
      name: 'PAX Gold Bullion',
      exchange: 'Physical Gold Token • Binance',
      category: 'crypto',
      logo: '🪙',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PAXGUSDT/'
    };
  }

  if (key.includes('gold') || name.includes('gold') || key.includes('xau')) {
    return {
      tvSymbol: 'TVC:GOLD',
      ticker: 'GOLD',
      name: 'Spot Gold / USD',
      exchange: 'Global Commodities • TVC',
      category: 'commodity',
      logo: '🥇',
      tradingViewUrl: 'https://www.tradingview.com/symbols/TVC-GOLD/'
    };
  }

  if (key.includes('scc') || name.includes('semirara')) {
    return {
      tvSymbol: 'PSE:SCC',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'SCC',
      name: 'Semirara Mining & Power Corp',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '⛏️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-SCC/',
      marketWatchPath: '/investing/stock/scc?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/scc?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('spc') || name.includes('spc power')) {
    return {
      tvSymbol: 'PSE:SPC',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'SPC',
      name: 'SPC Power Corporation',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '⚡',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-SPC/',
      marketWatchPath: '/investing/stock/spc?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/spc?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('rcr') || name.includes('rcr reit') || name.includes('rl commercial')) {
    return {
      tvSymbol: 'PSE:RCR',
      proxyTvSymbol: 'AMEX:VNQ',
      embedRestricted: true,
      ticker: 'RCR',
      name: 'RL Commercial REIT, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-RCR/',
      marketWatchPath: '/investing/stock/rcr?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/rcr?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('areit') || name.includes('areit')) {
    return {
      tvSymbol: 'PSE:AREIT',
      proxyTvSymbol: 'AMEX:VNQ',
      embedRestricted: true,
      ticker: 'AREIT',
      name: 'AREIT, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-AREIT/',
      marketWatchPath: '/investing/stock/areit?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/areit?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('creit') || name.includes('creit')) {
    return {
      tvSymbol: 'PSE:CREIT',
      proxyTvSymbol: 'AMEX:VNQ',
      embedRestricted: true,
      ticker: 'CREIT',
      name: 'Citicore Energy REIT Corp',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '☀️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-CREIT/',
      marketWatchPath: '/investing/stock/creit?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/creit?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('mreit') || name.includes('mreit')) {
    return {
      tvSymbol: 'PSE:MREIT',
      proxyTvSymbol: 'AMEX:VNQ',
      embedRestricted: true,
      ticker: 'MREIT',
      name: 'MREIT, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-MREIT/',
      marketWatchPath: '/investing/stock/mreit?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/mreit?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('manulife') || name.includes('manulife')) {
    return {
      tvSymbol: 'AMEX:VNQ',
      proxyTvSymbol: 'NASDAQ:AAXJ',
      embedRestricted: true,
      ticker: 'Manulife Asia-Pac FoF',
      name: 'Manulife Asia Pacific REIT Fund of Funds',
      exchange: 'Philippine UITF / Asia-Pac REITs (NAVPU Fund)',
      category: 'fund',
      logo: '🏢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/AMEX-VNQ/'
    };
  }

  if (key.includes('mfc')) {
    return {
      tvSymbol: 'NYSE:MFC',
      ticker: 'MFC',
      name: 'Manulife Financial Corp',
      exchange: 'New York Stock Exchange (NYSE)',
      category: 'equity',
      logo: '🛡️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/NYSE-MFC/'
    };
  }

  if (key.includes('nvda') || name.includes('nvidia')) {
    return {
      tvSymbol: 'NASDAQ:NVDA',
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      category: 'equity',
      logo: '🟢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/NASDAQ-NVDA/'
    };
  }

  if (key.includes('aapl') || name.includes('apple')) {
    return {
      tvSymbol: 'NASDAQ:AAPL',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      category: 'equity',
      logo: '🍎',
      tradingViewUrl: 'https://www.tradingview.com/symbols/NASDAQ-AAPL/'
    };
  }

  if (key.includes('spy') || name.includes('s&p') || name.includes('sp500')) {
    return {
      tvSymbol: 'AMEX:SPY',
      ticker: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      exchange: 'NYSE Arca (AMEX)',
      category: 'fund',
      logo: '📈',
      tradingViewUrl: 'https://www.tradingview.com/symbols/AMEX-SPY/'
    };
  }

  if (key.includes('bdo')) {
    return {
      tvSymbol: 'PSE:BDO',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'BDO',
      name: 'BDO Unibank, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏦',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-BDO/',
      marketWatchPath: '/investing/stock/bdo?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/bdo?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('ali') || name.includes('ayala land')) {
    return {
      tvSymbol: 'PSE:ALI',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'ALI',
      name: 'Ayala Land, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏗️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-ALI/',
      marketWatchPath: '/investing/stock/ali?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/ali?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('smph') || name.includes('sm prime')) {
    return {
      tvSymbol: 'PSE:SMPH',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'SMPH',
      name: 'SM Prime Holdings, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🛍️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-SMPH/',
      marketWatchPath: '/investing/stock/smph?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/smph?countrycode=ph',
      isPseStock: true
    };
  }

  if (key.includes('jfc') || name.includes('jollibee')) {
    return {
      tvSymbol: 'PSE:JFC',
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: 'JFC',
      name: 'Jollibee Foods Corporation',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🐝',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-JFC/',
      marketWatchPath: '/investing/stock/jfc?countrycode=ph',
      marketWatchUrl: 'https://www.marketwatch.com/investing/stock/jfc?countrycode=ph',
      isPseStock: true
    };
  }

  // Fallback defaults: Check if ticker might be a PSE stock or crypto
  const cleanTicker = (key || 'ASSET').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isLikelyPse = key.includes('pse') || name.includes('pse') || key.includes('dragonfi') || name.includes('dragonfi');
  
  if (isLikelyPse) {
    const pseSym = cleanTicker.replace(/^PSE/, '').replace(/DRAGONFI$/, '');
    return {
      tvSymbol: `PSE:${pseSym}`,
      proxyTvSymbol: 'AMEX:EPHE',
      embedRestricted: true,
      ticker: pseSym,
      name: assetName || pseSym,
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🇵🇭',
      tradingViewUrl: `https://www.tradingview.com/symbols/PSE-${pseSym}/`,
      marketWatchPath: `/investing/stock/${pseSym.toLowerCase()}?countrycode=ph`,
      marketWatchUrl: `https://www.marketwatch.com/investing/stock/${pseSym.toLowerCase()}?countrycode=ph`,
      isPseStock: true
    };
  }

  return {
    tvSymbol: cleanTicker.length <= 5 ? `BINANCE:${cleanTicker}USDT` : 'BITSTAMP:BTCUSD',
    ticker: cleanTicker,
    name: assetName || cleanTicker,
    exchange: 'Global Financial Markets',
    category: 'crypto',
    logo: '📊',
    tradingViewUrl: `https://www.tradingview.com/symbols/${cleanTicker}/`
  };
};

/**
 * 1. Advanced Real-Time Chart Widget (Isolated Iframe Embed)
 */
export interface TradingViewAdvancedChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  interval?: string; // 1, 5, 15, 60, D, W, M
  timezone?: string;
  style?: string; // 1 = candles, 2 = line, 3 = area, 8 = heikin ashi
  locale?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  height?: number | string;
  width?: number | string;
  hide_side_toolbar?: boolean;
  hide_top_toolbar?: boolean;
  withdateranges?: boolean;
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
}

export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  symbol,
  theme = 'dark',
  interval = 'D',
  timezone = 'Asia/Manila',
  style = '1',
  locale = 'en',
  allow_symbol_change = true,
  height = '100%',
  width = '100%',
  hide_side_toolbar = false,
}) => {
  const cleanSymbol = symbol || 'BITSTAMP:BTCUSD';
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(cleanSymbol)}&interval=${interval}&theme=${theme}&style=${style}&locale=${locale}&timezone=${encodeURIComponent(timezone)}&withdateranges=1&studies=STD%3BSMA%1FSTD%3BRSI%1FSTD%3BMACD&hide_side_toolbar=${hide_side_toolbar ? '1' : '0'}&allow_symbol_change=${allow_symbol_change ? '1' : '0'}`;

  return (
    <div 
      className="w-full h-full min-h-[520px] rounded-xl overflow-hidden bg-slate-900" 
      style={{ height, width }}
    >
      <iframe
        title={`TradingView Advanced Chart - ${cleanSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0"
        style={{ minHeight: '520px', height: '100%', width: '100%' }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

/**
 * 2. Technical Analysis Gauge Widget (Isolated Iframe Embed)
 */
export interface TradingViewTechnicalAnalysisProps {
  symbol: string;
  theme?: 'light' | 'dark';
  interval?: string; // 1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M
  height?: number | string;
  width?: number | string;
}

export const TradingViewTechnicalAnalysis: React.FC<TradingViewTechnicalAnalysisProps> = ({
  symbol,
  theme = 'dark',
  interval = '1D',
  height = 460,
  width = '100%'
}) => {
  const cleanSymbol = symbol || 'BITSTAMP:BTCUSD';
  const config = {
    interval: interval,
    width: '100%',
    isTransparent: false,
    height: '100%',
    symbol: cleanSymbol,
    showIntervalTabs: true,
    displayMode: 'multiple',
    locale: 'en',
    colorTheme: theme
  };
  const iframeSrc = `https://www.tradingview-widget.com/embed-widget/technical-analysis/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;

  return (
    <div 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden bg-slate-900/30"
    >
      <iframe
        title={`TradingView Technical Analysis - ${cleanSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0"
        style={{ height: '100%', width: '100%' }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

/**
 * 3. Symbol Profile & Overview Widget (Isolated Iframe Embed)
 */
export interface TradingViewSymbolProfileProps {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number | string;
  width?: number | string;
}

export const TradingViewSymbolProfile: React.FC<TradingViewSymbolProfileProps> = ({
  symbol,
  theme = 'dark',
  height = 460,
  width = '100%'
}) => {
  const cleanSymbol = symbol || 'BITSTAMP:BTCUSD';
  const config = {
    width: '100%',
    height: '100%',
    isTransparent: false,
    colorTheme: theme,
    symbol: cleanSymbol,
    locale: 'en'
  };
  const iframeSrc = `https://www.tradingview-widget.com/embed-widget/symbol-profile/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;

  return (
    <div 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden bg-slate-900/30"
    >
      <iframe
        title={`TradingView Symbol Profile - ${cleanSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0"
        style={{ height: '100%', width: '100%' }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

/**
 * 4. Timeline / Market News Widget (Isolated Iframe Embed)
 */
export interface TradingViewTimelineNewsProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  feedMode?: 'symbol' | 'all_symbols' | 'market';
  height?: number | string;
  width?: number | string;
}

export const TradingViewTimelineNews: React.FC<TradingViewTimelineNewsProps> = ({
  symbol,
  theme = 'dark',
  feedMode = 'symbol',
  height = 540,
  width = '100%'
}) => {
  const cleanSymbol = symbol || 'BITSTAMP:BTCUSD';
  const config = {
    feedMode: feedMode === 'symbol' && symbol ? 'symbol' : 'market',
    symbol: cleanSymbol,
    isTransparent: false,
    displayMode: 'regular',
    width: '100%',
    height: '100%',
    colorTheme: theme,
    locale: 'en'
  };
  const iframeSrc = `https://www.tradingview-widget.com/embed-widget/timeline/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;

  return (
    <div 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden bg-slate-900/30"
    >
      <iframe
        title={`TradingView Timeline News - ${cleanSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0"
        style={{ height: '100%', width: '100%' }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

/**
 * 5. Mini Symbol Overview Widget (Isolated Iframe Embed)
 */
export interface TradingViewMiniChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  width?: number | string;
  height?: number | string;
}

export const TradingViewMiniChart: React.FC<TradingViewMiniChartProps> = ({
  symbol,
  theme = 'dark',
  width = '100%',
  height = 220
}) => {
  const cleanSymbol = symbol || 'BITSTAMP:BTCUSD';
  const config = {
    symbol: cleanSymbol,
    width: '100%',
    height: '100%',
    locale: 'en',
    dateRange: '12M',
    colorTheme: theme,
    isTransparent: false,
    autosize: true
  };
  const iframeSrc = `https://www.tradingview-widget.com/embed-widget/mini-symbol-overview/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;

  return (
    <div 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden bg-slate-900/30"
    >
      <iframe
        title={`TradingView Mini Chart - ${cleanSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0"
        style={{ height: '100%', width: '100%' }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};
