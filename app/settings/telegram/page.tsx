"use client";

import React, { useState } from "react";
import {
  Bell,
  Bot,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Radio,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { BookmakerName } from "@/types";

const ALL_BOOKMAKERS: BookmakerName[] = [
  "1xBet",
  "SportyBet",
  "Bet9ja",
  "BetKing",
  "Pinnacle",
  "22Bet",
  "Parimatch",
];

export default function TelegramAlertsSettingsPage() {
  const {
    telegramConfig,
    updateTelegramConfig,
    telegramLogs,
    sendTelegramAlert,
    arbitrageList,
    bankrollNGN,
    formatAmountFromNGN,
  } = useTerminal();

  const [showToken, setShowToken] = useState(false);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleToggleBookmaker = (bk: BookmakerName) => {
    const exists = telegramConfig.activeBookmakers.includes(bk);
    const next = exists
      ? telegramConfig.activeBookmakers.filter((item) => item !== bk)
      : [...telegramConfig.activeBookmakers, bk];
    updateTelegramConfig({ activeBookmakers: next });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleSendTest = async (
    type: "TEST_PING" | "SUREBET_ALERT" | "DAILY_SUMMARY"
  ) => {
    setSendingType(type);
    await sendTelegramAlert(type);
    setTimeout(() => setSendingType(null), 700);
  };

  const sampleArb = arbitrageList[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-400">
            <Send className="h-3.5 w-3.5" />
            <span>AUTOMATED TELEGRAM BOT BRIDGE & SCRAPER TRIGGERS</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            Telegram &amp; Scraper Alerts Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure instant webhook dispatches to your private Telegram desk
            whenever surebets or +EV edges cross your thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSendTest("TEST_PING")}
            disabled={sendingType !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/15 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {sendingType === "TEST_PING"
                ? "Dispatching Ping..."
                : "Send Test Ping"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSendTest("SUREBET_ALERT")}
            disabled={sendingType !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {sendingType === "SUREBET_ALERT"
                ? "Sending Surebet..."
                : "Simulate Surebet Alert"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSendTest("DAILY_SUMMARY")}
            disabled={sendingType !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5 text-emerald-400" />
            <span>Send Daily Summary</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bot Credentials & Toggle Switches */}
        <form
          onSubmit={handleSaveConfig}
          className="lg:col-span-7 space-y-6"
        >
          {/* Bot Token & Chat ID Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Telegram Bot Credentials
                </h2>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-slate-300">
                  Master Bot Bridge
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={telegramConfig.enabled}
                  onClick={() =>
                    updateTelegramConfig({ enabled: !telegramConfig.enabled })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    telegramConfig.enabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      telegramConfig.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tg-bot-token"
                  className="block text-xs font-semibold text-slate-400 mb-1.5"
                >
                  Telegram Bot Token (@BotFather)
                </label>
                <div className="relative">
                  <input
                    id="tg-bot-token"
                    type={showToken ? "text" : "password"}
                    value={telegramConfig.botToken}
                    onChange={(e) =>
                      updateTelegramConfig({ botToken: e.target.value })
                    }
                    placeholder="7192840192:AAH9vMoniBot..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-9 py-2 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Toggle Bot Token visibility"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tg-chat-id"
                  className="block text-xs font-semibold text-slate-400 mb-1.5"
                >
                  Target Chat ID / Channel ID
                </label>
                <input
                  id="tg-chat-id"
                  type="text"
                  value={telegramConfig.chatId}
                  onChange={(e) =>
                    updateTelegramConfig({ chatId: e.target.value })
                  }
                  placeholder="-1002198471092"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Alert Preferences & Toggle Switches */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Alert Rules &amp; Trigger Preferences
              </h2>
            </div>

            <div className="divide-y divide-slate-800/80">
              {/* Toggle 1: Alert only if Arbitrage > 2.0% */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Alert only if Arbitrage &gt;{" "}
                    {telegramConfig.minArbThreshold.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Suppress low-yield noise and only push high-margin surebets
                    to Telegram
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Threshold:
                    </span>
                    {[1.5, 2.0, 2.5, 3.5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          updateTelegramConfig({ minArbThreshold: val })
                        }
                        className={`rounded px-2 py-0.5 font-mono text-xs ${
                          telegramConfig.minArbThreshold === val
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        &gt;{val.toFixed(1)}%
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={telegramConfig.alertHighArbOnly}
                  onClick={() =>
                    updateTelegramConfig({
                      alertHighArbOnly: !telegramConfig.alertHighArbOnly,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    telegramConfig.alertHighArbOnly
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      telegramConfig.alertHighArbOnly
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Send daily bankroll summaries */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Send daily bankroll summaries
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated 09:00 UTC digest with Total Bankroll, 24h Net
                    Profit, and settled surebet count
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={telegramConfig.sendDailySummary}
                  onClick={() =>
                    updateTelegramConfig({
                      sendDailySummary: !telegramConfig.sendDailySummary,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    telegramConfig.sendDailySummary
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      telegramConfig.sendDailySummary
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Alert on High +EV Value Bets */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Alert on Pinnacle Sharp +EV Discrepancies (&gt;
                    {telegramConfig.minEvThreshold}%)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Includes Kelly Criterion recommended stake sizing in message
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={telegramConfig.alertValueBets}
                  onClick={() =>
                    updateTelegramConfig({
                      alertValueBets: !telegramConfig.alertValueBets,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    telegramConfig.alertValueBets
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      telegramConfig.alertValueBets
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Notify on Gemini API Key failover */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Notify on Gemini API Key HTTP 429 / 403 failover
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Alert engineering channel when{" "}
                    <code className="font-mono text-blue-400">
                      getValidGeminiKey()
                    </code>{" "}
                    rotates to a backup key
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={telegramConfig.notifyKeyFailover}
                  onClick={() =>
                    updateTelegramConfig({
                      notifyKeyFailover: !telegramConfig.notifyKeyFailover,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    telegramConfig.notifyKeyFailover
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      telegramConfig.notifyKeyFailover
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Active Bookmaker Scrapers */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Monitored Bookmaker Scrapers
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_BOOKMAKERS.map((bk) => {
                  const active = telegramConfig.activeBookmakers.includes(bk);
                  return (
                    <button
                      key={bk}
                      type="button"
                      onClick={() => handleToggleBookmaker(bk)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-emerald-400" />}
                      <span>{bk}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              {savedBanner ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Configuration persisted to localStorage!
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Changes auto-persist to browser storage
                </span>
              )}

              <button
                type="submit"
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
              >
                Save Alert Preferences
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Live Telegram Message Preview & Dispatch Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Formatted Message Preview Bubble */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Telegram Payload Preview
                </h3>
              </div>
              <span className="rounded bg-blue-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                Chat: {telegramConfig.chatId || "-1002198471092"}
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-4 font-mono text-xs space-y-1.5 text-slate-200 shadow-inner">
              <div className="text-emerald-400 font-bold">
                🟢 A.V MONI SUREBET DETECTED
              </div>
              <div>
                ⚽ <span className="text-slate-400">Match:</span>{" "}
                <strong>{sampleArb?.match || "Arsenal vs Chelsea"}</strong>
              </div>
              <div>
                📊 <span className="text-slate-400">Market:</span>{" "}
                {sampleArb?.marketType || "Over/Under 2.5 Goals"}
              </div>
              <div>
                🏦 <span className="text-slate-400">Leg A:</span>{" "}
                {sampleArb?.bookieA || "SportyBet"} (
                {sampleArb?.outcomeA || "Over 2.5"}) @{" "}
                <strong className="text-emerald-400">
                  {sampleArb?.oddsA.toFixed(2) || "2.12"}
                </strong>
              </div>
              <div>
                🏦 <span className="text-slate-400">Leg B:</span>{" "}
                {sampleArb?.bookieB || "1xBet"} (
                {sampleArb?.outcomeB || "Under 2.5"}) @{" "}
                <strong className="text-emerald-400">
                  {sampleArb?.oddsB.toFixed(2) || "2.04"}
                </strong>
              </div>
              <div className="pt-1 border-t border-slate-800 text-emerald-300 font-bold">
                💰 Guaranteed Margin: +{sampleArb?.profitMargin || 3.96}% |
                Bankroll: {formatAmountFromNGN(bankrollNGN)}
              </div>
            </div>
          </div>

          {/* Recent Telegram Webhook Dispatch Log */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Recent Webhook Dispatches ({telegramLogs.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {telegramLogs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-blue-400 font-semibold">
                      [{item.type}]
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{item.timestamp}</span>
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                    {item.messagePreview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
