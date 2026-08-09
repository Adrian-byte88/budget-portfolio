import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Shield, LogOut, User, Menu, X, Wifi, Settings, Crown, Lock } from 'lucide-react';
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
}

export default function Navbar({
  email,
  onLogout,
  darkMode,
  onToggleDarkMode,
  alerts,
  onClearAlerts,
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
}: NavbarProps) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic relative timestamp live ticker
  const [, setTimeTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimeTicker((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="hidden md:flex items-center space-x-4">
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
              title="Personal Price Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-bounce border border-white">
                  {alerts.length}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest">Personal Price Alerts</h3>
                  {alerts.length > 0 && (
                    <button
                      onClick={onClearAlerts}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No active market alerts recorded.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            alert.type === 'up'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : alert.type === 'down'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                              : alert.type === 'volatility'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                            {alert.asset}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {formatTimeAgo(alert.timestamp, alert.lastTriggeredDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{alert.message}</p>
                        {(alert.thresholdPercentage || alert.lastTriggeredDate) && (
                          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                            {alert.thresholdPercentage !== undefined && (
                              <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                Trigger: ±{alert.thresholdPercentage}%
                              </span>
                            )}
                            {alert.lastTriggeredDate && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                Triggered: {new Date(alert.lastTriggeredDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        )}
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
