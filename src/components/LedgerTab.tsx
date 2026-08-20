import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseEntry, BudgetLimit, FamilyGoal, IncomeBudgetPlan, AssetPosition } from '../types';
import {
  Receipt,
  Plus,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Share2,
  DollarSign,
  ArrowRightLeft,
  FileDown,
  ShieldCheck,
  Calendar,
  Sliders,
  Sparkles,
  CheckCircle2,
  Target,
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
  ArrowUpRight,
  Clock,
  PiggyBank,
  Check,
  Compass,
  Award,
  ChevronRight,
  X,
  Lock,
  Scale,
  Zap,
  Coins,
  Building2,
  CheckSquare,
  Flame,
} from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { parseFormattedNumber } from '../utils/mathParser';

interface LedgerTabProps {
  expenses: ExpenseEntry[];
  budgets: BudgetLimit[];
  goals?: FamilyGoal[];
  assets?: AssetPosition[];
  isAdmin?: boolean;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  incomeBudgetPlan?: IncomeBudgetPlan;
  onUpdateIncomePlan?: (plan: IncomeBudgetPlan) => void;
  onDeployIncomeToAsset?: (assetKey: string, amountPHP: number, notes?: string) => void;
  onAddGoal?: (goal: Omit<FamilyGoal, 'id'>) => void;
  onEditGoal?: (goal: FamilyGoal) => void;
  onDeleteGoal?: (id: string) => void;
  onUpdateGoalContribution?: (id: string, amount: number) => void;
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
  onAdjustExpense: (id: string, newAmount: number) => void;
  onDeleteExpense: (id: string) => void;
  onAdjustBudgetLimit?: (category: string, newLimit: number) => void;
  onResyncBudgets?: () => void;
  exchangeRates: Record<string, number>;
  highlightId: { type: string; id: string; tab?: string } | null;
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

// Preset goal templates
const GOAL_STARTER_PRESETS = [
  {
    title: '🛡️ 3-Month Emergency Safety Fund',
    target: '60000',
    current: '15000',
    category: 'Emergency Fund',
    notes: 'Liquid safety cushion for unexpected events & healthcare.',
  },
  {
    title: '✈️ Japan Vacation & Travel Savings',
    target: '45000',
    current: '18000',
    category: 'Travel & Vacation',
    notes: 'Flights, accommodations, and culinary experiences fund.',
  },
  {
    title: '💻 Laptop & Workstation Upgrade',
    target: '50000',
    current: '22000',
    category: 'Tech & Hardware',
    notes: 'Productivity equipment & hardware replacement target.',
  },
  {
    title: '💳 Debt & Credit Card Elimination',
    target: '30000',
    current: '12000',
    category: 'Debt Payoff',
    notes: 'Zero-out high-interest credit card & short-term liabilities.',
  },
];

export default function LedgerTab({
  expenses,
  budgets,
  goals = [],
  assets = [],
  isAdmin = false,
  subscriptionTier = 'free',
  incomeBudgetPlan,
  onUpdateIncomePlan,
  onDeployIncomeToAsset,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoalContribution,
  onAddExpense,
  onAdjustExpense,
  onDeleteExpense,
  onAdjustBudgetLimit,
  onResyncBudgets,
  exchangeRates,
  highlightId,
}: LedgerTabProps) {
  const isProOrAdmin = isAdmin || subscriptionTier === 'pro' || subscriptionTier === 'enterprise';

  // -------------------------------------------------------------
  // 1. MONTHLY NET INCOME & BUDGET ENGINE STATE
  // Starts with zero money (₱0) by default per user requirement
  // -------------------------------------------------------------
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeInputStr, setIncomeInputStr] = useState<string>(
    incomeInputStrDefault(incomeBudgetPlan?.monthlyNetIncome)
  );

  function incomeInputStrDefault(val?: number) {
    if (val !== undefined && val >= 0) return val.toString();
    return '0';
  }

  // Monthly net income value
  const monthlyNetIncome = incomeBudgetPlan?.monthlyNetIncome ?? 0;

  // Allocations breakdown
  const expenseCapAllocation = incomeBudgetPlan?.expenseCapAllocation ?? 0;
  const personalGoalsAllocation = incomeBudgetPlan?.personalGoalsAllocation ?? 0;
  const assetInvestmentAllocation = incomeBudgetPlan?.assetInvestmentAllocation ?? 0;
  const targetAssetKey = incomeBudgetPlan?.targetAssetKey || (assets[0]?.key || 'maya');

  // Input editing states for allocations
  const [editingAllocations, setEditingAllocations] = useState(false);
  const [inputExpenseCapAlloc, setInputExpenseCapAlloc] = useState(expenseCapAllocation.toString());
  const [inputGoalsAlloc, setInputGoalsAlloc] = useState(personalGoalsAllocation.toString());
  const [inputAssetAlloc, setInputAssetAlloc] = useState(assetInvestmentAllocation.toString());
  const [selectedDeployAssetKey, setSelectedDeployAssetKey] = useState(targetAssetKey);

  // Sync inputs when incomeBudgetPlan changes
  useEffect(() => {
    setInputExpenseCapAlloc((incomeBudgetPlan?.expenseCapAllocation ?? 0).toString());
    setInputGoalsAlloc((incomeBudgetPlan?.personalGoalsAllocation ?? 0).toString());
    setInputAssetAlloc((incomeBudgetPlan?.assetInvestmentAllocation ?? 0).toString());
    if (incomeBudgetPlan?.targetAssetKey) {
      setSelectedDeployAssetKey(incomeBudgetPlan.targetAssetKey);
    }
  }, [incomeBudgetPlan]);

  // Total allocated vs net income
  const effectiveAssetAllocation = isProOrAdmin ? assetInvestmentAllocation : 0;
  const totalAllocated = expenseCapAllocation + personalGoalsAllocation + effectiveAssetAllocation;
  const allocationDiff = monthlyNetIncome - totalAllocated;
  const isOverAllocated = totalAllocated > monthlyNetIncome && (monthlyNetIncome > 0 || totalAllocated > 0);
  const isUnderAllocated = totalAllocated < monthlyNetIncome && monthlyNetIncome > 0;
  const isBudgetBalanced = totalAllocated === monthlyNetIncome && monthlyNetIncome > 0;

  // Bi-Monthly Payday Calculations (15th and 30th)
  const halfIncome = monthlyNetIncome > 0 ? monthlyNetIncome / 2 : 0;
  const currentDay = useMemo(() => new Date().getDate(), []);

  // Payday Statuses for current calendar month
  const is15thRealized = currentDay >= 15;
  const is30thRealized = currentDay >= 30;

  const realizedInflowThisMonth = useMemo(() => {
    if (monthlyNetIncome <= 0) return 0;
    if (currentDay >= 30) return monthlyNetIncome;
    if (currentDay >= 15) return halfIncome;
    return 0;
  }, [monthlyNetIncome, currentDay, halfIncome]);

  // Days until next payday
  const nextPaydayInfo = useMemo(() => {
    if (currentDay < 15) {
      return {
        label: '1st Payday (15th)',
        daysLeft: 15 - currentDay,
        amount: halfIncome,
        dateStr: '15th of this month',
      };
    } else if (currentDay < 30) {
      return {
        label: '2nd Payday (30th)',
        daysLeft: 30 - currentDay,
        amount: halfIncome,
        dateStr: '30th of this month',
      };
    } else {
      // Past 30th -> next month 15th
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysUntilNextMonth15 = (lastDayOfMonth - currentDay) + 15;
      return {
        label: 'Next 1st Payday (15th)',
        daysLeft: daysUntilNextMonth15,
        amount: halfIncome,
        dateStr: '15th of next month',
      };
    }
  }, [currentDay, halfIncome]);

  // Save Income & Allocations
  const handleSaveIncome = (newIncome: number) => {
    if (!onUpdateIncomePlan) return;
    const updatedPlan: IncomeBudgetPlan = {
      monthlyNetIncome: newIncome,
      paydayDays: [15, 30],
      expenseCapAllocation: incomeBudgetPlan?.expenseCapAllocation ?? Math.round(newIncome * 0.6),
      personalGoalsAllocation: incomeBudgetPlan?.personalGoalsAllocation ?? Math.round(newIncome * 0.25),
      assetInvestmentAllocation: incomeBudgetPlan?.assetInvestmentAllocation ?? Math.round(newIncome * 0.15),
      targetAssetKey: selectedDeployAssetKey,
      autoDeployPayday: true,
    };
    onUpdateIncomePlan(updatedPlan);
    setShowIncomeModal(false);
  };

  const handleSaveAllocations = () => {
    if (!onUpdateIncomePlan) return;
    const expVal = parseFormattedNumber(inputExpenseCapAlloc);
    const goalVal = parseFormattedNumber(inputGoalsAlloc);
    const assetVal = parseFormattedNumber(inputAssetAlloc);

    const updatedPlan: IncomeBudgetPlan = {
      monthlyNetIncome,
      paydayDays: [15, 30],
      expenseCapAllocation: expVal,
      personalGoalsAllocation: goalVal,
      assetInvestmentAllocation: assetVal,
      targetAssetKey: selectedDeployAssetKey,
      autoDeployPayday: true,
    };
    onUpdateIncomePlan(updatedPlan);
    setEditingAllocations(false);
  };

  // 1-Click Auto-Calibrate allocations to 100% of income
  const handleAutoCalibrateAllocations = () => {
    if (!onUpdateIncomePlan || monthlyNetIncome <= 0) return;
    // Default 50/30/20 rule or proportional split
    const expVal = Math.round(monthlyNetIncome * 0.50);
    const goalVal = Math.round(monthlyNetIncome * 0.30);
    const assetVal = isProOrAdmin ? (monthlyNetIncome - expVal - goalVal) : 0;
    const finalGoalVal = isProOrAdmin ? goalVal : (monthlyNetIncome - expVal);

    const updatedPlan: IncomeBudgetPlan = {
      monthlyNetIncome,
      paydayDays: [15, 30],
      expenseCapAllocation: expVal,
      personalGoalsAllocation: finalGoalVal,
      assetInvestmentAllocation: assetVal,
      targetAssetKey: selectedDeployAssetKey,
      autoDeployPayday: true,
    };
    onUpdateIncomePlan(updatedPlan);
  };

  // Quick assignment of diff
  const handleAssignDiff = (destination: 'expense' | 'goals' | 'assets') => {
    if (!onUpdateIncomePlan || allocationDiff <= 0) return;
    const updatedPlan: IncomeBudgetPlan = {
      monthlyNetIncome,
      paydayDays: [15, 30],
      expenseCapAllocation: destination === 'expense' ? expenseCapAllocation + allocationDiff : expenseCapAllocation,
      personalGoalsAllocation: destination === 'goals' ? personalGoalsAllocation + allocationDiff : personalGoalsAllocation,
      assetInvestmentAllocation: destination === 'assets' ? assetInvestmentAllocation + allocationDiff : assetInvestmentAllocation,
      targetAssetKey: selectedDeployAssetKey,
      autoDeployPayday: true,
    };
    onUpdateIncomePlan(updatedPlan);
  };

  // 1-Click Deposit Payday Goal Allocation into Active Goals
  const handleDepositPaydayToGoals = () => {
    if (!onUpdateGoalContribution || goals.length === 0 || personalGoalsAllocation <= 0) return;
    const perGoalShare = Math.round((personalGoalsAllocation / 2) / goals.length);
    if (perGoalShare <= 0) return;

    goals.forEach((g) => {
      onUpdateGoalContribution(g.id, perGoalShare);
    });
  };

  // Deploy income allocation to target asset (Pro & Admin)
  const handleDeployToAssetClick = () => {
    if (!onDeployIncomeToAsset || !selectedDeployAssetKey || assetInvestmentAllocation <= 0) return;
    onDeployIncomeToAsset(selectedDeployAssetKey, assetInvestmentAllocation / 2, `Bi-Monthly Payday Inflow (₱${(assetInvestmentAllocation / 2).toLocaleString()})`);
  };

  // -------------------------------------------------------------
  // 2. EXPENSE FORM, GOAL MODALS & LEDGER STATE
  // -------------------------------------------------------------
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null);
  const [fundingGoal, setFundingGoal] = useState<FamilyGoal | null>(null);
  const [fundingAmount, setFundingAmount] = useState('1000');

  // New Goal Input States
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('50000');
  const [newGoalCurrent, setNewGoalCurrent] = useState('0');
  const [newGoalDeadline, setNewGoalDeadline] = useState('2026-12-31');
  const [newGoalCategory, setNewGoalCategory] = useState('Emergency Fund');
  const [newGoalNotes, setNewGoalNotes] = useState('');

  // Edit Goal Input States
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCurrent, setEditGoalCurrent] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState('Emergency Fund');
  const [editGoalNotes, setEditGoalNotes] = useState('');

  // Highlight Triggers
  useEffect(() => {
    if (highlightId?.id === 'add-expense-section') {
      setShowExpenseForm(true);
    }
    if (highlightId?.id === 'personal-goals-section' || highlightId?.id === 'add-goal-section') {
      setShowGoalModal(true);
    }
    if (highlightId?.id === 'net-income-section') {
      setShowIncomeModal(true);
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
  const [calcResult, setCalcResult] = useState('6124.00');

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

  // Overall Desired Monthly Expense Cap (Auto-synced with Income Plan if available)
  const [desiredMonthlyBudget, setDesiredMonthlyBudget] = useState<number>(() => {
    if (expenseCapAllocation > 0) return expenseCapAllocation;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('desired_monthly_expense_limit') : null;
    if (saved && !isNaN(Number(saved)) && Number(saved) > 0) return Number(saved);
    const sumCategoryLimits = budgets.reduce((acc, b) => acc + (b.limitPHP || 0), 0);
    return sumCategoryLimits > 0 ? sumCategoryLimits : 0;
  });

  // Sync desiredMonthlyBudget when expenseCapAllocation changes
  useEffect(() => {
    if (expenseCapAllocation > 0) {
      setDesiredMonthlyBudget(expenseCapAllocation);
    }
  }, [expenseCapAllocation]);

  const [isEditingDesired, setIsEditingDesired] = useState(false);
  const [desiredInputVal, setDesiredInputVal] = useState(desiredMonthlyBudget.toString());
  const [adjustingCategory, setAdjustingCategory] = useState<string | null>(null);
  const [adjustedCategoryLimit, setAdjustedCategoryLimit] = useState<string>('');

  // Sum of individual category limits
  const sumCategoryLimits = useMemo(() => {
    return budgets.reduce((acc, b) => acc + (b.limitPHP || 0), 0);
  }, [budgets]);

  const isCapMismatch = desiredMonthlyBudget !== sumCategoryLimits && sumCategoryLimits > 0;

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

  // Unspent Monthly Budget Surplus
  const monthlySurplusPHP = useMemo(() => {
    return Math.max(0, activeMonthlyCapForSelectedMonth - totalSpentInSelectedMonth);
  }, [activeMonthlyCapForSelectedMonth, totalSpentInSelectedMonth]);

  // Goals Aggregation
  const totalGoalTargetPHP = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.targetPHP || 0), 0);
  }, [goals]);

  const totalGoalCurrentPHP = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentPHP || 0), 0);
  }, [goals]);

  const overallGoalProgressPercent = useMemo(() => {
    if (totalGoalTargetPHP <= 0) return 0;
    return Math.min(100, (totalGoalCurrentPHP / totalGoalTargetPHP) * 100);
  }, [totalGoalTargetPHP, totalGoalCurrentPHP]);

  // Handle Goal Creation
  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFormattedNumber(newGoalTarget);
    const currentNum = parseFormattedNumber(newGoalCurrent) || 0;
    if (!newGoalTitle || targetNum <= 0) return;

    if (onAddGoal) {
      onAddGoal({
        title: newGoalTitle,
        targetPHP: targetNum,
        currentPHP: currentNum,
        deadline: newGoalDeadline || '2026-12-31',
        category: newGoalCategory,
        notes: newGoalNotes,
      });
    }

    // Reset & Close
    setNewGoalTitle('');
    setNewGoalTarget('50000');
    setNewGoalCurrent('0');
    setNewGoalDeadline('2026-12-31');
    setNewGoalCategory('Emergency Fund');
    setNewGoalNotes('');
    setShowGoalModal(false);
  };

  // Open Edit Goal Modal
  const openEditGoalModal = (g: FamilyGoal) => {
    setEditingGoal(g);
    setEditGoalTitle(g.title);
    setEditGoalTarget(g.targetPHP.toString());
    setEditGoalCurrent(g.currentPHP.toString());
    setEditGoalDeadline(g.deadline);
    setEditGoalCategory(g.category || 'Emergency Fund');
    setEditGoalNotes(g.notes || '');
  };

  // Handle Edit Goal Submit
  const handleEditGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editGoalTitle) return;
    const targetNum = parseFormattedNumber(editGoalTarget);
    const currentNum = parseFormattedNumber(editGoalCurrent);

    if (onEditGoal) {
      onEditGoal({
        id: editingGoal.id,
        title: editGoalTitle,
        targetPHP: targetNum,
        currentPHP: currentNum,
        deadline: editGoalDeadline,
        category: editGoalCategory,
        notes: editGoalNotes,
      });
    }
    setEditingGoal(null);
  };

  // Quick Funding Contribution Action
  const handleQuickContribute = (goalId: string, deltaAmount: number) => {
    if (onUpdateGoalContribution) {
      onUpdateGoalContribution(goalId, deltaAmount);
    }
  };

  // Custom Funding Submit
  const handleCustomFundingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoal) return;
    const parsed = parseFormattedNumber(fundingAmount);
    if (parsed > 0 && onUpdateGoalContribution) {
      onUpdateGoalContribution(fundingGoal.id, parsed);
    }
    setFundingGoal(null);
    setFundingAmount('1000');
  };

  // Handle Log Expense Form Submit
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFormattedNumber(amount);
    if (!amtNum || amtNum <= 0 || !desc) return;

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

  // Handle Currency Converter Calculation
  const handleCalculateConversion = () => {
    const amt = parseFormattedNumber(calcFromAmt);
    if (!amt) return;
    const fromRate = exchangeRates[calcFromCurr] || 1;
    const toRate = exchangeRates[calcToCurr] || 1;

    const amtInPHP = amt * fromRate;
    const converted = amtInPHP / toRate;

    setCalcResult(converted.toFixed(2));
  };

  // Category Icon & Color Theme Resolver
  const getGoalCategoryDetails = (catName?: string) => {
    const c = (catName || '').toLowerCase();
    if (c.includes('emergency') || c.includes('shield') || c.includes('safety')) {
      return {
        icon: ShieldCheck,
        badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
        progressBar: 'bg-emerald-500',
      };
    }
    if (c.includes('travel') || c.includes('vacation') || c.includes('trip') || c.includes('flight')) {
      return {
        icon: Compass,
        badgeBg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/20',
        progressBar: 'bg-sky-500',
      };
    }
    if (c.includes('tech') || c.includes('laptop') || c.includes('hardware') || c.includes('gear')) {
      return {
        icon: Sparkles,
        badgeBg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
        progressBar: 'bg-purple-500',
      };
    }
    if (c.includes('debt') || c.includes('loan') || c.includes('card') || c.includes('elimination')) {
      return {
        icon: CreditCard,
        badgeBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
        progressBar: 'bg-amber-500',
      };
    }
    if (c.includes('invest') || c.includes('seed') || c.includes('stock') || c.includes('crypto')) {
      return {
        icon: TrendingUp,
        badgeBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
        progressBar: 'bg-blue-500',
      };
    }
    if (c.includes('home') || c.includes('appliance') || c.includes('house') || c.includes('living')) {
      return {
        icon: Wallet,
        badgeBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20',
        progressBar: 'bg-indigo-500',
      };
    }
    return {
      icon: Target,
      badgeBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
      progressBar: 'bg-rose-500',
    };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ------------------------------------------------------------- */}
      {/* 1. LOGGED OUTFLOW REGISTER & QUICK EXPENSE LOGGING HUB */}
      {/* ------------------------------------------------------------- */}
      <div id="expense-table-section" data-highlight-id="expense-table-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Expense Outflows Register Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-1">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <span>Daily Outflow Tracking & Quick Log</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Logged Outflow Register ({expensesForSelectedMonth.length} Records)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed ledger records for <strong>{selectedMonthKey}</strong>. Multi-currency items converted to PHP.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Period / Month Selector */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Period:</span>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
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

              <button
                onClick={() => setShowExpenseForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-white/5 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">PHP Value</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                  {expensesForSelectedMonth.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No expenses logged for {selectedMonthKey}. Click "+ Log Expense" to register an outflow.
                      </td>
                    </tr>
                  ) : (
                    expensesForSelectedMonth.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{e.date}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">{e.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {e.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₱{e.amountPHP.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onDeleteExpense(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Travel Currency Converter & Inflow Guide */}
        <div className="space-y-6">
          {/* Currency Calculator */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2.5">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              <span>Multi-Currency Travel Converter</span>
            </div>

            <div className="space-y-3">
              <div>
                <SmartCalculatorInput
                  label="Convert Amount"
                  value={calcFromAmt}
                  onChange={setCalcFromAmt}
                  currencySymbol=""
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">From</label>
                  <select
                    value={calcFromCurr}
                    onChange={(e) => setCalcFromCurr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">To</label>
                  <select
                    value={calcToCurr}
                    onChange={(e) => setCalcToCurr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="PHP">PHP (₱)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateConversion}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Calculate Exchange
              </button>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Equivalent:</span>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {calcToCurr} {calcResult}
                </span>
              </div>
            </div>
          </div>

          {/* Payday Scheduling Quick Guide */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>Income Inflow Principles</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-indigo-200/80">
              1. <strong>15th Day Payday</strong>: 50% of monthly net income arrives for first-half expenses & goal funding.<br/>
              2. <strong>30th Day Payday</strong>: 50% of monthly net income arrives for second-half expenses & asset DCA.<br/>
              3. <strong>Balanced Allocation</strong>: Income = Outflow Cap + Goals + Asset Investments.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MONTHLY NET INCOME & BI-MONTHLY PAYDAY (15th & 30th) HUB */}
      {/* ------------------------------------------------------------- */}
      <div
        id="net-income-section"
        data-highlight-id="net-income-section"
        className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-1">
              <Coins className="w-4 h-4 text-indigo-500" />
              <span>Inflow Scheduling & Income Budgeting</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Monthly Net Income & Bi-Monthly Payday Hub</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Automated income distribution scheduled every <strong>15th day</strong> and <strong>30th day</strong>. Assign every peso to Expense Caps, Goals, and Asset Deployments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIncomeInputStr(monthlyNetIncome.toString());
                setShowIncomeModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{monthlyNetIncome > 0 ? 'Update Net Income' : 'Set Monthly Net Income'}</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Monthly Net Income */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-xl p-4.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Monthly Net Income
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₱{monthlyNetIncome.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Base Pay Schedule:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">15th & 30th Split</span>
            </div>
          </div>

          {/* Card 2: 15th Day Payday (50%) */}
          <div className={`p-4.5 rounded-xl border flex flex-col justify-between ${
            is15thRealized
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  1st Payday (15th Day)
                </span>
                {is15thRealized ? (
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Realized</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Scheduled</span>
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₱{halfIncome.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500">
              {is15thRealized ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>50% Inflow Credited on 15th</span>
                </span>
              ) : (
                <span>Auto-deposits in {Math.max(0, 15 - currentDay)} days</span>
              )}
            </div>
          </div>

          {/* Card 3: 30th Day Payday (50%) */}
          <div className={`p-4.5 rounded-xl border flex flex-col justify-between ${
            is30thRealized
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  2nd Payday (30th Day)
                </span>
                {is30thRealized ? (
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Realized</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Scheduled</span>
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₱{halfIncome.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500">
              {is30thRealized ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Inflow Fully Realized</span>
                </span>
              ) : (
                <span>Auto-deposits in {Math.max(0, 30 - currentDay)} days</span>
              )}
            </div>
          </div>

          {/* Card 4: Month-To-Date Realized Inflow */}
          <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-500/20 rounded-xl p-4.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Realized Cash Inflow MTD
              </span>
              <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200 font-mono">
                ₱{realizedInflowThisMonth.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200/60 dark:border-white/5 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
              {monthlyNetIncome > 0 ? (
                <span>{((realizedInflowThisMonth / monthlyNetIncome) * 100).toFixed(0)}% of monthly earnings in hand</span>
              ) : (
                <span>Set monthly net income to track</span>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* REAL INCOME BUDGETING RECONCILIATION & ERROR ALARMS */}
        {/* ------------------------------------------------------------- */}
        {monthlyNetIncome === 0 ? (
          /* Case 0: Starts with Zero Money Onboarding */
          <div className="p-4.5 bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Monthly Net Income is currently ₱0.00
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Input your take-home net earnings to activate automated 15th & 30th bi-monthly paydays and budget reconciliation.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIncomeInputStr('0');
                setShowIncomeModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 uppercase tracking-wider"
            >
              + Configure Net Income
            </button>
          </div>
        ) : isOverAllocated ? (
          /* Case 1: CRITICAL BUDGET DEFICIT MISMATCH (ERROR ALARM) */
          <div className="p-4.5 bg-rose-500/10 border-2 border-rose-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-rose-800 dark:text-rose-200 animate-pulse-slow">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Critical Real-Budgeting Deficit Mismatch</span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                    Over-Allocated by -₱{Math.abs(allocationDiff).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed text-rose-700 dark:text-rose-300">
                  Your total assigned budget (<strong>₱{totalAllocated.toLocaleString()}</strong>) exceeds your Monthly Net Income (<strong>₱{monthlyNetIncome.toLocaleString()}</strong>). For real disciplined budgeting, reduce your Desired Expense Cap, Goal allocations, or Asset investments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAutoCalibrateAllocations}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Calibrate to 100% Income</span>
              </button>
            </div>
          </div>
        ) : isUnderAllocated ? (
          /* Case 2: UNASSIGNED INCOME WARNING (SURPLUS NOTICE) */
          <div className="p-4.5 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Unassigned Net Income Warning</span>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded text-[10px] font-black">
                    ₱{allocationDiff.toLocaleString()} Unallocated
                  </span>
                </div>
                <p className="text-xs mt-1 text-amber-800 dark:text-amber-300">
                  Every single peso must have a planned job. Route the remaining ₱{allocationDiff.toLocaleString()}:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleAssignDiff('expense')}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                + Route to Expense Cap
              </button>
              <button
                onClick={() => handleAssignDiff('goals')}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                + Route to Personal Goals
              </button>
              {isProOrAdmin && (
                <button
                  onClick={() => handleAssignDiff('assets')}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  + Route to Asset Sleeve
                </button>
              )}
            </div>
          </div>
        ) : isBudgetBalanced ? (
          /* Case 3: INCOME BUDGET PERFECTLY BALANCED */
          <div className="p-4.5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Income Budget Perfectly Balanced</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                    100% Accounted For
                  </span>
                </div>
                <p className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-300">
                  Every single peso of your ₱{monthlyNetIncome.toLocaleString()} net income is allocated across Outflows, Personal Goals, and Asset Deployments.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------------- */}
        {/* INCOME ALLOCATION ENGINE MATRIX (3 DESTINATIONS) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  <span>Income Allocation Matrix</span>
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded text-[9px] font-black uppercase tracking-wider">
                  MTD Realized: ₱{realizedInflowThisMonth.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically allocate your monthly net income to Expense Caps, Personal Milestones, and Asset Sleeves.
              </p>
            </div>

            {!editingAllocations ? (
              <button
                onClick={() => setEditingAllocations(true)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Allocations</span>
              </button>
            ) : null}
          </div>

          {/* Realized Cash Inflow MTD Matrix Distribution Meter */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/30 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                <span>Realized Cash Inflow MTD Execution:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
                  ₱{realizedInflowThisMonth.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  of ₱{monthlyNetIncome.toLocaleString()} Planned ({monthlyNetIncome > 0 ? ((realizedInflowThisMonth / monthlyNetIncome) * 100).toFixed(0) : 0}% in hand)
                </span>
              </div>

              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {is30thRealized ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100% Inflow Realized (15th & 30th)</span>
                  </span>
                ) : is15thRealized ? (
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>50% 1st Payday Realized • 2nd Payday on 30th</span>
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Awaiting 1st Payday (15th Day)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Realized Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full transition-all duration-500"
                style={{ width: `${monthlyNetIncome > 0 ? Math.min(100, (realizedInflowThisMonth / monthlyNetIncome) * 100) : 0}%` }}
                title={`Realized Cash Inflow MTD: ₱${realizedInflowThisMonth.toLocaleString()}`}
              />
            </div>

            {/* Breakdown Chips of Realized Inflow Available to Allocate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
              <div className="flex items-center justify-between px-2.5 py-1 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500 font-medium">Expense Cap Inflow:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₱{(is30thRealized ? expenseCapAllocation : is15thRealized ? expenseCapAllocation / 2 : 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500 font-medium">Goals Savings Inflow:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₱{(is30thRealized ? personalGoalsAllocation : is15thRealized ? personalGoalsAllocation / 2 : 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500 font-medium">Asset Sleeve Inflow:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  ₱{(is30thRealized ? effectiveAssetAllocation : is15thRealized ? effectiveAssetAllocation / 2 : 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {editingAllocations ? (
            /* Editing Allocations Form */
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Expense Cap Input */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    1. Desired Monthly Expense Cap (PHP)
                  </label>
                  <SmartCalculatorInput
                    label=""
                    value={inputExpenseCapAlloc}
                    onChange={setInputExpenseCapAlloc}
                    placeholder="e.g. 15000"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Living expenses, rent, utilities, groceries</span>
                </div>

                {/* 2. Goals Input */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    2. Personal Goals & Savings Allocation (PHP)
                  </label>
                  <SmartCalculatorInput
                    label=""
                    value={inputGoalsAlloc}
                    onChange={setInputGoalsAlloc}
                    placeholder="e.g. 8000"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Emergency fund, travel, laptop, debt payoff</span>
                </div>

                {/* 3. Asset Sleeve Input (Pro & Admin) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      3. Risk & Safe Assets Allocation (PHP)
                    </label>
                    {!isProOrAdmin && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[9px] font-black uppercase">
                        PRO ONLY
                      </span>
                    )}
                  </div>
                  <SmartCalculatorInput
                    label=""
                    value={inputAssetAlloc}
                    onChange={setInputAssetAlloc}
                    placeholder="e.g. 5000"
                    disabled={!isProOrAdmin}
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {isProOrAdmin ? 'Auto-DCA into Maya HYS, T-Bills, BTC, Equities' : 'Upgrade to Pro to allocate income to Assets'}
                  </span>
                </div>
              </div>

              {isProOrAdmin && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Target Deployment Asset
                  </label>
                  <select
                    value={selectedDeployAssetKey}
                    onChange={(e) => setSelectedDeployAssetKey(e.target.value)}
                    className="w-full sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {assets.map((a) => (
                      <option key={a.key} value={a.key} className="bg-slate-900 text-white">
                        {a.name} ({a.class.toUpperCase()} - {a.assetType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                <button
                  onClick={() => setEditingAllocations(false)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocations}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Allocation Matrix
                </button>
              </div>
            </div>
          ) : (
            /* Allocations Read-Only Cards Row */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Destination 1: Expense Cap */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Monthly Expense Cap</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {monthlyNetIncome > 0 ? `${((expenseCapAllocation / monthlyNetIncome) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  ₱{expenseCapAllocation.toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                  <span className="text-slate-400">Realized Inflow MTD:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    ₱{(is30thRealized ? expenseCapAllocation : is15thRealized ? expenseCapAllocation / 2 : 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Funded from Net Income for monthly living expenses
                </p>
              </div>

              {/* Destination 2: Personal Goals */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Personal Goals & Savings</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {monthlyNetIncome > 0 ? `${((personalGoalsAllocation / monthlyNetIncome) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₱{personalGoalsAllocation.toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                  <span className="text-slate-400">Realized Inflow MTD:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₱{(is30thRealized ? personalGoalsAllocation : is15thRealized ? personalGoalsAllocation / 2 : 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    ₱{(personalGoalsAllocation / 2).toLocaleString()} per payday
                  </span>
                  {goals.length > 0 && personalGoalsAllocation > 0 && (
                    <button
                      onClick={handleDepositPaydayToGoals}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      + Deposit Payday Inflow
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 3: Asset Sleeve Deployments */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Risk & Safe Assets Sleeve</span>
                  </span>
                  {isProOrAdmin ? (
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      {monthlyNetIncome > 0 ? `${((assetInvestmentAllocation / monthlyNetIncome) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[9px] font-black uppercase">
                      PRO
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  ₱{effectiveAssetAllocation.toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                  <span className="text-slate-400">Realized Inflow MTD:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    ₱{(is30thRealized ? effectiveAssetAllocation : is15thRealized ? effectiveAssetAllocation / 2 : 0).toLocaleString()}
                  </span>
                </div>
                {isProOrAdmin ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {assets.find((a) => a.key === selectedDeployAssetKey)?.name || 'Safe HYS / Maya'}
                    </span>
                    {effectiveAssetAllocation > 0 && (
                      <button
                        onClick={handleDeployToAssetClick}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        + Deploy to Asset
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Automated asset DCA is unlocked for Pro & Admin users
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CATEGORY LIMIT CONTROLS & DESIRED MONTHLY EXPENSE CAP */}
      {/* ------------------------------------------------------------- */}
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
              Funded directly by your Monthly Net Income. Automatically allocated every month to guard against overspending.
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
                      if (!isNaN(val) && val >= 0) {
                        setDesiredMonthlyBudget(val);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('desired_monthly_expense_limit', val.toString());
                        }
                        if (onUpdateIncomePlan && incomeBudgetPlan) {
                          onUpdateIncomePlan({
                            ...incomeBudgetPlan,
                            expenseCapAllocation: val,
                          });
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
                    <span
                      className={`text-xs font-bold font-mono ${
                        totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth && activeMonthlyCapForSelectedMonth > 0
                          ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {activeMonthlyCapForSelectedMonth > 0
                        ? `${((totalSpentInSelectedMonth / activeMonthlyCapForSelectedMonth) * 100).toFixed(1)}% Used`
                        : '0% Used'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth && activeMonthlyCapForSelectedMonth > 0
                          ? 'bg-rose-600'
                          : (totalSpentInSelectedMonth / (activeMonthlyCapForSelectedMonth || 1)) > 0.8
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${activeMonthlyCapForSelectedMonth > 0 ? Math.min((totalSpentInSelectedMonth / activeMonthlyCapForSelectedMonth) * 100, 100) : 0}%` }}
                    />
                  </div>
                  {totalSpentInSelectedMonth >= activeMonthlyCapForSelectedMonth && activeMonthlyCapForSelectedMonth > 0 && (
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
                <span>Automated Income Flow Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-indigo-200/80">
                Monthly Cap (₱{desiredMonthlyBudget.toLocaleString()}) receives ₱{(desiredMonthlyBudget / 2).toLocaleString()} on the 15th and ₱{(desiredMonthlyBudget / 2).toLocaleString()} on the 30th from Net Income.
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

      {/* ------------------------------------------------------------- */}
      {/* 4. PERSONAL GOALS & SAVINGS TARGETS TRACKER SECTION */}
      {/* ------------------------------------------------------------- */}
      <div
        id="personal-goals-section"
        data-highlight-id="personal-goals-section"
        className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs mb-1">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Personal Financial Milestones & Savings Targets</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Personal Goals & Savings Targets Tracker</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Funded by Monthly Net Income (₱{personalGoalsAllocation.toLocaleString()}/mo) & unspent budget surplus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {goals.length > 0 && personalGoalsAllocation > 0 && (
              <button
                onClick={handleDepositPaydayToGoals}
                title="Equally split bi-monthly payday goal allocation across active goals"
                className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>+ Deposit Payday Inflow (₱{(personalGoalsAllocation / 2).toLocaleString()})</span>
              </button>
            )}
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Personal Goal</span>
            </button>
          </div>
        </div>

        {/* Goal Summary Statistics KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Targets</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{goals.length}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Personal Milestones</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Target Capital</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₱{totalGoalTargetPHP.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Combined Milestone Target</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Funded</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₱{totalGoalCurrentPHP.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {overallGoalProgressPercent.toFixed(1)}% Overall Progress
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-500/20 rounded-xl p-4">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Monthly Inflow Allocation</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono">
              ₱{personalGoalsAllocation.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80 font-medium">
              ₱{(personalGoalsAllocation / 2).toLocaleString()} per 15th & 30th
            </span>
          </div>
        </div>

        {/* Goals List Grid */}
        {goals.length === 0 ? (
          /* Empty State with 1-Click Starter Presets */
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Personal Goals Configured Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Set milestones for emergency safety buffers, dream vacations, tech gear, or debt containment. Choose a quick starter preset or build a custom goal:
              </p>
            </div>

            {/* Quick Starter Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto pt-2 text-left">
              {GOAL_STARTER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (onAddGoal) {
                      onAddGoal({
                        title: preset.title,
                        targetPHP: Number(preset.target),
                        currentPHP: Number(preset.current),
                        deadline: '2026-12-31',
                        category: preset.category,
                        notes: preset.notes,
                      });
                    }
                  }}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl transition-all shadow-xs hover:shadow-md group cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-1">
                    {preset.title}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Target: ₱{Number(preset.target).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.notes}</div>
                  <div className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>+ Quick Add Preset</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const target = g.targetPHP || 1;
              const current = g.currentPHP || 0;
              const progressPct = Math.min(100, (current / target) * 100);
              const isCompleted = current >= target;
              const remainingPHP = Math.max(0, target - current);
              const catDetails = getGoalCategoryDetails(g.category);
              const CatIcon = catDetails.icon;

              return (
                <div
                  key={g.id}
                  id={`goal-${g.id}`}
                  className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs"
                >
                  {/* Top Bar: Category Pill & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${catDetails.badgeBg}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{g.category || 'Personal Goal'}</span>
                      </div>
                      {isCompleted && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>100% Achieved</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditGoalModal(g)}
                        title="Edit Goal"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteGoal && (
                        <button
                          onClick={() => onDeleteGoal(g.id)}
                          title="Delete Goal"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Goal Title & Target Stats */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{g.title}</h3>
                    {g.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{g.notes}</p>}

                    <div className="mt-3 flex items-baseline justify-between">
                      <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        ₱{current.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ ₱{target.toLocaleString()}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {progressPct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : catDetails.progressBar
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                      <span>{isCompleted ? 'Target Fulfilled' : `₱${remainingPHP.toLocaleString()} remaining`}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Due {g.deadline || '2026-12-31'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Contribution Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Quick Deposit / Fund:</span>
                      <button
                        onClick={() => {
                          setFundingGoal(g);
                          setFundingAmount('1000');
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        + Custom Deposit
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleQuickContribute(g.id, 500)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-white/5 hover:border-emerald-300 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        +₱500
                      </button>
                      <button
                        onClick={() => handleQuickContribute(g.id, 1000)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-white/5 hover:border-emerald-300 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        +₱1,000
                      </button>
                      <button
                        onClick={() => handleQuickContribute(g.id, 5000)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-white/5 hover:border-emerald-300 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer"
                      >
                        +₱5,000
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* MONTHLY NET INCOME CONFIGURATION MODAL */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Monthly Net Income</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Starts with zero money. Scheduled to add on 15th and 30th.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = parseFormattedNumber(incomeInputStr);
                if (parsed >= 0) {
                  handleSaveIncome(parsed);
                }
              }}
              className="space-y-4"
            >
              <div>
                <SmartCalculatorInput
                  label="Monthly Net Take-Home Income (PHP)"
                  value={incomeInputStr}
                  onChange={setIncomeInputStr}
                  placeholder="e.g. 28000"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Example: If set to <strong>₱28,000</strong>, the app schedules <strong>₱14,000</strong> on the 15th and <strong>₱14,000</strong> on the 30th.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Automatic Payday Schedule:</div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>• 1st Installment (15th Day):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₱{(parseFormattedNumber(incomeInputStr) / 2 || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>• 2nd Installment (30th Day):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₱{(parseFormattedNumber(incomeInputStr) / 2 || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm cursor-pointer"
                >
                  Save Net Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG NEW EXPENSE MODAL */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Expense Outflow</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Record living costs against your Monthly Expense Cap.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Description / Item
                </label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. S&R Groceries, Electric Bill, Travel"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Category Bucket
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {budgets.map((b) => (
                      <option key={b.category} value={b.category}>
                        {b.category}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="PHP">PHP (₱)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>
              </div>

              <div>
                <SmartCalculatorInput
                  label={`Amount in ${currency}`}
                  value={amount}
                  onChange={setAmount}
                  placeholder="e.g. 1500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="familySharedExp"
                  checked={familyShared}
                  onChange={(e) => setFamilyShared(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="familySharedExp" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  Shared Household Outflow
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm cursor-pointer"
                >
                  Record Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PERSONAL GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Personal Financial Goal</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Establish personal targets funded by Monthly Net Income.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Goal Title / Milestone Name
                </label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. 3-Month Emergency Safety Fund, Japan Trip 2026"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Category Bucket
                  </label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Emergency Fund">🛡️ Emergency Safety Fund</option>
                    <option value="Travel & Vacation">✈️ Travel & Vacation</option>
                    <option value="Tech & Hardware">💻 Tech & Gadgets</option>
                    <option value="Debt Payoff">💳 Debt Elimination</option>
                    <option value="Investments">📈 Investment Seed Fund</option>
                    <option value="Home & Living">🏡 Home & Living</option>
                    <option value="Milestone & Lifestyle">🎯 Milestone & Lifestyle</option>
                    <option value="Other">🌟 Other Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SmartCalculatorInput
                    label="Target Amount (PHP)"
                    value={newGoalTarget}
                    onChange={setNewGoalTarget}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <SmartCalculatorInput
                    label="Starting Capital Saved (PHP)"
                    value={newGoalCurrent}
                    onChange={setNewGoalCurrent}
                    placeholder="e.g. 0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Notes / Motivation (Optional)
                </label>
                <input
                  type="text"
                  value={newGoalNotes}
                  onChange={(e) => setNewGoalNotes(e.target.value)}
                  placeholder="e.g. High-interest digital bank stash for safety cushion"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERSONAL GOAL MODAL */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Personal Goal</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Modify milestone deadlines, targets, or details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Goal Title / Name
                </label>
                <input
                  type="text"
                  required
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Category Type
                  </label>
                  <select
                    value={editGoalCategory}
                    onChange={(e) => setEditGoalCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Emergency Fund">🛡️ Emergency Safety Fund</option>
                    <option value="Travel & Vacation">✈️ Travel & Vacation</option>
                    <option value="Tech & Hardware">💻 Tech & Gadgets</option>
                    <option value="Debt Payoff">💳 Debt Elimination</option>
                    <option value="Investments">📈 Investment Seed Fund</option>
                    <option value="Home & Living">🏡 Home & Living</option>
                    <option value="Milestone & Lifestyle">🎯 Milestone & Lifestyle</option>
                    <option value="Other">🌟 Other Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editGoalDeadline}
                    onChange={(e) => setEditGoalDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SmartCalculatorInput
                    label="Target Amount (PHP)"
                    value={editGoalTarget}
                    onChange={setEditGoalTarget}
                  />
                </div>
                <div>
                  <SmartCalculatorInput
                    label="Current Saved Capital (PHP)"
                    value={editGoalCurrent}
                    onChange={setEditGoalCurrent}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Notes / Motivation (Optional)
                </label>
                <input
                  type="text"
                  value={editGoalNotes}
                  onChange={(e) => setEditGoalNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm cursor-pointer"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONTRIBUTION DEPOSIT MODAL */}
      {fundingGoal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Fund Goal</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[180px]">
                    {fundingGoal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFundingGoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomFundingSubmit} className="space-y-4">
              <div>
                <SmartCalculatorInput
                  label="Deposit Amount (PHP)"
                  value={fundingAmount}
                  onChange={setFundingAmount}
                  placeholder="e.g. 2500"
                />
              </div>

              {monthlySurplusPHP > 0 && (
                <button
                  type="button"
                  onClick={() => setFundingAmount(monthlySurplusPHP.toString())}
                  className="w-full py-1.5 px-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Use Entire Monthly Surplus (₱{monthlySurplusPHP.toLocaleString()})</span>
                </button>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setFundingGoal(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm cursor-pointer"
                >
                  Deposit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
