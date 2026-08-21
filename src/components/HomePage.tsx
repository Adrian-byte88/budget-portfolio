import React from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  Sliders,
  DollarSign,
  Activity,
  Award,
  Users,
  History,
  Lock,
  ChevronRight,
  CheckCircle2,
  Zap,
  Globe,
  ArrowRight,
  Layers,
  Banknote
} from 'lucide-react';
import { AssetPosition, ExpenseEntry, BudgetLimit, FamilyGoal, IncomeBudgetPlan } from '../types';
import { HistoricalTx } from './TransactionHistoryTab';
import { getAssetValuation } from '../lib/formatters';

interface HomePageProps {
  email?: string;
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  budgets: BudgetLimit[];
  goals: FamilyGoal[];
  transactions: HistoricalTx[];
  usdPhpRate: number;
  targetAllocation?: number;
  onNavigateTab: (tab: string) => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  subscriptionTier?: 'free' | 'pro';
  isAdmin?: boolean;
  onOpenPricing?: () => void;
  incomeBudgetPlan?: IncomeBudgetPlan;
}

export default function HomePage({
  email,
  assets,
  expenses,
  budgets,
  goals,
  transactions,
  usdPhpRate,
  targetAllocation = 85,
  onNavigateTab,
  onOpenChat,
  onOpenSettings,
  subscriptionTier = 'free',
  isAdmin = false,
  onOpenPricing,
  incomeBudgetPlan,
}: HomePageProps) {
  // User greeting based on hour
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  const userName = email ? email.split('@')[0] : 'Member';

  // Calculate Key Portfolio Metrics dynamically
  const safeAssets = assets.filter((a) => a.class === 'safe');
  const riskAssets = assets.filter((a) => a.class === 'risk');
  const physicalAssets = assets.filter((a) => a.class === 'physical');
  const liabilityAssets = assets.filter((a) => a.class === 'liability');

  const totalSafe = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalRisk = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalPhysical = physicalAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalLiabilities = liabilityAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  const totalFinancialAssets = totalSafe + totalRisk;
  const grandTotalAssets = totalFinancialAssets + totalPhysical;
  const netWorth = grandTotalAssets - totalLiabilities;

  // Total Safe Cost & Total Risk Cost basis for dynamic overall performance
  const totalSafeCost = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
  const totalRiskCost = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
  const totalCostBasis = totalSafeCost + totalRiskCost;
  const totalUnrealizedGains = (totalSafe + totalRisk) - totalCostBasis;
  const totalGainPct = totalCostBasis > 0 ? (totalUnrealizedGains / totalCostBasis) * 100 : 0;

  // Annual and monthly passive yield calculated dynamically from actual asset holdings
  const totalAnnualYieldPHP = assets.reduce((sum, a) => {
    const val = getAssetValuation(a);
    const annualYield = val.totalValue * ((a.yieldPercent || 0) / 100) * (1 - (a.withholdingTaxPercent || 0) / 100);
    return sum + annualYield;
  }, 0);
  const weightedAnnualYieldPct = totalFinancialAssets > 0 ? (totalAnnualYieldPHP / totalFinancialAssets) * 100 : 0;
  const monthlyYieldPHP = totalAnnualYieldPHP / 12;

  // High-Yield Savings & Cash Reserve Amount dynamically identified
  const hysAsset = assets.find((a) => a.key === 'hys' || a.assetType === 'hys' || a.name.toLowerCase().includes('high-yield') || a.name.toLowerCase().includes('savings') || a.name.toLowerCase().includes('maya'));
  const cashReserveAsset = assets.find((a) => a.key === 'available_cash');
  const cashReserveVal = hysAsset
    ? getAssetValuation(hysAsset).totalValue
    : cashReserveAsset
    ? getAssetValuation(cashReserveAsset).totalValue
    : (safeAssets.length > 0 ? getAssetValuation(safeAssets[0]).totalValue : 0);

  const cashReserveYield = hysAsset ? hysAsset.yieldPercent : (safeAssets[0]?.yieldPercent ?? 0);
  const cashReserveName = hysAsset ? hysAsset.name : (safeAssets[0]?.name ?? 'Cash Reserve');

  // Budget and Real-time Cash Flow calculations
  const monthlyNetIncome = incomeBudgetPlan?.monthlyNetIncome ?? 0;
  const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.limitPHP, 0);
  const totalExpensesSpent = expenses.reduce((sum, e) => sum + e.amountPHP, 0);
  const budgetBurnPercent = totalMonthlyBudget > 0 ? Math.min(Math.round((totalExpensesSpent / totalMonthlyBudget) * 100), 100) : 0;
  const netMonthlyCashFlow = monthlyNetIncome > 0 ? monthlyNetIncome - totalExpensesSpent : -totalExpensesSpent;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Safe Ratio from My Financial Portfolio (Safe Shield / (Safe Shield + Risk Sleeve))
  const totalFinancialPortfolio = totalSafe + totalRisk;
  const safeRatioPercent = totalFinancialPortfolio > 0 ? Number(((totalSafe / totalFinancialPortfolio) * 100).toFixed(1)) : 0;

  const isPro = isAdmin || subscriptionTier === 'pro';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-6 sm:p-8">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                Live Portfolio Sync
              </span>
              {isPro ? (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  Enterprise PRO Active
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span>Free Member Access</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {timeGreeting}, <span className="text-emerald-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 capitalize">{userName}</span>!
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
                {isPro
                  ? 'Here is your live financial command center, computed directly in real-time from your active assets, savings yields, expense ledger, and balance sheet.'
                  : 'Welcome to your Budget Portfolio. Access your Expense Ledger, Summary Analytics, Social Family Sync, and Transaction Audit Log.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('ledger')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Expense</span>
            </button>

            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PieChart className="w-4 h-4 text-blue-600 dark:text-teal-400" />
              <span>Summary Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Summary Cards Grid */}
      {isPro ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Net Worth Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Net Worth</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ₱{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className={`font-extrabold flex items-center gap-0.5 ${totalGainPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {totalGainPct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {totalGainPct >= 0 ? `+${totalGainPct.toFixed(1)}%` : `${totalGainPct.toFixed(1)}%`} total returns
                </span>
                <span className="text-slate-400 font-medium">USD ${(netWorth / usdPhpRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Cash & Safe Reserve Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[170px]" title={cashReserveName}>
                {cashReserveName}
              </span>
              <div className="p-2 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600 dark:text-teal-400">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ₱{cashReserveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  ~₱{monthlyYieldPHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo yield
                </span>
                <span className="text-xs bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold">
                  {cashReserveYield > 0 ? `${cashReserveYield.toFixed(1)}% APY` : 'Safe Reserve'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow & Spending Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {monthlyNetIncome > 0 ? 'Monthly Net Cash Flow' : 'Monthly Spending Outflow'}
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {monthlyNetIncome > 0 ? (
                  <span className={netMonthlyCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {netMonthlyCashFlow >= 0 ? '+' : ''}₱{netMonthlyCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span>₱{totalExpensesSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>
                    {monthlyNetIncome > 0 ? `Spent: ₱${totalExpensesSpent.toLocaleString()}` : `Cap: ₱${totalMonthlyBudget.toLocaleString()}`}
                  </span>
                  <span className={budgetBurnPercent > 90 ? 'text-rose-500' : 'text-emerald-500'}>
                    {budgetBurnPercent}% {monthlyNetIncome > 0 ? 'Cap Used' : 'Spent'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetBurnPercent > 90 ? 'bg-rose-500' : budgetBurnPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${budgetBurnPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Safe Shield Ratio Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Safe Shield Ratio</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {safeRatioPercent}% <span className="text-xs font-normal text-slate-400">/ {targetAllocation}% Target</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ₱{totalSafe.toLocaleString(undefined, { maximumFractionDigits: 0 })} Safe Capital
                </span>
                <span className="text-slate-400">Risk: {(100 - safeRatioPercent).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Free User Overview Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly Cash Flow & Expense Ledger Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {monthlyNetIncome > 0 ? 'Monthly Net Cash Flow' : 'Cash Flow & Spending'}
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {monthlyNetIncome > 0 ? (
                  <span className={netMonthlyCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {netMonthlyCashFlow >= 0 ? '+' : ''}₱{netMonthlyCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span>₱{totalExpensesSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>
                    {monthlyNetIncome > 0 ? `Spent: ₱${totalExpensesSpent.toLocaleString()}` : `Cap: ₱${totalMonthlyBudget.toLocaleString()}`}
                  </span>
                  <span className={budgetBurnPercent > 90 ? 'text-rose-500' : 'text-emerald-500'}>
                    {budgetBurnPercent}% {monthlyNetIncome > 0 ? 'Cap Used' : 'Spent'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetBurnPercent > 90 ? 'bg-rose-500' : budgetBurnPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${budgetBurnPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Free Tier Access Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Free Member Access</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active Financial Modules</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Cash Flow Ledger • Summary Analytics • Social Family Sync • Audit Log
              </p>
            </div>
          </div>

          {/* Summary Analytics Enabled Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Summary Analytics</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Spend Trends & Limits Enabled</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Historical Expenditure Pie Chart, Monthly & Yearly Spend Overview, and Category Limits.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Open Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Split Content: Left Activity & Right Platform Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Asset Holdings & Market Quotes (PRO ONLY - Hidden for Free Users) */}
          {isPro && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Top Asset Holdings & Market Quotes</h2>
                </div>
                <button
                  onClick={() => onNavigateTab('assets')}
                  className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Asset Sleeve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {assets.slice(0, 5).map((asset) => {
                  const val = getAssetValuation(asset);
                  const isPositive = asset.change24h >= 0;

                  return (
                    <div key={asset.key} className="py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                          asset.class === 'safe'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : asset.class === 'risk'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : asset.class === 'physical'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {asset.class.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{asset.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{asset.platform} • {asset.assetType.toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                          ₱{val.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[11px]">
                          {asset.change24h !== 0 && (
                            <span className={`font-bold flex items-center ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {asset.change24h > 0 ? '+' : ''}{asset.change24h}%
                            </span>
                          )}
                          {asset.yieldPercent > 0 && (
                            <span className="text-teal-600 dark:text-teal-400 font-semibold">({asset.yieldPercent}% yield)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity & Ledger Feed</h2>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No recent transactions recorded. Use the Expense Ledger or Asset Sleeve to record activities.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type.toLowerCase().includes('buy') || tx.type.toLowerCase().includes('deposit')
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : tx.type.toLowerCase().includes('sell')
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{tx.asset}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{tx.date} • {tx.type.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 dark:text-white">
                        {tx.amount}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{tx.details || 'Verified'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Platform Modules */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Platform Modules</h3>

            {[
              {
                id: 'ledger',
                title: 'Cash Flow & Expense Ledger',
                desc: 'Category budgets, payday auto-sync & personal goals',
                icon: CreditCard,
                color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50',
                allowed: true,
              },
              {
                id: 'dashboard',
                title: 'Summary Analytics',
                desc: 'Visual portfolio graphs & monthly trends',
                icon: PieChart,
                color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
                allowed: true,
              },
              {
                id: 'social',
                title: 'Social Family Sync',
                desc: 'Collaborative family goals & budget tracking',
                icon: Users,
                color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50',
                allowed: true,
              },
              {
                id: 'transactions',
                title: 'Transaction Audit Log',
                desc: 'Historical ledger of transfers & trades',
                icon: History,
                color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
                allowed: true,
              },
              ...(isPro
                ? [
                    {
                      id: 'assets',
                      title: 'Risk & Safe Asset Registry',
                      desc: 'Manage Maya 5%, BTC, stocks & liabilities',
                      icon: ShieldCheck,
                      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
                      allowed: true,
                    },
                    {
                      id: 'audit',
                      title: 'Market Cycle Audit',
                      desc: 'PH Inflation CPI defense & deployment',
                      icon: Sliders,
                      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
                      allowed: true,
                    },
                  ]
                : []),
            ].map((module) => {
              const IconComp = module.icon;

              return (
                <button
                  key={module.id}
                  onClick={() => onNavigateTab(module.id)}
                  className="w-full p-3 bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${module.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        <span>{module.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{module.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
