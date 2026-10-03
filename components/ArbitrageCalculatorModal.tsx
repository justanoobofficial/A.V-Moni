"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Check,
  Copy,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import {
  calculateArbitrageStakes,
  CURRENCIES,
  formatCurrency,
  formatSignedPercent,
} from "@/lib/math";

export default function ArbitrageCalculatorModal() {
  const {
    selectedArbForModal,
    setSelectedArbForModal,
    currency,
    bankrollNGN,
    convertNGNToCurrent,
    convertCurrentToNGN,
    executeArbitrageBet,
  } = useTerminal();

  const currencyMeta = CURRENCIES[currency];

  const [totalStakeInput, setTotalStakeInput] = useState<string>("10000");
  const [oddsAInput, setOddsAInput] = useState<string>("2.10");
  const [oddsBInput, setOddsBInput] = useState<string>("2.05");
  const [roundStep, setRoundStep] = useState<number>(0);
  const [copiedLeg, setCopiedLeg] = useState<"A" | "B" | "TICKET" | null>(null);
  const [executedSuccess, setExecutedSuccess] = useState<boolean>(false);
  const [showTicketView, setShowTicketView] = useState<boolean>(true);

  // Initialize modal values when an opportunity is selected
  useEffect(() => {
    if (selectedArbForModal) {
      const availInCurrent = convertNGNToCurrent(bankrollNGN);
      const tenPct = Math.max(
        10,
        Math.round(availInCurrent * 0.05)
      );
      const defaultStake =
        availInCurrent > 0
          ? Math.min(
              availInCurrent,
              currency === "NGN" ? Math.min(25000, tenPct) : 50
            )
          : currency === "NGN"
          ? 10000
          : 50;
      setTotalStakeInput(String(defaultStake));
      setOddsAInput(String(selectedArbForModal.oddsA));
      setOddsBInput(String(selectedArbForModal.oddsB));
      setRoundStep(0);
      setExecutedSuccess(false);
    }
  }, [selectedArbForModal, currency, bankrollNGN, convertNGNToCurrent]);

  const calculation = useMemo(() => {
    const numStake = parseFloat(totalStakeInput) || 0;
    const numOddsA = parseFloat(oddsAInput) || 0;
    const numOddsB = parseFloat(oddsBInput) || 0;
    return calculateArbitrageStakes(numStake, numOddsA, numOddsB, roundStep);
  }, [totalStakeInput, oddsAInput, oddsBInput, roundStep]);

  if (!selectedArbForModal) return null;

  const handleCopyStake = (leg: "A" | "B", value: number) => {
    navigator.clipboard?.writeText(value.toFixed(2));
    setCopiedLeg(leg);
    setTimeout(() => setCopiedLeg(null), 1500);
  };

  const handleCopyTicket = () => {
    const sym = currencyMeta.symbol;
    const ticketText =
      `🚨 A.V MONI EXECUTION TICKET: ${selectedArbForModal.match}\n` +
      `• Guaranteed Profit Margin: ${formatSignedPercent(calculation.profitMargin, 2)} (${formatCurrency(calculation.guaranteedProfit, currency, { decimals: 2, showSign: true })})\n` +
      `• Risk Level: Zero-Risk Arbitrage (Mathematically Locked)\n\n` +
      `Step 1: Open ${selectedArbForModal.bookieA}\n` +
      `- Action: Search for "${selectedArbForModal.match}" and place a bet on ${selectedArbForModal.outcomeA}.\n` +
      `- Odds: ${calculation.oddsA.toFixed(2)}\n` +
      `- Exact Stake to Input: ${sym}${calculation.stakeA.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `- Potential Return: ${sym}${calculation.payoutA.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
      `Step 2: Open ${selectedArbForModal.bookieB}\n` +
      `- Action: Search for "${selectedArbForModal.match}" and place a bet on ${selectedArbForModal.outcomeB}.\n` +
      `- Odds: ${calculation.oddsB.toFixed(2)}\n` +
      `- Exact Stake to Input: ${sym}${calculation.stakeB.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `- Potential Return: ${sym}${calculation.payoutB.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
      `💰 Final Financial Summary:\n` +
      `- Total Money Spent Across Both Apps: ${formatCurrency(calculation.totalInvestment, currency, { decimals: 2 })}\n` +
      `- Guaranteed Payout (Whichever side wins): ${formatCurrency(calculation.guaranteedPayout, currency, { decimals: 2 })}\n` +
      `- Net Profit Locked: ${formatCurrency(calculation.guaranteedProfit, currency, { decimals: 2, showSign: true })}`;

    navigator.clipboard?.writeText(ticketText);
    setCopiedLeg("TICKET");
    setTimeout(() => setCopiedLeg(null), 1800);
  };

  const quickPresets =
    currency === "NGN"
      ? [10000, 25000, 50000, 100000, 250000]
      : [50, 100, 250, 500, 1000];

  const handleExecuteBet = (settleImmediately: boolean = false) => {
    if (!calculation.isArbitrage || calculation.totalInvestment <= 0) return;

    const stakeANGN = convertCurrentToNGN(calculation.stakeA);
    const stakeBNGN = convertCurrentToNGN(calculation.stakeB);
    const totalStakeNGN = convertCurrentToNGN(calculation.totalInvestment);
    const guaranteedPayoutNGN = convertCurrentToNGN(
      calculation.guaranteedPayout
    );
    const netProfitNGN = convertCurrentToNGN(calculation.guaranteedProfit);

    executeArbitrageBet({
      opportunity: selectedArbForModal,
      oddsA: calculation.oddsA,
      oddsB: calculation.oddsB,
      stakeANGN,
      stakeBNGN,
      totalStakeNGN,
      guaranteedPayoutNGN,
      netProfitNGN,
      profitMargin: calculation.profitMargin,
      settleImmediately,
    });

    setExecutedSuccess(true);
    setTimeout(() => {
      setSelectedArbForModal(null);
    }, 1100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arb-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1">
              <Calculator className="h-3.5 w-3.5" />
              <span>SUREBET STAKE & ARBITRAGE CALCULATOR</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 border border-slate-700">
                {selectedArbForModal.sport}
              </span>
            </div>
            <h2
              id="arb-modal-title"
              className="text-lg font-bold tracking-tight text-white"
            >
              {selectedArbForModal.match}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedArbForModal.league} •{" "}
              <span className="text-blue-400 font-medium">
                {selectedArbForModal.marketType}
              </span>
            </p>
          </div>
          <button
            onClick={() => setSelectedArbForModal(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Total Investment Input & Presets */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label
                htmlFor="total-stake-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Total Stake Investment ({currencyMeta.symbol} {currency})
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Available Bankroll:{" "}
                <strong className="text-slate-200">
                  {formatCurrency(convertNGNToCurrent(bankrollNGN), currency)}
                </strong>
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-base font-bold text-emerald-400">
                {currencyMeta.symbol}
              </span>
              <input
                id="total-stake-input"
                type="number"
                min="0"
                step="any"
                value={totalStakeInput}
                onChange={(e) => setTotalStakeInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-28 py-2.5 font-mono text-lg font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="10000"
              />
              <button
                type="button"
                onClick={() => {
                  const tenPercent = Math.round(
                    convertNGNToCurrent(bankrollNGN) * 0.1
                  );
                  setTotalStakeInput(String(tenPercent));
                }}
                className="absolute right-2 rounded-md bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/25 transition-colors"
              >
                10% Bankroll
              </button>
            </div>

            {/* Quick Presets & Rounding Mode */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {quickPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTotalStakeInput(String(preset))}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                      Number(totalStakeInput) === preset
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                        : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60"
                    }`}
                  >
                    {formatCurrency(preset, currency, { decimals: 0 })}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1">Stealth Round:</span>
                {[
                  { label: "Exact", val: 0 },
                  { label: "10", val: 10 },
                  { label: "50", val: 50 },
                  { label: "100", val: 100 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRoundStep(opt.val)}
                    className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                      roundStep === opt.val
                        ? "bg-blue-500 text-white font-semibold"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two-Way Leg Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leg A Card */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                  Bookie A • {selectedArbForModal.bookieA}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Weight: {calculation.stakeAPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400">Selection</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedArbForModal.outcomeA}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] uppercase text-slate-400 mb-0.5">
                    Odds A
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={oddsAInput}
                    onChange={(e) => setOddsAInput(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">
                    Required Stake A
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyStake("A", calculation.stakeA)}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {copiedLeg === "A" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xl font-bold text-white">
                  {formatCurrency(calculation.stakeA, currency, {
                    decimals: 2,
                  })}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Return if A wins:</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrency(calculation.payoutA, currency, {
                      decimals: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Leg B Card */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                  Bookie B • {selectedArbForModal.bookieB}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Weight: {calculation.stakeBPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400">Selection</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedArbForModal.outcomeB}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] uppercase text-slate-400 mb-0.5">
                    Odds B
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={oddsBInput}
                    onChange={(e) => setOddsBInput(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">
                    Required Stake B
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyStake("B", calculation.stakeB)}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {copiedLeg === "B" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xl font-bold text-white">
                  {formatCurrency(calculation.stakeB, currency, {
                    decimals: 2,
                  })}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Return if B wins:</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrency(calculation.payoutB, currency, {
                      decimals: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Verification Strip */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
              <span>
                Formula: Arb% = (1/{calculation.oddsA || 0} + 1/
                {calculation.oddsB || 0}) ={" "}
                <strong className="text-slate-200">
                  {calculation.arbRatio.toFixed(4)}
                </strong>{" "}
                ({calculation.arbPercentage}%)
              </span>
            </div>
            <div>
              Margin = ((1 / {calculation.arbRatio.toFixed(4)}) - 1) × 100 ={" "}
              <strong
                className={
                  calculation.isArbitrage ? "text-emerald-400" : "text-rose-400"
                }
              >
                {formatSignedPercent(calculation.profitMargin, 2)}
              </strong>
            </div>
          </div>

          {/* Guaranteed Net Payout & Profit Summary */}
          {calculation.isArbitrage ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2.5 text-emerald-400 mt-0.5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Guaranteed Surebet Lock Verified
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Regardless of match outcome, your guaranteed total payout is{" "}
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.guaranteedPayout, currency, {
                        decimals: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-emerald-500/20 pt-3 sm:pt-0">
                <div className="text-xs text-emerald-300">
                  Guaranteed Net Profit (
                  {formatSignedPercent(calculation.profitMargin, 2)})
                </div>
                <div className="font-mono text-2xl font-extrabold text-emerald-400">
                  {formatCurrency(calculation.guaranteedProfit, currency, {
                    decimals: 2,
                    showSign: true,
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3 text-amber-300 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <strong>No Arbitrage Window:</strong> The combined implied
                probability is {calculation.arbPercentage}% (&ge; 100%). Adjust
                Odds A or Odds B so that (1/OddsA + 1/OddsB) &lt; 1.00.
              </div>
            </div>
          )}

          {/* Step-by-Step A.V Moni Execution Ticket */}
          {calculation.isArbitrage && (
            <div className="border border-slate-700 bg-slate-950/90 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  🚨 A.V MONI EXECUTION TICKET: {selectedArbForModal.match}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTicketView((v) => !v)}
                    className="text-[11px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    {showTicketView ? "Hide Steps" : "Show Steps"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-mono text-emerald-400 cursor-pointer"
                  >
                    {copiedLeg === "TICKET" ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Ticket Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Execution Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showTicketView && (
                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                      <div className="font-bold text-emerald-400">
                        Step 1: Open {selectedArbForModal.bookieA}
                      </div>
                      <div>
                        • Action: Place bet on{" "}
                        <strong className="text-white">
                          {selectedArbForModal.outcomeA}
                        </strong>{" "}
                        @{" "}
                        <strong className="text-emerald-400">
                          {calculation.oddsA.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        • Exact Stake:{" "}
                        <strong className="text-white">
                          {formatCurrency(calculation.stakeA, currency, {
                            decimals: 2,
                          })}
                        </strong>
                      </div>
                      <div>
                        • Potential Return:{" "}
                        <strong className="text-emerald-400">
                          {formatCurrency(calculation.payoutA, currency, {
                            decimals: 2,
                          })}
                        </strong>
                      </div>
                    </div>

                    <div className="border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                      <div className="font-bold text-blue-400">
                        Step 2: Open {selectedArbForModal.bookieB}
                      </div>
                      <div>
                        • Action: Place bet on{" "}
                        <strong className="text-white">
                          {selectedArbForModal.outcomeB}
                        </strong>{" "}
                        @{" "}
                        <strong className="text-emerald-400">
                          {calculation.oddsB.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        • Exact Stake:{" "}
                        <strong className="text-white">
                          {formatCurrency(calculation.stakeB, currency, {
                            decimals: 2,
                          })}
                        </strong>
                      </div>
                      <div>
                        • Potential Return:{" "}
                        <strong className="text-emerald-400">
                          {formatCurrency(calculation.payoutB, currency, {
                            decimals: 2,
                          })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span>
                      Total Spent:{" "}
                      <strong className="text-white">
                        {formatCurrency(calculation.totalInvestment, currency, {
                          decimals: 2,
                        })}
                      </strong>
                    </span>
                    <span>
                      Guaranteed Payout:{" "}
                      <strong className="text-white">
                        {formatCurrency(
                          calculation.guaranteedPayout,
                          currency,
                          { decimals: 2 }
                        )}
                      </strong>
                    </span>
                    <span>
                      Net Profit Locked:{" "}
                      <strong className="text-emerald-400">
                        {formatCurrency(
                          calculation.guaranteedProfit,
                          currency,
                          { decimals: 2, showSign: true }
                        )}{" "}
                        ({formatSignedPercent(calculation.profitMargin, 2)})
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setSelectedArbForModal(null)}
              className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!calculation.isArbitrage || executedSuccess}
              onClick={() => handleExecuteBet(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-40"
              title="Subtracts stake from active bankroll now; settle in dashboard to credit payout + profit"
            >
              <span>Lock Stake (In-Play)</span>
            </button>
            <button
              type="button"
              disabled={!calculation.isArbitrage || executedSuccess}
              onClick={() => handleExecuteBet(true)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                executedSuccess
                  ? "bg-emerald-600 text-white"
                  : calculation.isArbitrage
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {executedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Surebet Executed &amp; Logged!</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>Execute &amp; Settle (+Profit)</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
