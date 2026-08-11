import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseEntry, BudgetLimit } from '../types';
import { Receipt, Plus, AlertTriangle, CreditCard, RefreshCw, Share2, DollarSign, ArrowRightLeft, FileDown, ShieldCheck, Calendar, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { parseFormattedNumber } from '../utils/mathParser';

interface LedgerTabProps {
  expenses: ExpenseEntry[];
  budgets: BudgetLimit[];
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
  onAdjustExpense: (id: string, newAmount: number) => void;
  onDeleteExpense: (id: string) => void;
  onAdjustBudgetLimit?: (category: string, newLimit: number) => void;
  onResyncBudgets?: () => void;
  exchangeRates: Record<string, number>;
  highlightId: {type: string, id: string, tab?: string} | null;
}

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

export default function LedgerTab({
  expenses,
  budgets,
  onAddExpense,
  onAdjustExpense,
  onDeleteExpense,
  onAdjustBudgetLimit,
  onResyncBudgets,
  exchangeRates,
  highlightId,
}: LedgerTabProps) {
  // Expense Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    if (highlightId?.id === 'add-expense-section') {
      setShowExpenseForm(true);
    }
  }, [highlightId]);

  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustedAmount, setAdjustedAmount] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Lifestyle');
  const [amount, setAmount] = useState('1500');
  const [currency, setCurrency] = useState('PHP');
  const [familyShared, setFamilyShared] = useState(false);

  // Calculator Travel Converter State
  const [calcFromAmt, setCalcFromAmt] = useState('100');
  const [calcFromCurr, setCalcFromCurr] = useState('USD');
  const [calcToCurr, setCalcToCurr] = useState('PHP');
  const [calcResult, setCalcResult] = useState('6142.00');

  // Month & Category Budget Limit Control State
  const currentRealMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentRealMonthKey);

  // Available months list derived from expenses plus current month
  const availableMonths = useMemo(() => {
    const setM = new Set<string>([currentRealMonthKey]);
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        setM.add(e.date.substring(0, 7));
      }
    });
    return Array.from(setM).sort().reverse();
  }, [expenses, currentRealMonthKey]);

  // Overall Desired Monthly Expense Cap
  const [desiredMonthlyBudget, setDesiredMonthlyBudget] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('desired_monthly_expense_limit') : null;
    if (saved && !isNaN(Number(saved)) && Number(saved) > 0) return Number(saved);
    const sumCategoryLimits = budgets.reduce((acc, b) => acc + (b.limitPHP || 0), 0);
    return sumCategoryLimits > 0 ? sumCategoryLimits : 25000;
  });

  const [isEditingDesired, setIsEditingDesired] = useState(false);
  const [desiredInputVal, setDesiredInputVal] = useState(desiredMonthlyBudget.toString());
  const [adjustingCategory, setAdjustingCategory] = useState<string | null>(null);
  const [adjustedCategoryLimit, setAdjustedCategoryLimit] = useState<string>('');

  // Sum of individual category limits
  const sumCategoryLimits = useMemo(() => {
    return budgets.reduce((acc, b) => acc + (b.limitPHP || 0), 0);
  }, [budgets]);

  const isCapMismatch = desiredMonthlyBudget !== sumCategoryLimits;

  // AUTOMATIC MONTHLY CAP LOGIC:
  // Automatically register and persist monthly cap targets for active and new months
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMapStr = localStorage.getItem('wealth_vault_monthly_caps');
    let map: Record<string, number> = {};
    if (savedMapStr) {
      try { map = JSON.parse(savedMapStr); } catch (e) {}
    }
    // Auto-add current active month if not present
    if (!map[currentRealMonthKey]) {
      map[currentRealMonthKey] = desiredMonthlyBudget;
      localStorage.setItem('wealth_vault_monthly_caps', JSON.stringify(map));
    }
  }, [currentRealMonthKey, desiredMonthlyBudget]);

  // Retrieve active monthly cap for selected month
  const activeMonthlyCapForSelectedMonth = useMemo(() => {
    if (typeof window === 'undefined') return desiredMonthlyBudget;
    const savedMapStr = localStorage.getItem('wealth_vault_monthly_caps');
    if (savedMapStr) {
      try {
        const map = JSON.parse(savedMapStr);
        if (map[selectedMonthKey] && Number(map[selectedMonthKey]) > 0) {
          return Number(map[selectedMonthKey]);
        }
      } catch (e) {}
    }
    return desiredMonthlyBudget;
  }, [selectedMonthKey, desiredMonthlyBudget]);

  // Expenses filtered strictly for selected month
  const expensesForSelectedMonth = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      return e.date.startsWith(selectedMonthKey);
    });
  }, [expenses, selectedMonthKey]);

  // Calculate category spending for selected month
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    budgets.forEach((b) => {
      map[b.category] = 0;
    });
    expensesForSelectedMonth.forEach((e) => {
      const bucket = mapExpenseCategory(e.category, budgets);
      map[bucket] = (map[bucket] || 0) + (e.amountPHP || 0);
    });
    return map;
  }, [expensesForSelectedMonth, budgets]);

  // Total spent in selected month
  const totalSpentInSelectedMonth = useMemo(() => {
    return Object.values(categorySpentMap).reduce((acc: number, val: number) => acc + val, 0);
  }, [categorySpentMap]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFormattedNumber(amount);
    if (!amtNum || amtNum <= 0 || !desc) return;

    // Convert to PHP based on current rate table
    const rate = exchangeRates[currency] || 1;
    const amountPHP = amtNum * rate;

    onAddExpense({
      category,
      description: desc,
      amount: amtNum,
      currency,
      amountPHP,
      date: new Date().toISOString().split('T')[0],
      familyShared,
    });

    setDesc('');
    setAmount('');
    setShowExpenseForm(false);
  };

  const handleCalculateConversion = () => {
    const amt = parseFormattedNumber(calcFromAmt);
    if (!amt) return;
    const fromRate = exchangeRates[calcFromCurr] || 1;
    const toRate = exchangeRates[calcToCurr] || 1;

    // Convert: fromCurrency -> PHP -> toCurrency
    const amtInPHP = amt * fromRate;
    const converted = amtInPHP / toRate;

    setCalcResult(converted.toFixed(2));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Category Limit Controls & Desired Monthly Expense Cap Section */}
      <div id="category-limits-section" data-highlight-id="category-limits-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-1">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Category Limit Controls & Monthly Expense Cap</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Desired Monthly Cap & Category Threshold Meters</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your desired monthly expense cap is automatically allocated every month. Adjust thresholds and sync category limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Period:</span>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {availableMonths.map((mKey) => {
                  const [y, m] = mKey.split('-');
                  const dateObj = new Date(Number(y), Number(m) - 1, 1);
                  const mLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                  const isCurrent = mKey === currentRealMonthKey;
                  return (
                    <option key={mKey} value={mKey} className="bg-slate-900 text-white">
                      {mLabel} {isCurrent ? '(Active Month)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {onResyncBudgets && (
              <button
                onClick={onResyncBudgets}
                className="text-xs bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Ledger</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid: Left - Desired Monthly Expense Cap Card, Right - Category Meters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Desired Monthly Expense Cap Summary */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
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
                <div className="flex items-center space-x-2 my-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      value={desiredInputVal}
                      onChange={(e) => setDesiredInputVal(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-600 rounded text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const val = Number(desiredInputVal);
                      if (!isNaN(val) && val > 0) {
                        setDesiredMonthlyBudget(val);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('desired_monthly_expense_limit', val.toString());
                          const savedMapStr = localStorage.getItem('wealth_vault_monthly_caps');
                          let map: Record<string, number> = {};
                          if (savedMapStr) { try { map = JSON.parse(savedMapStr); } catch (e) {} }
                          map[selectedMonthKey] = val;
                          localStorage.setItem('wealth_vault_monthly_caps', JSON.stringify(map));
                        }
                      }
                      setIsEditingDesired(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingDesired(false)}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ₱{totalSpentInSelectedMonth.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ ₱{activeMonthlyCapForSelectedMonth.toLocaleString()}</span>
                    </span>
                    <span className={`text-xs font-bold font-mono ${
                      totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {((totalSpentInSelectedMonth / (activeMonthlyCapForSelectedMonth || 1)) * 100).toFixed(1)}% Used
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth
                          ? 'bg-rose-600'
                          : (totalSpentInSelectedMonth / activeMonthlyCapForSelectedMonth) > 0.8
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min((totalSpentInSelectedMonth / (activeMonthlyCapForSelectedMonth || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  {totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider flex items-center pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      Critical: Monthly Expense Cap Reached for {selectedMonthKey}!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Automated Monthly Cap Info Tag */}
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 rounded-lg text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Automated Monthly Cap Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-indigo-200/80">
                Your desired monthly expense cap (₱{desiredMonthlyBudget.toLocaleString()}) is automatically added and assigned as the spending target every month.
              </p>
            </div>

            {/* Cap Mismatch Warning Alert */}
            {isCapMismatch && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-lg flex flex-col justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">Cap Mismatch:</span> Desired Cap (₱{desiredMonthlyBudget.toLocaleString()}) differs from sum of category limits (₱{sumCategoryLimits.toLocaleString()}).
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDesiredMonthlyBudget(sumCategoryLimits);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('desired_monthly_expense_limit', sumCategoryLimits.toString());
                    }
                  }}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded-md uppercase tracking-wider transition-all cursor-pointer shadow-xs text-center"
                >
                  Sync Cap to ₱{sumCategoryLimits.toLocaleString()}
                </button>
              </div>
            )}
          </div>

          {/* Category Limits Meters Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {budgets.map((b) => {
              const actualSpent = categorySpentMap[b.category] !== undefined ? categorySpentMap[b.category] : 0;
              const isOverLimit = actualSpent > b.limitPHP && b.limitPHP > 0;
              const isCapReached = actualSpent >= b.limitPHP && b.limitPHP > 0;
              const ratio = b.limitPHP > 0 ? (actualSpent / b.limitPHP) * 100 : 0;
              return (
                <div
                  key={b.category}
                  id={`budget-${b.category}`}
                  data-highlight-id={`budget-${b.category}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCapReached
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`font-bold flex items-center gap-1.5 ${isCapReached ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-700 dark:text-slate-200'}`}>
                      <span>{b.category}</span>
                      {isCapReached && (
                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded text-[9px] font-black uppercase tracking-wider">
                          CAPPED
                        </span>
                      )}
                    </span>

                    {adjustingCategory === b.category ? (
                      <div className="flex items-center space-x-1.5">
                        <SmartCalculatorInput
                          label=""
                          value={adjustedCategoryLimit}
                          onChange={setAdjustedCategoryLimit}
                          currencySymbol=""
                          className="w-20 text-xs"
                        />
                        <button
                          onClick={() => {
                            if (onAdjustBudgetLimit) {
                              onAdjustBudgetLimit(b.category, Number(adjustedCategoryLimit));
                            }
                            setAdjustingCategory(null);
                          }}
                          className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAdjustingCategory(b.category);
                          setAdjustedCategoryLimit(b.limitPHP.toString());
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider font-bold cursor-pointer"
                      >
                        Adjust
                      </button>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                    <span className={`font-bold ${isCapReached ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'}`}>
                      ₱{actualSpent.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      / ₱{b.limitPHP.toLocaleString()} ({ratio.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCapReached ? 'bg-rose-600' : ratio > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Ledger Table & Conversion Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Col 1 & 2: Budget Entry Form and Table */}
        <div className="lg:col-span-2 space-y-6">
          <div id="expense-table-section" data-highlight-id="expense-table-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-blue-600 dark:text-teal-400" />
                  <span>Financial Ledger Registry</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit transactions, manual inputs, and category expense allocations</p>
              </div>
              <button
                id="add-expense-section"
                data-highlight-id="add-expense-section"
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Expense</span>
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleExpenseSubmit} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 p-5 rounded-lg space-y-4 mb-6 animate-slide-down">
                <h4 className="text-xs font-bold text-blue-600 dark:text-teal-400 uppercase tracking-wider">New Outflow Registry Entry</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starbucks, Taxi Manila, etc."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Category Allocation</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      {budgets.map((b) => (
                        <option key={b.category} value={b.category}>{b.category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <SmartCalculatorInput
                      label="Amount"
                      placeholder="e.g. 1500"
                      value={amount}
                      onChange={setAmount}
                      currencySymbol=""
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Currency Type</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      {Object.keys(exchangeRates).map((curr) => (
                        <option key={curr} value={curr}>{curr} (Rate: ₱{(exchangeRates[curr] || 1).toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={familyShared}
                      onChange={(e) => setFamilyShared(e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Share Goal progress with Family members</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                  >
                    Commit Outflow Entry
                  </button>
                </div>
              </form>
            )}

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                    <th className="py-4 pl-4">Effective Date</th>
                    <th className="py-4">Outflow Item</th>
                    <th className="py-4">Category</th>
                    <th className="py-4 text-right">Original Amount</th>
                    <th className="py-4 text-right pr-4">Total PHP Outflow</th>
                    <th className="py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {expenses.map((exp) => {
                    const isHighlighted = highlightId?.type === 'Expense' && highlightId?.id === exp.id;
                    return (
                      <tr key={exp.id} id={exp.id} data-highlight-id={exp.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}>
                        <td className="py-3.5 pl-4 text-slate-500 dark:text-slate-400 text-xs font-mono">{exp.date}</td>
                        <td className="py-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{exp.description}</span>
                            {exp.familyShared && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide mt-0.5">👪 Family Shared</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">{exp.category}</td>
                        <td className="py-3.5 text-right text-xs font-mono text-slate-500">
                          {adjustingId === exp.id ? (
                            <div className="flex items-center space-x-2">
                              <SmartCalculatorInput
                                label=""
                                value={adjustedAmount}
                                onChange={setAdjustedAmount}
                                currencySymbol=""
                                className="w-20"
                              />
                              <button onClick={() => {
                                onAdjustExpense(exp.id, parseFormattedNumber(adjustedAmount));
                                setAdjustingId(null);
                              }} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded">Save</button>
                            </div>
                          ) : (
                            <>{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {exp.currency}</>
                          )}
                        </td>
                        <td className="py-3.5 text-right text-xs font-mono font-bold text-slate-900 dark:text-white pr-4">
                          ₱{exp.amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right flex items-center justify-end space-x-2">
                          {adjustingId !== exp.id && (
                            <>
                              <button onClick={() => {
                                setAdjustingId(exp.id);
                                setAdjustedAmount(exp.amount.toString());
                              }} className="text-[10px] text-blue-600 dark:text-blue-400 underline uppercase tracking-wider font-bold">Adjust</button>
                              <button onClick={() => onDeleteExpense(exp.id)} className="text-[10px] text-rose-600 dark:text-rose-400 underline uppercase tracking-wider font-bold">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Col 3: Multi-currency converter & travel tools */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Global Travel Exchange Rates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-normal">
              Multi-currency lookup indices supporting international budgeting
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <SmartCalculatorInput
                    label="Amount"
                    value={calcFromAmt}
                    onChange={setCalcFromAmt}
                    currencySymbol=""
                    className="text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">From</label>
                  <select
                    value={calcFromCurr}
                    onChange={(e) => setCalcFromCurr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    {Object.keys(exchangeRates).map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">To</label>
                  <select
                    value={calcToCurr}
                    onChange={(e) => setCalcToCurr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    {Object.keys(exchangeRates).map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateConversion}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold uppercase flex items-center justify-center space-x-2 border border-slate-200 dark:border-white/5 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Convert Exchange rates</span>
              </button>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block">Valuation Result</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  {calcResult} {calcToCurr}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic currency conversions reference sheet */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Live Global Reference Index
            </h3>
            <div className="space-y-3">
              {Object.keys(exchangeRates).map((curr) => {
                if (curr === 'PHP') return null;
                const rate = exchangeRates[curr] || 1;
                return (
                  <div key={curr} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <span className="font-bold text-slate-500 dark:text-slate-300">1.00 {curr}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-400 font-bold">₱{rate.toFixed(4)} PHP</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
