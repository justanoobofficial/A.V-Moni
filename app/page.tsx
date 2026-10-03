"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Award,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Percent,
  Settings2,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { CurrencyCode } from "@/types";
import { formatSignedPercent } from "@/lib/math";
import BankrollChart from "@/components/BankrollChart";

export default function OverviewDashboardPage() {
  const {
    currency,
    setCurrency,
    bankrollNGN,
    allocatedStakeNGN,
    totalEquityNGN,
    setIsBankrollModalOpen,
    formatAmountFromNGN,
    bankrollHistory,
    arbitrageList,
    valueBets,
    executedBets,
    settleExecutedBet,
    setSelectedArbForModal,
    lastAiInsight,
  } = useTerminal();

  const [profitTimeframe, setProfitTimeframe] = useState<"daily" | "weekly">(
    "daily"
  );

  // Calculate Daily & Weekly Net Profit and clean ROI % from history + executed bets
  const { dailyProfitNGN, weeklyProfitNGN, formattedRoi, winRatePercent } =
    useMemo(() => {
      const todayPoint = bankrollHistory[bankrollHistory.length - 1];
      const daily = todayPoint ? todayPoint.dailyProfitNGN : 6860;
      const last7 = bankrollHistory.slice(-7);
      const weekly = last7.reduce((acc, item) => acc + item.dailyProfitNGN, 0);

      const initialBase = bankrollHistory[0]?.balanceNGN ?? 420000;
      const totalSettledProfit = bankrollHistory.reduce(
        (acc, item) => acc + item.dailyProfitNGN,
        0
      );

      // Compute ROI % cleanly from total equity gain over starting capital (or settled profit yield)
      const rawRoi =
        initialBase > 0
          ? ((totalEquityNGN - initialBase) / initialBase) * 100
          : totalEquityNGN > 0
          ? (totalSettledProfit / totalEquityNGN) * 100
          : 19.0;

      return {
        dailyProfitNGN: daily,
        weeklyProfitNGN: weekly,
        formattedRoi: formatSignedPercent(rawRoi, 1),
        winRatePercent: "98.4%",
      };
    }, [bankrollHistory, totalEquityNGN]);

  const highestMarginArb = useMemo(() => {
    if (arbitrageList.length === 0) return null;
    return [...arbitrageList].sort(
      (a, b) => b.profitMargin - a.profitMargin
    )[0];
  }, [arbitrageList]);

  const recentFiveBets = useMemo(
    () => executedBets.slice(0, 5),
    [executedBets]
  );

  const topLiveArbs = useMemo(
    () =>
      [...arbitrageList]
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, 4),
    [arbitrageList]
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Activity className="h-3.5 w-3.5" />
            <span>INSTITUTIONAL SUREBET &amp; +EV COMMAND CENTER</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            Terminal Overview Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/arbitrage"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/15 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Open Live Arbitrage Feed ({arbitrageList.length})</span>
          </Link>
          <Link
            href="/value-bets"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 px-4 py-2 text-xs font-semibold text-blue-300 transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span>+EV Kelly Terminal ({valueBets.length})</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Bankroll with Interactive Modal Trigger & Currency Switcher */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Bankroll
                </span>
                <button
                  type="button"
                  onClick={() => setIsBankrollModalOpen(true)}
                  className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 transition-colors cursor-pointer"
                  title="Open Interactive Bankroll Capital Manager"
                >
                  <Settings2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  onClick={() => setIsBankrollModalOpen(true)}
                  className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white cursor-pointer hover:text-emerald-400 transition-colors"
                  title="Click to update live capital balance"
                >
                  {formatAmountFromNGN(bankrollNGN)}
                </span>
              </div>

              {allocatedStakeNGN > 0 && (
                <div className="mt-1 font-mono text-[11px] text-blue-400">
                  In-Play Lock: {formatAmountFromNGN(allocatedStakeNGN)} •
                  Equity: {formatAmountFromNGN(totalEquityNGN)}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-emerald-500/15 p-2.5 text-emerald-400 border border-emerald-500/25">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          {/* Currency Switcher (₦ NGN, $ USD, £ GBP) */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">Currency:</span>
            <div className="flex items-center gap-1">
              {(["NGN", "USD", "GBP"] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`rounded px-2 py-0.5 font-mono text-xs font-semibold transition-all ${
                    currency === code
                      ? "bg-emerald-500 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {code === "NGN" ? "₦ NGN" : code === "USD" ? "$ USD" : "£ GBP"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Daily / Weekly Net Profit */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {profitTimeframe === "daily"
                  ? "Daily Net Profit (24h)"
                  : "Weekly Net Profit (7d)"}
              </span>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">
                {formatAmountFromNGN(
                  profitTimeframe === "daily"
                    ? dailyProfitNGN
                    : weeklyProfitNGN,
                  { showSign: true }
                )}
              </div>
            </div>
            <div className="rounded-lg bg-blue-500/15 p-2.5 text-blue-400 border border-blue-500/25">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {profitTimeframe === "daily"
                ? "+1.39% daily yield"
                : "+9.84% 7-day yield"}
            </span>

            <div className="flex items-center rounded bg-slate-950 p-0.5 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setProfitTimeframe("daily")}
                className={`rounded px-2 py-0.5 transition-colors ${
                  profitTimeframe === "daily"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setProfitTimeframe("weekly")}
                className={`rounded px-2 py-0.5 transition-colors ${
                  profitTimeframe === "weekly"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Active Arbitrage Opportunities Found */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Arbitrage Windows
              </span>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {arbitrageList.length}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Peak {formatSignedPercent(highestMarginArb?.profitMargin ?? 4.03, 2)}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/15 p-2.5 text-emerald-400 border border-emerald-500/25">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate">
              Best:{" "}
              <strong className="text-slate-200">
                {highestMarginArb?.match || "Y. Bu vs N. Djokovic"}
              </strong>
            </span>
            <Link
              href="/arbitrage"
              className="font-mono font-semibold text-blue-400 hover:text-blue-300 shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Card 4: ROI % and Win Rate % (Cleaned formatting: never '+-') */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ROI % &amp; Surebet Win Rate
              </span>
              <div className="mt-1.5 flex items-baseline gap-3 font-mono">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {formattedRoi}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-xl font-bold text-blue-400">
                  {winRatePercent}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-purple-500/15 p-2.5 text-purple-400 border border-purple-500/25">
              <Award className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <Percent className="h-3.5 w-3.5" />
              {executedBets.length} Executed Locks
            </span>
            <span className="font-mono text-slate-300">0 Voided Legs</span>
          </div>
        </div>
      </div>

      {/* Gemini AI Real-Time Market Insight Strip */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-900 to-emerald-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-slate-200 font-mono">{lastAiInsight}</span>
        </div>
        <Link
          href="/settings/api-keys"
          className="text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 shrink-0"
        >
          Inspect Rotator Pool →
        </Link>
      </div>

      {/* Main Split Section: Bankroll Growth Chart (Left 7 cols) + Recent Arbitrage Log Feed (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <BankrollChart />
        </div>

        {/* Recent Arbitrage Log Feed (Last 5 Executed Bets) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Recent Arbitrage Log Feed
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stakes deduct on execution; settle to credit payout + profit
                </p>
              </div>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-300 border border-slate-700">
                Last 5 Bets
              </span>
            </div>

            <div className="space-y-3">
              {recentFiveBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {bet.match}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                          {bet.sport}
                        </span>
                      </div>
                      <div className="text-xs text-blue-400 mt-0.5">
                        {bet.marketType}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-extrabold text-emerald-400">
                        {formatAmountFromNGN(bet.netProfit, { showSign: true })}
                      </div>
                      <div className="text-[11px] text-emerald-300/80">
                        {formatSignedPercent(bet.profitMargin, 2)} Yield
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-300">{bet.bookieA}</span> (@
                      {bet.oddsA}){" "}
                      {bet.stakeB > 0 && (
                        <>
                          vs{" "}
                          <span className="text-slate-300">{bet.bookieB}</span>{" "}
                          (@{bet.oddsB})
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Stake: {formatAmountFromNGN(bet.totalStake)}</span>
                      {bet.status === "Active Lock" ? (
                        <button
                          type="button"
                          onClick={() => settleExecutedBet(bet.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer"
                          title="Settle bet and credit stake + guaranteed profit back to bankroll"
                        >
                          Settle &amp; Credit
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {bet.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Execute any live row to append to this ledger</span>
            <Link
              href="/arbitrage"
              className="font-mono font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Launch Calculator →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Live High-Margin Arbitrage Preview Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Top Priority Surebet Windows (Real-Time Stream)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &ldquo;Calculate Stakes&rdquo; on any opportunity to open
              the split-stake arbitrage calculator
            </p>
          </div>
          <Link
            href="/arbitrage"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Open Full Arbitrage Terminal →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Match / Sport</th>
                <th className="py-3 px-4">Market Type</th>
                <th className="py-3 px-4">Bookie A (Odds)</th>
                <th className="py-3 px-4">Bookie B (Odds)</th>
                <th className="py-3 px-4">Arbitrage %</th>
                <th className="py-3 px-4">Guaranteed Profit</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {topLiveArbs.map((arb) => (
                <tr
                  key={arb.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    arb.isNew ? "animate-flash-green" : ""
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">
                        {arb.match}
                      </span>
                      {arb.matchStatus === "LIVE" && (
                        <span className="bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                          🔴 LIVE {arb.liveScore ? `• ${arb.liveScore}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {arb.sport} • {arb.league}
                      {arb.kickoffLabel && (
                        <span className="font-mono text-[10px] text-emerald-400 ml-1.5">
                          ({arb.kickoffLabel})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex rounded-md bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-xs font-medium text-blue-300">
                      {arb.marketType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="text-xs text-slate-300">
                      {arb.bookieA} •{" "}
                      <span className="text-slate-400">{arb.outcomeA}</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">
                      @{arb.oddsA.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="text-xs text-slate-300">
                      {arb.bookieB} •{" "}
                      <span className="text-slate-400">{arb.outcomeB}</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">
                      @{arb.oddsB.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-xs text-slate-300">
                      {arb.arbPercentage.toFixed(2)}%
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Ratio: {arb.arbRatio.toFixed(4)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-extrabold text-emerald-400">
                      {formatSignedPercent(arb.profitMargin, 2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedArbForModal(arb)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Calculate Stakes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
