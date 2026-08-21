import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Shield, LogOut, User, Menu, X, Settings, Crown, Lock, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, Sparkles, CheckCircle2, Undo2, Redo2, RotateCcw } from 'lucide-react';
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
}: NavbarProps) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom Price Alert Creation State
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState('Bitcoin (BTC)');
  const [newType, setNewType] = useState<'up' | 'down' | 'info' | 'volatility'>('volatility');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newMessage, setNewMessage] = useState('');

  // Dynamic relative timestamp live ticker
  const [, setTimeTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimeTicker((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute live financial metrics for tier-tailored notifications
  const safeAssets = assets.filter((a) => a.class === 'safe');
  const riskAssets = assets.filter((a) => a.class === 'risk');
  const totalSafeVal = safeAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const totalRiskVal = riskAssets.reduce((sum, a) => sum + (a.units * a.currentPricePHP), 0);
  const totalPortfolioVal = totalSafeVal + totalRiskVal;
  const currentSafeRatio = totalPortfolioVal > 0 ? (totalSafeVal / totalPortfolioVal) * 100 : 0;
  const isSafeShieldBreached = totalPortfolioVal > 0 && currentSafeRatio < 40;

  // Monthly expense & liquid runway calculations for tier notifications
  const totalMonthlySpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudgetCap = budgets.reduce((sum, b) => sum + b.limitPHP, 0) || 20000;
  const spendRatio = totalBudgetCap > 0 ? Math.min(100, Math.round((totalMonthlySpend / totalBudgetCap) * 100)) : 0;
  const liquidRunwayMonths = totalMonthlySpend > 0 ? (totalSafeVal / totalMonthlySpend) : 12;
  const isBudgetWarning = spendRatio >= 80;
  const isRunwayWarning = liquidRunwayMonths < 6;
  // Calculate total tier-specific financial notification count
  const tierSignalCount = (isSafeShieldBreached ? 1 : 0) + ((subscriptionTier === 'pro' || isAdmin) && isRunwayWarning ? 1 : 0) + (subscriptionTier === 'free' && isBudgetWarning ? 1 : 0);
  const totalAlertCount = alerts.length + tierSignalCount;

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
    const desc = newMessage.trim() || `Target rule active for ${newAsset} (${newType.toUpperCase()} ±${newThreshold}% threshold).`;
    onAddAlert({
      asset: newAsset,
      type: newType,
      message: desc,
      thresholdPercentage: Number(newThreshold) || 5,
    });
    setNewMessage('');
    setShowQuickAddForm(false);
  };

  const handleAddPresetAlert = (preset: { asset: string; type: 'up' | 'down' | 'info' | 'volatility'; threshold: number; message: string }) => {
    if (!onAddAlert) return;
    onAddAlert({
      asset: preset.asset,
      type: preset.type,
      thresholdPercentage: preset.threshold,
      message: preset.message,
    });
  };

  const RECOMMENDED_PRESETS = [
    {
      id: 'btc-swing',
      icon: '⚡',
      asset: 'Bitcoin (BTC)',
      type: 'volatility' as const,
      threshold: 5,
      message: 'Notify on ±5% Bitcoin price market movement.',
      label: 'BTC ±5% Swing',
    },
    {
      id: 'gold-target',
      icon: '🥇',
      asset: 'PAXG Gold Spot',
      type: 'up' as const,
      threshold: 3,
      message: 'Notify when PAXG Gold spot surges above target bounds.',
      label: 'Gold Price Target',
    },
    {
      id: 'safe-shield-guard',
      icon: '🛡️',
      asset: 'Safe Shield Guardrail',
      type: 'down' as const,
      threshold: 40,
      message: 'Alert when Safe Shield drops below 40% target allocation.',
      label: 'Safe Shield Guardrail',
    },
    {
      id: 'budget-limit',
      icon: '💸',
      asset: 'Monthly Budget Cap',
      type: 'info' as const,
      threshold: 80,
      message: 'Warning when monthly spending reaches 80% of budget cap.',
      label: 'Budget 80% Limit',
    },
  ];

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
      });
    }
  };

  const handleAddAllPresets = () => {
    if (!onAddAlert) return;
    RECOMMENDED_PRESETS.forEach((preset) => {
      if (!isPresetActive(preset.asset)) {
        onAddAlert({
          asset: preset.asset,
          type: preset.type,
          thresholdPercentage: preset.threshold,
          message: preset.message,
        });
      }
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-all duration-300">
      <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-10 h-14 sm:h-18 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
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
              className="relative p-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all duration-300"
              title="Personal Price Alerts & Smart Portfolio Signals"
            >
              <Bell className="w-4 h-4" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-bounce border border-white shadow-xs">
                  {totalAlertCount}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                
                {/* Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Personal Price Alerts
                    </h3>
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full text-[9px] font-mono font-bold">
                      {totalAlertCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQuickAddForm(!showQuickAddForm)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Set Custom Market Price or Guardrail Alert"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showQuickAddForm ? 'Close' : 'Set Alert'}</span>
                    </button>

                    {alerts.length > 0 && (
                      <button
                        onClick={onClearAlerts}
                        className="text-[10px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer px-1"
                        title="Clear all recorded alerts"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Tier Sub-Header Banner */}
                <div className="px-3.5 py-2 bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  {isAdmin ? (
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5" />
                      <span>👑 Admin Command Center Notifications</span>
                    </div>
                  ) : subscriptionTier === 'pro' ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 fill-amber-500" />
                      <span>⚡ Pro Suite Portfolio Intelligence</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5" />
                      <span>🛡️ Free Plan Basic Financial Alerts</span>
                    </div>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-500">
                    {isAdmin ? 'System-Wide' : subscriptionTier === 'pro' ? 'Pro Live' : 'Free Tier'}
                  </span>
                </div>

                {/* Inline Add Custom Price Alert Form */}
                {showQuickAddForm && (
                  <form onSubmit={handleCreateCustomAlert} className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-slate-200 dark:border-white/10 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Configure New Market Alarm Rule
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="price-alert-asset" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Asset / Target</label>
                        <select
                          id="price-alert-asset"
                          name="price_alert_asset"
                          value={newAsset}
                          onChange={(e) => setNewAsset(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="Bitcoin (BTC)">Bitcoin (BTC)</option>
                          <option value="PAXG Gold Spot">PAXG Gold Spot</option>
                          <option value="REITs Index">REITs Index</option>
                          <option value="Maya HYS (5%)">Maya HYS (5%)</option>
                          <option value="Safe Shield Guardrail">Safe Shield Guardrail</option>
                          <option value="Monthly Budget Cap">Monthly Budget Cap</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="price-alert-condition" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trigger Condition</label>
                        <select
                          id="price-alert-condition"
                          name="price_alert_condition"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="volatility">Volatility (±%)</option>
                          <option value="up">Price Increase ▲</option>
                          <option value="down">Price Drop ▼</option>
                          <option value="info">Guardrail Info ℹ</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label htmlFor="price-alert-threshold" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Threshold %</label>
                        <input
                          id="price-alert-threshold"
                          name="price_alert_threshold"
                          type="number"
                          value={newThreshold}
                          onChange={(e) => setNewThreshold(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 font-mono font-bold text-slate-800 dark:text-slate-200"
                          placeholder="5"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="price-alert-note" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Notification Note</label>
                        <input
                          id="price-alert-note"
                          name="price_alert_note"
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs p-1.5 text-slate-800 dark:text-slate-200"
                          placeholder="Custom alert note..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                    >
                      Activate Rule
                    </button>
                  </form>
                )}

                {/* AUTOMATED TIER-SPECIFIC FINANCIAL SIGNALS */}
                {/* 1. PRO AUTOMATED FINANCIAL SIGNALS (Safe Shield & Cash Runway) */}
                {(subscriptionTier === 'pro' || isAdmin) && (
                  <>
                    {/* Safe Shield Rebalance Trigger */}
                    {isSafeShieldBreached && (
                      <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                              ⚡ Pro Safe Shield Guardrail Breach
                            </span>
                            <span className="text-[9px] font-mono text-rose-500 font-bold">Priority Signal</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
                            Safe Shield ratio is <b className="text-rose-600 dark:text-rose-400">{currentSafeRatio.toFixed(1)}%</b> (below 40.0% target allocation). Rebalancing recommended to protect capital.
                          </p>
                          <button
                            onClick={() => {
                              onSelect('Tab', 'portfolio', 'portfolio');
                              setShowAlerts(false);
                            }}
                            className="mt-1.5 px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>Rebalance Now</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pro Cash Burn Runway Warning */}
                    {isRunwayWarning && totalMonthlySpend > 0 && (
                      <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              ⚡ Pro Liquid Runway Alert
                            </span>
                            <span className="text-[9px] font-mono text-amber-500 font-bold">{liquidRunwayMonths.toFixed(1)} Months</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                            Liquid reserves (₱{totalSafeVal.toLocaleString()}) cover <b className="text-amber-600 dark:text-amber-400">{liquidRunwayMonths.toFixed(1)} months</b> of current monthly expenses (₱{totalMonthlySpend.toLocaleString()}).
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 3. FREE AUTOMATED FINANCIAL SIGNALS (Budget Limit & Pro Upgrade Teaser) */}
                {subscriptionTier === 'free' && !isAdmin && (
                  <>
                    {/* Budget Cap Spend Alert */}
                    <div className={`p-3 border-b flex items-start gap-2.5 ${isBudgetWarning ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      {isBudgetWarning ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> : <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isBudgetWarning ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            🛡️ Monthly Budget Spending Status
                          </span>
                          <span className="text-[9px] font-mono font-bold">{spendRatio}% Used</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                          Spent <b>₱{totalMonthlySpend.toLocaleString()}</b> of <b>₱{totalBudgetCap.toLocaleString()}</b> budget cap.
                        </p>
                      </div>
                    </div>

                    {/* Pro Feature Lock Teaser Banner */}
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-b border-amber-500/20 flex items-start gap-2">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          🔒 Pro Feature Locked
                        </span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                          Automated Safe Shield Rebalance Alarms & Liquid Cash Runway warnings are exclusive to Pro members.
                        </p>
                        {onOpenPricing && (
                          <button
                            onClick={() => {
                              onOpenPricing();
                              setShowAlerts(false);
                            }}
                            className="mt-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-purple-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs hover:opacity-90"
                          >
                            <span>Upgrade to Pro</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 1-Click Recommended Guardrail Presets Section (Always Available) */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      1-Click Guardrail Presets
                    </span>
                    <button
                      onClick={handleAddAllPresets}
                      className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Activate all recommended guardrails at once"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add All Presets</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-left">
                    {RECOMMENDED_PRESETS.map((preset) => {
                      const active = isPresetActive(preset.asset);
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleTogglePresetAlert(preset)}
                          className={`p-2 border rounded-lg text-[10px] font-bold flex items-center justify-between gap-1 cursor-pointer transition-all ${
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                              : 'bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                          title={preset.message}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span>{preset.icon}</span>
                            <span className="truncate">{preset.label}</span>
                          </div>
                          {active ? (
                            <span className="text-[8px] font-black uppercase px-1 py-0.5 bg-emerald-600 text-white rounded shrink-0">
                              Active ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">+</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alert List Container */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center space-y-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active custom price rules triggered</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Select any preset above or click <b>Set Alert</b> to add custom market rules.
                      </p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                            alert.type === 'up'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : alert.type === 'down'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                              : alert.type === 'volatility'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                            {alert.type === 'up' && <TrendingUp className="w-3 h-3" />}
                            {alert.type === 'down' && <TrendingDown className="w-3 h-3" />}
                            {alert.type === 'volatility' && <AlertTriangle className="w-3 h-3" />}
                            <span>{alert.asset}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-mono">
                              {formatTimeAgo(alert.timestamp, alert.lastTriggeredDate)}
                            </span>
                            {onDeleteAlert && (
                              <button
                                onClick={() => onDeleteAlert(alert.id)}
                                className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Remove Alert Rule"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{alert.message}</p>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-white/5 text-[9px]">
                          {alert.thresholdPercentage !== undefined && (
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              Threshold: ±{alert.thresholdPercentage}%
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

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-1.5">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/5"
            title="Toggle Accessibility Color Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 p-4 space-y-3 animate-slide-down">
          <div className="mb-2">
            <SearchEngine assets={assets} expenses={expenses} goals={goals} budgets={budgets} onSelect={(type, id, tab) => { onSelect(type, id, tab); setMobileMenuOpen(false); }} />
          </div>

          {(canUndo || canRedo) && (
            <div className="flex items-center gap-2 py-1">
              {canUndo && (
                <button
                  onClick={() => {
                    onUndo?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                >
                  <Undo2 className="w-4 h-4 text-indigo-500" />
                  <span>Undo {undoCount > 1 ? `(${undoCount})` : ''}</span>
                </button>
              )}
              {canRedo && (
                <button
                  onClick={() => {
                    onRedo?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                >
                  <Redo2 className="w-4 h-4 text-indigo-500" />
                  <span>Redo</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-white/5 pb-2">
            <button
              onClick={() => {
                onOpenSettings('profile');
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium truncate max-w-[200px]"
            >
              Logged in: <b className="text-slate-900 dark:text-white hover:underline">{email}</b>
            </button>
            <button onClick={onOpenPricing} className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 text-[11px]">
              <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Pricing</span>
            </button>
          </div>

          <button
            onClick={() => {
              onOpenSettings('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>App Settings & Backups</span>
          </button>

          {onOpenPolicyModal && (
            <button
              onClick={() => {
                onOpenPolicyModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Terms & Privacy Policy</span>
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 border border-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Securely</span>
          </button>
        </div>
      )}
    </header>
  );
}
