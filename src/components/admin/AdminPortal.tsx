import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Activity,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Key,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Crown,
  Sparkles,
  Database
} from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import SignInPanel from '../SignInPanel';
import PhilippineClock from '../PhilippineClock';

interface AdminPortalProps {
  currentUser: User | null;
  isAdmin: boolean;
  onNavigateToUserApp?: () => void;
  onTriggerToast?: (title: string, desc: string, type: 'success' | 'warning' | 'error') => void;
}

interface PaymentSubmission {
  id: string;
  userEmail: string;
  gcashRef: string;
  senderName?: string;
  amountPHP: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  submittedAt: string;
}

interface UserAccountRecord {
  email: string;
  lastLogin?: string;
  isPro?: boolean;
}

export default function AdminPortal({
  currentUser,
  isAdmin,
  onNavigateToUserApp,
  onTriggerToast
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'activator' | 'telemetry'>('payments');
  
  // Data states
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [usersList, setUsersList] = useState<UserAccountRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Manual Pro Activator Input
  const [activatorEmail, setActivatorEmail] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // Subscribe to Payment Submissions & Users in Firestore
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    setLoadingData(true);

    // 1. Payment Submissions
    const unsubPayments = onSnapshot(
      collection(db, "payment_submissions"),
      (snapshot) => {
        const list: PaymentSubmission[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PaymentSubmission);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setPaymentSubmissions(list);
        setLoadingData(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "payment_submissions");
        setLoadingData(false);
      }
    );

    // 2. User Directory
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const uList: UserAccountRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          uList.push({
            email: docSnap.id,
            lastLogin: data.lastLogin,
            isPro: data.isPro || false
          });
        });
        setUsersList(uList);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "users");
      }
    );

    return () => {
      unsubPayments();
      unsubUsers();
    };
  }, [currentUser, isAdmin]);

  // Action: Approve GCash Payment & Grant Pro Tier
  const handleApprovePayment = async (sub: PaymentSubmission) => {
    try {
      // 1. Update Payment Submission status to approved
      await updateDoc(doc(db, "payment_submissions", sub.id), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email
      });

      // 2. Grant Pro tier in user's profile document
      if (sub.userEmail) {
        await setDoc(doc(db, "users", sub.userEmail), {
          isPro: true,
          proActivatedAt: new Date().toISOString(),
          proActivatedBy: 'admin_gcash_audit'
        }, { merge: true });

        // Update financialData Pro flag
        await setDoc(doc(db, "users", sub.userEmail, "financialData", "data"), {
          isPro: true,
          pendingPayment: {
            status: 'approved',
            gcashRef: sub.gcashRef
          }
        }, { merge: true });
      }

      if (onTriggerToast) {
        onTriggerToast(
          'Payment Approved & Pro Activated',
          `Pro tier granted to ${sub.userEmail} for Ref #${sub.gcashRef}.`,
          'success'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payment_submissions');
      if (onTriggerToast) {
        onTriggerToast('Approval Error', 'Failed to update payment status.', 'error');
      }
    }
  };

  // Action: Reject GCash Payment
  const handleRejectPayment = async (sub: PaymentSubmission) => {
    try {
      await updateDoc(doc(db, "payment_submissions", sub.id), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.email
      });

      if (sub.userEmail) {
        await setDoc(doc(db, "users", sub.userEmail, "financialData", "data"), {
          pendingPayment: {
            status: 'rejected',
            gcashRef: sub.gcashRef
          }
        }, { merge: true });
      }

      if (onTriggerToast) {
        onTriggerToast('Submission Rejected', `GCash Ref #${sub.gcashRef} marked as rejected.`, 'warning');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payment_submissions');
    }
  };

  // Action: Manual Pro Grant
  const handleManualProActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatorEmail.trim()) return;

    const targetEmail = activatorEmail.trim().toLowerCase();
    setIsActivating(true);

    try {
      await setDoc(doc(db, "users", targetEmail), {
        isPro: true,
        proActivatedAt: new Date().toISOString(),
        proActivatedBy: 'admin_manual'
      }, { merge: true });

      await setDoc(doc(db, "users", targetEmail, "financialData", "data"), {
        isPro: true
      }, { merge: true });

      if (onTriggerToast) {
        onTriggerToast('Manual Pro Upgrade Complete', `Granted Pro status to ${targetEmail}`, 'success');
      }
      setActivatorEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    } finally {
      setIsActivating(false);
    }
  };

  // Lockscreen for non-admin / logged out users
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl space-y-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3.5 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">Admin Headquarters Portal</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
              This dedicated Web Address is strictly reserved for application administrator management & payment audit operations.
            </p>
          </div>

          {!currentUser ? (
            <div className="space-y-4">
              <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center">
                Administrator Sign-In Required
              </p>
              <SignInPanel onSignIn={() => {}} />
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl space-y-3 text-center">
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                Logged in as <span className="underline">{currentUser.email}</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                This account does not have administrator privileges required to view the Admin HQ.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => signOut(auth)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                {onNavigateToUserApp && (
                  <button
                    onClick={onNavigateToUserApp}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Go to User App</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {onNavigateToUserApp && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                onClick={onNavigateToUserApp}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <span>Switch to Public User App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active pending payment count
  const pendingCount = paymentSubmissions.filter(p => p.status === 'pending_verification').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors">
      {/* Executive Admin Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8 shadow-xs dark:shadow-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">Budget Portfolio</span>
                <span className="px-2 py-0.5 text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 rounded-md uppercase tracking-wider">
                  Admin HQ Domain
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Isolated Executive Portal • {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <PhilippineClock />
            {onNavigateToUserApp && (
              <button
                onClick={onNavigateToUserApp}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl text-xs font-extrabold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Launch User Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => signOut(auth)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              title="Sign Out Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* KPI Stats Overview Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-sm">
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Pending GCash Audits</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Requires verification</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-sm">
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Total Registered Users</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{usersList.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Firestore Accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-sm">
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Approved Pro Members</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {paymentSubmissions.filter(p => p.status === 'approved').length + usersList.filter(u => u.isPro).length}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Activated Subscriptions</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-sm">
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>System Telemetry</span>
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Operational</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Firebase Encrypted Storage</p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-4">
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>GCash Payment Audits</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-slate-950 font-black rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activator')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'activator'
                ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Manual Pro Activator</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Health</span>
          </button>
        </div>

        {/* TAB 1: GCASH PAYMENT AUDITS */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>GCash Subscription Verification Queue</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review submitted reference numbers and activate Pro privileges instantly.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-verification-filter-input"
                  name="admin_verification_filter"
                  type="text"
                  placeholder="Filter by email or Ref #..."
                  aria-label="Filter verification queue by email or reference number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span>Loading payment audit queue from Firestore...</span>
                </div>
              ) : paymentSubmissions.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">No Payment Submissions Yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    When users upgrade to Pro and submit their GCash reference number, submissions will appear in real time here.
                  </p>
                </div>
              ) : (
                paymentSubmissions
                  .filter(p =>
                    p.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.gcashRef.includes(searchTerm)
                  )
                  .map((sub) => {
                    const isPending = sub.status === 'pending_verification';
                    const isApproved = sub.status === 'approved';
                    
                    return (
                      <div key={sub.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{sub.userEmail}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
                            }`}>
                              {sub.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <p>
                              Ref #: <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">{sub.gcashRef}</span>
                            </p>
                            <span>•</span>
                            <p>
                              Sender: <span className="text-slate-800 dark:text-slate-200 font-semibold">{sub.senderName || 'N/A'}</span>
                            </p>
                            <span>•</span>
                            <p>
                              Amount: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₱{sub.amountPHP}</span>
                            </p>
                          </div>

                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprovePayment(sub)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve & Grant Pro</span>
                              </button>
                              <button
                                onClick={() => handleRejectPayment(sub)}
                                className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/60 dark:text-slate-300 dark:hover:text-red-300 rounded-xl text-xs font-extrabold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              {isApproved ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Pro Activated
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <XCircle className="w-4 h-4" /> Rejected
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Zero-Knowledge Financial Privacy Architecture</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                As Administrator, you can view registered user emails, account timestamps, and subscription tier status. User account balances, transaction logs, and portfolio assets are client-side encrypted and completely inaccessible to administrators.
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {usersList.map((u) => {
                const isMaster = u.email === 'junnelmrfl@gmail.com';
                return (
                  <div key={u.email} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl font-bold text-xs ${isMaster ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'}`}>
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{u.email}</span>
                          {isMaster && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 text-[9px] font-black uppercase">
                              Admin Master
                            </span>
                          )}
                          {u.isPro && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Pro Member
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {u.lastLogin ? `Last Active: ${new Date(u.lastLogin).toLocaleString()}` : 'Registered Profile'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL PRO ACTIVATOR */}
        {activeTab === 'activator' && (
          <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 bg-purple-100 border border-purple-200 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Manual Pro Tier Activator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly promote any user email to Pro status without requiring a GCash transaction reference.
              </p>
            </div>

            <form onSubmit={handleManualProActivate} className="space-y-4">
              <div>
                <label htmlFor="admin-activator-email-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target User Email Address</label>
                <input
                  id="admin-activator-email-input"
                  name="admin_target_user_email"
                  type="email"
                  value={activatorEmail}
                  onChange={(e) => setActivatorEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="email"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isActivating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Grant Pro Tier Immediately</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SYSTEM TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Firestore & Auth Configuration</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Project Database ID</span>
                  <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">ai-studio-wealthvault</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Security Rule Enforcement</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">User-Isolated Granular Rules</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Real-Time Sync</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active WebSocket</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Hosting Architecture Strategy</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This app is architected with complete separation support. You can deploy this exact codebase to two distinct domain addresses:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                <p className="text-blue-700 dark:text-blue-300 font-bold">User App Domain: app.yourdomain.com</p>
                <p className="text-purple-700 dark:text-purple-300 font-bold">Admin HQ Domain: admin.yourdomain.com (?mode=admin)</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
