import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Check, X, RotateCcw } from 'lucide-react';
import { safeEvaluate, parseFormattedNumber } from '../utils/mathParser';

interface SmartCalculatorInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  currencySymbol?: string;
  disabled?: boolean;
}

export default function SmartCalculatorInput({
  id,
  name,
  value,
  onChange,
  placeholder = '0',
  className = '',
  label,
  currencySymbol = '₱',
  disabled = false,
}: SmartCalculatorInputProps) {
  const generatedId = React.useId();
  const inputId = id || `smart-calc-${generatedId.replace(/:/g, '')}`;
  const inputName = name || inputId;
  const [isOpen, setIsOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState(value);
  const [realtimeEval, setRealtimeEval] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal expression state when external value changes
  useEffect(() => {
    if (!isOpen) {
      setCalcExpr(value);
    }
  }, [value, isOpen]);

  // Compute real-time evaluated math result
  useEffect(() => {
    if (/[+\-*/()]/.test(calcExpr)) {
      const res = safeEvaluate(calcExpr);
      if (!isNaN(res)) {
        setRealtimeEval(res);
      } else {
        setRealtimeEval(null);
      }
    } else {
      const num = parseFormattedNumber(calcExpr);
      setRealtimeEval(!isNaN(num) ? num : null);
    }
  }, [calcExpr]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCalcExpr(val);
    if (!isOpen) {
      // If closed, propagate typing directly to external state
      onChange(val);
    }
  };

  const handleApply = () => {
    const evalRes = safeEvaluate(calcExpr);
    if (!isNaN(evalRes)) {
      onChange(evalRes.toString());
    } else {
      onChange(calcExpr);
    }
    setIsOpen(false);
  };

  const appendToExpr = (char: string) => {
    setCalcExpr((prev) => {
      // If prev is empty or '0', replace it (unless appending decimal/operator)
      if ((prev === '0' || prev === '') && !/[+\-*/().]/.test(char)) {
        return char;
      }
      return prev + char;
    });
  };

  const handleClear = () => {
    setCalcExpr('');
  };

  const handleBack = () => {
    setCalcExpr((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
  };

  // Quick Adjustment Modifiers
  const adjustByValue = (amount: number) => {
    const currentVal = safeEvaluate(calcExpr) || 0;
    const newVal = Math.max(0, currentVal + amount);
    setCalcExpr(newVal.toString());
  };

  const adjustByPercent = (percent: number) => {
    const currentVal = safeEvaluate(calcExpr) || 0;
    const newVal = Math.max(0, currentVal * (1 + percent / 100));
    setCalcExpr(newVal.toFixed(2));
  };

  return (
    <div ref={containerRef} className="relative w-full font-sans">
      {label && (
        <label htmlFor={inputId} className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {currencySymbol && (
          <span className="absolute left-3 text-slate-400 dark:text-slate-500 text-xs font-mono select-none pointer-events-none">
            {currencySymbol}
          </span>
        )}
        <input
          id={inputId}
          name={inputName}
          type="text"
          value={isOpen ? calcExpr : value}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label={label || placeholder || 'Amount input'}
          disabled={disabled}
          className={`${currencySymbol ? 'pl-7' : 'px-3'} pr-10 py-2 w-full ${disabled ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 cursor-not-allowed opacity-75' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200'} border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute right-2.5 p-1.5 rounded-md transition-colors ${
            disabled ? 'opacity-40 cursor-not-allowed text-slate-400' :
            isOpen
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer'
          }`}
          title={disabled ? 'Disabled' : 'Open Calculator & Modifiers'}
        >
          <Calculator className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-time Math Result Overlay Indicator (if there's an active math expression) */}
      {/[+\-*/()]/.test(isOpen ? calcExpr : value) && realtimeEval !== null && !isNaN(realtimeEval) && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 rounded text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold select-none pointer-events-none">
          = {currencySymbol}{realtimeEval.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      )}

      {/* Mini Popover Calculator layout */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[300px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-4 animate-fade-in select-none">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2.5 mb-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calculator className="w-3 h-3 text-blue-500" />
              <span>Smart Modifier Pad</span>
            </span>
            <div className="flex items-center gap-1">
              {realtimeEval !== null && !isNaN(realtimeEval) && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                  {currencySymbol}{realtimeEval.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Increment pills */}
          <div className="mb-3.5">
            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Quick Adjust Value</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => adjustByValue(1000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                +1k
              </button>
              <button
                type="button"
                onClick={() => adjustByValue(10000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                +10k
              </button>
              <button
                type="button"
                onClick={() => adjustByValue(100000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                +100k
              </button>
              <button
                type="button"
                onClick={() => adjustByPercent(10)}
                className="py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold rounded-md border border-emerald-200/50 dark:border-emerald-500/20 transition-colors cursor-pointer"
              >
                +10%
              </button>

              <button
                type="button"
                onClick={() => adjustByValue(-1000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                -1k
              </button>
              <button
                type="button"
                onClick={() => adjustByValue(-10000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                -10k
              </button>
              <button
                type="button"
                onClick={() => adjustByValue(-100000)}
                className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold rounded-md border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
              >
                -100k
              </button>
              <button
                type="button"
                onClick={() => adjustByPercent(-10)}
                className="py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-bold rounded-md border border-rose-200/50 dark:border-rose-500/20 transition-colors cursor-pointer"
              >
                -10%
              </button>
            </div>
          </div>

          {/* Calculator Pad Grid */}
          <div className="grid grid-cols-5 gap-1.5 mb-3.5">
            {/* Row 1 */}
            <button
              type="button"
              onClick={() => appendToExpr('7')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('8')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('9')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('/')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              /
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('(')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              (
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => appendToExpr('4')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('5')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('6')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('*')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              *
            </button>
            <button
              type="button"
              onClick={() => appendToExpr(')')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              )
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => appendToExpr('1')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('2')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('3')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('-')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Delete last"
            >
              ⌫
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => appendToExpr('0')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('.')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => appendToExpr('+')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => {
                const evalRes = safeEvaluate(calcExpr);
                if (!isNaN(evalRes)) {
                  setCalcExpr(evalRes.toString());
                }
              }}
              className="py-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
            >
              =
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-2.5">
            <button
              type="button"
              onClick={() => {
                setCalcExpr(value);
                setIsOpen(false);
              }}
              className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Apply Entry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
