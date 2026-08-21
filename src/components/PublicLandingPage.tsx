import React, { useState } from 'react';
import { 
  Shield, 
  TrendingUp, 
  PieChart, 
  CreditCard, 
  Zap, 
  Check, 
  ArrowRight, 
  Lock, 
  Globe, 
  ChevronRight, 
  Sparkles,
  BarChart3,
  Building2,
  DollarSign,
  UserCheck,
  Wallet,
  Coins,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  Activity,
  Calendar,
  RefreshCw,
  Sliders,
  BellRing,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import SignInPanel from './SignInPanel';

interface PublicLandingPageProps {
  onOpenSignIn: () => void;
  onExploreGuest: () => void;
  onOpenPolicyModal?: () => void;
}

export default function PublicLandingPage({ onOpenSignIn, onExploreGuest, onOpenPolicyModal }: PublicLandingPageProps) {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleOpenSignIn = () => {
    setIsSignInModalOpen(true);
    onOpenSignIn();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-white/10 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                BUDGET PORTFOLIO
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md">
                  PRO
                </span>
              </span>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Institutional Wealth & Cash Flow Cockpit</p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <a href="#overview" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Overview</a>
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Capabilities</a>
            <a href="#live-preview" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Live Matrix</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onExploreGuest}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all shadow-2xs flex items-center gap-2 cursor-pointer hidden sm:flex"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Explore Demo</span>
            </button>
            <button
              onClick={handleOpenSignIn}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="relative pt-16 pb-20 overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
        <div className="absolute inset-0 opacity-4 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase tracking-widest shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600 animate-pulse" />
            <span>Real-Time Balance Sheet • MarketWatch Feeds • Payday Matrix • Budget Portfolio AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.12]">
            Total Net Worth, Cash Flow & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-teal-300">Market-Driven Wealth</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
            Eliminate guesswork with dynamic balance sheet tracking across Safe Shield reserves, MarketWatch Philippine Equities & REITs, Global Crypto, Physical Real Estate, and 15th/30th Payday Cash Flow automation.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleOpenSignIn}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Launch Budget Portfolio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onExploreGuest}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Interactive Live Demo</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Live Dynamic Preview Grid */}
          <div id="live-preview" className="pt-10 max-w-5xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Real Net Worth</p>
                  <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg"><TrendingUp className="w-3.5 h-3.5" /></span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">Dynamic Valuation</p>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Assets - Debt Liabilities
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Payday Matrix</p>
                  <span className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg"><Calendar className="w-3.5 h-3.5" /></span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">15th & 30th Schedule</p>
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto-allocated take-home
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Market Feeds</p>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg"><BarChart3 className="w-3.5 h-3.5" /></span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">MarketWatch & TV</p>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> PSEi, SCC, SPC, BTC
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">AI Intelligence</p>
                  <span className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg"><Sparkles className="w-3.5 h-3.5" /></span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">Budget Portfolio AI</p>
                <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Gemini natural language actions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities & Core Pillars Section */}
      <section id="features" className="py-20 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Institutional Precision Engineering</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Unified Multi-Class Wealth Management</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto font-medium">
              Replace fragmented spreadsheets with a synchronized, real-time command cockpit tailored for both Philippine local finances and global capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Dynamic Balance Sheet */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Dynamic Net Worth & Safe Shield</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Accurately track your balance sheet without hardcoded numbers. Automatic split across Safe Shield cash/HYS (target 85%), high-growth risk sleeves (15%), physical assets, and deducted debt liabilities.
              </p>
            </div>

            {/* Pillar 2: 15th & 30th Payday Matrix */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">15th & 30th Payday Cash Flow Hub</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Enforce strict income distribution ceilings. Calibrate your take-home net salary across living expense caps, personal savings targets, and automatic payday asset deployments with 1-click execution.
              </p>
            </div>

            {/* Pillar 3: MarketWatch & TradingView Feeds */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">MarketWatch PSE & TradingView Charts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Live official MarketWatch quotes for Philippine Stock Exchange stocks and REITs (SCC, SPC, RCR, AREIT, CREIT) paired with interactive TradingView technical candlestick charts.
              </p>
            </div>

            {/* Pillar 4: Budget Portfolio AI Copilot */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Budget Portfolio AI (Gemini Copilot)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Natural language financial copilot with voice-to-text. Ask for instant Net Worth audits, adjust payday income plans, log expenses, or register assets with automatic parameter suggestions and guardrails.
              </p>
            </div>

            {/* Pillar 5: Collaborative Social Family Sync */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Social Family Sync & Shared Goals</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Plan together with multi-contributor collaborative goals (Emergency Funds, Tuition, Vacations) and transparent household outflow distribution tracking.
              </p>
            </div>

            {/* Pillar 6: Cloud Sync & Excel Export Engine */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Cloud Backup & Multi-Sheet Excel</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Secure real-time synchronization backed by Google Firebase Firestore. Export complete multi-tab Excel/CSV financial statements and JSON vaults anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Transparent Membership</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Choose Your Wealth Tier</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium">
              Start free forever with local budgeting, or activate PRO for real-time cloud sync, MarketWatch asset sleeves, and full net worth analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full">
                  Free Starter
                </span>
                <div>
                  <span className="text-4xl font-black text-slate-900 dark:text-white">₱0</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold"> / forever</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Perfect for daily expense tracking and foundational budgeting.</p>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Cash Flow & Expense Ledger Outflows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Category Spending Caps & Progress Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Collaborative Social Family Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Audit Trail Transaction History</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Multi-Currency Support (PHP/USD/EUR/JPY)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenSignIn}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-b from-blue-50/90 to-white dark:from-blue-950/40 dark:to-slate-900 border-2 border-blue-600/80 rounded-3xl p-8 space-y-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white px-4 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-bl-2xl">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-extrabold text-[10px] uppercase tracking-wider rounded-full">
                  Enterprise PRO
                </span>
                <div>
                  <span className="text-4xl font-black text-slate-900 dark:text-white">₱499</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold"> / month ($9.99)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Complete institutional capability with real-time sync, MarketWatch PSE feeds, and AI copilot.</p>
                <ul className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200 pt-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Everything in Starter Free Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Real-Time Cloud Synchronization (Google Firestore)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>MarketWatch PSE & REITs + TradingView Candlestick Charts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Dynamic Net Worth Curves & Historical Multi-Period Indices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>15th & 30th Payday Asset Deployment Automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Instant GCash & Maya Reference Payment Verification</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenSignIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Launch PRO Portfolio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="security" className="py-12 bg-white dark:bg-slate-900 text-slate-500 text-xs border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white">BUDGET PORTFOLIO</p>
              <p className="text-[10px] text-slate-500">Institutional Financial Command Center</p>
            </div>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Financial Disclaimer
            </button>
          </div>

          <p className="text-center md:text-right max-w-xs text-[11px] leading-relaxed text-slate-500 font-medium">
            Built with isolated dual authentication & encrypted Firestore data transport.
          </p>
        </div>
      </footer>

      {/* Sign In Modal Overlay */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setIsSignInModalOpen(false)}
              className="absolute -top-12 left-0 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Landing Page</span>
            </button>
            <SignInPanel 
              onSignIn={() => setIsSignInModalOpen(false)} 
              onClose={() => setIsSignInModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

