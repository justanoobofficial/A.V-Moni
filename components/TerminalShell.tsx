"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Cpu,
  KeyRound,
  LayoutDashboard,
  Menu,
  Moon,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldAlert,
  Sun,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { CurrencyCode } from "@/types";
import ArbitrageCalculatorModal from "@/components/ArbitrageCalculatorModal";
import BankrollModal from "@/components/BankrollModal";

export default function TerminalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);

  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    bankrollNGN,
    setIsBankrollModalOpen,
    formatAmountFromNGN,
    arbitrageList,
    valueBets,
    geminiKeys,
    activeGeminiKey,
    isScannerRunning,
    setIsScannerRunning,
    nextScanCountdown,
    triggerManualScan,
    telegramConfig,
  } = useTerminal();

  const activeKeyCount = geminiKeys.filter((k) => k.status === "Active").length;

  const navItems = [
    {
      href: "/",
      roman: "I",
      label: "Overview Dashboard",
      shortLabel: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: "/arbitrage",
      roman: "II",
      label: "Live Arbitrage Feed",
      shortLabel: "Arbitrage",
      icon: Zap,
      badge: `${arbitrageList.length} Live`,
      badgeColor:
        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    },
    {
      href: "/value-bets",
      roman: "III",
      label: "Value Betting (+EV)",
      shortLabel: "+EV Terminal",
      icon: TrendingUp,
      badge: `${valueBets.length} +EV`,
      badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    },
    {
      href: "/settings/api-keys",
      roman: "IV",
      label: "Gemini Key Rotator",
      shortLabel: "API Keys",
      icon: KeyRound,
      badge: `${activeKeyCount}/${geminiKeys.length}`,
      badgeColor:
        activeKeyCount > 0
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    },
    {
      href: "/settings/telegram",
      roman: "V",
      label: "Telegram & Alerts",
      shortLabel: "Telegram",
      icon: Send,
      badge: telegramConfig.enabled ? "ON" : "OFF",
      badgeColor: telegramConfig.enabled
        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
        : "bg-slate-800 text-slate-400 border border-slate-700",
    },
  ];

  const handleManualTick = () => {
    triggerManualScan();
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 700);
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${
        theme === "dark"
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 shrink-0 flex flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${
          theme === "dark"
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        } ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Logo Header */}
        <div
          className={`flex items-center justify-between px-5 h-16 border-b ${
            theme === "dark" ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-3.5"
            onClick={() => setMobileNavOpen(false)}
          >
            <div className="relative flex h-9 w-9 rotate-45 items-center justify-center border border-[#D4AF37] bg-[#141414] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]">
              <Activity className="h-4 w-4 -rotate-45 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold tracking-[0.2em] text-base text-[#D4AF37]">
                  A.V MONI
                </span>
                <span className="bg-[#D4AF37]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/40">
                  MCMXXV
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Syndicate Terminal
              </p>
            </div>
          </Link>

          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Trading Desks & Telemetry
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs"
                    : theme === "dark"
                    ? "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xs text-[#D4AF37] w-5">
                    {item.roman}.
                  </span>
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="uppercase tracking-[0.12em] text-xs">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Gemini Rotator Live Telemetry Box in Sidebar */}
          <div className="pt-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              AI Odds Engine Pool
            </div>
            <div
              className={`mx-1 rounded-xl border p-3.5 space-y-2.5 ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-950/60"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Cpu className="h-3.5 w-3.5 text-blue-400" />
                  <span>Gemini Key Pool</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    activeGeminiKey
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {activeGeminiKey ? "ROTATOR OK" : "EXHAUSTED"}
                </span>
              </div>

              {activeGeminiKey ? (
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 truncate">
                    {activeGeminiKey.alias}
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-blue-400">
                      {activeGeminiKey.maskedKey}
                    </span>
                    <span className="text-emerald-400">
                      {activeGeminiKey.latencyMs}ms
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>All keys rate-limited. Reset in API Keys.</span>
                </div>
              )}

              <Link
                href="/settings/api-keys"
                onClick={() => setMobileNavOpen(false)}
                className="block w-full text-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 text-xs font-medium transition-colors"
              >
                Manage Key Rotation →
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Bankroll Footer */}
        <div
          className={`border-t p-4 ${
            theme === "dark"
              ? "border-slate-800 bg-slate-950/40"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              Active Bankroll
            </span>
            <button
              type="button"
              onClick={() => setIsBankrollModalOpen(true)}
              className="font-mono text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Edit Capital
            </button>
          </div>
          <div
            onClick={() => setIsBankrollModalOpen(true)}
            className="font-mono text-lg font-extrabold tracking-tight cursor-pointer hover:text-emerald-400 transition-colors"
            title="Click to edit live bankroll capital"
          >
            {formatAmountFromNGN(bankrollNGN)}
          </div>
          <div className="mt-2 flex items-center gap-1">
            {(["NGN", "USD", "GBP"] as CurrencyCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`flex-1 rounded py-1 font-mono text-xs font-semibold transition-colors ${
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
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Telemetry Header */}
        <header
          className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b px-4 lg:px-6 py-3 backdrop-blur-md ${
            theme === "dark"
              ? "border-slate-800 bg-slate-900/90"
              : "border-slate-200 bg-white/90"
          }`}
        >
          {/* Left: Mobile Menu Trigger + System Status Pill Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Required System Status Pill Indicator */}
            <div
              className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                isScannerRunning
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isScannerRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isScannerRunning ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </span>
              <span className="truncate">
                {isScannerRunning
                  ? "🟢 System Status: Scanning (1xBet, SportyBet, Bet9ja)"
                  : "🟡 System Status: Scanner Paused (1xBet, SportyBet, Bet9ja)"}
              </span>
              <span className="hidden sm:inline-block rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
                Next tick: {nextScanCountdown}s
              </span>
            </div>
          </div>

          {/* Right Controls: Scan Now, Pause/Resume, Currency Switcher, Theme */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleManualTick}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                scanFlash
                  ? "border-emerald-400 bg-emerald-500/25 text-emerald-300"
                  : "border-slate-700 bg-slate-800/90 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800"
              }`}
              title="Immediately inject a new simulated arbitrage window"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-400 ${
                  scanFlash ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Force Scan Tick</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScannerRunning((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              title={
                isScannerRunning
                  ? "Pause 15s auto-scanner"
                  : "Resume 15s auto-scanner"
              }
            >
              {isScannerRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden md:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Resume</span>
                </>
              )}
            </button>

            {/* Header Currency Switcher */}
            <div className="hidden md:flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5">
              {(["NGN", "USD", "GBP"] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
                    currency === code
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {code === "NGN" ? "₦ NGN" : code === "USD" ? "$ USD" : "£ GBP"}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Toggle dark/light theme"
              title="Toggle Terminal Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-blue-500" />
              )}
            </button>
          </div>
        </header>

        {/* AI Rotator Live Banner Strip */}
        <div
          className={`border-b px-4 lg:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 ${
            theme === "dark"
              ? "border-slate-800/80 bg-slate-900/40 text-slate-400"
              : "border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="truncate">
              <strong className="text-slate-200">Gemini Odds Engine:</strong>{" "}
              Active Key{" "}
              <code className="font-mono text-blue-400">
                {activeGeminiKey ? activeGeminiKey.maskedKey : "NONE"}
              </code>{" "}
              • Auto-failover on HTTP 429/403 enabled
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>
              Arb Formula:{" "}
              <strong className="text-emerald-400">
                (1/OddsA + 1/OddsB) &lt; 1.00
              </strong>
            </span>
            <span className="hidden sm:inline">
              Kelly:{" "}
              <strong className="text-blue-400">
                f* = (p·b - (1-p)) / b
              </strong>
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <ArbitrageCalculatorModal />
      <BankrollModal />
    </div>
  );
}
