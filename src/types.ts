export interface ExpenseEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  amountPHP: number; // calculated at current rates
  date: string;
  familyShared: boolean;
}

export interface TradeEntry {
  id: string;
  assetKey: string;
  assetName: string;
  action: 'BUY' | 'SELL';
  units: number;
  pricePHP: number;
  amountPHP: number;
  date: string;
  notes: string;
}

export interface AssetPosition {
  key: string;
  symbol?: string;
  name: string;
  platform: string;
  class: 'safe' | 'risk' | 'physical' | 'liability' | 'hys';
  assetType: 'cash' | 'deposit' | 'hys' | 'crypto' | 'commodity' | 'equity' | 'property' | 'liability';
  units: number;
  costBasisPHP: number;
  currentPricePHP: number;
  currentPriceUSD?: number;
  change24h?: number; // percentage fluctuation
  startDate?: string; // YYYY-MM-DD starting date
  maturityDate?: string; // YYYY-MM-DD maturity date
  yieldPercent?: number; // interest / yield rate percentage
  yieldFrequency?: 'annual' | 'monthly' | 'semi-annual' | 'quarterly'; // rate period e.g. p.a., per month, per 6 mos, per quarter
  withholdingTaxPercent?: number; // e.g. 20 for 20% final withholding tax in PH
}

export interface BudgetLimit {
  category: string;
  limitPHP: number;
  spentPHP: number;
}

export interface FamilyGoal {
  id: string;
  title: string;
  targetPHP: number;
  currentPHP: number;
  deadline: string;
  category?: string;
  notes?: string;
  monthlyContributionPHP?: number;
}

export interface IncomeBudgetPlan {
  monthlyNetIncome: number; // starts with 0
  paydayDays: number[]; // e.g. [15, 30]
  expenseCapAllocation: number;
  personalGoalsAllocation: number;
  assetInvestmentAllocation: number;
  targetAssetKey?: string;
  selectedDeployAssetKey?: string;
  autoDeployPayday?: boolean;
}

export interface MarketAlert {
  id: string;
  timestamp: string;
  asset: string;
  message: string;
  type: 'up' | 'down' | 'info' | 'volatility';
  thresholdPercentage?: number;
  lastTriggeredDate?: string;
  purpose?: string;
  category?: 'price' | 'guardrail' | 'budget' | 'system';
  isRead?: boolean;
}

export interface UserSession {
  email: string;
  authenticated: boolean;
  needs2FA: boolean;
  verified2FA: boolean;
  biometricEnabled: boolean;
  twoFactorSecret: string;
}
