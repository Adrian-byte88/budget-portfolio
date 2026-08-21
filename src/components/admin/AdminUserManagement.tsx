import React, { useState, useEffect } from 'react';
import { EyeOff, Users, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import AdminGuard from './AdminGuard';

interface UserRecord {
  email: string;
  lastLogin?: string;
  verified?: boolean;
}

interface AdminUserManagementProps {
  isAdmin: boolean;
  onClose?: () => void;
  onOpenGCashModal?: () => void;
}

export default function AdminUserManagement({
  isAdmin,
  onClose,
  onOpenGCashModal
}: AdminUserManagementProps) {
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      setLoadingUsers(true);
      const unsub = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          const fetched: UserRecord[] = [];
          snapshot.forEach((doc) => {
            fetched.push({ email: doc.id, ...doc.data() });
          });
          setUsersList(fetched);
          setLoadingUsers(false);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, "users");
          setLoadingUsers(false);
        }
      );
      return () => unsub();
    }
  }, [isAdmin]);

  return (
    <AdminGuard isAdmin={isAdmin}>
      <div className="animate-fade-in space-y-6">
        {/* Executive Privacy Recommendation Banner */}
        <div className="p-5 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-blue-900/20 border-2 border-purple-500/30 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
            <EyeOff className="w-5 h-5 text-purple-500" />
            <h4 className="text-xs font-black uppercase tracking-wider">Zero-Knowledge Financial Privacy Architecture</h4>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <b>Recommended Executive User Directory Standard:</b> As Administrator, you can monitor user emails, account verification status, GCash payment submissions, and subscription levels.
            <br />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">🔒 Financial Privacy Guard Active:</span> Individual balances, portfolio asset positions, transaction logs, and budgets are strictly client-encrypted and excluded from Admin inspection.
          </p>
        </div>

        {/* User Accounts Directory */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Registered Application Accounts ({usersList.length})</span>
            </h4>
            <div className="flex items-center space-x-2">
              <input
                id="admin-user-search-input"
                name="admin_user_search"
                type="text"
                placeholder="Search email..."
                aria-label="Search user email"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 divide-y divide-slate-200 dark:divide-white/10">
            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading registered users from Firestore...</div>
            ) : usersList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold">No other users registered in Firestore yet.</p>
                <p className="text-[10px]">When users sign in or open the app, their profile is automatically registered here.</p>
              </div>
            ) : (
              usersList
                .filter((u) => u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
                .map((u) => {
                  const isMaster = u.email === 'junnelmrfl@gmail.com';
                  return (
                    <div key={u.email} className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl font-bold text-xs ${isMaster ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span>{u.email}</span>
                            {isMaster ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[9px] font-black uppercase">
                                Administrator
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[9px] font-black uppercase">
                                Registered User
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {u.lastLogin ? `Last Active: ${new Date(u.lastLogin).toLocaleString()}` : 'Registered User Account'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-500 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Active</span>
                      </span>
                    </div>
                  );
                })
            )}
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="font-extrabold text-slate-900 dark:text-white">GCash Payment Verification Queue</p>
              <p className="text-[10px] text-slate-500">
                Audit pending subscriptions and activate Pro tier for submitters.
              </p>
            </div>
            {onOpenGCashModal && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenGCashModal();
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Open Verification Audit
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
