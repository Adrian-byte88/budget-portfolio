import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AssetPosition, ExpenseEntry, BudgetLimit } from '../types';
import { AlertTriangle, TrendingUp, Filter, Percent, Calendar, BarChart3, ArrowDownRight, ArrowUpRight, DollarSign, Layers, PieChart as PieChartIcon, Sparkles, Receipt, ArrowRight, ExternalLink } from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { getAssetValuation } from '../lib/formatters';

interface SummaryDashboardProps {
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  budgets: BudgetLimit[];
  onAdjustBudgetLimit: (category: string, newLimit: number) => void;
  onResyncBudgets: () => void;
  targetAllocation: number;
  isAdmin?: boolean;
  subscriptionTier?: 'free' | 'pro';
  onOpenPricing?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenLedger?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Lifestyle: '#10b981',
  'Rent & Utilities': '#a855f7',
  'Travel / Fuel': '#3b82f6',
  Shopping: '#fb923c',
  'Food & Dining': '#fb7185',
  Other: '#94a3b8',
  Grocery: '#10b981',
  Utilities: '#a855f7',
  Travel: '#3b82f6',
  Dining: '#fb7185',
};

// Helper to categorize user logged expenses dynamically matching current budget limits
const mapExpenseCategory = (cat: string, availableBudgets: BudgetLimit[]): string => {
  if (!availableBudgets || availableBudgets.length === 0) return 'Other';
  const c = (cat || '').trim().toLowerCase();

  // 1. Exact match (case insensitive)
  const exact = availableBudgets.find((b) => b.category.toLowerCase() === c);
  if (exact) return exact.category;

  // 2. Keyword heuristic matching against available budget categories
  for (const b of availableBudgets) {
    const bCat = b.category.toLowerCase();
    if ((c.includes('life') || c.includes('health') || c.includes('entertainment')) && bCat.includes('life')) return b.category;
    if ((c.includes('rent') || c.includes('util') || c.includes('bill') || c.includes('elect') || c.includes('water') || c.includes('wifi') || c.includes('net')) && (bCat.includes('rent') || bCat.includes('util'))) return b.category;
    if ((c.includes('trav') || c.includes('fuel') || c.includes('gas') || c.includes('commute') || c.includes('trans')) && (bCat.includes('trav') || bCat.includes('fuel'))) return b.category;
    if ((c.includes('shop') || c.includes('mall') || c.includes('cloth') || c.includes('retail')) && bCat.includes('shop')) return b.category;
    if ((c.includes('food') || c.includes('din') || c.includes('groc') || c.includes('eat') || c.includes('rest') || c.includes('cafe') || c.includes('supermarket')) && (bCat.includes('food') || bCat.includes('din') || bCat.includes('groc'))) return b.category;
  }

  // 3. Fallback to 'Other' or first available category
  const fallbackOther = availableBudgets.find((b) => b.category.toLowerCase().includes('other'));
  if (fallbackOther) return fallbackOther.category;

  return availableBudgets[0].category;
};

export default function SummaryDashboard({
  assets,
  expenses,
  budgets,
  onAdjustBudgetLimit,
  onResyncBudgets,
  targetAllocation,
  isAdmin = false,
  subscriptionTier = 'free',
  onOpenPricing,
  onNavigateTab,
  onOpenLedger,
}: SummaryDashboardProps) {
  const isPro = subscriptionTier === 'pro' || isAdmin;
  const [selectedAssetClass, setSelectedAssetClass] = useState<'all' | 'safe' | 'risk' | 'physical'>('all');
  const [adjustingBudget, setAdjustingBudget] = useState<string | null>(null);
  const [adjustedLimit, setAdjustedLimit] = useState<string>('');
  const [spendViewCategory, setSpendViewCategory] = useState<string>('all');

  // Overall Desired Monthly Expense Limit State
  const defaultDesiredLimit = useMemo(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('desired_monthly_expense_limit') : null;
    if (saved && !isNaN(Number(saved)) && Number(saved) > 0) return Number(saved);
    const sumCategoryLimits = budgets.reduce((acc, b) => acc + b.limitPHP, 0);
    return sumCategoryLimits > 0 ? sumCategoryLimits : 25000;
  }, [budgets]);

  const [desiredMonthlyBudget, setDesiredMonthlyBudget] = useState<number>(defaultDesiredLimit);
  const [isEditingDesired, setIsEditingDesired] = useState<boolean>(false);
  const [desiredInputVal, setDesiredInputVal] = useState<string>(defaultDesiredLimit.toString());

  // Category spent amounts derived directly from expenses ledger matching budget categories
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    budgets.forEach((b) => {
      map[b.category] = 0;
    });
    expenses.forEach((e) => {
      const bucket = mapExpenseCategory(e.category, budgets);
      map[bucket] = (map[bucket] || 0) + (e.amountPHP || 0);
    });
    return map;
  }, [expenses, budgets]);

  // Calculate sum of individual category budget limits
  const sumCategoryLimits = useMemo(() => {
    return budgets.reduce((acc: number, b) => acc + (b.limitPHP || 0), 0);
  }, [budgets]);

  const isCapMismatch = desiredMonthlyBudget !== sumCategoryLimits;

  // Calculate current month's total spent across all category budgets derived directly from expense ledger
  const totalSpentCurrentMonth = useMemo(() => {
    return Object.values(categorySpentMap).reduce((acc: number, val: number) => acc + val, 0);
  }, [categorySpentMap]);

  // Year filter & view mode
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  // Hover state for Pie Chart transitions
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Extract available years from expenses + current year 2026
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(['2026']);
    expenses.forEach((e) => {
      if (e.date) {
        const y = e.date.split('-')[0];
        if (y && y.length === 4) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [expenses]);

  // Filter expenses by selected year
  const filteredExpenses = useMemo(() => {
    if (selectedYear === 'all') return expenses;
    return expenses.filter((e) => e.date && e.date.startsWith(selectedYear));
  }, [expenses, selectedYear]);

  // Historical Expenditure Pie Data computation derived strictly from expense ledger matching budget categories
  const historicalPieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    budgets.forEach((b) => {
      catMap[b.category] = 0;
    });

    filteredExpenses.forEach((e) => {
      const bucket = mapExpenseCategory(e.category, budgets);
      if (catMap[bucket] !== undefined) {
        catMap[bucket] += (e.amountPHP || 0);
      } else {
        catMap[bucket] = (e.amountPHP || 0);
      }
    });

    const totalVal = Object.values(catMap).reduce((a, b) => a + b, 0);
    const palette = ['#10b981', '#a855f7', '#3b82f6', '#fb923c', '#fb7185', '#06b6d4', '#8b5cf6', '#eab308', '#94a3b8'];

    return Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || palette[idx % palette.length],
      percentage: totalVal > 0 ? (value / totalVal) * 100 : 0,
    }));
  }, [filteredExpenses, budgets]);

  const totalHistoricalExpenditure = useMemo(() => {
    return historicalPieData.reduce((sum, item) => sum + item.value, 0);
  }, [historicalPieData]);

  // Monthly & Yearly Spend Data Aggregation
  const { monthlySpendData, yearlySpendData } = useMemo(() => {
    const monthsMap: Record<string, Record<string, number>> = {};
    const yearsMap: Record<string, Record<string, number>> = {};

    const yrSuffix = selectedYear !== 'all' ? selectedYear.slice(-2) : '26';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthNames.forEach((m) => {
      const initObj: Record<string, number> = {};
      budgets.forEach((b) => { initObj[b.category] = 0; });
      monthsMap[`${m} ${yrSuffix}`] = initObj;
    });

    filteredExpenses.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;

      const mName = monthNames[d.getMonth()];
      const yStr = d.getFullYear().toString();
      const mKey = `${mName} ${yStr.slice(-2)}`;

      if (!monthsMap[mKey]) {
        const initObj: Record<string, number> = {};
        budgets.forEach((b) => { initObj[b.category] = 0; });
        monthsMap[mKey] = initObj;
      }

      if (!yearsMap[yStr]) {
        const initObj: Record<string, number> = {};
        budgets.forEach((b) => { initObj[b.category] = 0; });
        yearsMap[yStr] = initObj;
      }

      const bucket = mapExpenseCategory(e.category, budgets);
      const amt = e.amountPHP || 0;

      if (monthsMap[mKey][bucket] !== undefined) {
        monthsMap[mKey][bucket] += amt;
      } else {
        monthsMap[mKey][bucket] = amt;
      }

      if (yearsMap[yStr][bucket] !== undefined) {
        yearsMap[yStr][bucket] += amt;
      } else {
        yearsMap[yStr][bucket] = amt;
      }
    });

    const mData = Object.entries(monthsMap).map(([month, cats]) => {
      const total = Object.values(cats).reduce((acc, v) => acc + v, 0);
      return {
        month,
        ...cats,
        Total: Number(total.toFixed(2)),
      };
    });

    const yData = Object.entries(yearsMap).map(([year, cats]) => {
      const total = Object.values(cats).reduce((acc, v) => acc + v, 0);
      return {
        month: year,
        ...cats,
        Total: Number(total.toFixed(2)),
      };
    });

    return { monthlySpendData: mData, yearlySpendData: yData };
  }, [filteredExpenses, selectedYear, budgets]);

  // Active chart data based on viewMode and selectedYear
  const activeSpendData = viewMode === 'yearly' && selectedYear === 'all' ? yearlySpendData : monthlySpendData;
  const totalSpendPeriod = activeSpendData.reduce((sum, item) => sum + item.Total, 0);
  const activeItemsWithSpend = activeSpendData.filter((item) => item.Total > 0);
  const avgPeriodSpend = activeItemsWithSpend.length > 0 ? totalSpendPeriod / activeItemsWithSpend.length : 0;
  const peakSpendItem = activeSpendData.reduce((max, item) => (item.Total > max.Total ? item : max), { month: '-', Total: 0 });

  // MoM / YoY Trend
  const lastItem = activeSpendData[activeSpendData.length - 1];
  const prevItem = activeSpendData.length > 1 ? activeSpendData[activeSpendData.length - 2] : null;
  const trendPercent = prevItem && prevItem.Total > 0 ? ((lastItem.Total - prevItem.Total) / prevItem.Total) * 100 : 0;

  // Calculates financial aggregates for Pro tier
  const totalSafe = assets.filter((a) => a.class === 'safe').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalRisk = assets.filter((a) => a.class === 'risk').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalPhysical = assets.filter((a) => a.class === 'physical').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalLiability = assets.filter((a) => a.class === 'liability').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const financialNetWorth = totalSafe + totalRisk;
  const grandTotalNetWorth = financialNetWorth + totalPhysical - totalLiability;

  const currentSafeRatio = financialNetWorth > 0 ? (totalSafe / financialNetWorth) * 100 : 0;
  const isSafeShieldViolated = currentSafeRatio < targetAllocation;

  // Transferred Portfolio Asset Allocation & Target Weights calculations
  const totalPortfolioValue = totalSafe + totalRisk;
  const safeWeight = totalPortfolioValue > 0 ? (totalSafe / totalPortfolioValue) * 100 : 0;
  const riskWeight = totalPortfolioValue > 0 ? (totalRisk / totalPortfolioValue) * 100 : 0;

  const targetSafe = targetAllocation;
  const targetRisk = 100 - targetSafe;

  const targetCryptoGoldOfTotal = 9.38;
  const targetReitOfTotal = 3.75;
  const targetStockOfTotal = 1.87;

  const riskAssets = assets.filter((a) => a.class === 'risk');
  const cryptoGoldAssets = riskAssets.filter(
    (a) => a.assetType === 'crypto' || a.assetType === 'commodity' || a.key === 'btc' || a.key === 'paxg'
  );
  const cryptoGoldValue = cryptoGoldAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const cryptoGoldWeightOfTotal = totalPortfolioValue > 0 ? (cryptoGoldValue / totalPortfolioValue) * 100 : 0;

  const reitAssets = riskAssets.filter(
    (a) => a.key === 'manulife' || a.key === 'rcr' || a.name.toLowerCase().includes('reit')
  );
  const reitValue = reitAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const reitWeightOfTotal = totalPortfolioValue > 0 ? (reitValue / totalPortfolioValue) * 100 : 0;

  const stockAssets = riskAssets.filter(
    (a) => (a.assetType === 'equity' || a.key === 'scc' || a.key === 'spc') && !reitAssets.some((r) => r.key === a.key)
  );
  const stockValue = stockAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const stockWeightOfTotal = totalPortfolioValue > 0 ? (stockValue / totalPortfolioValue) * 100 : 0;

  const targetPortfolioSize = targetRisk > 0 ? totalRisk / (targetRisk / 100) : 0;
  const targetSafeShieldValue = targetPortfolioSize * (targetSafe / 100);
  const institutionalFundingGap = Math.max(0, targetSafeShieldValue - totalSafe);

  const sectorData = [
    {
      sector: 'Fixed Income / Cash',
      currentValue: totalSafe,
      portfolioPct: safeWeight,
      color: '#3b82f6',
    },
    {
      sector: 'Commodities (Gold)',
      currentValue: assets.filter((a) => a.key === 'paxg' || a.assetType === 'commodity').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0),
      portfolioPct: totalPortfolioValue > 0 ? (assets.filter((a) => a.key === 'paxg' || a.assetType === 'commodity').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0) / totalPortfolioValue) * 100 : 0,
      color: '#eab308',
    },
    {
      sector: 'Real Estate (REITs)',
      currentValue: reitValue,
      portfolioPct: reitWeightOfTotal,
      color: '#10b981',
    },
    {
      sector: 'Digital Assets',
      currentValue: assets.filter((a) => a.key === 'btc' || a.assetType === 'crypto').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0),
      portfolioPct: totalPortfolioValue > 0 ? (assets.filter((a) => a.key === 'btc' || a.assetType === 'crypto').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0) / totalPortfolioValue) * 100 : 0,
      color: '#6366f1',
    },
    {
      sector: 'Energy / Utilities',
      currentValue: stockValue,
      portfolioPct: stockWeightOfTotal,
      color: '#f97316',
    },
  ];

  const pieChartData = sectorData.map((s) => ({
    name: s.sector,
    value: s.currentValue,
  }));

  // Cash burn runway
  const savedLivingExpenses = typeof window !== 'undefined' ? localStorage.getItem('monthly_living_expenses') : null;
  const baseLivingExpenses = savedLivingExpenses && !isNaN(Number(savedLivingExpenses)) && Number(savedLivingExpenses) > 0 ? Number(savedLivingExpenses) : 9000;
  const effectiveMonthlyBurn = avgPeriodSpend > 0 ? avgPeriodSpend : baseLivingExpenses;
  const cashBurnRunwayMonths = effectiveMonthlyBurn > 0 ? totalSafe / effectiveMonthlyBurn : 0;

  // Historical valuation trends for Pro
  const historicalIndices = [
    { month: 'Dec 25', safeVal: 120000, riskVal: 20633, physicalVal: 56000 },
    { month: 'Jan 26', safeVal: 121000, riskVal: 21500, physicalVal: 56000 },
    { month: 'Feb 26', safeVal: 121500, riskVal: 20500, physicalVal: 56000 },
    { month: 'Mar 26', safeVal: 156500, riskVal: 30500, physicalVal: 56000 },
    { month: 'Apr 26', safeVal: 176500, riskVal: 38025, physicalVal: 56000 },
    { month: 'May 26', safeVal: 230500, riskVal: 38500, physicalVal: 56000 },
    { month: 'Jun 26', safeVal: 208500, riskVal: 39000, physicalVal: 56000 },
    { month: 'Jul 26', safeVal: totalSafe, riskVal: totalRisk, physicalVal: totalPhysical },
  ];

  const historicalChartData = historicalIndices.map((pt) => {
    let value = 0;
    if (selectedAssetClass === 'all') value = pt.safeVal + pt.riskVal + pt.physicalVal;
    else if (selectedAssetClass === 'safe') value = pt.safeVal;
    else if (selectedAssetClass === 'risk') value = pt.riskVal;
    else if (selectedAssetClass === 'physical') value = pt.physicalVal;

    return {
      period: pt.month,
      Valuation: Number(value.toFixed(2)),
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Free Tier Info Banner */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Summary Analytics: Expenditure Analysis, Spend Overview & Category Limits
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                You have full access to Historical Expenditure Analysis (Pie Chart), Monthly & Yearly Spend Overview with Year filters, and Category Limit Controls.
              </p>
            </div>
          </div>
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shrink-0 shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>Upgrade to Pro</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Target allocation visual banners and warning triggers (Pro / Admin Only) */}
      {isPro && (
        <div id="net-worth-summary" data-highlight-id="net-worth-summary" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 shadow-xs group">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5">Cumulative Cash Burn Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {cashBurnRunwayMonths.toFixed(1)} Months
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5">
              Coverage @ ₱{Math.round(effectiveMonthlyBurn).toLocaleString()}/mo baseline
            </p>
          </div>

          <div className={`border rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 ${
            isSafeShieldViolated 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm' 
              : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Shield Hardening Alert</p>
                <h4 className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                  {isSafeShieldViolated ? 'Risk Buy Freeze Active' : 'Strategic Hold standard'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {isSafeShieldViolated 
                    ? 'Your Safe Shield is underweight. Liquidate risk assets or deposit cash into HYS.'
                    : 'Shield allocation holds above structural thresholds. Dynamic allocations approved.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Historical Asset performance analysis graphs (Pro / Admin Only) */}
      {isPro && (
        <div className="space-y-8">
          <div id="asset-allocation-section" data-highlight-id="asset-allocation-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-teal-400" />
                  <span>Historical Net Worth Curves</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Multi-period trend analysis filtered across asset divisions</p>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {(['all', 'safe', 'risk', 'physical'] as const).map((cl) => (
                  <button
                    key={cl}
                    onClick={() => setSelectedAssetClass(cl)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                      selectedAssetClass === cl
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {cl}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full text-xs font-mono min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={historicalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="period" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `₱${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: number) => [`₱${val.toLocaleString()}`, 'Valuation']}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelClassName="text-white font-bold"
                  />
                  <Line
                    type="monotone"
                    dataKey="Valuation"
                    stroke={selectedAssetClass === 'safe' ? '#10b981' : selectedAssetClass === 'risk' ? '#3b82f6' : selectedAssetClass === 'physical' ? '#a855f7' : '#06b6d4'}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transferred Asset Allocation Mix & Target vs Current Target Weights */}
          <div id="portfolio-charts-section" data-highlight-id="portfolio-charts-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Allocation Pizza Pie */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asset Allocation Mix</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Visualization of current sector book valuation</p>
              </div>

              <div className="h-64 w-full min-w-0 relative flex items-center justify-center my-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => `₱${val.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Active</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    ₱{totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                {sectorData.map((s) => (
                  <div key={s.sector} className="flex items-center space-x-2 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{s.sector}</span>
                    <span className="font-mono font-bold ml-auto">{s.portfolioPct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target vs Current Target Weights</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Discrepancy audit in Core Tiers & Pillars</p>
              </div>

              <div className="h-64 w-full min-w-0 my-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={[
                      { name: 'Safe Shield', Current: Number(safeWeight.toFixed(2)), Target: targetSafe },
                      { name: 'Risk: Crypto/Gold', Current: Number(cryptoGoldWeightOfTotal.toFixed(2)), Target: targetCryptoGoldOfTotal },
                      { name: 'Risk: REITs', Current: Number(reitWeightOfTotal.toFixed(2)), Target: targetReitOfTotal },
                      { name: 'Risk: Stocks', Current: Number(stockWeightOfTotal.toFixed(2)), Target: targetStockOfTotal },
                    ]}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} unit="%" />
                    <Tooltip
                      formatter={(val: number) => `${val}%`}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Target" fill="#94a3b8" opacity={0.4} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                💡 <b>Strategic Benchmark:</b> Your objective is to expand the Safe Shield block dynamically until the <b>₱{institutionalFundingGap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b> gap is dissolved. Focus entirely on Safe Cash Assets.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Historical Expenditure Analysis (Pie Chart with nice transition) & Category Limit Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Historical Expenditure Analysis - PIE CHART */}
        <div id="historical-expenditure-analysis" className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-1">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                <span>Historical Expenditure Analysis</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Category Breakdown & Distribution</span>
                </h2>
                <button
                  onClick={() => onNavigateTab ? onNavigateTab('ledger') : onOpenLedger?.()}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/90 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Navigate to Expense Ledger / Financial Ledger Registry"
                >
                  <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Financial Ledger Registry</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Proportional historical spending breakdown across categories with dynamic transition effects
              </p>
            </div>

            {/* Year Selector Linkage */}
            <div className="flex items-center space-x-2 self-start sm:self-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Year:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut / Pie Chart Container with Smooth Transitions */}
            <div className="relative h-64 w-full min-w-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={totalHistoricalExpenditure > 0 ? historicalPieData : [{ name: 'No Expenses Recorded', value: 1, color: '#334155' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={totalHistoricalExpenditure > 0 ? 4 : 0}
                    dataKey="value"
                    animationDuration={800}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => totalHistoricalExpenditure > 0 && setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {(totalHistoricalExpenditure > 0 ? historicalPieData : [{ name: 'No Expenses Recorded', value: 1, color: '#334155' }]).map((entry, index) => (
                      <Cell
                        key={`exp-cell-${index}`}
                        fill={entry.color}
                        stroke={activePieIndex === index && totalHistoricalExpenditure > 0 ? '#ffffff' : 'transparent'}
                        strokeWidth={activePieIndex === index && totalHistoricalExpenditure > 0 ? 3 : 0}
                        style={{
                          filter: activePieIndex === index && totalHistoricalExpenditure > 0 ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))' : 'none',
                          transform: activePieIndex === index && totalHistoricalExpenditure > 0 ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          transition: 'all 0.3s ease-in-out',
                          cursor: totalHistoricalExpenditure > 0 ? 'pointer' : 'default',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      name,
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelClassName="text-white font-bold"
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Badge */}
              <div className="absolute flex flex-col items-center pointer-events-none text-center px-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {activePieIndex !== null && totalHistoricalExpenditure > 0 ? historicalPieData[activePieIndex]?.name : 'Total Outflow'}
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  ₱
                  {activePieIndex !== null && totalHistoricalExpenditure > 0
                    ? historicalPieData[activePieIndex]?.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : totalHistoricalExpenditure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-indigo-500 font-extrabold mt-0.5">
                  {activePieIndex !== null && totalHistoricalExpenditure > 0
                    ? `${historicalPieData[activePieIndex]?.percentage.toFixed(1)}% of total`
                    : totalHistoricalExpenditure === 0 ? '0 Expenses Recorded' : selectedYear === 'all' ? 'All Time' : selectedYear}
                </span>
              </div>
            </div>

            {/* Category Legend & Breakdown List */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Category</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Amount / Share</span>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {historicalPieData.map((item, idx) => (
                  <div
                    key={item.name}
                    onMouseEnter={() => setActivePieIndex(idx)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      activePieIndex === idx
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono font-bold">
                      <span className="text-slate-900 dark:text-white">₱{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Limit Controls */}
        <div id="category-limits-section" data-highlight-id="category-limits-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex justify-between items-center">
              <span>Category Limit Controls</span>
              <button
                onClick={onResyncBudgets}
                className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer"
              >
                Sync Ledger
              </button>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Live threshold meters highlighting monthly spending caps</p>

            {/* Desired Monthly Expense Cap Input & Overview Card */}
            <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Desired Monthly Expense Cap
                </span>
                {!isEditingDesired ? (
                  <button
                    onClick={() => {
                      setDesiredInputVal(desiredMonthlyBudget.toString());
                      setIsEditingDesired(true);
                    }}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    Set Amount
                  </button>
                ) : null}
              </div>

              {isEditingDesired ? (
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      value={desiredInputVal}
                      onChange={(e) => setDesiredInputVal(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-600 rounded text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const val = Number(desiredInputVal);
                      if (!isNaN(val) && val > 0) {
                        setDesiredMonthlyBudget(val);
                        localStorage.setItem('desired_monthly_expense_limit', val.toString());
                      }
                      setIsEditingDesired(false);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingDesired(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₱{totalSpentCurrentMonth.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ ₱{desiredMonthlyBudget.toLocaleString()}</span>
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${
                      totalSpentCurrentMonth >= desiredMonthlyBudget ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {((totalSpentCurrentMonth / (desiredMonthlyBudget || 1)) * 100).toFixed(1)}% Used
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalSpentCurrentMonth >= desiredMonthlyBudget
                          ? 'bg-rose-600'
                          : (totalSpentCurrentMonth / desiredMonthlyBudget) > 0.8
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min((totalSpentCurrentMonth / (desiredMonthlyBudget || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  {totalSpentCurrentMonth >= desiredMonthlyBudget && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider flex items-center pt-0.5">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Critical: Overall Monthly Expense Cap Reached!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cap Mismatch Warning Alert */}
            {isCapMismatch && (
              <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-extrabold">Cap Mismatch Warning:</span> Desired Monthly Cap (₱{desiredMonthlyBudget.toLocaleString()}) does not match total category caps (₱{sumCategoryLimits.toLocaleString()}).
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDesiredMonthlyBudget(sumCategoryLimits);
                    localStorage.setItem('desired_monthly_expense_limit', sumCategoryLimits.toString());
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded-lg uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  Sync Cap to ₱{sumCategoryLimits.toLocaleString()}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4.5">
            {budgets.map((b) => {
              const actualSpent = categorySpentMap[b.category] !== undefined ? categorySpentMap[b.category] : b.spentPHP;
              const isOverLimit = actualSpent > b.limitPHP && b.limitPHP > 0;
              const isCapReached = actualSpent >= b.limitPHP && b.limitPHP > 0;
              const ratio = b.limitPHP > 0 ? (actualSpent / b.limitPHP) * 100 : 0;
              return (
                <div key={b.category} id={`budget-${b.category}`} data-highlight-id={`budget-${b.category}`} className={`space-y-1.5 p-2 rounded-xl transition-all ${
                  isCapReached ? 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40' : ''
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold flex items-center gap-1.5 ${isCapReached ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'}`}>
                      <span>{b.category}</span>
                      {isCapReached && (
                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded text-[9px] font-black uppercase tracking-wider">
                          CAPPED
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2">
                      {adjustingBudget === b.category ? (
                        <div className="flex items-center space-x-2">
                          <SmartCalculatorInput
                            label=""
                            value={adjustedLimit}
                            onChange={setAdjustedLimit}
                            currencySymbol=""
                            className="w-20"
                          />
                          <button
                            onClick={() => {
                              onAdjustBudgetLimit(b.category, Number(adjustedLimit));
                              setAdjustingBudget(null);
                            }}
                            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={`font-mono font-bold ${isCapReached ? 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}>
                            ₱{actualSpent.toLocaleString()} / ₱{b.limitPHP.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustingBudget(b.category);
                              setAdjustedLimit(b.limitPHP.toString());
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 underline uppercase tracking-wider font-bold cursor-pointer"
                          >
                            Adjust
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCapReached ? 'bg-rose-600' : ratio > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                  {isOverLimit ? (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
                      Critical: Budget Limit Exceeded!
                    </p>
                  ) : isCapReached ? (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
                      Warning: Category Cap Reached (100% Used)
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly & Yearly Spend Overview Bar Chart */}
      <div id="monthly-spend-overview" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-teal-400 font-bold uppercase tracking-widest text-xs mb-1">
              <Calendar className="w-4 h-4" />
              <span>Spend Timeline Analytics</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-teal-400" />
              <span>Monthly & Yearly Spend Overview</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aggregated expenditure trends by month and year, strictly synchronized from your ledger outflows
            </p>
          </div>

          {/* Controls: Year Selector + View Mode (Monthly vs Yearly) + Category Stack Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'yearly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Year Selector Dropdown / Pills */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-1">Year:</span>
              <button
                onClick={() => setSelectedYear('all')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedYear === 'all'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                All Years
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSpendViewCategory('all')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  spendViewCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                All (Stacked)
              </button>
              {budgets.map((b) => (
                <button
                  key={b.category}
                  onClick={() => setSpendViewCategory(b.category)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    spendViewCategory === b.category
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {b.category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High Level KPI summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {viewMode === 'yearly' && selectedYear === 'all' ? 'Avg Annual Outflow' : 'Avg Monthly Outflow'}
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                ₱{avgPeriodSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Peak Spend Period ({selectedYear === 'all' ? 'All Time' : selectedYear})
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {peakSpendItem.Total > 0 ? (
                  <>
                    {peakSpendItem.month} <span className="text-xs font-normal text-slate-500">(₱{peakSpendItem.Total.toLocaleString()})</span>
                  </>
                ) : (
                  <span className="text-xs font-normal text-slate-400">No spend recorded</span>
                )}
              </div>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Latest Period Trend</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`text-sm font-black font-mono ${totalSpendPeriod === 0 ? 'text-slate-400 font-normal text-xs' : trendPercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {totalSpendPeriod === 0 ? 'No trend data' : `${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(1)}%`}
                </span>
                {totalSpendPeriod > 0 && (
                  <span className="text-[10px] text-slate-500">vs {prevItem ? prevItem.month : 'prev'}</span>
                )}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${totalSpendPeriod === 0 ? 'bg-slate-500/10 text-slate-400' : trendPercent <= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {totalSpendPeriod === 0 ? <BarChart3 className="w-4 h-4" /> : trendPercent <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-80 w-full text-xs font-mono min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={activeSpendData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: number, name: string) => [`₱${val.toLocaleString()}`, name]}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelClassName="text-white font-bold"
              />
              <Legend />
              {spendViewCategory === 'all' ? (
                budgets.map((b, idx) => {
                  const palette = ['#10b981', '#a855f7', '#3b82f6', '#fb923c', '#fb7185', '#06b6d4', '#8b5cf6', '#eab308', '#94a3b8'];
                  const color = CATEGORY_COLORS[b.category] || palette[idx % palette.length];
                  const isLast = idx === budgets.length - 1;
                  return (
                    <Bar
                      key={b.category}
                      dataKey={b.category}
                      stackId="spend"
                      fill={color}
                      name={b.category}
                      radius={isLast ? [4, 4, 0, 0] : undefined}
                    />
                  );
                })
              ) : (
                <Bar
                  dataKey={spendViewCategory}
                  fill={CATEGORY_COLORS[spendViewCategory] || '#94a3b8'}
                  name={spendViewCategory}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
