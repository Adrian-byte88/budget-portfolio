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
  ArrowLeft
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                BUDGET PORTFOLIO
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 rounded-md">
                  PRO
                </span>
              </span>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Institutional Financial Cockpit</p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            <a href="#overview" className="hover:text-blue-600 transition-colors">Overview</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onExploreGuest}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 font-bold text-xs transition-all shadow-2xs flex items-center gap-2 cursor-pointer hidden sm:flex"
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
      <section id="overview" className="relative pt-16 pb-24 overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 opacity-4 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-extrabold uppercase tracking-widest shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span>Institutional Financial Command Center</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Master Your Capital with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600">Precision & Control</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Unified multi-currency transaction ledger, high-yield savings optimizer, live foreign exchange conversion, and safe-sleeve portfolio risk management.
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
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Browse Live Demo Cockpit</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Metric Highlights Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 text-left">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Yield Engine</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">High-Yield APY</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Compound Interest Sync</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Multi-Currency</p>
              <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">Global FX</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Live Exchange Rates</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Portfolio Shield</p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">Safe Sleeves</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Risk Controlled Allocation</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Security</p>
              <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">Cloud Sync</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Encrypted Storage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities / Features Section */}
      <section id="features" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Engineered for Precision</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">Complete Financial Oversight</p>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-medium">
              Replace fragmented spreadsheets with a synchronized, real-time wealth cockpit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">High-Yield Savings Optimizer</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Automatically compute daily compound yield for high-yield savings accounts. Track net tax impact and monthly interest distributions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Multi-Currency Transaction Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Log income, fixed expenses, and investments with live FX conversion across Philippine Peso (PHP), US Dollar (USD), Euro (EUR), and Japanese Yen (JPY).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Safe Shield & Asset Sleeves</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Structure portfolio capital into Safe Shield cash reserves vs Alpha Growth sleeves (crypto, stocks, mutual funds). Stay protected against drawdowns.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Market Cycle & Price Audits</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Monitor live market indices (PSEi, S&P 500, Manulife Funds, Bitcoin, Gold) with automated trend analysis and risk score metrics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Local Settlement Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Integrated payment verification workflow for GCash & Maya direct reference uploads, keeping membership and subscription records transparent.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Cloud Backup & Export Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Export your ledger to JSON or CSV backups anytime. Powered by Google Firebase Firestore for secure end-to-end synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Transparent Membership</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">Choose Your Wealth Plan</p>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-medium">
              Get started for free or upgrade to Enterprise PRO for automated live synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-full">
                  Free Starter
                </span>
                <div>
                  <span className="text-4xl font-black text-slate-900">₱0</span>
                  <span className="text-slate-500 text-xs font-semibold"> / forever</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Perfect for individual expense tracking and basic portfolio planning.</p>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Transaction Ledger & Expense Tracker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>High-Yield Savings Compound Calculator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Multi-Currency Conversion (PHP/USD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Standard Local Storage Backup</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenSignIn}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-b from-blue-50/80 to-white border-2 border-blue-600/80 rounded-3xl p-8 space-y-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white px-4 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-bl-2xl">
                POPULAR CHOICE
              </div>
              <div className="space-y-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-[10px] uppercase tracking-wider rounded-full">
                  Enterprise PRO
                </span>
                <div>
                  <span className="text-4xl font-black text-slate-900">₱499</span>
                  <span className="text-slate-500 text-xs font-semibold"> / month ($9.99)</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Full institutional capability with real-time sync and AI integrations.</p>
                <ul className="space-y-2.5 text-xs text-slate-800 pt-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Everything in Starter Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Real-Time Cloud Synchronization (Firestore)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Safe Shield Asset Sleeve Allocation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Market Cycle Audits & Live Benchmark Feeds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Instant GCash & Maya Reference Verification</span>
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
      <footer id="security" className="py-12 bg-white text-slate-500 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">BUDGET PORTFOLIO</p>
              <p className="text-[10px] text-slate-500">Institutional Financial Command Center</p>
            </div>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600">
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={onOpenPolicyModal}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Financial Disclaimer
            </button>
          </div>

          <p className="text-center md:text-right max-w-xs text-[11px] leading-relaxed text-slate-500 font-medium">
            Built with isolated authentication & encrypted Firestore data transport.
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
