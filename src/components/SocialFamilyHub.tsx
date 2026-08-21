import React, { useState, useEffect } from 'react';
import { FamilyGoal, ExpenseEntry } from '../types';
import { Users, Target, Plus, Share2, Copy, AlertCircle, CheckCircle2, UserCheck, Pencil, Trash2 } from 'lucide-react';
import SmartCalculatorInput from './SmartCalculatorInput';
import { parseFormattedNumber } from '../utils/mathParser';

interface SocialFamilyHubProps {
  goals: FamilyGoal[];
  expenses: ExpenseEntry[];
  totalAssets: number;
  onAddGoal: (goal: Omit<FamilyGoal, 'id'>) => void;
  onEditGoal?: (goal: FamilyGoal) => void;
  onDeleteGoal?: (id: string) => void;
  onUpdateGoalContribution: (id: string, amount: number) => void;
  highlightId?: { type: string; id: string; tab?: string } | null;
  isAdmin?: boolean;
  userEmail?: string;
}

export default function SocialFamilyHub({
  goals,
  expenses,
  totalAssets,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoalContribution,
  highlightId,
  isAdmin = false,
  userEmail = '',
}: SocialFamilyHubProps) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [connectedCode, setConnectedCode] = useState<string | null>(() => {
    return localStorage.getItem(`vault_family_sync_${userEmail || 'default'}`) || null;
  });

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode || inputCode.trim().length < 4) return;
    const cleanCode = inputCode.trim().toUpperCase();
    localStorage.setItem(`vault_family_sync_${userEmail || 'default'}`, cleanCode);
    setConnectedCode(cleanCode);
    setInputCode('');
  };

  const handleDisconnectGroup = () => {
    localStorage.removeItem(`vault_family_sync_${userEmail || 'default'}`);
    setConnectedCode(null);
  };

  useEffect(() => {
    if (highlightId?.id === 'add-goal-section') {
      setShowGoalForm(true);
    }
  }, [highlightId]);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('50000');
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31');

  // Shared Invite Code State - unique per user
  const [inviteCode, setInviteCode] = useState(() => {
    const storageKey = `vault_user_invite_key_${userEmail || 'default'}`;
    const savedKey = localStorage.getItem(storageKey);
    if (savedKey) return savedKey;

    const emailHash = Math.abs((userEmail || 'user').split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0))
      .toString(36)
      .toUpperCase()
      .padStart(4, 'X')
      .slice(0, 4);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `FAMILY-${emailHash}-${randomSuffix}`;
    localStorage.setItem(storageKey, newCode);
    return newCode;
  });
  const [copied, setCopied] = useState(false);

  // Goal Contribution form state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contributionAmt, setContributionAmt] = useState('5000');

  // Goal Edit state
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetPHP, setEditTargetPHP] = useState('');
  const [editCurrentPHP, setEditCurrentPHP] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const openEditModal = (goal: FamilyGoal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditTargetPHP(goal.targetPHP.toString());
    setEditCurrentPHP(goal.currentPHP.toString());
    setEditDeadline(goal.deadline);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editTitle || !editTargetPHP || !onEditGoal) return;

    onEditGoal({
      id: editingGoal.id,
      title: editTitle,
      targetPHP: parseFormattedNumber(editTargetPHP),
      currentPHP: parseFormattedNumber(editCurrentPHP),
      deadline: editDeadline,
    });

    setEditingGoal(null);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    onAddGoal({
      title: goalTitle,
      targetPHP: parseFormattedNumber(goalTarget),
      currentPHP: 0,
      deadline: goalDeadline,
    });

    setGoalTitle('');
    setGoalTarget('');
    setShowGoalForm(false);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !contributionAmt) return;

    onUpdateGoalContribution(selectedGoalId, parseFormattedNumber(contributionAmt));
    setContributionAmt('');
    setSelectedGoalId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Col 1 & 2: Collaborative Budget Goals */}
      <div className="lg:col-span-2 space-y-6">
        <div id="family-goals-section" data-highlight-id="family-goals-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-teal-400" />
                <span>Shared Family Goal Tracking</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Collaborative target indexes designed for family planning</p>
            </div>
            <div className="flex items-center gap-4">
              {goals.length > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Goal Capital</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₱{goals.reduce((sum, g) => sum + (g.currentPHP || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <button
                id="add-goal-section"
                data-highlight-id="add-goal-section"
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Goal</span>
              </button>
            </div>
          </div>

          {showGoalForm && (
            <form onSubmit={handleGoalSubmit} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 p-5 rounded-lg space-y-4 mb-6 animate-slide-down">
              <h4 className="text-xs font-bold text-blue-600 dark:text-teal-400 uppercase tracking-wider">Establish family target standard</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="family-goal-title-input" className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Target Title</label>
                  <input
                    id="family-goal-title-input"
                    name="family_goal_title"
                    type="text"
                    required
                    placeholder="e.g. Travel, Emergency, Car buy..."
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <SmartCalculatorInput
                    id="family-goal-size-input"
                    name="family_goal_size"
                    label="Goal Size (PHP)"
                    placeholder="e.g. 50000"
                    value={goalTarget}
                    onChange={setGoalTarget}
                  />
                </div>
                <div>
                  <label htmlFor="family-goal-deadline-input" className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Target Deadline</label>
                  <input
                    id="family-goal-deadline-input"
                    name="family_goal_deadline"
                    type="date"
                    required
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  Publish collaborative target
                </button>
              </div>
            </form>
          )}

          {/* Goals render listing */}
          <div className="space-y-6">
            {!isAdmin && !connectedCode ? (
              <div className="py-12 px-6 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">🔒 Family Goal Tracking Restricted</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    The Group Admin has configured strict invite-only privacy rules. Enter a valid Vault Invite Code provided by the Admin below to connect your ledger and view shared family goals.
                  </p>
                </div>
              </div>
            ) : goals.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                No active family goals yet. Click "+ New Goal" above to create one.
              </div>
            ) : (
            goals.map((goal) => {
              const ratio = Math.min((goal.currentPHP / goal.targetPHP) * 100, 100);
              const isAchieved = goal.currentPHP >= goal.targetPHP;

              return (
                <div key={goal.id} id={goal.id} data-highlight-id={goal.id} className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 p-5 rounded-lg space-y-3 hover:border-blue-500/10 dark:hover:border-blue-500/10 transition-all shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>{goal.title}</span>
                        {isAchieved && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.5 rounded uppercase">Achieved!</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">Target Deadline: {goal.deadline}</p>
                    </div>
                    <div className="flex items-center space-x-2.5 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          ₱{goal.currentPHP.toLocaleString()} / ₱{goal.targetPHP.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">{ratio.toFixed(1)}% Completed</span>
                      </div>
                      <button
                        onClick={() => setSelectedGoalId(goal.id)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase rounded-lg border border-slate-200 dark:border-white/5 shadow-xs cursor-pointer"
                      >
                        Add Capital
                      </button>
                      {onEditGoal && (
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-slate-200 dark:border-white/5 shadow-xs transition-colors cursor-pointer"
                          title="Edit Goal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteGoal && (
                        <button
                          onClick={() => onDeleteGoal(goal.id)}
                          className="p-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg border border-slate-200 dark:border-white/5 shadow-xs transition-colors cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-200/50 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                        isAchieved ? 'from-emerald-500 to-teal-400' : 'from-blue-600 to-blue-400 dark:from-teal-500 dark:to-teal-400'
                      }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Shared Family logs tracker */}
        <div id="family-contribution-section" data-highlight-id="family-contribution-section" className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
            Active Collaborative Feeds
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Real-time status changes and budget logs syncing across family devices</p>

          <div className="space-y-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-lg text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xs font-bold">0</div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">0 Connected Family Members</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Social family sync has been reset to zero. Share your Vault Invite Code with family members to authorize mutual goal tracking and ledger synchronization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Col 3: Invitation generator and share configs */}
      <div className="space-y-6">
        {/* Join Group Vault Card (For standard users or joining external vault) */}
        {!isAdmin && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-2 border-b border-slate-100 dark:border-white/5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Join Family Vault</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Connect to shared family goal tracking</p>
              </div>
            </div>

            {connectedCode ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Status: Connected</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{connectedCode}</span>
                </div>
                <button
                  onClick={handleDisconnectGroup}
                  className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold uppercase transition-all"
                >
                  Disconnect & Reset Sync
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinGroup} className="space-y-3">
                <div>
                  <label htmlFor="family-invite-code-input" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                    Enter Vault Invite Code
                  </label>
                  <input
                    id="family-invite-code-input"
                    name="family_invite_code"
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VAULT-FAMILY-78X9"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputCode || inputCode.trim().length < 4}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  Join Family Sync
                </button>
              </form>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="text-center pb-2">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-teal-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Family Sync invite key
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Invite family members to view your safety standards, collaborate on shared goals, and synchronize mutual spending ledgers.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-4 flex items-center justify-between relative group">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Vault invite Code</span>
                <span className="text-base font-mono font-bold text-blue-600 dark:text-teal-400 mt-0.5">{inviteCode}</span>
              </div>
              <button
                onClick={handleCopyInvite}
                className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-lg border border-slate-200 dark:border-white/5 transition-all shadow-xs"
                title="Copy share link"
              >
                {copied ? <UserCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
              </button>
            </div>

            <button
              onClick={() => {
                const parts = ['A', 'B', 'C', 'X', 'Y', 'Z', '9', '8', '7', '5', '3'];
                const code = 'FAMILY-' + Array.from({ length: 4 }, () => parts[Math.floor(Math.random() * parts.length)]).join('') + '-' + Math.floor(1000 + Math.random() * 9000);
                localStorage.setItem(`vault_user_invite_key_${userEmail || 'default'}`, code);
                setInviteCode(code);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold uppercase flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/5 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600 dark:text-teal-400" />
              <span>Regenerate My Unique Key</span>
            </button>
          </div>
        </div>

        {/* Edit Goal dialogue modal */}
        {editingGoal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-lg relative animate-fade-in">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2.5 mb-4">
                <Pencil className="w-5 h-5 text-blue-600 dark:text-teal-400" />
                <span>Edit Family Goal</span>
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="family-edit-title-input" className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Goal Title</label>
                  <input
                    id="family-edit-title-input"
                    name="family_edit_title"
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <SmartCalculatorInput
                    id="family-edit-target-input"
                    name="family_edit_target"
                    label="Target Size (PHP)"
                    value={editTargetPHP}
                    onChange={setEditTargetPHP}
                  />
                </div>

                <div>
                  <SmartCalculatorInput
                    id="family-edit-current-input"
                    name="family_edit_current"
                    label="Current Saved Amount (PHP)"
                    value={editCurrentPHP}
                    onChange={setEditCurrentPHP}
                  />
                </div>

                <div>
                  <label htmlFor="family-edit-deadline-input" className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Target Deadline</label>
                  <input
                    id="family-edit-deadline-input"
                    name="family_edit_deadline"
                    type="date"
                    required
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contribution dialogue modal */}
        {selectedGoalId && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-lg relative">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2.5 mb-4">
                <span>Inflow Capital to Shared Goal</span>
              </h3>

              <form onSubmit={handleContributionSubmit} className="space-y-4">
                <div>
                  <SmartCalculatorInput
                    label="Contribution Amount (PHP)"
                    value={contributionAmt}
                    onChange={setContributionAmt}
                  />
                </div>

                <div className="flex justify-end space-x-3.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase"
                  >
                    Confirm Inflow
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
