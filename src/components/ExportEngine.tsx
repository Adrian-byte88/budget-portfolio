import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { AssetPosition, ExpenseEntry, TradeEntry, FamilyGoal, BudgetLimit } from '../types';
import { getAssetValuation } from '../lib/formatters';
import { FileDown, Upload, Copy, FileText, CheckCircle2, ShieldCheck, RefreshCw, Sparkles, Download } from 'lucide-react';

interface ExportEngineProps {
  email: string;
  assets: AssetPosition[];
  expenses: ExpenseEntry[];
  trades: TradeEntry[];
  goals: FamilyGoal[];
  budgets: BudgetLimit[];
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
  onUploadBackup,
  onExecuteSyncBackup,
  onExecuteRestoreBackup,
}: ExportEngineProps) {
  const [copiedReport, setCopiedReport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Calculates financial balances and cash flow metrics
  const totalSafe = assets.filter((a) => a.class === 'safe').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalRisk = assets.filter((a) => a.class === 'risk').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalPhysical = assets.filter((a) => a.class === 'physical').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalLiabilities = assets.filter((a) => a.class === 'liability').reduce((sum, a) => sum + getAssetValuation(a).totalValue, 0);
  const totalAssets = totalSafe + totalRisk + totalPhysical;

  // Cash Flow & Passive Income Calculations
  const estSafeMonthlyYield = (totalSafe * 0.05) / 12;
  const estEquitiesMonthlyYield = (totalRisk * 0.04) / 12;
  const totalMonthlyPassiveIncome = estSafeMonthlyYield + estEquitiesMonthlyYield;

  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + (e.amountPHP || 0), 0);
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.limitPHP || 0), 0);
  const effectiveMonthlyOutflow = totalMonthlyExpenses > 0 ? totalMonthlyExpenses : totalBudgetLimit;

  const netMonthlyCashFlow = totalMonthlyPassiveIncome - effectiveMonthlyOutflow;
  const freedomRatio = effectiveMonthlyOutflow > 0 ? (totalMonthlyPassiveIncome / effectiveMonthlyOutflow) * 100 : 0;

  const freedomStatus = freedomRatio >= 100
    ? '🚀 FINANCIALLY FREE (Passive Income covers 100%+ of Monthly Outflows)'
    : freedomRatio >= 50
    ? '⚡ FAST TRACK MOMENTUM (Passive Income covers 50%+ of Monthly Outflows)'
    : '🛡️ ACCUMULATION PHASE (Building Cash-Flowing Asset Base)';

  // Generate Cash Flow & Financial Statement Report
  const executiveReport = `====================================================================
               🏛️ CASH FLOW & FINANCIAL STATEMENT
====================================================================
Timestamp  : ${new Date().toLocaleString()}
Account    : ${email}
Methodology: Cash-Flow Asset & Liability Accounting Format
====================================================================

I. INCOME STATEMENT (MONTHLY CASH FLOW)
--------------------------------------------------------------------
  A. PASSIVE / INVESTMENT CASH FLOW (Money coming in from Assets):
    * Safe Digital Cash Yield (Est. 5% p.a.)   : PHP ${estSafeMonthlyYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    * Dividend Stocks & REIT Yields            : PHP ${estEquitiesMonthlyYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL MONTHLY PASSIVE ASSET CASH FLOW      : PHP ${totalMonthlyPassiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  B. MONTHLY LIVING EXPENSES (Money going out to Liabilities):
${expenses.length > 0
  ? expenses.map(e => `    * [${e.category.padEnd(16)}] ${(e.description || '').padEnd(20)} : PHP ${(e.amountPHP || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join('\n')
  : budgets.map(b => `    * [${b.category.padEnd(16)}] Budget Control Limit    : PHP ${(b.limitPHP || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join('\n')
}
    ----------------------------------------------------------------
    TOTAL MONTHLY LIVING EXPENSES              : PHP ${effectiveMonthlyOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

  ==================================================================
  NET MONTHLY CASH FLOW (Passive Income - Expenses) : PHP ${netMonthlyCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ==================================================================

II. BALANCE SHEET (ASSETS vs LIABILITIES)
--------------------------------------------------------------------
  A. ASSETS (Things that put money in your pocket):
    * Safe Shield (Cash, Digital Bank Yields)   : PHP ${totalSafe.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    * Risk Sleeve (Crypto & Growth Equities)    : PHP ${totalRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    * Real Property & Tangible Gold (PAXG)      : PHP ${totalPhysical.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL ASSET VALUE                           : PHP ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}

  B. LIABILITIES & OBLIGATIONS (Things that take money out):
    * Mortgages, Loans & Recategorized Debts   : PHP ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    * Monthly Living & Debt Commitments        : PHP ${effectiveMonthlyOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    ----------------------------------------------------------------
    TOTAL LIABILITIES                           : PHP ${(totalLiabilities + effectiveMonthlyOutflow).toLocaleString(undefined, { minimumFractionDigits: 2 })}

  ==================================================================
  NET WORTH STATEMENT (Total Assets - Debt Liabilities) : PHP ${(totalAssets - totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}
  ==================================================================

III. FINANCIAL FREEDOM & CASH FLOW METRIC
--------------------------------------------------------------------
  * Financial Freedom Ratio (Passive / Exp) : ${freedomRatio.toFixed(1)}%
  * Status Evaluation                      : ${freedomStatus}

====================================================================
            END OF EXECUTIVE FINANCIAL REPORT
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
    doc.setFontSize(10);
    
    const lines = executiveReport.split('\n');
    let y = 14;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = 14;
      }
      doc.text(line, margin, y);
      y += 4.5;
    });

    doc.save(`Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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

        const parsed = {
          assets: parseSheet('Assets'),
          expenses: parseSheet('Expenses'),
          trades: parseSheet('Trades'),
          goals: parseSheet('Goals'),
          budgets: parseSheet('Budgets'),
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
            className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xs transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Commit Cloud Backup Sync'}</span>
          </button>

          <button
            onClick={handleCloudBackupRestore}
            disabled={restoring}
            className="w-full sm:w-auto px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 border border-slate-200 dark:border-white/10 shadow-xs transition-all duration-200 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{restoring ? 'Restoring...' : 'Retrieve Cloud Backup State'}</span>
          </button>

          <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 w-full sm:w-auto pt-4 sm:pt-0 sm:pl-4 flex flex-wrap items-center gap-4">
            <button
              onClick={handleBackupExportExcel}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Data</span>
            </button>
            <label className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Data</span>
              <input type="file" accept=".xlsx" onChange={handleBackupImportExcel} className="hidden" />
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
              Standard Cash Flow Statement: Income vs Expenses, Assets vs Liabilities, and Financial Freedom Ratio.
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

        <pre className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl p-5 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre leading-relaxed select-text min-h-[380px]">
          {executiveReport}
        </pre>
      </div>
    </div>
  );
}
