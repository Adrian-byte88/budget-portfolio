import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, CheckCircle2, X, ExternalLink, ChevronRight } from 'lucide-react';

export interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isMandatory?: boolean;
  acceptedAt?: string | null;
}

export const POLICY_VERSION = 'v1.0';
export const POLICY_KEY = 'wealthvault_policy_accepted_v1';

export default function PolicyModal({
  isOpen,
  onClose,
  onAccept,
  isMandatory = false,
  acceptedAt = null,
}: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');
  const [hasAgreed, setHasAgreed] = useState(false);

  if (!isOpen) return null;

  const handleAgreeAndSubmit = () => {
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Terms, Privacy & Financial Disclaimer
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700/50">
                  {POLICY_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMandatory
                  ? 'Please review and accept our policies to continue using Budget Portfolio.'
                  : 'Official Budget Portfolio User Agreement, Data Protection Standards & Disclaimers.'}
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/40 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>2. Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>3. Financial Disclaimer</span>
          </button>
        </div>

        {/* Scrollable Policy Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-h-[50vh]">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase mb-1">
                  1. Terms of Service & Software License
                </h4>
                <p>
                  By accessing or using <b>Budget Portfolio (WealthVault)</b>, you agree to be bound by these Terms of Service. Budget Portfolio provides a self-managed, non-custodial financial cockpit, ledger tracking system, and portfolio allocation tool.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">Key Service Understandings:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li><b>Non-Custodial Platform:</b> Budget Portfolio does not hold, manage, transfer, or take custody of your money, cryptocurrencies, bank accounts, or real estate assets.</li>
                  <li><b>User Accountability:</b> All asset valuations, yield inputs, expense records, and trade entries are configured directly by you or retrieved via public market data feeds. You are responsible for verifying your financial figures.</li>
                  <li><b>Account Security:</b> Authentication is handled securely via Firebase Auth. You are solely responsible for maintaining the confidentiality of your credentials.</li>
                  <li><b>Subscription & Pricing Plans:</b> Starter features are provided free of charge. PRO features (e.g., automated Firestore cloud syncing, advanced devaluation stress-tests, Safe Shield rebalance triggers) are made available per tier specifications.</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white mb-1">System Integrity & Prohibited Actions</h5>
                <p>
                  You agree not to attempt to reverse engineer, disrupt, overload, or exploit the platform, its backend server, or market pricing APIs. Unauthorized scraping, automated bot attacks, or attempt to access admin controls without authorization is strictly prohibited.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase mb-1">
                  2. Privacy Policy & Data Protection
                </h4>
                <p>
                  At <b>Budget Portfolio</b>, we prioritize your data privacy and security. We maintain strict privacy principles designed to protect your financial ledger and personal identity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>No Selling of Personal Data</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    We never sell, rent, trade, or monetize your personal financial ledger or email address to third-party advertisers.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Isolated Firestore Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Signed-in user financial data is stored securely in Firebase Firestore under isolated user documents protected by security rules.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 rounded-xl space-y-2">
                <p className="font-bold text-blue-900 dark:text-blue-200">AI Assistant & Search Confidentiality:</p>
                <p className="text-blue-800 dark:text-blue-300">
                  Interactions with our institutional financial helper ("Ask AI") use secure Google Gemini endpoints. Prompts sent to Ask AI are processed strictly for answering your financial queries and are not used to train public foundation models without permission.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase mb-1">
                  3. Institutional Financial Disclaimer
                </h4>
                <p>
                  Please read this financial disclaimer carefully before utilizing Budget Portfolio, its calculators, AI prompts, or market cycle analysis.
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300 uppercase">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>NOT REGISTERED FINANCIAL ADVICE</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Budget Portfolio is an informational software tool designed solely for personal ledger organization, yield calculation, and portfolio allocation visualization. <b>Nothing contained within Budget Portfolio, its AI assistant, or market cycle indicators constitutes registered financial, investment, legal, tax, or accounting advice.</b>
                </p>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <p>
                  <b>Market Volatility Risk:</b> Financial markets (including cryptocurrencies, equities, foreign exchange, and real estate) carry inherent risk of capital loss. Past performance figures or market cycle simulations do not guarantee future returns.
                </p>
                <p>
                  <b>Independent Due Diligence:</b> Users are strongly advised to conduct their own independent research and consult a licensed financial advisor, certified tax professional, or legal practitioner before making any financial decisions or asset allocations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Acceptance & Footer Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {acceptedAt ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Policy Accepted on {new Date(acceptedAt).toLocaleDateString()}</span>
              </div>
            ) : (
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                />
                <span>I have read, understood & agree to the Terms, Privacy Policy & Disclaimer</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            )}

            <button
              type="button"
              disabled={!acceptedAt && !hasAgreed}
              onClick={handleAgreeAndSubmit}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                acceptedAt || hasAgreed
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{acceptedAt ? 'Acknowledge Policies' : 'Agree & Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
