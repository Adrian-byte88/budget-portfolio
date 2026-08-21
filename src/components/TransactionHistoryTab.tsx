import React, { useState, useMemo, useEffect } from 'react';
import { parseFormattedNumber } from '../utils/mathParser';
import { AssetPosition, ExpenseEntry, FamilyGoal } from '../types';
import {
  History,
  Plus,
  Download,
  Search,
  Filter,
  Calendar,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  X,
  ShieldCheck,
  Wallet,
  Target,
  Receipt,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Landmark
} from 'lucide-react';

export interface HistoricalTx {
  id: string;
  date: string;
  asset: string;
  type: string;
  amount: string;
  details: string;
}

export interface DeleteTxOptions {
  revertFinancials?: boolean;
  targetType?: 'asset' | 'goal' | 'expense' | 'account' | 'none';
  targetAssetKey?: string;
  targetGoalId?: string;
  adjustmentAmount?: number;
}

export interface DetectedTargetInfo {
  type: 'asset' | 'goal' | 'expense' | 'account' | 'none';
  name: string;
  assetKey?: string;
  goalId?: string;
  currentVal?: number;
  targetVal?: number;
  delta: number;
  projectedVal?: number;
  badgeLabel: string;
  description: string;
}

export function findMatchingAsset(txAsset: string, assets: AssetPosition[]): AssetPosition | undefined {
  if (!txAsset || !assets || assets.length === 0) return undefined;
  const clean = txAsset.toLowerCase().trim();

  // 1. Direct match on key or name
  let found = assets.find(a => a.key.toLowerCase() === clean || a.name.toLowerCase() === clean);
  if (found) return found;

  // 2. Specialized keyword mappings
  if (clean.includes('hys') || clean.includes('maya') || clean.includes('savings')) {
    found = assets.find(a => a.key.includes('hys') || a.name.toLowerCase().includes('hys') || a.name.toLowerCase().includes('maya'));
    if (found) return found;
  }
  if (clean.includes('gold') || clean.includes('pax')) {
    found = assets.find(a => a.key.includes('paxg') || a.name.toLowerCase().includes('gold'));
    if (found) return found;
  }
  if (clean.includes('btc') || clean.includes('bitcoin')) {
    found = assets.find(a => a.key.includes('btc') || a.name.toLowerCase().includes('bitcoin'));
    if (found) return found;
  }
  if (clean.includes('time deposit') || clean.includes('deposit')) {
    found = assets.find(a => a.name.toLowerCase().includes('time deposit') || a.key.includes('td') || a.key.includes('deposit'));
    if (found) return found;
  }
  if (clean.includes('bond') || clean.includes('t-bill') || clean.includes('tbill') || clean.includes('treasury')) {
    found = assets.find(a => a.key.includes('tbill') || a.name.toLowerCase().includes('bond') || a.name.toLowerCase().includes('treasury'));
    if (found) return found;
  }
  if (clean.includes('loan') || clean.includes('lend')) {
    found = assets.find(a => a.key.includes('loan') || a.name.toLowerCase().includes('loan'));
    if (found) return found;
  }
  if (clean.includes('cash') || clean.includes('reserve') || clean.includes('bank')) {
    found = assets.find(a => a.assetType === 'cash' || a.key.includes('cash'));
    if (found) return found;
  }
  if (clean.includes('income') || clean.includes('dragonfi') || clean.includes('stock') || clean.includes('reit') || clean.includes('equity') || clean.includes('fund')) {
    found = assets.find(a => a.assetType === 'equity' || a.name.toLowerCase().includes('dragonfi') || a.name.toLowerCase().includes('reit') || a.name.toLowerCase().includes('manulife'));
    if (found) return found;
  }

  // 3. Substring inclusion
  found = assets.find(a => a.name.toLowerCase().includes(clean) || clean.includes(a.name.toLowerCase()));
  if (found) return found;

  return undefined;
}

export function detectTransactionOrigin(
  tx: HistoricalTx,
  assets: AssetPosition[] = [],
  goals: FamilyGoal[] = [],
  _expenses: ExpenseEntry[] = []
): DetectedTargetInfo {
  const rawAmt = Math.abs(parseFormattedNumber(tx.amount));
  const isAddition =
    ['Buy', 'Deposit', 'Maturity', 'Lend'].includes(tx.type) ||
    tx.amount.startsWith('+') ||
    (!tx.amount.startsWith('-') && !['Sell', 'Withdraw', 'Liquidate'].includes(tx.type));
  const delta = isAddition ? -rawAmt : rawAmt;

  const cleanAsset = (tx.asset || '').toLowerCase();
  const cleanDetails = (tx.details || '').toLowerCase();

  // 1. Check if tied to a Family Goal
  if (goals && goals.length > 0) {
    const matchedGoal = goals.find((g) => {
      const gTitle = g.title.toLowerCase();
      return (
        cleanAsset.includes(gTitle) ||
        cleanDetails.includes(gTitle) ||
        (cleanAsset.includes('goal') && (cleanAsset.includes(g.id.toLowerCase()) || gTitle.includes(cleanAsset.replace('family goal:', '').trim())))
      );
    });

    if (matchedGoal) {
      const currentVal = matchedGoal.currentPHP || 0;
      const projectedVal = Math.max(0, currentVal + delta);
      return {
        type: 'goal',
        name: matchedGoal.title,
        goalId: matchedGoal.id,
        currentVal,
        targetVal: matchedGoal.targetPHP,
        delta,
        projectedVal,
        badgeLabel: 'Family Milestone Goal',
        description: isAddition
          ? `Money was credited to this goal and will be deducted from its current balance.`
          : `Money was withdrawn from this goal and will be refunded back.`
      };
    }
  }

  // 2. Check if tied to an Asset Position
  const matchedAsset = findMatchingAsset(tx.asset, assets);
  if (matchedAsset) {
    const isUnitPriced =
      (matchedAsset.currentPricePHP || 0) > 1 &&
      matchedAsset.assetType !== 'deposit' &&
      matchedAsset.assetType !== 'cash' &&
      matchedAsset.assetType !== 'hys';
    const currentVal = isUnitPriced
      ? (matchedAsset.units || 0) * (matchedAsset.currentPricePHP || 1)
      : (matchedAsset.costBasisPHP !== undefined && matchedAsset.costBasisPHP > 0 ? matchedAsset.costBasisPHP : (matchedAsset.units || 0) * (matchedAsset.currentPricePHP || 1));
    const projectedVal = Math.max(0, currentVal + delta);

    return {
      type: 'asset',
      name: matchedAsset.name,
      assetKey: matchedAsset.key,
      currentVal,
      delta,
      projectedVal,
      badgeLabel: matchedAsset.assetType ? `${matchedAsset.assetType.toUpperCase()} Asset` : 'Asset Position',
      description: isAddition
        ? `Money was added to this asset holding and will be subtracted from its balance.`
        : `Money was deducted/sold from this asset and will be restored to its balance.`
    };
  }

  // 3. Check if Expense
  if (cleanAsset.startsWith('expense:') || cleanAsset.includes('expense')) {
    const cat = tx.asset.replace(/^expense:\s*/i, '').trim() || 'Expense Outflow';
    return {
      type: 'expense',
      name: cat,
      delta,
      badgeLabel: 'Expense Outflow Ledger',
      description: `Reverses recorded expense outflow of ₱${rawAmt.toLocaleString()}.`
    };
  }

  // 4. Default / General Account
  return {
    type: 'account',
    name: tx.asset || 'Historical Account Ledger',
    delta,
    badgeLabel: 'Account Ledger Record',
    description: isAddition
      ? `Money added under "${tx.asset}" will be reversed by ₱${rawAmt.toLocaleString()}.`
      : `Money deducted under "${tx.asset}" will be credited back by ₱${rawAmt.toLocaleString()}.`
  };
}

export const INITIAL_HISTORICAL_TXS: HistoricalTx[] = [
  { id: 'h-1', date: '2025-12-29', asset: 'Time Deposit', type: 'Buy', amount: '₱60,000.00', details: 'Initial Placement (Accrued).' },
  { id: 'h-2', date: '2025-12-29', asset: 'PAX Gold', type: 'Buy', amount: '₱10,000.00', details: 'Initial commodity hedge.' },
  { id: 'h-3', date: '2025-12-30', asset: 'Bitcoin', type: 'Buy', amount: '₱10,000.00', details: 'Initial GCrypto entry.' },
  { id: 'h-4', date: '2026-02-24', asset: 'PAX Gold', type: 'Sell', amount: '-₱1,000.00', details: 'Tactical trim.' },
  { id: 'h-5', date: '2026-03-02', asset: 'PAX Gold', type: 'Sell', amount: '-₱1,000.00', details: 'Profit take.' },
  { id: 'h-6', date: '2026-03-03', asset: 'Manulife Asia Pacific REIT Fund of Funds', type: 'Buy', amount: '₱10,000.00', details: 'Asia-Pacific REIT Entry.' },
  { id: 'h-7', date: '2026-03-04', asset: 'Bond', type: 'Buy', amount: '₱25,000.00', details: 'Principal locked.' },
  { id: 'h-8', date: '2026-03-11', asset: 'PAX Gold', type: 'Buy', amount: '+₱12,000.00', details: 'Major scale-in.' },
  { id: 'h-9', date: '2026-04-08', asset: 'HYS Savings', type: 'Deposit', amount: '+₱1,000.00', details: 'Shield hardening.' },
  { id: 'h-10', date: '2026-04-10', asset: 'HYS Savings', type: 'Deposit', amount: '+₱30,000.00', details: 'Major liquidity injection.' },
  { id: 'h-11', date: '2026-04-14', asset: 'HYS Savings', type: 'Deposit', amount: '+₱10,000.00', details: 'Shield consolidation.' },
  { id: 'h-12', date: '2026-04-21', asset: 'Income Assets', type: 'Buy', amount: '₱7,493.07', details: 'DragonFi entry (RCR, SCC, SPC).' },
  { id: 'h-13', date: '2026-04-27', asset: 'BTC', type: 'Buy', amount: '+₱316.00', details: 'Micro-Sizing execution.' },
  { id: 'h-14', date: '2026-04-27', asset: 'PAX Gold', type: 'Buy', amount: '+₱633.00', details: 'Micro-Sizing execution.' },
  { id: 'h-15', date: '2026-04-28', asset: 'Strategy', type: 'Pivot', amount: 'Proportional 20%', details: 'Pivot to 80/20 Salary Funding model.' },
  { id: 'h-16', date: '2026-04-29', asset: 'HYS Savings', type: 'Deposit', amount: '+₱10,000.00', details: 'Independent liquidity addition.' },
  { id: 'h-17', date: '2026-05-17', asset: 'HYS Savings', type: 'Deposit', amount: '+₱43,000.00', details: 'Massive Shield Hardening Inflow (Cash).' },
  { id: 'h-18', date: '2026-05-30', asset: 'HYS Savings', type: 'Deposit', amount: '+₱11,000.00', details: 'Liquidity sync / surplus placement.' },
  { id: 'h-19', date: '2026-06-03', asset: 'Bond (June 3)', type: 'Liquidate', amount: '-₱25,350.00', details: 'Bond matured at yield ceiling. Full liquidation.' },
  { id: 'h-20', date: '2026-06-03', asset: 'HYS Savings', type: 'Transfer', amount: '+₱25,350.00', details: 'Matured bond proceeds.' },
  { id: 'h-21', date: '2026-06-03', asset: 'Time Deposit', type: 'Buy', amount: '-₱100,000.00', details: '6-Month Placement (6% p.a., matures Dec 3, 2026).' },
  { id: 'h-22', date: '2026-06-03', asset: 'HYS Savings', type: 'Withdraw', amount: '-₱100,000.00', details: 'Consolidated HYS capital transfer to Time Deposit.' },
  { id: 'h-23', date: '2026-06-09', asset: 'HYS Savings', type: 'Deposit', amount: '+₱8,500.00', details: 'Cash deposit; initial HYS rate change.' },
  { id: 'h-24', date: '2026-06-11', asset: 'HYS Savings', type: 'Withdraw', amount: '-₱10,000.00', details: 'Capital withdrawal for private loan.' },
  { id: 'h-25', date: '2026-06-11', asset: 'Personal Loan', type: 'Lend', amount: '+₱10,000.00', details: '1-Month cash loan to friend (5% fixed interest, matures Jul 11).' },
  { id: 'h-26', date: '2026-06-16', asset: 'HYS Savings', type: 'Deposit', amount: '+₱11,500.00', details: 'Cash deposit; HYS interest rate consolidated to 5% p.a.' },
  { id: 'h-27', date: '2026-06-21', asset: 'HYS Savings', type: 'Withdraw', amount: '-₱3,000.00', details: 'Capital withdrawal from savings reserves.' },
  { id: 'h-28', date: '2026-06-29', asset: 'Time Deposit', type: 'Maturity', amount: '+₱1,271.51', details: 'Dec 29 TD matured at 4.25% p.a. holding in matured pending status.' },
  { id: 'h-29', date: '2026-07-02', asset: 'HYS Savings', type: 'Deposit', amount: '+₱10,000.00', details: 'Salary-based cash injection; Safe Shield consolidation.' }
];

export interface TransactionHistoryTabProps {
  transactions?: HistoricalTx[];
  assets?: AssetPosition[];
  goals?: FamilyGoal[];
  expenses?: ExpenseEntry[];
  onAddTransaction?: (tx: Omit<HistoricalTx, 'id'>) => void;
  onDeleteTransaction?: (id: string, options?: DeleteTxOptions) => void;
  onResetTransactions?: () => void;
}

export default function TransactionHistoryTab({
  transactions: propTransactions,
  assets = [],
  goals = [],
  expenses = [],
  onAddTransaction,
  onDeleteTransaction,
  onResetTransactions,
}: TransactionHistoryTabProps = {}) {
  const [localTxs, setLocalTxs] = useState<HistoricalTx[]>(() => {
    const saved = localStorage.getItem('historical_transactions_registry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_HISTORICAL_TXS;
  });

  const txs = propTransactions !== undefined ? propTransactions : localTxs;

  useEffect(() => {
    if (!propTransactions) {
      localStorage.setItem('historical_transactions_registry', JSON.stringify(localTxs));
    }
  }, [localTxs, propTransactions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Form states for adding new transaction
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newAsset, setNewAsset] = useState('');
  const [newType, setNewType] = useState('Buy');
  const [newAmount, setNewAmount] = useState('');
  const [newDetails, setNewDetails] = useState('');

  // Delete Prompt Modal States
  const [pendingDeleteTx, setPendingDeleteTx] = useState<HistoricalTx | null>(null);
  const [revertOption, setRevertOption] = useState<'revert' | 'log_only'>('revert');
  const [showResetModal, setShowResetModal] = useState(false);

  // Detect target entity where money is added
  const pendingTarget = useMemo(() => {
    if (!pendingDeleteTx) return null;
    return detectTransactionOrigin(pendingDeleteTx, assets, goals, expenses);
  }, [pendingDeleteTx, assets, goals, expenses]);

  const filteredTxs = useMemo(() => {
    return txs.filter((tx) => {
      const matchSearch =
        tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.date.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = selectedType === 'All' || tx.type === selectedType;
      return matchSearch && matchType;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [txs, searchTerm, selectedType]);

  const txTypes = useMemo(() => {
    const types = new Set<string>();
    txs.forEach(t => {
      if (t.type) types.add(t.type);
    });
    return ['All', ...Array.from(types).sort()];
  }, [txs]);

  const totalItems = filteredTxs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedTxs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTxs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTxs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  const exportToCSV = () => {
    const headers = ['Date', 'Asset', 'Type', 'Amount', 'Details'];
    const rows = txs.map((tx) => [
      tx.date,
      tx.asset,
      tx.type,
      tx.amount,
      tx.details
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'historical_transaction_registry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newAsset || !newAmount || !newDetails) return;

    let formattedAmount = newAmount;
    const numericVal = parseFormattedNumber(newAmount);
    if (numericVal !== 0 || newAmount.trim() !== '') {
      const sign = numericVal > 0 && (newType === 'Deposit' || newType === 'Buy' || newType === 'Transfer' || newType === 'Maturity' || newType === 'Lend') ? '+' : '';
      formattedAmount = `${sign}₱${numericVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (onAddTransaction) {
      onAddTransaction({
        date: newDate,
        asset: newAsset,
        type: newType,
        amount: formattedAmount,
        details: newDetails
      });
    } else {
      const newTx: HistoricalTx = {
        id: `h-user-${Date.now()}`,
        date: newDate,
        asset: newAsset,
        type: newType,
        amount: formattedAmount,
        details: newDetails
      };
      setLocalTxs([newTx, ...localTxs]);
    }

    setNewAsset('');
    setNewAmount('');
    setNewDetails('');
    setIsAddingTx(false);
  };

  const initiateDeleteTx = (tx: HistoricalTx) => {
    setPendingDeleteTx(tx);
    setRevertOption('revert');
  };

  const confirmDeleteTx = () => {
    if (!pendingDeleteTx) return;

    const options: DeleteTxOptions = {
      revertFinancials: revertOption === 'revert',
      targetType: pendingTarget?.type,
      targetAssetKey: pendingTarget?.assetKey,
      targetGoalId: pendingTarget?.goalId,
      adjustmentAmount: Math.abs(parseFormattedNumber(pendingDeleteTx.amount))
    };

    if (onDeleteTransaction) {
      onDeleteTransaction(pendingDeleteTx.id, options);
    } else {
      setLocalTxs(localTxs.filter(tx => tx.id !== pendingDeleteTx.id));
    }

    setPendingDeleteTx(null);
  };

  const handleResetTxs = () => {
    setShowResetModal(true);
  };

  const confirmResetTxs = () => {
    if (onResetTransactions) {
      onResetTransactions();
    } else {
      setLocalTxs(INITIAL_HISTORICAL_TXS);
    }
    setShowResetModal(false);
  };

  const pendingAmountVal = useMemo(() => {
    if (!pendingDeleteTx) return 0;
    return Math.abs(parseFormattedNumber(pendingDeleteTx.amount));
  }, [pendingDeleteTx]);

  const isAdditionTx = useMemo(() => {
    if (!pendingDeleteTx) return false;
    return ['Buy', 'Deposit', 'Maturity', 'Lend'].includes(pendingDeleteTx.type) ||
      pendingDeleteTx.amount.startsWith('+') ||
      (!pendingDeleteTx.amount.startsWith('-') && !['Sell', 'Withdraw', 'Liquidate'].includes(pendingDeleteTx.type));
  }, [pendingDeleteTx]);

  return (
    <div id="transaction-history-section" data-highlight-id="transaction-history-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Historical Transaction Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full chronological ledger and audit log of all account deposits, transfers, purchases, sales, and maturity events
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddingTx(!isAddingTx)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Entry</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            title="Export registry to CSV file"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleResetTxs}
            className="px-3 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Reset registry to default records"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Collapsible Register Transaction Form */}
      {isAddingTx && (
        <form onSubmit={handleAddTx} className="p-6 bg-white dark:bg-slate-900 border border-blue-500/30 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-fade-in">
          <div className="space-y-1 md:col-span-1">
            <label htmlFor="tx-date-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="tx-date-input"
                name="tx_date"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1 md:col-span-1">
            <label htmlFor="tx-asset-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asset / Registry</label>
            <input
              id="tx-asset-input"
              name="tx_asset"
              type="text"
              required
              placeholder="e.g. HYS Savings"
              value={newAsset}
              onChange={(e) => setNewAsset(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label htmlFor="tx-type-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Type</label>
            <select
              id="tx-type-select"
              name="tx_type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="Buy">Buy 🟢</option>
              <option value="Sell">Sell 🔴</option>
              <option value="Deposit">Deposit 🟢</option>
              <option value="Withdraw">Withdraw 🔴</option>
              <option value="Transfer">Transfer 🔵</option>
              <option value="Maturity">Maturity 🟢</option>
              <option value="Pivot">Pivot 🟡</option>
              <option value="Lend">Lend 🔵</option>
              <option value="Liquidate">Liquidate 🔴</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-1">
            <label htmlFor="tx-amount-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount</label>
            <input
              id="tx-amount-input"
              name="tx_amount"
              type="text"
              required
              placeholder="e.g. 10000 or Proportional 20%"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden font-mono text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label htmlFor="tx-details-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Details / Notes</label>
            <input
              id="tx-details-input"
              name="tx_details"
              type="text"
              required
              placeholder="e.g. Salary-based cash injection"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="md:col-span-5 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTx(false)}
              className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Registry Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xs">
        {/* Filter & Search Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="tx-search-filter-input"
              name="tx_search_filter"
              type="text"
              placeholder="Search assets, details, dates..."
              aria-label="Search transaction history"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-2">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {txTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                <th className="py-4 pl-6 w-36">Date</th>
                <th className="py-4 w-48">Asset / Registry</th>
                <th className="py-4 w-32">Type</th>
                <th className="py-4 text-right w-40">Amount</th>
                <th className="py-4 pr-6">Details & Institutional Purpose</th>
                <th className="py-4 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
              {paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions matching search parameters found.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx) => {
                  let typeStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                  if (['Buy', 'Deposit', 'Maturity'].includes(tx.type)) {
                    typeStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
                  } else if (['Sell', 'Withdraw', 'Liquidate'].includes(tx.type)) {
                    typeStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
                  } else if (['Transfer', 'Lend'].includes(tx.type)) {
                    typeStyle = 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
                  } else if (['Pivot'].includes(tx.type)) {
                    typeStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
                  }

                  const isPositive = tx.amount.startsWith('+') || (!tx.amount.startsWith('-') && !tx.amount.includes('Proportional') && !['Sell', 'Withdraw', 'Liquidate'].includes(tx.type));
                  const isNeutral = tx.amount.includes('Proportional');
                  const amountColor = isNeutral
                    ? 'text-slate-600 dark:text-slate-300'
                    : isPositive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-rose-600 dark:text-rose-400 font-bold';

                  const displayDate = (() => {
                    try {
                      const d = new Date(tx.date);
                      if (isNaN(d.getTime())) return tx.date;
                      return d.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    } catch (e) {
                      return tx.date;
                    }
                  })();

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 pl-6 font-mono text-slate-500 dark:text-slate-400">
                        {displayDate}
                      </td>
                      <td className="py-4 font-bold text-slate-900 dark:text-white">
                        {tx.asset}
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${typeStyle}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-mono ${amountColor}`}>
                        {tx.amount}
                      </td>
                      <td className="py-4 pr-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tx.details}
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => initiateDeleteTx(tx)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                          title="Delete transaction record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> transactions
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
              >
                Previous
              </button>
              <span className="font-mono text-slate-600 dark:text-slate-300 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POP-UP CONFIRMATION MODAL: DELETE TRANSACTION & REVERT BALANCE IMPACT */}
      {pendingDeleteTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-slate-900 dark:text-white my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Transaction
                </h3>
              </div>
              <button
                onClick={() => setPendingDeleteTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3">
              {/* Compact Transaction summary row */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {pendingDeleteTx.asset}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {pendingDeleteTx.date} • <span className="uppercase font-semibold">{pendingDeleteTx.type}</span>
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {pendingDeleteTx.amount}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 text-xs">
                <label
                  onClick={() => setRevertOption('revert')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    revertOption === 'revert'
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-slate-100'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="revert_choice"
                    checked={revertOption === 'revert'}
                    onChange={() => setRevertOption('revert')}
                    className="text-amber-600 focus:ring-amber-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[11px] flex items-center justify-between">
                      <span className="truncate">Revert balance on {pendingTarget?.name || pendingDeleteTx.asset}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                        {pendingTarget && pendingTarget.delta < 0 ? `-₱${Math.abs(pendingTarget.delta).toLocaleString()}` : `+₱${Math.abs(pendingAmountVal).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {pendingTarget?.delta && pendingTarget.delta < 0 ? 'Deducts' : 'Refunds'} money from where it was added
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setRevertOption('log_only')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    revertOption === 'log_only'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="revert_choice"
                    checked={revertOption === 'log_only'}
                    onChange={() => setRevertOption('log_only')}
                    className="text-slate-600 focus:ring-slate-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[11px]">Delete log entry only</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Keep current balances unchanged</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTx(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTx}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP CONFIRMATION MODAL: RESET DEFAULTS */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center space-x-3.5 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="p-3 bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-xl">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Reset Transaction Registry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Restore default historical transaction entries
                </p>
              </div>
            </div>
            <div className="p-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                Are you sure you want to reset the transaction registry to default historical records? All custom entries will be replaced with institutional templates.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl flex items-center space-x-2 text-blue-700 dark:text-blue-300 text-[11px]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500" />
                <span>This action can also be reversed anytime using <strong>Ctrl+Z</strong>.</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetTxs}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
