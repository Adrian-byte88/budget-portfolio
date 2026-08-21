export interface MarketWatchTickerInfo {
  isPseStock: boolean;
  ticker: string;
  symbolPSE: string;
  marketWatchPath: string;
  marketWatchUrl: string;
  companyName: string;
  statusText: string;
  currency: 'PHP';
}

// Curated Philippine Stock Exchange master dictionary with official MarketWatch URL paths
export const KNOWN_PSE_STOCKS: Record<string, { name: string; category: string }> = {
  rcr: { name: 'RL Commercial REIT Inc.', category: 'Philippine REIT' },
  scc: { name: 'Semirara Mining & Power Corp', category: 'Energy & Mining' },
  spc: { name: 'SPC Power Corporation', category: 'Utilities & Power' },
  areit: { name: 'AREIT, Inc.', category: 'Philippine REIT' },
  creit: { name: 'Citicore Energy REIT Corp', category: 'Renewable REIT' },
  mreit: { name: 'MREIT, Inc.', category: 'Philippine REIT' },
  ddmpr: { name: 'DDMP REIT Inc.', category: 'Philippine REIT' },
  filrt: { name: 'Filinvest REIT Corp', category: 'Philippine REIT' },
  preit: { name: 'Premiere Island Power REIT', category: 'Power REIT' },
  smph: { name: 'SM Prime Holdings, Inc.', category: 'Property & Retail' },
  ali: { name: 'Ayala Land, Inc.', category: 'Property Developer' },
  bdo: { name: 'BDO Unibank, Inc.', category: 'Banking & Financial' },
  bpi: { name: 'Bank of the Philippine Islands', category: 'Banking & Financial' },
  tel: { name: 'PLDT Inc.', category: 'Telecommunications' },
  glo: { name: 'Globe Telecom, Inc.', category: 'Telecommunications' },
  jfc: { name: 'Jollibee Foods Corporation', category: 'Food & Quick Service' },
  ict: { name: 'International Container Terminal Services', category: 'Port Operations' },
  monde: { name: 'Monde Nissin Corp', category: 'Consumer Goods' },
  acen: { name: 'ACEN Corporation', category: 'Energy & Renewables' },
  ac: { name: 'Ayala Corporation', category: 'Conglomerate' },
  sm: { name: 'SM Investments Corporation', category: 'Conglomerate' },
  mbt: { name: 'Metropolitan Bank & Trust Co', category: 'Banking & Financial' },
  secb: { name: 'Security Bank Corporation', category: 'Banking & Financial' },
  mer: { name: 'Manila Electric Company', category: 'Utilities' },
  ap: { name: 'Aboitiz Power Corporation', category: 'Energy & Power' },
  abo: { name: 'Aboitiz Equity Ventures', category: 'Conglomerate' },
  dmci: { name: 'DMCI Holdings, Inc.', category: 'Infrastructure & Mining' },
  ltg: { name: 'LT Group, Inc.', category: 'Conglomerate' },
  cnvrg: { name: 'Converge ICT Solutions Inc.', category: 'Telecommunications' },
  pgold: { name: 'Puregold Price Club, Inc.', category: 'Retail & Supermarket' },
  nikl: { name: 'Nickel Asia Corporation', category: 'Mining & Metals' },
  bloom: { name: 'Bloomberry Resorts Corporation', category: 'Gaming & Hospitality' },
  meg: { name: 'Megaworld Corporation', category: 'Property Developer' },
};

/**
 * Extracts and normalizes a PSE stock ticker symbol from various formats:
 * - "scc" -> "SCC"
 * - "SCC Energy (DragonFi)" -> "SCC"
 * - "RCR REIT (DragonFi)" -> "RCR"
 * - "PSE:AREIT" -> "AREIT"
 * - "SMPH.PS" -> "SMPH"
 * - "BDO-PH" -> "BDO"
 */
export function extractPseTicker(assetKey: string = '', assetName: string = '', platform: string = ''): string | null {
  const k = assetKey.toLowerCase().trim();
  const n = assetName.toLowerCase().trim();
  const p = platform.toLowerCase().trim();

  // 1. Direct dictionary match on key
  const cleanKey = k.replace(/\.ps$/, '').replace(/-ph$/, '').replace(/^pse:/, '').replace(/[^a-z0-9]/g, '');
  if (KNOWN_PSE_STOCKS[cleanKey]) {
    return cleanKey.toUpperCase();
  }

  // 2. Check if key is known prefix
  for (const knownTicker of Object.keys(KNOWN_PSE_STOCKS)) {
    if (k === knownTicker || k.startsWith(`${knownTicker}_`) || k.startsWith(`${knownTicker}-`)) {
      return knownTicker.toUpperCase();
    }
  }

  // 3. Check name patterns
  for (const [knownTicker, info] of Object.entries(KNOWN_PSE_STOCKS)) {
    const tickerUpper = knownTicker.toUpperCase();
    if (
      n.includes(tickerUpper) ||
      n.includes(knownTicker) ||
      n.includes(info.name.toLowerCase())
    ) {
      return tickerUpper;
    }
  }

  // 4. Check for explicit PSE markers (e.g. DragonFi, PSE:, .PS)
  if (p.includes('pse') || p.includes('dragonfi') || p.includes('col') || p.includes('bdo sec') || p.includes('first metro') || k.includes('pse') || n.includes('pse')) {
    // Attempt to extract 2-6 letter ticker
    const match = k.match(/^[a-z]{2,6}/) || n.match(/\b([A-Za-z]{2,6})\b/);
    if (match) {
      const candidate = match[1] ? match[1].toUpperCase() : match[0].toUpperCase();
      if (!['CRYPTO', 'SAFE', 'RISK', 'STOCK', 'CASH', 'SAVING', 'EQUITY', 'REIT', 'INDEX'].includes(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Returns complete MarketWatch metadata and path for a PSE stock
 */
export function getMarketWatchDetails(assetKey: string = '', assetName: string = '', platform: string = ''): MarketWatchTickerInfo | null {
  const ticker = extractPseTicker(assetKey, assetName, platform);
  if (!ticker) return null;

  const tickerLower = ticker.toLowerCase();
  const known = KNOWN_PSE_STOCKS[tickerLower];
  const companyName = known ? known.name : assetName || ticker;
  const marketWatchPath = `/investing/stock/${tickerLower}?countrycode=ph`;
  const marketWatchUrl = `https://www.marketwatch.com${marketWatchPath}`;

  return {
    isPseStock: true,
    ticker,
    symbolPSE: `PSE:${ticker}`,
    marketWatchPath,
    marketWatchUrl,
    companyName,
    statusText: `Supported (Tracks ${companyName} in PHP)`,
    currency: 'PHP',
  };
}
