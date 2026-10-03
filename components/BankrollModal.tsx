"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { CURRENCIES, formatCurrency } from "@/lib/math";
import { CurrencyCode } from "@/types";

export default function BankrollModal() {
  const {
    isBankrollModalOpen,
    setIsBankrollModalOpen,
    currency,
    setCurrency,
    bankrollNGN,
    allocatedStakeNGN,
    totalEquityNGN,
    convertNGNToCurrent,
    adjustBankrollInCurrentCurrency,
    formatAmountFromNGN,
  } = useTerminal();

  const [capitalInput, setCapitalInput] = useState<string>("500000");
  const [rebaselineCurve, setRebaselineCurve] = useState<boolean>(true);
  const [savedConfirm, setSavedConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (isBankrollModalOpen) {
      const currentVal = Math.round(convertNGNToCurrent(bankrollNGN));
      setCapitalInput(String(currentVal));
      setSavedConfirm(false);
    }
  }, [isBankrollModalOpen, bankrollNGN, convertNGNToCurrent]);

  if (!isBankrollModalOpen) return null;

  const currencyMeta = CURRENCIES[currency];
  const presets =
    currency === "NGN"
      ? [100000, 250000, 500000, 1000000, 2500000]
      : [100, 250, 500, 1000, 2500];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(capitalInput);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      adjustBankrollInCurrentCurrency(parsed, rebaselineCurve);
      setSavedConfirm(true);
      setTimeout(() => {
        setIsBankrollModalOpen(false);
      }, 650);
    }
  };

  const handleResetTo500k = () => {
    setCurrency("NGN");
    adjustBankrollInCurrentCurrency(500000, true);
    setCapitalInput("500000");
    setSavedConfirm(true);
    setTimeout(() => {
      setIsBankrollModalOpen(false);
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bankroll-modal-title"
    >
      <div className="relative w-full max-w-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
              <Settings2 className="h-3.5 w-3.5" />
              <span>CAPITAL &amp; EQUITY CONFIGURATION</span>
            </div>
            <h2
              id="bankroll-modal-title"
              className="text-lg font-bold tracking-wider text-white"
            >
              Update Live Bankroll Balance
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsBankrollModalOpen(false)}
            className="p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close bankroll modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Live Capital Telemetry Breakdown */}
          <div className="grid grid-cols-3 gap-2.5 border border-slate-800 bg-slate-950/70 p-3.5 font-mono text-xs">
            <div>
              <div className="text-[10px] uppercase text-slate-400">
                Available Liquid
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {formatAmountFromNGN(bankrollNGN)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">
                Locked In-Play
              </div>
              <div className="text-sm font-bold text-blue-400 mt-0.5">
                {formatAmountFromNGN(allocatedStakeNGN)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">
                Total Equity
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {formatAmountFromNGN(totalEquityNGN)}
              </div>
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Display Currency
            </span>
            <div className="flex items-center gap-1.5">
              {(["NGN", "USD", "GBP"] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-3 py-1 font-mono text-xs font-semibold transition-all ${
                    currency === code
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {code === "NGN" ? "₦ NGN" : code === "USD" ? "$ USD" : "£ GBP"}
                </button>
              ))}
            </div>
          </div>

          {/* Capital Balance Input */}
          <div>
            <label
              htmlFor="bankroll-modal-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Set Live Capital Balance ({currencyMeta.symbol} {currency})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono text-lg font-bold text-emerald-400">
                {currencyMeta.symbol}
              </span>
              <input
                id="bankroll-modal-input"
                type="number"
                min="0"
                step="any"
                required
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 font-mono text-xl font-bold text-white"
                placeholder="500000"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">
                Quick Capital Presets:
              </span>
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCapitalInput(String(val))}
                  className={`px-2.5 py-1 font-mono text-xs transition-colors border ${
                    Number(capitalInput) === val
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold"
                      : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {formatCurrency(val, currency, { decimals: 0 })}
                </button>
              ))}
            </div>
          </div>

          {/* Re-baseline Equity Curve Toggle */}
          <label className="flex items-start gap-3 border border-slate-800 bg-slate-950/60 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rebaselineCurve}
              onChange={(e) => setRebaselineCurve(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
            />
            <div className="text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sync &amp; Re-baseline Growth Curve to New Capital</span>
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Proportionally aligns historical baseline equity with your new
                capital so ROI % and the Bankroll Growth Curve remain accurate
                without artificial negative drops.
              </p>
            </div>
          </label>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetTo500k}
              className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
              <span>Default ₦500,000</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBankrollModalOpen(false)}
                className="border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer"
              >
                {savedConfirm ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Capital Updated!</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Save Capital Balance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
