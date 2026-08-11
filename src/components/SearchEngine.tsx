import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight, Layout, Compass, DollarSign, Wallet, Target, Tag, Settings, Command, CornerDownLeft } from 'lucide-react';
import { AssetPosition, ExpenseEntry, FamilyGoal, BudgetLimit, TradeEntry } from '../types';
import { CycleItem } from './MarketCycleAuditTab';
import { getAssetValuation } from '../lib/formatters';

interface SearchEngineProps {
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  goals: FamilyGoal[];
  budgets: BudgetLimit[];
  transactions?: TradeEntry[];
  cycleItems?: CycleItem[];
  onSelect: (type: string, id: string, targetTab?: string) => void;
}

interface SearchItem {
  type: 'Tab' | 'Section' | 'Asset' | 'Expense' | 'Goal' | 'Category' | 'Transaction' | 'CycleItem';
  name: string;
  id: string;
  targetTab?: string;
  subtitle: string;
  keywords?: string;
}

const STATIC_INDEX: SearchItem[] = [
  // TABS
  { type: 'Tab', name: 'Summary Dashboard', id: 'dashboard', targetTab: 'dashboard', subtitle: 'Main Overview & KPIs', keywords: 'home dashboard kpis metrics summary net worth' },
  { type: 'Tab', name: 'My Financial Portfolio', id: 'portfolio', targetTab: 'portfolio', subtitle: 'Allocation & Yield Projections', keywords: 'portfolio yield asset allocation breakdown returns' },
  { type: 'Tab', name: 'Risk & Safe Assets', id: 'assets', targetTab: 'assets', subtitle: 'Asset Sleeve Holdings & Trades', keywords: 'safe risk maya bank hys tbills crypto stocks market alerts trades sleeve' },
  { type: 'Tab', name: 'Expense Ledger', id: 'ledger', targetTab: 'ledger', subtitle: 'Outflow Logs & Category Limits', keywords: 'expenses spending budget bank sync transactions outflows' },
  { type: 'Tab', name: 'Social Family Sync', id: 'social', targetTab: 'social', subtitle: 'Collaborative Family Goals', keywords: 'family goals savings contributions tuition vacation household' },
  { type: 'Tab', name: 'Cycle Audit', id: 'audit', targetTab: 'audit', subtitle: 'Macroeconomic Cycle Analysis', keywords: 'audit market phase rebalance macro risk cycle recommendation' },
  { type: 'Tab', name: 'Transaction History', id: 'transactions', targetTab: 'transactions', subtitle: 'Audit Trail & Ledger History', keywords: 'history logs audit trail trades system ledger' },
  { type: 'Tab', name: 'Settings & Export Engine', id: 'settings-export', targetTab: 'settings', subtitle: 'Profile, Theme & Excel/JSON Backup', keywords: 'settings profile dark mode theme backup export excel json csv restore' },

  // SECTIONS - SUMMARY DASHBOARD
  { type: 'Section', name: 'Cash Burn & Shield Hardening KPI Cards', id: 'net-worth-summary', targetTab: 'dashboard', subtitle: 'Dashboard Section', keywords: 'cash burn rate runway shield hardening alert summary' },
  { type: 'Section', name: 'Historical Net Worth Curves Chart', id: 'asset-allocation-section', targetTab: 'dashboard', subtitle: 'Dashboard Section', keywords: 'line chart valuation trends net worth curves' },
  { type: 'Section', name: 'Asset Allocation Mix & Target vs Current Weights', id: 'portfolio-charts-section', targetTab: 'dashboard', subtitle: 'Dashboard Section', keywords: 'asset allocation mix target vs current weights pie chart bar chart breakdown' },
  { type: 'Section', name: 'Monthly Spend Overview & Outflow Timeline', id: 'monthly-spend-overview', targetTab: 'dashboard', subtitle: 'Dashboard Section', keywords: 'bar chart monthly spend expenditure trends mom change peak spend timeline' },
  { type: 'Section', name: 'Category Budget Limits & Progress Tracker', id: 'category-limits-section', targetTab: 'ledger', subtitle: 'Expense Ledger Section', keywords: 'budget caps spending thresholds violation tracker limits progress alarms desired monthly expense cap' },

  // SECTIONS - PORTFOLIO
  { type: 'Section', name: 'Asset Class Breakdown Table & Yields', id: 'portfolio-table-section', targetTab: 'portfolio', subtitle: 'Portfolio Section', keywords: 'holdings table yield php value portfolio percentage return' },
  { type: 'Section', name: 'Target Allocation Slider & Rebalancing Shield', id: 'portfolio-allocation-section', targetTab: 'portfolio', subtitle: 'Portfolio Section', keywords: 'target allocation risk dial safe shield rebalance strategy slider' },

  // SECTIONS - RISK & SAFE ASSETS
  { type: 'Section', name: 'Safe Asset Sleeve (Maya Bank HYS, TBills, Digital Banks)', id: 'safe-assets-section', targetTab: 'assets', subtitle: 'Assets Section', keywords: 'maya bank hys high yield savings treasury bills time deposit safe sleeve' },
  { type: 'Section', name: 'Risk Asset Sleeve (Crypto, PSEi, Global Equities)', id: 'risk-assets-section', targetTab: 'assets', subtitle: 'Assets Section', keywords: 'bitcoin stocks psei s&p500 global equities crypto risk capital equity' },
  { type: 'Section', name: 'Physical Assets & Illiquid Real Estate', id: 'physical-assets-section', targetTab: 'assets', subtitle: 'Assets Section', keywords: 'condominium lot real estate property gold vehicle physical illiquid' },
  { type: 'Section', name: 'Personal Price Alerts & 1-Click Guardrails', id: 'personal-price-alerts', targetTab: 'assets', subtitle: 'Header Bell Menu', keywords: 'price alarms alert thresholds notifications upper bound lower bound trigger presets guardrails bell' },

  // SECTIONS - EXPENSE LEDGER
  { type: 'Section', name: 'Expense Ledger Outflow Table', id: 'expense-table-section', targetTab: 'ledger', subtitle: 'Ledger Section', keywords: 'expense list transactions outflow table delete adjust log' },
  { type: 'Section', name: 'Log New Expense Outflow Form', id: 'add-expense-section', targetTab: 'ledger', subtitle: 'Ledger Section', keywords: 'add expense new transaction outflow form grocery dining shopping' },
  { type: 'Section', name: 'Bank Synchronization & CSV Import', id: 'bank-sync-section', targetTab: 'ledger', subtitle: 'Ledger Section', keywords: 'bank sync bpi bdo unionbank gcash maya import csv link bank' },

  // SECTIONS - SOCIAL FAMILY SYNC
  { type: 'Section', name: 'Family Financial Goals & Progress', id: 'family-goals-section', targetTab: 'social', subtitle: 'Social Section', keywords: 'collaborative goals emergency fund tuition japan vacation target family' },
  { type: 'Section', name: 'Add New Family Goal Form', id: 'add-goal-section', targetTab: 'social', subtitle: 'Social Section', keywords: 'create goal target amount contribution new goal collaborative' },
  { type: 'Section', name: 'Household Outflow Contribution Breakdown', id: 'family-contribution-section', targetTab: 'social', subtitle: 'Social Section', keywords: 'family contributions member share outflow distribution household' },

  // SECTIONS - CYCLE AUDIT & HISTORY & SETTINGS
  { type: 'Section', name: 'Market Cycle Macroeconomic Analysis', id: 'cycle-audit-section', targetTab: 'audit', subtitle: 'Cycle Audit Section', keywords: 'macro risk economic cycle rebalance recommendation audit positioning' },
  { type: 'Section', name: 'System Audit Trail & Transaction Ledger', id: 'transaction-history-section', targetTab: 'transactions', subtitle: 'History Section', keywords: 'history audit trail system logs trades price updates events' },
  { type: 'Section', name: 'Profile & Identity Settings', id: 'settings-profile', targetTab: 'settings', subtitle: 'Settings Modal', keywords: 'email profile account settings identity user' },
  { type: 'Section', name: 'System Preferences & Dark Mode', id: 'settings-preferences', targetTab: 'settings', subtitle: 'Settings Modal', keywords: 'dark mode theme currency preferences accessibility accessibility' },
  { type: 'Section', name: 'Data Export Engine (Excel / JSON Backup)', id: 'settings-export', targetTab: 'settings', subtitle: 'Settings Modal', keywords: 'export excel download csv backup json restore data save' },
];

export default function SearchEngine({ assets, expenses, goals, budgets, transactions = [], cycleItems = [], onSelect }: SearchEngineProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Tabs' | 'Sections' | 'Data'>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const HighlightText = ({ text, query }: { text: string; query: string }) => {
    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-200 font-black px-0.5 rounded-sm">{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const allItems = useMemo(() => {
    const dynamicItems: SearchItem[] = [];

    assets.forEach(a => {
      dynamicItems.push({
        type: 'Asset',
        name: `${a.name} (${a.platform})`,
        id: a.key,
        targetTab: 'assets',
        subtitle: `Asset Sleeve • ₱${getAssetValuation(a).totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        keywords: `${a.class} ${a.name} ${a.platform} ${a.assetType}`
      });
    });

    expenses.forEach(e => {
      dynamicItems.push({
        type: 'Expense',
        name: e.description || e.category,
        id: e.id,
        targetTab: 'ledger',
        subtitle: `${e.category} • ₱${(e.amountPHP || 0).toLocaleString()} (${e.date})`,
        keywords: `${e.category} ${e.description} ${e.amountPHP}`
      });
    });

    goals.forEach(g => {
      dynamicItems.push({
        type: 'Goal',
        name: g.title,
        id: g.id,
        targetTab: 'social',
        subtitle: `Shared Goal • Target: ₱${(g.targetPHP || 0).toLocaleString()}`,
        keywords: `${g.title} ${g.deadline}`
      });
    });

    budgets.forEach(b => {
      dynamicItems.push({
        type: 'Category',
        name: `${b.category} Budget Limit`,
        id: `budget-${b.category}`,
        targetTab: 'ledger',
        subtitle: `Monthly Cap • ₱${(b.limitPHP || 0).toLocaleString()}`,
        keywords: `${b.category} budget limit threshold cap`
      });
    });

    transactions.forEach(t => {
      dynamicItems.push({
        type: 'Transaction',
        name: `${t.action} ${t.assetName}`,
        id: t.id,
        targetTab: 'history',
        subtitle: `Trade Record • ₱${(t.amountPHP || 0).toLocaleString()} (${t.date})`,
        keywords: `${t.action} ${t.assetName} ${t.notes} transaction trade history`
      });
    });

    cycleItems.forEach(c => {
      dynamicItems.push({
        type: 'CycleItem',
        name: `Market Audit: ${c.asset}`,
        id: c.id,
        targetTab: 'market',
        subtitle: `Cycle Phase: ${c.phase} • ${c.sentiment}`,
        keywords: `${c.asset} ${c.phase} ${c.sentiment} ${c.logic} cycle market audit`
      });
    });

    return [...STATIC_INDEX, ...dynamicItems];
  }, [assets, expenses, goals, budgets, transactions, cycleItems]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    
    let filtered = allItems;
    if (selectedCategory === 'Tabs') {
      filtered = filtered.filter(item => item.type === 'Tab');
    } else if (selectedCategory === 'Sections') {
      filtered = filtered.filter(item => item.type === 'Section');
    } else if (selectedCategory === 'Data') {
      filtered = filtered.filter(item => item.type !== 'Tab' && item.type !== 'Section');
    }

    if (!q) {
      // Return top suggested tabs & sections when empty
      return filtered.slice(0, 7);
    }

    return filtered.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchKey = item.keywords?.toLowerCase().includes(q);
      return matchName || matchSub || matchKey;
    }).slice(0, 10);
  }, [query, allItems, selectedCategory]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const res = results[selectedIndex || 0];
      if (res) {
        onSelect(res.type, res.id, res.targetTab);
        setIsOpen(false);
        setQuery('');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Tab': return <Layout className="w-4 h-4 text-blue-500" />;
      case 'Section': return <Compass className="w-4 h-4 text-purple-500" />;
      case 'Asset': return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'Expense': return <DollarSign className="w-4 h-4 text-rose-500" />;
      case 'Goal': return <Target className="w-4 h-4 text-amber-500" />;
      default: return <Tag className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-blue-500/50 transition-all shadow-2xs group w-48 sm:w-56 justify-between"
      >
        <div className="flex items-center space-x-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder="Search tabs, sections..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 truncate"
          />
        </div>
        <div className="hidden sm:flex items-center space-x-0.5 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 dark:text-slate-400 shrink-0 border border-slate-300/40 dark:border-white/5">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </div>
      
      {isOpen && (
        <div ref={dropdownRef} className="absolute top-full right-0 sm:left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 text-[11px] font-semibold text-slate-500">
            <div className="flex space-x-1">
              {(['All', 'Tabs', 'Sections', 'Data'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">↑↓ navigate</span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-1.5">
            {results.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No query results matching "<span className="font-bold text-slate-600 dark:text-slate-300">{query}</span>"
              </div>
            ) : (
              results.map((res, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button 
                    key={i} 
                    onClick={() => { onSelect(res.type, res.id, res.targetTab); setIsOpen(false); setQuery(''); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-500/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        {getIcon(res.type)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            <HighlightText text={res.name} query={query} />
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            res.type === 'Tab' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                            res.type === 'Section' ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400' :
                            'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {res.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                          <HighlightText text={res.subtitle} query={query} />
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-slate-400 shrink-0 ml-2">
                      {isSelected && <CornerDownLeft className="w-3 h-3 text-blue-500 animate-pulse" />}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">ESC</kbd> to close</span>
            <span>Pinpoint navigation & instant DOM highlight</span>
          </div>
        </div>
      )}
    </div>
  );
}

