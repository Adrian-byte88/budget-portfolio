import React, { useState } from 'react';
import { Crown, X, Copy, Check, QrCode, ShieldCheck, Send, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface GCashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onPaymentSubmitted?: (refNo: string) => void;
  onTriggerToast?: (title: string, desc: string, type: 'success' | 'warning' | 'error') => void;
}

export default function GCashPaymentModal({
  isOpen,
  onClose,
  userEmail,
  onPaymentSubmitted,
  onTriggerToast
}: GCashPaymentModalProps) {
  const GCASH_NUMBER = "09977862494";
  const GCASH_NAME = "JUNNEL R. (Wealth Vault Admin)";
  const PRO_PRICE_PHP = "499";

  const [copied, setCopied] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(() => {
    return localStorage.getItem(`pending_gcash_ref_${userEmail}`) || null;
  });

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(GCASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', `GCash Number ${GCASH_NUMBER} copied.`, 'success');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim() || refNumber.trim().length < 6) {
      if (onTriggerToast) {
        onTriggerToast('Invalid Reference Number', 'Please enter a valid GCash reference number (at least 6-13 digits).', 'error');
      }
      return;
    }

    setIsSubmitting(true);
    const cleanRef = refNumber.trim();

    try {
      // Save submission to Firestore
      if (userEmail) {
        const submissionData = {
          userEmail,
          gcashRef: cleanRef,
          senderName: senderName.trim() || 'Unspecified',
          amountPHP: PRO_PRICE_PHP,
          status: 'pending_verification',
          submittedAt: new Date().toISOString(),
        };

        // Save in user's profile and global submissions
        await setDoc(doc(db, "users", userEmail, "financialData", "data"), {
          pendingPayment: submissionData
        }, { merge: true });

        await addDoc(collection(db, "payment_submissions"), submissionData);
      }

      localStorage.setItem(`pending_gcash_ref_${userEmail}`, cleanRef);
      setSubmittedRef(cleanRef);

      if (onTriggerToast) {
        onTriggerToast(
          'Payment Reference Submitted!',
          `GCash Ref #${cleanRef} recorded. Verification is pending approval by admin.`,
          'success'
        );
      }

      if (onPaymentSubmitted) {
        onPaymentSubmitted(cleanRef);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payment_submissions');
      if (onTriggerToast) {
        onTriggerToast('Submission Error', 'Failed to save reference number. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-amber-300 text-xs font-black uppercase tracking-widest mb-1">
            <Crown className="w-4 h-4 fill-amber-300" />
            <span>WEALTH VAULT PRO UPGRADE</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">GCash Payment Verification</h3>
          <p className="text-xs text-blue-100 mt-1">
            Send <b>₱{PRO_PRICE_PHP}/month</b> to our official GCash account to unlock full Pro access.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* GCash Account Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center space-x-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Official GCash Account</span>
              </span>
              <span className="text-xs font-black text-blue-900 dark:text-blue-200">₱{PRO_PRICE_PHP} / month</span>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-200 dark:border-white/10 shadow-xs">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">GCash Mobile Number</p>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-wider">{GCASH_NUMBER}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{GCASH_NAME}</p>
              </div>

              <button
                type="button"
                onClick={handleCopyNumber}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Pending Submission Notice if exists */}
          {submittedRef && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-800 dark:text-amber-300">
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-spin" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold uppercase tracking-wider">Payment Reference Submitted</p>
                <p className="text-[11px] leading-relaxed">
                  Ref #: <b className="font-mono">{submittedRef}</b> is under verification by our admin. Your account will be updated automatically upon confirmation.
                </p>
              </div>
            </div>
          )}

          {/* Step-by-Step Payment Instructions */}
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Payment Steps</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 font-medium pl-1">
              <li>Open your <b>GCash App</b> and select <b>Send Money &gt; Express Send</b>.</li>
              <li>Enter GCash Number: <b className="font-mono text-blue-600 dark:text-blue-400">{GCASH_NUMBER}</b></li>
              <li>Enter Amount: <b className="font-mono text-slate-900 dark:text-white">₱{PRO_PRICE_PHP}</b></li>
              <li>Complete payment and copy your <b>13-digit GCash Reference Number</b>.</li>
              <li>Paste the reference number below to request instant account activation.</li>
            </ol>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmitVerification} className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <label htmlFor="gcash-modal-ref-number" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                GCash Reference Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="gcash-modal-ref-number"
                name="gcash_reference_number"
                type="text"
                required
                placeholder="e.g. 2026080112345"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label htmlFor="gcash-modal-sender-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sender GCash Name or Phone (Optional)
              </label>
              <input
                id="gcash-modal-sender-name"
                name="gcash_sender_name"
                type="text"
                placeholder="e.g. Juan De La Cruz / 0917xxxxxxx"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                autoComplete="name"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Payment Verification'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
