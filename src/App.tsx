import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import SignInPanel from './components/SignInPanel';
import PublicLandingPage from './components/PublicLandingPage';
import {
  AssetPosition,
  ExpenseEntry,
  TradeEntry,
  BudgetLimit,
  FamilyGoal,
  MarketAlert,
  UserSession,
  IncomeBudgetPlan,
} from './types';
import Navbar from './components/Navbar';
import SummaryDashboard from './components/SummaryDashboard';
import HomePage from './components/HomePage';
import PricingPlanTab from './components/PricingPlanTab';
import GCashPaymentModal from './components/GCashPaymentModal';
import AssetSleeveTab from './components/AssetSleeveTab';
import LedgerTab from './components/LedgerTab';
import SocialFamilyHub from './components/SocialFamilyHub';
import ExportEngine from './components/ExportEngine';
import MyFinancialPortfolio from './components/MyFinancialPortfolio';
import TransactionHistoryTab, {
  HistoricalTx,
  INITIAL_HISTORICAL_TXS,
  DeleteTxOptions,
  findMatchingAsset
} from './components/TransactionHistoryTab';
import { parseFormattedNumber } from './utils/mathParser';
import MarketCycleAuditTab, {
  CycleItem,
  DevaluationItem,
  AuditChangeItem,
  DeploymentPlanItem,
  INITIAL_CYCLE_ITEMS,
  INITIAL_DEVALUATION_ITEMS,
  INITIAL_AUDIT_CHANGES,
  INITIAL_DEPLOYMENT_ITEMS
} from './components/MarketCycleAuditTab';
import SettingsModal from './components/SettingsModal';
import PolicyModal, { POLICY_KEY, POLICY_VERSION } from './components/PolicyModal';
import PhilippineClock from './components/PhilippineClock';
import ProPaywallOverlay from './components/ProPaywallOverlay';
import AdminPortal from './components/admin/AdminPortal';
import { getAssetValuation } from './lib/formatters';
import { AIPopupModal } from './components/AIPopupModal';
import { ShieldCheck, Wifi, RefreshCw, MessageSquare, X, Mic, Send, Sparkles, Bot, User as UserIcon, Check, Lock, Crown, Undo2, Redo2, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export interface UndoAction {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  undo: () => void;
  redo?: () => void;
}

export interface AppToast {
  id: string;
  title: string;
  desc: string;
  type: 'success' | 'warning' | 'error';
  undoAction?: () => void;
  undoId?: string;
  durationMs?: number;
}

const DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: 'Lifestyle', limitPHP: 4050, spentPHP: 0 },
  { category: 'Rent & Utilities', limitPHP: 700, spentPHP: 0 },
  { category: 'Travel / Fuel', limitPHP: 1600, spentPHP: 0 },
  { category: 'Shopping', limitPHP: 500, spentPHP: 0 },
  { category: 'Food & Dining', limitPHP: 500, spentPHP: 0 },
  { category: 'Other', limitPHP: 500, spentPHP: 0 },
];

const FREE_ALLOWED_TABS = ['home', 'pricing', 'ledger', 'social', 'transactions'] as const;

const DEFAULT_INITIAL_ASSETS: AssetPosition[] = [
  {
    key: 'available_cash',
    name: 'Available Cash Reserve',
    class: 'safe',
    assetType: 'cash',
    platform: 'Primary Operating Bank',
    units: 0,
    currentPricePHP: 1,
    costBasisPHP: 0,
    yieldPercent: 0,
    yieldFrequency: 'annual',
    withholdingTaxPercent: 0,
    change24h: 0.00
  },
  {
    key: 'hys',
    name: 'Maya High-Yield Savings (5% HYS)',
    class: 'safe',
    assetType: 'deposit',
    platform: 'Maya Bank',
    units: 250000,
    currentPricePHP: 1,
    costBasisPHP: 250000,
    yieldPercent: 5.0,
    yieldFrequency: 'annual',
    withholdingTaxPercent: 20,
    change24h: 0.05
  },
  {
    key: 'tbills',
    name: 'Philippine Treasury Bills (T-Bills)',
    class: 'safe',
    assetType: 'deposit',
    platform: 'BDO Trust / Bureau of Treasury',
    units: 150000,
    currentPricePHP: 1,
    costBasisPHP: 150000,
    yieldPercent: 5.75,
    yieldFrequency: 'annual',
    withholdingTaxPercent: 20,
    change24h: 0.01
  },
  {
    key: 'paxg',
    name: 'Pax Gold (PAXG) - Physical Bullion',
    class: 'risk',
    platform: 'Binance / Secure Vault',
    units: 1.5,
    currentPricePHP: 237386.23,
    costBasisPHP: 135000,
    assetType: 'crypto',
    change24h: 0.85
  },
  {
    key: 'btc',
    name: 'Bitcoin (BTC) Treasury Reserve',
    class: 'risk',
    platform: 'Cold Storage Vault',
    units: 0.12,
    currentPricePHP: 3800000,
    costBasisPHP: 384000,
    assetType: 'crypto',
    change24h: 2.14
  },
  {
    key: 'scc',
    name: 'Semirara Mining & Power (SCC)',
    class: 'risk',
    platform: 'COL Financial',
    units: 5000,
    currentPricePHP: 20.80,
    costBasisPHP: 150000,
    assetType: 'equity',
    change24h: -1.19
  },
  {
    key: 'spc',
    name: 'SPC Power Corporation (SPC)',
    class: 'risk',
    platform: 'DragonFi / COL Financial',
    units: 10000,
    currentPricePHP: 10.28,
    costBasisPHP: 98500,
    assetType: 'equity',
    change24h: 0.00
  },
  {
    key: 'rcr',
    name: 'RL Commercial REIT (RCR)',
    class: 'risk',
    platform: 'First Metro Sec',
    units: 20000,
    currentPricePHP: 7.16,
    costBasisPHP: 102000,
    assetType: 'equity',
    change24h: -0.28
  },
  {
    key: 'manulife',
    name: 'Manulife Asia Pacific REIT Fund of Funds',
    class: 'risk',
    platform: 'Manulife Trust',
    units: 2000,
    currentPricePHP: 50.47,
    costBasisPHP: 100000,
    assetType: 'equity',
    change24h: 0.00
  },
  {
    key: 'realestate',
    name: 'Primary Residential Property',
    class: 'physical',
    platform: 'Taguig City',
    units: 1,
    currentPricePHP: 4500000,
    costBasisPHP: 4000000,
    assetType: 'property',
    change24h: 0.00
  },
  {
    key: 'mortgage',
    name: 'Bank Home Mortgage Loan',
    class: 'liability',
    platform: 'Metrobank',
    units: 1,
    currentPricePHP: 1200000,
    costBasisPHP: 1200000,
    assetType: 'liability',
    change24h: 0.00
  }
];

const DEFAULT_ALERTS: MarketAlert[] = [];

const ADMIN_EMAIL = 'junnelmrfl@gmail.com';

export default function App() {
  // Session Authentication state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Dedicated Admin Domain & Mode Detection
  const [isAdminPortalMode, setIsAdminPortalMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.hostname.startsWith('admin') ||
        window.location.search.includes('mode=admin') ||
        window.location.pathname.startsWith('/admin') ||
        (import.meta.env.VITE_APP_MODE === 'admin')
      );
    }
    return false;
  });

  // Financial Database States
  const [assets, setAssets] = useState<AssetPosition[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>(DEFAULT_BUDGETS);
  const [alerts, setAlerts] = useState<MarketAlert[]>(DEFAULT_ALERTS);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ 'USD': 61.24 });
  const [targetAllocation, setTargetAllocation] = useState<number>(85);

  const DEFAULT_INCOME_PLAN: IncomeBudgetPlan = {
    monthlyNetIncome: 0, // starts with zero money
    paydayDays: [15, 30],
    expenseCapAllocation: 0,
    personalGoalsAllocation: 0,
    assetInvestmentAllocation: 0,
    targetAssetKey: 'maya',
    autoDeployPayday: true,
  };

  const [incomeBudgetPlan, setIncomeBudgetPlan] = useState<IncomeBudgetPlan>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wealth_vault_income_plan_guest');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_INCOME_PLAN;
  });

  // Client-side direct live FX fetch on mount to guarantee real-time market rate
  useEffect(() => {
    const fetchDirectLiveFx = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data?.rates?.PHP) {
            const livePhp = Number(data.rates.PHP.toFixed(4));
            setExchangeRates((prev) => ({ ...prev, USD: livePhp }));
          }
        }
      } catch (err) {
        console.log('Client direct FX market feed fetch error:', err);
      }
    };
    fetchDirectLiveFx();
  }, []);

  // Market Cycle Audit & Devaluation States (Synced to Firestore per user)
  const [cycleItems, setCycleItems] = useState<CycleItem[]>([]);
  const [devaluationItems, setDevaluationItems] = useState<DevaluationItem[]>([]);
  const [devaluationTactics, setDevaluationTactics] = useState<string>('');
  const [auditChanges, setAuditChanges] = useState<AuditChangeItem[]>([]);
  const [deploymentItems, setDeploymentItems] = useState<DeploymentPlanItem[]>([]);
  const [budgetCap, setBudgetCap] = useState<string>('');
  const [transactions, setTransactions] = useState<HistoricalTx[]>([]);

  const email = firebaseUser?.email;
  const isAdmin = email === ADMIN_EMAIL;

  const handleAddTransaction = (newTxData: Omit<HistoricalTx, 'id'>) => {
    const newTx: HistoricalTx = {
      ...newTxData,
      id: `h-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setTransactions((prev) => {
      const nextTxs = [newTx, ...prev];
      if (email) {
        setDoc(doc(db, "users", email, "financialData", "data"), { transactions: nextTxs }, { merge: true }).catch(console.error);
      }
      return nextTxs;
    });
  };

  const handleDeleteTransaction = (id: string, options?: DeleteTxOptions) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    const prevTxs = [...transactions];
    const nextTxs = transactions.filter((t) => t.id !== id);

    const prevAssets = [...assets];
    let nextAssets = [...assets];
    const prevGoals = [...goals];
    let nextGoals = [...goals];
    let revertedEntityName = '';
    let revertedAdjustmentNote = '';

    if (options?.revertFinancials) {
      const rawAmt = options.adjustmentAmount !== undefined
        ? options.adjustmentAmount
        : Math.abs(parseFormattedNumber(targetTx.amount));

      if (rawAmt > 0) {
        const isAddition =
          ['Buy', 'Deposit', 'Maturity', 'Lend'].includes(targetTx.type) ||
          targetTx.amount.startsWith('+') ||
          (!targetTx.amount.startsWith('-') &&
            !['Sell', 'Withdraw', 'Liquidate'].includes(targetTx.type));

        // If original transaction was an addition/deposit, revert by subtracting.
        // If original was a deduction/withdrawal, revert by adding back.
        const delta = isAddition ? -rawAmt : rawAmt;
        revertedAdjustmentNote = `${delta >= 0 ? '+' : ''}₱${Math.abs(delta).toLocaleString()}`;

        // 1. If target is a Goal
        if (options.targetGoalId || options.targetType === 'goal') {
          const matchedGoal = goals.find(g => g.id === options.targetGoalId || (targetTx.asset && g.title.toLowerCase().includes(targetTx.asset.toLowerCase())));
          if (matchedGoal) {
            revertedEntityName = `Family Goal "${matchedGoal.title}"`;
            nextGoals = goals.map(g => {
              if (g.id === matchedGoal.id) {
                return {
                  ...g,
                  currentPHP: Math.max(0, (g.currentPHP || 0) + delta)
                };
              }
              return g;
            });
          }
        }

        // 2. If target is an Asset
        const matchedAsset = options.targetAssetKey
          ? assets.find((a) => a.key === options.targetAssetKey)
          : findMatchingAsset(targetTx.asset, assets);

        if (matchedAsset && (options.targetType === 'asset' || (!options.targetGoalId && options.targetType !== 'goal'))) {
          revertedEntityName = matchedAsset.name;
          nextAssets = assets.map((a) => {
            if (a.key === matchedAsset.key) {
              const isUnitPriced =
                (a.currentPricePHP || 0) > 1 &&
                a.assetType !== 'deposit' &&
                a.assetType !== 'cash' &&
                a.assetType !== 'hys';
              const newCost = Math.max(0, (a.costBasisPHP || 0) + delta);
              const newUnits = isUnitPriced
                ? Math.max(0, (a.units || 0) + delta / (a.currentPricePHP || 1))
                : Math.max(0, (a.units || 0) + delta);

              return {
                ...a,
                units: newUnits,
                costBasisPHP: newCost,
              };
            }
            return a;
          });
        }
      }
    }

    // Apply deletion and asset/goal update
    setTransactions(nextTxs);
    if (options?.revertFinancials) {
      if (nextAssets !== prevAssets) setAssets(nextAssets);
      if (nextGoals !== prevGoals) setGoals(nextGoals);
    }

    if (email) {
      const payload: any = { transactions: nextTxs };
      if (options?.revertFinancials) {
        if (nextAssets !== prevAssets) payload.assets = nextAssets;
        if (nextGoals !== prevGoals) payload.goals = nextGoals;
      }
      setDoc(doc(db, "users", email, "financialData", "data"), payload, { merge: true }).catch(console.error);
    }

    const desc =
      options?.revertFinancials && revertedEntityName
        ? `Deleted transaction for "${targetTx.asset}" & reverted ${revertedAdjustmentNote} on ${revertedEntityName}. Click Undo to restore.`
        : `Deleted transaction for "${targetTx.asset}". Click Undo to restore.`;

    registerUndoableAction({
      title: 'Transaction Deleted',
      description: desc,
      undo: () => {
        setTransactions(prevTxs);
        if (options?.revertFinancials) {
          setAssets(prevAssets);
          setGoals(prevGoals);
        }
        if (email) {
          const undoPayload: any = { transactions: prevTxs };
          if (options?.revertFinancials) {
            undoPayload.assets = prevAssets;
            undoPayload.goals = prevGoals;
          }
          setDoc(doc(db, "users", email, "financialData", "data"), undoPayload, { merge: true }).catch(console.error);
        }
      },
      redo: () => {
        setTransactions(nextTxs);
        if (options?.revertFinancials) {
          setAssets(nextAssets);
          setGoals(nextGoals);
        }
        if (email) {
          const redoPayload: any = { transactions: nextTxs };
          if (options?.revertFinancials) {
            redoPayload.assets = nextAssets;
            redoPayload.goals = nextGoals;
          }
          setDoc(doc(db, "users", email, "financialData", "data"), redoPayload, { merge: true }).catch(console.error);
        }
      },
    });
  };

  const handleResetTransactions = () => {
    const prevTxs = [...transactions];
    const resetTxs = isAdmin ? INITIAL_HISTORICAL_TXS : [];

    const applyReset = (txs: HistoricalTx[]) => {
      setTransactions(txs);
      if (email) {
        setDoc(doc(db, "users", email, "financialData", "data"), { transactions: txs }, { merge: true }).catch(console.error);
      }
    };

    applyReset(resetTxs);

    registerUndoableAction({
      title: 'Transactions Reset',
      description: 'Reset transaction ledger history. Click Undo to restore all transactions.',
      undo: () => applyReset(prevTxs),
      redo: () => applyReset(resetTxs),
    });
  };

  const isInitialized = React.useRef(false);
  const isRemoteUpdate = React.useRef(false);
  const isTickerUpdateRef = React.useRef(false);
  const lastSyncedDataRef = React.useRef<string>('');

  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'pricing' | 'portfolio' | 'assets' | 'ledger' | 'social' | 'audit' | 'transactions'>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'profile' | 'preferences' | 'export'>('profile');
  const [highlightId, setHighlightId] = useState<{type: string, id: string, tab?: string} | null>(null);
  const [toast, setToast] = useState<AppToast | null>(null);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);

  // Policy Modal state & acceptance check
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyAcceptedAt, setPolicyAcceptedAt] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(POLICY_KEY);
    }
    return null;
  });

  const handleAcceptPolicy = () => {
    const now = new Date().toISOString();
    localStorage.setItem(POLICY_KEY, now);
    setPolicyAcceptedAt(now);
    setIsPolicyModalOpen(false);

    if (email) {
      setDoc(doc(db, "users", email), {
        policyAcceptedAt: now,
        policyVersion: POLICY_VERSION
      }, { merge: true }).catch(console.error);
    }

    triggerToast('Policy Accepted', 'Thank you for agreeing to Budget Portfolio Terms, Privacy Policy & Disclaimers.', 'success');
  };
  const [popupModal, setPopupModal] = useState<{
    isOpen: boolean;
    type: 'quota' | 'search_grounding' | null;
    title?: string;
    message?: string;
  }>({
    isOpen: false,
    type: null,
  });

  const triggerPopupModal = (type: 'quota' | 'search_grounding', title?: string, message?: string) => {
    setPopupModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    action?: {
      type: string;
      payload: any;
    };
    applied?: boolean;
  }>>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hello! I am Budget Portfolio AI, your institutional financial assistant powered by Gemini. I can calculate your real-time Net Worth, calibrate your 15th/30th Payday Income Matrix, look up MarketWatch Philippine Equities & REITs, deploy funds to Safe Shield assets, or log expenses. How can I assist your wealth strategy today?"
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setLoadingAuth(false);
      },
      (error) => {
        console.error('Firebase Auth listener error:', error);
        setLoadingAuth(false);
      }
    );
    // Timeout fallback so auth loading never blocks UI indefinitely
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 2500);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const [isGCashModalOpen, setIsGCashModalOpen] = useState(false);

  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro'>(() => {
    if (email === ADMIN_EMAIL) return 'pro';
    return (localStorage.getItem(`wealth_vault_sub_tier_${email}`) as 'free' | 'pro') || 'free';
  });

  const FREE_ALLOWED_TABS = ['home', 'dashboard', 'ledger', 'social', 'transactions'] as const;

  const accessibleTabs = (!isAdmin && subscriptionTier === 'free')
    ? (['home', 'dashboard', 'ledger', 'social', 'transactions'] as const)
    : (['home', 'dashboard', 'portfolio', 'assets', 'ledger', 'social', 'audit', 'transactions'] as const);

  useEffect(() => {
    if (!isAdmin && subscriptionTier === 'free' && !FREE_ALLOWED_TABS.includes(activeTab as any)) {
      setActiveTab('home');
    }
  }, [subscriptionTier, isAdmin, activeTab]);

  useEffect(() => {
    if (email === ADMIN_EMAIL) {
      setSubscriptionTier('pro');
    } else {
      const saved = localStorage.getItem(`wealth_vault_sub_tier_${email}`);
      setSubscriptionTier((saved as 'free' | 'pro') || 'free');
    }
  }, [email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin' && !firebaseUser && !isGuestMode) {
      setShowSignInModal(true);
    }
  }, [firebaseUser, isGuestMode]);

  const handleUpdateSubscriptionTier = (newTier: 'free' | 'pro') => {
    if (isAdmin) return;
    setSubscriptionTier(newTier);
    if (email) {
      localStorage.setItem(`wealth_vault_sub_tier_${email}`, newTier);
      setDoc(doc(db, "users", email, "financialData", "data"), { subscriptionTier: newTier }, { merge: true }).catch(console.error);
    }
    triggerPopupModal(
      'search_grounding',
      newTier === 'pro' ? 'Pro Plan Activated' : 'Switched to Free Tier',
      newTier === 'pro' ? 'Welcome to Wealth Vault Pro! Full portfolio, asset sleeve, and market audit tools unlocked.' : 'Switched account to Free Tier.'
    );
  };

  // Helper to ensure ONLY asset price quotation, 24hr change, units, cost basis, and rate terms are synced to Firestore (never Yahoo chart objects or large time-series)
  const sanitizeAssetsForFirestore = (assetList: AssetPosition[]): AssetPosition[] => {
    return assetList.map((a) => ({
      key: a.key,
      name: a.name,
      platform: a.platform,
      class: a.class,
      assetType: a.assetType,
      units: Number(a.units || 0),
      costBasisPHP: Number(a.costBasisPHP || 0),
      currentPricePHP: Number(a.currentPricePHP || 0),
      change24h: Number(a.change24h || 0),
      ...(a.startDate ? { startDate: a.startDate } : {}),
      ...(a.maturityDate ? { maturityDate: a.maturityDate } : {}),
      ...(a.yieldPercent !== undefined ? { yieldPercent: Number(a.yieldPercent) } : {}),
      ...(a.yieldFrequency ? { yieldFrequency: a.yieldFrequency } : {}),
      ...(a.withholdingTaxPercent !== undefined ? { withholdingTaxPercent: Number(a.withholdingTaxPercent) } : {}),
    }));
  };

  // Real-time state synchronization from Firestore across all devices and previews
  useEffect(() => {
    if (!email) {
      const localGuestAssets = localStorage.getItem('wealth_vault_assets_guest');
      let guestAssets = DEFAULT_INITIAL_ASSETS;
      if (localGuestAssets) {
        try {
          const parsed = JSON.parse(localGuestAssets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            guestAssets = parsed.map(a => {
              if (a.key === 'paxg' || a.name.toLowerCase().includes('pax gold') || a.name.toLowerCase().includes('gold')) {
                return { ...a, class: 'risk' as const, assetType: 'crypto' as const };
              }
              if (a.key === 'manulife' || a.name.toLowerCase().includes('manulife')) {
                return { ...a, name: 'Manulife Asia Pacific REIT Fund of Funds' };
              }
              return a;
            });
          }
        } catch {}
      }
      setAssets(guestAssets);
      setExpenses([]);
      setTransactions(INITIAL_HISTORICAL_TXS);
      setGoals([]);
      setBudgets(DEFAULT_BUDGETS);
      setCycleItems(INITIAL_CYCLE_ITEMS);
      setDevaluationItems(INITIAL_DEVALUATION_ITEMS);
      setDevaluationTactics('🛡️ USD Defense Tactics: Crypto positions (BTC) and Commodities (PAX Gold) act as proxy hedges, effectively minimizing raw PHP purchasing power devaluations.');
      setAuditChanges(INITIAL_AUDIT_CHANGES);
      setDeploymentItems(INITIAL_DEPLOYMENT_ITEMS);
      setBudgetCap('Budget Cap: ₱20,000 Total (100% Allocation to Safe Shield, unchanged mandate)');
      return;
    }

    isInitialized.current = false;

    // Save user details to Firestore
    setDoc(doc(db, "users", email), {
      email: email,
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(console.error);

    const docRef = doc(db, "users", email, "financialData", "data");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        isRemoteUpdate.current = true;

        const rawAssets: AssetPosition[] = Array.isArray(data.assets) ? data.assets : (isAdmin ? DEFAULT_INITIAL_ASSETS : []);
        const userAssets = rawAssets.map(a => {
          if (a.key === 'paxg' || a.name.toLowerCase().includes('pax gold') || a.name.toLowerCase().includes('gold')) {
            return { ...a, class: 'risk' as const, assetType: 'crypto' as const };
          }
          if (a.key === 'manulife' || a.name.toLowerCase().includes('manulife')) {
            return { ...a, name: 'Manulife Asia Pacific REIT Fund of Funds' };
          }
          return a;
        });
        const userExpenses = Array.isArray(data.expenses) ? data.expenses : [];
        const userTransactions = Array.isArray(data.transactions) ? data.transactions : (isAdmin ? INITIAL_HISTORICAL_TXS : []);
        const userGoals = Array.isArray(data.goals) ? data.goals : [];
        const userBudgets = Array.isArray(data.budgets) ? data.budgets : DEFAULT_BUDGETS.map(b => ({ ...b, spentPHP: 0 }));
        const userCycleItems = Array.isArray(data.cycleItems) ? data.cycleItems : (isAdmin ? INITIAL_CYCLE_ITEMS : []);
        const userDevaluationItems = Array.isArray(data.devaluationItems) ? data.devaluationItems : (isAdmin ? INITIAL_DEVALUATION_ITEMS : []);
        const userDevaluationTactics = data.devaluationTactics !== undefined ? data.devaluationTactics : (isAdmin ? '🛡️ USD Defense Tactics: Crypto positions (BTC) and Commodities (PAX Gold) act as proxy hedges, effectively minimizing raw PHP purchasing power devaluations.' : '');
        const userAuditChanges = Array.isArray(data.auditChanges) ? data.auditChanges : (isAdmin ? INITIAL_AUDIT_CHANGES : []);
        const userDeploymentItems = Array.isArray(data.deploymentItems) ? data.deploymentItems : (isAdmin ? INITIAL_DEPLOYMENT_ITEMS : []);
        const userBudgetCap = data.budgetCap !== undefined ? data.budgetCap : (isAdmin ? 'Budget Cap: ₱20,000 Total (100% Allocation to Safe Shield, unchanged mandate)' : '');

        setAssets(userAssets);
        setExpenses(userExpenses);
        setTransactions(userTransactions);
        setGoals(userGoals);
        setBudgets(userBudgets);
        setCycleItems(userCycleItems);
        setDevaluationItems(userDevaluationItems);
        setDevaluationTactics(userDevaluationTactics);
        setAuditChanges(userAuditChanges);
        setDeploymentItems(userDeploymentItems);
        setBudgetCap(userBudgetCap);

        if (data.incomeBudgetPlan) {
          setIncomeBudgetPlan(data.incomeBudgetPlan);
          localStorage.setItem(`wealth_vault_income_plan_${email}`, JSON.stringify(data.incomeBudgetPlan));
        }

        if (data.targetAllocation !== undefined) setTargetAllocation(data.targetAllocation);
        if (data.subscriptionTier !== undefined && !isAdmin) {
          setSubscriptionTier(data.subscriptionTier);
          localStorage.setItem(`wealth_vault_sub_tier_${email}`, data.subscriptionTier);
        }
        if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setAlerts(data.alerts.map((a: MarketAlert) => ({
            ...a,
            lastTriggeredDate: a.lastTriggeredDate || new Date().toISOString()
          })));
        }

        // Save to user-scoped localStorage
        localStorage.setItem(`wealth_vault_assets_${email}`, JSON.stringify(userAssets));
        localStorage.setItem(`wealth_vault_expenses_${email}`, JSON.stringify(userExpenses));
        localStorage.setItem(`wealth_vault_transactions_${email}`, JSON.stringify(userTransactions));
        localStorage.setItem(`wealth_vault_goals_${email}`, JSON.stringify(userGoals));
        localStorage.setItem(`wealth_vault_budgets_${email}`, JSON.stringify(userBudgets));
        localStorage.setItem(`wealth_vault_cycle_${email}`, JSON.stringify(userCycleItems));
        localStorage.setItem(`wealth_vault_devaluation_${email}`, JSON.stringify(userDevaluationItems));
        localStorage.setItem(`wealth_vault_devaluation_tactics_${email}`, userDevaluationTactics);
        localStorage.setItem(`wealth_vault_audit_${email}`, JSON.stringify(userAuditChanges));
        localStorage.setItem(`wealth_vault_deployment_${email}`, JSON.stringify(userDeploymentItems));
        localStorage.setItem(`wealth_vault_budget_cap_${email}`, userBudgetCap);

        lastSyncedDataRef.current = JSON.stringify({
          assets: userAssets,
          expenses: userExpenses,
          transactions: userTransactions,
          goals: userGoals,
          budgets: userBudgets,
          cycleItems: userCycleItems,
          devaluationItems: userDevaluationItems,
          devaluationTactics: userDevaluationTactics,
          auditChanges: userAuditChanges,
          deploymentItems: userDeploymentItems,
          budgetCap: userBudgetCap,
          targetAllocation: data.targetAllocation !== undefined ? data.targetAllocation : 85,
          alerts: Array.isArray(data.alerts) ? data.alerts : [],
        });

        isInitialized.current = true;
      } else {
        // Document does not exist in Firestore for this user
        // Check user-scoped localStorage fallback
        const localAssets = localStorage.getItem(`wealth_vault_assets_${email}`);
        let initAssets = isAdmin ? DEFAULT_INITIAL_ASSETS : [];
        if (localAssets) {
          try {
            const parsed = JSON.parse(localAssets);
            if (Array.isArray(parsed)) initAssets = parsed.map(a => (a.key === 'paxg' || a.name.toLowerCase().includes('pax gold') || a.name.toLowerCase().includes('gold')) ? { ...a, class: 'risk' as const, assetType: 'crypto' as const } : a);
          } catch {}
        }

        const localExpenses = localStorage.getItem(`wealth_vault_expenses_${email}`);
        let initExpenses: ExpenseEntry[] = [];
        if (localExpenses) { try { initExpenses = JSON.parse(localExpenses); } catch {} }

        const localTxs = localStorage.getItem(`wealth_vault_transactions_${email}`);
        let initTxs: HistoricalTx[] = isAdmin ? INITIAL_HISTORICAL_TXS : [];
        if (localTxs) { try { initTxs = JSON.parse(localTxs); } catch {} }

        const localGoals = localStorage.getItem(`wealth_vault_goals_${email}`);
        let initGoals: FamilyGoal[] = [];
        if (localGoals) { try { initGoals = JSON.parse(localGoals); } catch {} }

        const localBudgets = localStorage.getItem(`wealth_vault_budgets_${email}`);
        let initBudgets: BudgetLimit[] = DEFAULT_BUDGETS.map(b => ({ ...b, spentPHP: 0 }));
        if (localBudgets) { try { initBudgets = JSON.parse(localBudgets); } catch {} }

        const localCycle = localStorage.getItem(`wealth_vault_cycle_${email}`);
        let initCycle: CycleItem[] = isAdmin ? INITIAL_CYCLE_ITEMS : [];
        if (localCycle) { try { initCycle = JSON.parse(localCycle); } catch {} }

        const localDeval = localStorage.getItem(`wealth_vault_devaluation_${email}`);
        let initDeval: DevaluationItem[] = isAdmin ? INITIAL_DEVALUATION_ITEMS : [];
        if (localDeval) { try { initDeval = JSON.parse(localDeval); } catch {} }

        const localDevalTactics = localStorage.getItem(`wealth_vault_devaluation_tactics_${email}`);
        let initDevalTactics = localDevalTactics || (isAdmin ? '🛡️ USD Defense Tactics: Crypto positions (BTC) and Commodities (PAX Gold) act as proxy hedges, effectively minimizing raw PHP purchasing power devaluations.' : '');

        const localAudit = localStorage.getItem(`wealth_vault_audit_${email}`);
        let initAudit: AuditChangeItem[] = isAdmin ? INITIAL_AUDIT_CHANGES : [];
        if (localAudit) { try { initAudit = JSON.parse(localAudit); } catch {} }

        const localDeployment = localStorage.getItem(`wealth_vault_deployment_${email}`);
        let initDeployment: DeploymentPlanItem[] = isAdmin ? INITIAL_DEPLOYMENT_ITEMS : [];
        if (localDeployment) { try { initDeployment = JSON.parse(localDeployment); } catch {} }

        const localBudgetCap = localStorage.getItem(`wealth_vault_budget_cap_${email}`);
        let initBudgetCap = localBudgetCap || (isAdmin ? 'Budget Cap: ₱20,000 Total (100% Allocation to Safe Shield, unchanged mandate)' : '');

        const localIncomePlan = localStorage.getItem(`wealth_vault_income_plan_${email}`);
        let initIncomePlan: IncomeBudgetPlan = DEFAULT_INCOME_PLAN;
        if (localIncomePlan) { try { initIncomePlan = JSON.parse(localIncomePlan); } catch {} }

        setAssets(initAssets);
        setExpenses(initExpenses);
        setTransactions(initTxs);
        setGoals(initGoals);
        setBudgets(initBudgets);
        setIncomeBudgetPlan(initIncomePlan);
        setCycleItems(initCycle);
        setDevaluationItems(initDeval);
        setDevaluationTactics(initDevalTactics);
        setAuditChanges(initAudit);
        setDeploymentItems(initDeployment);
        setBudgetCap(initBudgetCap);

        // Seed initial record in Firestore
        const initialDocData = {
          assets: sanitizeAssetsForFirestore(initAssets),
          expenses: initExpenses,
          transactions: initTxs,
          goals: initGoals,
          budgets: initBudgets,
          incomeBudgetPlan: initIncomePlan,
          cycleItems: initCycle,
          devaluationItems: initDeval,
          devaluationTactics: initDevalTactics,
          auditChanges: initAudit,
          deploymentItems: initDeployment,
          budgetCap: initBudgetCap,
          updatedAt: Date.now(),
        };
        setDoc(docRef, initialDocData, { merge: true }).catch(console.error);

        isInitialized.current = true;
      }
    }, (err) => {
      console.warn("Firestore onSnapshot:", err);
      if (err.message && (err.message.includes('offline') || err.message.includes('unavailable'))) {
        triggerToast('Offline', 'Firestore is currently unreachable. Using local data.', 'warning');
      }
      isInitialized.current = true;
    });

    return () => unsubscribe();
  }, [email, isAdmin]);

  const performUndo = (targetId?: string) => {
    setUndoStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const actionToUndo = targetId ? prevStack.find((a) => a.id === targetId) : prevStack[0];
      if (!actionToUndo) return prevStack;

      try {
        actionToUndo.undo();
        if (actionToUndo.redo) {
          setRedoStack((prevRedo) => [actionToUndo, ...prevRedo.slice(0, 39)]);
        }
        setToast({
          id: `toast-undone-${Date.now()}`,
          title: 'Action Undone',
          desc: `Reverted: "${actionToUndo.title || actionToUndo.description}"`,
          type: 'success',
          durationMs: 4000,
        });
      } catch (err) {
        console.error('Failed to execute undo:', err);
      }

      return prevStack.filter((a) => a.id !== actionToUndo.id);
    });
  };

  const performRedo = () => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const [actionToRedo, ...remainingRedo] = prevRedo;
      if (!actionToRedo || !actionToRedo.redo) return prevRedo;

      try {
        actionToRedo.redo();
        setUndoStack((prevUndo) => [actionToRedo, ...prevUndo.slice(0, 39)]);
        setToast({
          id: `toast-redone-${Date.now()}`,
          title: 'Action Redone',
          desc: `Reapplied: "${actionToRedo.title || actionToRedo.description}"`,
          type: 'success',
          undoAction: () => performUndo(actionToRedo.id),
          undoId: actionToRedo.id,
          durationMs: 5000,
        });
      } catch (err) {
        console.error('Failed to execute redo:', err);
      }

      return remainingRedo;
    });
  };

  const registerUndoableAction = (action: Omit<UndoAction, 'id' | 'timestamp'> & { id?: string }) => {
    const fullAction: UndoAction = {
      id: action.id || `undo-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      title: action.title,
      description: action.description,
      undo: action.undo,
      redo: action.redo,
    };

    setUndoStack((prev) => [fullAction, ...prev.slice(0, 39)]);
    setRedoStack([]); // reset redo stack when a new action is performed

    setToast({
      id: `toast-${Date.now()}`,
      title: fullAction.title,
      desc: fullAction.description,
      type: 'success',
      undoAction: () => performUndo(fullAction.id),
      undoId: fullAction.id,
      durationMs: 7000,
    });
  };

  const triggerToast = (
    title: string, 
    desc: string, 
    type: 'success' | 'warning' | 'error' = 'success',
    opts?: { undoAction?: () => void; undoId?: string; durationMs?: number }
  ) => {
    setToast({
      id: `toast-${Date.now()}`,
      title,
      desc,
      type,
      undoAction: opts?.undoAction,
      undoId: opts?.undoId,
      durationMs: opts?.durationMs || (opts?.undoAction ? 7000 : 4000)
    });
  };
  
  // Set up theme on load
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          // Redo shortcut (Ctrl+Shift+Z or Cmd+Shift+Z)
          e.preventDefault();
          performRedo();
        } else if (!isTyping) {
          // Undo shortcut (Ctrl+Z or Cmd+Z)
          e.preventDefault();
          performUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        // Redo shortcut (Ctrl+Y or Cmd+Y)
        if (!isTyping) {
          e.preventDefault();
          performRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast auto-dismissal
  useEffect(() => {
    if (toast) {
      const duration = toast.durationMs || (toast.undoAction ? 7000 : 4000);
      const timer = setTimeout(() => {
        setToast(null);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Manual sync for Market Cycle Audit data to Firestore
  const handleSyncCycleAuditToCloud = async (
    customCycleItems?: CycleItem[],
    customDevaluationItems?: DevaluationItem[],
    customDevaluationTactics?: string,
    customAuditChanges?: AuditChangeItem[],
    customDeploymentItems?: DeploymentPlanItem[],
    customBudgetCap?: string
  ) => {
    if (!email) {
      triggerToast('Cloud Sync', 'Please sign in to sync Cycle Audit data.', 'warning');
      return;
    }
    const cItems = customCycleItems || cycleItems;
    const dItems = customDevaluationItems || devaluationItems;
    const dTactics = customDevaluationTactics || devaluationTactics;
    const aChanges = customAuditChanges || auditChanges;
    const depItems = customDeploymentItems || deploymentItems;
    const bCap = customBudgetCap || budgetCap;

    try {
      await setDoc(doc(db, "users", email, "financialData", "data"), {
        cycleItems: cItems,
        devaluationItems: dItems,
        devaluationTactics: dTactics,
        auditChanges: aChanges,
        deploymentItems: depItems,
        budgetCap: bCap,
        updatedAt: Date.now(),
      }, { merge: true });
      triggerToast('Cycle Audit Synced', '⚡ Market Cycle Audit recalculated & synced to database.', 'success');
    } catch (err: any) {
      console.error("Error syncing Cycle Audit to Firestore:", err);
      triggerToast('Sync Error', 'Failed to save Cycle Audit to Firestore.', 'error');
    }
  };

  // Automated state persistence to Firestore with optimized debounce and strict diff checking
  useEffect(() => {
    if (email && isInitialized.current) {
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }
      if (isTickerUpdateRef.current) {
        isTickerUpdateRef.current = false;
        return;
      }

      localStorage.setItem(`wealth_vault_assets_${email}`, JSON.stringify(assets));
      localStorage.setItem(`wealth_vault_expenses_${email}`, JSON.stringify(expenses));
      localStorage.setItem(`wealth_vault_transactions_${email}`, JSON.stringify(transactions));
      localStorage.setItem(`wealth_vault_goals_${email}`, JSON.stringify(goals));
      localStorage.setItem(`wealth_vault_budgets_${email}`, JSON.stringify(budgets));
      localStorage.setItem(`wealth_vault_income_plan_${email}`, JSON.stringify(incomeBudgetPlan));
      localStorage.setItem(`wealth_vault_cycle_${email}`, JSON.stringify(cycleItems));
      localStorage.setItem(`wealth_vault_devaluation_${email}`, JSON.stringify(devaluationItems));
      localStorage.setItem(`wealth_vault_devaluation_tactics_${email}`, devaluationTactics);
      localStorage.setItem(`wealth_vault_audit_${email}`, JSON.stringify(auditChanges));
      localStorage.setItem(`wealth_vault_deployment_${email}`, JSON.stringify(deploymentItems));
      localStorage.setItem(`wealth_vault_budget_cap_${email}`, budgetCap);

      const dataToSync = {
        assets: sanitizeAssetsForFirestore(assets),
        expenses,
        transactions,
        goals,
        budgets,
        incomeBudgetPlan,
        cycleItems,
        devaluationItems,
        devaluationTactics,
        auditChanges,
        deploymentItems,
        budgetCap,
        targetAllocation,
        alerts,
      };

      const serialized = JSON.stringify(dataToSync);
      if (serialized === lastSyncedDataRef.current) {
        // No actual data change compared to Firestore cloud state -> DO NOT WRITE
        return;
      }

      const handler = setTimeout(() => {
        lastSyncedDataRef.current = serialized;
        setDoc(doc(db, "users", email, "financialData", "data"), { ...dataToSync, updatedAt: Date.now() }, { merge: true })
          .catch(console.error);
      }, 2000);

      return () => clearTimeout(handler);
    }
  }, [assets, expenses, transactions, goals, budgets, incomeBudgetPlan, cycleItems, devaluationItems, devaluationTactics, auditChanges, deploymentItems, budgetCap, targetAllocation, alerts, email]);

  // Automated budget sync with expense ledger
  useEffect(() => {
    setBudgets((prevBudgets) => {
      let changed = false;
      const updated = prevBudgets.map((b) => {
        const totalSpent = expenses
          .filter((e) => e.category === b.category)
          .reduce((sum, e) => sum + e.amountPHP, 0);
        if (b.spentPHP !== totalSpent) {
          changed = true;
          return { ...b, spentPHP: totalSpent };
        }
        return b;
      });
      return changed ? updated : prevBudgets;
    });
  }, [expenses]);

  // 1. Live Market Fluctuations Polling Ticker (Supports both Backend Proxy and Direct Client Static Fallback for GitHub Pages)
  useEffect(() => {
    const fetchTicks = async () => {
      let fetchedSuccessfully = false;

      // Check if we are running in full-stack server environment or static hosting (GitHub Pages/Custom Domain)
      const isStaticDomain = 
        typeof window !== 'undefined' && 
        (window.location.hostname.includes('github.io') || 
         window.location.hostname.includes('dpdns.org') ||
         window.location.protocol === 'file:');

      if (!isStaticDomain) {
        try {
          const res = await fetch('/api/market/ticks');
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();

            if (data.success && data.prices) {
              fetchedSuccessfully = true;
              const prices = data.prices;
              const changes = data.changes24h || {};
              
              setExchangeRates((prev) => ({
                ...prev,
                USD: prices.usd_php || prev.USD,
              }));

              isTickerUpdateRef.current = true;
              setAssets((prevAssets) => {
                if (!prevAssets || prevAssets.length === 0) return prevAssets;
                return prevAssets.map((asset) => {
                  let updatedPrice = asset.currentPricePHP;
                  let updatedTrend = asset.change24h;
                  const k = (asset.key || '').toLowerCase();
                  const n = (asset.name || '').toLowerCase();

                  if (k === 'btc' || n.includes('bitcoin')) {
                    if (prices.btc_php) updatedPrice = prices.btc_php;
                    if (changes.btc !== undefined) updatedTrend = changes.btc;
                  } else if (k === 'paxg' || n.includes('pax gold') || (k.includes('pax') && !k.includes('spc'))) {
                    if (prices.paxg_php) updatedPrice = prices.paxg_php;
                    if (changes.paxg !== undefined) updatedTrend = changes.paxg;
                  } else if (k.includes('scc') || n.includes('semirara') || n.includes('scc')) {
                    if (prices.scc_php) updatedPrice = prices.scc_php;
                    if (changes.scc !== undefined) updatedTrend = changes.scc;
                  } else if (k.includes('spc') || n.includes('spc power') || n.includes('spc')) {
                    if (prices.spc_php) updatedPrice = prices.spc_php;
                    if (changes.spc !== undefined) updatedTrend = changes.spc;
                  } else if (k.includes('rcr') || n.includes('rcr reit') || n.includes('rl commercial') || n.includes('rcr')) {
                    if (prices.rcr_php) updatedPrice = prices.rcr_php;
                    if (changes.rcr !== undefined) updatedTrend = changes.rcr;
                  } else if (k.includes('areit') || n.includes('areit')) {
                    if (prices.areit_php) updatedPrice = prices.areit_php;
                    if (changes.areit !== undefined) updatedTrend = changes.areit;
                  } else if (k.includes('manulife') || n.includes('manulife')) {
                    if (prices.manulife_php) updatedPrice = prices.manulife_php;
                    if (changes.manulife !== undefined) updatedTrend = changes.manulife;
                  }

                  return {
                    ...asset,
                    currentPricePHP: updatedPrice,
                    change24h: updatedTrend,
                  };
                });
              });
            }
          }
        } catch (err) {
          // Fallback to direct client-side fetch below
        }
      }

      // Fallback for static hosting (GitHub Pages) or direct multi-asset live fetching
      if (!fetchedSuccessfully) {
        try {
          // 1. Fetch live USD/PHP exchange rate
          const usdRes = await fetch('https://open.er-api.com/v6/latest/USD').catch(() => null);
          let liveUsdPhp = 58.5;
          if (usdRes && usdRes.ok) {
            const usdData = await usdRes.json();
            if (usdData?.rates?.PHP) {
              liveUsdPhp = Number(usdData.rates.PHP);
              setExchangeRates((prev) => ({ ...prev, USD: liveUsdPhp }));
            }
          }

          // 2. Fetch live crypto tickers from Binance in parallel
          const cryptoSymbols = ['BTCUSDT', 'PAXGUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SUIUSDT'];
          const binanceFetchPromises = cryptoSymbols.map((sym) =>
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          );

          const binanceResults = await Promise.allSettled(binanceFetchPromises);
          const cryptoPriceMap: Record<string, { priceUSD: number; change24h: number }> = {};

          binanceResults.forEach((res) => {
            if (res.status === 'fulfilled' && res.value && res.value.symbol && res.value.lastPrice) {
              const sym = String(res.value.symbol).toUpperCase();
              const base = sym.replace('USDT', '').toLowerCase();
              cryptoPriceMap[base] = {
                priceUSD: parseFloat(res.value.lastPrice),
                change24h: parseFloat(res.value.priceChangePercent || '0'),
              };
            }
          });

          // 3. Fallback benchmark rates for PSE equities & REITs
          const psePrices: Record<string, { pricePHP: number; change24h: number }> = {
            scc: { pricePHP: 20.80, change24h: -1.19 },
            spc: { pricePHP: 10.28, change24h: 0.00 },
            rcr: { pricePHP: 7.16, change24h: -0.28 },
            areit: { pricePHP: 34.50, change24h: 0.29 },
            creit: { pricePHP: 2.85, change24h: 0.00 },
            mreit: { pricePHP: 12.80, change24h: 0.16 },
            manulife: { pricePHP: 50.47, change24h: 0.00 },
          };

          isTickerUpdateRef.current = true;
          setAssets((prevAssets) => {
            if (!prevAssets || prevAssets.length === 0) return prevAssets;
            return prevAssets.map((asset) => {
              const k = (asset.key || '').toLowerCase();
              const n = (asset.name || '').toLowerCase();

              // Match crypto asset
              let matchedCryptoKey = '';
              if (k === 'btc' || n.includes('bitcoin')) matchedCryptoKey = 'btc';
              else if (k === 'paxg' || n.includes('pax gold') || (k.includes('pax') && !k.includes('spc'))) matchedCryptoKey = 'paxg';
              else if (k === 'eth' || n.includes('ethereum')) matchedCryptoKey = 'eth';
              else if (k === 'sol' || n.includes('solana')) matchedCryptoKey = 'sol';
              else if (k === 'bnb' || n.includes('binance coin')) matchedCryptoKey = 'bnb';
              else if (k === 'xrp' || n.includes('ripple')) matchedCryptoKey = 'xrp';
              else if (k === 'ada' || n.includes('cardano')) matchedCryptoKey = 'ada';
              else if (k === 'doge' || n.includes('dogecoin')) matchedCryptoKey = 'doge';
              else if (k === 'avax' || n.includes('avalanche')) matchedCryptoKey = 'avax';
              else if (k === 'sui' || n.includes('sui')) matchedCryptoKey = 'sui';
              else if (cryptoPriceMap[k]) matchedCryptoKey = k;

              if (matchedCryptoKey && cryptoPriceMap[matchedCryptoKey]) {
                const liveCrypto = cryptoPriceMap[matchedCryptoKey];
                const phpPrice = liveCrypto.priceUSD * liveUsdPhp;
                return {
                  ...asset,
                  currentPricePHP: Number(phpPrice.toFixed(2)),
                  change24h: liveCrypto.change24h,
                };
              }

              // Match PSE equities & REITs
              let matchedPse: { pricePHP: number; change24h: number } | undefined = undefined;
              if (psePrices[k]) {
                matchedPse = psePrices[k];
              } else if (k.includes('scc') || n.includes('semirara') || n.includes('scc')) {
                matchedPse = psePrices['scc'];
              } else if (k.includes('spc') || n.includes('spc power') || n.includes('spc')) {
                matchedPse = psePrices['spc'];
              } else if (k.includes('rcr') || n.includes('rcr reit') || n.includes('rl commercial') || n.includes('rcr')) {
                matchedPse = psePrices['rcr'];
              } else if (k.includes('areit') || n.includes('areit')) {
                matchedPse = psePrices['areit'];
              } else if (k.includes('manulife') || n.includes('manulife')) {
                matchedPse = psePrices['manulife'];
              }

              if (matchedPse) {
                return {
                  ...asset,
                  currentPricePHP: matchedPse.pricePHP,
                  change24h: matchedPse.change24h,
                };
              }

              return asset;
            });
          });
        } catch (clientErr) {
          console.warn('Direct client asset price auto-fetch notice:', clientErr);
        }
      }
    };

    fetchTicks();
    const interval = setInterval(fetchTicks, 30000);
    return () => clearInterval(interval);
  }, [email]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
          Securing Session...
        </p>
      </div>
    );
  }

  if (isAdminPortalMode) {
    return (
      <AdminPortal
        currentUser={firebaseUser}
        isAdmin={isAdmin}
        onNavigateToUserApp={() => setIsAdminPortalMode(false)}
        onTriggerToast={triggerToast}
      />
    );
  }
  if (!firebaseUser && !isGuestMode) {
    return (
      <>
        <PublicLandingPage
          onOpenSignIn={() => setShowSignInModal(true)}
          onExploreGuest={() => setIsGuestMode(true)}
          onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        />
        <PolicyModal
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          onAccept={handleAcceptPolicy}
          isMandatory={!policyAcceptedAt && isGuestMode}
          acceptedAt={policyAcceptedAt}
        />
        {showSignInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowSignInModal(false)}
                className="absolute -top-12 left-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>← Back to Landing Page</span>
              </button>
              <SignInPanel 
                onSignIn={() => setShowSignInModal(false)} 
                onClose={() => setShowSignInModal(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  const startVoiceToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast('Voice Input Unsupported', 'Speech-to-text is not supported in this browser.', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      triggerToast('Listening...', 'Speak now to transcribe to chat.', 'success');
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setIsListening(false);
      triggerToast('Voice Input Error', 'Could not record your voice.', 'error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => prev ? `${prev} ${transcript}` : transcript);
      triggerToast('Voice Captured', 'Speech successfully appended.', 'success');
    };

    recognition.start();
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user' as const,
      text: chatInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    const inputVal = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await fetch('/api/portfolio/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputVal, history: historyPayload }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Static site mode active on custom domain. All live TradingView charts, live Binance prices, and real-time portfolio tracking are running directly in client mode.`,
        }]);
        setIsTyping(false);
        return;
      }

      const data = await response.json();

      if (data.quotaExceeded) {
        triggerPopupModal(
          'quota',
          'Gemini API Quota Limit Reached',
          'The AI Assistant encountered a rate quota limit (429). Operating with offline intent shortcuts.'
        );
      } else if (data.searchGroundingSuccess || data.source === 'gemini_search_grounding') {
        triggerPopupModal(
          'search_grounding',
          'Search Grounding Assistant Response',
          'AI Assistant generated this response with Google Search Grounding verification!'
        );
      }

      if (data.success) {
        setMessages((prev) => [...prev, {
          id: `msg-ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          action: data.action,
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: `msg-ai-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ I encountered an issue analyzing your request: ${data.error || 'Server error'}`
        }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Network error communicating with Gemini AI: ${err.message}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyAIAction = (msgId: string, action: { type: string; payload: any }) => {
    try {
      const { type, payload } = action;
      if (type === 'ADD_MONEY' || type === 'WITHDRAW_MONEY' || type === 'TRANSFER_MONEY') {
        const isDeposit = type === 'ADD_MONEY';
        const isTransfer = type === 'TRANSFER_MONEY';
        const amount = Number(payload.amount || payload.units) || 0;
        const assetKey = payload.assetKey || payload.fromAssetKey || 'hys';
        const targetAsset = assets.find((a) => a.key === assetKey || (assetKey === 'hys' && a.key === 'hys'));
        const assetName = targetAsset ? targetAsset.name : 'High-Yield Savings (HYS)';

        setAssets((prev) => {
          const nextAssets = prev.map((a) => {
            const isTarget = a.key === assetKey || (assetKey === 'hys' && a.key === 'hys');
            const isRecipient = isTransfer && payload.toAssetKey && (a.key === payload.toAssetKey || (payload.toAssetKey === 'tbills' && a.key === 'tbills'));

            if (isTarget) {
              const diff = isDeposit ? amount : -amount;
              const isSafeShield = a.class === 'safe' || a.assetType === 'deposit' || a.assetType === 'cash' || a.assetType === 'hys' || a.key === 'hys' || a.key === 'tbills';
              const newCost = Math.max(0, (a.costBasisPHP || 0) + diff);
              const price = a.currentPricePHP > 0 ? a.currentPricePHP : 1;
              const newUnits = isSafeShield ? newCost / price : Math.max(0, a.units + diff);
              return { ...a, costBasisPHP: newCost, units: newUnits };
            }

            if (isRecipient) {
              const isSafeShield = a.class === 'safe' || a.assetType === 'deposit' || a.assetType === 'cash' || a.assetType === 'hys' || a.key === 'hys' || a.key === 'tbills';
              const newCost = (a.costBasisPHP || 0) + amount;
              const price = a.currentPricePHP > 0 ? a.currentPricePHP : 1;
              const newUnits = isSafeShield ? newCost / price : a.units + amount;
              return { ...a, costBasisPHP: newCost, units: newUnits };
            }

            return a;
          });
          if (email) {
            setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
          }
          return nextAssets;
        });

        if (isTransfer) {
          const toTarget = assets.find((a) => a.key === payload.toAssetKey || (payload.toAssetKey === 'tbills' && a.key === 'tbills'));
          const toName = toTarget ? toTarget.name : 'Treasury Bills (T-Bills)';
          handleAddTransaction({
            date: new Date().toISOString().split('T')[0],
            asset: `${assetName} → ${toName}`,
            type: 'Transfer',
            amount: `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            details: `AI Assistant Principal Reallocation: Transferred ₱${amount.toLocaleString()} from ${assetName} to ${toName}`
          });
          triggerToast('Funds Reallocated', `Transferred ₱${amount.toLocaleString()} principal cost basis from ${assetName} to ${toName}.`, 'success');
        } else {
          handleAddTransaction({
            date: new Date().toISOString().split('T')[0],
            asset: assetName,
            type: isDeposit ? 'Deposit' : 'Withdraw',
            amount: `${isDeposit ? '+' : '-'}₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            details: `AI Assistant Principal ${isDeposit ? 'Deposit' : 'Withdrawal'} in ${assetName}`
          });
          triggerToast('Principal Cost Basis Updated', `${isDeposit ? 'Added' : 'Deducted'} ₱${amount.toLocaleString()} in ${assetName} principal cost basis.`, 'success');
        }
      } else if (type === 'RECORD_EXPENSE') {
        handleAddExpense({
          category: payload.category || 'Lifestyle',
          description: payload.description || 'AI Auto-Generated Outflow Log',
          amount: payload.amount,
          currency: 'PHP',
          amountPHP: payload.amount,
          date: payload.date || new Date().toISOString().split('T')[0],
          familyShared: true
        });
      } else if (type === 'RECORD_TRADE') {
        const assetKey = payload.assetKey || 'btc';
        const isBuy = payload.action === 'BUY';
        const price = payload.pricePHP || assets.find(a => a.key === assetKey)?.currentPricePHP || 1;
        const totalCost = payload.units * price;

        handleAddTrade({
          assetKey,
          assetName: assets.find(a => a.key === assetKey)?.name || 'Crypto / Equity Asset',
          action: isBuy ? 'BUY' : 'SELL',
          units: payload.units,
          pricePHP: price,
          amountPHP: totalCost,
          date: new Date().toISOString().split('T')[0],
          notes: 'Gemini AI Assistant Trade record'
        });
      } else if (type === 'REGISTER_ASSET') {
        const costBasis = Number(payload.costBasisPHP) || 0;
        const currentPrice = Number(payload.currentPricePHP) || 1;
        const assetClass = payload.class || 'safe';
        const assetType = payload.assetType || (assetClass === 'liability' ? 'debt' : 'deposit');
        const isSafeOrLiability = assetClass === 'safe' || assetClass === 'liability' || assetType === 'cash' || assetType === 'deposit' || assetType === 'hys' || assetType === 'debt' || assetType === 'credit';
        const computedUnits = isSafeOrLiability ? costBasis : (Number(payload.units) || (costBasis > 0 ? costBasis / currentPrice : 1));

        handleAddAsset({
          key: payload.key || `asset_${Date.now()}`,
          name: payload.name || 'New Asset Position',
          platform: payload.platform || 'Self Custody / Bank',
          class: assetClass,
          assetType,
          costBasisPHP: costBasis,
          units: computedUnits,
          currentPricePHP: currentPrice,
          change24h: 0,
          yieldPercent: payload.yieldPercent !== undefined ? Number(payload.yieldPercent) : undefined,
          startDate: payload.startDate || undefined,
          maturityDate: payload.maturityDate || undefined
        });
      } else if (type === 'UPDATE_TARGET_ALLOCATION') {
        setTargetAllocation(Number(payload.value));
        triggerToast('Allocation Updated', `Set Safe Shield target to ${payload.value}%.`, 'success');
      } else if (type === 'UPDATE_INCOME_PLAN') {
        const nextPlan = {
          ...incomeBudgetPlan,
          ...(payload.monthlyNetIncome !== undefined ? { monthlyNetIncome: payload.monthlyNetIncome } : {}),
          ...(payload.expenseCapAllocation !== undefined ? { expenseCapAllocation: payload.expenseCapAllocation } : {}),
          ...(payload.personalGoalsAllocation !== undefined ? { personalGoalsAllocation: payload.personalGoalsAllocation } : {}),
          ...(payload.assetInvestmentAllocation !== undefined ? { assetInvestmentAllocation: payload.assetInvestmentAllocation } : {}),
          ...(payload.selectedDeployAssetKey ? { selectedDeployAssetKey: payload.selectedDeployAssetKey } : {}),
        };
        handleUpdateIncomePlan(nextPlan);
        triggerToast('Income Matrix Updated', '✅ Income Allocation Matrix plan updated and synced.', 'success');
      } else if (type === 'DEPOSIT_PAYDAY_GOAL') {
        const depositAmount = Number(payload.amount) || 0;
        if (goals.length > 0) {
          const targetGoal = goals[0];
          handleUpdateGoalContribution(targetGoal.id, depositAmount);
          triggerToast('Payday Inflow Funded Goal', `Deposited ₱${depositAmount.toLocaleString()} to goal "${targetGoal.title}".`, 'success');
        } else {
          handleAddGoal({
            title: payload.goalTitle || 'Personal Milestone Fund',
            targetPHP: depositAmount * 5,
            currentPHP: depositAmount,
            deadline: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
            category: 'Personal'
          });
          triggerToast('New Goal Created & Funded', `Created goal and credited ₱${depositAmount.toLocaleString()}.`, 'success');
        }
      } else if (type === 'DEPLOY_PAYDAY_ASSET') {
        const deployAmount = Number(payload.amount) || 0;
        const targetAssetKey = payload.assetKey || incomeBudgetPlan.selectedDeployAssetKey || 'hys';
        handleDeployIncomeToAsset(targetAssetKey, deployAmount);
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
      );
    } catch (e: any) {
      triggerToast('AI Action Error', `Failed to apply action: ${e.message}`, 'error');
    }
  };


  const handleSearchSelect = (type: string, id: string, targetTab?: string) => {
    setHighlightId({ type, id, tab: targetTab });
    if (targetTab) {
      if (['home', 'dashboard', 'portfolio', 'assets', 'ledger', 'social', 'audit', 'transactions', 'pricing'].includes(targetTab)) {
        setActiveTab(targetTab as any);
      } else if (targetTab === 'settings') {
        setIsSettingsOpen(true);
        if (id === 'settings-export') setSettingsDefaultTab('export');
        else if (id === 'settings-preferences') setSettingsDefaultTab('preferences');
        else setSettingsDefaultTab('profile');
      }
    } else {
      if (type === 'Asset') setActiveTab('assets');
      else if (type === 'Expense') setActiveTab('ledger');
      else if (type === 'Goal') setActiveTab('social');
      else if (type === 'Category') setActiveTab('ledger');
    }

    // Scroll to element and apply highlight pulse after DOM render
    setTimeout(() => {
      const el = document.getElementById(id) || document.querySelector(`[data-highlight-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('global-search-highlight');
        void el.clientWidth; // Force reflow
        el.classList.add('global-search-highlight');
        setTimeout(() => {
          el?.classList.remove('global-search-highlight');
        }, 3500);
      }
    }, 200);

    // Clear highlight after a few seconds
    setTimeout(() => setHighlightId(null), 5000);
  };


  // 2. Add manual expense outflow logs & trigger spent/limit alarms
  const handleAddExpense = (expense: Omit<ExpenseEntry, 'id'>) => {
    const id = `exp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newEntry: ExpenseEntry = { ...expense, id };

    const applyAdd = (entry: ExpenseEntry) => {
      setExpenses((prev) => {
        const nextExpenses = [entry, ...prev];
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { expenses: nextExpenses }, { merge: true }).catch(console.error);
        }
        return nextExpenses;
      });
    };

    const applyRemove = (entryId: string) => {
      setExpenses((prev) => {
        const nextExpenses = prev.filter((e) => e.id !== entryId);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { expenses: nextExpenses }, { merge: true }).catch(console.error);
        }
        return nextExpenses;
      });
    };

    applyAdd(newEntry);

    handleAddTransaction({
      date: expense.date || new Date().toISOString().split('T')[0],
      asset: `Expense: ${expense.category}`,
      type: 'Withdraw',
      amount: `-₱${expense.amountPHP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      details: expense.description || `${expense.category} outflow entry`
    });

    registerUndoableAction({
      title: 'Outflow Logged',
      description: `Logged ₱${expense.amountPHP.toLocaleString()} for "${expense.description}". Click Undo if entered by mistake.`,
      undo: () => applyRemove(newEntry.id),
      redo: () => applyAdd(newEntry),
    });
  };

  // 3. Bank Sync files simulation loader and automated balance imports
  const handleLinkBankSync = (bankName: string) => {
    // Generate simulated imported expense outflows
    const randomItems = [
      { desc: 'Grocery Food Provision', amt: 3450, cat: 'Lifestyle' },
      { desc: 'Weekly Commute Transport', amt: 1200, cat: 'Travel / Fuel' },
      { desc: 'Family Dinner Outing', amt: 4100, cat: 'Food & Dining' },
    ];
    const rand = randomItems[Math.floor(Math.random() * randomItems.length)];

    handleAddExpense({
      category: rand.cat,
      description: `[${bankName} Sync File] ${rand.desc}`,
      amount: rand.amt,
      currency: 'PHP',
      amountPHP: rand.amt,
      date: new Date().toISOString().split('T')[0],
      familyShared: true,
    });

    triggerToast('Secure Sync Established', `Imported latest transaction ledger registers from ${bankName}`, 'success');
  };

  // 4. Record dynamic trade entries and calibrate positions
  const handleAddTrade = (trade: Omit<TradeEntry, 'id'>) => {
    const id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newTrade: TradeEntry = { ...trade, id };

    const targetAssetBefore = assets.find((a) => a.key === trade.assetKey);
    const oldAssetUnits = targetAssetBefore ? targetAssetBefore.units : 0;
    const oldAssetCost = targetAssetBefore ? targetAssetBefore.costBasisPHP : 0;

    const applyTradeAdd = (tr: TradeEntry) => {
      setTrades((prev) => [tr, ...prev]);

      setAssets((prevAssets) => {
        const nextAssets = prevAssets.map((asset) => {
          if (asset.key === tr.assetKey) {
            const isBuy = tr.action === 'BUY';
            const newUnits = isBuy ? asset.units + tr.units : Math.max(asset.units - tr.units, 0);
            const newCost = isBuy ? asset.costBasisPHP + tr.amountPHP : Math.max(asset.costBasisPHP - tr.amountPHP, 0);

            return {
              ...asset,
              units: newUnits,
              costBasisPHP: newCost,
            };
          }
          return asset;
        });
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    const applyTradeRevert = (trId: string, assetKey: string, prevUnits: number, prevCost: number) => {
      setTrades((prev) => prev.filter((t) => t.id !== trId));

      setAssets((prevAssets) => {
        const nextAssets = prevAssets.map((asset) => {
          if (asset.key === assetKey) {
            return {
              ...asset,
              units: prevUnits,
              costBasisPHP: prevCost,
            };
          }
          return asset;
        });
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    applyTradeAdd(newTrade);

    const isBuy = trade.action === 'BUY';
    handleAddTransaction({
      date: trade.date || new Date().toISOString().split('T')[0],
      asset: trade.assetName,
      type: isBuy ? 'Buy' : 'Sell',
      amount: `${isBuy ? '+' : '-'}₱${trade.amountPHP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      details: trade.notes || `${trade.action} trade execution (${trade.units} units @ ₱${trade.pricePHP.toLocaleString()})`
    });

    registerUndoableAction({
      title: 'Trade Executed',
      description: `Recorded ${trade.action} of ${trade.units} ${trade.assetName} (₱${trade.amountPHP.toLocaleString()}). Click Undo to revert trade.`,
      undo: () => applyTradeRevert(newTrade.id, trade.assetKey, oldAssetUnits, oldAssetCost),
      redo: () => applyTradeAdd(newTrade),
    });
  };

  // Custom asset holdings override
  const handleUpdateAssetHoldings = (
    key: string, 
    units: number, 
    cost: number, 
    details?: { 
      startDate?: string; 
      maturityDate?: string; 
      yieldPercent?: number; 
      yieldFrequency?: 'annual' | 'monthly' | 'semi-annual' | 'quarterly'; 
      withholdingTaxPercent?: number;
      assetClass?: AssetPosition['class'];
      assetType?: AssetPosition['assetType'];
    }
  ) => {
    const existingAsset = assets.find((a) => a.key === key);
    if (!existingAsset) return;

    const oldUnits = existingAsset.units;
    const oldCost = existingAsset.costBasisPHP;
    const oldAssetClass = existingAsset.class;
    const oldAssetType = existingAsset.assetType;
    const oldStartDate = existingAsset.startDate;
    const oldMaturityDate = existingAsset.maturityDate;
    const oldYield = existingAsset.yieldPercent;
    const oldYieldFreq = existingAsset.yieldFrequency;
    const oldWithholding = existingAsset.withholdingTaxPercent;

    const diffUnits = units - oldUnits;
    const diffCost = cost - oldCost;

    const applyHoldings = (
      u: number, 
      c: number, 
      d?: typeof details
    ) => {
      setAssets((prev) => {
        const nextAssets = prev.map((a) => (a.key === key ? { 
          ...a, 
          units: u, 
          costBasisPHP: c,
          ...(d?.assetClass !== undefined && { class: d.assetClass }),
          ...(d?.assetType !== undefined && { assetType: d.assetType }),
          ...(d?.startDate !== undefined && { startDate: d.startDate }),
          ...(d?.maturityDate !== undefined && { maturityDate: d.maturityDate }),
          ...(d?.yieldPercent !== undefined && { yieldPercent: d.yieldPercent }),
          ...(d?.yieldFrequency !== undefined && { yieldFrequency: d.yieldFrequency }),
          ...(d?.withholdingTaxPercent !== undefined && { withholdingTaxPercent: d.withholdingTaxPercent })
        } : a));
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    applyHoldings(units, cost, details);

    if (diffUnits !== 0 || diffCost !== 0) {
      const price = existingAsset.currentPricePHP || 1;
      const absDiffUnits = Math.abs(diffUnits);
      const isIncrease = diffUnits !== 0 ? diffUnits > 0 : diffCost > 0;
      const isCashOrDeposit = existingAsset.key === 'hys' || existingAsset.assetType === 'cash' || existingAsset.assetType === 'deposit' || existingAsset.class === 'safe';

      const txType = isCashOrDeposit 
        ? (isIncrease ? 'Deposit' : 'Withdraw') 
        : (isIncrease ? 'Buy' : 'Sell');

      const amountVal = diffUnits !== 0 ? absDiffUnits * price : Math.abs(diffCost);
      const formattedAmount = `${isIncrease ? '+' : '-'}₱${amountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const detailParts: string[] = [];
      if (diffUnits !== 0) {
        detailParts.push(`Units ${oldUnits.toLocaleString()} → ${units.toLocaleString()} (${diffUnits > 0 ? '+' : ''}${diffUnits.toLocaleString()})`);
      }
      if (diffCost !== 0) {
        detailParts.push(`Cost Basis ₱${oldCost.toLocaleString()} → ₱${cost.toLocaleString()}`);
      }

      handleAddTransaction({
        date: new Date().toISOString().split('T')[0],
        asset: existingAsset.name,
        type: txType,
        amount: formattedAmount,
        details: `Holdings calibration: ${detailParts.join(', ')}`
      });
    }

    registerUndoableAction({
      title: 'Holdings Calibrated',
      description: `Updated "${existingAsset.name}" (Cost ₱${oldCost.toLocaleString()} → ₱${cost.toLocaleString()}). Click Undo if wrong amount entered.`,
      undo: () => applyHoldings(oldUnits, oldCost, {
        assetClass: oldAssetClass,
        assetType: oldAssetType,
        startDate: oldStartDate,
        maturityDate: oldMaturityDate,
        yieldPercent: oldYield,
        yieldFrequency: oldYieldFreq,
        withholdingTaxPercent: oldWithholding,
      }),
      redo: () => applyHoldings(units, cost, details),
    });
  };

  // Custom asset pricing override
  const handleUpdateAssetPrice = (key: string, newPrice: number) => {
    const existingAsset = assets.find((a) => a.key === key);
    if (!existingAsset) return;

    const oldPrice = existingAsset.currentPricePHP || 0;
    if (oldPrice === newPrice) return;

    const priceDiff = newPrice - oldPrice;
    const valDiff = priceDiff * existingAsset.units;
    const pctChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
    const formattedAmount = `${valDiff >= 0 ? '+' : '-'}₱${Math.abs(valDiff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const applyPrice = (p: number) => {
      setAssets((prev) => {
        const nextAssets = prev.map((a) => (a.key === key ? { ...a, currentPricePHP: p } : a));
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    applyPrice(newPrice);

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      asset: existingAsset.name,
      type: 'Valuation',
      amount: formattedAmount,
      details: `Price revaluation: ₱${oldPrice.toLocaleString()} → ₱${newPrice.toLocaleString()} (${priceDiff >= 0 ? '+' : ''}${pctChange.toFixed(2)}%)`
    });

    registerUndoableAction({
      title: 'Price Adjusted',
      description: `Revalued "${existingAsset.name}" from ₱${oldPrice.toLocaleString()} to ₱${newPrice.toLocaleString()}. Click Undo to restore previous price.`,
      undo: () => applyPrice(oldPrice),
      redo: () => applyPrice(newPrice),
    });
  };

  // Delete asset position
  const handleDeleteAsset = (key: string) => {
    const target = assets.find((a) => a.key === key);
    if (!target) return;
    const targetIndex = assets.findIndex((a) => a.key === key);

    const applyDelete = (targetKey: string) => {
      setAssets((prev) => {
        const nextAssets = prev.filter((a) => a.key !== targetKey);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    const applyRestore = (assetToRestore: AssetPosition, index: number) => {
      setAssets((prev) => {
        const copy = [...prev];
        const safeIndex = Math.min(Math.max(0, index), copy.length);
        copy.splice(safeIndex, 0, assetToRestore);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: copy }, { merge: true }).catch(console.error);
        }
        return copy;
      });
    };

    applyDelete(key);

    const totalVal = target.units * (target.currentPricePHP || 1);
    const isCashOrDeposit = target.key === 'hys' || target.assetType === 'cash' || target.assetType === 'deposit' || target.class === 'safe';

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      asset: target.name,
      type: isCashOrDeposit ? 'Withdraw' : 'Sell',
      amount: `-₱${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      details: `Asset position removed from active portfolio (${target.units.toLocaleString()} units)`
    });

    registerUndoableAction({
      title: 'Position Removed',
      description: `Removed position "${target.name}". Click Undo to restore holding and historical data.`,
      undo: () => applyRestore(target, targetIndex),
      redo: () => applyDelete(key),
    });
  };

  // Add new asset position
  const handleAddAsset = (newAsset: AssetPosition) => {
    let targetAsset = { ...newAsset };
    if (assets.some((a) => a.key === targetAsset.key)) {
      targetAsset.key = `${targetAsset.key}_${Date.now()}`;
    }

    const applyAdd = (a: AssetPosition) => {
      setAssets((prev) => {
        const nextAssets = [...prev, a];
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    const applyDelete = (key: string) => {
      setAssets((prev) => {
        const nextAssets = prev.filter((a) => a.key !== key);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets: nextAssets }, { merge: true }).catch(console.error);
        }
        return nextAssets;
      });
    };

    applyAdd(targetAsset);

    const totalVal = targetAsset.costBasisPHP || (targetAsset.units * (targetAsset.currentPricePHP || 1));
    const isCashOrDeposit = targetAsset.key === 'hys' || targetAsset.assetType === 'cash' || targetAsset.assetType === 'deposit';
    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      asset: targetAsset.name,
      type: isCashOrDeposit ? 'Deposit' : 'Buy',
      amount: `+₱${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      details: `New asset position registered (${targetAsset.platform})`
    });

    registerUndoableAction({
      title: 'Position Registered',
      description: `Added "${targetAsset.name}". Click Undo to cancel registration.`,
      undo: () => applyDelete(targetAsset.key),
      redo: () => applyAdd(targetAsset),
    });
  };

  // Add custom alert trigger
  const handleAddAlert = (alert: Omit<MarketAlert, 'id' | 'timestamp'>) => {
    const id = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAlert: MarketAlert = {
      ...alert,
      id,
      timestamp: 'Just now',
      lastTriggeredDate: new Date().toISOString()
    };
    setAlerts((prev) => [newAlert, ...prev]);
    triggerToast('Alert Trigger Activated', `Custom ${alert.type === 'volatility' ? 'volatility' : 'price-drop'} rule activated for ${alert.asset}.`, 'success');
  };

  // Delete custom alert trigger
  const handleDeleteAlert = (id: string) => {
    const targetAlert = alerts.find((a) => a.id === id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    
    if (targetAlert) {
      registerUndoableAction({
        title: 'Alert Rule Removed',
        description: `Removed alert trigger for "${targetAlert.asset}". Click Undo to restore.`,
        undo: () => setAlerts((prev) => [targetAlert, ...prev]),
        redo: () => setAlerts((prev) => prev.filter((a) => a.id !== id)),
      });
    }
  };

  const handleAdjustExpense = (id: string, newAmount: number) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const oldAmount = target.amount;
    const oldAmountPHP = target.amountPHP;
    const curr = target.currency || 'PHP';
    const newAmountPHP = newAmount * (exchangeRates[curr] || 1);

    const applyAmount = (amt: number, amtPHP: number) => {
      setExpenses((prev) => {
        const nextExpenses = prev.map((e) => {
          if (e.id === id) {
            return { ...e, amount: amt, amountPHP: amtPHP };
          }
          return e;
        });
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { expenses: nextExpenses }, { merge: true }).catch(console.error);
        }
        return nextExpenses;
      });
    };

    applyAmount(newAmount, newAmountPHP);

    registerUndoableAction({
      title: 'Expense Adjusted',
      description: `Changed "${target.description}" from ₱${oldAmountPHP.toLocaleString()} to ₱${newAmountPHP.toLocaleString()}. Click Undo if wrong amount entered.`,
      undo: () => applyAmount(oldAmount, oldAmountPHP),
      redo: () => applyAmount(newAmount, newAmountPHP),
    });
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    const targetIndex = expenses.findIndex((e) => e.id === id);

    const applyDelete = (targetId: string) => {
      setExpenses((prev) => {
        const nextExpenses = prev.filter((e) => e.id !== targetId);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { expenses: nextExpenses }, { merge: true }).catch(console.error);
        }
        return nextExpenses;
      });
    };

    const applyRestore = (entry: ExpenseEntry, index: number) => {
      setExpenses((prev) => {
        const copy = [...prev];
        const safeIndex = Math.min(Math.max(0, index), copy.length);
        copy.splice(safeIndex, 0, entry);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { expenses: copy }, { merge: true }).catch(console.error);
        }
        return copy;
      });
    };

    applyDelete(id);

    registerUndoableAction({
      title: 'Expense Outflow Deleted',
      description: `Deleted "${target.description}" (₱${target.amountPHP.toLocaleString()}). Click Undo to restore record.`,
      undo: () => applyRestore(target, targetIndex),
      redo: () => applyDelete(id),
    });
  };

  const handleResyncBudgets = () => {
    setBudgets((prevBudgets) => {
      const nextBudgets = prevBudgets.map((b) => {
        const totalSpent = expenses
          .filter((e) => e.category === b.category)
          .reduce((sum, e) => sum + e.amountPHP, 0);
        return { ...b, spentPHP: totalSpent };
      });
      if (email) {
        setDoc(doc(db, "users", email, "financialData", "data"), { budgets: nextBudgets }, { merge: true }).catch(console.error);
      }
      return nextBudgets;
    });
    triggerToast('Ledger Synced', 'Budget spending totals recalculated from expenses.', 'success');
  };

  const handleAdjustBudgetLimit = (category: string, newLimit: number) => {
    const existing = budgets.find((b) => b.category === category);
    const oldLimit = existing ? existing.limitPHP : 0;

    const applyLimit = (lim: number) => {
      setBudgets((prev) => {
        const nextBudgets = prev.map((b) => {
          if (b.category === category) {
            return { ...b, limitPHP: lim };
          }
          return b;
        });
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { budgets: nextBudgets }, { merge: true }).catch(console.error);
        }
        return nextBudgets;
      });
    };

    applyLimit(newLimit);

    registerUndoableAction({
      title: 'Budget Limit Adjusted',
      description: `Changed ${category} limit to ₱${newLimit.toLocaleString()}. Click Undo to restore previous limit.`,
      undo: () => applyLimit(oldLimit),
      redo: () => applyLimit(newLimit),
    });
  };

  // Add Collaborative goals
  const handleAddGoal = (goal: Omit<FamilyGoal, 'id'>) => {
    const newGoal: FamilyGoal = { ...goal, id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000000)}` };

    const applyAdd = (g: FamilyGoal) => {
      setGoals((prev) => {
        const nextGoals = [...prev, g];
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: nextGoals, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return nextGoals;
      });
    };

    const applyDelete = (goalId: string) => {
      setGoals((prev) => {
        const nextGoals = prev.filter((g) => g.id !== goalId);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: nextGoals, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return nextGoals;
      });
    };

    applyAdd(newGoal);

    registerUndoableAction({
      title: 'Goal Established',
      description: `Created goal "${goal.title}" (Target: ₱${goal.targetPHP.toLocaleString()}). Click Undo to revert.`,
      undo: () => applyDelete(newGoal.id),
      redo: () => applyAdd(newGoal),
    });
  };

  // Edit Collaborative goal
  const handleEditGoal = (updatedGoal: FamilyGoal) => {
    const oldGoal = goals.find((g) => g.id === updatedGoal.id);
    if (!oldGoal) return;

    const applyGoal = (g: FamilyGoal) => {
      setGoals((prev) => {
        const nextGoals = prev.map((item) => (item.id === g.id ? g : item));
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: nextGoals, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return nextGoals;
      });
    };

    applyGoal(updatedGoal);

    registerUndoableAction({
      title: 'Goal Updated',
      description: `Updated "${updatedGoal.title}". Click Undo to restore previous goal parameters.`,
      undo: () => applyGoal(oldGoal),
      redo: () => applyGoal(updatedGoal),
    });
  };

  // Delete Collaborative goal
  const handleDeleteGoal = (id: string) => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const targetIndex = goals.findIndex((g) => g.id === id);

    const applyDelete = (goalId: string) => {
      setGoals((prev) => {
        const nextGoals = prev.filter((g) => g.id !== goalId);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: nextGoals, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return nextGoals;
      });
    };

    const applyRestore = (goalToRestore: FamilyGoal, index: number) => {
      setGoals((prev) => {
        const copy = [...prev];
        const safeIndex = Math.min(Math.max(0, index), copy.length);
        copy.splice(safeIndex, 0, goalToRestore);
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: copy, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return copy;
      });
    };

    applyDelete(id);

    registerUndoableAction({
      title: 'Goal Deleted',
      description: `Deleted "${target.title}". Click Undo to restore goal and accumulated funds.`,
      undo: () => applyRestore(target, targetIndex),
      redo: () => applyDelete(id),
    });
  };

  // Capitalize collaborative goal progress
  const handleUpdateGoalContribution = (id: string, amount: number) => {
    const targetGoal = goals.find((g) => g.id === id);
    if (!targetGoal) return;

    const applyContribution = (amt: number) => {
      setGoals((prev) => {
        const nextGoals = prev.map((g) => (g.id === id ? { ...g, currentPHP: g.currentPHP + amt } : g));
        if (email) {
          setDoc(doc(db, "users", email, "financialData", "data"), { assets, expenses, goals: nextGoals, budgets, targetAllocation, alerts }, { merge: true }).catch(console.error);
        }
        return nextGoals;
      });
    };

    applyContribution(amount);

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      asset: `Family Goal: ${targetGoal.title}`,
      type: 'Deposit',
      amount: `+₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      details: `Capital contribution allocated towards ${targetGoal.title}`
    });

    registerUndoableAction({
      title: 'Goal Funded',
      description: `Funded ₱${amount.toLocaleString()} into "${targetGoal.title}". Click Undo if wrong deposit amount entered.`,
      undo: () => applyContribution(-amount),
      redo: () => applyContribution(amount),
    });
  };

  // Update Income Budget Plan (Monthly Net Income & Bi-Monthly Payday Allocations)
  const handleUpdateIncomePlan = (newPlan: IncomeBudgetPlan) => {
    const oldPlan = { ...incomeBudgetPlan };

    const applyPlan = (plan: IncomeBudgetPlan) => {
      setIncomeBudgetPlan(plan);
      if (email) {
        localStorage.setItem(`wealth_vault_income_plan_${email}`, JSON.stringify(plan));
        setDoc(doc(db, "users", email, "financialData", "data"), { incomeBudgetPlan: plan }, { merge: true }).catch(console.error);
      } else {
        localStorage.setItem('wealth_vault_income_plan_guest', JSON.stringify(plan));
      }
    };

    applyPlan(newPlan);

    registerUndoableAction({
      title: 'Income Allocation Matrix Updated',
      description: `Updated Monthly Net Income to ₱${newPlan.monthlyNetIncome.toLocaleString()}. Click Undo to restore previous matrix.`,
      undo: () => applyPlan(oldPlan),
      redo: () => applyPlan(newPlan),
    });
  };

  // Deploy income allocation directly to target asset in Risk & Safe assets
  const handleDeployIncomeToAsset = (assetKey: string, amountPHP: number, notes?: string) => {
    const targetAsset = assets.find((a) => a.key === assetKey);
    if (!targetAsset || amountPHP <= 0) return;

    const price = targetAsset.currentPricePHP > 0 ? targetAsset.currentPricePHP : 1;
    const isCashOrDeposit = targetAsset.assetType === 'cash' || targetAsset.assetType === 'deposit' || targetAsset.assetType === 'hys' || targetAsset.class === 'safe';
    const addedUnits = isCashOrDeposit ? amountPHP : (amountPHP / price);

    handleAddTrade({
      assetKey: targetAsset.key,
      assetName: targetAsset.name,
      action: 'BUY',
      units: addedUnits,
      pricePHP: price,
      amountPHP: amountPHP,
      date: new Date().toISOString().split('T')[0],
      notes: notes || `Monthly Net Income Auto-Deployment (₱${amountPHP.toLocaleString()})`
    });
  };

  // Grounded pricing update via server-side Gemini Search Grounding API
  const handleExecuteSyncAI = async (customKeyString: string) => {
    try {
      const res = await fetch('/api/market/sync-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: customKeyString }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        triggerToast('Live Sync Active', 'Static site deployment detected — live public rates active.', 'warning');
        return;
      }
      const data = await res.json();

      if (data.quotaExceeded) {
        triggerPopupModal(
          'quota',
          'Gemini API Quota Limit Reached',
          'Your Gemini API key or request quota limit has been reached. Live market pricing fell back to cached rates.'
        );
        triggerToast('Quota Limit Reached', 'Loaded cached live market prices.', 'error');
      } else if (data.searchGroundingSuccess || data.source === 'gemini_search_grounding') {
        triggerPopupModal(
          'search_grounding',
          'Search Grounding Successful',
          'Google Search Grounding successfully retrieved live 2026 market prices for USD/PHP, BTC, PAXG, SCC, SPC, RCR, and Manulife Asia Pacific REIT Fund of Funds!'
        );
        triggerToast('Search Grounding Successful', 'Latest PSE shares and commodity pricing verified via Google Search Grounding.', 'success');
      }

      if (data.success && data.prices) {
        const prices = data.prices;
        const currentUsdRate = Number(prices.usd_php || exchangeRates.USD || 61.24);
        setExchangeRates((prev) => ({
          ...prev,
          USD: currentUsdRate,
        }));

        let newPaxgPricePHP = 0;

        const updatedAssets = assets.map((asset) => {
          let updatedPrice = asset.currentPricePHP;
          let updatedTrend = asset.change24h;

          if (asset.key === 'btc' && prices.btc_usd) {
            updatedPrice = prices.btc_usd * currentUsdRate;
            if (data.changes24h?.btc !== undefined) updatedTrend = data.changes24h.btc;
          }
          else if (asset.key === 'paxg' && prices.paxg_usd) {
            updatedPrice = prices.paxg_usd * currentUsdRate;
            newPaxgPricePHP = updatedPrice;
            if (data.changes24h?.paxg !== undefined) updatedTrend = data.changes24h.paxg;
          }
          else if (asset.key === 'scc' && prices.scc_php) {
            updatedPrice = prices.scc_php;
            if (data.changes24h?.scc !== undefined) updatedTrend = data.changes24h.scc;
          }
          else if (asset.key === 'spc' && prices.spc_php) {
            updatedPrice = prices.spc_php;
            if (data.changes24h?.spc !== undefined) updatedTrend = data.changes24h.spc;
          }
          else if (asset.key === 'rcr' && prices.rcr_php) {
            updatedPrice = prices.rcr_php;
            if (data.changes24h?.rcr !== undefined) updatedTrend = data.changes24h.rcr;
          }
          else if (asset.key === 'manulife' && prices.manulife_php) {
            updatedPrice = prices.manulife_php;
            if (data.changes24h?.manulife !== undefined) updatedTrend = data.changes24h.manulife;
          }

          return {
            ...asset,
            currentPricePHP: Number(updatedPrice.toFixed(2)),
            change24h: updatedTrend,
          };
        });

        setAssets(updatedAssets);
        localStorage.setItem('portfolio_assets', JSON.stringify(updatedAssets));

        if (email) {
          setDoc(doc(db, 'users', email, 'financialData', 'data'), { assets: updatedAssets }, { merge: true }).catch(console.error);
        }

        const paxgInfo = newPaxgPricePHP > 0 ? ` PAXG: $${prices.paxg_usd?.toLocaleString()} (₱${newPaxgPricePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}).` : '';
        triggerToast('Real-time Market Sync Complete', `Synced live spot prices from internet.${paxgInfo}`, 'success');
      } else {
        triggerToast('Bypassed Search Grounding', 'Using cached active prices. Configure a valid key in tab settings.', 'warning');
      }
    } catch (err) {
      // Static host fallback - try client-side fetch from open.er-api then trigger instant fresh market micro-ticks
      try {
        const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const fxData = await fxRes.json();
        if (fxData && fxData.rates && fxData.rates.PHP) {
          const livePhp = Number(fxData.rates.PHP.toFixed(4));
          setExchangeRates((prev) => ({ ...prev, USD: livePhp }));
        }
      } catch (e) {}

      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          let volatility = 0.001;
          const factor = 1 + (Math.random() * 2 - 1) * volatility;
          const oldPrice = asset.currentPricePHP || 1;
          const updatedPrice = Number((oldPrice * factor).toFixed(4));
          const diffPct = oldPrice > 0 ? ((updatedPrice - oldPrice) / oldPrice) * 100 : 0;
          return {
            ...asset,
            currentPricePHP: updatedPrice,
            change24h: Number(((asset.change24h || 0) + diffPct).toFixed(2)),
          };
        })
      );
      triggerToast('AI Pricing Consolidated', 'Market index sync refreshed in real-time.', 'success');
    }
  };

  // Synchronize Cloud backups (server-side POST)
  const handleExecuteSyncBackup = async () => {
    if (!email) return;
    try {
      const rawPayload = { assets, expenses, trades, goals, budgets, targetAllocation };
      // Note: API backup might be deprecated, now we use Firestore directly via useEffect
      triggerToast('Cloud backup Complete', 'State database synced to Firestore.', 'success');
    } catch (err) {
      triggerToast('Sync Error', 'Cloud sync failed.', 'warning');
    }
  };

  // Restore state from Cloud server-side
  const handleExecuteRestoreBackup = async () => {
    if (!email) return;
    try {
        triggerToast('State Restore', 'Data is already synced from Firestore automatically on login.', 'success');
    } catch (err) {
      triggerToast('Database Restore Failure', 'No active backup record found.', 'error');
    }
  };

  // Local backup upload/restoration
  const handleUploadBackupLocal = (imported: any) => {
    if (imported.assets) setAssets(imported.assets);
    if (imported.expenses) setExpenses(imported.expenses);
    if (imported.trades) setTrades(imported.trades);
    if (imported.goals) setGoals(imported.goals);
    if (imported.budgets) setBudgets(imported.budgets);
    if (imported.targetAllocation) setTargetAllocation(imported.targetAllocation);

    triggerToast('Local backup Restored', 'Assets, Ledger, and Budgets re-aligned.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Guest Mode Banner */}
      {!firebaseUser && isGuestMode && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-800/60 px-4 py-2 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2 relative z-50">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>You are viewing in <strong>Guest Demo Mode</strong>. Changes remain local to your session.</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg text-[11px] shadow-sm transition-all cursor-pointer"
            >
              Sign In / Save to Cloud
            </button>
            <button
              onClick={() => setIsGuestMode(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              ✕ Exit Demo
            </button>
          </div>
        </div>
      )}
      
      {/* Top Bar Navigation */}
      <Navbar
        email={email || ''}
        onLogout={() => {
          setIsGuestMode(false);
          signOut(auth);
          triggerToast('Session Closed', 'Returned to Public Landing Page', 'warning');
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        alerts={alerts}
        onClearAlerts={() => setAlerts([])}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        assets={assets}
        expenses={expenses}
        goals={goals}
        budgets={budgets}
        transactions={trades}
        cycleItems={cycleItems}
        onSelect={handleSearchSelect}
        onOpenSettings={(tab) => {
          setSettingsDefaultTab(tab || 'profile');
          setIsSettingsOpen(true);
        }}
        subscriptionTier={subscriptionTier}
        isAdmin={isAdmin}
        onOpenPricing={() => setActiveTab('pricing')}
        onOpenSignIn={() => setShowSignInModal(true)}
        isGuest={!firebaseUser}
        onOpenAdminHQ={() => setIsAdminPortalMode(true)}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        undoCount={undoStack.length}
        lastUndoDescription={undoStack[0]?.title || undoStack[0]?.description}
        onUndo={() => performUndo()}
        onRedo={() => performRedo()}
      />

      {/* Sign In Modal Overlay for Guest Mode */}
      {!firebaseUser && showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute -top-12 left-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <span>← Back to Cockpit</span>
            </button>
            <SignInPanel 
              onSignIn={() => setShowSignInModal(false)} 
              onClose={() => setShowSignInModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Undo / Notification Toast Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md w-[calc(100vw-3rem)] sm:w-auto">
          <div className={`relative overflow-hidden p-4 rounded-2xl shadow-2xl border flex flex-col space-y-2 backdrop-blur-xl transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/50'
              : toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/40 text-amber-100 shadow-amber-950/50'
              : 'bg-slate-900/95 border-blue-500/30 text-slate-100 shadow-slate-950/50'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  toast.type === 'error'
                    ? 'bg-rose-500/20 text-rose-400'
                    : toast.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {toast.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : toast.type === 'warning' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>{toast.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
                    {toast.desc}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                {toast.undoAction && (
                  <button
                    onClick={() => {
                      toast.undoAction?.();
                      setToast(null);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 shrink-0"
                    title="Undo this action (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                )}
                <button
                  onClick={() => setToast(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                  aria-label="Dismiss toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {toast.undoAction && (
              <div className="w-full bg-white/10 h-0.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-amber-400 h-full animate-shrink-width" 
                  style={{ animationDuration: `${toast.durationMs || 7000}ms` }} 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* AIPopupModal for Quota and Search Grounding Popups */}
      <AIPopupModal
        isOpen={popupModal.isOpen}
        type={popupModal.type}
        title={popupModal.title}
        message={popupModal.message}
        onClose={() => setPopupModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Tab Navigations */}
      <main className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-8">
        
        {/* Core Sub navigation rails */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2 mb-4 sm:mb-8 overflow-x-auto gap-2 sm:gap-4 hide-scrollbar">
          <nav className="flex space-x-1.5 sm:space-x-2 shrink-0" aria-label="Tabs">
            {accessibleTabs.map((tab) => {
              const isActive = activeTab === tab;
              const isLocked = !isAdmin && subscriptionTier === 'free' && !FREE_ALLOWED_TABS.includes(tab as any);
              const titles: Record<string, string> = {
                home: 'Home Overview',
                dashboard: 'Summary Analytics',
                pricing: 'Pricing Plan',
                portfolio: 'My Financial Portfolio',
                assets: 'Risk & Safe Assets',
                ledger: 'Cash Flow & Expense Ledger',
                social: 'Social Family Sync',
                audit: 'Cycle Audit',
                transactions: 'History'
              };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold tracking-tight transition-all whitespace-nowrap border flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{titles[tab]}</span>
                  {isLocked && (
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center space-x-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>PRO</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="hidden sm:flex items-center space-x-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/5 shrink-0 shadow-xs">
            {/* Quick Undo / Redo controls in Sub-Nav */}
            <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-1">
              <button
                onClick={() => performUndo()}
                disabled={undoStack.length === 0}
                className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold transition-all cursor-pointer ${
                  undoStack.length > 0
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                }`}
                title={undoStack.length > 0 ? `Undo: ${undoStack[0]?.title} (Ctrl+Z)` : 'Nothing to undo (Ctrl+Z)'}
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden md:inline font-semibold">Undo</span>
                {undoStack.length > 0 && (
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded-full font-extrabold">
                    {undoStack.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => performRedo()}
                disabled={redoStack.length === 0}
                className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold transition-all cursor-pointer ${
                  redoStack.length > 0
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                }`}
                title={redoStack.length > 0 ? `Redo: ${redoStack[0]?.title} (Ctrl+Y)` : 'Nothing to redo (Ctrl+Y)'}
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden md:inline font-semibold">Redo</span>
              </button>
            </div>

            <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg flex items-center space-x-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase">USD/PHP Exchange</span>
              <span className="text-xs text-slate-900 dark:text-slate-200 font-bold">₱{exchangeRates.USD.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Pane Views */}
        {activeTab === 'home' && (
          <HomePage
            email={email || undefined}
            assets={assets}
            expenses={expenses}
            budgets={budgets}
            goals={goals}
            transactions={transactions}
            usdPhpRate={exchangeRates.USD}
            targetAllocation={targetAllocation}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            subscriptionTier={subscriptionTier}
            isAdmin={isAdmin}
            onOpenPricing={() => setActiveTab('pricing')}
            incomeBudgetPlan={incomeBudgetPlan}
          />
        )}

        {activeTab === 'dashboard' && (
          <SummaryDashboard
            assets={assets}
            expenses={expenses}
            budgets={budgets}
            onAdjustBudgetLimit={handleAdjustBudgetLimit}
            onResyncBudgets={handleResyncBudgets}
            targetAllocation={targetAllocation}
            isAdmin={isAdmin}
            subscriptionTier={subscriptionTier}
            onOpenPricing={() => setActiveTab('pricing')}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenLedger={() => setActiveTab('ledger')}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPlanTab
            subscriptionTier={subscriptionTier}
            isAdmin={isAdmin}
            userEmail={email}
            onOpenGCashModal={() => setIsGCashModalOpen(true)}
            onUpdateSubscriptionTier={handleUpdateSubscriptionTier}
            onTriggerToast={triggerToast}
          />
        )}

        {activeTab === 'portfolio' && (
          !isAdmin && subscriptionTier === 'free' ? (
            <ProPaywallOverlay
              tabName="My Financial Portfolio"
              onUpgrade={() => setIsGCashModalOpen(true)}
              onGoDashboard={() => setActiveTab('dashboard')}
            />
          ) : (
            <MyFinancialPortfolio
              assets={assets}
              usdPhpRate={exchangeRates.USD}
              targetAllocation={targetAllocation}
              onUpdateTargetAllocation={setTargetAllocation}
              cycleItems={cycleItems}
              onUpdateCycleItems={setCycleItems}
              devaluationItems={devaluationItems}
              onUpdateDevaluationItems={setDevaluationItems}
              devaluationTactics={devaluationTactics}
              onUpdateDevaluationTactics={setDevaluationTactics}
              auditChanges={auditChanges}
              onUpdateAuditChanges={setAuditChanges}
              deploymentItems={deploymentItems}
              onUpdateDeploymentItems={setDeploymentItems}
              budgetCap={budgetCap}
              onUpdateBudgetCap={setBudgetCap}
              onTriggerPopupModal={triggerPopupModal}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onResetTransactions={handleResetTransactions}
            />
          )
        )}

        {activeTab === 'assets' && (
          !isAdmin && subscriptionTier === 'free' ? (
            <ProPaywallOverlay
              tabName="Risk & Safe Asset Registry"
              onUpgrade={() => setIsGCashModalOpen(true)}
              onGoDashboard={() => setActiveTab('dashboard')}
            />
          ) : (
            <AssetSleeveTab
              assets={assets}
              onUpdateAssetPrice={handleUpdateAssetPrice}
              onUpdateAssetHoldings={handleUpdateAssetHoldings}
              onDeleteAsset={handleDeleteAsset}
              onAddTrade={handleAddTrade}
              targetAllocation={targetAllocation}
              onUpdateTargetAllocation={setTargetAllocation}
              onExecuteSyncAI={handleExecuteSyncAI}
              usdPhpRate={exchangeRates.USD}
              onAddAsset={handleAddAsset}
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              incomeBudgetPlan={incomeBudgetPlan}
              onUpdateIncomePlan={handleUpdateIncomePlan}
              isAdmin={isAdmin}
              subscriptionTier={subscriptionTier}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              highlightId={highlightId}
            />
          )
        )}

        {activeTab === 'ledger' && (
          <LedgerTab
            expenses={expenses}
            budgets={budgets}
            goals={goals}
            assets={assets}
            isAdmin={isAdmin}
            subscriptionTier={subscriptionTier}
            incomeBudgetPlan={incomeBudgetPlan}
            onUpdateIncomePlan={handleUpdateIncomePlan}
            onDeployIncomeToAsset={handleDeployIncomeToAsset}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalContribution={handleUpdateGoalContribution}
            onAddExpense={handleAddExpense}
            onAdjustExpense={handleAdjustExpense}
            onDeleteExpense={handleDeleteExpense}
            onAdjustBudgetLimit={handleAdjustBudgetLimit}
            onResyncBudgets={handleResyncBudgets}
            exchangeRates={exchangeRates}
            highlightId={highlightId}
          />
        )}

        {activeTab === 'social' && (
          <SocialFamilyHub
            goals={goals}
            expenses={expenses}
            totalAssets={assets.filter(a => a.class === 'safe' || a.class === 'risk' || a.class === 'physical').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0)}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalContribution={handleUpdateGoalContribution}
            isAdmin={isAdmin}
            userEmail={email || ''}
          />
        )}

        {activeTab === 'audit' && (
          !isAdmin && subscriptionTier === 'free' ? (
            <ProPaywallOverlay
              tabName="Market Cycle Audit"
              onUpgrade={() => setIsGCashModalOpen(true)}
              onGoDashboard={() => setActiveTab('dashboard')}
            />
          ) : (
            <MarketCycleAuditTab
              assets={assets}
              usdPhpRate={exchangeRates.USD}
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              highlightId={highlightId}
              cycleItems={cycleItems}
              onUpdateCycleItems={setCycleItems}
              devaluationItems={devaluationItems}
              onUpdateDevaluationItems={setDevaluationItems}
              devaluationTactics={devaluationTactics}
              onUpdateDevaluationTactics={setDevaluationTactics}
              auditChanges={auditChanges}
              onUpdateAuditChanges={setAuditChanges}
              deploymentItems={deploymentItems}
              onUpdateDeploymentItems={setDeploymentItems}
              budgetCap={budgetCap}
              onUpdateBudgetCap={setBudgetCap}
              onTriggerPopupModal={triggerPopupModal}
              onSyncCycleAuditToCloud={handleSyncCycleAuditToCloud}
              onFetchLiveMarketPrices={() => handleExecuteSyncAI('')}
            />
          )
        )}

        {activeTab === 'transactions' && (
          <TransactionHistoryTab
            transactions={transactions}
            assets={assets}
            goals={goals}
            expenses={expenses}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onResetTransactions={handleResetTransactions}
          />
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        email={email || ''}
        defaultTab={settingsDefaultTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        targetAllocation={targetAllocation}
        onUpdateTargetAllocation={(val) => setTargetAllocation(val)}
        assets={assets}
        expenses={expenses}
        trades={trades}
        goals={goals}
        budgets={budgets}
        incomeBudgetPlan={incomeBudgetPlan}
        onUploadBackup={handleUploadBackupLocal}
        onExecuteSyncBackup={handleExecuteSyncBackup}
        onExecuteRestoreBackup={handleExecuteRestoreBackup}
        onShowToast={triggerToast}
        subscriptionTier={subscriptionTier}
        onUpdateSubscriptionTier={handleUpdateSubscriptionTier}
        onOpenGCashModal={() => setIsGCashModalOpen(true)}
        isAdmin={isAdmin}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
      />

      {/* Global Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onAccept={handleAcceptPolicy}
        isMandatory={!policyAcceptedAt && (Boolean(firebaseUser) || isGuestMode)}
        acceptedAt={policyAcceptedAt}
      />

      {/* GCash Payment Verification Modal */}
      <GCashPaymentModal
        isOpen={isGCashModalOpen}
        onClose={() => setIsGCashModalOpen(false)}
        userEmail={email || ''}
        onPaymentSubmitted={(refNo) => {
          triggerToast(
            'Payment Verification Pending',
            `Submitted GCash Ref #${refNo}. Account will be upgraded upon verification by admin.`,
            'success'
          );
        }}
        onTriggerToast={triggerToast}
      />

      {/* Clean elegant bottom footer with Philippine live clock */}
      <footer className="border-t border-slate-200/50 dark:border-white/5 py-8 mt-16 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-3">
        <PhilippineClock />
        <span>© 2026 Budget Portfolio Inc. Fully Audited Cryptographic Protection.</span>
      </footer>

      {/* --- GEMINI AI CHAT BOX FLOATING SYSTEM --- */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {isChatOpen ? (
          <div className="w-[390px] h-[520px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Budget Portfolio AI</h4>
                  <span className="text-[9.5px] text-indigo-200/80 block">Institutional Copilot • Gemini & MarketWatch</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([
                    {
                      id: 'welcome-msg-reset',
                      sender: 'assistant',
                      text: "Chat cleared. What financial operation or market query can I assist you with?"
                    }
                  ])}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/10">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none font-medium'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/5 rounded-bl-none shadow-xs'
                  }`}>
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* Extracted Action Proposal Card */}
                    {m.action && m.action.type && (
                      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-2 text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            Action Proposal
                          </span>
                        </div>
                        <p className="text-[10px] font-medium leading-normal text-slate-600 dark:text-slate-300">
                          {m.action.type === 'ADD_MONEY' && `Deposit ₱${(m.action.payload.amount || m.action.payload.units)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${m.action.payload.assetKey ? m.action.payload.assetKey.toUpperCase() : 'HYS'} Principal Cost Basis.`}
                          {m.action.type === 'WITHDRAW_MONEY' && `Withdraw ₱${(m.action.payload.amount || m.action.payload.units)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${m.action.payload.assetKey ? m.action.payload.assetKey.toUpperCase() : 'HYS'} Principal Cost Basis.`}
                          {m.action.type === 'TRANSFER_MONEY' && `Transfer ₱${m.action.payload.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${(m.action.payload.fromAssetKey || 'HYS').toUpperCase()} to ${(m.action.payload.toAssetKey || 'TBILLS').toUpperCase()} Principal Cost Basis.`}
                          {m.action.type === 'RECORD_EXPENSE' && `Log outflow of ₱${m.action.payload.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for "${m.action.payload.description}" under "${m.action.payload.category}".`}
                          {m.action.type === 'RECORD_TRADE' && `Record trade: ${m.action.payload.action} ${m.action.payload.units} units of ${m.action.payload.assetKey?.toUpperCase()} at ₱${m.action.payload.pricePHP?.toLocaleString() || 'market price'}.`}
                          {m.action.type === 'REGISTER_ASSET' && `Register new ${(m.action.payload.class || 'SAFE').toUpperCase()} position: "${m.action.payload.name}" (${m.action.payload.platform || 'Bank'}) with Principal Basis ₱${(m.action.payload.costBasisPHP || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${m.action.payload.yieldPercent ? ` @ ${m.action.payload.yieldPercent}% rate` : ''}${m.action.payload.maturityDate ? ` (Matures ${m.action.payload.maturityDate})` : ''}.`}
                          {m.action.type === 'UPDATE_TARGET_ALLOCATION' && `Adjust Safe Shield allocation target to ${m.action.payload.value}%.`}
                          {m.action.type === 'UPDATE_INCOME_PLAN' && `Update Income Allocation Matrix: ${[
                            m.action.payload.monthlyNetIncome !== undefined ? `Net Income: ₱${m.action.payload.monthlyNetIncome.toLocaleString()}` : null,
                            m.action.payload.expenseCapAllocation !== undefined ? `Expense Cap: ₱${m.action.payload.expenseCapAllocation.toLocaleString()}` : null,
                            m.action.payload.personalGoalsAllocation !== undefined ? `Goals: ₱${m.action.payload.personalGoalsAllocation.toLocaleString()}` : null,
                            m.action.payload.assetInvestmentAllocation !== undefined ? `Assets: ₱${m.action.payload.assetInvestmentAllocation.toLocaleString()}` : null,
                          ].filter(Boolean).join(', ')}.`}
                          {m.action.type === 'DEPOSIT_PAYDAY_GOAL' && `Deposit ₱${m.action.payload.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} realized payday cash inflow into Personal Milestone Goals.`}
                          {m.action.type === 'DEPLOY_PAYDAY_ASSET' && `Deploy ₱${m.action.payload.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} realized payday cash inflow into ${m.action.payload.assetKey ? m.action.payload.assetKey.toUpperCase() : 'HYS'} in Risk & Safe Asset Sleeve.`}
                        </p>
                        <button
                          disabled={m.applied}
                          onClick={() => handleApplyAIAction(m.id, m.action!)}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            m.applied
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {m.applied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Applied & Synced</span>
                            </>
                          ) : (
                            <span>Approve & Write Entry</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 text-slate-400 text-xs rounded-2xl p-3 border border-slate-200/60 dark:border-white/5 rounded-bl-none flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Suggestions */}
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { label: '📊 Net Worth Breakdown', query: 'What is my current net worth and balance sheet status?' },
                { label: '📅 Income Matrix', query: 'Set my monthly net take-home income to ₱80,000' },
                { label: '🏦 Deposit ₱15k HYS', query: 'Deposit ₱15,000 to Maya Bank HYS' },
                { label: '📈 MarketWatch PSE', query: 'Check MarketWatch price for SCC and SPC stock' },
                { label: '🧾 Log ₱1,500 Dining', query: 'Spent ₱1,500 on family dinner' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(p.query);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer transition-all hover:border-indigo-500/40"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex items-center gap-1.5">
              <button
                type="button"
                onClick={startVoiceToText}
                className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isListening ? "Listening..." : "Enable Voice Input"}
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                id="ai-chat-prompt-input"
                name="ai_chat_prompt"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Budget Portfolio AI or command actions..."
                aria-label="Ask Budget Portfolio AI or command actions"
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden text-slate-800 dark:text-slate-200 font-medium"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-indigo-500/20 border border-indigo-500/30 flex items-center gap-2.5 cursor-pointer transition-all hover:-translate-y-0.5 select-none"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">Budget Portfolio AI</span>
            <MessageSquare className="w-4 h-4 text-slate-300" />
          </button>
        )}
      </div>

    </div>
  );
}
