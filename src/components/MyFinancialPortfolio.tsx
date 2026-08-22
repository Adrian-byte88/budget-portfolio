import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { AssetPosition, MarketAlert } from '../types';
import { AIPopupModal } from './AIPopupModal';
import { getAssetValuation, formatTimeAgo } from '../lib/formatters';
import SmartCalculatorInput from './SmartCalculatorInput';
import { parseFormattedNumber } from '../utils/mathParser';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Percent,
  TrendingDown,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity,
  Coins,
  History,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Calendar,
  Check,
  Edit2,
  Save,
  RotateCcw,
  Sliders,
  Bell
} from 'lucide-react';

interface HistoricalTx {
  id: string;
  date: string;
  asset: string;
  type: string;
  amount: string;
  details: string;
}

const INITIAL_HISTORICAL_TXS: HistoricalTx[] = [];

interface CycleItem {
  id: string;
  asset: string;
  phase: string;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  logic: string;
}

const INITIAL_CYCLE_ITEMS: CycleItem[] = [];

interface DeploymentPlanItem {
  id: string;
  date: string;
  asset: string;
  amount: string;
  status: 'PROCEED' | 'ABORT' | 'HOLD';
  description: string;
}

const INITIAL_DEPLOYMENT_ITEMS: DeploymentPlanItem[] = [];

interface DevaluationItem {
  id: string;
  indicator: string;
  marketRef: string;
  portfolioExposure: string;
  hedgeStatus: string;
  statusType: 'SECURE' | 'UNDER-YIELDING' | 'CRITICAL' | 'NEUTRAL';
}

const INITIAL_DEVALUATION_ITEMS: DevaluationItem[] = [];

interface AuditChangeItem {
  id: string;
  title: string;
  description: string;
}

const INITIAL_AUDIT_CHANGES: AuditChangeItem[] = [];

interface MyFinancialPortfolioProps {
  assets: AssetPosition[];
  usdPhpRate: number;
  targetAllocation?: number;
  onUpdateTargetAllocation?: (target: number) => void;
  cycleItems?: CycleItem[];
  onUpdateCycleItems?: (items: CycleItem[]) => void;
  devaluationItems?: DevaluationItem[];
  onUpdateDevaluationItems?: (items: DevaluationItem[]) => void;
  devaluationTactics?: string;
  onUpdateDevaluationTactics?: (tactics: string) => void;
  auditChanges?: AuditChangeItem[];
  onUpdateAuditChanges?: (changes: AuditChangeItem[]) => void;
  deploymentItems?: DeploymentPlanItem[];
  onUpdateDeploymentItems?: (items: DeploymentPlanItem[]) => void;
  budgetCap?: string;
  onUpdateBudgetCap?: (cap: string) => void;
  onTriggerPopupModal?: (type: 'quota' | 'search_grounding', title?: string, message?: string) => void;
  transactions?: HistoricalTx[];
  onAddTransaction?: (tx: Omit<HistoricalTx, 'id'>) => void;
  onDeleteTransaction?: (id: string, options?: any) => void;
  onResetTransactions?: () => void;
}

export default function MyFinancialPortfolio({
  assets,
  usdPhpRate,
  targetAllocation = 85,
  onUpdateTargetAllocation,
  cycleItems: propCycleItems,
  onUpdateCycleItems,
  devaluationItems: propDevaluationItems,
  onUpdateDevaluationItems,
  devaluationTactics: propDevaluationTactics,
  onUpdateDevaluationTactics,
  auditChanges: propAuditChanges,
  onUpdateAuditChanges,
  deploymentItems: propDeploymentItems,
  onUpdateDeploymentItems,
  budgetCap: propBudgetCap,
  onUpdateBudgetCap,
  onTriggerPopupModal,
  transactions: propTransactions,
  onAddTransaction,
  onDeleteTransaction,
  onResetTransactions,
}: MyFinancialPortfolioProps) {
  // --- AI AND LOCAL TOAST STATES ---
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [popupState, setPopupState] = useState<{ isOpen: boolean; type: 'quota' | 'search_grounding' | null; title?: string; message?: string }>({
    isOpen: false,
    type: null,
  });

  const triggerLocalToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 4000);
  };

  const handleAISentimentUpdate = async () => {
    setIsUpdatingAI(true);
    triggerLocalToast('Initiating Google Search Grounding...', 'info');
    try {
      const response = await fetch('/api/portfolio/ai-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        triggerLocalToast('AI Sentiment: Live static market mode active.', 'info');
        setIsUpdatingAI(false);
        return;
      }
      const data = await response.json();

      if (data.quotaExceeded) {
        if (onTriggerPopupModal) {
          onTriggerPopupModal(
            'quota',
            'Gemini API Quota Limit Reached',
            'Portfolio sentiment models hit request rate limits. The application seamlessly engaged cached offline market models.'
          );
        } else {
          setPopupState({
            isOpen: true,
            type: 'quota',
            title: 'Gemini API Quota Limit Reached',
            message: 'Portfolio sentiment models hit request rate limits. The application seamlessly engaged cached offline market models.'
          });
        }
        triggerLocalToast('⚠️ Quota Limit Reached: Loaded offline sentiment models.', 'error');
      } else if (data.searchGroundingSuccess || data.source === 'gemini_search_grounding' || data.source === 'realtime_internet_sync') {
        if (onTriggerPopupModal) {
          onTriggerPopupModal(
            'search_grounding',
            'Live Market Sync Successful',
            'Successfully synchronized live asset prices and Philippine financial indicators!'
          );
        } else {
          setPopupState({
            isOpen: true,
            type: 'search_grounding',
            title: 'Live Market Sync Successful',
            message: 'Successfully synchronized live asset prices and Philippine financial indicators!'
          });
        }
        triggerLocalToast('✨ Portfolio market metrics updated!', 'success');
      }

      if (data.success) {
        if (data.cycleItems) setCycleItems(data.cycleItems);
        if (data.devaluationItems) setDevaluationItems(data.devaluationItems);
        if (data.deploymentItems) setDeploymentItems(data.deploymentItems);
        if (data.auditChanges) setAuditChanges(data.auditChanges);
      } else {
        triggerLocalToast(`⚠️ Update failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (e: any) {
      triggerLocalToast(`⚠️ Error: ${e.message}`, 'error');
    } finally {
      setIsUpdatingAI(false);
    }
  };

  // --- HISTORICAL TRANSACTION REGISTRY STATES ---
  const [localTxs, setLocalTxs] = useState<HistoricalTx[]>(() => {
    const saved = localStorage.getItem('historical_transactions_registry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore and fallback
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

  // --- RISK SLEEVE SUB-ALLOCATION TARGETS STATE ---
  const [targetCryptoGoldOfTotal, setTargetCryptoGoldOfTotal] = useState<number>(() => {
    const saved = localStorage.getItem('portfolio_target_crypto_gold');
    return saved ? parseFloat(saved) : 9.38;
  });
  const [targetReitOfTotal, setTargetReitOfTotal] = useState<number>(() => {
    const saved = localStorage.getItem('portfolio_target_reit');
    return saved ? parseFloat(saved) : 3.75;
  });
  const [targetStockOfTotal, setTargetStockOfTotal] = useState<number>(() => {
    const saved = localStorage.getItem('portfolio_target_stock');
    return saved ? parseFloat(saved) : 1.87;
  });
  const [isEditingRiskSleeveTargets, setIsEditingRiskSleeveTargets] = useState<boolean>(false);

  const handleSaveRiskSleeveTargets = () => {
    localStorage.setItem('portfolio_target_crypto_gold', targetCryptoGoldOfTotal.toString());
    localStorage.setItem('portfolio_target_reit', targetReitOfTotal.toString());
    localStorage.setItem('portfolio_target_stock', targetStockOfTotal.toString());
    setIsEditingRiskSleeveTargets(false);
    if (onTriggerPopupModal) {
      onTriggerPopupModal('search_grounding', 'Risk Sleeve Targets Saved', 'Sub-allocation target percentages have been saved.');
    }
  };

  // --- 4. CYCLE ITEMS STATE ---
  const [localCycleItems, setLocalCycleItems] = useState<CycleItem[]>(() => {
    const saved = localStorage.getItem('portfolio_cycle_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_CYCLE_ITEMS;
  });
  const cycleItems = (propCycleItems && propCycleItems.length > 0) ? propCycleItems : localCycleItems;
  const [isEditingCycle, setIsEditingCycle] = useState(false);

  const setCycleItems = (val: CycleItem[] | ((prev: CycleItem[]) => CycleItem[])) => {
    const next = typeof val === 'function' ? val(cycleItems) : val;
    localStorage.setItem('portfolio_cycle_items', JSON.stringify(next));
    setLocalCycleItems(next);
    onUpdateCycleItems?.(next);
  };

  // --- 5. DEPLOYMENT PLAN STATE ---
  const [localDeploymentItems, setLocalDeploymentItems] = useState<DeploymentPlanItem[]>(() => {
    const saved = localStorage.getItem('portfolio_deployment_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_DEPLOYMENT_ITEMS;
  });
  const deploymentItems = (propDeploymentItems && propDeploymentItems.length > 0) ? propDeploymentItems : localDeploymentItems;

  const [localBudgetCap, setLocalBudgetCap] = useState(() => {
    return localStorage.getItem('portfolio_budget_cap') || '';
  });
  const budgetCap = propBudgetCap || localBudgetCap;
  const [isEditingDeployment, setIsEditingDeployment] = useState(false);

  const setDeploymentItems = (val: DeploymentPlanItem[] | ((prev: DeploymentPlanItem[]) => DeploymentPlanItem[])) => {
    const next = typeof val === 'function' ? val(deploymentItems) : val;
    localStorage.setItem('portfolio_deployment_items', JSON.stringify(next));
    setLocalDeploymentItems(next);
    onUpdateDeploymentItems?.(next);
  };

  const setBudgetCap = (val: string | ((prev: string) => string)) => {
    const next = typeof val === 'function' ? val(budgetCap) : val;
    localStorage.setItem('portfolio_budget_cap', next);
    setLocalBudgetCap(next);
    onUpdateBudgetCap?.(next);
  };

  // --- 7. CURRENCY DEVALUATION STATE ---
  const [localDevaluationItems, setLocalDevaluationItems] = useState<DevaluationItem[]>(() => {
    const saved = localStorage.getItem('portfolio_devaluation_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4 && !JSON.stringify(parsed).includes('61.62') && !JSON.stringify(parsed).includes('61.42')) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_DEVALUATION_ITEMS;
  });
  const devaluationItems = propDevaluationItems !== undefined ? propDevaluationItems : localDevaluationItems;

  const [localDevaluationTactics, setLocalDevaluationTactics] = useState(() => {
    return localStorage.getItem('portfolio_devaluation_tactics') || '';
  });
  const devaluationTactics = propDevaluationTactics !== undefined ? propDevaluationTactics : localDevaluationTactics;
  const [isEditingDevaluation, setIsEditingDevaluation] = useState(false);

  const setDevaluationItems = (val: DevaluationItem[] | ((prev: DevaluationItem[]) => DevaluationItem[])) => {
    const next = typeof val === 'function' ? val(devaluationItems) : val;
    localStorage.setItem('portfolio_devaluation_items', JSON.stringify(next));
    setLocalDevaluationItems(next);
    onUpdateDevaluationItems?.(next);
  };

  const setDevaluationTactics = (val: string | ((prev: string) => string)) => {
    const next = typeof val === 'function' ? val(devaluationTactics) : val;
    localStorage.setItem('portfolio_devaluation_tactics', next);
    setLocalDevaluationTactics(next);
    onUpdateDevaluationTactics?.(next);
  };

  // --- 9. WHAT CHANGED SINCE LAST AUDIT STATE ---
  const [localAuditChanges, setLocalAuditChanges] = useState<AuditChangeItem[]>(() => {
    const saved = localStorage.getItem('portfolio_audit_changes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_AUDIT_CHANGES;
  });
  const auditChanges = propAuditChanges !== undefined ? propAuditChanges : localAuditChanges;
  const [isEditingAudit, setIsEditingAudit] = useState(false);

  const setAuditChanges = (val: AuditChangeItem[] | ((prev: AuditChangeItem[]) => AuditChangeItem[])) => {
    const next = typeof val === 'function' ? val(auditChanges) : val;
    localStorage.setItem('portfolio_audit_changes', JSON.stringify(next));
    setLocalAuditChanges(next);
    onUpdateAuditChanges?.(next);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form states for adding new transaction
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [monthlyLivingExpensesInput, setMonthlyLivingExpensesInput] = useState<string>(() => {
    const saved = localStorage.getItem('monthly_living_expenses');
    return saved || '0';
  });

  const monthlyLivingExpenses = parseFormattedNumber(monthlyLivingExpensesInput) > 0 ? parseFormattedNumber(monthlyLivingExpensesInput) : 0;

  useEffect(() => {
    localStorage.setItem('monthly_living_expenses', monthlyLivingExpensesInput);
  }, [monthlyLivingExpensesInput]);
  const [newDate, setNewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newAsset, setNewAsset] = useState('');
  const [newType, setNewType] = useState('Buy');
  const [newAmount, setNewAmount] = useState('');
  const [newDetails, setNewDetails] = useState('');

  // --- HISTORICAL TRANSACTION REGISTRY LOGIC ---
  const filteredTxs = useMemo(() => {
    return txs.filter((tx) => {
      const matchSearch =
        tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.date.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = selectedType === 'All' || tx.type === selectedType;
      return matchSearch && matchType;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending by default
  }, [txs, searchTerm, selectedType]);

  // Unique types of transactions for filters
  const txTypes = useMemo(() => {
    const types = new Set<string>();
    txs.forEach(t => {
      if (t.type) types.add(t.type);
    });
    return ['All', ...Array.from(types).sort()];
  }, [txs]);

  // Pagination Math
  const totalItems = filteredTxs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTxs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTxs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTxs, currentPage, itemsPerPage]);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, itemsPerPage]);

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

    // Helper to format currency amount cleanly if entered as a raw number
    let formattedAmount = newAmount;
    if (!isNaN(Number(newAmount.replace(/[^0-9.-]/g, '')))) {
      const numericVal = Number(newAmount.replace(/[^0-9.-]/g, ''));
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

  const handleDeleteTx = (id: string) => {
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
    } else {
      setLocalTxs(localTxs.filter(tx => tx.id !== id));
    }
  };

  const handleResetTxs = () => {
    if (window.confirm('Are you sure you want to reset to default historical transactions?')) {
      if (onResetTransactions) {
        onResetTransactions();
      } else {
        setLocalTxs(INITIAL_HISTORICAL_TXS);
      }
    }
  };

  // 1. DYNAMIC ASSET COMPILATIONS
  // Safe Shield (Savings + TDs + Loans)
  const safeAssets = assets.filter((a) => a.class === 'safe');
  const totalSafeShield = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  // Risk Sleeve (Crypto, Stocks, REITs)
  const riskAssets = assets.filter((a) => a.class === 'risk');
  const totalRiskSleeve = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  // Physical Assets (Honda Bike, Macbook Air, etc.)
  const physicalAssets = assets.filter((a) => a.class === 'physical');
  const totalPhysical = physicalAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  // Liabilities (Mortgages, Auto Loans, Personal Loans)
  const liabilityAssets = assets.filter((a) => a.class === 'liability');
  const totalLiabilities = liabilityAssets.reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);

  // Total Assets
  const totalAssets = totalSafeShield + totalRiskSleeve + totalPhysical;

  // Real-time calculated Net Worth
  const netWorth = totalAssets - totalLiabilities;

  // Core Financial Portfolio excludes Physical Assets for Allocation Calculations (as shown in image where Portfolio = Safe Shield + Risk Sleeve)
  const totalPortfolioValue = totalSafeShield + totalRiskSleeve;

  // Percentage Weights
  const safeWeight = totalPortfolioValue > 0 ? (totalSafeShield / totalPortfolioValue) * 100 : 0;
  const riskWeight = totalPortfolioValue > 0 ? (totalRiskSleeve / totalPortfolioValue) * 100 : 0;

  const targetSafe = targetAllocation;
  const targetRisk = 100 - targetSafe;

  // Status Labels
  const safeStatus = safeWeight < targetSafe ? 'UNDERWEIGHT' : 'ALIGNED';
  const riskStatus = riskWeight > targetRisk ? 'OVERWEIGHT' : 'ALIGNED';

  // 2. RISK SLEEVE PILLARS SUB-ALLOCATIONS
  // Pillar 1: Crypto/Gold (BTC + PAXG)
  const cryptoGoldAssets = riskAssets.filter(
    (a) => a.assetType === 'crypto' || a.assetType === 'commodity' || a.key === 'btc' || a.key === 'paxg'
  );
  const cryptoGoldValue = cryptoGoldAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const cryptoGoldWeightOfTotal = totalPortfolioValue > 0 ? (cryptoGoldValue / totalPortfolioValue) * 100 : 0;
  const cryptoGoldStatus = cryptoGoldWeightOfTotal > targetCryptoGoldOfTotal + 0.05
    ? 'OVERWEIGHT'
    : cryptoGoldWeightOfTotal < targetCryptoGoldOfTotal - 0.05
    ? 'UNDERWEIGHT'
    : 'ALIGNED';

  // Pillar 2: REITs (Manulife + RCR)
  const reitAssets = riskAssets.filter(
    (a) => a.key === 'manulife' || a.key === 'rcr' || a.name.toLowerCase().includes('reit')
  );
  const reitValue = reitAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const reitWeightOfTotal = totalPortfolioValue > 0 ? (reitValue / totalPortfolioValue) * 100 : 0;
  const reitStatus = reitWeightOfTotal > targetReitOfTotal + 0.05
    ? 'OVERWEIGHT'
    : reitWeightOfTotal < targetReitOfTotal - 0.05
    ? 'UNDERWEIGHT'
    : 'ALIGNED';

  // Pillar 3: Stocks (SCC + SPC)
  const stockAssets = riskAssets.filter(
    (a) => (a.assetType === 'equity' || a.key === 'scc' || a.key === 'spc') && !reitAssets.some((r) => r.key === a.key)
  );
  const stockValue = stockAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const stockWeightOfTotal = totalPortfolioValue > 0 ? (stockValue / totalPortfolioValue) * 100 : 0;
  const stockStatus = stockWeightOfTotal > targetStockOfTotal + 0.05
    ? 'OVERWEIGHT'
    : stockWeightOfTotal < targetStockOfTotal - 0.05
    ? 'UNDERWEIGHT'
    : 'ALIGNED';

  // Total Safe Shield Protection Gains & Yield Math
  const totalSafeCostBasis = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
  const totalSafeGainsLoss = safeAssets.reduce((sum, a) => sum + getAssetValuation(a).interestEarned, 0);
  const totalSafeGainsLossPct = totalSafeCostBasis > 0 ? (totalSafeGainsLoss / totalSafeCostBasis) * 100 : 0;

  // Total Risk Sleeve Gains & Losses Math
  const totalRiskCostBasis = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).principal, 0);
  const totalRiskGainsLoss = riskAssets.reduce((sum, a) => sum + getAssetValuation(a).interestEarned, 0);
  const totalRiskGainsLossPct = totalRiskCostBasis > 0 ? (totalRiskGainsLoss / totalRiskCostBasis) * 100 : 0;

  // Combined Total Overall Gain / Loss Math (Safe Shield + Risk Sleeve)
  const totalOverallCostBasis = totalSafeCostBasis + totalRiskCostBasis;
  const totalOverallValuation = totalSafeShield + totalRiskSleeve;
  const totalOverallGainsLoss = totalSafeGainsLoss + totalRiskGainsLoss;
  const totalOverallGainsLossPct = totalOverallCostBasis > 0 ? (totalOverallGainsLoss / totalOverallCostBasis) * 100 : 0;

  // 3. SALARY DILUTION & EMERGENCY SAFEGUARD MATH AUDIT
  const targetPortfolioSize = targetRisk > 0 ? totalRiskSleeve / (targetRisk / 100) : 0;
  const targetSafeShieldValue = targetPortfolioSize * (targetSafe / 100);
  const institutionalFundingGap = Math.max(0, targetSafeShieldValue - totalSafeShield);

  // Emergency Safeguard Buffer Math (Personal Emergency Fund standpoint)
  const emergencyBuffer3Months = monthlyLivingExpenses * 3;
  const emergencyBuffer6Months = monthlyLivingExpenses * 6;
  const emergencyRunwayMonths = monthlyLivingExpenses > 0 ? totalSafeShield / monthlyLivingExpenses : 0;
  const emergencyBufferSurplus = totalSafeShield - emergencyBuffer6Months;
  const isEmergencyBufferFunded = totalSafeShield >= emergencyBuffer6Months;
  const emergencyCoveragePct = emergencyBuffer6Months > 0 ? (totalSafeShield / emergencyBuffer6Months) * 100 : 0;

  // 4. SECTOR ALLOCATION & DIVERSIFICATION DATA
  // Fixed Income / Cash, Commodities (Gold), Real Estate (REITs), Digital Assets, Energy / Utilities
  const sectorData = [
    {
      sector: 'Fixed Income / Cash',
      currentValue: totalSafeShield,
      portfolioPct: safeWeight,
      riskRating: 'Low',
      color: '#3b82f6', // blue
    },
    {
      sector: 'Commodities (Gold)',
      currentValue: assets.filter((a) => a.key === 'paxg' || a.assetType === 'commodity').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0),
      portfolioPct: totalPortfolioValue > 0 ? (assets.filter((a) => a.key === 'paxg' || a.assetType === 'commodity').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0) / totalPortfolioValue) * 100 : 0,
      riskRating: 'Moderate',
      color: '#eab308', // gold/yellow
    },
    {
      sector: 'Real Estate (REITs)',
      currentValue: reitValue,
      portfolioPct: reitWeightOfTotal,
      riskRating: 'Moderate',
      color: '#10b981', // emerald
    },
    {
      sector: 'Digital Assets',
      currentValue: assets.filter((a) => a.key === 'btc' || a.assetType === 'crypto').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0),
      portfolioPct: totalPortfolioValue > 0 ? (assets.filter((a) => a.key === 'btc' || a.assetType === 'crypto').reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0) / totalPortfolioValue) * 100 : 0,
      riskRating: 'High',
      color: '#6366f1', // indigo
    },
    {
      sector: 'Energy / Utilities',
      currentValue: stockValue,
      portfolioPct: stockWeightOfTotal,
      riskRating: 'Moderate',
      color: '#f97316', // orange
    },
  ];

  const pieChartData = sectorData.map((s) => ({
    name: s.sector,
    value: Number(s.currentValue.toFixed(2)),
  }));

  // Months to close gap at ₱20,000 net monthly surplus
  const monthlySurplusRate = 20000;
  const monthsToCloseGap = monthlySurplusRate > 0 ? (institutionalFundingGap / monthlySurplusRate) : 0;

  // Active risk freeze status
  const isRiskFreezeActive = safeWeight < targetSafe;

  return (
    <div className="space-y-10 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Portfolio Top Bar Alert/Status */}
      <div id="portfolio-allocation-section" data-highlight-id="portfolio-allocation-section" className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isRiskFreezeActive
          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-500/20 text-amber-900 dark:text-amber-400'
          : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-400'
      }`}>
        <div className="flex items-start space-x-3.5">
          {isRiskFreezeActive ? (
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span>Risk Management Status:</span>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                isRiskFreezeActive ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}>
                {isRiskFreezeActive ? '⚠️ RISK FREEZE ACTIVE' : '🛡️ PORTFOLIO SECURED'}
              </span>
            </h4>
            <p className="text-xs mt-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
              {isRiskFreezeActive
                ? `Safe Shield ratio (${safeWeight.toFixed(2)}%) is below the requested 85.00% target floor. Direct 100% of incoming cash flows to Safe Shield cash registries.`
                : 'Your portfolio' + "'s" + ' defensive Safe Shield matches or exceeds the 85.00% target parameters.'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 w-full sm:w-auto">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg text-center sm:text-right">
            <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest">Funding Gap</span>
            <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
              ₱{institutionalFundingGap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Target Allocation Adjuster / Calibrator */}
      <div id="safety-calibrator-section" data-highlight-id="safety-calibrator-section" className="w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-teal-400" />
              <span>Safety Threshold & Asset Weights Calibrator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
              Dynamically calibrate your personal safety margin threshold standard. Target allocations prevent excessive leverage in speculative cryptocurrency or real estate sleeve asset indices.
            </p>
          </div>

          <div className="space-y-6 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-100 dark:border-white/5">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Safe Shield protection standard target (%)</span>
                <div className="w-full sm:w-48 shrink-0">
                  <SmartCalculatorInput
                    label=""
                    value={targetAllocation.toString()}
                    onChange={(val) => {
                      const num = parseFormattedNumber(val);
                      if (!isNaN(num) && onUpdateTargetAllocation) {
                        onUpdateTargetAllocation(Math.min(95, Math.max(50, num)));
                      }
                    }}
                    currencySymbol=""
                    placeholder="85"
                  />
                </div>
              </div>
              <input
                id="my-portfolio-target-allocation-slider"
                name="my_portfolio_target_allocation"
                type="range"
                min="50"
                max="95"
                value={targetAllocation}
                onChange={(e) => onUpdateTargetAllocation && onUpdateTargetAllocation(Number(e.target.value))}
                aria-label="Target allocation percentage slider"
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none transition-colors"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
              <span>Conservative Minimum (50%)</span>
              <span>Speculative Maximum (95%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* OVERALL GAIN / LOSS PERFORMANCE SUMMARY (SAFE SHIELD + RISK SLEEVE) */}
      <div id="overall-performance-section" className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl border border-slate-200 dark:border-indigo-500/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-indigo-500/20 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full">
                Combined Portfolio Performance Engine
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Overall Gain & Loss: Safe Shield Protection + Risk Sleeve Growth</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-indigo-200/70 mt-1">
              Consolidated calculation using live valuations across Total Safe Shield Protection & Total Risk Sleeve Growth
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 px-5 text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-indigo-200/60 uppercase tracking-widest block">Total Net Portfolio Gain / Loss</span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-0.5 ${
              totalOverallGainsLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalOverallGainsLoss >= 0 ? '+' : ''}₱{totalOverallGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-bold ml-2">
                ({totalOverallGainsLossPct >= 0 ? '+' : ''}{totalOverallGainsLossPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Safe Shield Protection */}
          <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/40 rounded-xl p-5 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. Safe Shield Protection</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-indigo-200/60 font-bold">{safeAssets.length} Assets</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Principal (Cost):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₱{totalSafeCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Safe Valuation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₱{totalSafeShield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80 dark:border-white/10">
                <span className="font-bold text-slate-800 dark:text-slate-200">Safe Shield Interest Yield:</span>
                <span className={`font-mono font-black ${
                  totalSafeGainsLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {totalSafeGainsLoss >= 0 ? '+' : ''}₱{totalSafeGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] ml-1">({totalSafeGainsLossPct >= 0 ? '+' : ''}{totalSafeGainsLossPct.toFixed(2)}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Risk Sleeve Growth */}
          <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/40 rounded-xl p-5 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>2. Risk Sleeve Growth</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-indigo-200/60 font-bold">{riskAssets.length} Assets</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Cost Basis:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₱{totalRiskCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Risk Valuation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₱{totalRiskSleeve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80 dark:border-white/10">
                <span className="font-bold text-slate-800 dark:text-slate-200">Risk Sleeve Net Gain / Loss:</span>
                <span className={`font-mono font-black ${
                  totalRiskGainsLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {totalRiskGainsLoss >= 0 ? '+' : ''}₱{totalRiskGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] ml-1">({totalRiskGainsLossPct >= 0 ? '+' : ''}{totalRiskGainsLossPct.toFixed(2)}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Total Overall Combined */}
          <div className="bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-5 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Combined Total Portfolio</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-300/80 font-bold">Safe + Risk</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-500/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Combined Cost Basis:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₱{totalOverallCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300">Combined Valuation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₱{totalOverallValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200 dark:border-emerald-500/20">
                <span className="font-bold text-slate-900 dark:text-white">Overall Portfolio Gain / Loss:</span>
                <span className={`font-mono font-black text-sm text-right ${
                  totalOverallGainsLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {totalOverallGainsLoss >= 0 ? '+' : ''}₱{totalOverallGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-bold block">
                    ({totalOverallGainsLossPct >= 0 ? '+' : ''}{totalOverallGainsLossPct.toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE 85/15 ALLOCATION ARCHITECTURE TABLES */}
      <div id="portfolio-table-section" data-highlight-id="portfolio-table-section" className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>2. The {targetAllocation}/{100 - targetAllocation} Allocation Architecture</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Strategy: {targetAllocation}% Safe Shield / {100 - targetAllocation}% Risk Sleeve (Salary-Only Dilution)</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-950/40 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                  <th className="py-4 pl-5">Tier</th>
                  <th className="py-4">Assets Included</th>
                  <th className="py-4 text-right">Current Value</th>
                  <th className="py-4 text-right">Weight %</th>
                  <th className="py-4 text-right">Target %</th>
                  <th className="py-4 text-center pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-4 pl-5 text-xs font-extrabold text-blue-600 dark:text-blue-400">🛡️ SAFE SHIELD</td>
                  <td className="py-4 text-xs text-slate-600 dark:text-slate-300">Savings + TDs + Loan ({safeAssets.length} active)</td>
                  <td className="py-4 text-xs font-mono font-bold text-right text-slate-900 dark:text-white">
                    ₱{totalSafeShield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-xs font-mono font-bold text-right">{safeWeight.toFixed(2)}%</td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">{targetAllocation.toFixed(1)}%</td>
                  <td className="py-4 text-center pr-5">
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md ${
                      safeStatus === 'UNDERWEIGHT' 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {safeStatus}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-4 pl-5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">🚀 RISK SLEEVE</td>
                  <td className="py-4 text-xs text-slate-600 dark:text-slate-300">Crypto, Stocks, REITs ({riskAssets.length} active)</td>
                  <td className="py-4 text-xs font-mono font-bold text-right text-slate-900 dark:text-white">
                    ₱{totalRiskSleeve.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-xs font-mono font-bold text-right">{riskWeight.toFixed(2)}%</td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">{(100 - targetAllocation).toFixed(1)}%</td>
                  <td className="py-4 text-center pr-5">
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md ${
                      riskStatus === 'OVERWEIGHT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {riskStatus}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-4 pl-5 text-xs font-extrabold text-purple-600 dark:text-purple-400">🏠 PHYSICAL ASSETS</td>
                  <td className="py-4 text-xs text-slate-600 dark:text-slate-300">House, Vehicles, Hardware ({physicalAssets.length} active)</td>
                  <td className="py-4 text-xs font-mono font-bold text-right text-slate-900 dark:text-white">
                    ₱{totalPhysical.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">-</td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">-</td>
                  <td className="py-4 text-center pr-5">
                    <span className="px-2.5 py-1 text-[9px] font-extrabold rounded-md bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400">
                      PHYSICAL
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-4 pl-5 text-xs font-extrabold text-rose-600 dark:text-rose-400">💸 TOTAL LIABILITIES</td>
                  <td className="py-4 text-xs text-slate-600 dark:text-slate-300">Mortgages, Auto Loans, Debts ({liabilityAssets.length} active)</td>
                  <td className="py-4 text-xs font-mono font-bold text-right text-rose-600 dark:text-rose-400">
                    -₱{totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">-</td>
                  <td className="py-4 text-xs font-mono text-right text-slate-400">-</td>
                  <td className="py-4 text-center pr-5">
                    <span className="px-2.5 py-1 text-[9px] font-extrabold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400">
                      OUTFLOW DEBT
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/10 font-bold">
                <tr className="bg-indigo-500/5">
                  <td className="py-4 pl-5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Overall Portfolio Net Gain / Loss
                  </td>
                  <td className="py-4 text-[10px] text-slate-500 dark:text-slate-400">Safe Shield + Risk Sleeve</td>
                  <td className="py-4 text-xs font-mono font-black text-right text-slate-900 dark:text-white">
                    ₱{totalOverallValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} className="py-4 text-right pr-5">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                      totalOverallGainsLoss >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                    }`}>
                      {totalOverallGainsLoss >= 0 ? '+' : ''}₱{totalOverallGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalOverallGainsLossPct >= 0 ? '+' : ''}{totalOverallGainsLossPct.toFixed(2)}%)
                    </span>
                  </td>
                </tr>
                <tr className="bg-blue-500/5">
                  <td className="py-4 pl-5 text-xs font-black text-blue-600 dark:text-teal-400 uppercase tracking-widest">Calculated Real-Time Net Worth</td>
                  <td className="py-4 text-[10px] text-slate-500 dark:text-slate-400">Net Worth Valuation</td>
                  <td className="py-4 text-sm font-mono font-black text-right text-blue-600 dark:text-teal-400">
                    ₱{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} className="py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Risk Sleeve Sub-Allocation Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <span>Risk Sleeve Sub-Allocation (The Proportional 15%)</span>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                  Target Sum: {(targetCryptoGoldOfTotal + targetReitOfTotal + targetStockOfTotal).toFixed(2)}%
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Editable target percentages per risk pillar. Updates real-time portfolio alignment status.
              </p>
            </div>
            {isEditingRiskSleeveTargets ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveRiskSleeveTargets}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Target %</span>
                </button>
                <button
                  onClick={() => setIsEditingRiskSleeveTargets(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingRiskSleeveTargets(true)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Edit Target %</span>
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                  <th className="py-3 pl-5">Priority Pillar</th>
                  <th className="py-3">Included Assets</th>
                  <th className="py-3 text-right">Current Value</th>
                  <th className="py-3 text-right">Current %</th>
                  <th className="py-3 text-right pr-4">Target %</th>
                  <th className="py-3 text-center pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-3.5 pl-5 text-xs font-bold text-slate-800 dark:text-slate-200">1. Crypto/Gold</td>
                  <td className="py-3.5 text-xs text-slate-500 font-mono">BTC + PAXG</td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold text-slate-800 dark:text-slate-200">
                    ₱{cryptoGoldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold">{cryptoGoldWeightOfTotal.toFixed(2)}%</td>
                  <td className="py-3.5 text-xs font-mono text-right pr-4">
                    {isEditingRiskSleeveTargets ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          id="target-cryptogold-weight-input"
                          name="target_cryptogold_weight"
                          type="text"
                          inputMode="decimal"
                          value={targetCryptoGoldOfTotal}
                          onChange={(e) => setTargetCryptoGoldOfTotal(parseFormattedNumber(e.target.value))}
                          aria-label="Crypto and Gold Target Weight Percentage"
                          className="w-20 px-2 py-1 text-xs font-mono text-right bg-white dark:bg-slate-800 border border-blue-500 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        />
                        <span className="text-xs text-slate-400 font-mono">%</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{targetCryptoGoldOfTotal.toFixed(2)}%</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center pr-5">
                    <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded ${
                      cryptoGoldStatus === 'OVERWEIGHT'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                        : cryptoGoldStatus === 'UNDERWEIGHT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {cryptoGoldStatus}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-3.5 pl-5 text-xs font-bold text-slate-800 dark:text-slate-200">2. REITs</td>
                  <td className="py-3.5 text-xs text-slate-500 font-mono">Manulife Asia-Pac FoF + RCR</td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold text-slate-800 dark:text-slate-200">
                    ₱{reitValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold">{reitWeightOfTotal.toFixed(2)}%</td>
                  <td className="py-3.5 text-xs font-mono text-right pr-4">
                    {isEditingRiskSleeveTargets ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          id="target-reits-weight-input"
                          name="target_reits_weight"
                          type="text"
                          inputMode="decimal"
                          value={targetReitOfTotal}
                          onChange={(e) => setTargetReitOfTotal(parseFormattedNumber(e.target.value))}
                          aria-label="REITs Target Weight Percentage"
                          className="w-20 px-2 py-1 text-xs font-mono text-right bg-white dark:bg-slate-800 border border-blue-500 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        />
                        <span className="text-xs text-slate-400 font-mono">%</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{targetReitOfTotal.toFixed(2)}%</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center pr-5">
                    <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded ${
                      reitStatus === 'OVERWEIGHT'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                        : reitStatus === 'UNDERWEIGHT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {reitStatus}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-3.5 pl-5 text-xs font-bold text-slate-800 dark:text-slate-200">3. Stocks</td>
                  <td className="py-3.5 text-xs text-slate-500 font-mono">SCC + SPC</td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold text-slate-800 dark:text-slate-200">
                    ₱{stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-mono text-right font-bold">{stockWeightOfTotal.toFixed(2)}%</td>
                  <td className="py-3.5 text-xs font-mono text-right pr-4">
                    {isEditingRiskSleeveTargets ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          id="target-stocks-weight-input"
                          name="target_stocks_weight"
                          type="text"
                          inputMode="decimal"
                          value={targetStockOfTotal}
                          onChange={(e) => setTargetStockOfTotal(parseFormattedNumber(e.target.value))}
                          aria-label="Stocks Target Weight Percentage"
                          className="w-20 px-2 py-1 text-xs font-mono text-right bg-white dark:bg-slate-800 border border-blue-500 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        />
                        <span className="text-xs text-slate-400 font-mono">%</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{targetStockOfTotal.toFixed(2)}%</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center pr-5">
                    <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded ${
                      stockStatus === 'OVERWEIGHT'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                        : stockStatus === 'UNDERWEIGHT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {stockStatus}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950/80 border-t-2 border-slate-200 dark:border-white/10 font-bold">
                <tr>
                  <td colSpan={2} className="py-3.5 pl-5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    🚀 Total Risk Sleeve Growth Gains/Loss
                  </td>
                  <td className="py-3.5 text-xs font-mono font-black text-right text-slate-900 dark:text-white">
                    ₱{totalRiskSleeve.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-mono font-black text-right">{riskWeight.toFixed(2)}%</td>
                  <td className="py-3.5 text-xs font-mono font-bold text-right pr-4 text-slate-400">{(targetCryptoGoldOfTotal + targetReitOfTotal + targetStockOfTotal).toFixed(2)}%</td>
                  <td className="py-3.5 text-center pr-5">
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded ${
                      totalRiskGainsLoss >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                    }`}>
                      {totalRiskGainsLoss >= 0 ? '+' : ''}₱{totalRiskGainsLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalRiskGainsLossPct >= 0 ? '+' : ''}{totalRiskGainsLossPct.toFixed(2)}%)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 3. SALARY DILUTION & EMERGENCY SAFEGUARD MATH AUDIT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs space-y-8">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>3. Emergency Safeguard Buffer & Portfolio Rebalancing Audit</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Evaluation of living expense reserves vs. portfolio rebalancing target benchmarks based on live asset entries
              </p>
            </div>
            
            {/* Monthly Living Expense Baseline Input */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
              <label htmlFor="portfolio-monthly-living-expenses-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">Monthly Living Expenses:</label>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">₱</span>
                <input
                  id="portfolio-monthly-living-expenses-input"
                  name="portfolio_monthly_living_expenses"
                  type="text"
                  inputMode="decimal"
                  value={monthlyLivingExpensesInput}
                  onChange={(e) => setMonthlyLivingExpensesInput(e.target.value)}
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white px-2 py-1 rounded focus:outline-none focus:border-blue-500"
                  placeholder="9000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dual Audit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* A. Personal Emergency Safeguard Buffer (Expense-Based Model) */}
          <div className="p-6 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 rounded-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Personal Emergency Safeguard Buffer</span>
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md ${
                  isEmergencyBufferFunded 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                }`}>
                  {isEmergencyBufferFunded ? '🛡️ 100% SECURED' : '⚠️ UNDER-FUNDED'}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {emergencyRunwayMonths.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Months of Living Expense Runway</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mt-4 border-t border-slate-200/60 dark:border-white/5 pt-3">
                <li className="flex justify-between items-center">
                  <span>Monthly Expense Baseline</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₱{monthlyLivingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>3-Month Emergency Reserve Target</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₱{emergencyBuffer3Months.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>6-Month Safeguard Buffer Target</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₱{emergencyBuffer6Months.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Current Safe Shield Capital</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₱{totalSafeShield.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
                <li className="flex justify-between items-center border-t border-slate-200/60 dark:border-white/5 pt-2 font-bold">
                  <span>Safeguard Buffer Net Surplus</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +₱{emergencyBufferSurplus.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({emergencyCoveragePct.toFixed(0)}% covered)
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-white/5">
              💡 <b>Personal Finance Logic:</b> Your Emergency Fund is calculated directly on 3 to 6 months of actual living expenses (₱{monthlyLivingExpenses.toLocaleString()}/month × 6 = ₱{emergencyBuffer6Months.toLocaleString()}). With <b>₱{totalSafeShield.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b> in Safe Shield capital, you have <b>{emergencyRunwayMonths.toFixed(1)} months</b> of complete expense runway, fully protecting your household.
            </p>
          </div>

          {/* B. Institutional Portfolio Asset Ratio Audit */}
          <div className="p-6 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 rounded-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Salary Dilution Math Audit ({targetSafe}/{100 - targetSafe} Target)</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                  REBALANCING MODEL
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                  ₱{institutionalFundingGap.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rebalancing Allocation Gap</span>
              </div>

              <div className="mt-4 border-t border-slate-200/60 dark:border-white/5 pt-3 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center font-medium">
                  <span>1. Current Risk Sleeve Value:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₱{totalRiskSleeve.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    2. Target Portfolio Size <span className="font-normal text-slate-500">(scaled for {100 - targetSafe}% risk allocation)</span>:
                  </div>
                  <div className="font-mono text-center text-[11px] py-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30 rounded border border-blue-100 dark:border-blue-900/30">
                    Target Portfolio Size = ₱{totalRiskSleeve.toLocaleString('en-US', { minimumFractionDigits: 2 })} ÷ {((100 - targetSafe) / 100).toFixed(2)} = ₱{targetPortfolioSize.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    3. Target Safe Shield <span className="font-normal text-slate-500">(scaled for {targetSafe}% safety standard)</span>:
                  </div>
                  <div className="font-mono text-center text-[11px] py-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900/30">
                    Target Safe Shield = ₱{targetPortfolioSize.toLocaleString('en-US', { minimumFractionDigits: 2 })} × {(targetSafe / 100).toFixed(2)} = ₱{targetSafeShieldValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex justify-between items-center font-medium">
                  <span>4. Current Safe Shield Value:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₱{totalSafeShield.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    5. INSTITUTIONAL FUNDING GAP (Rebalancing Gap):
                  </div>
                  <div className="font-mono text-center text-[11px] py-1 text-rose-600 dark:text-rose-300 font-extrabold bg-white/80 dark:bg-slate-900/80 rounded border border-rose-200/50 dark:border-rose-900/30">
                    Funding Gap = ₱{targetSafeShieldValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} − ₱{totalSafeShield.toLocaleString('en-US', { minimumFractionDigits: 2 })} = ₱{institutionalFundingGap.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-white/5">
              📊 <b>Rebalancing Ratio vs. Emergency Reserve:</b> The ₱{institutionalFundingGap.toLocaleString(undefined, { maximumFractionDigits: 0 })} gap is purely an <i>asset allocation metric</i> that expands when market prices of risk assets (crypto, stocks) appreciate. It ensures your defensive cash scales with portfolio growth, independent of your personal living expenses.
            </p>
          </div>

        </div>
      </div>

      {localToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-white/10 dark:border-slate-200/50 flex items-center gap-2 animate-fade-in select-none">
          {localToast.type === 'success' ? (
            <span className="text-emerald-400">✔️</span>
          ) : localToast.type === 'error' ? (
            <span className="text-rose-400">❌</span>
          ) : (
            <span className="text-blue-400 animate-pulse font-bold">●</span>
          )}
          <span>{localToast.message}</span>
        </div>
      )}

      <AIPopupModal
        isOpen={popupState.isOpen}
        type={popupState.type}
        title={popupState.title}
        message={popupState.message}
        onClose={() => setPopupState((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
