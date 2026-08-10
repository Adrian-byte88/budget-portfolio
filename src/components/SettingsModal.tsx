import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Settings,
  ShieldCheck,
  Camera,
  Check,
  Moon,
  Sun,
  Bell,
  Sliders,
  Sparkles,
  Lock,
  Globe,
  Upload,
  RotateCcw,
  RefreshCw,
  FileText,
  Crown,
  Users,
  Shield,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AssetPosition, ExpenseEntry, TradeEntry, FamilyGoal, BudgetLimit } from '../types';
import ExportEngine from './ExportEngine';
import AdminUserManagement from './admin/AdminUserManagement';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  defaultTab?: 'profile' | 'preferences' | 'export';
  darkMode: boolean;
  onToggleDarkMode: () => void;
  targetAllocation: number;
  onUpdateTargetAllocation: (val: number) => void;
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  trades: TradeEntry[];
  goals: FamilyGoal[];
  budgets: BudgetLimit[];
  onUploadBackup: (importedState: any) => void;
  onExecuteSyncBackup: () => Promise<void>;
  onExecuteRestoreBackup: () => Promise<void>;
  onShowToast: (title: string, desc: string, type: 'success' | 'warning' | 'error') => void;
  subscriptionTier?: 'free' | 'pro';
  onUpdateSubscriptionTier?: (tier: 'free' | 'pro') => void;
  onOpenGCashModal?: () => void;
  isAdmin?: boolean;
  onOpenPolicyModal?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
];

export default function SettingsModal({
  isOpen,
  onClose,
  email,
  defaultTab = 'profile',
  darkMode,
  onToggleDarkMode,
  targetAllocation,
  onUpdateTargetAllocation,
  assets,
  expenses,
  trades,
  goals,
  budgets,
  onUploadBackup,
  onExecuteSyncBackup,
  onExecuteRestoreBackup,
  onShowToast,
  subscriptionTier = 'free',
  onUpdateSubscriptionTier,
  onOpenGCashModal,
  isAdmin = false,
  onOpenPolicyModal
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'export' | 'admin_users'>(defaultTab as any);

  useEffect(() => {
    setActiveTab(defaultTab as any);
  }, [defaultTab]);

  // Profile States
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem(`wealth_vault_display_name_${email}`) || email.split('@')[0] || 'User';
  });
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    return localStorage.getItem(`wealth_vault_profile_pic_${email}`) || null;
  });

  useEffect(() => {
    if (email) {
      setDisplayName(localStorage.getItem(`wealth_vault_display_name_${email}`) || email.split('@')[0] || 'User');
      setProfilePic(localStorage.getItem(`wealth_vault_profile_pic_${email}`) || null);
    }
  }, [email]);

  // Preferences States
  const [defaultCurrency, setDefaultCurrency] = useState<string>(() => {
    return localStorage.getItem('wealth_vault_default_currency') || 'PHP (₱)';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('wealth_vault_notifications');
    return val !== null ? JSON.parse(val) : true;
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('wealth_vault_auto_sync');
    return val !== null ? JSON.parse(val) : true;
  });

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`wealth_vault_display_name_${email}`, displayName);
    if (profilePic) {
      localStorage.setItem(`wealth_vault_profile_pic_${email}`, profilePic);
    } else {
      localStorage.removeItem(`wealth_vault_profile_pic_${email}`);
    }
    // Dispatch custom event so Navbar updates immediately
    window.dispatchEvent(new Event('wealth_vault_profile_updated'));
    onShowToast('Profile Updated', 'Your profile details have been saved successfully.', 'success');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast('File Too Large', 'Please select an image smaller than 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePic(result);
        localStorage.setItem(`wealth_vault_profile_pic_${email}`, result);
        window.dispatchEvent(new Event('wealth_vault_profile_updated'));
        onShowToast('Photo Updated', 'Profile picture changed successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('wealth_vault_default_currency', defaultCurrency);
    localStorage.setItem('wealth_vault_notifications', JSON.stringify(notificationsEnabled));
    localStorage.setItem('wealth_vault_auto_sync', JSON.stringify(autoSyncEnabled));
    window.dispatchEvent(new Event('wealth_vault_preferences_updated'));
    onShowToast('Preferences Saved', 'Application configuration updated.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Application Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage your profile, preference configurations, and backup sync options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Header */}
        <div className="px-6 pt-3 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/5 flex space-x-2 overflow-x-auto hide-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>App Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Backup & Export Sync</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin_users')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'admin_users'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-purple-500" />
              <span>User Directory (Admin)</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-grow bg-white dark:bg-slate-900">
          
          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <form id="settings-profile" data-highlight-id="settings-profile" onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl animate-fade-in">
              {/* Profile Avatar Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group shrink-0">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Profile Picture & Avatar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a custom picture or choose one of our verified avatar presets.
                  </p>
                  
                  {/* Avatar Presets */}
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setProfilePic(url);
                          localStorage.setItem('wealth_vault_profile_pic', url);
                          window.dispatchEvent(new Event('wealth_vault_profile_updated'));
                          onShowToast('Avatar Updated', 'Selected preset avatar.', 'success');
                        }}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                          profilePic === url ? 'border-blue-600 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePic(null);
                          localStorage.removeItem('wealth_vault_profile_pic');
                          window.dispatchEvent(new Event('wealth_vault_profile_updated'));
                          onShowToast('Avatar Reset', 'Reverted to default letter avatar.', 'warning');
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Name / Account Owner
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (Verified Account)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Account Role</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{email === 'junnelmrfl@gmail.com' ? 'Super Administrator' : 'Standard User Account'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Security Standard</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Firebase Auth 2FA Enforced</span>
                    </div>
                  </div>
                </div>

                {/* Legal & Terms Policy Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Terms of Service & Privacy Policy</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded font-bold">
                          v1.0 Agreed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        View official platform user agreement, privacy protection standards, and financial disclaimers.
                      </p>
                    </div>
                  </div>
                  {onOpenPolicyModal && (
                    <button
                      type="button"
                      onClick={onOpenPolicyModal}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      View Policies
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: APP PREFERENCES */}
          {activeTab === 'preferences' && (
            <div id="settings-preferences" data-highlight-id="settings-preferences" className="space-y-6 max-w-2xl animate-fade-in">
              
              {/* Currency Preference */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>Default Display Currency</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Primary denomination used across financial ledger cards
                    </p>
                  </div>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => {
                      setDefaultCurrency(e.target.value);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PHP (₱)">PHP (₱) — Philippine Peso</option>
                    <option value="USD ($)">USD ($) — US Dollar</option>
                    <option value="EUR (€)">EUR (€) — Euro</option>
                    <option value="JPY (¥)">JPY (¥) — Japanese Yen</option>
                  </select>
                </div>
              </div>

              {/* Safe Shield Target Allocation */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Safe Shield Allocation Target</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Minimum required liquidity ratio for safe cash reserves
                    </p>
                  </div>
                  <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                    {targetAllocation}% Target
                  </span>
                </div>

                <div className="flex items-center space-x-4 pt-1">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={targetAllocation}
                    onChange={(e) => onUpdateTargetAllocation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Theme Settings */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>Theme Appearance</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Switch between High-Contrast Dark Mode and Clean Light Canvas
                  </p>
                </div>

                <button
                  onClick={onToggleDarkMode}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              {/* Subscription Plan Status (For Users) */}
              <div className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Account Subscription Tier</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAdmin ? (
                      <b className="text-purple-600 dark:text-purple-400">Executive Admin Account — Unlimited Pro Access</b>
                    ) : subscriptionTier === 'pro' ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Active Wealth Vault Pro Member ($9.99/mo) — All Features Unlocked</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">Free Tier — Access to Summary, Ledger, Family Sync & History</span>
                    )}
                  </p>
                </div>

                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (subscriptionTier === 'free') {
                        if (onOpenGCashModal) onOpenGCashModal();
                      } else {
                        if (onUpdateSubscriptionTier) onUpdateSubscriptionTier('free');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                      subscriptionTier === 'pro'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>{subscriptionTier === 'pro' ? 'Switch to Free Tier' : 'Upgrade via GCash (₱499/mo)'}</span>
                  </button>
                )}
              </div>

              {/* Notification & Sync Toggles */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <span>Market & Budget Alerts</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Receive notifications for price movements and expense threshold breaches
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-200/60 dark:border-white/5 pt-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                      <span>Automated Cloud Sync</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Periodically push local financial records to Firestore backend
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & EXPORT SYNC (Full ExportEngine Integration) */}
          {activeTab === 'export' && (
            <div id="settings-export" data-highlight-id="settings-export" className="animate-fade-in space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Backup & Export Center:</strong> All cloud synchronization, Excel data backups, and executive audit reports are managed right here.
                </span>
              </div>

              <ExportEngine
                email={email}
                assets={assets}
                expenses={expenses}
                trades={trades}
                goals={goals}
                budgets={budgets}
                onUploadBackup={onUploadBackup}
                onExecuteSyncBackup={onExecuteSyncBackup}
                onExecuteRestoreBackup={onExecuteRestoreBackup}
              />
            </div>
          )}

          {/* TAB 4: USER DIRECTORY (ADMIN PRIVACY VIEW) */}
          {activeTab === 'admin_users' && isAdmin && (
            <AdminUserManagement
              isAdmin={isAdmin}
              onClose={onClose}
              onOpenGCashModal={onOpenGCashModal}
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold">Wealth Vault • Security Encrypted</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
}
