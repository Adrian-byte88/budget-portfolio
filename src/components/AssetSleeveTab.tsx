import React, { useState, useEffect, useRef } from 'react';
import { AssetPosition, TradeEntry, MarketAlert, IncomeBudgetPlan } from '../types';
import { Sliders, Plus, Play, RefreshCw, Sparkles, AlertTriangle, ShieldCheck, TrendingDown, TrendingUp, Info, Bell, Trash2, Calendar, Percent, BarChart2, ArrowRightLeft, Coins, Banknote, Wallet, Search, Check, ExternalLink, Zap, Building2, Globe, ChevronDown, CheckCircle2, DollarSign } from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { formatTimeAgo, getAssetValuation } from '../lib/formatters';
import { parseFormattedNumber } from '../utils/mathParser';
import { TradingViewAssetModal } from './TradingViewAssetModal';
import { getMarketWatchDetails, KNOWN_PSE_STOCKS, extractPseTicker } from '../utils/marketwatch';

export interface MarketSearchSuggestion {
  key: string;
  symbol: string;
  name: string;
  platform: string;
  class: 'safe' | 'risk' | 'physical' | 'liability';
  assetType: 'cash' | 'deposit' | 'hys' | 'crypto' | 'commodity' | 'equity' | 'property' | 'liability';
  exchange?: string;
  currentPriceUSD?: number;
  currentPricePHP?: number;
  change24h?: number;
  source: 'binance' | 'marketwatch' | 'pse' | 'uitf' | 'yahoo';
  categoryLabel?: string;
  marketwatchPath?: string;
  marketwatchUrl?: string;
}

// Curated Master Asset Catalog for instant zero-latency dropdown suggestions
export const MASTER_MARKET_ASSETS: MarketSearchSuggestion[] = [
  // Crypto & Metals (Binance / Paxos)
  { key: 'btc', symbol: 'BTC-USD', name: 'Bitcoin (BTC)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance / Crypto Spot', currentPriceUSD: 63500, currentPricePHP: 3869000, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'paxg', symbol: 'PAXG-USD', name: 'PAX Gold (PAXG)', platform: 'GCrypto / Paxos', class: 'risk', assetType: 'crypto', exchange: 'Paxos / Binance Spot', currentPriceUSD: 4045, currentPricePHP: 246500, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'eth', symbol: 'ETH-USD', name: 'Ethereum (ETH)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance / Crypto Spot', currentPriceUSD: 3450, currentPricePHP: 210200, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'sol', symbol: 'SOL-USD', name: 'Solana (SOL)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance / Crypto Spot', currentPriceUSD: 185, currentPricePHP: 11270, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'bnb', symbol: 'BNB-USD', name: 'BNB (Binance Coin)', platform: 'Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 580, currentPricePHP: 35340, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'xrp', symbol: 'XRP-USD', name: 'Ripple (XRP)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 0.62, currentPricePHP: 37.75, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'ada', symbol: 'ADA-USD', name: 'Cardano (ADA)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 0.45, currentPricePHP: 27.40, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'doge', symbol: 'DOGE-USD', name: 'Dogecoin (DOGE)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 0.14, currentPricePHP: 8.50, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'avax', symbol: 'AVAX-USD', name: 'Avalanche (AVAX)', platform: 'Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 28.50, currentPricePHP: 1736, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'sui', symbol: 'SUI-USD', name: 'Sui Network (SUI)', platform: 'Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 2.15, currentPricePHP: 131.00, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'link', symbol: 'LINK-USD', name: 'Chainlink (LINK)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 14.20, currentPricePHP: 865.00, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'dot', symbol: 'DOT-USD', name: 'Polkadot (DOT)', platform: 'GCrypto / Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 6.80, currentPricePHP: 414.00, source: 'binance', categoryLabel: 'Crypto & Digital' },
  { key: 'near', symbol: 'NEAR-USD', name: 'NEAR Protocol (NEAR)', platform: 'Binance', class: 'risk', assetType: 'crypto', exchange: 'Binance Spot', currentPriceUSD: 5.10, currentPricePHP: 310.50, source: 'binance', categoryLabel: 'Crypto & Digital' },
  
  // Philippine Equities via MarketWatch Feed
  { key: 'scc', symbol: 'SCC', name: 'Semirara Mining & Power Corp (SCC)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 20.80, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/scc?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/scc?countrycode=ph' },
  { key: 'spc', symbol: 'SPC', name: 'SPC Power Corporation (SPC)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 10.28, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/spc?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/spc?countrycode=ph' },
  { key: 'smph', symbol: 'SMPH', name: 'SM Prime Holdings (SMPH)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 26.50, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/smph?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/smph?countrycode=ph' },
  { key: 'ali', symbol: 'ALI', name: 'Ayala Land Inc. (ALI)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 29.80, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/ali?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/ali?countrycode=ph' },
  { key: 'bdo', symbol: 'BDO', name: 'BDO Unibank (BDO)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 145.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/bdo?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/bdo?countrycode=ph' },
  { key: 'bpi', symbol: 'BPI', name: 'Bank of the Philippine Islands (BPI)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 118.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/bpi?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/bpi?countrycode=ph' },
  { key: 'tel', symbol: 'TEL', name: 'PLDT Inc. (TEL)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 1420.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/tel?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/tel?countrycode=ph' },
  { key: 'glo', symbol: 'GLO', name: 'Globe Telecom (GLO)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 2150.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/glo?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/glo?countrycode=ph' },
  { key: 'jfc', symbol: 'JFC', name: 'Jollibee Foods Corp (JFC)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 242.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/jfc?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/jfc?countrycode=ph' },
  { key: 'ict', symbol: 'ICT', name: 'International Container Terminal (ICT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 395.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/ict?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/ict?countrycode=ph' },
  { key: 'monde', symbol: 'MONDE', name: 'Monde Nissin Corp (MONDE)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 9.20, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/monde?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/monde?countrycode=ph' },
  { key: 'acen', symbol: 'ACEN', name: 'ACEN Corporation (ACEN)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 3.90, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/acen?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/acen?countrycode=ph' },
  { key: 'cnvrg', symbol: 'CNVRG', name: 'Converge ICT Solutions (CNVRG)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 14.50, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/cnvrg?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/cnvrg?countrycode=ph' },
  { key: 'mer', symbol: 'MER', name: 'Manila Electric Company (MER)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 412.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/mer?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/mer?countrycode=ph' },
  { key: 'sm', symbol: 'SM', name: 'SM Investments Corporation (SM)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 885.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/sm?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/sm?countrycode=ph' },
  { key: 'ac', symbol: 'AC', name: 'Ayala Corporation (AC)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 650.00, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/ac?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/ac?countrycode=ph' },
  { key: 'meg', symbol: 'MEG', name: 'Megaworld Corporation (MEG)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 2.10, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/meg?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/meg?countrycode=ph' },
  { key: 'dmci', symbol: 'DMCI', name: 'DMCI Holdings, Inc. (DMCI)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine Stock Exchange (MarketWatch)', currentPricePHP: 11.40, source: 'marketwatch', categoryLabel: 'Philippine Stocks (MarketWatch)', marketwatchPath: '/investing/stock/dmci?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/dmci?countrycode=ph' },

  // Philippine REITs via MarketWatch Feed & Trust Funds
  { key: 'rcr', symbol: 'RCR', name: 'RL Commercial REIT (RCR)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 7.16, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/rcr?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/rcr?countrycode=ph' },
  { key: 'areit', symbol: 'AREIT', name: 'AREIT Inc. (AREIT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 34.50, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/areit?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/areit?countrycode=ph' },
  { key: 'creit', symbol: 'CREIT', name: 'Citicore Energy REIT (CREIT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 2.85, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/creit?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/creit?countrycode=ph' },
  { key: 'mreit', symbol: 'MREIT', name: 'MREIT Inc. (MREIT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 12.80, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/mreit?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/mreit?countrycode=ph' },
  { key: 'ddmpr', symbol: 'DDMPR', name: 'DDMP REIT Inc. (DDMPR)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 1.15, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/ddmpr?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/ddmpr?countrycode=ph' },
  { key: 'filrt', symbol: 'FILRT', name: 'Filinvest REIT (FILRT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 2.80, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/filrt?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/filrt?countrycode=ph' },
  { key: 'preit', symbol: 'PREIT', name: 'Premiere Island Power REIT (PREIT)', platform: 'DragonFi / PSE (MarketWatch)', class: 'risk', assetType: 'equity', exchange: 'Philippine REIT (MarketWatch)', currentPricePHP: 1.55, source: 'marketwatch', categoryLabel: 'Philippine REITs (MarketWatch)', marketwatchPath: '/investing/stock/preit?countrycode=ph', marketwatchUrl: 'https://www.marketwatch.com/investing/stock/preit?countrycode=ph' },
  { key: 'manulife', symbol: 'MANULIFE-FOF', name: 'Manulife Asia Pacific REIT Fund of Funds', platform: 'Manulife Trust', class: 'risk', assetType: 'equity', exchange: 'Philippine Trust Fund / UITF', currentPricePHP: 50.47, source: 'uitf', categoryLabel: 'REITs & Trust Funds' },

  // US Equities & Global ETFs (NYSE / NASDAQ)
  { key: 'spy', symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust (SPY)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NYSE Arca', currentPriceUSD: 540.00, currentPricePHP: 32900, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust (QQQ)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 480.00, currentPricePHP: 29250, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'vti', symbol: 'VTI', name: 'Vanguard Total Stock Market (VTI)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NYSE Arca', currentPriceUSD: 275.00, currentPricePHP: 16750, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'voo', symbol: 'VOO', name: 'Vanguard S&P 500 ETF (VOO)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NYSE Arca', currentPriceUSD: 495.00, currentPricePHP: 30150, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corporation (NVDA)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 125.00, currentPricePHP: 7615, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'aapl', symbol: 'AAPL', name: 'Apple Inc. (AAPL)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 228.00, currentPricePHP: 13890, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'msft', symbol: 'MSFT', name: 'Microsoft Corporation (MSFT)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 445.00, currentPricePHP: 27110, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'tsla', symbol: 'TSLA', name: 'Tesla Inc. (TSLA)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 215.00, currentPricePHP: 13100, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc. (AMZN)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 185.00, currentPricePHP: 11270, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc. Class A (GOOGL)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 165.00, currentPricePHP: 10050, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'meta', symbol: 'META', name: 'Meta Platforms Inc. (META)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 510.00, currentPricePHP: 31050, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'amd', symbol: 'AMD', name: 'Advanced Micro Devices (AMD)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NASDAQ', currentPriceUSD: 155.00, currentPricePHP: 9440, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
  { key: 'pltr', symbol: 'PLTR', name: 'Palantir Technologies (PLTR)', platform: 'Interactive Brokers / Gotrade', class: 'risk', assetType: 'equity', exchange: 'NYSE', currentPriceUSD: 31.50, currentPricePHP: 1920, source: 'yahoo', categoryLabel: 'US & Global ETFs' },
];

interface AssetSleeveTabProps {
  assets: AssetPosition[];
  onUpdateAssetPrice: (key: string, newPrice: number) => void;
  onUpdateAssetHoldings: (
    key: string, 
    units: number, 
    cost: number, 
    details?: { 
      startDate?: string; 
      maturityDate?: string; 
      yieldPercent?: number; 
      yieldFrequency?: 'annual' | 'monthly' | 'semi-annual' | 'quarterly'; 
      withholdingTaxPercent?: number;
      assetClass?: 'safe' | 'risk' | 'physical' | 'liability' | 'hys';
      assetType?: 'cash' | 'deposit' | 'hys' | 'crypto' | 'commodity' | 'equity' | 'property' | 'liability';
    }
  ) => void;
  onDeleteAsset?: (key: string) => void;
  onAddTrade?: (trade: Omit<TradeEntry, 'id'>) => void;
  targetAllocation: number;
  onUpdateTargetAllocation: (val: number) => void;
  onExecuteSyncAI: (customKey: string) => Promise<any>;
  usdPhpRate: number;
  onAddAsset: (asset: AssetPosition) => void;
  alerts?: MarketAlert[];
  onAddAlert?: (alert: Omit<MarketAlert, 'id' | 'timestamp'>) => void;
  onDeleteAlert?: (id: string) => void;
  highlightId?: { type: string; id: string; tab?: string } | null;
  incomeBudgetPlan?: IncomeBudgetPlan;
  onUpdateIncomePlan?: (plan: IncomeBudgetPlan) => void;
  isAdmin?: boolean;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  onNavigateTab?: (tab: string) => void;
}

export default function AssetSleeveTab({
  assets,
  onUpdateAssetPrice,
  onUpdateAssetHoldings,
  onDeleteAsset,
  onAddTrade,
  targetAllocation,
  onUpdateTargetAllocation,
  onExecuteSyncAI,
  usdPhpRate,
  onAddAsset,
  alerts = [],
  onAddAlert,
  onDeleteAlert,
  highlightId,
  incomeBudgetPlan,
  onUpdateIncomePlan,
  isAdmin = false,
  subscriptionTier = 'pro',
  onNavigateTab,
}: AssetSleeveTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'safe' | 'risk' | 'physical' | 'liability'>('safe');
  const [selectedTradingViewAsset, setSelectedTradingViewAsset] = useState<AssetPosition | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [customKey, setCustomKey] = useState('');

  // Relative timestamp ticker
  const [, setTimeTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimeTicker((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Auto-switch subtabs or open forms when pinpointed by search engine
  useEffect(() => {
    if (!highlightId) return;
    if (highlightId.id === 'safe-assets-section') setActiveSubTab('safe');
    else if (highlightId.id === 'risk-assets-section') setActiveSubTab('risk');
    else if (highlightId.id === 'physical-assets-section') setActiveSubTab('physical');
    else if (highlightId.type === 'Asset') {
      const asset = assets.find(a => a.key === highlightId.id);
      if (asset) {
        setActiveSubTab(asset.class as any);
      }
    }
  }, [highlightId, assets]);

  // Manual Asset Adjust Modal state
  const [editingAsset, setEditingAsset] = useState<AssetPosition | null>(null);
  const [editUnits, setEditUnits] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editClass, setEditClass] = useState<'safe' | 'risk' | 'physical' | 'liability' | 'hys'>('safe');
  const [editAssetType, setEditAssetType] = useState<'cash' | 'deposit' | 'hys' | 'crypto' | 'commodity' | 'equity' | 'property' | 'liability'>('cash');
  const [editStartDate, setEditStartDate] = useState('');
  const [editMaturityDate, setEditMaturityDate] = useState('');
  const [editYieldPercent, setEditYieldPercent] = useState('');
  const [editYieldFrequency, setEditYieldFrequency] = useState<'annual' | 'monthly' | 'semi-annual' | 'quarterly'>('annual');
  const [editWithholdingTax, setEditWithholdingTax] = useState('');

  const handleQuickTransferClass = (asset: AssetPosition, targetClass: 'safe' | 'risk' | 'physical' | 'liability') => {
    const targetType = targetClass === 'liability' ? 'liability' : (asset.assetType === 'liability' ? 'property' : asset.assetType);
    onUpdateAssetHoldings(asset.key, asset.units, asset.costBasisPHP, {
      startDate: asset.startDate,
      maturityDate: asset.maturityDate,
      yieldPercent: asset.yieldPercent,
      yieldFrequency: asset.yieldFrequency,
      withholdingTaxPercent: asset.withholdingTaxPercent,
      assetClass: targetClass,
      assetType: targetType,
    });
  };

  // Transfer Across Assets state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromKey, setTransferFromKey] = useState<string>('');
  const [transferToKey, setTransferToKey] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  const handleExecuteAssetTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (!transferFromKey || !transferToKey) {
      setTransferError('Please select both a source asset and a destination asset.');
      return;
    }

    if (transferFromKey === transferToKey) {
      setTransferError('Source and destination assets must be different.');
      return;
    }

    const fromAsset = assets.find((a) => a.key === transferFromKey);
    const toAsset = assets.find((a) => a.key === transferToKey);

    if (!fromAsset || !toAsset) {
      setTransferError('Selected asset could not be found.');
      return;
    }

    const amountPHP = parseFormattedNumber(transferAmount);
    if (isNaN(amountPHP) || amountPHP <= 0) {
      setTransferError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    // Determine unit prices and asset categories
    const isFromPhysical = fromAsset.class === 'physical' || fromAsset.assetType === 'property';
    const isFromSafe = fromAsset.class === 'safe' || fromAsset.assetType === 'cash' || fromAsset.assetType === 'deposit' || fromAsset.assetType === 'hys';
    const isFromLiability = fromAsset.class === 'liability' || fromAsset.assetType === 'liability';

    let fromUnitPrice = fromAsset.currentPricePHP;
    if (!isFromSafe && !isFromLiability && !isFromPhysical && (!fromUnitPrice || fromUnitPrice <= 0 || (fromUnitPrice === 1 && fromAsset.costBasisPHP > 10))) {
      fromUnitPrice = fromAsset.units > 0 ? fromAsset.costBasisPHP / fromAsset.units : fromAsset.costBasisPHP;
    }
    if (isFromSafe || isFromLiability || isFromPhysical) fromUnitPrice = 1;

    const isToPhysical = toAsset.class === 'physical' || toAsset.assetType === 'property';
    const isToSafe = toAsset.class === 'safe' || toAsset.assetType === 'cash' || toAsset.assetType === 'deposit' || toAsset.assetType === 'hys';
    const isToLiability = toAsset.class === 'liability' || toAsset.assetType === 'liability';

    let toUnitPrice = toAsset.currentPricePHP;
    if (!isToSafe && !isToLiability && !isToPhysical && (!toUnitPrice || toUnitPrice <= 0 || (toUnitPrice === 1 && toAsset.costBasisPHP > 10))) {
      toUnitPrice = toAsset.units > 0 ? toAsset.costBasisPHP / toAsset.units : toAsset.costBasisPHP;
    }
    if (isToSafe || isToLiability || isToPhysical) toUnitPrice = 1;

    // Deduct from Source
    const newFromCost = Math.max(0, fromAsset.costBasisPHP - amountPHP);
    let newFromUnits = fromAsset.units;
    if (isFromPhysical) {
      // Physical assets retain their unit count; principal cost basis is adjusted
      newFromUnits = fromAsset.units;
    } else if (isFromSafe || isFromLiability) {
      newFromUnits = newFromCost;
    } else {
      const unitsDeducted = amountPHP / (fromUnitPrice || 1);
      newFromUnits = Math.max(0, fromAsset.units - unitsDeducted);
    }

    // Add to Target
    const newToCost = toAsset.costBasisPHP + amountPHP;
    let newToUnits = toAsset.units;
    if (isToPhysical) {
      // Physical assets add directly to principal cost basis without changing unit count
      newToUnits = toAsset.units;
    } else if (isToSafe) {
      // Safe Shield Protection Assets: add transfer amount directly to principal cost basis & cash balance
      newToUnits = newToCost;
    } else if (isToLiability) {
      // Liabilities & Loans: add transfer amount directly to principal debt balance
      newToUnits = newToCost;
    } else {
      const unitsAdded = amountPHP / (toUnitPrice || 1);
      newToUnits = toAsset.units + unitsAdded;
    }

    // Update both holdings
    onUpdateAssetHoldings(fromAsset.key, newFromUnits, newFromCost, {
      startDate: fromAsset.startDate,
      maturityDate: fromAsset.maturityDate,
      yieldPercent: fromAsset.yieldPercent,
      yieldFrequency: fromAsset.yieldFrequency,
      withholdingTaxPercent: fromAsset.withholdingTaxPercent,
      assetClass: fromAsset.class,
      assetType: fromAsset.assetType,
    });

    onUpdateAssetHoldings(toAsset.key, newToUnits, newToCost, {
      startDate: toAsset.startDate,
      maturityDate: toAsset.maturityDate,
      yieldPercent: toAsset.yieldPercent,
      yieldFrequency: toAsset.yieldFrequency,
      withholdingTaxPercent: toAsset.withholdingTaxPercent,
      assetClass: toAsset.class,
      assetType: toAsset.assetType,
    });

    // Reset and close
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferNotes('');
  };

  // Bi-Monthly Payday Income Deposit state (15th & 30th)
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayTargetKey, setPaydayTargetKey] = useState<string>('available_cash');
  const [paydayAmount, setPaydayAmount] = useState<string>('10000');
  const [paydayDate, setPaydayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paydayType, setPaydayType] = useState<string>('semimonthly');
  const [isRecurringPayday, setIsRecurringPayday] = useState<boolean>(true);
  const [paydayNotes, setPaydayNotes] = useState<string>('15th Payday Salary Deposit');
  const [paydayError, setPaydayError] = useState<string>('');

  // Scheduled Paydays state with deduplication cleanup
  const [scheduledPaydays, setScheduledPaydays] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('wealthvault_scheduled_paydays');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      
      // Deduplicate items by id and targetKey+paydayDate
      const seen = new Set<string>();
      return parsed.filter(item => {
        if (!item || !item.id) return false;
        const key = `${item.targetKey || 'cash'}_${item.paydayDate}_${item.amountPHP}`;
        if (seen.has(key) && item.status === 'pending') return false;
        seen.add(key);
        return true;
      });
    } catch {
      return [];
    }
  });

  // Income Allocation Matrix auto-sync calculations for Safe & Risk Sleeves
  const expectedMonthlyAssetAlloc = incomeBudgetPlan?.assetInvestmentAllocation ?? 0;
  const expectedPaydayAssetAlloc = Math.round(expectedMonthlyAssetAlloc / 2);
  const isProOrAdmin = Boolean(isAdmin || subscriptionTier === 'pro' || subscriptionTier === 'enterprise');

  // Synchronize scheduled auto-deposit with Income Allocation Matrix
  const syncScheduleWithMatrix = (targetScheduleId?: string) => {
    if (expectedPaydayAssetAlloc <= 0) return;
    setScheduledPaydays((prev) => {
      let updated: any[];
      if (targetScheduleId) {
        updated = prev.map((p) => (p.id === targetScheduleId ? { ...p, amountPHP: expectedPaydayAssetAlloc } : p));
      } else {
        const pdInfo = getNextPaydayInfo();
        const existingIdx = prev.findIndex(
          (p) => p.status === 'pending' && (p.isRecurring || p.paydayType === 'semimonthly' || p.frequency === 'semimonthly')
        );
        if (existingIdx >= 0) {
          updated = prev.map((p, idx) => (idx === existingIdx ? { ...p, amountPHP: expectedPaydayAssetAlloc } : p));
        } else {
          const newSchedule = {
            id: 'payday_matrix_' + Date.now(),
            targetKey: incomeBudgetPlan?.targetAssetKey || 'available_cash',
            amountPHP: expectedPaydayAssetAlloc,
            paydayDate: pdInfo.targetPaydayDateStr,
            paydayType: 'semimonthly',
            frequency: 'semimonthly',
            isRecurring: true,
            status: 'pending',
            notes: `Income Allocation Matrix Auto-Deposit (15th & 30th) • ₱${expectedPaydayAssetAlloc.toLocaleString()}`,
            createdAt: new Date().toISOString(),
          };
          updated = [newSchedule, ...prev];
        }
      }
      localStorage.setItem('wealthvault_scheduled_paydays', JSON.stringify(updated));
      return updated;
    });
  };

  const getNextPaydayInfo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate 15th payday date
    const p15Date = day <= 15 ? new Date(year, month, 15) : new Date(year, month + 1, 15);
    const p15Str = p15Date.toISOString().split('T')[0];

    // Calculate End of Month payday date (30th/31st/28th)
    const lastDayThisMonth = new Date(year, month + 1, 0).getDate();
    const pEndOfMonthDate = day <= lastDayThisMonth
      ? new Date(year, month, lastDayThisMonth)
      : new Date(year, month + 1, new Date(year, month + 2, 0).getDate());
    const p30Str = pEndOfMonthDate.toISOString().split('T')[0];

    let paydayTitle = '15th Payday';
    let paydayTypeLabel = '15th Income';
    let badgeText = '15TH PAYDAY';
    let targetPaydayDateStr = p15Str;
    let diffDays = 0;
    let daysText = '';

    if (day < 15) {
      diffDays = 15 - day;
      paydayTitle = '15th Payday';
      targetPaydayDateStr = p15Str;
      paydayTypeLabel = '15th Income';
      badgeText = '15TH PAYDAY';
      daysText = diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`;
    } else if (day === 15) {
      diffDays = 0;
      paydayTitle = '15th Payday';
      targetPaydayDateStr = p15Str;
      paydayTypeLabel = '15th Income';
      badgeText = '15TH PAYDAY TODAY';
      daysText = 'Today!';
    } else if (day < lastDayThisMonth) {
      diffDays = lastDayThisMonth - day;
      paydayTitle = 'End of Month Payday';
      targetPaydayDateStr = p30Str;
      paydayTypeLabel = 'End of Month Income';
      badgeText = 'END OF MONTH PAYDAY';
      daysText = diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`;
    } else if (day === lastDayThisMonth) {
      diffDays = 0;
      paydayTitle = 'End of Month Payday';
      targetPaydayDateStr = p30Str;
      paydayTypeLabel = 'End of Month Income';
      badgeText = 'END OF MONTH TODAY';
      daysText = 'Today!';
    } else {
      const diffTime = p15Date.getTime() - today.getTime();
      diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      paydayTitle = '15th Payday';
      targetPaydayDateStr = p15Str;
      paydayTypeLabel = '15th Income';
      badgeText = '15TH PAYDAY';
      daysText = `in ${diffDays} days`;
    }

    return { paydayTitle, paydayTypeLabel, badgeText, diffDays, daysText, todayStr, p15Str, p30Str, targetPaydayDateStr };
  };

  const computeSchedulePresetInfo = (presetKey: string, baseDateStr: string = '') => {
    const base = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // 15th
    const p15Date = day <= 15 ? new Date(year, month, 15) : new Date(year, month + 1, 15);
    const p15Str = p15Date.toISOString().split('T')[0];

    // End of Month
    const lastDayThisMonth = new Date(year, month + 1, 0).getDate();
    const pEndOfMonthDate = day <= lastDayThisMonth
      ? new Date(year, month, lastDayThisMonth)
      : new Date(year, month + 1, new Date(year, month + 2, 0).getDate());
    const pEndOfMonthStr = pEndOfMonthDate.toISOString().split('T')[0];

    // Next after today/base
    if (presetKey === 'semimonthly' || presetKey === '15th_30th') {
      if (day < 15) {
        return { dateStr: p15Str, defaultNote: '15th Semi-Monthly Salary Deposit', label: 'Every 15th & End of Month' };
      } else if (day >= 15 && day < lastDayThisMonth) {
        return { dateStr: pEndOfMonthStr, defaultNote: 'End of Month Salary Deposit', label: 'Every 15th & End of Month' };
      } else {
        const next15 = new Date(year, month + 1, 15);
        return { dateStr: next15.toISOString().split('T')[0], defaultNote: '15th Semi-Monthly Salary Deposit', label: 'Every 15th & End of Month' };
      }
    }

    switch (presetKey) {
      case '15th':
        return { dateStr: p15Str, defaultNote: '15th Payday Salary Deposit', label: '15th Payday' };
      case '30th':
      case 'endofmonth':
        return { dateStr: pEndOfMonthStr, defaultNote: 'End of Month Salary Deposit', label: 'End of Month Payday' };
      case 'weekly': {
        const weeklyDate = new Date(base);
        weeklyDate.setDate(weeklyDate.getDate() + 7);
        return { dateStr: weeklyDate.toISOString().split('T')[0], defaultNote: 'Weekly Income Deposit', label: 'Weekly Income (Every 7 Days)' };
      }
      case 'monthly': {
        const monthlyDate = new Date(year, month + 1, 1);
        return { dateStr: monthlyDate.toISOString().split('T')[0], defaultNote: 'Monthly Salary Deposit', label: 'Monthly Salary (1st of Next Month)' };
      }
      case 'today':
        return { dateStr: todayStr, defaultNote: 'Immediate Cash Deposit', label: 'Immediate Deposit (Today)' };
      default:
        return { dateStr: todayStr, defaultNote: 'Custom Cash Income Deposit', label: 'Custom Date' };
    }
  };

  const computeNextUpcomingDate = (frequency: string, fromDateStr: string) => {
    const base = new Date(fromDateStr + 'T00:00:00');
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();

    if (frequency === 'semimonthly' || frequency === '15th_30th') {
      const lastDayThisMonth = new Date(year, month + 1, 0).getDate();
      if (day <= 15) {
        // If 15th just completed, the next one is End of Month (30th/31st)
        const dEnd = new Date(year, month, lastDayThisMonth);
        return dEnd.toISOString().split('T')[0];
      } else {
        // If End of Month just completed, the next one is 15th of next month
        const dNext15 = new Date(year, month + 1, 15);
        return dNext15.toISOString().split('T')[0];
      }
    } else if (frequency === '15th') {
      const next15 = new Date(year, month + 1, 15);
      return next15.toISOString().split('T')[0];
    } else if (frequency === 'endofmonth' || frequency === '30th') {
      const lastDayNextMonth = new Date(year, month + 2, 0).getDate();
      const nextEnd = new Date(year, month + 1, lastDayNextMonth);
      return nextEnd.toISOString().split('T')[0];
    } else if (frequency === 'weekly') {
      const nextWeek = new Date(base);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    } else if (frequency === 'monthly') {
      const nextMonth = new Date(year, month + 1, 1);
      return nextMonth.toISOString().split('T')[0];
    }
    return fromDateStr;
  };

  const depositToCashOrHys = (targetKey: string, amountPHP: number, notes: string) => {
    let targetAsset = assets.find((a) => a.key === targetKey)
      || assets.find((a) => a.key === 'hys' || a.assetType === 'hys')
      || assets.find((a) => a.key === 'available_cash')
      || assets.find((a) => a.assetType === 'cash');

    if (!targetAsset) {
      const newCashAsset: AssetPosition = {
        key: 'available_cash',
        name: 'Available Cash Reserve (15th/30th Income)',
        class: 'safe',
        assetType: 'cash',
        platform: 'Primary Operating Bank',
        units: amountPHP,
        costBasisPHP: amountPHP,
        currentPricePHP: 1,
        yieldPercent: 0,
        yieldFrequency: 'annual',
        withholdingTaxPercent: 0,
        change24h: 0.00
      };
      onAddAsset(newCashAsset);
    } else {
      const newCost = targetAsset.costBasisPHP + amountPHP;
      const newUnits = newCost;

      onUpdateAssetHoldings(targetAsset.key, newUnits, newCost, {
        startDate: targetAsset.startDate,
        maturityDate: targetAsset.maturityDate,
        yieldPercent: targetAsset.yieldPercent,
        yieldFrequency: targetAsset.yieldFrequency,
        withholdingTaxPercent: targetAsset.withholdingTaxPercent,
        assetClass: targetAsset.class,
        assetType: targetAsset.assetType,
      });
    }

    if (onAddTrade) {
      onAddTrade({
        assetKey: targetAsset ? targetAsset.key : 'available_cash',
        assetName: targetAsset ? targetAsset.name : 'Available Cash Reserve',
        action: 'BUY',
        units: amountPHP,
        pricePHP: 1,
        amountPHP: amountPHP,
        date: new Date().toISOString().split('T')[0],
        notes: notes || 'Payday Automatic Cash Income Deposit'
      });
    }
  };

  // Execution protection ref to prevent duplicate trigger during React state changes
  const isAutoProcessingRef = React.useRef(false);

  // Auto-process due paydays once on mount or when scheduled list changes
  useEffect(() => {
    if (isAutoProcessingRef.current) return;
    const todayStr = new Date().toISOString().split('T')[0];

    let currentSchedules: any[] = [];
    try {
      const saved = localStorage.getItem('wealthvault_scheduled_paydays');
      currentSchedules = saved ? JSON.parse(saved) : [];
    } catch {
      currentSchedules = [];
    }

    let executedHistory: Record<string, boolean> = {};
    try {
      const savedHist = localStorage.getItem('wealthvault_executed_paydays');
      executedHistory = savedHist ? JSON.parse(savedHist) : {};
    } catch {
      executedHistory = {};
    }

    let hasChanges = false;
    const updatedSchedules: any[] = [];

    for (const item of currentSchedules) {
      if (!item || item.status === 'paused' || item.status === 'cancelled') {
        updatedSchedules.push(item);
        continue;
      }

      const isDue = item.paydayDate && item.paydayDate <= todayStr;
      const executionKey = `${item.id}_${item.paydayDate}`;
      const alreadyExecuted = !!executedHistory[executionKey] || (item.lastExecutedDate === item.paydayDate);

      if (isDue && !alreadyExecuted) {
        // Execute deposit EXACTLY ONCE
        isAutoProcessingRef.current = true;
        depositToCashOrHys(
          item.targetKey,
          item.amountPHP,
          item.notes || `Automatic Payday Deposit on ${item.paydayDate}`
        );
        executedHistory[executionKey] = true;
        hasChanges = true;

        if (item.isRecurring || item.paydayType === 'semimonthly' || item.frequency === 'semimonthly') {
          // Advance to the next upcoming payday (e.g. from 15th to 30th/31st, or from 30th to 15th of next month)
          const nextDate = computeNextUpcomingDate(item.frequency || item.paydayType || 'semimonthly', item.paydayDate);
          const nextPreset = computeSchedulePresetInfo(item.frequency || item.paydayType || 'semimonthly', nextDate);
          
          updatedSchedules.push({
            ...item,
            isRecurring: true,
            status: 'pending',
            lastExecutedDate: item.paydayDate,
            paydayDate: nextDate,
            notes: nextPreset.defaultNote
          });
        } else {
          updatedSchedules.push({
            ...item,
            status: 'executed',
            lastExecutedDate: item.paydayDate,
            executedAt: todayStr
          });
        }
      } else {
        updatedSchedules.push(item);
      }
    }

    if (hasChanges) {
      setScheduledPaydays(updatedSchedules);
      localStorage.setItem('wealthvault_scheduled_paydays', JSON.stringify(updatedSchedules));
      localStorage.setItem('wealthvault_executed_paydays', JSON.stringify(executedHistory));
    }
    isAutoProcessingRef.current = false;
  }, []); // Run on mount

  const handleExecutePaydayDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaydayError('');

    const amountPHP = parseFormattedNumber(paydayAmount);
    if (isNaN(amountPHP) || amountPHP <= 0) {
      setPaydayError('Please enter a valid deposit amount greater than 0.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = paydayDate <= todayStr;
    const scheduleId = 'payday_' + Date.now();

    // Read executed history
    let executedHistory: Record<string, boolean> = {};
    try {
      const savedHist = localStorage.getItem('wealthvault_executed_paydays');
      executedHistory = savedHist ? JSON.parse(savedHist) : {};
    } catch {
      executedHistory = {};
    }

    let updatedList = [...scheduledPaydays];

    if (isToday) {
      // 1. Execute SINGLE deposit immediately for today
      depositToCashOrHys(paydayTargetKey, amountPHP, paydayNotes || `Payday Income Deposit (${todayStr})`);
      executedHistory[`${scheduleId}_${todayStr}`] = true;

      // 2. If recurring, schedule the NEXT payday date (e.g. if today is 15th, next is 30th/End of Month)
      if (isRecurringPayday || paydayType === 'semimonthly') {
        const nextDate = computeNextUpcomingDate(paydayType, todayStr);
        const nextPreset = computeSchedulePresetInfo(paydayType, nextDate);

        // Remove any old conflicting pending semi-monthly schedules for this target
        updatedList = updatedList.filter(
          (p) => !(p.targetKey === paydayTargetKey && p.status === 'pending' && (p.isRecurring || p.paydayType === 'semimonthly'))
        );

        const recurringItem = {
          id: scheduleId,
          amountPHP,
          paydayType,
          frequency: paydayType,
          isRecurring: true,
          targetKey: paydayTargetKey,
          paydayDate: nextDate,
          lastExecutedDate: todayStr,
          notes: nextPreset.defaultNote,
          createdAt: todayStr,
          status: 'pending',
        };

        updatedList = [recurringItem, ...updatedList];
      }
    } else {
      // Future target date: schedule without immediate deposit
      // Remove any conflicting pending schedule for same target and date
      updatedList = updatedList.filter(
        (p) => !(p.targetKey === paydayTargetKey && p.paydayDate === paydayDate && p.status === 'pending')
      );

      const newItem = {
        id: scheduleId,
        amountPHP,
        paydayType,
        frequency: paydayType,
        isRecurring: isRecurringPayday || paydayType === 'semimonthly',
        targetKey: paydayTargetKey,
        paydayDate,
        notes: paydayNotes || `${paydayType === '15th' ? '15th' : paydayType === '30th' ? '30th' : 'Payday'} Income Deposit`,
        createdAt: todayStr,
        status: 'pending',
      };

      updatedList = [newItem, ...updatedList];
    }

    setScheduledPaydays(updatedList);
    localStorage.setItem('wealthvault_scheduled_paydays', JSON.stringify(updatedList));
    localStorage.setItem('wealthvault_executed_paydays', JSON.stringify(executedHistory));

    setShowPaydayModal(false);
    setPaydayAmount('10000');
    setPaydayNotes('');
  };

  // Add Asset Form state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [newAssetKey, setNewAssetKey] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetPlatform, setNewAssetPlatform] = useState('');
  const [newAssetClass, setNewAssetClass] = useState<'safe' | 'risk' | 'physical' | 'liability' | 'hys'>('safe');
  const [newAssetType, setNewAssetType] = useState<'cash' | 'deposit' | 'hys' | 'crypto' | 'commodity' | 'equity' | 'property' | 'liability'>('cash');
  const [newAssetUnits, setNewAssetUnits] = useState('1');
  const [newAssetCost, setNewAssetCost] = useState('0');
  const [newAssetPrice, setNewAssetPrice] = useState('1');
  const [newAssetStartDate, setNewAssetStartDate] = useState('');
  const [newAssetMaturityDate, setNewAssetMaturityDate] = useState('');
  const [newAssetYieldPercent, setNewAssetYieldPercent] = useState('');
  const [newAssetYieldFrequency, setNewAssetYieldFrequency] = useState<'annual' | 'monthly' | 'semi-annual' | 'quarterly'>('annual');
  const [newAssetWithholdingTax, setNewAssetWithholdingTax] = useState('20');

  // Live Market Search & Autocomplete state
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketSuggestions, setMarketSuggestions] = useState<MarketSearchSuggestion[]>(MASTER_MARKET_ASSETS);
  const [isSearchingMarket, setIsSearchingMarket] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'search' | 'key' | 'name' | null>(null);
  const [selectedPresetFilter, setSelectedPresetFilter] = useState<'all' | 'crypto' | 'pse' | 'reit' | 'us'>('all');
  const [selectedMarketAsset, setSelectedMarketAsset] = useState<MarketSearchSuggestion | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveSuggestionField(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search executor that queries /api/market/search and merges with curated catalog
  const executeMarketSearch = async (queryText: string, category: 'all' | 'crypto' | 'pse' | 'reit' | 'us' = selectedPresetFilter) => {
    const q = queryText.trim().toLowerCase();

    // 1. Filter local master list first for instantaneous feedback
    let localFiltered = MASTER_MARKET_ASSETS.filter((item) => {
      // Category filter check
      if (category === 'crypto' && item.source !== 'binance') return false;
      if (category === 'pse' && item.source !== 'marketwatch' && item.source !== 'pse') return false;
      if (category === 'reit' && item.source !== 'uitf' && !item.key.includes('rcr') && !item.key.includes('reit') && !item.categoryLabel?.toLowerCase().includes('reit')) return false;
      if (category === 'us' && item.source !== 'yahoo') return false;

      if (!q) return true;
      return (
        item.key.toLowerCase().includes(q) ||
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.platform.toLowerCase().includes(q) ||
        (item.exchange && item.exchange.toLowerCase().includes(q))
      );
    });

    // If query matches a known PSE stock from MarketWatch directory, inject it dynamically if missing
    if (q) {
      const mwDetails = getMarketWatchDetails(q, q, 'PSE');
      if (mwDetails) {
        const existing = localFiltered.find(x => x.key === mwDetails.ticker.toLowerCase());
        if (!existing) {
          const mwSug: MarketSearchSuggestion = {
            key: mwDetails.ticker.toLowerCase(),
            symbol: mwDetails.ticker,
            name: `${mwDetails.companyName} (${mwDetails.ticker})`,
            platform: 'DragonFi / PSE (MarketWatch)',
            class: 'risk',
            assetType: 'equity',
            exchange: 'Philippine Stock Exchange (MarketWatch)',
            source: 'marketwatch',
            categoryLabel: mwDetails.companyName.toLowerCase().includes('reit') ? 'Philippine REITs (MarketWatch)' : 'Philippine Stocks (MarketWatch)',
            marketwatchPath: mwDetails.marketWatchPath,
            marketwatchUrl: mwDetails.marketWatchUrl,
          };
          localFiltered = [mwSug, ...localFiltered];
        }
      }
    }

    setMarketSuggestions(localFiltered);

    // If query is very short, rely on the curated catalog
    if (!q || q.length < 2) {
      setIsSearchingMarket(false);
      return;
    }

    // 2. Fetch live suggestions from server (/api/market/search)
    setIsSearchingMarket(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results) && data.results.length > 0) {
          const seen = new Set<string>();
          const merged: MarketSearchSuggestion[] = [];
          
          for (const item of [...data.results, ...localFiltered]) {
            const id = (item.symbol || item.key || item.name).toLowerCase();
            if (!seen.has(id)) {
              seen.add(id);
              merged.push(item);
            }
          }
          setMarketSuggestions(merged.slice(0, 30));
        }
      }
    } catch (err) {
      // 3. Fallback client-side Binance check for crypto symbols
      if (q.length >= 2 && q.length <= 8) {
        try {
          const binancePair = `${q.toUpperCase()}USDT`;
          const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binancePair}`).catch(() => null);
          if (binanceRes && binanceRes.ok) {
            const bData = await binanceRes.json();
            if (bData?.lastPrice) {
              const lastP = parseFloat(bData.lastPrice);
              const liveFx = usdPhpRate || 60.5;
              const phpP = Number((lastP * liveFx).toFixed(2));
              const newCrypto: MarketSearchSuggestion = {
                key: q.toLowerCase(),
                symbol: `${q.toUpperCase()}-USD`,
                name: `${q.toUpperCase()} (${q.toUpperCase()})`,
                platform: 'GCrypto / Binance',
                class: 'risk',
                assetType: 'crypto',
                exchange: 'Binance Live Spot',
                currentPriceUSD: lastP,
                currentPricePHP: phpP,
                change24h: parseFloat(bData.priceChangePercent || '0'),
                source: 'binance',
                categoryLabel: 'Crypto & Digital',
              };
              setMarketSuggestions((prev) => [newCrypto, ...prev]);
            }
          }
        } catch (e) {}
      }
    } finally {
      setIsSearchingMarket(false);
    }
  };

  const handleQueryInputChange = (val: string, field: 'search' | 'key' | 'name') => {
    setActiveSuggestionField(field);
    if (field === 'search') {
      setMarketSearchQuery(val);
    } else if (field === 'key') {
      setNewAssetKey(val);
    } else if (field === 'name') {
      setNewAssetName(val);
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      executeMarketSearch(val);
    }, 200);
  };

  const handleSelectMarketSuggestion = (suggestion: MarketSearchSuggestion) => {
    setNewAssetKey(suggestion.key.toLowerCase().replace(/\s+/g, '_'));
    setNewAssetName(suggestion.name);
    setNewAssetPlatform(suggestion.platform);
    setNewAssetClass(suggestion.class);
    setNewAssetType(suggestion.assetType);
    setSelectedMarketAsset(suggestion);
    
    if (suggestion.currentPricePHP && suggestion.currentPricePHP > 0) {
      const priceVal = suggestion.currentPricePHP;
      setNewAssetPrice(priceVal.toString());
      
      const parsedUnits = parseFormattedNumber(newAssetUnits);
      if (parsedUnits > 0) {
        setNewAssetCost((parsedUnits * priceVal).toFixed(2));
      }
    }
    
    setActiveSuggestionField(null);
  };

  const openAddAssetModal = (preferredClass?: 'safe' | 'risk' | 'physical' | 'liability') => {
    const targetClass = preferredClass || activeSubTab;
    setNewAssetClass(targetClass);
    if (targetClass === 'risk') {
      setNewAssetType('crypto');
      setSelectedPresetFilter('all');
      setNewAssetPlatform('GCrypto / Binance');
    } else if (targetClass === 'safe') {
      setNewAssetType('deposit');
      setNewAssetPlatform('Maya / Bank');
    } else if (targetClass === 'physical') {
      setNewAssetType('property');
      setNewAssetPlatform('Personal / Deed of Sale');
    } else if (targetClass === 'liability') {
      setNewAssetType('liability');
      setNewAssetPlatform('Bank / Lending Corp');
    }
    setNewAssetKey('');
    setNewAssetName('');
    setNewAssetUnits('1');
    setNewAssetCost('0');
    setNewAssetPrice('1');
    setSelectedMarketAsset(null);
    setMarketSearchQuery('');
    executeMarketSearch('', 'all');
    setShowAssetForm(true);
  };

  const safeAssets = assets.filter((a) => a.class === 'safe');
  const riskAssets = assets.filter((a) => a.class === 'risk');
  const physicalAssets = assets.filter((a) => a.class === 'physical');
  const liabilityAssets = assets.filter((a) => a.class === 'liability');

  const totalSafeValue = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalRiskValue = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalPhysicalValue = physicalAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalLiabilityValue = liabilityAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  const handleAISyncClick = async () => {
    setSyncLoading(true);
    try {
      await onExecuteSyncAI(customKey);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleEditAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    const isEditingFixedOrLiability = editClass === 'safe' || editClass === 'liability' || editAssetType === 'cash' || editAssetType === 'deposit' || editAssetType === 'hys' || editAssetType === 'liability';
    const parsedCost = parseFormattedNumber(editCost);
    const parsedUnits = isEditingFixedOrLiability ? 1 : (parseFormattedNumber(editUnits) || 1);
    let parsedPrice = editClass === 'risk' ? parseFormattedNumber(editPrice) : 1;
    if (editClass === 'risk') {
      if (parsedPrice <= 0 || (parsedPrice === 1 && parsedCost > 10)) {
        parsedPrice = parsedUnits > 0 ? parsedCost / parsedUnits : parsedCost;
      }
    } else {
      parsedPrice = 1;
    }

    onUpdateAssetHoldings(editingAsset.key, parsedUnits, parsedCost, {
      startDate: editStartDate || undefined,
      maturityDate: editMaturityDate || undefined,
      yieldPercent: editYieldPercent !== '' && !isNaN(parseFormattedNumber(editYieldPercent)) ? parseFormattedNumber(editYieldPercent) : undefined,
      yieldFrequency: editYieldFrequency,
      withholdingTaxPercent: (editClass === 'liability' || editAssetType === 'liability' || editClass === 'physical') ? 0 : (editWithholdingTax !== '' && !isNaN(parseFormattedNumber(editWithholdingTax)) ? parseFormattedNumber(editWithholdingTax) : undefined),
      assetClass: editClass,
      assetType: editAssetType,
    });
    onUpdateAssetPrice(editingAsset.key, parsedPrice);
    setEditingAsset(null);
  };

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetKey || !newAssetName || !newAssetPlatform) return;

    const isNewAssetFixedOrLiability = newAssetClass === 'safe' || newAssetClass === 'liability' || newAssetType === 'cash' || newAssetType === 'deposit' || newAssetType === 'hys' || newAssetType === 'liability';
    const parsedCost = parseFormattedNumber(newAssetCost);
    const parsedUnits = isNewAssetFixedOrLiability ? 1 : (parseFormattedNumber(newAssetUnits) || 1);
    let parsedPrice = newAssetClass === 'risk' ? parseFormattedNumber(newAssetPrice) : 1;
    if (newAssetClass === 'risk') {
      if (parsedPrice <= 0 || (parsedPrice === 1 && parsedCost > 10)) {
        parsedPrice = parsedUnits > 0 ? parsedCost / parsedUnits : parsedCost;
      }
    } else {
      parsedPrice = 1;
    }

    onAddAsset({
      key: newAssetKey.toLowerCase().trim().replace(/\s+/g, '_'),
      name: newAssetName,
      platform: newAssetPlatform,
      class: newAssetClass,
      assetType: newAssetType,
      units: parsedUnits,
      costBasisPHP: parsedCost,
      currentPricePHP: parsedPrice,
      change24h: 0,
      startDate: newAssetStartDate || undefined,
      maturityDate: newAssetMaturityDate || undefined,
      yieldPercent: newAssetYieldPercent !== '' && !isNaN(parseFormattedNumber(newAssetYieldPercent)) ? parseFormattedNumber(newAssetYieldPercent) : undefined,
      yieldFrequency: newAssetYieldFrequency,
      withholdingTaxPercent: (newAssetClass === 'liability' || newAssetType === 'liability' || newAssetClass === 'physical') ? 0 : (newAssetWithholdingTax !== '' && !isNaN(parseFormattedNumber(newAssetWithholdingTax)) ? parseFormattedNumber(newAssetWithholdingTax) : undefined),
    });

    setShowAssetForm(false);
    setNewAssetKey('');
    setNewAssetName('');
    setNewAssetPlatform('');
    setNewAssetClass('safe');
    setNewAssetType('cash');
    setNewAssetUnits('1');
    setNewAssetCost('0');
    setNewAssetPrice('1');
    setNewAssetStartDate('');
    setNewAssetMaturityDate('');
    setNewAssetYieldPercent('');
    setNewAssetYieldFrequency('annual');
    setNewAssetWithholdingTax('20');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tables layout section with toggle sub-tab */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10">
          <div className="flex flex-wrap border-b sm:border-b-0 border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveSubTab('safe')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeSubTab === 'safe'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-500/5 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🛡️ Safe Shield Protection Assets
            </button>
            <button
              onClick={() => setActiveSubTab('risk')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeSubTab === 'risk'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-500/5 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🚀 Risk Sleeve Growth
            </button>
            <button
              onClick={() => setActiveSubTab('physical')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeSubTab === 'physical'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/20 dark:bg-purple-500/5 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏠 Physical Assets
            </button>
            <button
              onClick={() => setActiveSubTab('liability')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeSubTab === 'liability'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-500/5 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              💸 Liabilities & Loans
            </button>
          </div>
          <div className="p-3 sm:p-0 sm:pr-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const defaultFrom = assets[0]?.key || '';
                const defaultTo = assets.find((a) => a.key !== defaultFrom)?.key || assets[0]?.key || '';
                setTransferFromKey(defaultFrom);
                setTransferToKey(defaultTo);
                setShowTransferModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Transfer capital across safe deposits, crypto, stocks, or time deposits"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Across Assets 🔁</span>
            </button>
            <button
              onClick={() => setShowAssetForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Asset & Risk</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'safe' && (
          <div className="bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-blue-900/10 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900/40 border-b border-teal-200 dark:border-teal-500/20 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl border border-teal-300 dark:border-teal-500/30 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <span>AVAILABLE CASH & {getNextPaydayInfo().paydayTypeLabel.toUpperCase()} RESERVE</span>
                  <span className="px-2 py-0.5 bg-teal-600 text-white rounded text-[9px] font-mono font-black">
                    {getNextPaydayInfo().badgeText}
                  </span>
                </h4>

                {/* Dynamic Cash Reserve Amount Display in Banner */}
                {(() => {
                  const hysAsset = assets.find((a) => a.key === 'hys' || a.assetType === 'hys' || a.name.toLowerCase().includes('high-yield'));
                  const availableCashAsset = assets.find((a) => a.key === 'available_cash');
                  const hysVal = hysAsset ? getAssetValuation(hysAsset).totalValue : 0;
                  const availableVal = availableCashAsset ? getAssetValuation(availableCashAsset).totalValue : 0;
                  const cashVal = hysAsset ? hysVal : availableVal;
                  const pendingItems = scheduledPaydays.filter((p) => p.status === 'pending');

                  return (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/15 dark:bg-teal-400/10 border border-teal-300/80 dark:border-teal-500/30 rounded-lg text-teal-950 dark:text-teal-100 font-mono font-bold text-xs">
                        <Wallet className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="text-teal-900 dark:text-teal-200">Current Cash Reserve Balance (High-Yield Savings 5%):</span>
                        <span className="text-teal-700 dark:text-teal-300 font-black text-sm">
                          ₱{cashVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {pendingItems.map((item) => {
                        const isMismatch = isProOrAdmin && expectedMonthlyAssetAlloc > 0 && Math.abs(item.amountPHP - expectedPaydayAssetAlloc) > 0.01 && (item.isRecurring || item.paydayType === 'semimonthly' || item.frequency === 'semimonthly');
                        return (
                          <div key={item.id} className="flex flex-col gap-1 w-full sm:w-auto">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                              isMismatch 
                                ? 'bg-rose-500/15 dark:bg-rose-900/30 border border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                                : 'bg-amber-500/15 dark:bg-amber-400/10 border border-amber-300/80 dark:border-amber-500/30 text-amber-950 dark:text-amber-100'
                            }`}>
                              <Calendar className={`w-3.5 h-3.5 shrink-0 ${isMismatch ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                              <span>
                                {item.isRecurring || item.paydayType === 'semimonthly' ? '🔁 Auto-Deposit (15th & 30th) • Next:' : 'Payday Deposit Scheduled:'} ({item.paydayDate}):
                              </span>
                              <span className={`font-black ${isMismatch ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                +₱{item.amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {isMismatch && (
                                <button
                                  type="button"
                                  onClick={() => syncScheduleWithMatrix(item.id)}
                                  className="ml-1 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                  title="Synchronize amount with Cash Flow Matrix"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Sync ₱{expectedPaydayAssetAlloc.toLocaleString()}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const newList = scheduledPaydays.filter(p => p.id !== item.id);
                                  setScheduledPaydays(newList);
                                  localStorage.setItem('wealthvault_scheduled_paydays', JSON.stringify(newList));
                                }}
                                className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                                title="Cancel scheduled payday auto-deposit"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {isMismatch && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Error: Amount does not coincide with Income Allocation Matrix (₱{expectedPaydayAssetAlloc.toLocaleString()} per 15th/30th payday • ₱{expectedMonthlyAssetAlloc.toLocaleString()} monthly).</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Prompt to schedule auto-deposit if matrix has allocation but none scheduled */}
                      {isProOrAdmin && expectedMonthlyAssetAlloc > 0 && !pendingItems.some(p => p.isRecurring || p.paydayType === 'semimonthly' || p.frequency === 'semimonthly') && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/15 dark:bg-indigo-400/10 border border-indigo-300 dark:border-indigo-500/30 rounded-lg text-indigo-950 dark:text-indigo-200 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>Matrix Auto-Allocation: <b>₱{expectedPaydayAssetAlloc.toLocaleString()}</b> / 15th & 30th</span>
                          <button
                            type="button"
                            onClick={() => syncScheduleWithMatrix()}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                          >
                            + Schedule Auto-Deposit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <div className="hidden sm:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-white/10 text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upcoming Income</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono font-extrabold text-xs">
                  {getNextPaydayInfo().paydayTitle} ({getNextPaydayInfo().daysText})
                </span>
              </div>
              <button
                onClick={() => {
                  const cashAsset = assets.find((a) => a.key === 'available_cash') || assets.find((a) => a.assetType === 'cash' || a.assetType === 'hys');
                  setPaydayTargetKey(cashAsset ? cashAsset.key : 'available_cash');
                  const pdInfo = getNextPaydayInfo();
                  setPaydayDate(pdInfo.targetPaydayDateStr);
                  setPaydayType('semimonthly');
                  setPaydayAmount(expectedPaydayAssetAlloc > 0 ? expectedPaydayAssetAlloc.toString() : '10000');
                  setPaydayNotes('Semi-Monthly Salary Deposit (Every 15th & End of Month)');
                  setShowPaydayModal(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ DEPOSIT CASH / PAYDAY 💵</span>
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'physical' && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  Cash-Flow Asset vs. Liability Audit
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  Does this physical item put money <i>into</i> your pocket (positive cash flow or yields) or take money <i>out</i> (mortgage payments, taxes, maintenance)? Under cash-flow accounting, items causing net financial drain are <b>Liabilities</b>. You can transfer any item directly to Liabilities below with complete data retention.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'risk' && (
          <div className="bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 p-4 sm:p-5 rounded-2xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <span>TradingView® Live Technical Charts & Market Analysis</span>
                  <span className="px-2 py-0.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded text-[9px] font-mono font-black shadow-2xs">
                    LIVE WIDGET
                  </span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Click any risk asset below or the <b className="text-slate-900 dark:text-white bg-slate-200/70 dark:bg-indigo-950/60 border border-slate-300 dark:border-indigo-500/30 px-1.5 py-0.5 rounded">TradingView 📊</b> badge to launch the full TradingView® interactive chart, technical indicators (RSI, MACD, SMAs), asset financials, and market news timeline.
                </p>
              </div>
            </div>
            {/* Matrix allocation indicator for Risk Sleeve Growth */}
            {isProOrAdmin && expectedMonthlyAssetAlloc > 0 && (
              <div className="shrink-0 flex items-center gap-2">
                <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-[11px] font-mono font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Matrix Allocation: ₱{expectedPaydayAssetAlloc.toLocaleString()} / Payday</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          id={activeSubTab === 'safe' ? 'safe-assets-section' : activeSubTab === 'risk' ? 'risk-assets-section' : activeSubTab === 'physical' ? 'physical-assets-section' : 'liability-assets-section'}
          data-highlight-id={activeSubTab === 'safe' ? 'safe-assets-section' : activeSubTab === 'risk' ? 'risk-assets-section' : activeSubTab === 'physical' ? 'physical-assets-section' : 'liability-assets-section'}
          className="overflow-x-auto"
        >
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                <th className="p-5 pl-8">{activeSubTab === 'liability' ? 'Liability / Loan' : 'Asset Identifier'}</th>
                <th className="p-5">{activeSubTab === 'liability' ? 'Lender / Institution' : 'Custodian / Platform'}</th>
                <th className="p-5 text-right">
                  {activeSubTab === 'risk'
                    ? 'Current Price Quotation (PHP)'
                    : activeSubTab === 'physical'
                    ? 'Appreciation / Depreciation Rate (%)'
                    : activeSubTab === 'liability'
                    ? 'Interest Rate / APR (%)'
                    : 'Annual Rate / Yield (%)'}
                </th>
                <th className="p-5 text-center">
                  {activeSubTab === 'risk'
                    ? '24h Trend / Change'
                    : activeSubTab === 'liability'
                    ? 'Loan Term / Payoff Date'
                    : 'Term / Dates'}
                </th>
                {activeSubTab !== 'safe' && activeSubTab !== 'liability' && <th className="p-5 text-right">Units Held</th>}
                <th className="p-5 text-right">{activeSubTab === 'liability' ? 'Principal Debt Balance' : 'Principal Cost Basis'}</th>
                <th className="p-5 text-right">{activeSubTab === 'liability' ? 'Total Outstanding Debt (PHP)' : 'Total Valuation (PHP)'}</th>
                <th className="p-5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {(activeSubTab === 'safe' ? safeAssets : activeSubTab === 'risk' ? riskAssets : activeSubTab === 'physical' ? physicalAssets : liabilityAssets).map((asset) => {
                const valuation = getAssetValuation(asset);
                const totalValue = valuation.totalValue;
                const profitLoss = valuation.isYieldBased ? valuation.interestEarned : (totalValue - valuation.principal);
                const isProfitable = profitLoss >= 0;

                return (
                  <tr key={asset.key} id={asset.key} data-highlight-id={asset.key} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="p-5 pl-8">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeSubTab === 'risk' ? (
                            <button
                              onClick={() => setSelectedTradingViewAsset(asset)}
                              className="font-bold text-slate-900 dark:text-slate-200 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer flex items-center gap-1.5 group"
                              title="Click to view TradingView® Interactive Chart & Technical Indicators"
                            >
                              <span>{asset.name}</span>
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-extrabold flex items-center gap-1 transition-all shrink-0">
                                <span>TradingView 📊</span>
                              </span>
                            </button>
                          ) : (
                            <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                              {asset.name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 capitalize">
                          {(asset.key === 'paxg' || asset.name.toLowerCase().includes('pax gold') || asset.name.toLowerCase().includes('gold') || asset.assetType === 'commodity') ? 'crypto' : asset.assetType} index
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-slate-500 dark:text-slate-400 text-xs">{asset.platform}</td>
                    <td className="p-5 text-right text-xs font-mono font-bold">
                      {activeSubTab === 'risk' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            ₱{((asset.currentPricePHP > 0 && !(asset.currentPricePHP === 1 && asset.costBasisPHP > 10)) ? asset.currentPricePHP : (asset.costBasisPHP / (asset.units || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                            Live Market
                          </span>
                        </div>
                      ) : activeSubTab === 'liability' ? (
                        <div className="flex flex-col items-end gap-1">
                          {asset.yieldPercent !== undefined && asset.yieldPercent !== null && asset.yieldPercent > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-md font-extrabold inline-flex items-center gap-1 text-xs">
                              <Percent className="w-2.5 h-2.5" />
                              {asset.yieldPercent}% {
                                asset.yieldFrequency === 'monthly' ? 'p.m.' :
                                asset.yieldFrequency === 'semi-annual' ? '/ 6 mos' :
                                asset.yieldFrequency === 'quarterly' ? '/ quarter' :
                                'APR'
                              }
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">0.00% APR (Interest-Free)</span>
                          )}
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">
                            Loan Interest Rate
                          </span>
                        </div>
                      ) : asset.yieldPercent !== undefined && asset.yieldPercent !== null && asset.yieldPercent !== 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 border rounded-md font-extrabold inline-flex items-center gap-1 ${
                            asset.yieldPercent > 0
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          }`}>
                            <Percent className="w-2.5 h-2.5" />
                            {asset.yieldPercent > 0 ? `+${asset.yieldPercent}%` : `${asset.yieldPercent}%`} {
                              asset.yieldFrequency === 'monthly' ? 'p.m.' :
                              asset.yieldFrequency === 'semi-annual' ? '/ 6 mos' :
                              asset.yieldFrequency === 'quarterly' ? '/ quarter' :
                              'p.a.'
                            }
                          </span>
                          <span className={`text-[9px] font-bold ${
                            asset.yieldPercent > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {activeSubTab === 'physical'
                              ? (asset.yieldPercent > 0 ? 'Appreciation Rate' : 'Depreciation Rate')
                              : 'Yield Rate'}
                          </span>
                          {asset.withholdingTaxPercent !== undefined && asset.withholdingTaxPercent > 0 && activeSubTab !== 'physical' && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                              Less {asset.withholdingTaxPercent}% WHT
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          {activeSubTab === 'physical' ? 'Fixed Valuation' : '0.00% p.a.'}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center text-xs">
                      {activeSubTab === 'risk' ? (
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                            (asset.change24h || 0) >= 0 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                          }`}>
                            {(asset.change24h || 0) >= 0 ? '+' : ''}{(asset.change24h || 0).toFixed(2)}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans">Market Performance</span>
                        </div>
                      ) : activeSubTab === 'liability' ? (
                        asset.startDate || asset.maturityDate ? (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            {asset.startDate && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                <span>Start: <b>{asset.startDate}</b></span>
                              </span>
                            )}
                            {asset.maturityDate && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                                <Calendar className="w-2.5 h-2.5 text-rose-500" />
                                <span>Payoff: {asset.maturityDate}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Revolving / Open</span>
                        )
                      ) : asset.startDate || asset.maturityDate ? (
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          {asset.startDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                              <Calendar className="w-2.5 h-2.5 text-slate-400" />
                              <span>Start: <b>{asset.startDate}</b></span>
                            </span>
                          )}
                          {asset.maturityDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                              <Calendar className="w-2.5 h-2.5 text-blue-500" />
                              <span>Matures: {asset.maturityDate}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    {activeSubTab !== 'safe' && activeSubTab !== 'liability' && (
                      <td className="p-5 text-right text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {asset.units.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                    )}
                    <td className="p-5 text-right text-xs font-mono text-slate-500">
                      ₱{asset.costBasisPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          ₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="flex flex-col items-end mt-0.5">
                          {activeSubTab === 'physical' ? (
                            valuation.isYieldBased && valuation.interestEarned !== 0 ? (
                              <span className={`text-[10px] font-bold ${valuation.interestEarned > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {valuation.interestEarned >= 0 ? '+₱' : '-₱'}{Math.abs(valuation.interestEarned).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {valuation.interestEarned >= 0 ? 'net appreciation' : 'net depreciation'} ({valuation.daysElapsed}d)
                              </span>
                            ) : null
                          ) : activeSubTab === 'liability' ? (
                            valuation.interestEarned > 0 ? (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                +₱{valuation.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} accrued interest ({valuation.daysElapsed}d)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Principal Only</span>
                            )
                          ) : valuation.isYieldBased ? (
                            <>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                +₱{valuation.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} net yield ({valuation.daysElapsed}d)
                              </span>
                              {valuation.taxWithheld > 0 && (
                                <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-mono">
                                  (Less ₱{valuation.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WHT)
                                </span>
                              )}
                              {asset.maturityDate && valuation.expectedMaturityValue > valuation.totalValue && (
                                <span className="text-[9px] text-slate-400 mt-0.5">
                                  Est. Maturity: ₱{valuation.expectedMaturityValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[10px] font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {isProfitable ? '+₱' : '-₱'}{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {asset.change24h !== undefined && asset.change24h !== 0 && (
                                <span className={`inline-flex items-center text-[9px] font-extrabold ${asset.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  ({asset.change24h >= 0 ? '+' : ''}{asset.change24h}%)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        {asset.class === 'physical' && (
                          <button
                            onClick={() => handleQuickTransferClass(asset, 'liability')}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-rose-200 dark:border-rose-800/40 transition-all flex items-center gap-1 shrink-0"
                            title="Transfer item to Liabilities & Loans (Zero Data Loss)"
                          >
                            <span>To Liabilities 💸</span>
                          </button>
                        )}
                        {asset.class === 'liability' && (
                          <button
                            onClick={() => handleQuickTransferClass(asset, 'physical')}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-purple-200 dark:border-purple-800/40 transition-all flex items-center gap-1 shrink-0"
                            title="Transfer item to Physical Assets"
                          >
                            <span>To Physical 🏠</span>
                          </button>
                        )}

                        {/* Chart button removed as requested */}

                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setEditUnits(asset.units.toString());
                            setEditCost(asset.costBasisPHP.toString());
                            const isSafe = asset.class === 'safe' || asset.assetType === 'cash' || asset.assetType === 'deposit' || asset.assetType === 'hys';
                            const effectivePrice = isSafe ? 1 : ((asset.currentPricePHP > 0 && !(asset.currentPricePHP === 1 && asset.costBasisPHP > 10))
                              ? asset.currentPricePHP
                              : (asset.costBasisPHP / (asset.units || 1)));
                            setEditPrice(effectivePrice.toString());
                            setEditClass(asset.class);
                            setEditAssetType(asset.assetType);
                            setEditStartDate(asset.startDate || '');
                            setEditMaturityDate(asset.maturityDate || '');
                            setEditYieldPercent(asset.yieldPercent !== undefined && asset.yieldPercent !== null ? asset.yieldPercent.toString() : '');
                            setEditYieldFrequency(asset.yieldFrequency || 'annual');
                            setEditWithholdingTax(asset.withholdingTaxPercent !== undefined && asset.withholdingTaxPercent !== null ? asset.withholdingTaxPercent.toString() : '');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider rounded-lg border border-slate-200 dark:border-white/5 transition-all"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {((activeSubTab === 'safe' ? safeAssets : activeSubTab === 'risk' ? riskAssets : activeSubTab === 'physical' ? physicalAssets : liabilityAssets)).length === 0 && (
                <tr>
                  <td colSpan={activeSubTab === 'safe' || activeSubTab === 'liability' ? 7 : 8} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                      <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        No {activeSubTab === 'risk' ? 'Risk Sleeve Growth Assets' : activeSubTab === 'safe' ? 'Safe Shield Assets' : activeSubTab === 'physical' ? 'Physical Assets' : 'Liabilities'} Tracked Yet
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {activeSubTab === 'risk' 
                          ? 'Add your crypto, PSE stock, REIT, or US ETF positions with live auto-suggestions from Yahoo Finance & Binance.' 
                          : 'Register positions to monitor live valuations, yields, and growth metrics.'}
                      </p>
                      {activeSubTab !== 'risk' && (
                        <button
                          type="button"
                          onClick={() => openAddAssetModal(activeSubTab)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add Position</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900/90 border-t-2 border-slate-200 dark:border-white/10 font-bold">
              <tr>
                <td colSpan={activeSubTab === 'safe' || activeSubTab === 'liability' ? 4 : 5} className="p-5 pl-8 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {activeSubTab === 'risk' ? '🚀 Total Risk Sleeve Growth' :
                   activeSubTab === 'safe' ? '🛡️ Total Safe Shield Protection' :
                   activeSubTab === 'physical' ? '🏠 Total Physical Assets' : '💸 Total Outstanding Debt & Liabilities'}
                </td>
                <td className="p-5 text-right text-xs font-mono font-black text-slate-600 dark:text-slate-400">
                  ₱{(activeSubTab === 'safe' ? safeAssets : activeSubTab === 'risk' ? riskAssets : activeSubTab === 'physical' ? physicalAssets : liabilityAssets).reduce((sum, a) => sum + getAssetValuation(a).principal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-5 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-black font-mono ${activeSubTab === 'liability' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      ₱{(activeSubTab === 'safe' ? totalSafeValue : activeSubTab === 'risk' ? totalRiskValue : activeSubTab === 'physical' ? totalPhysicalValue : totalLiabilityValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {(() => {
                      const list = activeSubTab === 'safe' ? safeAssets : activeSubTab === 'risk' ? riskAssets : activeSubTab === 'physical' ? physicalAssets : liabilityAssets;
                      const totalCost = list.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
                      const totalVal = list.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
                      const gains = totalVal - totalCost;
                      const gainsPct = totalCost > 0 ? (gains / totalCost) * 100 : 0;

                      if (activeSubTab === 'physical') {
                        if (gains !== 0) {
                          return (
                            <span className={`text-[11px] font-black font-mono mt-0.5 ${gains > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {gains > 0 ? '+' : ''}₱{gains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Net {gains > 0 ? 'Appreciation' : 'Depreciation'} ({gainsPct > 0 ? '+' : ''}{gainsPct.toFixed(2)}%)
                            </span>
                          );
                        }
                        return null;
                      }

                      if (activeSubTab === 'liability') {
                        if (gains > 0) {
                          return (
                            <span className="text-[11px] font-black font-mono mt-0.5 text-rose-600 dark:text-rose-400">
                              +₱{gains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Accrued Interest
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <span className={`text-[11px] font-black font-mono mt-0.5 ${gains >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {gains >= 0 ? '+' : ''}₱{gains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Gains/Loss ({gainsPct >= 0 ? '+' : ''}{gainsPct.toFixed(2)}%)
                        </span>
                      );
                    })()}
                  </div>
                </td>
                <td className="p-5 pr-8"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {activeSubTab === 'risk' && (
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border-t border-indigo-200/80 dark:border-indigo-800/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-lg shrink-0">
                🚀
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Risk Sleeve Growth — Total Gains & Performance
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aggregate unrealized net gain/loss performance across SPC Power, SCC Energy, RCR REIT, Manulife Asia Pacific REIT Fund of Funds, BTC & PAXG Gold
                </p>
              </div>
            </div>
            {(() => {
              const totalCost = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
              const totalVal = totalRiskValue;
              const gains = totalVal - totalCost;
              const gainsPct = totalCost > 0 ? (gains / totalCost) * 100 : 0;
              return (
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800/40 shadow-xs shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Risk Valuation</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      ₱{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gains / Loss</span>
                    <span className={`text-sm font-black font-mono ${gains >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {gains >= 0 ? '+' : ''}₱{gains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({gainsPct >= 0 ? '+' : ''}{gainsPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Adjust holdings modal dialog */}
      {editingAsset && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-lg relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2.5 mb-4">
              <span>Calibrate Core Holdings: {editingAsset.name}</span>
            </h3>

            <form onSubmit={handleEditAssetSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Class Group</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  >
                    <option value="safe">🛡️ Safe Shield</option>
                    <option value="risk">🚀 Risk Sleeve</option>
                    <option value="physical">🏠 Physical</option>
                    <option value="liability">💸 Liability / Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Asset Category</label>
                  <select
                    value={editAssetType}
                    onChange={(e) => setEditAssetType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="deposit">Deposit</option>
                    <option value="crypto">Crypto</option>
                    <option value="commodity">Commodity</option>
                    <option value="equity">Equity</option>
                    <option value="property">Property</option>
                    <option value="liability">Liability</option>
                  </select>
                </div>
              </div>
              {!(editClass === 'safe' || editClass === 'liability' || editAssetType === 'cash' || editAssetType === 'deposit' || editAssetType === 'hys' || editAssetType === 'liability') && (
                <div>
                  <SmartCalculatorInput
                    label="Units / Shares volume"
                    value={editUnits}
                    onChange={setEditUnits}
                    currencySymbol=""
                  />
                </div>
              )}

              <div>
                <SmartCalculatorInput
                  label={editClass === 'liability' ? "Principal Loan Balance (PHP)" : editClass === 'physical' ? "Principal Asset Cost Basis (PHP)" : "Total Acquisition Cost (PHP)"}
                  value={editCost}
                  onChange={setEditCost}
                />
              </div>

              {editClass === 'risk' && (
                <div>
                  <SmartCalculatorInput
                    label="Current Price Quotation (PHP)"
                    value={editPrice}
                    onChange={setEditPrice}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{editClass === 'liability' ? 'Loan Start Date' : 'Starting Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{editClass === 'liability' ? 'Payoff Target Date' : 'Maturity Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={editMaturityDate}
                    onChange={(e) => setEditMaturityDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-500" />
                    <span>{editClass === 'liability' ? 'Loan Interest Rate / APR (%)' : editClass === 'physical' ? 'Annual Rate (Appreciation / Depreciation %)' : 'Yield / Interest Rate'}</span>
                  </span>
                  {editClass === 'physical' ? (
                    <span className="text-[9px] text-slate-400 font-normal">e.g. +5.0 (Appreciates) or -10.0 (Depreciates)</span>
                  ) : editClass === 'liability' ? (
                    <span className="text-[9px] text-rose-500 font-normal">e.g. 7.5 (% APR p.a.)</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="relative col-span-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 5.25"
                      value={editYieldPercent}
                      onChange={(e) => setEditYieldPercent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <select
                    value={editYieldFrequency}
                    onChange={(e) => setEditYieldFrequency(e.target.value as any)}
                    className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="annual">p.a. (Per Annum)</option>
                    <option value="monthly">per month</option>
                    <option value="semi-annual">per 6 mos</option>
                    <option value="quarterly">per quarter</option>
                  </select>
                </div>
              </div>

              {editClass !== 'liability' && editAssetType !== 'liability' && editClass !== 'physical' && (
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      <span>Withholding Tax (%)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">Standard PH: 20%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="20 (leave blank if 0%)"
                      value={editWithholdingTax}
                      onChange={(e) => setEditWithholdingTax(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                {onDeleteAsset && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${editingAsset.name}" from your active portfolio?`)) {
                        onDeleteAsset(editingAsset.key);
                        setEditingAsset(null);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Position</span>
                  </button>
                )}
                <div className="flex items-center space-x-3.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Commit Holdings Calibration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Asset Modal Dialog */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div ref={dropdownRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative overflow-y-auto max-h-[94vh]">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${newAssetClass === 'risk' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>{newAssetClass === 'risk' ? '🚀 Add Risk Sleeve Growth Asset' : 'Register New Asset / Position'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Live connected to <b>Yahoo Finance</b>, <b>Binance Live Spot</b> & <b>Philippine Stock Exchange (PSE)</b>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssetForm(false);
                  setActiveSuggestionField(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick-Pick Popular Growth Assets (MarketWatch, Binance & Global) */}
            <div className="mb-4 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-slate-900/60 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular 1-Click Growth Assets</span>
                </span>
                {isSearchingMarket && (
                  <span className="text-[10px] text-blue-500 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Searching feeds...</span>
                  </span>
                )}
              </div>

              {/* Quick Pick Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'btc', label: '⚡ BTC', name: 'Bitcoin (BTC)', desc: 'Binance' },
                  { key: 'paxg', label: '🪙 PAXG', name: 'PAX Gold', desc: 'Gold Spot' },
                  { key: 'eth', label: '💎 ETH', name: 'Ethereum', desc: 'Binance' },
                  { key: 'sol', label: '⚡ SOL', name: 'Solana', desc: 'Binance' },
                  { key: 'scc', label: '🏢 SCC', name: 'Semirara', desc: 'MarketWatch' },
                  { key: 'spc', label: '🏢 SPC', name: 'SPC Power', desc: 'MarketWatch' },
                  { key: 'rcr', label: '🏢 RCR', name: 'RL Commercial REIT', desc: 'MarketWatch' },
                  { key: 'manulife', label: '📊 Manulife FoF', name: 'Manulife REIT FoF', desc: 'UITF' },
                  { key: 'nvda', label: '📈 NVDA', name: 'NVIDIA Corp', desc: 'NASDAQ' },
                  { key: 'spy', label: '📈 SPY', name: 'S&P 500 ETF', desc: 'NYSE' },
                ].map((item) => {
                  const match = MASTER_MARKET_ASSETS.find((m) => m.key === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (match) handleSelectMarketSuggestion(match);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-medium bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span className="font-bold">{item.label}</span>
                      {match?.currentPricePHP && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                          ₱{match.currentPricePHP >= 1000 ? `${(match.currentPricePHP / 1000).toFixed(1)}k` : match.currentPricePHP.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-indigo-100/60 dark:border-indigo-500/10">
                {[
                  { id: 'all', label: 'All Catalog' },
                  { id: 'crypto', label: '⚡ Binance Crypto' },
                  { id: 'pse', label: '🏢 MarketWatch PSE' },
                  { id: 'reit', label: '📊 REITs & Trust' },
                  { id: 'us', label: '📈 US Stocks & ETFs' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      const newFilter = tab.id as any;
                      setSelectedPresetFilter(newFilter);
                      executeMarketSearch(marketSearchQuery, newFilter);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                      selectedPresetFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Connection Confirmation Card */}
            {selectedMarketAsset && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                      ✓ Connected: {selectedMarketAsset.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      {selectedMarketAsset.symbol || selectedMarketAsset.key}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-emerald-200 dark:border-emerald-500/20">
                      {selectedMarketAsset.source === 'binance' 
                        ? '⚡ Binance Spot' 
                        : (selectedMarketAsset.source === 'marketwatch' || selectedMarketAsset.source === 'pse') 
                        ? '🏢 MarketWatch (PSE)' 
                        : selectedMarketAsset.source === 'uitf' 
                        ? '📊 Manulife' 
                        : '📈 Yahoo Finance'}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-2">
                    {selectedMarketAsset.currentPricePHP && (
                      <span className="font-mono font-bold">
                        Live Price: ₱{selectedMarketAsset.currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {selectedMarketAsset.currentPriceUSD && (
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        (${selectedMarketAsset.currentPriceUSD.toLocaleString()})
                      </span>
                    )}
                    <span>• {selectedMarketAsset.platform}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMarketAsset(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  title="Clear selection"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleAddAssetSubmit} className="space-y-4">
              {/* Asset Key ID Field with Attached Dropdown */}
              <div className="relative">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Asset Key ID (e.g. btc, scc, manulife, rcr, nvda)</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">⚡ Live Dropdown Suggestions Active</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type symbol or key: e.g. btc, sol, scc, nvda, manulife, rcr..."
                    value={newAssetKey}
                    onChange={(e) => handleQueryInputChange(e.target.value, 'key')}
                    onFocus={() => {
                      setActiveSuggestionField('key');
                      executeMarketSearch(newAssetKey);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                  {activeSuggestionField === 'key' && (
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField(null)}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Menu for Asset Key */}
                {activeSuggestionField === 'key' && marketSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between sticky top-0 backdrop-blur-xs">
                      <span>Live MarketWatch / Binance Suggestions ({marketSuggestions.length})</span>
                      <span className="text-[9px] text-indigo-500">Click any asset to auto-fill</span>
                    </div>
                    {marketSuggestions.map((sug, idx) => (
                      <button
                        key={`key-sug-${sug.key}-${idx}`}
                        type="button"
                        onClick={() => handleSelectMarketSuggestion(sug)}
                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-xs flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 uppercase group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                              {sug.key}
                            </span>
                            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-semibold truncate">
                              {sug.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span className="truncate">{sug.platform}</span>
                            <span>•</span>
                            <span className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                              sug.source === 'binance' 
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' 
                                : (sug.source === 'marketwatch' || sug.source === 'pse')
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                                : sug.source === 'uitf'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                            }`}>
                              {sug.source === 'binance' ? '⚡ Binance' : (sug.source === 'marketwatch' || sug.source === 'pse') ? '🏢 MarketWatch PSE' : sug.source === 'uitf' ? '📊 Trust' : '📈 Yahoo'}
                            </span>
                          </div>
                        </div>
                        {sug.currentPricePHP && sug.currentPricePHP > 0 && (
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-emerald-400">
                              ₱{sug.currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {sug.currentPriceUSD && (
                              <div className="text-[9px] font-mono text-slate-400">
                                ${sug.currentPriceUSD.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Name Field with Attached Dropdown */}
              <div className="relative">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Display Name</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">⚡ Auto-completes Name & Live Price</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type name: e.g. Bitcoin (BTC), Semirara Mining, NVIDIA, Manulife..."
                    value={newAssetName}
                    onChange={(e) => handleQueryInputChange(e.target.value, 'name')}
                    onFocus={() => {
                      setActiveSuggestionField('name');
                      executeMarketSearch(newAssetName);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium"
                  />
                  {activeSuggestionField === 'name' && (
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField(null)}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Menu for Display Name */}
                {activeSuggestionField === 'name' && marketSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between sticky top-0 backdrop-blur-xs">
                      <span>Matching Asset Names ({marketSuggestions.length})</span>
                      <span className="text-[9px] text-indigo-500">Click to select asset</span>
                    </div>
                    {marketSuggestions.map((sug, idx) => (
                      <button
                        key={`name-sug-${sug.key}-${idx}`}
                        type="button"
                        onClick={() => handleSelectMarketSuggestion(sug)}
                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-xs flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {sug.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="font-mono">{sug.platform}</span>
                            <span>•</span>
                            <span className={`px-1 rounded text-[9px] font-semibold ${
                              sug.source === 'binance' 
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' 
                                : (sug.source === 'marketwatch' || sug.source === 'pse') 
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                                : sug.source === 'uitf'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                            }`}>
                              {sug.source === 'binance' ? '⚡ Binance Spot' : (sug.source === 'marketwatch' || sug.source === 'pse') ? '🏢 MarketWatch PSE' : sug.source === 'uitf' ? '📊 Manulife Trust' : '📈 Yahoo Finance'}
                            </span>
                          </div>
                        </div>
                        {sug.currentPricePHP && sug.currentPricePHP > 0 && (
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-emerald-400">
                              ₱{sug.currentPricePHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {sug.currentPriceUSD && (
                              <div className="text-[9px] font-mono text-slate-400">
                                ${sug.currentPriceUSD.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Custodian Platform / Broker</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DragonFi Brokerage, Binance, Manulife Trust, Interactive Brokers"
                  value={newAssetPlatform}
                  onChange={(e) => setNewAssetPlatform(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Asset Class Group</label>
                  <select
                    value={newAssetClass}
                    onChange={(e) => setNewAssetClass(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="safe">🛡️ Safe Shield</option>
                    <option value="risk">🚀 Risk Sleeve (Growth)</option>
                    <option value="physical">🏠 Risk Sleeve (Physical)</option>
                    <option value="liability">💸 Liability / Loan / Mortgage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Asset Type Category</label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="deposit">Deposit / Time Dep</option>
                    <option value="hys">High Yield Savings (HYS / Maya)</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="commodity">Commodity / Metals</option>
                    <option value="equity">Equity / PSE Stocks</option>
                    <option value="property">Property / Real Estate</option>
                    <option value="liability">Liability / Loan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!(newAssetClass === 'safe' || newAssetClass === 'liability' || newAssetType === 'cash' || newAssetType === 'deposit' || newAssetType === 'hys' || newAssetType === 'liability') && (
                  <div>
                    <SmartCalculatorInput
                      label={newAssetClass === 'physical' ? "Units / Quantity" : "Units Count"}
                      value={newAssetUnits}
                      onChange={(val) => {
                        setNewAssetUnits(val);
                        const parsedU = parseFormattedNumber(val);
                        const parsedP = parseFormattedNumber(newAssetPrice);
                        if (parsedU > 0 && parsedP > 0) {
                          setNewAssetCost((parsedU * parsedP).toFixed(2));
                        }
                      }}
                      currencySymbol=""
                    />
                  </div>
                )}

                <div>
                  <SmartCalculatorInput
                    label={newAssetClass === 'liability' ? "Principal Loan Balance (PHP)" : newAssetClass === 'physical' ? "Principal Asset Cost Basis (PHP)" : "Cost Basis (PHP)"}
                    value={newAssetCost}
                    onChange={setNewAssetCost}
                  />
                </div>

                {newAssetClass === 'risk' && (
                  <div>
                    <SmartCalculatorInput
                      label="Price Per Unit (PHP)"
                      value={newAssetPrice}
                      onChange={(val) => {
                        setNewAssetPrice(val);
                        const parsedP = parseFormattedNumber(val);
                        const parsedU = parseFormattedNumber(newAssetUnits);
                        if (parsedP > 0 && parsedU > 0) {
                          setNewAssetCost((parsedP * parsedU).toFixed(2));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{newAssetClass === 'liability' ? 'Loan Start Date' : 'Starting Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={newAssetStartDate}
                    onChange={(e) => setNewAssetStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{newAssetClass === 'liability' ? 'Payoff Target Date' : 'Maturity Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={newAssetMaturityDate}
                    onChange={(e) => setNewAssetMaturityDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-500" />
                    <span>{newAssetClass === 'liability' ? 'Loan Interest Rate / APR (%)' : newAssetClass === 'physical' ? 'Annual Rate (Appreciation / Depreciation %)' : 'Yield / Interest Rate'}</span>
                  </span>
                  {newAssetClass === 'physical' ? (
                    <span className="text-[9px] text-slate-400 font-normal">e.g. +5.0 (Appreciates) or -10.0 (Depreciates)</span>
                  ) : newAssetClass === 'liability' ? (
                    <span className="text-[9px] text-rose-500 font-normal">e.g. 7.5 (% APR p.a.)</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="relative col-span-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 5.25"
                      value={newAssetYieldPercent}
                      onChange={(e) => setNewAssetYieldPercent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <select
                    value={newAssetYieldFrequency}
                    onChange={(e) => setNewAssetYieldFrequency(e.target.value as any)}
                    className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="annual">p.a. (Per Annum)</option>
                    <option value="monthly">per month</option>
                    <option value="semi-annual">per 6 mos</option>
                    <option value="quarterly">per quarter</option>
                  </select>
                </div>
              </div>

              {newAssetClass !== 'liability' && newAssetType !== 'liability' && newAssetClass !== 'physical' && (
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      <span>Withholding Tax (%)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">Standard PH: 20%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="20 (leave blank if 0%)"
                      value={newAssetWithholdingTax}
                      onChange={(e) => setNewAssetWithholdingTax(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssetForm(false);
                    setActiveSuggestionField(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm"
                >
                  Create Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Across Assets Modal Dialog */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <span>Transfer Funds Across Assets</span>
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAssetTransfer} className="space-y-4">
              {/* Source Asset */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Transfer From (Source Asset)</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">Deduction Outflow</span>
                </label>
                <select
                  value={transferFromKey}
                  onChange={(e) => setTransferFromKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {assets.map((asset) => {
                    const val = getAssetValuation(asset);
                    const isCashReserve = asset.key === 'available_cash' || asset.assetType === 'cash';
                    const displayName = isCashReserve
                      ? `💵 Current Cash Reserve Balance (${asset.name})`
                      : asset.name;
                    return (
                      <option key={`from_${asset.key}`} value={asset.key}>
                        [{asset.class.toUpperCase()}] {displayName} ({asset.platform}) — ₱{val.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const srcAsset = assets.find((a) => a.key === transferFromKey);
                  if (!srcAsset) return null;
                  const srcVal = getAssetValuation(srcAsset);
                  return (
                    <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-md border border-slate-100 dark:border-white/5 text-[11px] flex justify-between text-slate-600 dark:text-slate-400 font-mono">
                      <span>Available Valuation: <b>₱{srcVal.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
                      <span>Cost Basis: <b>₱{srcAsset.costBasisPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
                    </div>
                  );
                })()}
              </div>

              {/* Destination Asset */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Transfer To (Destination Asset)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Inflow Addition</span>
                </label>
                <select
                  value={transferToKey}
                  onChange={(e) => setTransferToKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {assets.map((asset) => {
                    const val = getAssetValuation(asset);
                    const isCashReserve = asset.key === 'available_cash' || asset.assetType === 'cash';
                    const displayName = isCashReserve
                      ? `💵 Current Cash Reserve Balance (${asset.name})`
                      : asset.name;
                    return (
                      <option key={`to_${asset.key}`} value={asset.key} disabled={asset.key === transferFromKey}>
                        [{asset.class.toUpperCase()}] {displayName} ({asset.platform}) — ₱{val.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const dstAsset = assets.find((a) => a.key === transferToKey);
                  if (!dstAsset) return null;
                  const dstVal = getAssetValuation(dstAsset);
                  const isDstSafe = dstAsset.class === 'safe' || dstAsset.assetType === 'cash' || dstAsset.assetType === 'deposit' || dstAsset.assetType === 'hys' || dstAsset.class === 'liability' || dstAsset.assetType === 'liability';
                  let unitPrice = dstAsset.currentPricePHP;
                  if (!isDstSafe && (!unitPrice || unitPrice <= 0 || (unitPrice === 1 && dstAsset.costBasisPHP > 10))) {
                    unitPrice = dstAsset.units > 0 ? dstAsset.costBasisPHP / dstAsset.units : dstAsset.costBasisPHP;
                  }
                  return (
                    <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-md border border-slate-100 dark:border-white/5 text-[11px] flex justify-between text-slate-600 dark:text-slate-400 font-mono">
                      <span>Current Unit Price: <b>{isDstSafe ? '₱1.00' : `₱${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}</b></span>
                      <span>Current Holdings: <b>₱{dstVal.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
                    </div>
                  );
                })()}
              </div>

              {/* Transfer Amount Input */}
              <div>
                <SmartCalculatorInput
                  label="Transfer Amount (PHP)"
                  value={transferAmount}
                  onChange={setTransferAmount}
                />
                {/* Preset percentage & Cash Reserve buttons */}
                {(() => {
                  const srcAsset = assets.find((a) => a.key === transferFromKey);
                  const cashAsset = assets.find((a) => a.key === 'hys' || a.assetType === 'hys' || a.name.toLowerCase().includes('high-yield')) || assets.find((a) => a.key === 'available_cash') || assets.find((a) => a.assetType === 'cash');
                  const cashVal = cashAsset ? getAssetValuation(cashAsset).totalValue : 0;
                  if (!srcAsset) return null;
                  const srcVal = getAssetValuation(srcAsset);
                  const maxVal = srcVal.totalValue;

                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Fill:</span>
                      {cashVal > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTransferAmount(cashVal.toString());
                            if (cashAsset && transferFromKey !== cashAsset.key) {
                              setTransferFromKey(cashAsset.key);
                            }
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 text-[10px] font-extrabold rounded border border-teal-200 dark:border-teal-700/50 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                          title="Click to fill transfer amount with Current Cash Reserve Balance"
                        >
                          <Coins className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Cash Reserve Balance (₱{cashVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        </button>
                      )}
                      {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const calculated = Math.floor(maxVal * pct);
                            setTransferAmount(calculated.toString());
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
                        >
                          {pct === 1 ? 'MAX (100%)' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Live Calculation Preview Card */}
              {(() => {
                const amountPHP = parseFormattedNumber(transferAmount);
                const srcAsset = assets.find((a) => a.key === transferFromKey);
                const dstAsset = assets.find((a) => a.key === transferToKey);

                if (!amountPHP || amountPHP <= 0 || !srcAsset || !dstAsset) return null;

                const isDstPhysical = dstAsset.class === 'physical' || dstAsset.assetType === 'property';
                const isDstSafe = dstAsset.class === 'safe' || dstAsset.assetType === 'cash' || dstAsset.assetType === 'deposit' || dstAsset.assetType === 'hys';
                const isDstLiability = dstAsset.class === 'liability' || dstAsset.assetType === 'liability';

                let dstPrice = dstAsset.currentPricePHP;
                if (!isDstSafe && !isDstLiability && !isDstPhysical && (!dstPrice || dstPrice <= 0 || (dstPrice === 1 && dstAsset.costBasisPHP > 10))) {
                  dstPrice = dstAsset.units > 0 ? dstAsset.costBasisPHP / dstAsset.units : dstAsset.costBasisPHP;
                }
                if (isDstSafe || isDstLiability || isDstPhysical) dstPrice = 1;

                const unitsAdded = amountPHP / (dstPrice || 1);

                return (
                  <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-950 dark:text-emerald-200 border-b border-emerald-200/60 dark:border-emerald-800/30 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Transfer Breakdown Preview</span>
                      </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-300">₱{amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">Deduction (-):</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold block truncate">{srcAsset.name}</span>
                        <span className="text-slate-600 dark:text-slate-300 mt-0.5 block">-₱{amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">Addition (+):</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold block truncate">{dstAsset.name}</span>
                        <span className="text-slate-600 dark:text-slate-300 mt-0.5 block">
                          +₱{amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {
                            isDstSafe
                              ? '(Principal Cost Basis)'
                              : isDstLiability
                              ? '(Principal Debt Balance)'
                              : isDstPhysical
                              ? '(Principal Basis)'
                              : `(+${unitsAdded.toLocaleString(undefined, { maximumFractionDigits: 6 })} units)`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Transfer Notes */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Transfer Purpose / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reallocated emergency cash to Bitcoin or Time Deposit"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferError('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2 shadow-xs cursor-pointer transition-all"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Confirm Asset Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payday Income Deposit Modal Dialog (15th & 30th) */}
      {showPaydayModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <span>Deposit Income to Available Cash</span>
              </h3>
              <button
                onClick={() => {
                  setShowPaydayModal(false);
                  setPaydayError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {paydayError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{paydayError}</span>
              </div>
            )}

            <form onSubmit={handleExecutePaydayDeposit} className="space-y-4">
              {/* Destination Asset Selector (HYS vs Cash) */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Destination Account</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">Safe Shield Asset</span>
                </label>
                <select
                  value={paydayTargetKey}
                  onChange={(e) => setPaydayTargetKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                >
                  {assets
                    .filter((a) => a.class === 'safe' || a.assetType === 'cash' || a.assetType === 'hys' || a.assetType === 'deposit' || a.key === 'hys' || a.key === 'available_cash')
                    .map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.name} ({a.platform || (a.assetType === 'hys' ? 'High-Yield Savings 5%' : 'Cash Reserve')}) — ₱{getAssetValuation(a).totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </option>
                    ))}
                  {assets.filter((a) => a.class === 'safe' || a.assetType === 'cash' || a.assetType === 'hys' || a.assetType === 'deposit').length === 0 && (
                    <option value="available_cash">Available Cash Reserve (5% High-Yield Savings)</option>
                  )}
                </select>
              </div>

              {/* Payday Date & Schedule Frequency Selector */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const pSemimonthly = computeSchedulePresetInfo('semimonthly');
                const p15 = computeSchedulePresetInfo('15th');
                const pEndOfMonth = computeSchedulePresetInfo('endofmonth');
                const pWeekly = computeSchedulePresetInfo('weekly');
                const pMonthly = computeSchedulePresetInfo('monthly');
                const pToday = computeSchedulePresetInfo('today');

                return (
                  <div className="space-y-3">
                    {/* Schedule Frequency Dropdown */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Deposit Schedule / Frequency</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">
                          {paydayDate > todayStr ? `Auto-credits on ${paydayDate}` : 'Deposits Today (Single)'}
                        </span>
                      </label>
                      <select
                        value={paydayType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaydayType(val);
                          if (val !== 'custom') {
                            const info = computeSchedulePresetInfo(val);
                            setPaydayDate(info.dateStr);
                            setPaydayNotes(info.defaultNote);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                      >
                        <option value="semimonthly">🗓️ Every 15th & End of Month (Next target: {pSemimonthly.dateStr})</option>
                        <option value="15th">🗓️ Specific 15th Payday ({p15.dateStr})</option>
                        <option value="endofmonth">🗓️ Specific End of Month Payday ({pEndOfMonth.dateStr})</option>
                        <option value="weekly">📅 Weekly Income ({pWeekly.dateStr})</option>
                        <option value="monthly">📆 Monthly Salary ({pMonthly.dateStr})</option>
                        <option value="today">⚡ Immediate (Deposit Today — {pToday.dateStr})</option>
                        <option value="custom">⚙️ Custom Target Date...</option>
                      </select>
                    </div>

                    {/* Quick Frequency Pill Buttons */}
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Quick Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'semimonthly', label: '15th & End of Month', date: pSemimonthly.dateStr },
                          { id: '15th', label: '15th Payday', date: p15.dateStr },
                          { id: 'endofmonth', label: 'End of Month', date: pEndOfMonth.dateStr },
                          { id: 'weekly', label: 'Weekly', date: pWeekly.dateStr },
                          { id: 'today', label: 'Deposit Today', date: pToday.dateStr },
                        ].map((preset) => {
                          const isSelected = paydayType === preset.id || paydayDate === preset.date;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setPaydayType(preset.id);
                                const info = computeSchedulePresetInfo(preset.id);
                                setPaydayDate(info.dateStr);
                                setPaydayNotes(info.defaultNote);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-teal-500/15 dark:bg-teal-400/20 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              <span>{preset.label}</span>
                              <span className="text-[9px] font-mono opacity-70">({preset.date.slice(5)})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Date Input & Recurring Checkbox */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Target Payday Date
                        </label>
                        <input
                          type="date"
                          value={paydayDate}
                          onChange={(e) => {
                            setPaydayType('custom');
                            setPaydayDate(e.target.value);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 cursor-pointer w-full text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={isRecurringPayday}
                            onChange={(e) => setIsRecurringPayday(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span>🔁 Keep recurring automatically</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Deposit Amount Input */}
              <div>
                <SmartCalculatorInput
                  label="Income Deposit Amount (PHP)"
                  value={paydayAmount}
                  onChange={setPaydayAmount}
                />

                {/* Matrix Sync Status & Mismatch Error in Modal */}
                {(() => {
                  const enteredAmt = parseFormattedNumber(paydayAmount);
                  if (expectedMonthlyAssetAlloc > 0 && !isNaN(enteredAmt) && enteredAmt > 0) {
                    const isMismatch = Math.abs(enteredAmt - expectedPaydayAssetAlloc) > 0.01;
                    if (isMismatch) {
                      return (
                        <div className="mt-2 p-2.5 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-400 dark:border-rose-700/60 rounded-lg text-xs text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-rose-700 dark:text-rose-300">Matrix Mismatch:</span> Amount (₱{enteredAmt.toLocaleString()}) does not coincide with the Income Allocation Matrix (₱{expectedPaydayAssetAlloc.toLocaleString()} per 15th/30th payday).
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaydayAmount(expectedPaydayAssetAlloc.toString())}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs"
                          >
                            Match Matrix (₱{expectedPaydayAssetAlloc.toLocaleString()})
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-2 p-2 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-400/60 dark:border-emerald-700/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span><b>Synchronized:</b> Coincides with Cash Flow Income Matrix (₱{expectedPaydayAssetAlloc.toLocaleString()} / payday).</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {/* Quick Fill Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Fill:</span>
                  {expectedPaydayAssetAlloc > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaydayAmount(expectedPaydayAssetAlloc.toString())}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded border border-indigo-300 dark:border-indigo-500/30 cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>₱{expectedPaydayAssetAlloc.toLocaleString()} (Ledger Matrix)</span>
                    </button>
                  )}
                  {[10000, 15000, 20000, 25000, 30000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaydayAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
                    >
                      ₱{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card & Auto-Deposit Explanation */}
              {(() => {
                const amountPHP = parseFormattedNumber(paydayAmount);
                const targetAsset = assets.find((a) => a.key === paydayTargetKey)
                  || assets.find((a) => a.key === 'hys' || a.assetType === 'hys')
                  || assets.find((a) => a.key === 'available_cash');
                const todayStr = new Date().toISOString().split('T')[0];
                const isScheduledFuture = paydayDate > todayStr;
                const nextRecurringDate = computeNextUpcomingDate(paydayType, isScheduledFuture ? paydayDate : todayStr);

                if (!amountPHP || amountPHP <= 0) return null;

                const currentBal = targetAsset ? getAssetValuation(targetAsset).totalValue : 0;
                const newBal = currentBal + amountPHP;

                return (
                  <div className="space-y-2">
                    {isScheduledFuture ? (
                      <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200">
                          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>🗓️ Automatic Deposit Scheduled for Payday</span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 dark:text-amber-200/80 leading-relaxed font-sans">
                          Single <b>₱{amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b> will be <b>automatically deposited</b> into <b>{targetAsset?.name || 'High-Yield Savings / Cash Reserve'}</b> on <b>{paydayDate}</b>.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-teal-50/90 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800/60 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-teal-950 dark:text-teal-200">
                          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>⚡ Immediate Deposit Today (Single ₱{amountPHP.toLocaleString()})</span>
                        </div>
                        <p className="text-[11px] text-teal-900/90 dark:text-teal-200/80 leading-relaxed font-sans">
                          Exactly <b>₱{amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b> will be credited once today into <b>{targetAsset?.name || 'High-Yield Savings / Cash Reserve'}</b>.
                          {(isRecurringPayday || paydayType === 'semimonthly') && (
                            <span className="block mt-1 text-teal-800 dark:text-teal-300 font-semibold">
                              🗓️ Next scheduled automatic deposit of ₱{amountPHP.toLocaleString()} will occur on <b>{nextRecurringDate}</b>.
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/30 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-teal-100 dark:border-teal-900/50">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">Current Balance:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold block">₱{currentBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-teal-100 dark:border-teal-900/50">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">{isScheduledFuture ? 'Projected Payday Balance:' : 'New Balance After Deposit:'}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold block">₱{newBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Purpose / Notes */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Deposit Purpose / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15th Payday Salary / Freelance Income"
                  value={paydayNotes}
                  onChange={(e) => setPaydayNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaydayModal(false);
                    setPaydayError('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2 shadow-xs cursor-pointer transition-all"
                >
                  {paydayDate > new Date().toISOString().split('T')[0] ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Auto-Deposit 🗓️</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Confirm Immediate Deposit 💵</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTradingViewAsset && (
        <TradingViewAssetModal
          asset={selectedTradingViewAsset}
          onClose={() => setSelectedTradingViewAsset(null)}
        />
      )}
    </div>
  );
}
