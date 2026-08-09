import React, { useState, useEffect } from 'react';
import { ExpenseEntry, BudgetLimit } from '../types';
import { Receipt, Plus, AlertTriangle, CreditCard, RefreshCw, Share2, DollarSign, ArrowRightLeft, FileDown, ShieldCheck } from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { parseFormattedNumber } from '../utils/mathParser';

interface LedgerTabProps {
  expenses: ExpenseEntry[];
  budgets: BudgetLimit[];
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
  onAdjustExpense: (id: string, newAmount: number) => void;
  onDeleteExpense: (id: string) => void;
  exchangeRates: Record<string, number>;
  highlightId: {type: string, id: string, tab?: string} | null;
}

export default function LedgerTab({
  expenses,
  budgets,
  onAddExpense,
  onAdjustExpense,
  onDeleteExpense,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
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
  );
}
