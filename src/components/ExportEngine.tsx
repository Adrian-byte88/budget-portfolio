import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { AssetPosition, ExpenseEntry, TradeEntry, FamilyGoal, BudgetLimit, IncomeBudgetPlan } from '../types';
import { getAssetValuation } from '../lib/formatters';
import { FileDown, Upload, Copy, FileText, CheckCircle2, ShieldCheck, RefreshCw, Sparkles, Download, DollarSign, Wallet, Scale, ArrowUpRight } from 'lucide-react';

interface ExportEngineProps {
  email: string;
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  trades: TradeEntry[];
  goals: FamilyGoal[];
  budgets: BudgetLimit[];
  incomeBudgetPlan?: IncomeBudgetPlan;
  onUploadBackup: (importedState: any) => void;
  onExecuteSyncBackup: () => Promise<void>;
  onExecuteRestoreBackup: () => Promise<void>;
}

export default function ExportEngine({
  email,
  assets,
  expenses,
  trades,
  goals,
  budgets,
  incomeBudgetPlan,
  onUploadBackup,
  onExecuteSyncBackup,
  onExecuteRestoreBackup,
}: ExportEngineProps) {
  const [copiedReport, setCopiedReport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // 1. Balance Sheet Valuations
  const totalSafe = assets.filter((a) => a.class === 'safe').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalRisk = assets.filter((a) => a.class === 'risk').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalPhysical = assets.filter((a) => a.class === 'physical').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalLiabilities = assets.filter((a) => a.class === 'liability').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalAssets = totalSafe + totalRisk + totalPhysical;
  const netWorth = totalAssets - totalLiabilities;

  // 2. Passive Income Calculations
  const estSafeMonthlyYield = (totalSafe * 0.05) / 12;
  const estEquitiesMonthlyYield = (totalRisk * 0.04) / 12;
  const totalMonthlyPassiveIncome = estSafeMonthlyYield + estEquitiesMonthlyYield;

  // 3. Monthly Net Income & Realized Cash Inflow MTD Calculations
  const monthlyNetIncome = incomeBudgetPlan?.monthlyNetIncome ?? 0;
  const halfIncome = monthlyNetIncome > 0 ? monthlyNetIncome / 2 : 0;
  const currentDay = new Date().getDate();

  const is15thRealized = currentDay >= 15;
  const is30thRealized = currentDay >= 30;

  const realizedCashInflowMTD = monthlyNetIncome > 0
    ? (currentDay >= 30 ? monthlyNetIncome : (currentDay >= 15 ? halfIncome : 0))
    : 0;

  // 4. Income Allocation Matrix Blueprint
  const expenseCapAllocation = incomeBudgetPlan?.expenseCapAllocation ?? 0;
  const personalGoalsAllocation = incomeBudgetPlan?.personalGoalsAllocation ?? 0;
  const assetInvestmentAllocation = incomeBudgetPlan?.assetInvestmentAllocation ?? 0;
  const totalAllocated = expenseCapAllocation + personalGoalsAllocation + assetInvestmentAllocation;
  const allocationDiff = monthlyNetIncome - totalAllocated;

  const allocationIntegrityStatus = monthlyNetIncome === 0
    ? 'INITIALIZING (Net Income is ₱0.00)'
    : totalAllocated === monthlyNetIncome
    ? 'BALANCED (100% of Net Income Allocated)'
    : totalAllocated > monthlyNetIncome
    ? `DEFICIT OVER-ALLOCATION (-₱${Math.abs(allocationDiff).toLocaleString()} over monthly cap)`
    : `SURPLUS UNASSIGNED (+₱${allocationDiff.toLocaleString()} remaining to route)`;

  // 5. Living Outflows & Expense Audit
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + (e.amountPHP || 0), 0);
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.limitPHP || 0), 0);
  const effectiveMonthlyOutflow = totalMonthlyExpenses > 0 ? totalMonthlyExpenses : (expenseCapAllocation > 0 ? expenseCapAllocation : totalBudgetLimit);

  const expenseCapVariance = expenseCapAllocation > 0 ? (expenseCapAllocation - totalMonthlyExpenses) : 0;
  const isWithinExpenseCap = expenseCapAllocation > 0 ? totalMonthlyExpenses <= expenseCapAllocation : true;

  // 6. Net Cash Flow & Financial Freedom Metrics
  const totalRealizedCashInflow = realizedCashInflowMTD + totalMonthlyPassiveIncome;
  const netMonthlyCashSurplus = totalRealizedCashInflow - totalMonthlyExpenses;
  const liquidReserves = totalSafe;
  const runwayMonths = effectiveMonthlyOutflow > 0 ? (liquidReserves / effectiveMonthlyOutflow) : 0;

  const freedomRatio = effectiveMonthlyOutflow > 0 ? (totalMonthlyPassiveIncome / effectiveMonthlyOutflow) * 100 : 0;
  const freedomStatus = freedomRatio >= 100
    ? '🚀 FINANCIALLY FREE (Passive Income covers 100%+ of Monthly Outflows)'
    : freedomRatio >= 50
    ? '⚡ FAST TRACK MOMENTUM (Passive Income covers 50%+ of Monthly Outflows)'
    : '🛡️ ACCUMULATION PHASE (Building Cash-Flowing Asset Shield)';

  // Generate Comprehensive Cash Flow & Financial Statement Report
  const executiveReport = `====================================================================
               🏛️ CASH FLOW & FINANCIAL STATEMENT
            EXECUTIVE MONTHLY WEALTH & AUDIT REPORT
====================================================================
Timestamp   : ${new Date().toLocaleString()}
Account     : ${email || 'Authorized Account'}
Cycle Period: ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} (Day ${currentDay} of Month)
Methodology : Income Allocation Matrix & Cash-Flow Balance Sheet System
====================================================================

I. CASH INFLOW & INCOME STATEMENT (EARNED & PASSIVE)
--------------------------------------------------------------------
  A. EARNED NET INCOME (Scheduled on 15th & 30th Bi-Monthly Paydays):
    * Monthly Base Take-Home Net Income        : PHP ${monthlyNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * 1st Payday Allocation (15th Day - 50%)   : PHP ${halfIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [${is15thRealized ? 'REALIZED' : 'SCHEDULED'}]
    * 2nd Payday Allocation (30th Day - 50%)   : PHP ${halfIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [${is30thRealized ? 'REALIZED' : 'SCHEDULED'}]
    ----------------------------------------------------------------
    REALIZED CASH INFLOW MTD (In Hand)         : PHP ${realizedCashInflowMTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${monthlyNetIncome > 0 ? ((realizedCashInflowMTD / monthlyNetIncome) * 100).toFixed(0) : 0}% of monthly income)

  B. PASSIVE / ASSET CASH FLOW (Money Flowing From Productive Assets):
    * Safe Shield Digital Cash Yield (~5% p.a.): PHP ${estSafeMonthlyYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * Dividend Stocks & REIT Yields (~4% p.a.) : PHP ${estEquitiesMonthlyYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL MONTHLY PASSIVE ASSET CASH FLOW      : PHP ${totalMonthlyPassiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  ------------------------------------------------------------------
  TOTAL REALIZED INFLOW MTD (Earned MTD + Passive): PHP ${totalRealizedCashInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ------------------------------------------------------------------

II. INCOME ALLOCATION MATRIX (PLANNED BUDGET BLUEPRINT)
--------------------------------------------------------------------
  1. Desired Monthly Expense Cap (Living Outflow Ceiling):
     - Allocation Amount                       : PHP ${expenseCapAllocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${monthlyNetIncome > 0 ? ((expenseCapAllocation / monthlyNetIncome) * 100).toFixed(0) : 0}%)
     - Realized Inflow Available MTD           : PHP ${(is30thRealized ? expenseCapAllocation : is15thRealized ? expenseCapAllocation / 2 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  2. Personal Goals & Savings Allocation (Emergency/Milestones):
     - Allocation Amount                       : PHP ${personalGoalsAllocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${monthlyNetIncome > 0 ? ((personalGoalsAllocation / monthlyNetIncome) * 100).toFixed(0) : 0}%)
     - Per-Payday Contribution Share           : PHP ${(personalGoalsAllocation / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
     - Realized Inflow Available MTD           : PHP ${(is30thRealized ? personalGoalsAllocation : is15thRealized ? personalGoalsAllocation / 2 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  3. Risk & Safe Assets Sleeve (Investment Deployments):
     - Allocation Amount                       : PHP ${assetInvestmentAllocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${monthlyNetIncome > 0 ? ((assetInvestmentAllocation / monthlyNetIncome) * 100).toFixed(0) : 0}%)
     - Target Asset                            : ${assets.find(a => a.key === incomeBudgetPlan?.targetAssetKey)?.name || 'High-Yield Savings / Maya HYS'}
     - Realized Inflow Available MTD           : PHP ${(is30thRealized ? assetInvestmentAllocation : is15thRealized ? assetInvestmentAllocation / 2 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ------------------------------------------------------------------
  TOTAL PLANNED MATRIX ALLOCATION              : PHP ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ALLOCATION INTEGRITY STATUS                  : ${allocationIntegrityStatus}

III. MONTHLY LIVING EXPENSES & OUTFLOW AUDIT
--------------------------------------------------------------------
${expenses.length > 0
  ? expenses.map(e => `  * [${(e.category || 'Other').padEnd(16)}] ${(e.description || '').padEnd(22)} : PHP ${(e.amountPHP || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${e.date})`).join('\n')
  : budgets.map(b => `  * [${(b.category || 'Other').padEnd(16)}] Category Control Limit  : PHP ${(b.limitPHP || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join('\n')
}
  ------------------------------------------------------------------
  TOTAL ACTUAL LIVING OUTFLOWS LOGGED          : PHP ${totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  EXPENSE CAP HEADROOM / VARIANCE              : PHP ${expenseCapVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [${isWithinExpenseCap ? 'WITHIN SAFE CAP' : 'OVERSPENT DEFICIT'}]

IV. BALANCE SHEET (ASSETS vs LIABILITIES)
--------------------------------------------------------------------
  A. PRODUCTIVE ASSETS (Things that put money in your pocket):
    * Safe Shield (Cash, High-Yield Savings, T-Bills, MP2): PHP ${totalSafe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * Risk Sleeve (Crypto, Equities, REITs, PAX Gold)     : PHP ${totalRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * Tangible Real Property & Gold                       : PHP ${totalPhysical.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL ASSET VALUATION                                 : PHP ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  B. LIABILITIES & DEBTS (Things that take money out):
    * Mortgages, Loans, Credit & Debt Commitments         : PHP ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * Current Monthly Living Outflows                     : PHP ${effectiveMonthlyOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL LIABILITIES & COMMITMENTS                       : PHP ${(totalLiabilities + effectiveMonthlyOutflow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  ==================================================================
  NET WORTH STATEMENT (Total Assets - Debt Liabilities)   : PHP ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ==================================================================

V. FINANCIAL FREEDOM & CASH FLOW METRICS
--------------------------------------------------------------------
  * Realized Cash Inflow MTD                   : PHP ${realizedCashInflowMTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  * Net Cash Surplus MTD (Realized Inflow - Exp): PHP ${netMonthlyCashSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  * Liquid Emergency Reserve Runway            : ${runwayMonths.toFixed(1)} Months of Outflow Coverage
  * Financial Freedom Ratio (Passive / Outflow): ${freedomRatio.toFixed(1)}%
  * Executive Status Evaluation                : ${freedomStatus}

====================================================================
                END OF EXECUTIVE FINANCIAL STATEMENT
====================================================================`;

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    
    const lines = executiveReport.split('\n');
    let y = 12;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = 12;
      }
      doc.text(line, margin, y);
      y += 4.2;
    });

    doc.save(`Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleBackupExportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();

      const addSheet = (name: string, data: any[]) => {
        const ws = wb.addWorksheet(name);
        if (data && data.length > 0) {
          const keys = Object.keys(data[0]);
          ws.columns = keys.map((k) => ({ header: k, key: k }));
          data.forEach((item) => ws.addRow(item));
        }
      };

      addSheet('Assets', assets);
      addSheet('Expenses', expenses);
      addSheet('Trades', trades);
      addSheet('Goals', goals);
      addSheet('Budgets', budgets);
      if (incomeBudgetPlan) {
        addSheet('Income_Plan', [incomeBudgetPlan]);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wealth_vault_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel backup:', err);
      alert('Failed to generate Excel backup.');
    }
  };

  const handleBackupImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);

        const parseSheet = (sheetName: string) => {
          const ws = wb.getWorksheet(sheetName);
          if (!ws) return [];
          const rows: any[] = [];
          let headers: string[] = [];

          ws.eachRow((row, rowNumber) => {
            const rowValues = row.values as any[];
            // ExcelJS row.values is 1-indexed (index 0 is undefined)
            const rowData = Array.isArray(rowValues) ? rowValues.slice(1) : [];

            if (rowNumber === 1) {
              headers = rowData.map((v) => String(v ?? ''));
            } else {
              const obj: any = {};
              headers.forEach((h, idx) => {
                if (h) {
                  let val = rowData[idx];
                  if (val && typeof val === 'object' && 'result' in val) {
                    val = val.result;
                  }
                  obj[h] = val;
                }
              });
              rows.push(obj);
            }
          });

          return rows;
        };

        const incomePlanSheet = parseSheet('Income_Plan');
        const parsed = {
          assets: parseSheet('Assets'),
          expenses: parseSheet('Expenses'),
          trades: parseSheet('Trades'),
          goals: parseSheet('Goals'),
          budgets: parseSheet('Budgets'),
          incomeBudgetPlan: incomePlanSheet && incomePlanSheet.length > 0 ? incomePlanSheet[0] : undefined,
        };

        onUploadBackup(parsed);
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('Invalid backup Excel format. Parsing terminated.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCloudBackupSync = async () => {
    setSyncing(true);
    try {
      await onExecuteSyncBackup();
    } finally {
      setSyncing(false);
    }
  };

  const handleCloudBackupRestore = async () => {
    setRestoring(true);
    try {
      await onExecuteRestoreBackup();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cloud Backups Controls */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
          <ShieldCheck className="w-5.5 h-5.5 text-blue-600 dark:text-teal-400" />
          <span>Cloud Vault Backups & Synchronization</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Ensure zero data loss from browser cache deletions. Sync your localized portfolio trades, budgets, and family shared progress to the persistent cloud database server.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleCloudBackupSync}
            disabled={syncing}
            className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Commit Cloud Backup Sync'}</span>
          </button>

          <button
            onClick={handleCloudBackupRestore}
            disabled={restoring}
            className="w-full sm:w-auto px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 border border-slate-200 dark:border-white/10 shadow-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{restoring ? 'Restoring...' : 'Retrieve Cloud Backup State'}</span>
          </button>

          <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 w-full sm:w-auto pt-4 sm:pt-0 sm:pl-4 flex flex-wrap items-center gap-4">
            <button
              onClick={handleBackupExportExcel}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Backup</span>
            </button>
            <label htmlFor="export-engine-upload-excel" className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel Backup</span>
              <input 
                id="export-engine-upload-excel"
                name="excel_backup_file"
                type="file" 
                accept=".xlsx" 
                onChange={handleBackupImportExcel} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Structured report generator panel */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-teal-400" />
              <span>Executive Monthly Summary Report (Financial Statement)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive Financial Statement: Monthly Net Income, Realized Cash Inflow MTD, Allocation Matrix, Outflows, and Balance Sheet.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => copyText(executiveReport, setCopiedReport)}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs transition-all text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
              title="Copy report text"
            >
              {copiedReport ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'Copied' : 'Copy Statement'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
              title="Download PDF report file"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <pre className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl p-5 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre leading-relaxed select-text min-h-[420px]">
          {executiveReport}
        </pre>
      </div>
    </div>
  );
}
