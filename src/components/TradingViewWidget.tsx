import React, { useEffect, useRef } from 'react';

export interface TradingViewSymbolDetails {
  tvSymbol: string;
  ticker: string;
  name: string;
  exchange: string;
  category: 'crypto' | 'equity' | 'commodity' | 'fund' | 'deposit';
  logo: string;
  tradingViewUrl: string;
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
      ticker: 'SCC',
      name: 'Semirara Mining & Power Corp',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '⛏️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-SCC/'
    };
  }

  if (key.includes('spc') || name.includes('spc power')) {
    return {
      tvSymbol: 'PSE:SPC',
      ticker: 'SPC',
      name: 'SPC Power Corporation',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '⚡',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-SPC/'
    };
  }

  if (key.includes('rcr') || name.includes('rcr reit') || name.includes('rl commercial')) {
    return {
      tvSymbol: 'PSE:RCR',
      ticker: 'RCR',
      name: 'RL Commercial REIT, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏢',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-RCR/'
    };
  }

  if (key.includes('mfc') || name.includes('manulife')) {
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
      ticker: 'BDO',
      name: 'BDO Unibank, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏦',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-BDO/'
    };
  }

  if (key.includes('ali') || name.includes('ayala land')) {
    return {
      tvSymbol: 'PSE:ALI',
      ticker: 'ALI',
      name: 'Ayala Land, Inc.',
      exchange: 'Philippine Stock Exchange (PSE)',
      category: 'equity',
      logo: '🏗️',
      tradingViewUrl: 'https://www.tradingview.com/symbols/PSE-ALI/'
    };
  }

  // Fallback defaults
  const cleanTicker = (key || 'ASSET').toUpperCase().replace(/[^A-Z0-9]/g, '');
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
 * 1. Advanced Real-Time Chart Widget
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
  enable_publishing = false,
  allow_symbol_change = true,
  height = '100%',
  width = '100%',
  hide_side_toolbar = false,
  hide_top_toolbar = false,
  withdateranges = true,
  details = true,
  hotlist = false,
  calendar = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const widgetConfig = {
      autosize: true,
      symbol: symbol || 'BITSTAMP:BTCUSD',
      interval: interval,
      timezone: timezone,
      theme: theme,
      style: style,
      locale: locale,
      enable_publishing: enable_publishing,
      allow_symbol_change: allow_symbol_change,
      calendar: calendar,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: hide_side_toolbar,
      hide_top_toolbar: hide_top_toolbar,
      withdateranges: withdateranges,
      details: details,
      hotlist: hotlist,
      studies: [
        'STD;SMA',
        'STD;RSI',
        'STD;MACD'
      ]
    };

    script.innerHTML = JSON.stringify(widgetConfig);
    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, timezone, style, locale, allow_symbol_change, hide_side_toolbar, hide_top_toolbar]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[520px] rounded-xl overflow-hidden bg-slate-900/50" 
      style={{ height, width }}
    />
  );
};

/**
 * 2. Technical Analysis Gauge Widget
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      interval: interval,
      width: '100%',
      isTransparent: false,
      height: '100%',
      symbol: symbol || 'BITSTAMP:BTCUSD',
      showIntervalTabs: true,
      displayMode: 'multiple',
      locale: 'en',
      colorTheme: theme
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme, interval]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden" 
    />
  );
};

/**
 * 3. Symbol Profile & Overview Widget
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      isTransparent: false,
      colorTheme: theme,
      symbol: symbol || 'BITSTAMP:BTCUSD',
      locale: 'en'
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden" 
    />
  );
};

/**
 * 4. Timeline / Market News Widget
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      feedMode: feedMode === 'symbol' && symbol ? 'symbol' : 'market',
      symbol: symbol || 'BITSTAMP:BTCUSD',
      isTransparent: false,
      displayMode: 'regular',
      width: '100%',
      height: '100%',
      colorTheme: theme,
      locale: 'en'
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme, feedMode]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden" 
    />
  );
};

/**
 * 5. Mini Symbol Overview Widget
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol: symbol || 'BITSTAMP:BTCUSD',
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '12M',
      colorTheme: theme,
      isTransparent: false,
      autosize: true,
      largeChartUrl: ''
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width }} 
      className="w-full rounded-xl overflow-hidden" 
    />
  );
};
