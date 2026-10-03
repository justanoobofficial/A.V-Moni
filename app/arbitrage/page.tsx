"use client";

import React, { useMemo, useState } from "react";
import {
  Calculator,
  Filter,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { ArbitrageOpportunity, BookmakerName, SportType } from "@/types";
import {
  calculateArbitrageStakes,
  formatCurrency,
  formatSignedPercent,
} from "@/lib/math";

const SPORTS_FILTER: ("All" | SportType)[] = [
  "All",
  "Football",
  "Tennis",
  "Basketball",
];

const BOOKMAKERS_FILTER: ("All" | BookmakerName)[] = [
  "All",
  "SportyBet",
  "1xBet",
  "Bet9ja",
  "BetKing",
  "22Bet",
  "Parimatch",
];

export default function LiveArbitrageFeedPage() {
  const {
    arbitrageList,
    currency,
    setSelectedArbForModal,
    isScannerRunning,
    nextScanCountdown,
    triggerManualScan,
    sendTelegramAlert,
  } = useTerminal();

  const [selectedSport, setSelectedSport] = useState<"All" | SportType>("All");
  const [minProfitPercent, setMinProfitPercent] = useState<number>(1.5);
  const [selectedBookie, setSelectedBookie] = useState<"All" | BookmakerName>(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"profit" | "recent">("profit");
  const [sentAlertId, setSentAlertId] = useState<string | null>(null);

  const referenceStake =
    currency === "NGN" ? 50000 : currency === "USD" ? 100 : 100;

  const filteredOpportunities = useMemo(() => {
    return arbitrageList
      .filter((item) => {
        if (selectedSport !== "All" && item.sport !== selectedSport) {
          return false;
        }
        if (item.profitMargin < minProfitPercent) {
          return false;
        }
        if (
          selectedBookie !== "All" &&
          item.bookieA !== selectedBookie &&
          item.bookieB !== selectedBookie
        ) {
          return false;
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const matchText =
            `${item.match} ${item.league} ${item.marketType} ${item.bookieA} ${item.bookieB}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "profit") {
          return b.profitMargin - a.profitMargin;
        }
        return b.createdAt - a.createdAt;
      });
  }, [
    arbitrageList,
    selectedSport,
    minProfitPercent,
    selectedBookie,
    searchQuery,
    sortBy,
  ]);

  const handleDispatchRowAlert = async (arb: ArbitrageOpportunity) => {
    setSentAlertId(arb.id);
    await sendTelegramAlert("SUREBET_ALERT", {
      match: arb.match,
      marketType: arb.marketType,
      bookieA: arb.bookieA,
      outcomeA: arb.outcomeA,
      oddsA: arb.oddsA,
      bookieB: arb.bookieB,
      outcomeB: arb.outcomeB,
      oddsB: arb.oddsB,
      profitMargin: arb.profitMargin,
      arbPercentage: arb.arbPercentage,
    });
    setTimeout(() => setSentAlertId(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            <span>REAL-TIME SUREBET SCANNER • 15-SECOND WS STREAM</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            Live Arbitrage Feed
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Scanning cross-bookmaker price discrepancies where{" "}
            <code className="font-mono text-emerald-400">
              (1/OddsA + 1/OddsB) &lt; 1.00
            </code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">
              {isScannerRunning
                ? `Auto-adding new window in ${nextScanCountdown}s`
                : "Scanner Paused"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => triggerManualScan()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Simulate New Arbitrage Window</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sport Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-blue-400" />
              Sport:
            </span>
            {SPORTS_FILTER.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedSport === sport
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Min Profit % Quick Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">
              Min Profit %:
            </span>
            {[
              { label: "All (>0%)", val: 0 },
              { label: "> 1.5%", val: 1.5 },
              { label: "> 2.5%", val: 2.5 },
              { label: "> 3.5%", val: 3.5 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setMinProfitPercent(chip.val)}
                className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                  minProfitPercent === chip.val
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Bookmaker Filter, Search, Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Bookmaker Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">
              Bookmakers:
            </span>
            {BOOKMAKERS_FILTER.map((bk) => (
              <button
                key={bk}
                type="button"
                onClick={() => setSelectedBookie(bk)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedBookie === bk
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold"
                    : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/50"
                }`}
              >
                {bk}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search match, league, market..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSortBy("profit")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  sortBy === "profit"
                    ? "bg-slate-800 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Highest Profit
              </button>
              <button
                type="button"
                onClick={() => setSortBy("recent")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  sortBy === "recent"
                    ? "bg-slate-800 text-blue-400 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Newest First
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Arbitrage Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/50 px-5 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              Showing{" "}
              <strong className="text-white">
                {filteredOpportunities.length}
              </strong>{" "}
              verified surebet windows (Reference stake:{" "}
              <strong className="font-mono text-emerald-400">
                {formatCurrency(referenceStake, currency)}
              </strong>
              )
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Click{" "}
            <strong className="text-emerald-400">Calculate Stakes</strong> on
            any row for custom investment sizing
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Match / Sport</th>
                <th className="py-3.5 px-4">Market Type</th>
                <th className="py-3.5 px-4">Bookie A (Odds)</th>
                <th className="py-3.5 px-4">Bookie B (Odds)</th>
                <th className="py-3.5 px-4">Arbitrage %</th>
                <th className="py-3.5 px-4">Guaranteed Profit</th>
                <th className="py-3.5 px-4">Time Found</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    <p className="font-semibold text-slate-300">
                      No arbitrage windows match your current filters.
                    </p>
                    <p className="text-xs mt-1">
                      Try lowering Min Profit % to &ldquo;All (&gt;0%)&rdquo; or
                      click{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSport("All");
                          setSelectedBookie("All");
                          setMinProfitPercent(0);
                          setSearchQuery("");
                        }}
                        className="text-emerald-400 underline font-semibold"
                      >
                        Reset Filters
                      </button>
                      .
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((arb) => {
                  const refCalc = calculateArbitrageStakes(
                    referenceStake,
                    arb.oddsA,
                    arb.oddsB
                  );

                  return (
                    <tr
                      key={arb.id}
                      className={`group hover:bg-slate-800/60 transition-colors ${
                        arb.isNew ? "animate-flash-green" : ""
                      }`}
                    >
                      {/* Match / Sport */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">
                            {arb.match}
                          </span>
                          {arb.matchStatus === "LIVE" && (
                            <span className="bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                              🔴 LIVE {arb.liveScore ? `• ${arb.liveScore}` : ""}
                            </span>
                          )}
                          {arb.isNew && arb.matchStatus !== "LIVE" && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
                            {arb.sport}
                          </span>
                          <span>{arb.league}</span>
                          {arb.kickoffLabel && (
                            <span className="font-mono text-[10px] text-emerald-400">
                              • {arb.kickoffLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Market Type */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-xs font-semibold text-blue-300">
                          {arb.marketType}
                        </span>
                      </td>

                      {/* Bookie A (Odds) */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-blue-300 border border-slate-700">
                            {arb.bookieA}
                          </span>
                          <span className="text-xs text-slate-400">
                            {arb.outcomeA}
                          </span>
                        </div>
                        <div className="mt-1 text-base font-extrabold text-emerald-400">
                          {arb.oddsA.toFixed(2)}
                        </div>
                      </td>

                      {/* Bookie B (Odds) */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-slate-700">
                            {arb.bookieB}
                          </span>
                          <span className="text-xs text-slate-400">
                            {arb.outcomeB}
                          </span>
                        </div>
                        <div className="mt-1 text-base font-extrabold text-emerald-400">
                          {arb.oddsB.toFixed(2)}
                        </div>
                      </td>

                      {/* Arbitrage % */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-sm font-bold text-slate-200">
                          {arb.arbPercentage.toFixed(2)}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Arb Ratio: {arb.arbRatio.toFixed(4)}
                        </div>
                      </td>

                      {/* Guaranteed Profit */}
                      <td className="py-4 px-4 font-mono">
                        <div className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 text-xs font-extrabold text-emerald-400">
                          {formatSignedPercent(arb.profitMargin, 2)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-emerald-300">
                          {formatCurrency(refCalc.guaranteedProfit, currency, {
                            showSign: true,
                          })}{" "}
                          <span className="text-[10px] text-slate-500 font-normal">
                            on{" "}
                            {formatCurrency(referenceStake, currency, {
                              decimals: 0,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Time Found */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">
                        <div>{arb.timeFound}</div>
                        <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI {arb.aiConfidence || 94}%
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDispatchRowAlert(arb)}
                            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-blue-400 transition-colors"
                            title="Push Surebet to Telegram Channel"
                          >
                            <Send
                              className={`h-3.5 w-3.5 ${
                                sentAlertId === arb.id
                                  ? "text-emerald-400"
                                  : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedArbForModal(arb)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            <span>Calculate Stakes</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
