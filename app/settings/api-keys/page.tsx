"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Cpu,
  KeyRound,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { GeminiKeyStatus } from "@/types";

export default function GeminiApiKeyRotatorPage() {
  const {
    geminiKeys,
    rotationLogs,
    activeGeminiKey,
    lastAiInsight,
    addGeminiKey,
    deleteGeminiKey,
    updateKeyStatus,
    prioritizeGeminiKey,
    triggerKeyRotation,
    testSingleGeminiKey,
    resetAllGeminiKeys,
  } = useTerminal();

  const [aliasInput, setAliasInput] = useState("");
  const [rawKeyInput, setRawKeyInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<string>(
    String(geminiKeys.length + 1)
  );
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [rotatingBusy, setRotatingBusy] = useState(false);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawKeyInput.trim()) return;
    addGeminiKey(
      aliasInput || `Gemini Scraper Key #${geminiKeys.length + 1}`,
      rawKeyInput,
      parseInt(priorityInput, 10) || geminiKeys.length + 1
    );
    setAliasInput("");
    setRawKeyInput("");
    setPriorityInput(String(geminiKeys.length + 2));
  };

  const handleTestKey = async (id: string) => {
    setTestingKeyId(id);
    await testSingleGeminiKey(id);
    setTimeout(() => setTestingKeyId(null), 600);
  };

  const handleSimulateRotation = async (status?: 429 | 403) => {
    setRotatingBusy(true);
    await triggerKeyRotation(status);
    setTimeout(() => setRotatingBusy(false), 350);
  };

  const getStatusBadge = (status: GeminiKeyStatus) => {
    if (status === "Active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    }
    if (status === "Rate Limited") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Rate Limited (429)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 px-2.5 py-0.5 font-mono text-xs font-semibold text-rose-400">
        <XCircle className="h-3 w-3" />
        Quota Exhausted (403)
      </span>
    );
  };

  const sortedKeys = [...geminiKeys].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-400">
            <KeyRound className="h-3.5 w-3.5" />
            <span>HIGH-AVAILABILITY AI SCRAPER KEY POOLING</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            Gemini API Key Rotator & Failover Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Backed by{" "}
            <code className="font-mono text-emerald-400">
              getValidGeminiKey()
            </code>{" "}
            in{" "}
            <code className="font-mono text-blue-400">
              /lib/geminiRotator.ts
            </code>{" "}
            — automatically advances key index on HTTP 429 &amp; 403 errors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSimulateRotation(undefined)}
            disabled={rotatingBusy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Dispatch Test Request</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateRotation(429)}
            disabled={rotatingBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Simulate HTTP 429 Failover</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateRotation(403)}
            disabled={rotatingBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-all cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Simulate HTTP 403 Quota Error</span>
          </button>

          <button
            type="button"
            onClick={resetAllGeminiKeys}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Pool</span>
          </button>
        </div>
      </div>

      {/* Active Rotator Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Current Active Key Selected by{" "}
                <code className="text-emerald-400">getValidGeminiKey()</code>
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Healthy Keys:{" "}
              <strong className="text-emerald-400">
                {geminiKeys.filter((k) => k.status === "Active").length}
              </strong>{" "}
              / {geminiKeys.length}
            </span>
          </div>

          {activeGeminiKey ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500 text-slate-950 px-2 py-0.5 font-mono text-xs font-extrabold">
                    PRIORITY #{activeGeminiKey.priority}
                  </span>
                  <span className="text-base font-bold text-white">
                    {activeGeminiKey.alias}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 font-mono text-xs text-slate-300">
                  <span>
                    Masked:{" "}
                    <strong className="text-emerald-400">
                      {activeGeminiKey.maskedKey}
                    </strong>
                  </span>
                  <span>Requests: {activeGeminiKey.requestCount}</span>
                  <span>Latency: {activeGeminiKey.latencyMs}ms</span>
                  <span>Last Used: {activeGeminiKey.lastUsed}</span>
                </div>
              </div>
              <div className="shrink-0">
                {getStatusBadge(activeGeminiKey.status)}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 flex items-center justify-between gap-4 text-rose-300">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <strong>Pool Exhausted:</strong> Every key in the pool is
                  currently Rate Limited (429) or Quota Exhausted (403). Click
                  &ldquo;Reset Pool&rdquo; or add a new Gemini API key below.
                </div>
              </div>
              <button
                type="button"
                onClick={resetAllGeminiKeys}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shrink-0"
              >
                Reset All Keys
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{lastAiInsight}</span>
          </div>
        </div>

        {/* Add New Gemini API Key Form */}
        <form
          onSubmit={handleAddKey}
          className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Add New Gemini API Key</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Key Alias / Node Label
            </label>
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="e.g., Backup Scraper Node #6"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Google Gemini API Key
              </label>
              <input
                type="text"
                required
                value={rawKeyInput}
                onChange={(e) => setRawKeyInput(e.target.value)}
                placeholder="AIzaSyYourGeminiApiKeyX9"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Priority
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/15 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register Key in Pool</span>
          </button>
        </form>
      </div>

      {/* Gemini API Keys Pool Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Configured Gemini API Key Pool ({geminiKeys.length} Keys)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prioritize keys, test connection health, or manually toggle status
              to verify failover behavior
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Key Alias</th>
                <th className="py-3.5 px-4">Key Masked</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Used</th>
                <th className="py-3.5 px-4">Requests / Errors</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {sortedKeys.map((item, idx) => {
                const isCurrentActive = activeGeminiKey?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCurrentActive
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Priority & Reorder */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                            isCurrentActive
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          #{item.priority}
                        </span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => prioritizeGeminiKey(item.id, "up")}
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move Priority Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedKeys.length - 1}
                            onClick={() => prioritizeGeminiKey(item.id, "down")}
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move Priority Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Key Alias */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {item.alias}
                        </span>
                        {isCurrentActive && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Latency: {item.latencyMs}ms
                      </div>
                    </td>

                    {/* Key Masked */}
                    <td className="py-3.5 px-4 font-mono">
                      <code className="rounded bg-slate-950 px-2.5 py-1 text-xs text-blue-400 border border-slate-800">
                        {item.maskedKey}
                      </code>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Last Used */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {item.lastUsed}
                    </td>

                    {/* Requests / Errors */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-slate-200">
                        {item.requestCount.toLocaleString()} reqs
                      </span>
                      <span className="mx-1.5 text-slate-600">/</span>
                      <span
                        className={
                          item.errorCount > 0
                            ? "text-amber-400"
                            : "text-slate-500"
                        }
                      >
                        {item.errorCount} errs
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTestKey(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                          title="Test Connection & Mark Active"
                        >
                          <RefreshCw
                            className={`h-3 w-3 text-emerald-400 ${
                              testingKeyId === item.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>Test</span>
                        </button>

                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateKeyStatus(
                              item.id,
                              e.target.value as GeminiKeyStatus
                            )
                          }
                          aria-label={`Set status for ${item.alias}`}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Active">Set Active</option>
                          <option value="Rate Limited">Set 429 Limit</option>
                          <option value="Quota Exhausted">Set 403 Quota</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => deleteGeminiKey(item.id)}
                          className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-rose-500/20 hover:border-rose-500/40 p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Live Key Rotation Audit Log */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            <code className="text-blue-400">getValidGeminiKey()</code> Failover
            &amp; Rotation Telemetry Log
          </h3>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {rotationLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-950/70 px-3.5 py-2.5 font-mono text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                    log.statusCode === 429
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : log.statusCode === 403 || log.statusCode === 503
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  HTTP {log.statusCode}
                </span>
                <span className="text-slate-200 truncate">{log.detail}</span>
              </div>
              <span className="text-slate-500 text-[11px] shrink-0">
                {log.maskedKey}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
