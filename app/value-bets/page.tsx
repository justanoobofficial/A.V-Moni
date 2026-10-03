"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  Code2,
  Cpu,
  Filter,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { BookmakerName, SportType, ValueBetOpportunity } from "@/types";
import {
  calculateValueBetMetrics,
  formatCurrency,
  formatSignedPercent,
} from "@/lib/math";
import type { AnalyzeMatchResponsePayload } from "@/app/api/analyze-match/route";

const SPORTS: ("All" | SportType)[] = [
  "All",
  "Football",
  "Tennis",
  "Basketball",
];

const LOCAL_BOOKIES: ("All" | BookmakerName)[] = [
  "All",
  "SportyBet",
  "Bet9ja",
  "1xBet",
  "BetKing",
  "22Bet",
];

const INITIAL_ANALYSIS: AnalyzeMatchResponsePayload = {
  match: "Arsenal vs Leeds United",
  confidenceScore: 88,
  impliedProbability: "53.19%",
  trueProbability: "62.40%",
  edgePercentage: "+17.31%",
  recommendation: {
    bookmaker: "SportyBet",
    market: "1X2 & Goals / Over/Under 2.5 Goals",
    selection: "Arsenal to Win & Over 2.5 Goals (or Over 2.5 Goals)",
    odds: 1.88,
    kellyStakePercentage: 4.92,
  },
  reasoningSummary:
    "Arsenal are unbeaten in their last 14 meetings against Leeds United (12 wins, 2 draws, including 6+ consecutive victories and a 5-0 win at Emirates Stadium). With Arsenal averaging 2.70 total match goals and Leeds conceding 1.33 goals/game away from home, true probability is modeled at 62.40% vs SportyBet's 53.19% implied (@1.88), yielding a +17.31% EV edge.",
  deepResearch: {
    mediaSentiment:
      "Overwhelmingly favoring Arsenal (85% H2H win dominance across BBC Sport, Sky Sports & ESPN)",
    keyTacticalNotes:
      "Mikel Arteta's side dominates wide overloads and set-piece xG at the Emirates; Leeds' high transition line leaves space behind full-backs.",
    teamAAbsences:
      "Arsenal: First-choice attacking & midfield spine fit (Near Full Strength)",
    teamBAbsences:
      "Leeds United: Away defensive xGA vulnerability (1.33 goals conceded/90 on the road; only 8% H2H clean sheets)",
    rosterAdvantage:
      "Arsenal holds a commanding squad depth, home xG (+1.50 scored/game), and historical H2H advantage (12W-2D-0L in last 14).",
    confidenceTier: "High",
    oneSentenceCoreReason:
      "Arsenal's 14-match unbeaten H2H dominance over Leeds combined with a 62.40% true probability against SportyBet's 53.19% implied odds (@1.88) locks in a +17.31% mathematical +EV edge.",
  },
};

export default function ValueBetsTerminalPage() {
  const {
    valueBets,
    currency,
    bankrollNGN,
    convertNGNToCurrent,
    convertCurrentToNGN,
    kellyMultiplier,
    setKellyMultiplier,
    triggerManualScan,
    executeValueBet,
    geminiKeys,
    activeGeminiKey,
  } = useTerminal();

  // AI Match Analyst Input Card State
  const [matchInput, setMatchInput] = useState<string>(
    "Manchester United vs Tottenham Hotspur"
  );
  const [targetBookmaker, setTargetBookmaker] =
    useState<BookmakerName>("SportyBet");
  const [currentOddsInput, setCurrentOddsInput] = useState<string>("2.15");
  const [teamNewsNotes, setTeamNewsNotes] = useState<string>(
    "Visiting center-back doubtful with hamstring strain; home attack averaging 2.1 xG across last 4 home matches. High transition pace expected."
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisOutput, setAnalysisOutput] =
    useState<AnalyzeMatchResponsePayload>(INITIAL_ANALYSIS);
  const [usedKeyLabel, setUsedKeyLabel] = useState<string>(
    activeGeminiKey
      ? `${activeGeminiKey.alias} (${activeGeminiKey.maskedKey})`
      : "Primary Scraper Node #1 (AQ.Ab8...UX0w)"
  );
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [lockedTicketSuccess, setLockedTicketSuccess] =
    useState<boolean>(false);

  // Table Filters
  const [selectedSport, setSelectedSport] = useState<"All" | SportType>("All");
  const [selectedBookie, setSelectedBookie] = useState<"All" | BookmakerName>(
    "All"
  );
  const [minEvFilter, setMinEvFilter] = useState<number>(0);
  const [loggedId, setLoggedId] = useState<string | null>(null);

  const bankrollInCurrent = convertNGNToCurrent(bankrollNGN);

  // Calculate exact currency stake from the AI Output's kellyStakePercentage & active bankroll
  const aiRecommendedStakeInCurrent = useMemo(() => {
    const pct = analysisOutput.recommendation.kellyStakePercentage || 0;
    // Scale by user's selected Kelly multiplier relative to the default 0.5x Half-Kelly
    const multiplierScale = kellyMultiplier / 0.5;
    const effectivePct = Math.min(25, pct * multiplierScale);
    return {
      effectivePct: Number(effectivePct.toFixed(2)),
      stakeAmount: Number(((bankrollInCurrent * effectivePct) / 100).toFixed(2)),
    };
  }, [
    analysisOutput.recommendation.kellyStakePercentage,
    bankrollInCurrent,
    kellyMultiplier,
  ]);

  const handleRunAiAnalysis = async (
    e?: React.FormEvent,
    overrideParams?: {
      match: string;
      bookmaker: BookmakerName;
      odds: number;
      notes: string;
      marketHint?: string;
    }
  ) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setLockedTicketSuccess(false);

    const payload = {
      match: overrideParams ? overrideParams.match : matchInput,
      bookmaker: overrideParams ? overrideParams.bookmaker : targetBookmaker,
      odds: overrideParams
        ? overrideParams.odds
        : parseFloat(currentOddsInput) || 2.1,
      notes: overrideParams ? overrideParams.notes : teamNewsNotes,
      marketHint: overrideParams?.marketHint,
      keys: geminiKeys,
    };

    try {
      const res = await fetch("/api/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisOutput({
          match: data.match,
          confidenceScore: data.confidenceScore,
          impliedProbability: data.impliedProbability,
          trueProbability: data.trueProbability,
          edgePercentage: data.edgePercentage,
          recommendation: data.recommendation,
          reasoningSummary: data.reasoningSummary,
          deepResearch: data.deepResearch,
        });
        if (data.meta?.usedKey) {
          setUsedKeyLabel(
            `${data.meta.usedKey.alias} (${data.meta.usedKey.maskedKey})`
          );
        }
      }
    } catch {
      // Retain current analysis if offline
    } finally {
      setTimeout(() => setIsAnalyzing(false), 320);
    }
  };

  const handleLockAiRecommendation = () => {
    const stakeNGN = convertCurrentToNGN(
      aiRecommendedStakeInCurrent.stakeAmount
    );
    const evNumeric =
      parseFloat(analysisOutput.edgePercentage.replace(/[^0-9.-]/g, "")) || 8.5;

    const syntheticVb: ValueBetOpportunity = {
      id: `ai-ev-${Date.now()}`,
      match: analysisOutput.match,
      league: "AI Deep-Dive Value Pick",
      sport: "Football",
      marketType: analysisOutput.recommendation.market,
      outcome: analysisOutput.recommendation.selection,
      localBookie:
        (analysisOutput.recommendation.bookmaker as BookmakerName) ||
        "SportyBet",
      localOdds: analysisOutput.recommendation.odds,
      sharpBookie: "Pinnacle",
      sharpOdds: Number(
        (
          100 /
          (parseFloat(analysisOutput.trueProbability) || 54.8)
        ).toFixed(2)
      ),
      sharpImpliedProb: parseFloat(analysisOutput.trueProbability) || 54.8,
      localImpliedProb: parseFloat(analysisOutput.impliedProbability) || 46.5,
      impliedEdgePercent:
        (parseFloat(analysisOutput.trueProbability) || 54.8) -
        (parseFloat(analysisOutput.impliedProbability) || 46.5),
      evPercent: evNumeric,
      kellyFractionFull:
        analysisOutput.recommendation.kellyStakePercentage * 2,
      timeFound: "AI Verified",
      createdAt: Date.now(),
    };

    executeValueBet(syntheticVb, stakeNGN);
    setLockedTicketSuccess(true);
    setTimeout(() => setLockedTicketSuccess(false), 2200);
  };

  const filteredValueBets = useMemo(() => {
    return valueBets
      .filter((vb) => {
        if (selectedSport !== "All" && vb.sport !== selectedSport) return false;
        if (selectedBookie !== "All" && vb.localBookie !== selectedBookie)
          return false;
        if (vb.evPercent < minEvFilter) return false;
        return true;
      })
      .sort((a, b) => b.evPercent - a.evPercent);
  }, [valueBets, selectedSport, selectedBookie, minEvFilter]);

  const handleLogTablePosition = (
    vb: ValueBetOpportunity,
    recommendedStakeInCurrent: number
  ) => {
    const stakeNGN = convertCurrentToNGN(recommendedStakeInCurrent);
    executeValueBet(vb, stakeNGN);
    setLoggedId(vb.id);
    setTimeout(() => setLoggedId(null), 1600);
  };

  const impliedPctNum = Math.min(
    100,
    Math.max(5, parseFloat(analysisOutput.impliedProbability) || 46.5)
  );
  const truePctNum = Math.min(
    100,
    Math.max(5, parseFloat(analysisOutput.trueProbability) || 54.8)
  );

  return (
    <div className="space-y-6">
      {/* 1. Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Bot className="h-3.5 w-3.5" />
            <span>STANDALONE GEMINI QUANTITATIVE ENGINE • SINGLE-LEG +EV</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            AI Match Analyst &amp; +EV Value Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantitative deep-dives, injury impact evaluation, and
            single-direction value bets for SportyBet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kelly Fraction Multiplier Selector */}
          <div className="flex items-center border border-slate-800 bg-slate-900 p-1 text-xs font-mono">
            <span className="px-2 text-slate-400">Kelly Sizing:</span>
            {[
              { label: "0.25x (Quarter)", val: 0.25 },
              { label: "0.50x (Half)", val: 0.5 },
              { label: "1.00x (Full)", val: 1.0 },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setKellyMultiplier(opt.val)}
                className={`px-2.5 py-1 transition-all cursor-pointer ${
                  kellyMultiplier === opt.val
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => triggerManualScan()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Scan New +EV Line</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: 2. Match Analysis Input Card (Left 5 cols) + 3. Results Ticket Display (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. Match Analysis Input Card */}
        <form
          onSubmit={(e) => handleRunAiAnalysis(e)}
          className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  <span>Match Analysis Input Card</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Feed fixture parameters &amp; injury notes into rotated Gemini
                  pool
                </p>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                {activeGeminiKey ? activeGeminiKey.maskedKey : "POOL ACTIVE"}
              </span>
            </div>

            {/* Quick-Load Real Fixture Chips */}
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Quick-Load Today&apos;s Fixtures:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    match: "Man Utd vs Tottenham Hotspur",
                    bookie: "SportyBet" as BookmakerName,
                    odds: 2.15,
                    notes:
                      "Spurs playing high defensive line; United strong counter-attacking xG at Old Trafford.",
                  },
                  {
                    match: "Y. Bu vs Novak Djokovic",
                    bookie: "SportyBet" as BookmakerName,
                    odds: 2.14,
                    notes:
                      "ATP 500 Beijing fast indoor conditions; high first-serve percentage holding games Over 20.5.",
                  },
                  {
                    match: "Arsenal vs Leeds United",
                    bookie: "SportyBet" as BookmakerName,
                    odds: 1.88,
                    notes:
                      "Arsenal unbeaten at Emirates; Saka & Odegaard creating 2.6 xG per game.",
                  },
                  {
                    match: "Ivory Coast vs Cameroon",
                    bookie: "1xBet" as BookmakerName,
                    odds: 2.24,
                    notes:
                      "Abidjan derby; attacking lineups named for both sides.",
                  },
                ].map((preset) => (
                  <button
                    key={preset.match}
                    type="button"
                    onClick={() => {
                      setMatchInput(preset.match);
                      setTargetBookmaker(preset.bookie);
                      setCurrentOddsInput(String(preset.odds));
                      setTeamNewsNotes(preset.notes);
                      handleRunAiAnalysis(undefined, {
                        match: preset.match,
                        bookmaker: preset.bookie,
                        odds: preset.odds,
                        notes: preset.notes,
                      });
                    }}
                    className="border border-slate-700 bg-slate-950/80 hover:border-emerald-500/50 px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {preset.match}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Name Input */}
            <div>
              <label
                htmlFor="ai-match-name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
              >
                Match Name
              </label>
              <input
                id="ai-match-name"
                type="text"
                required
                value={matchInput}
                onChange={(e) => setMatchInput(e.target.value)}
                placeholder="e.g., Man Utd vs Chelsea"
                className="w-full px-3 py-2.5 text-sm font-semibold text-white"
              />
            </div>

            {/* Target Bookmaker & Current Bookie Odds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ai-target-bookie"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
                >
                  Target Bookmaker
                </label>
                <select
                  id="ai-target-bookie"
                  value={targetBookmaker}
                  onChange={(e) =>
                    setTargetBookmaker(e.target.value as BookmakerName)
                  }
                  className="w-full px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <option value="SportyBet">SportyBet</option>
                  <option value="1xBet">1xBet</option>
                  <option value="Bet9ja">Bet9ja</option>
                  <option value="BetKing">BetKing</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ai-bookie-odds"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
                >
                  Current Bookie Odds
                </label>
                <input
                  id="ai-bookie-odds"
                  type="number"
                  step="0.01"
                  min="1.02"
                  required
                  value={currentOddsInput}
                  onChange={(e) => setCurrentOddsInput(e.target.value)}
                  placeholder="2.10"
                  className="w-full px-3 py-2.5 font-mono text-base font-bold text-emerald-400"
                />
              </div>
            </div>

            {/* Team News / Injury / Form Notes Textarea */}
            <div>
              <label
                htmlFor="ai-team-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
              >
                Team News / Injury / Form Notes
              </label>
              <textarea
                id="ai-team-notes"
                rows={3}
                value={teamNewsNotes}
                onChange={(e) => setTeamNewsNotes(e.target.value)}
                placeholder="Enter key injuries, suspensions, recent xG form, or tactical notes..."
                className="w-full px-3 py-2 text-xs text-white leading-relaxed"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 py-3 px-4 text-xs font-bold text-slate-950 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Gemini Deep-Dive &amp; Edge Calculation...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Run AI Deep-Dive &amp; Calculate Edge</span>
              </>
            )}
          </button>
        </form>

        {/* 3. Results Ticket Display (The Output Card) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between space-y-5">
          {/* Ticket Top Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>AI QUANTITATIVE +EV RESULTS TICKET</span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {analysisOutput.match}
              </h2>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Analyzed via Rotated Key:{" "}
                <strong className="text-emerald-400">{usedKeyLabel}</strong>
              </p>
            </div>

            {/* The Edge % (+EV margin badge) */}
            <div className="flex items-center gap-2">
              <div className="border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-right font-mono">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">
                  Verified +EV Edge
                </div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {analysisOutput.edgePercentage}
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Confidence Score with Progress Bar + Implied vs True Probability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Statistical Confidence Score */}
            <div className="border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-300">
                  Statistical Confidence Score
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  {analysisOutput.confidenceScore}% Match Rating
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, analysisOutput.confidenceScore)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>Model Threshold: 70%</span>
                <span className="text-emerald-400">HIGH CONVICTION</span>
              </div>
            </div>

            {/* Bookie Implied Odds vs. True Probability Comparison */}
            <div className="border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 font-mono text-xs">
              <div className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-300">
                Bookie Implied vs. True Probability
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">
                    {analysisOutput.recommendation.bookmaker} Implied (1 /{" "}
                    {analysisOutput.recommendation.odds.toFixed(2)}):
                  </span>
                  <strong className="text-slate-200">
                    {analysisOutput.impliedProbability}
                  </strong>
                </div>
                <div className="h-2 w-full bg-slate-800">
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${impliedPctNum}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-300">
                    AI Modeled True Win Probability:
                  </span>
                  <strong className="text-emerald-400">
                    {analysisOutput.trueProbability}
                  </strong>
                </div>
                <div className="h-2 w-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${truePctNum}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Directional Recommendation Box */}
          <div className="border-2 border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>
                  DIRECTIONAL RECOMMENDATION (SINGLE-BET ON{" "}
                  {analysisOutput.recommendation.bookmaker.toUpperCase()})
                </span>
              </div>
              <div className="text-lg font-extrabold text-white">
                {analysisOutput.recommendation.bookmaker}:{" "}
                <span className="text-emerald-400">
                  {analysisOutput.recommendation.selection}
                </span>{" "}
                @{" "}
                <span className="font-mono text-emerald-300">
                  {analysisOutput.recommendation.odds.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Market:{" "}
                <strong className="text-white">
                  {analysisOutput.recommendation.market}
                </strong>
              </div>
            </div>

            {/* Kelly Criterion Stake Calculator Box */}
            <div className="sm:text-right border-t sm:border-t-0 border-emerald-500/20 pt-3 sm:pt-0 font-mono">
              <div className="text-[11px] text-emerald-300">
                Kelly Stake ({aiRecommendedStakeInCurrent.effectivePct}% of{" "}
                {formatCurrency(bankrollInCurrent, currency, { decimals: 0 })})
              </div>
              <div className="text-2xl font-extrabold text-white mt-0.5">
                {formatCurrency(
                  aiRecommendedStakeInCurrent.stakeAmount,
                  currency
                )}
              </div>
              <div className="text-[10px] text-slate-300">
                Est. Payout:{" "}
                {formatCurrency(
                  aiRecommendedStakeInCurrent.stakeAmount *
                    analysisOutput.recommendation.odds,
                  currency
                )}
              </div>
            </div>
          </div>

          {/* 4-Pillar Autonomous Deep-Research Breakdown */}
          <div className="border border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                🌐 A.V MONI DEEP-RESEARCH TICKET: {analysisOutput.match}
              </span>
              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>{showRawJson ? "Hide JSON" : "Inspect API JSON"}</span>
              </button>
            </div>

            {analysisOutput.deepResearch ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-800 bg-slate-900/60 p-2.5 space-y-1">
                  <div className="font-mono font-bold text-emerald-400 text-[11px]">
                    1. 📰 Mass Media &amp; Press Consensus
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-white">Sentiment:</strong>{" "}
                    {analysisOutput.deepResearch.mediaSentiment}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong className="text-slate-200">Tactical Notes:</strong>{" "}
                    {analysisOutput.deepResearch.keyTacticalNotes}
                  </p>
                </div>

                <div className="border border-slate-800 bg-slate-900/60 p-2.5 space-y-1">
                  <div className="font-mono font-bold text-blue-400 text-[11px]">
                    2. 🚑 Squad Availability &amp; Red Flags
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    • {analysisOutput.deepResearch.teamAAbsences}
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    • {analysisOutput.deepResearch.teamBAbsences}
                  </p>
                  <p className="text-emerald-300 text-[11px] font-medium">
                    • Edge: {analysisOutput.deepResearch.rosterAdvantage}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-emerald-400 font-mono">
                Core Synthesis:
              </strong>{" "}
              {analysisOutput.deepResearch?.oneSentenceCoreReason ||
                analysisOutput.reasoningSummary}
            </p>

            {showRawJson && (
              <pre className="mt-2 border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                {JSON.stringify(analysisOutput, null, 2)}
              </pre>
            )}
          </div>

          {/* Output Card Footer Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs font-mono text-slate-400">
              Active Bankroll:{" "}
              <strong className="text-white">
                {formatCurrency(bankrollInCurrent, currency)}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleLockAiRecommendation}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all cursor-pointer"
            >
              {lockedTicketSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>+EV Kelly Position Logged to Bankroll!</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    Lock Recommended Stake (
                    {formatCurrency(
                      aiRecommendedStakeInCurrent.stakeAmount,
                      currency
                    )}
                    )
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Multi-Match +EV Feed Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Live SportyBet &amp; Local Bookie +EV Value Feed (vs. Pinnacle
              Sharp Lines)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any row to load that fixture into the AI Match Analyst above
              for a full injury &amp; tactical deep-dive
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-blue-400 mr-1" />
              {SPORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSport(s)}
                  className={`px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    selectedSport === s
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {LOCAL_BOOKIES.map((bk) => (
                <button
                  key={bk}
                  type="button"
                  onClick={() => setSelectedBookie(bk)}
                  className={`px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedBookie === bk
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {bk}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {[0, 4, 6].map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => setMinEvFilter(ev)}
                  className={`px-2 py-1 font-mono text-xs font-semibold cursor-pointer ${
                    minEvFilter === ev
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {ev === 0 ? "All +EV" : `>${ev}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Match</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Local Bookie (Odds)</th>
                <th className="py-3.5 px-4">Sharp Bookie Odds</th>
                <th className="py-3.5 px-4">Implied Edge %</th>
                <th className="py-3.5 px-4">Expected Value (+EV)</th>
                <th className="py-3.5 px-4">
                  Recommended Stake (Kelly Criterion)
                </th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filteredValueBets.map((vb) => {
                const liveMetrics = calculateValueBetMetrics(
                  vb.localOdds,
                  vb.sharpOdds,
                  bankrollInCurrent,
                  kellyMultiplier
                );

                return (
                  <tr
                    key={vb.id}
                    onClick={() => {
                      setMatchInput(vb.match);
                      setTargetBookmaker(vb.localBookie);
                      setCurrentOddsInput(String(vb.localOdds));
                      const autoNotes = `${vb.league} (${vb.marketType}): ${vb.localBookie} offering @${vb.localOdds} vs Pinnacle sharp benchmark @${vb.sharpOdds}. Evaluate directional ${vb.outcome} edge.`;
                      setTeamNewsNotes(autoNotes);
                      handleRunAiAnalysis(undefined, {
                        match: vb.match,
                        bookmaker: vb.localBookie,
                        odds: vb.localOdds,
                        notes: autoNotes,
                        marketHint: vb.marketType,
                      });
                    }}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      vb.isNew ? "animate-flash-green" : ""
                    }`}
                  >
                    {/* Match */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{vb.match}</span>
                        {vb.matchStatus === "LIVE" && (
                          <span className="bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                            🔴 LIVE {vb.liveScore ? `• ${vb.liveScore}` : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 mr-1.5">
                          {vb.sport}
                        </span>
                        {vb.marketType}
                        {vb.kickoffLabel && (
                          <span className="font-mono text-[10px] text-emerald-400 ml-1.5">
                            • {vb.kickoffLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Outcome */}
                    <td className="py-4 px-4">
                      <span className="inline-flex rounded-md bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-xs font-semibold text-blue-300">
                        {vb.outcome}
                      </span>
                    </td>

                    {/* Local Bookie (Odds) */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-xs font-semibold text-slate-300">
                        {vb.localBookie}
                      </div>
                      <div className="text-base font-extrabold text-emerald-400">
                        @{vb.localOdds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Implied: {liveMetrics.localImpliedProb}%
                      </div>
                    </td>

                    {/* Sharp Bookie Odds */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-xs font-semibold text-blue-400">
                        {vb.sharpBookie} (Sharp)
                      </div>
                      <div className="text-base font-bold text-slate-200">
                        @{vb.sharpOdds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        True p: {liveMetrics.sharpImpliedProb}%
                      </div>
                    </td>

                    {/* Implied Edge % */}
                    <td className="py-4 px-4 font-mono">
                      <span className="inline-flex items-center rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-xs font-bold text-blue-300">
                        {formatSignedPercent(liveMetrics.impliedEdgePercent, 2)}{" "}
                        Edge
                      </span>
                    </td>

                    {/* Expected Value (+EV) */}
                    <td className="py-4 px-4 font-mono">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 text-xs font-extrabold text-emerald-400">
                        {formatSignedPercent(liveMetrics.evPercent, 2)} EV
                      </span>
                    </td>

                    {/* Recommended Stake (Kelly Criterion) */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-sm font-extrabold text-white">
                        {formatCurrency(liveMetrics.recommendedStake, currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        f* Full: {liveMetrics.kellyFractionFull}% •{" "}
                        <span className="text-blue-400">
                          {kellyMultiplier}x = {liveMetrics.recommendedFraction}
                          %
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td
                      className="py-4 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMatchInput(vb.match);
                            setTargetBookmaker(vb.localBookie);
                            setCurrentOddsInput(String(vb.localOdds));
                            const autoNotes = `${vb.league} (${vb.marketType}): ${vb.localBookie} offering @${vb.localOdds} vs Pinnacle sharp benchmark @${vb.sharpOdds}.`;
                            setTeamNewsNotes(autoNotes);
                            handleRunAiAnalysis(undefined, {
                              match: vb.match,
                              bookmaker: vb.localBookie,
                              odds: vb.localOdds,
                              notes: autoNotes,
                              marketHint: vb.marketType,
                            });
                          }}
                          className="border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 cursor-pointer"
                          title="Run AI Deep-Dive on this match"
                        >
                          AI Analyze
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleLogTablePosition(
                              vb,
                              liveMetrics.recommendedStake
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            loggedId === vb.id
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 hover:bg-blue-500 text-white"
                          }`}
                        >
                          {loggedId === vb.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-3.5 w-3.5" />
                              <span>Lock Stake</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
