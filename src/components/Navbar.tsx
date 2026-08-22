import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Shield, LogOut, User, Menu, X, Settings, Crown, Lock, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, Sparkles, CheckCircle2, Undo2, Redo2, RotateCcw, Target, Info, Check } from 'lucide-react';
import { MarketAlert, AssetPosition, ExpenseEntry, FamilyGoal, BudgetLimit, TradeEntry } from '../types';
import { CycleItem } from './MarketCycleAuditTab';
import SearchEngine from './SearchEngine';
import logoImg from '../assets/images/app_logo_1786099253668.jpg';
import { formatTimeAgo } from '../lib/formatters';

interface NavbarProps {
  email: string;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  alerts: MarketAlert[];
  onClearAlerts: () => void;
  onAddAlert?: (alert: Omit<MarketAlert, 'id' | 'timestamp'>) => void;
  onDeleteAlert?: (id: string) => void;
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  goals: FamilyGoal[];
  budgets: BudgetLimit[];
  transactions?: TradeEntry[];
  cycleItems?: CycleItem[];
  onSelect: (type: string, id: string, targetTab?: string) => void;
  onOpenSettings: (tab?: 'profile' | 'preferences' | 'export') => void;
  subscriptionTier?: 'free' | 'pro';
  isAdmin?: boolean;
  onOpenPricing?: () => void;
  onOpenSignIn?: () => void;
  isGuest?: boolean;
  onOpenAdminHQ?: () => void;
  onOpenPolicyModal?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  lastUndoDescription?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({
  email,
  onLogout,
  darkMode,
  onToggleDarkMode,
  alerts,
  onClearAlerts,
  onAddAlert,
  onDeleteAlert,
  assets,
  expenses,
  goals,
  budgets,
  transactions,
  cycleItems,
  onSelect,
  onOpenSettings,
  subscriptionTier = 'free',
  isAdmin = false,
  onOpenPricing,
  onOpenSignIn,
  isGuest = false,
  onOpenAdminHQ,
  onOpenPolicyModal,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  lastUndoDescription = '',
  onUndo,
  onRedo,
  onToggleSidebar,
  isSidebarOpen = true,
}: NavbarProps) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertTab, setAlertTab] = useState<'feed' | 'configure' | 'guide'>('feed');

  // Categorize user's actual asset holdings
  const userSafeAssets = assets.filter((a) => a.class === 'safe');
  const userRiskAssets = assets.filter((a) => a.class === 'risk');
  const userPhysicalAssets = assets.filter((a) => a.class === 'physical');

  // Sort user assets by current valuation
  const sortedRiskAssets = [...userRiskAssets].sort((a, b) => (b.units * b.currentPricePHP) - (a.units * a.currentPricePHP));
  const sortedSafeAssets = [...userSafeAssets].sort((a, b) => (b.units * b.currentPricePHP) - (a.units * a.currentPricePHP));

  // Custom Price Alert Creation State - default to user's top asset if available
  const [newAsset, setNewAsset] = useState(() => {
    return assets.length > 0 ? assets[0].name : 'Bitcoin (BTC)';
  });
  const [newType, setNewType] = useState<'up' | 'down' | 'info' | 'volatility'>('down');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newPurpose, setNewPurpose] = useState('dip');
  const [newMessage, setNewMessage] = useState('');

  // Update selected default asset when user's assets change
  useEffect(() => {
    if (assets.length > 0 && !assets.some((a) => a.name === newAsset)) {
      setNewAsset(assets[0].name);
    }
  }, [assets, newAsset]);

  // Session-dismissed signals to prevent notification flooding
  const [dismissedSignals, setDismissedSignals] = useState<string[]>([]);

  // Dynamic relative timestamp live ticker
  const [, setTimeTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimeTicker((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute live financial metrics for tier-tailored notifications
  const totalSafeVal = userSafeAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const totalRiskVal = userRiskAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const totalPortfolioVal = totalSafeVal + totalRiskVal;
  const currentSafeRatio = totalPortfolioVal > 0 ? (totalSafeVal / totalPortfolioVal) * 100 : 0;
  const isSafeShieldBreached = totalPortfolioVal > 0 && currentSafeRatio < 40 && !dismissedSignals.includes('safe-shield');

  // Monthly expense & liquid runway calculations
  const totalMonthlySpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudgetCap = budgets.reduce((sum, b) => sum + b.limitPHP, 0) || 20000;
  const spendRatio = totalBudgetCap > 0 ? Math.min(100, Math.round((totalMonthlySpend / totalBudgetCap) * 100)) : 0;
  const liquidRunwayMonths = totalMonthlySpend > 0 ? (totalSafeVal / totalMonthlySpend) : 12;
  const isBudgetWarning = spendRatio >= 80 && !dismissedSignals.includes('budget-warning');
  const isRunwayWarning = liquidRunwayMonths < 6 && !dismissedSignals.includes('runway-warning');

  // Dynamic Real-Time Asset Insights & Signals generated from the user's actual portfolio holdings:
  interface DynamicAssetSignal {
    id: string;
    assetName: string;
    type: 'profit' | 'dip' | 'yield' | 'guardrail' | 'burn';
    title: string;
    message: string;
    usedFor: string;
    actionLabel?: string;
    actionTab?: string;
    badgeColor: 'rose' | 'amber' | 'emerald' | 'blue' | 'indigo';
    icon: string;
  }

  const dynamicAssetSignals: DynamicAssetSignal[] = [];

  // 1. Safe Shield Guardrail Signal
  if (isSafeShieldBreached) {
    dynamicAssetSignals.push({
      id: 'safe-shield',
      assetName: 'Safe Shield Guardrail',
      type: 'guardrail',
      title: '🛡️ Capital Preservation Guardrail',
      message: `Safe Shield is ${currentSafeRatio.toFixed(1)}% (under 40% defense target). Total safe capital: ₱${totalSafeVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
      usedFor: 'Capital preservation — rebalance risk sleeve to prevent unexpected drawdowns.',
      actionLabel: 'Open Portfolio Calibrator',
      actionTab: 'portfolio',
      badgeColor: 'rose',
      icon: '🛡️',
    });
  }

  // 2. Liquid Runway Warning
  if (isRunwayWarning && totalMonthlySpend > 0) {
    dynamicAssetSignals.push({
      id: 'runway-warning',
      assetName: 'Liquid Cash Runway',
      type: 'burn',
      title: '⚡ Liquid Cash Runway Alert',
      message: `Safe reserves (₱${totalSafeVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}) cover ${liquidRunwayMonths.toFixed(1)} months of living burn (₱${totalMonthlySpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo).`,
      usedFor: 'Emergency preparedness — alerts when emergency runway falls under 6 months.',
      actionLabel: 'Review Expenses',
      actionTab: 'expenses',
      badgeColor: 'amber',
      icon: '⚡',
    });
  }

  // 3. Monthly Budget Warning
  if (isBudgetWarning) {
    dynamicAssetSignals.push({
      id: 'budget-warning',
      assetName: 'Monthly Budget Cap',
      type: 'burn',
      title: `💳 Budget Cap Guardrail (${spendRatio}% Spent)`,
      message: `Spent ₱${totalMonthlySpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} of ₱${totalBudgetCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget limit this month.`,
      usedFor: 'Expense discipline — warns before reaching month-end budget deficit.',
      actionLabel: 'Open Expense Tracker',
      actionTab: 'expenses',
      badgeColor: 'rose',
      icon: '💳',
    });
  }

  // 4. Asset-Specific Real-Time Signals from User's Actual Holdings:
  sortedRiskAssets.forEach((asset) => {
    const totalVal = asset.units * asset.currentPricePHP;
    const totalCost = asset.units * (asset.costBasisPHP || asset.currentPricePHP);
    const gainPHP = totalVal - totalCost;
    const gainPct = totalCost > 0 ? (gainPHP / totalCost) * 100 : 0;
    
    // Profit-taking milestone (> +12% unrealized gain)
    if (gainPct >= 12 && !dismissedSignals.includes(`profit-${asset.key}`)) {
      dynamicAssetSignals.push({
        id: `profit-${asset.key}`,
        assetName: asset.name,
        type: 'profit',
        title: `📈 Take-Profit Target: ${asset.name} (+${gainPct.toFixed(1)}%)`,
        message: `Unrealized gain of +₱${gainPHP.toLocaleString(undefined, { maximumFractionDigits: 0 })} (+${gainPct.toFixed(1)}%). Current holding value: ₱${totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
        usedFor: 'Locking in capital — consider taking partial profit into Safe Shield.',
        actionLabel: 'View Asset in Vault',
        actionTab: 'assets',
        badgeColor: 'emerald',
        icon: '📈',
      });
    }

    // Dip-buying opportunity (< -6% drawdown below cost basis)
    if (gainPct <= -6 && !dismissedSignals.includes(`dip-${asset.key}`)) {
      dynamicAssetSignals.push({
        id: `dip-${asset.key}`,
        assetName: asset.name,
        type: 'dip',
        title: `🎯 Dip Buying Opportunity: ${asset.name} (${gainPct.toFixed(1)}%)`,
        message: `Trading ${Math.abs(gainPct).toFixed(1)}% below your cost basis (Entry: ₱${asset.costBasisPHP.toLocaleString()} vs Current: ₱${asset.currentPricePHP.toLocaleString()}).`,
        usedFor: 'Cost averaging — favorable accumulation zone at a discount.',
        actionLabel: 'Log Buy Order',
        actionTab: 'transactions',
        badgeColor: 'blue',
        icon: '🎯',
      });
    }
  });

  // Safe Assets compounding & yield signals
  sortedSafeAssets.forEach((asset) => {
    if (asset.yieldPercent && asset.yieldPercent > 0 && !dismissedSignals.includes(`yield-${asset.key}`)) {
      const annualYield = (asset.units * asset.currentPricePHP) * (asset.yieldPercent / 100);
      dynamicAssetSignals.push({
        id: `yield-${asset.key}`,
        assetName: asset.name,
        type: 'yield',
        title: `🏦 High-Yield Compounding: ${asset.name} (${asset.yieldPercent}% p.a.)`,
        message: `Generating ~₱${(annualYield / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo (~₱${annualYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr) in passive yields.`,
        usedFor: 'Safe Shield Growth — compound earnings into cash reserves.',
        actionLabel: 'View Safe Sleeve',
        actionTab: 'portfolio',
        badgeColor: 'indigo',
        icon: '🏦',
      });
    }
  });

  // Calculate total relevant alerts (non-flooded)
  const totalAlertCount = alerts.length + dynamicAssetSignals.length;

  // Purpose descriptions mapping for custom alert creation
  const PURPOSE_OPTIONS = [
    { key: 'dip', label: '🎯 Buy the Dip (Discount Alert)', desc: 'Notify when asset price drops by threshold to accumulate at favorable entry.' },
    { key: 'profit', label: '📈 Take Profit (Target Milestone)', desc: 'Notify when asset reaches upside target to lock in gains.' },
    { key: 'volatility', label: '⚡ Volatility Watch (Rapid Swing)', desc: 'Alert on sudden market swings (±%) to monitor abnormal volume.' },
    { key: 'guardrail', label: '🛡️ Portfolio Defense Guardrail', desc: 'Alert when capital allocation breaches minimum safety floor.' },
  ];

  // Dynamically generate personalized 1-click presets based on this user's actual assets:
  const RECOMMENDED_PRESETS = [
    // Top risk asset 1
    ...(sortedRiskAssets.length > 0 ? [{
      id: `preset-${sortedRiskAssets[0].key}-volatility`,
      icon: sortedRiskAssets[0].assetType === 'crypto' ? '⚡' : sortedRiskAssets[0].assetType === 'commodity' ? '🥇' : '📈',
      asset: sortedRiskAssets[0].name,
      type: 'volatility' as const,
      threshold: 5,
      purpose: 'Dip Buying & Volatility',
      usedFor: `Monitors ±5% price swings for your ${sortedRiskAssets[0].name} (Valued at ₱${(sortedRiskAssets[0].units * sortedRiskAssets[0].currentPricePHP).toLocaleString(undefined, { maximumFractionDigits: 0 })}).`,
      message: `Notify on ±5% ${sortedRiskAssets[0].name} market price swing.`,
      label: `${sortedRiskAssets[0].symbol || sortedRiskAssets[0].name.split(' ')[0]} ±5% Swing`,
    }] : [{
      id: 'btc-swing',
      icon: '⚡',
      asset: 'Bitcoin (BTC)',
      type: 'volatility' as const,
      threshold: 5,
      purpose: 'Dip Buying & Volatility',
      usedFor: 'Catches sudden ±5% Bitcoin market swings so you can accumulate on dips or rebalance exposure.',
      message: 'Notify on ±5% Bitcoin price market swing.',
      label: 'BTC ±5% Volatility',
    }]),

    // Top risk asset 2 (if user has another risk holding)
    ...(sortedRiskAssets.length > 1 ? [{
      id: `preset-${sortedRiskAssets[1].key}-target`,
      icon: sortedRiskAssets[1].assetType === 'crypto' ? '🚀' : sortedRiskAssets[1].assetType === 'commodity' ? '🥇' : '📈',
      asset: sortedRiskAssets[1].name,
      type: 'up' as const,
      threshold: 8,
      purpose: 'Take-Profit / Target Milestone',
      usedFor: `Alerts when your ${sortedRiskAssets[1].name} surges +8% for locking in gains into Safe Shield.`,
      message: `Notify when ${sortedRiskAssets[1].name} surges +8% above entry.`,
      label: `${sortedRiskAssets[1].symbol || sortedRiskAssets[1].name.split(' ')[0]} +8% Target`,
    }] : [{
      id: 'gold-target',
      icon: '🥇',
      asset: 'PAXG Gold Spot',
      type: 'up' as const,
      threshold: 3,
      purpose: 'Take-Profit / Safe Haven',
      usedFor: 'Alerts when physical gold / PAXG token surges +3% for harvesting gains into cash shield.',
      message: 'Notify when PAXG Gold spot surges +3% above entry price.',
      label: 'Gold +3% Rally',
    }]),

    // Primary safe asset preset (e.g. Maya Savings, High Yield Savings, Time Deposit)
    ...(sortedSafeAssets.length > 0 ? [{
      id: `preset-${sortedSafeAssets[0].key}-yield`,
      icon: '🏦',
      asset: sortedSafeAssets[0].name,
      type: 'info' as const,
      threshold: sortedSafeAssets[0].yieldPercent || 5,
      purpose: 'Yield & Capital Preservation',
      usedFor: `Tracks compounding yields and liquidity balance for your primary safe holding ${sortedSafeAssets[0].name}.`,
      message: `Cash alert for ${sortedSafeAssets[0].name} yield compounding milestone.`,
      label: `${sortedSafeAssets[0].name.split(' ')[0]} Yield Rule`,
    }] : []),

    // Safe Shield Guardrail tailored to user's real numbers
    {
      id: 'safe-shield-guard',
      icon: '🛡️',
      asset: 'Safe Shield Guardrail',
      type: 'down' as const,
      threshold: 40,
      purpose: 'Capital Defense',
      usedFor: `Protects emergency liquidity: alerts if safe assets fall below 40% of your ₱${totalPortfolioVal.toLocaleString(undefined, { maximumFractionDigits: 0 })} portfolio.`,
      message: 'Alert when Safe Shield drops below 40% target allocation.',
      label: 'Safe Shield (40% Min)',
    },

    // Monthly Budget Cap tailored to user's real budget
    {
      id: 'budget-limit',
      icon: '💳',
      asset: 'Monthly Budget Cap',
      type: 'info' as const,
      threshold: 80,
      purpose: 'Cash Flow Discipline',
      usedFor: `Notifies when expenses hit 80% of your ₱${totalBudgetCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly budget cap.`,
      message: 'Warning when monthly spending reaches 80% of budget cap.',
      label: 'Budget 80% Cap',
    },
  ];

  // Profile picture and display name state
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    return localStorage.getItem(`wealth_vault_profile_pic_${email}`) || null;
  });
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem(`wealth_vault_display_name_${email}`) || (email ? email.split('@')[0] : 'User');
  });

  useEffect(() => {
    if (email) {
      setProfilePic(localStorage.getItem(`wealth_vault_profile_pic_${email}`) || null);
      setDisplayName(localStorage.getItem(`wealth_vault_display_name_${email}`) || email.split('@')[0] || 'User');
    }
  }, [email]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (email) {
        setProfilePic(localStorage.getItem(`wealth_vault_profile_pic_${email}`) || null);
        setDisplayName(localStorage.getItem(`wealth_vault_display_name_${email}`) || email.split('@')[0] || 'User');
      }
    };
    window.addEventListener('wealth_vault_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('wealth_vault_profile_updated', handleProfileUpdate);
  }, [email]);

  const handleCreateCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAlert) return;
    
    let purposeLabel = 'Market Opportunity';
    if (newPurpose === 'dip') purposeLabel = 'Dip Buying Discount';
    else if (newPurpose === 'profit') purposeLabel = 'Take-Profit Milestone';
    else if (newPurpose === 'volatility') purposeLabel = 'Market Volatility Watch';
    else if (newPurpose === 'guardrail') purposeLabel = 'Capital Defense Guardrail';

    const defaultDesc = `${purposeLabel} active for ${newAsset} (${newType === 'up' ? 'surges +' : newType === 'down' ? 'drops -' : '±'}${newThreshold}%).`;
    const desc = newMessage.trim() || defaultDesc;

    onAddAlert({
      asset: newAsset,
      type: newType,
      message: desc,
      thresholdPercentage: Number(newThreshold) || 5,
      purpose: purposeLabel,
      category: newPurpose === 'guardrail' ? 'guardrail' : 'price',
    });
    setNewMessage('');
    setAlertTab('feed');
  };

  const isPresetActive = (assetName: string) => {
    return alerts.some((a) => a.asset.toLowerCase() === assetName.toLowerCase());
  };

  const handleTogglePresetAlert = (preset: typeof RECOMMENDED_PRESETS[0]) => {
    if (!onAddAlert) return;
    const existing = alerts.find((a) => a.asset.toLowerCase() === preset.asset.toLowerCase());
    if (existing && onDeleteAlert) {
      onDeleteAlert(existing.id);
    } else if (!existing) {
      onAddAlert({
        asset: preset.asset,
        type: preset.type,
        thresholdPercentage: preset.threshold,
        message: preset.message,
        purpose: preset.purpose,
        category: preset.id.includes('guard') ? 'guardrail' : preset.id.includes('budget') ? 'budget' : 'price',
      });
    }
  };

  const dismissSignal = (id: string) => {
    setDismissedSignals((prev) => [...prev, id]);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-all duration-300">
      <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-10 h-14 sm:h-18 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3.5">
          {/* YouTube-style 3-Line Menu Hamburger Button */}
          {onToggleSidebar && (
            <button
              type="button"
              id="sidebar-three-line-toggle-btn"
              onClick={onToggleSidebar}
              className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus:outline-none shrink-0"
              title="Toggle Left Sidebar Navigation"
              aria-label="Guide"
            >
              <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          )}

          <img src={logoImg} alt="Logo" className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg shadow-md" />
          <div>
            <h1 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight uppercase">
              BUDGET PORTFOLIO
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.2 sm:mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Enterprise Core v96.2</p>
            </div>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Quick Undo / Redo Controls */}
          {(canUndo || canRedo) && (
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
              {canUndo && (
                <button
                  onClick={onUndo}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-extrabold tracking-tight transition-all border border-slate-200/60 dark:border-white/5 cursor-pointer shadow-2xs group"
                  title={`Undo: ${lastUndoDescription || 'Revert last action'} (Ctrl+Z)`}
                >
                  <Undo2 className="w-3.5 h-3.5 text-indigo-500 group-hover:-rotate-45 transition-transform" />
                  <span>Undo</span>
                  {undoCount > 1 && (
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full font-mono font-black">
                      {undoCount}
                    </span>
                  )}
                </button>
              )}
              {canRedo && (
                <button
                  onClick={onRedo}
                  className="flex items-center space-x-1 px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-extrabold tracking-tight transition-all border border-slate-200/60 dark:border-white/5 cursor-pointer shadow-2xs group"
                  title="Redo action (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-45 transition-transform" />
                  <span>Redo</span>
                </button>
              )}
            </div>
          )}

          <SearchEngine assets={assets} expenses={expenses} goals={goals} budgets={budgets} transactions={transactions} cycleItems={cycleItems} onSelect={onSelect} />
          
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 px-3 py-1.5 rounded-full border border-blue-500/20 text-blue-700 dark:text-blue-300 transition-all cursor-pointer shadow-2xs hover:scale-105"
            title="View Membership & Pricing Plans"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pricing Plan</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all duration-300"
            title="Toggle Accessibility Color Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Personal Trigger Alerts Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all duration-300 cursor-pointer"
              title="Personal Price Alerts & Smart Portfolio Signals"
            >
              <Bell className="w-4 h-4" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-xs">
                  {totalAlertCount}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 mt-3 w-84 sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in text-left">
                
                {/* Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Personal Price Alerts
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Target price triggers & guardrail signals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {alerts.length > 0 && alertTab === 'feed' && (
                      <button
                        onClick={onClearAlerts}
                        className="text-[10px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Clear all alerts"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowAlerts(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-white/5 bg-slate-100/70 dark:bg-slate-950/60 p-1 gap-1">
                  <button
                    onClick={() => setAlertTab('feed')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      alertTab === 'feed'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Active Feed</span>
                    {totalAlertCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full text-[9px] font-mono font-bold">
                        {totalAlertCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAlertTab('configure')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      alertTab === 'configure'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Set Alert & Rules</span>
                  </button>

                  <button
                    onClick={() => setAlertTab('guide')}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      alertTab === 'guide'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Learn what notifications are used for"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Purpose</span>
                  </button>
                </div>

                {/* TAB 1: ACTIVE NOTIFICATIONS FEED */}
                {alertTab === 'feed' && (
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                    
                    {/* Personalized Real-Time Asset Signals */}
                    {dynamicAssetSignals.map((signal) => {
                      const isRose = signal.badgeColor === 'rose';
                      const isAmber = signal.badgeColor === 'amber';
                      const isEmerald = signal.badgeColor === 'emerald';
                      const isBlue = signal.badgeColor === 'blue';
                      const isIndigo = signal.badgeColor === 'indigo';

                      return (
                        <div
                          key={signal.id}
                          className={`p-3.5 border-b flex items-start gap-2.5 transition-colors ${
                            isRose
                              ? 'bg-rose-500/10 border-rose-500/20'
                              : isAmber
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : isEmerald
                              ? 'bg-emerald-500/10 border-emerald-500/20'
                              : isIndigo
                              ? 'bg-indigo-500/10 border-indigo-500/20'
                              : 'bg-blue-500/10 border-blue-500/20'
                          }`}
                        >
                          <div className="text-base shrink-0 mt-0.5">{signal.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  isRose
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isAmber
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : isEmerald
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isIndigo
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {signal.title}
                              </span>
                              <button
                                onClick={() => dismissSignal(signal.id)}
                                className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Dismiss for this session"
                              >
                                Dismiss
                              </button>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1 leading-snug">
                              {signal.message}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              <b>Used for:</b> {signal.usedFor}
                            </p>
                            {signal.actionLabel && signal.actionTab && (
                              <button
                                onClick={() => {
                                  onSelect('Tab', signal.actionTab!, signal.actionTab!);
                                  setShowAlerts(false);
                                }}
                                className={`mt-2 px-2.5 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                                  isRose
                                    ? 'bg-rose-600 hover:bg-rose-500'
                                    : isAmber
                                    ? 'bg-amber-600 hover:bg-amber-500'
                                    : isEmerald
                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                    : isIndigo
                                    ? 'bg-indigo-600 hover:bg-indigo-500'
                                    : 'bg-blue-600 hover:bg-blue-500'
                                }`}
                              >
                                <span>{signal.actionLabel}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Custom User Price Alerts List */}
                    {alerts.length === 0 && dynamicAssetSignals.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Active Notifications</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Your portfolio is currently balanced within target parameters. Set custom price drop, profit target, or volatility triggers to monitor markets.
                        </p>
                        <button
                          onClick={() => setAlertTab('configure')}
                          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Configure Alert Rules</span>
                        </button>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase flex items-center gap-1 ${
                                alert.type === 'up'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : alert.type === 'down'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                                  : alert.type === 'volatility'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
                              }`}>
                                {alert.type === 'up' && <TrendingUp className="w-3 h-3" />}
                                {alert.type === 'down' && <TrendingDown className="w-3 h-3" />}
                                {alert.type === 'volatility' && <AlertTriangle className="w-3 h-3" />}
                                <span>{alert.asset}</span>
                              </span>

                              {alert.purpose && (
                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {alert.purpose}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-mono">
                                {formatTimeAgo(alert.timestamp, alert.lastTriggeredDate)}
                              </span>
                              {onDeleteAlert && (
                                <button
                                  onClick={() => onDeleteAlert(alert.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                  title="Delete this alert rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-snug">
                            {alert.message}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 text-[9px]">
                            {alert.thresholdPercentage !== undefined && (
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                Trigger: ±{alert.thresholdPercentage}% Move
                              </span>
                            )}

                            <button
                              onClick={() => {
                                if (alert.asset.toLowerCase().includes('shield') || alert.asset.toLowerCase().includes('portfolio')) {
                                  onSelect('Tab', 'portfolio', 'portfolio');
                                } else if (alert.asset.toLowerCase().includes('budget') || alert.asset.toLowerCase().includes('expense')) {
                                  onSelect('Tab', 'expenses', 'expenses');
                                } else {
                                  onSelect('Tab', 'assets', 'assets');
                                }
                                setShowAlerts(false);
                              }}
                              className="ml-auto font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Jump to View</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: CONFIGURE ALERTS & 1-CLICK PRESETS */}
                {alertTab === 'configure' && (
                  <div className="p-3.5 max-h-[380px] overflow-y-auto space-y-4">
                    
                    {/* 1-Click Guardrail Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Recommended 1-Click Rules
                        </span>
                        <span className="text-[9px] text-slate-400">Click to toggle</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {RECOMMENDED_PRESETS.map((preset) => {
                          const active = isPresetActive(preset.asset);
                          return (
                            <div
                              key={preset.id}
                              onClick={() => handleTogglePresetAlert(preset)}
                              className={`p-2.5 border rounded-xl cursor-pointer transition-all ${
                                active
                                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/50 text-blue-900 dark:text-blue-200 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                  <span>{preset.icon}</span>
                                  <span className="truncate">{preset.label}</span>
                                </div>
                                {active ? (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-emerald-600 text-white rounded flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">+ Enable</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                {preset.usedFor}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Alert Creator Form */}
                    <form onSubmit={handleCreateCustomAlert} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Create Custom Price Alert
                        </span>
                      </div>

                      {/* What is this alert used for? */}
                      <div>
                        <label htmlFor="price-alert-purpose" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                          What is this notification used for?
                        </label>
                        <select
                          id="price-alert-purpose"
                          value={newPurpose}
                          onChange={(e) => setNewPurpose(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-2 font-bold text-slate-800 dark:text-slate-200"
                        >
                          {PURPOSE_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                          {PURPOSE_OPTIONS.find((p) => p.key === newPurpose)?.desc}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="price-alert-asset" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Asset / Target
                          </label>
                          <select
                            id="price-alert-asset"
                            value={newAsset}
                            onChange={(e) => setNewAsset(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-bold text-slate-800 dark:text-slate-200"
                          >
                            {userRiskAssets.length > 0 && (
                              <optgroup label="🚀 Your Risk Sleeve Holdings">
                                {userRiskAssets.map((a) => (
                                  <option key={a.key} value={a.name}>
                                    {a.name} (₱{(a.units * a.currentPricePHP).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {userSafeAssets.length > 0 && (
                              <optgroup label="🛡️ Your Safe Shield Holdings">
                                {userSafeAssets.map((a) => (
                                  <option key={a.key} value={a.name}>
                                    {a.name} (₱{(a.units * a.currentPricePHP).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {userPhysicalAssets.length > 0 && (
                              <optgroup label="🏠 Your Physical Assets">
                                {userPhysicalAssets.map((a) => (
                                  <option key={a.key} value={a.name}>
                                    {a.name} (₱{(a.units * a.currentPricePHP).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="⚙️ Portfolio Guardrails & Markets">
                              <option value="Safe Shield Guardrail">Safe Shield Guardrail (40% Min)</option>
                              <option value="Monthly Budget Cap">Monthly Budget Cap</option>
                              <option value="Bitcoin (BTC)">Bitcoin (BTC Spot)</option>
                              <option value="PAXG Gold Spot">PAXG Gold Spot</option>
                              <option value="PSE REITs Index">PSE REITs Index</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="price-alert-condition" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Trigger Condition
                          </label>
                          <select
                            id="price-alert-condition"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="down">Price Drops Below ▼ (Dip)</option>
                            <option value="up">Price Surges Above ▲ (Target)</option>
                            <option value="volatility">Volatility Swing ±%</option>
                            <option value="info">Threshold Guardrail ℹ</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label htmlFor="price-alert-threshold" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Threshold %
                          </label>
                          <input
                            id="price-alert-threshold"
                            type="number"
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-mono font-bold text-slate-800 dark:text-slate-200"
                            placeholder="5"
                          />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="price-alert-note" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Custom Note (Optional)
                          </label>
                          <input
                            id="price-alert-note"
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 text-slate-800 dark:text-slate-200"
                            placeholder="e.g. Accumulate ₱5,000 on dip"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Activate Alert Rule</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: PURPOSE & HOW NOTIFICATIONS WORK */}
                {alertTab === 'guide' && (
                  <div className="p-4 max-h-[380px] overflow-y-auto space-y-3">
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Why Use Personal Price Alerts?
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        WealthVault alerts help you execute your financial plan automatically so you don&apos;t need to watch price charts all day.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🎯</span>
                          <span>Dip Buying & Opportunity Alerts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <b>Used for:</b> Notifying you when high-conviction assets (like BTC or Gold) experience temporary pullbacks so you can buy at discounted prices.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>📈</span>
                          <span>Take-Profit Milestones</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <b>Used for:</b> Reminding you to harvest profits into your Safe Shield when assets reach your predefined upside target.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🛡️</span>
                          <span>Safe Shield Capital Preservation</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <b>Used for:</b> Defending your liquid emergency cushion — alerts if your Safe Shield ratio drops below the 40% floor.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>💳</span>
                          <span>Monthly Living Cost Guardrails</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <b>Used for:</b> Expense discipline — warns when spending hits 80% of budget before payday.
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span><b>Zero Noise Policy:</b> We only notify you for rules you activate and critical capital breaches.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clickable User Email, Avatar & Settings Controls or Guest Sign In */}
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-200 dark:border-white/5">
            {isGuest || !email ? (
              <button
                onClick={onOpenSignIn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <>
                {isAdmin && onOpenAdminHQ && (
                  <button
                    onClick={onOpenAdminHQ}
                    className="px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    title="Launch Standalone Admin HQ Domain Portal"
                  >
                    <Shield className="w-3 h-3 text-purple-500" />
                    <span className="hidden sm:inline">Admin HQ</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenSettings('profile')}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer group text-left"
                  title="Click to open App Settings & Profile"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors max-w-[140px] truncate">
                      {email}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest flex items-center gap-1 font-extrabold">
                      {isAdmin ? (
                        <span className="text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          Admin
                        </span>
                      ) : subscriptionTier === 'pro' ? (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          Pro Plan
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          Free Tier
                        </span>
                      )}
                      <span className="text-slate-400 dark:text-slate-500">• Settings</span>
                    </span>
                  </div>
                  
                  <div className="relative">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="User Profile"
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-rose-600 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Logout Securely"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Actions on Right */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/5 cursor-pointer"
            title="Toggle Accessibility Color Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
