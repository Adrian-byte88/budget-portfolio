import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, QrCode, Copy, Check, Send, Clock, ShieldCheck, Sparkles, Layers, Activity, PieChart, ArrowRight, User, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface PricingPlanTabProps {
  subscriptionTier: 'free' | 'pro';
  isAdmin: boolean;
  userEmail: string;
  onOpenGCashModal: () => void;
  onUpdateSubscriptionTier?: (tier: 'free' | 'pro') => void;
  onTriggerToast?: (title: string, desc: string, type: 'success' | 'warning' | 'error') => void;
}

interface PaymentSubmission {
  id: string;
  userEmail: string;
  gcashRef: string;
  senderName: string;
  amountPHP: string;
  status: string;
  submittedAt: string;
}

export default function PricingPlanTab({
  subscriptionTier,
  isAdmin,
  userEmail,
  onOpenGCashModal,
  onUpdateSubscriptionTier,
  onTriggerToast
}: PricingPlanTabProps) {
  const GCASH_NUMBER = "09977862494";
  const GCASH_NAME = "JUNNEL R. (Wealth Vault Admin)";
  const PRO_PRICE_PHP = "499";

  const [copied, setCopied] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<PaymentSubmission[]>([]);

  // For Admin: Listen to all submitted GCash payment references
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, "payment_submissions"), (snapshot) => {
      const list: PaymentSubmission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentSubmission);
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setPendingSubmissions(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'payment_submissions');
    });
    return () => unsub();
  }, [isAdmin]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(GCASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', `GCash Number ${GCASH_NUMBER} copied.`, 'success');
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim() || refNumber.trim().length < 6) {
      if (onTriggerToast) {
        onTriggerToast('Invalid Reference Number', 'Please enter a valid GCash reference number.', 'error');
      }
      return;
    }

    setIsSubmitting(true);
    const cleanRef = refNumber.trim();

    try {
      if (userEmail) {
        const submissionData = {
          userEmail,
          gcashRef: cleanRef,
          senderName: senderName.trim() || 'Unspecified',
          amountPHP: PRO_PRICE_PHP,
          status: 'pending_verification',
          submittedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "users", userEmail, "financialData", "data"), {
          pendingPayment: submissionData
        }, { merge: true });
      }

      localStorage.setItem(`pending_gcash_ref_${userEmail}`, cleanRef);

      if (onTriggerToast) {
        onTriggerToast(
          'Payment Reference Submitted!',
          `GCash Ref #${cleanRef} recorded. Verification is pending approval by admin.`,
          'success'
        );
      }
      setRefNumber('');
      setSenderName('');
    } catch (err) {
      console.error("Error submitting reference:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminApprovePayment = async (submission: PaymentSubmission) => {
    try {
      // Upgrade user in firestore
      await setDoc(doc(db, "users", submission.userEmail, "financialData", "data"), {
        subscriptionTier: 'pro',
        pendingPayment: { ...submission, status: 'approved' }
      }, { merge: true });

      // Update payment submission doc
      await updateDoc(doc(db, "payment_submissions", submission.id), {
        status: 'approved'
      });

      if (onTriggerToast) {
        onTriggerToast('User Upgraded to Pro', `Confirmed payment for ${submission.userEmail}. Account active!`, 'success');
      }
    } catch (err) {
      console.error("Error approving payment:", err);
      if (onTriggerToast) {
        onTriggerToast('Approval Error', 'Failed to approve payment.', 'error');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="text-center space-y-3 bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent p-8 rounded-3xl border border-blue-100 dark:border-white/5 relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-widest">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Flexible Membership Plans</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Choose Your Financial Empowerment Tier
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Start with our standard Free Tier or unlock full algorithmic risk sleeve allocation, asset curves, and market audit tools with <b>Wealth Vault Pro</b>.
        </p>
      </div>

      {/* Pricing Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Free Tier Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Free Tier</span>
              {subscriptionTier === 'free' && !isAdmin && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Your Current Plan
                </span>
              )}
            </div>

            <div>
              <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">₱0</span>
              <span className="text-xs text-slate-500 font-semibold"> / forever free</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Essential expenditure tracking, budget limit meters, and family ledger sync for daily cashflow management.
            </p>

            <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Monthly Spend Overview (Expenditure Analysis)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Category Limit Controls & Budget Meters</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Expense Ledger Outflow Registry</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Social Family Sync & Shared Goals</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Historical Transaction Registry</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              disabled={subscriptionTier === 'free' && !isAdmin}
              onClick={() => onUpdateSubscriptionTier && onUpdateSubscriptionTier('free')}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {subscriptionTier === 'free' && !isAdmin ? 'Current Active Tier' : 'Switch to Free Tier'}
            </button>
          </div>
        </div>

        {/* Wealth Vault Pro Card */}
        <div className="bg-gradient-to-b from-blue-50/90 via-indigo-50/80 to-white dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-blue-500/50 dark:border-blue-500/40 rounded-3xl p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest shadow-sm">
            RECOMMENDED FOR INVESTORS
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Wealth Vault Pro</span>
              </span>
              {(subscriptionTier === 'pro' || isAdmin) && (
                <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs">
                  {isAdmin ? 'Admin Unlimited Access' : 'Active Subscription'}
                </span>
              )}
            </div>

            <div>
              <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">₱{PRO_PRICE_PHP}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold"> / month ($9.99/mo)</span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Complete access to full net worth curves, risk sleeve sub-allocations, trade execution registries, and macro devaluation audit engines.
            </p>

            <ul className="space-y-3 pt-4 border-t border-blue-200/50 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 font-bold">
              <li className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Full Net Worth Curves & Historical Indices</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>My Financial Portfolio (Editable Sub-Allocation Targets)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Risk & Safe Asset Sleeve Registry & Trade Entries</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Market Cycle Audit & USD Defense Matrix</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-time Multi-Device Sync & Priority Cloud Backup</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              onClick={onOpenGCashModal}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{subscriptionTier === 'pro' || isAdmin ? 'Manage GCash Subscription' : 'Upgrade via GCash (₱499/mo)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded GCash Payment Direct Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>GCash Official Payment Portal</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Send payment directly to our verified GCash number to submit your reference number.
            </p>
          </div>

          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center space-x-3">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">GCash Account Number</p>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono">{GCASH_NUMBER}</p>
            </div>
            <button
              onClick={handleCopyNumber}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer"
              title="Copy GCash Number"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick GCash Reference Form */}
        <form onSubmit={handleDirectSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="gcash-ref-number-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              GCash Reference Number
            </label>
            <input
              id="gcash-ref-number-input"
              name="gcash_reference_number"
              type="text"
              required
              placeholder="e.g. 2026080112345"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div>
            <label htmlFor="gcash-sender-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Sender Name (Optional)
            </label>
            <input
              id="gcash-sender-name-input"
              name="gcash_sender_name"
              type="text"
              placeholder="Your GCash Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              autoComplete="name"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Reference'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Verification Management Panel */}
      {isAdmin && (
        <div className="bg-purple-950/20 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
            <h3 className="text-sm font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <span>Executive Admin: Pending GCash Payment Verifications ({pendingSubmissions.filter(s => s.status === 'pending_verification').length})</span>
            </h3>
            <span className="text-xs text-purple-400 font-mono">Real-time Firestore Submissions</span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No pending payment reference submissions recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 bg-white dark:bg-slate-900 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{sub.userEmail}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
                      <span>Ref #: <b className="text-blue-600 dark:text-blue-400">{sub.gcashRef}</b></span>
                      <span>Sender: {sub.senderName}</span>
                      <span>Amount: ₱{sub.amountPHP}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Submitted: {new Date(sub.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {sub.status !== 'approved' && (
                    <button
                      onClick={() => handleAdminApprovePayment(sub)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Activate Pro</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
